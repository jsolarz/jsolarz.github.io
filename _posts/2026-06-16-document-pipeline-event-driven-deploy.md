---
title: "AWS Pipeline Deployment: Wiring Document Ingestion End to End"
date: 2026-06-16
slug: document-pipeline-event-driven-deploy
excerpt: Step Functions, GuardDuty scan events, EventBridge API Destinations, and the port migration that broke health checks—how to deploy a document pipeline users can actually finish.
author: Jonathan Solarz
categories: aws cdk architecture serverless
image: /img/blog/document-pipeline-eventbridge.jpg
series: aws-cdk-complex-deployments
series_part: 4
---

# AWS Pipeline Deployment: Wiring Document Ingestion End to End

Infrastructure can go green while the product still feels broken. Uploads stall. The UI spinner never stops. Step Functions show **Succeeded**—but nobody told the browser.

**AWS pipeline deployment** is not only CloudFormation turning green. It is the full path from object landing in S3 to a **pipeline completion event** the client can trust. Part 4 closes the series on that wiring: malware scan handoff, orchestration, EventBridge, and the unglamorous port alignment that silently killed health checks.

![Document pipeline completion via Step Functions and EventBridge API Destination](/img/blog/document-pipeline-eventbridge.png)

## In Brief

Parts [1](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-complex-deployment-postmortem)–[3](https://ioni.solarz.me/blog/post.html?slug=bedrock-opensearch-guardduty-iac-checklist) covered failures, layers, and IaC checklists. This post is the **happy path you still have to encode**.

- **GuardDuty → scan-mover → ready bucket → SQS** is the front half; test it before Step Functions.
- **Step Functions SUCCEEDED** should emit a **domain event**, not an SQS hack left from an earlier design.
- **EventBridge API Destination** can POST completion to your Web API with an API key—no Lambda shim required.
- **Service Connect** and container ports must match task definitions, ALB rules, *and* CDK defaults—or ECS circuit breakers roll back “successful” deploys.
- **Smoke test** one document after every Application deploy: upload → scan → extract → UI `pipeline:completed`.

---

## The End-to-End Shape

Generic research information system. Researchers upload PDFs. The platform scans, extracts with Bedrock, persists metadata, indexes for search, and notifies the SPA when processing finishes.

```
  ┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
  │ Browser  │───►│ Upload API  │───►│ S3 (scan)    │───►│ GuardDuty scan  │
  └──────────┘    └─────────────┘    └──────────────┘    └────────┬────────┘
       ▲                                                            │
       │                     EventBridge (object tagged / ready)   │
       │                            │                              │
       │                            ▼                              │
       │                   scan-mover Lambda                       │
       │                            │                              │
       │                            ▼                              │
       │                   S3 (ready) ──► SQS ──► Step Functions    │
       │                                              │             │
       │                         Bedrock extract + Aurora + index   │
       │                                              │             │
       │   SSE pipeline:completed ◄── Web API ◄── EventBridge       │
       │         ▲                      ▲              │             │
       │         │                      │              ▼             │
       └─────────┴──────────────────────┴──── API Destination POST  │
                                         /api/pipeline/result        │
```

Each arrow is a deploy surface. Miss one, and the architecture diagram still looks fine.

---

## Front Half: Scan Bucket to Ingestion Queue

### S3 EventBridge integration

Turn on **EventBridge notifications** for the upload bucket in IaC. GuardDuty Malware Protection and your scan-mover should react to the same event fabric—not ad hoc polling.

### scan-mover Lambda

When GuardDuty marks an object clean (or your policy says move on), a small Lambda copies or moves to the **ready** prefix/bucket and enqueues work. Keep it in the **Application** layer; the bucket ARNs come from SSM written by Services.

Test this Lambda in isolation before you debug Step Functions. If nothing reaches SQS, the state machine is a red herring.

---

## Orchestration: Step Functions as the Spine

Step Functions coordinate extraction, persistence, and optional indexing. They are also the **completion signal** anchor.

Design choices that survive **AWS pipeline deployment**:

| Choice | Prefer | Avoid |
|--------|--------|-------|
| Completion signal | EventBridge on `SUCCEEDED` | Orphan SQS queue + Lambda from old design |
| Payload | S3 key + document id in execution input | Giant state JSON in the execution history |
| Idempotency | Stable document id in Aurora | Re-run creates duplicate rows |
| Failure path | `FAILED` → DLQ or alarm | Silent failure with green UI |

When the execution finishes, the platform should emit something the Web API can map to **`pipeline:completed`** on Server-Sent Events—not a polling loop that hammers `/status` forever.

---

## EventBridge API Destination (Replace the Shim)

An older pattern: Step Functions → SQS → Lambda → HTTP. It works. It is also three more failure modes.

The cleaner pattern we moved toward:

```
  Step Functions (SUCCEEDED)
           │
           ▼
  EventBridge rule  {prefix}-sf-completed
           │
           ▼
  API Destination   {prefix}-pipeline-result
  (Connection + API key)
           │
           ▼
  POST https://{cloudfront}/api/pipeline/result
           │
           ▼
  Web API  →  gRPC ProcessPipelineResult  →  SSE to browser
```

**Connection** holds auth (API key in Secrets Manager). **API Destination** maps to your public URL. **Rule** filters on Step Functions completion with the right detail-type.

CDK concerns:

- IAM for EventBridge to invoke the destination
- Rate limits and retry policy on the destination (API Gateway and CloudFront can throttle sloppy replays)
- Web API route must be **idempotent** on duplicate delivery

Delete the legacy notify Lambda and orphan queues when you cut over. Otherwise the next engineer deploys both paths and wonders which one lied.

---

## Port Migration: When “Deploy Succeeded” Still Breaks Health

ECS circuit breakers exist for a reason. We changed gRPC/HTTP ports in container definitions—908x on the backend, matching Service Connect names—but left health check paths or target group ports pointing at old **8080** semantics.

Symptoms:

- CloudFormation **CREATE_COMPLETE**
- Service events: tasks stopped, **unhealthy target**
- ALB returns 502 while you celebrate the green stack

**Lesson for AWS pipeline deployment:** port changes ride in **one PR** across Dockerfile `EXPOSE`, app `launchSettings` / Kestrel URLs, ECS task port mappings, Service Connect port names, ALB target groups, and health check URLs.

```
  Single source of truth (pick one):

    CDK task definition containerPort  ──►  app listens on same port
    Service Connect discovery name     ──►  http://dotnet-backend-grpc:9082
    ALB health check                   ──►  hits Web API port that answers /health
```

Diff task definitions in the console after deploy. Numbers should rhyme.

---

## OpenSearch Endpoint in the Application Layer

Semantic search needs the collection endpoint in the backend task environment. Services writes **`opensearch-endpoint`** (or equivalent) to SSM; Application reads it into the Fargate task def.

Forget this wire and the app boots fine—search fails at runtime with opaque 403/connection errors. Add it to the Application deploy checklist alongside `imageTag`.

---

## Database Migrations vs Running Tasks

Schema columns referenced by new code must exist **before** new tasks serve traffic. That is why the pipeline runs **RunMigrations** between image push and Application deploy.

If `Documents.Version` (or whatever your migration added) is missing, the pipeline may still “complete” while user uploads 500. Correlate ECS logs with migration task exit codes.

---

## Post-Deploy Smoke Test (Non-Optional)

Script or runbook—five minutes, every Application deploy:

1. Hit **health** through CloudFront.
2. Upload a small test PDF.
3. Confirm GuardDuty scan → object in ready path (CloudWatch Logs for scan-mover).
4. Confirm Step Functions execution **Succeeded**.
5. Confirm Web API received **pipeline/result** (access logs or structured log line).
6. Confirm UI shows completion (or SSE event in browser devtools).

```
  Smoke test flow (ASCII timeline):

  T+0s   PUT upload
  T+30s  GuardDuty tag / move
  T+45s  SQS message visible
  T+2m   Step Functions SUCCEEDED
  T+2m   EventBridge → POST pipeline/result
  T+2m   UI pipeline:completed
```

If step 5 fails but step 4 passes, you have an EventBridge or API Destination problem—not an extraction problem. That split saves hours.

---

## Legacy Cleanup Checklist

When refactoring event paths:

- [ ] Remove old SQS queue subscriptions
- [ ] Delete unused Lambda (notify-backend pattern)
- [ ] Remove IAM roles policies referencing deleted queues
- [ ] Update CDK so synth does not recreate removed resources on next deploy
- [ ] Search repo for hardcoded queue URLs

---

## Series Navigation (Complete)

| Part | Topic |
|------|--------|
| [1 — Post-mortem](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-complex-deployment-postmortem) | When simple services break the stack |
| [2 — Layer cake](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-layered-stacks-pipeline) | CloudFormation stack layers + pipeline |
| [3 — IaC checklists](https://ioni.solarz.me/blog/post.html?slug=bedrock-opensearch-guardduty-iac-checklist) | Bedrock, OpenSearch Serverless, GuardDuty |
| **4 (this post)** | **AWS pipeline deployment** end to end |

**Related FinOps track:** [Bedrock and Pipeline Cost Observability](https://ioni.solarz.me/blog/post.html?slug=bedrock-pipeline-cost-observability) — watch token and queue signals on the same flow.

---

**Further reading**

- [Amazon EventBridge API destinations](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-api-destinations.html)
- [Step Functions service integration with EventBridge](https://docs.aws.amazon.com/step-functions/latest/dg/connect-eventbridge.html)
- [Amazon ECS circuit breaker](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html)

---

*Feel free to share your thoughts by emailing me or reaching out on social media.*
