---
title: "Azure DevOps AWS Integration: Hybrid CI/CD for a Document Platform"
date: 2026-07-21
slug: azure-devops-aws-hybrid-cicd
excerpt: How to connect Azure DevOps to AWS without giving ADO the keys to the kingdom—OIDC upload, S3 handoff, CodePipeline deploy, and the failures we actually hit.
author: Jonathan Solarz
categories: aws azure devops architecture
image: /img/blog/ado-aws-hybrid-cicd.jpg
series: hybrid-cicd-ado-aws
series_part: 1
---

# Azure DevOps AWS Integration: Hybrid CI/CD for a Document Platform

Your org standardized on **Azure DevOps** for Git and PR checks. Your platform runs on **AWS**: Fargate, Step Functions, Bedrock extraction, Aurora, OpenSearch Serverless. Someone will ask you to “just run `cdk deploy` from the pipeline.” That works until it doesn’t—SCPs, blast radius, duplicate test minutes, and a green ADO run that never starts CodePipeline.

**Azure DevOps AWS integration** done well is a contract: ADO owns **build quality** and **source packaging**; AWS owns **infrastructure mutation** in a pipeline you can audit. This post is Pattern A from a real document-management and ingestion platform—anonymized, no customer names, plenty of scars.

![Hybrid CI/CD: Azure DevOps build and test, S3 source handoff, AWS CodePipeline deploy waves](/img/blog/ado-aws-hybrid-cicd.png)

## In Brief

- **Split responsibilities**: ADO runs `dotnet test`, client unit tests, and uploads a source zip; **CodePipeline** runs CDK synth, layered stack deploys, Docker push, migrations, and ECS.
- **Authenticate with OIDC**, not access keys—an ADO service connection assumes a narrow IAM role (`s3:PutObject` + `codepipeline:StartPipelineExecution`).
- **Trigger explicitly** after upload when ADO is the sole entry point; skip S3→EventBridge for the same path or you double-run pipelines.
- **Bootstrap once** with a principal that can deploy `RisPipeline-{env}`; daily ADO jobs should not need `AdministratorAccess` or org SCPs will surprise you.
- **Path filters** on `src/**` and `infra/**` so doc-only commits do not ship to production.

---

## Why Hybrid at All?

The platform shape: researchers upload PDFs, objects land in S3, GuardDuty scans, Step Functions orchestrate Bedrock extraction, metadata lands in PostgreSQL, vectors in OpenSearch, the SPA waits on server-sent events when processing completes. That is a lot of moving parts in **one AWS account** with landing-zone guardrails.

| Concern | All-in-ADO | All-in-AWS | Hybrid (Pattern A) |
|---------|------------|------------|---------------------|
| PR feedback speed | Excellent | Depends on CodeBuild | Excellent (ADO parallel jobs) |
| Deploy parity with prod | Drift risk if ADO deploys differently | Single engine | Same CodePipeline every time |
| IAM blast radius | ADO agent needs broad AWS | Scoped to pipeline roles | ADO: upload + start only |
| Org SCPs / CDK bootstrap | Often blocked | Native | Bootstrap out-of-band; ADO thin |

Hybrid is not “more complex” for sport. It is **who is allowed to change what**—and how often you want to explain an ADO service connection that can replace your VPC.

---

## Pattern A: The Flow

```
  Developer                    Azure DevOps                         AWS
  ─────────                    ────────────                         ───

  git push main  ──►  ┌─────────────────────────────────────┐
                      │  CI stage (parallel)                 │
                      │   • .NET restore/build/test          │
                      │   • Web client build + Vitest        │
                      │   • Package ris-source.zip           │
                      └──────────────┬──────────────────────┘
                                     │ OIDC (no static keys)
                                     ▼
                      ┌─────────────────────────────────────┐
                      │  Upload stage                        │
                      │   PutObject → pipeline source bucket │
                      │   StartPipelineExecution           │
                      └──────────────┬──────────────────────┘
                                     │
                                     ▼
                      ┌─────────────────────────────────────┐
                      │  CodePipeline ris-{env}-main         │
                      │   Synth → L1 Foundation → Services   │
                      │   Docker → ECR → migrate → App (ECS) │
                      └─────────────────────────────────────┘
```

