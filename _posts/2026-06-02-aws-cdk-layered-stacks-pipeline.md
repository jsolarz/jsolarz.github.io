---
title: "CloudFormation Stack Layers: Foundation, Services, Application, and Pipeline Discipline"
date: 2026-06-02
slug: aws-cdk-layered-stacks-pipeline
excerpt: How to split CDK into Foundation, Services, and Application stacks—with SSM handoffs, context gates, and a pipeline that builds images before ECS ever deploys.
author: Jonathan Solarz
categories: aws cdk architecture devops
image: /img/blog/aws-cdk-ssm-handoff.jpg
series: aws-cdk-complex-deployments
series_part: 2
---

# CloudFormation Stack Layers: Foundation, Services, Application, and Pipeline Discipline

Part 1 of this series was the post-mortem—the red stack events and the “simple” services that refused to cooperate. Part 2 is the blueprint: how to **split CloudFormation stack layers** so deploy order, blast radius, and CI stages match the architecture diagram instead of fighting it.

We used a research information system as the reference shape: document upload, malware scan, Bedrock extraction, Aurora metadata, semantic search. No customer names here. The pattern travels.

![Three CDK layers with SSM handoffs between Foundation, Services, and Application](/img/blog/aws-cdk-ssm-handoff.png)

## In Brief

**CloudFormation stack layers** work when each stack has one job and a written contract between them.

- **Foundation → Services → Application** mirrors landing-zone thinking: network first, shared platform second, app code last.
- **SSM Parameter Store** carries handoffs—no `Fn.importValue`, no cross-stack CDK references between layers.
- **Pipeline stages** enforce order: synth, Foundation (optional parallel with tests), Services, **Docker → ECR**, migrations, then Application with `imageTag`.
- **Pipeline-only deploys** to shared accounts prevent console heroics from becoming production drift.
- **Context gates** (`deployLayer1|2|3`) keep `cdk synth` honest locally and in CodeBuild.

---

## The Layer Cake (Why Three Stacks)

One mega-template is seductive. One `cdk deploy`. Done.

Until it isn’t. A tag change replaces your OpenSearch collection while you only meant to bump a Lambda timeout. A load balancer scheme drift blocks the entire release. **Layered CloudFormation** trades a little orchestration for rollback surfaces you can reason about.

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │  L1 Foundation          Rare changes · network · KMS · GuardDuty    │
  │       │ writes SSM /ris/{env}/vpc-id, subnet lists, SG ids          │
  │       ▼                                                             │
  │  L2 Services            Platform · Aurora · ALB · S3 · AOSS · ECR    │
  │       │ writes SSM cluster, listener, buckets, OpenSearch endpoint   │
  │       ▼                                                             │
  │  L3 Application         ECS · Step Functions · EventBridge · Lambdas  │
  │                         reads SSM · needs ECR imageTag              │
  └─────────────────────────────────────────────────────────────────────┘

  Delivery (not a fourth stack, but a fourth discipline):

       CodePipeline ──► npm ci ──► cdk deploy L1/L2 ──► docker push ──► migrate ──► deploy L3
```

| Layer | Owns | Changes when |
|-------|------|--------------|
| Foundation | VPC, subnets, VPC endpoints, baseline SGs, KMS | Quarters, not sprints |
| Services | Aurora, ALB, CloudFront, WAF, S3, ECR, OpenSearch Serverless, Bedrock KB | Platform upgrades |
| Application | Fargate services, ingestion Lambdas, Step Functions, rules | Every feature push |

Cold start order matters. L2 requires L1 SSM. L3 requires L2 SSM, ECR images, and migrations if the schema moved.

## The SSM Contract (What Each Layer Promises)

Think of SSM as a narrow API between stacks—not a junk drawer.

**Foundation writes:**

| Parameter family | Examples | Consumers |
|------------------|----------|-----------|
| Network | `vpc-id`, `vpc-cidr`, `availability-zones`, subnet id lists | Services, Application |
| Security | `service-sg-id`, `db-sg-id`, `kms-key-arn` | Services, Application |
| Identity of place | Comma-separated subnet lists for `Fn.split` / `Fn.select` | Services (RDS, VPC-attached Lambdas) |

**Services writes:**

| Parameter family | Examples | Consumers |
|------------------|----------|-----------|
| Compute platform | `cluster-arn`, Service Connect namespace, ECR URIs | Application |
| Edge | ALB listener ARN, `alb-sg-id`, CloudFront distribution id | Application |
| Data plane | DB secret ARN, bucket names/ARNs, OpenSearch endpoint | Application |
| Ops | `migrate-task-family`, `ecr-migrate-uri` | Pipeline migrate step |

**Application reads.** It should not write back into Services parameters except for deliberate extension points you document.

```
  /ris/{env}/vpc-id                    ──► Services imports VPC
  /ris/{env}/private-subnet-ids        ──► Fn.split → subnet objects
  /ris/{env}/cluster-arn              ──► Application task definitions
  /ris/{env}/alb-listener-arn          ──► Listener rules
  /ris/{env}/opensearch-endpoint       ──► Backend env (search)
  /ris/{env}/upload-bucket-name        ──► Lambdas + Step Functions
