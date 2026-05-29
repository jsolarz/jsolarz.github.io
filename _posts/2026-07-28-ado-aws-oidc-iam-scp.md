---
title: "AWS OIDC Azure DevOps: Trust Policies, IAM Roles, and SCP Landmines"
date: 2026-07-28
slug: ado-aws-oidc-iam-scp
excerpt: The upload role is easy on paper—issuer, subject, audience, two IAM actions. The failures are trust mismatches, bootstrap vs daily permissions, and org SCPs that beat AdministratorAccess.
author: Jonathan Solarz
categories: aws azure devops security iam
image: /img/blog/ado-aws-oidc-trust.jpg
series: hybrid-cicd-ado-aws
series_part: 2
scene: |
  Federated trust is a trap-filled corridor—OIDC from Azure DevOps into AWS roles, IAM policies tight enough, SCPs that can void your clever plan silently. One wrong thumbprint and the pipeline whispers success while nothing deploys.
  
  Read before you wire production keys; landmines are policy-shaped.

---

# AWS OIDC Azure DevOps: Trust Policies, IAM Roles, and SCP Landmines

Part 1 described **Pattern A**: ADO builds, uploads a zip, starts CodePipeline. The security story is **AWS OIDC Azure DevOps** federation—no access keys in variable groups, no “temporary” keys that never rotate.

This post is the wiring diagram: what the trust policy actually checks, how narrow the upload role should be, why bootstrap is a different principal, and why your green ADO job can still fail with `AccessDenied` on `cloudformation:DescribeStacks` even when someone has `AdministratorAccess`.

![OIDC trust flow from Azure DevOps service connection to IAM upload role](/img/blog/ado-aws-oidc-trust.png)