ADO never calls `cdk deploy` for Foundation, Services, or Application on every push. AWS CodePipeline already encodes that graph—see the [layered stacks post](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-layered-stacks-pipeline) for why those layers exist.

### What goes in the zip?

A filtered archive: application source, CDK app, Dockerfiles, pipeline scripts—not `.git` metadata, not local `node_modules`. One object key per successful build (e.g. `source/ris-source.zip`) keeps EventBridge rules and human debugging simple.

### What stays in ADO?

- **Parallel jobs** for backend and web client (cache NuGet and npm separately).
- **Test publishing** (TRX, JUnit) so PRs fail fast.
- **Optional**: merged Cobertura via ReportGenerator in a small downstream job—one coverage tab instead of two half-truths.
- **Path triggers** so markdown-only commits do not upload or deploy.

---

## OIDC: The Only Acceptable Front Door

Long-lived `AWS_ACCESS_KEY_ID` in an ADO variable group is a ticket to rotation theater. Use **workload identity federation**:

1. CDK creates an IAM OIDC provider for `https://vstoken.dev.azure.com/{orgId}` and an **upload role** trust policy keyed on `adoOidcSubject` (the service connection subject, typically `sc://{org}/{project}/{connection}`).
2. ADO **AWS service connection** → **Workload identity federation** → role ARN from stack output.
3. Pipeline YAML uses that connection for the upload stage only.