```

### Greenfield vs brownfield VPC import

Two paths. Pick one per environment and encode it in config—not tribal knowledge.

| Mode | VPC source | ALB pattern | Risk |
|------|------------|-------------|------|
| **Greenfield** | `Vpc.fromVpcAttributes` + SSM lists | Internet-facing ALB + CloudFront custom origin | Subnet list typos in SSM |
| **Existing VPC** | `Vpc.fromLookup` | Internal ALB + CloudFront VPC Origin | Scheme drift vs live ALB |

Brownfield is where **CloudFormation stack layers** hurt most: synth assumes one topology; AWS remembers another.

**Lesson:** Name the mode in `config/{env}.ts`. Branch ALB scheme, subnet placement, and CloudFront origin type on that flag. Never “fix forward” in the console.

## Context Gates: One Repo, Three Templates

CDK context flags keep synth fast and CI predictable:

| Context | Stack synthesized |
|---------|-------------------|
| `-c env=sandbox` | Pipeline only |
| `-c deployLayer1=true` | + Foundation |
| `-c deployLayer2=true` | + Services |
| `-c deployLayer3=true -c imageTag=abc1234` | + Application |

Local workflow mirrors CI:

```bash
npm ci
npx cdk synth -c env=sandbox -c deployLayer2=true
npx cdk diff  -c env=sandbox -c deployLayer2=true
```

Use **`valueForStringParameter`** for handoff values. They resolve at deploy time via CloudFormation dynamic references. Avoid **`valueFromLookup`** for `/ris/{env}/…` paths in pipeline builds—it introduces synth-time AWS calls you do not want in CodeBuild.

## Pipeline Stages (Delivery Is Layer 4)

The pipeline is not a fourth CloudFormation stack in the same sense—but it is a fourth **concern**. Treat it that way.

```
  Wave 0   Synth (self-mutation, npm ci, cdk synth)
  Wave 1   [parallel] Unit tests  |  Deploy Foundation
  Wave 2   Deploy Services (L2) — needs L1 SSM
  Wave 3   BuildAndPushImages → ECR (backend, api, client, migrate)
  Wave 4   RunMigrations (ECS RunTask, private subnets, same SG as apps)
  Wave 5   Deploy Application (L3) — needs L2 SSM + imageTag
```

![Pipeline waves — build images and migrate before Application deploy](/img/blog/aws-cdk-pipeline-waves.png)

### Why images before Application

ECS task definitions reference ECR digests or tags. Deploy Application with a missing image and CloudFormation will cheerfully fail—or worse, leave a service stuck in `IN_PROGRESS` while tasks cannot pull.

**Rule:** Docker build steps complete before `deployLayer3=true`. Pass `-c imageTag=<short-sha>` from the same build that pushed the image.

### Why migrations sit between Services and Application

Schema changes belong to the platform release, not to “whoever SSH’d first.” An ECS Fargate one-off task using the **migrate** image and Aurora credentials from Secrets Manager keeps DDL out of app startup and out of human laptops.

Connection strings need TLS pragmatism in private VPCs (`SslMode=Require;TrustServerCertificate=true` when you control the chain). Document the pattern once in the runbook.

## Pipeline-Only Deploys (Non-Negotiable for Shared Environments)

Manual `cdk deploy` to sandbox or production is a loan you repay with interest.

| Manual deploy | What breaks |
|---------------|-------------|
| Hotfix in console | Next pipeline overwrites or fights drift |
| Local deploy with wrong context | Missing `imageTag`, wrong layer flag |
| Skipping migrate step | App boots against old schema |
| Deploy L3 before L2 finishes | SSM parameters absent → obscure CFN errors |

**Discipline:** Fixes land in CDK, pipeline YAML, or app code. Merge to main. Let CI replay the graph.

Emergency break-glass? Fine. Still open a PR the same hour.

## Blast Radius by Layer

When something fails, the layer tells you how loud the rollback will be.

| Layer | Typical failure | Blast radius |
|-------|-----------------|--------------|
| Foundation | VPC endpoint, KMS policy | Everything downstream |
| Services | Aurora, ALB replacement, AOSS collection | Apps cannot deploy; data may be fine |
| Application | Task def, Step Functions, EventBridge | Feature-level; platform stays up |
| Pipeline | `npm ci`, Docker build | No deploy at all—often the cheapest failure |

Splitting stacks is not bureaucracy. It is how you **stop one ALB scheme change from blocking a Lambda fix**.

## Anti-Patterns for Layered IaC

- **Cross-stack exports (`Fn.importValue`)** — coupling with rename pain. SSM paths version better.
- **CDK cross-stack references between layers** — tempting; avoid for the same reason.
- **One mega-stack “because deploy is simpler”** — it is, until it isn’t.
- **Writing handoff params from Application back to Services** — hidden circular dependencies.
- **Different context flags locally vs CI** — “works on my machine” for infrastructure.

## Checklist Before You Add Layer 2 to a Greenfield Account

1. Bootstrap CDK in the account/region.
2. Deploy pipeline stack once (or use your bootstrap job).
3. Deploy Foundation; verify SSM parameters in Parameter Store.
4. Deploy Services; verify ECR repos exist (even if empty).
5. Build and push images; run migrations if needed.
6. Deploy Application with matching `imageTag`.
7. Smoke test: health check → upload path → pipeline completion event.

## Series Navigation

| Part | Topic |
|------|--------|
| [1 — Post-mortem](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-complex-deployment-postmortem) | When simple services break the stack |
| **2 (this post)** | **CloudFormation stack layers** + pipeline |
| [3 — IaC checklists](https://ioni.solarz.me/blog/post.html?slug=bedrock-opensearch-guardduty-iac-checklist) | Bedrock, OpenSearch Serverless, GuardDuty |
| [4 — End-to-end wiring](https://ioni.solarz.me/blog/post.html?slug=document-pipeline-event-driven-deploy) | Step Functions, EventBridge, UI events |

**Related:** [AWS FinOps: Cost Observability](https://ioni.solarz.me/blog/post.html?slug=aws-finops-cost-observability-complex-workload) — same architecture shape, different lens.

---

**Further reading**

- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [CDK context values](https://docs.aws.amazon.com/cdk/v2/guide/context.html)
- [AWS CDK Pipelines](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html)

---

*Feel free to share your thoughts by emailing me or reaching out on social media.*