**Previous:** [Azure DevOps AWS integration (Pattern A)](https://ioni.solarz.me/journal/post.html?slug=azure-devops-aws-hybrid-cicd)

## In Brief

- **Issuer** is `https://vstoken.dev.azure.com/{orgGuid}`—the org GUID is not your tenant display name.
- **Subject** must match the service connection exactly (`sc://org/project/connection-name`); one typo = `AccessDenied` on `sts:AssumeRoleWithWebIdentity`.
- **Audience** is `api://AzureADTokenExchange` for workload identity federation.
- **Upload role** gets `s3:PutObject` on `source/*` plus `codepipeline:StartPipelineExecution`—nothing else for daily CI.
- **Bootstrap** deploys `RisPipeline-{env}` once; org **SCPs** often block ADO from ever doing that—plan an out-of-band deploy.

---

## The Token Path (ASCII)

```
  Azure DevOps pipeline
         │
         │ 1. Request OIDC token (service connection)
         ▼
  vstoken.dev.azure.com/{orgGuid}
         │
         │ 2. JWT claims: sub, aud, iss
         ▼
  sts:AssumeRoleWithWebIdentity
         │
         │ 3. Session credentials (1h max)
         ▼
  IAM role "ADO upload"
         │
         ├── s3:PutObject  →  {prefix}-pipeline-source/source/ris-source.zip
         └── codepipeline:StartPipelineExecution  →  ris-{env}-main
```

No `AWS_ACCESS_KEY_ID`. No `AWS_SECRET_ACCESS_KEY` in **Library**. If you see those for the upload path, you are on the wrong pattern.

Microsoft and AWS both document this path:

- [Federate into AWS from Azure DevOps using OpenID Connect](https://aws.amazon.com/blogs/modernizing-with-aws/how-to-federate-into-aws-from-azure-devops-using-openid-connect/)
- [Creating OpenID Connect (OIDC) identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)

---

## CDK: What We Actually Deploy

When `adoOidcOrgId` and `adoOidcSubject` are set in environment config, the pipeline stack provisions:

1. **OIDC provider** for `https://vstoken.dev.azure.com/{adoOidcOrgId}` with client id `api://AzureADTokenExchange` (or imports an existing provider ARN).
2. **Upload IAM role** with `WebIdentityPrincipal` and `StringEquals` on:
   - `{issuer}:sub` → your `adoOidcSubject`
   - `{issuer}:aud` → `api://AzureADTokenExchange`
3. **Inline policies**: `grantPut` on `source/*`, tagging/list helpers, `StartPipelineExecution` on the named pipeline.

Conceptually (not copy-paste production config):

```typescript
const issuer = `https://vstoken.dev.azure.com/${adoOidcOrgId}`;

new iam.Role(this, "AdoUploadRole", {
  assumedBy: new iam.WebIdentityPrincipal(providerArn, {
    StringEquals: {
      [`${issuer}:sub`]: adoOidcSubject,
      [`${issuer}:aud`]: "api://AzureADTokenExchange",
    },
  }),
  maxSessionDuration: Duration.hours(1),
});
```

Stack outputs should expose **`AdoUploadRoleArn`** for the ADO service connection—not the CodeBuild role, not the CDK deploy role.

### Provider already exists?

Landing zones sometimes pre-create the OIDC provider. Pass **`adoOidcProviderArn`** and import it instead of creating a duplicate—duplicate provider errors are annoying during env promotion.

---

## Configuring Azure DevOps

| Step | Where | What to copy |
|------|--------|--------------|
| Org GUID | Azure DevOps → Organization settings | Path segment after `vstoken.dev.azure.com/` |
| Subject | Service connection details | `sc://{org}/{project}/{connectionName}` |
| Role ARN | CloudFormation output `AdoUploadRoleArn` | Into **AWS** → **Workload identity federation** connection |
| Pipeline task | `AWSShellScript@1` or `AWSCLI@1` | `awsCredentials: ris-aws-oidc` (your connection name) |

**Common mistake:** Creating the service connection against a **bootstrap** role with `AdministratorAccess`, then never narrowing it. Daily uploads do not need CloudFormation.

**Second mistake:** Copying the subject from a *different* service connection in another project. The `sub` claim is per connection.

### Debugging `AccessDenied` on assume role

1. In a failing pipeline, print nothing secret—but confirm which **service connection** the task uses.
2. In IAM → Role → **Trust relationships**, compare `sub` to the connection’s documented subject.
3. Confirm **org GUID** in CDK matches Organization settings (not Entra tenant id unless they happen to align—verify the DevOps doc).
4. Check **aud** is exactly `api://AzureADTokenExchange`.
5. If the role was deployed in account A but the connection points at account B, you will chase ghosts for an hour.

CloudTrail `AssumeRoleWithWebIdentity` events show the rejected `sub` when you have permission to read them—worth it once.

---

## Two Roles, Two Lifetimes

| Role | Who assumes | When | Permissions (intent) |
|------|-------------|------|----------------------|
| **Bootstrap** | Human break-glass, Bitbucket custom pipeline, or one-off ADO stage | Once per env / after pipeline stack changes | `cdk bootstrap`, deploy `RisPipeline-{env}`, create OIDC provider |
| **Upload** | ADO on every `main` push | Daily | S3 put on source prefix + start pipeline |

```
  ┌─────────────────────┐         ┌─────────────────────┐
  │  Bootstrap principal │         │  ADO upload role     │
  │  (broad, rare)       │         │  (narrow, daily)     │
  └──────────┬──────────┘         └──────────┬──────────┘
             │                               │
             ▼                               ▼
     cdk deploy RisPipeline-*        s3 cp + start-pipeline
     creates buckets, OIDC,          never touches VPC,
     CodePipeline, upload role       ECS, or Aurora
```

After bootstrap, **delete or disable** bootstrap credentials from routine pipelines. If ADO still has a path to `cdk deploy` Application on every commit, you have not finished the hybrid split—see [part 1](https://ioni.solarz.me/journal/post.html?slug=azure-devops-aws-hybrid-cicd).

---

## SCP Landmines (Why Bootstrap Fails in ADO)

Organization **Service Control Policies** apply to every principal in the account unless exempted. They win over identity-based `AdministratorAccess`.

Typical **explicit denies** that block `cdk deploy RisPipeline-production` from an ADO bootstrap role:

| API pattern | Why CDK cares |
|-------------|----------------|
| `cloudformation:DescribeStacks` on `CDKToolkit/*` | Synth/deploy reads bootstrap stack |
| `ssm:GetParameter` on `/cdk-bootstrap/hnb659fds/version` | Version check before deploy |
| `sts:AssumeRole` on `cdk-hnb659fds-*-role-*` | CDK asset publishing and deploy roles |

**Symptom:** ADO bootstrap stage fails with SCP name in the error (`with an explicit deny in a service control policy`). Same human with admin console access might still deploy from a **different** principal (e.g. SSO break-glass not in the denied OU).

**Operational playbook:**

1. Deploy `RisPipeline-{env}` **once** from a principal the SCP allows (security-approved workstation, deployment account, or org exception).
2. Record outputs: source bucket, upload role ARN, pipeline name.
3. Wire ADO **upload-only** connection to the upload role.
4. Stop trying to bootstrap from ADO until IAM/Cloud Center exempts a dedicated bootstrap role.

This is not a failure of OIDC—it is **governance doing its job**. The hybrid pattern exists partly so daily CI does not need those permissions at all.

---

## S3 Upload Without Pipeline Start

Assume role succeeds; `aws s3 cp` succeeds; nothing runs in CodePipeline.

**Check the upload role policy**, not OIDC:

```json
{
  "Effect": "Allow",
  "Action": "codepipeline:StartPipelineExecution",
  "Resource": "arn:aws:codepipeline:eu-west-1:ACCOUNT:ris-production-main"
}
```

Pipeline name must match `ris-{env}-main` for the selected `risEnv` parameter. Region on the CLI must match the pipeline’s region.

When `adoOidc*` is configured, **disable** S3→EventBridge auto-start for the same bucket—ADO calls `start-pipeline-execution` explicitly. Two triggers = duplicate executions and self-mutation races.

---

## EventBridge vs Explicit Start (IAM Angle)

| Trigger | IAM on upload role | Double-run risk |
|---------|-------------------|-----------------|
| EventBridge on `Object Created` | Put only | Low if ADO does not also start |
| ADO `start-pipeline-execution` | Put + Start | Low if EventBridge disabled |
| **Both** | Put + Start + EventBridge | **High** — two executions per zip |

CDK can gate EventBridge creation on `!config.adoOidcOrgId`. Treat that as infrastructure-as-contract: the same zip should not enter the pipeline twice.

---

## Security Review Checklist

- [ ] Upload role trust uses `StringEquals` on `sub` and `aud` (not wildcards on `sub`).
- [ ] Session duration ≤ 1 hour; no unused `sts:AssumeRole` on upload role for humans.
- [ ] S3 scope is prefix `source/*`, not entire account.
- [ ] No `kms:Decrypt` on production CMKs unless upload encrypts with CMK (usually SSE-S3 is enough).
- [ ] CloudTrail alerts on `AssumeRoleWithWebIdentity` to upload role from unexpected `sub` (optional, nice in regulated industries).
- [ ] Bootstrap role not referenced in daily `azure-pipelines.yml`.

---

## What’s Next

Part 3 covers **parallel CI**, **merged Cobertura**, and **path filters**—the ADO side of hybrid delivery so PR signal stays fast without lying about coverage.

**Series:** [Part 1 — Pattern A](https://ioni.solarz.me/journal/post.html?slug=azure-devops-aws-hybrid-cicd) · **Part 2** (this) · [Part 3 — Parallel CI](https://ioni.solarz.me/journal/post.html?slug=ado-aws-parallel-ci-coverage)

**Related:** [CloudFormation stack layers](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-layered-stacks-pipeline) · [AWS CDK deployment post-mortem](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-complex-deployment-postmortem)

---

*Fighting OIDC `sub` mismatches or SCP denies on CDK bootstrap? [Connect with me](/contact.html).*