Microsoft documents the flow in [Federate into AWS from Azure DevOps using OpenID Connect](https://aws.amazon.com/blogs/modernizing-with-aws/how-to-federate-into-aws-from-azure-devops-using-openid-connect/). AWS’s [IAM OIDC identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) cover the trust side.

**Least privilege on the upload role:**

| Permission | Why |
|------------|-----|
| `s3:PutObject` on `{prefix}-pipeline-source/source/*` | Drop the zip |
| `codepipeline:StartPipelineExecution` on `ris-{env}-main` | Start deploy after upload |

Nothing else for daily CI. Bootstrap is a different role, used once.

---

## Triggering CodePipeline: Explicit Beats Magic

Two ways to start the pipeline after S3 upload:

1. **S3 → EventBridge → CodePipeline** (good when *any* uploader should deploy).
2. **`aws codepipeline start-pipeline-execution`** from ADO (good when ADO is the *only* uploader you trust).

We wired **both** early. Result: duplicate runs, racey self-mutations, confused “which execution is canonical?”

**Fix:** When `adoOidc*` is configured in CDK, **disable** EventBridge auto-trigger for that bucket. ADO calls `start-pipeline-execution` immediately after a successful `PutObject`. One front door.

If upload succeeds but nothing runs, check the upload role policy before you blame EventBridge—this failure mode is common enough to deserve a runbook line.

---

## Issues We Hit (and Fixes)

![Common hybrid CI/CD failures and fixes](/img/blog/ado-aws-issues-matrix.png)

### Upload works; pipeline never starts

**Symptom:** Green ADO, fresh zip in S3, empty CodePipeline history.

**Causes:**

- Upload role missing `codepipeline:StartPipelineExecution`.
- Wrong pipeline name (`ris-production-main` vs `ris-sandbox-main`).
- Assuming EventBridge will fire when you disabled it for ADO.

**Fix:** Add IAM permission; redeploy pipeline stack; call start explicitly in YAML.

### ADO cannot `cdk deploy` the pipeline stack

**Symptom:** Bootstrap stage fails with SCP explicit deny on `cloudformation:DescribeStacks`, `ssm:GetParameter` for CDK bootstrap version, or `sts:AssumeRole` on `cdk-hnb659fds-*`.

**Reality:** Organization SCPs beat `AdministratorAccess` on the ADO bootstrap principal.

**Fix:** Deploy `RisPipeline-{env}` once from a principal outside the deny path (break-glass account, local admin, or landing-zone exception). After that, ADO only uploads and starts—no CDK in ADO for routine work.

### `cdk synth` fails: “Pipeline not created yet”

**Symptom:** CodeBuild synth wave dies accessing `pipeline.pipeline` too early in CDK Pipelines.

**Fix:** Finish defining waves, call `buildPipeline()`, then adjust the L1 `AWS::CodePipeline` (V2 + queued execution mode). Do not read `.pipeline` right after the `CodePipeline` construct constructor.

### CloudWatch metric filter rejects `/`

**Symptom:** Application stack fails creating `AWS::Logs::MetricFilter`—invalid character `/` in term `upload/complete`.

**Fix:** Metric filter patterns are space-delimited unless quoted. Use `[503, "upload/complete"]` or a regex pattern with `%` delimiters per [Filter pattern syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html)—not a bare path segment.

### Coverage theater at 2%

**Symptom:** ADO shows ~3% line coverage; only web client assemblies; backend Cobertura missing.

**Causes:** Two separate `PublishCodeCoverageResults` tasks; Vitest instrumenting every shadcn page and route.

**Fix:** Narrow Vitest `coverage.include` to code you unit-test; Coverlet `Include`/`Exclude` for product assemblies; one merge job + single publish.

---

## Best Practices Checklist

**Identity**

- [ ] OIDC upload role only for CI upload stage.
- [ ] Bootstrap role separate, used once per env.
- [ ] No static AWS keys in variable groups.

**Pipeline contract**

- [ ] ADO: build, test, zip, upload, start pipeline.
- [ ] AWS: synth, layered deploys, images, migrate, application.
- [ ] Document object key and pipeline name per environment.

**Triggers**

- [ ] One trigger path per environment (ADO explicit *or* EventBridge, not both).
- [ ] Path filters on source and infra.

**Operability**

- [ ] Stack outputs: bucket name, upload role ARN, pipeline name.
- [ ] Smoke script after Application deploy (upload → complete → UI event).
- [ ] Runbook entry for `start-pipeline-execution` when automation is blocked.

**Governance**

- [ ] Align with hybrid ADR: why AWS still runs layer deploys ([example framing](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-complex-deployment-postmortem)).
- [ ] SCP review before promising “ADO will bootstrap production.”

---

## How This Sits Next to the CDK Series

If you are building the same class of system:

| Topic | Read |
|-------|------|
| Why deploys hurt | [AWS CDK deployment post-mortem](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-complex-deployment-postmortem) |
| Foundation / Services / Application | [CloudFormation stack layers](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-layered-stacks-pipeline) |
| Bedrock + OpenSearch IaC | [Bedrock Knowledge Base IaC checklist](https://ioni.solarz.me/blog/post.html?slug=bedrock-opensearch-guardduty-iac-checklist) |
| Ingestion wiring | [Document pipeline event-driven deploy](https://ioni.solarz.me/blog/post.html?slug=document-pipeline-event-driven-deploy) |

This post is the **fifth discipline**: *who runs CI* versus *who runs CDK deploy* when Git lives in Azure DevOps.

---

## Series

| Part | Post |
|------|------|
| **1** (this) | Azure DevOps AWS integration — Pattern A |
| **2** | [AWS OIDC Azure DevOps: trust, IAM, SCP](https://ioni.solarz.me/blog/post.html?slug=ado-aws-oidc-iam-scp) |
| **3** | [Parallel CI, coverage, guardrails](https://ioni.solarz.me/blog/post.html?slug=ado-aws-parallel-ci-coverage) |

---

## Conclusion

**Azure DevOps AWS integration** is not a single plugin—it is a **split contract** with narrow IAM, an explicit pipeline start, and AWS doing what AWS is good at: repeatable, auditable infrastructure waves. The document platform details (Bedrock, ingestion, semantic search) do not change that contract; they make a failed handoff visible when uploads succeed but extraction never updates the UI.

Start with Pattern A. Bootstrap the pipeline stack once. Wire OIDC upload. Kill duplicate triggers. Then tune coverage and metric filters so green dashboards mean something.

---

*Building hybrid CI/CD or fighting SCP denies on bootstrap? [Connect with me](/contact.html)—happy to compare notes.*

**Related:** [CloudFormation stack layers](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-layered-stacks-pipeline) · [AWS pipeline deployment (ingestion)](https://ioni.solarz.me/blog/post.html?slug=document-pipeline-event-driven-deploy) · [AWS CDK deployment post-mortem](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-complex-deployment-postmortem)
