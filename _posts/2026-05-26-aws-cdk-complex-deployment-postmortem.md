---
title: "AWS CDK Deployment: When Simple Services Break a Complex Stack"
date: 2026-05-26
slug: aws-cdk-complex-deployment-postmortem
excerpt: A post-mortem on layered CDK deploys—Bedrock, OpenSearch Serverless, GuardDuty, and pipeline hygiene—when the architecture diagram looked easy and CloudFormation disagreed.
author: Jonathan Solarz
categories: aws cdk architecture devops
image: /img/blog/aws-cdk-deployment-hero.jpg
series: aws-cdk-complex-deployments
series_part: 1
scene: |
  A "simple" service addition collapsed the stack—dependencies you did not respect, deploy order you assumed. CDK made the failure legible after the fact. This is postmortem loot: what broke, how you detected it, how you hardened the next deploy.
  
  Treat CDK as executable design doc; still read the CloudFormation battle log.

---

# AWS CDK Deployment: When Simple Services Break a Complex Stack

The diagram was clean. Upload documents, scan them, extract with **Amazon Bedrock**, index for search, notify the UI when the pipeline finishes. **AWS CDK deployment** for a research information system should have been a straight line: Foundation stack, Services stack, Application stack, pipeline on every merge. Instead we spent a week learning that the “simple” boxes on the architecture slide—malware scanning, a vector index, a knowledge base—each carry hidden prerequisites CloudFormation will not infer for you.

![Layered CDK deploy — pipeline, three stacks, and the services that look small on the diagram](/img/blog/aws-cdk-deployment-hero.png)

## In Brief

This post is **part 1** of a short series on **complex AWS deployment** for document and AI platforms. It is a post-mortem, not a tutorial. The stack was real; the customer name is not here. The pattern is.

- Layered IaC (VPC → shared services → app) plus CI-only deploys beats clickOps—but only if you treat “add Bedrock KB” as a project, not a checkbox.
- OpenSearch Serverless, GuardDuty Malware Protection, and Bedrock Knowledge Bases fail on ordering, IAM, and pre-created indexes—not on exotic bugs.
- CloudFormation event order exposes races you never see in `cdk synth`; fix with separate CREATE resources, explicit `DependsOn`, and custom resources where AWS docs assume a human clicked first.
- Pipeline hygiene (`npm ci`, lock files, image build before Services deploy) is part of the architecture, not an afterthought.

---

## The Shape We Thought We Were Shipping

Picture a document management platform built on AWS: researchers upload PDFs, GuardDuty scans objects in the upload bucket, approved files move to an ingestion queue, **Step Functions** orchestrates extraction, structured metadata lands in **Aurora**, artifacts sit in **S3**, and a **Bedrock Knowledge Base** backs semantic search over processed content. Front door is **ECS on Fargate** behind an ALB and **CloudFront**. Infrastructure is TypeScript CDK, three CloudFormation stacks, Bitbucket pipeline as the only path to shared environments.

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                     Target: "it should just deploy"                      │
  └──────────────────────────────────────────────────────────────────────────┘

   Developer ──► git push ──► CodePipeline ──► cdk deploy (L2 Services)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Foundation        Services         Application
              (VPC, SSM)    (ALB, Aurora,     (ECS tasks,
                             S3, AOSS,         Step Functions,
                             Bedrock KB)       EventBridge)

  Data path (happy path):

   Upload ──► S3 ──► GuardDuty scan ──► ready bucket ──► SQS ──► Step Functions
                                                                    │
                                                    Bedrock extract + persist
                                                                    │
                                                    OpenSearch / KB index ◄── search
```

That drawing is accurate at the whiteboard level. It is also dangerously incomplete. Every labeled box is an AWS service with its own IAM dialect, replacement semantics, and documentation that assumes you already clicked through the console once.

## When the Stack Turns Red: A Post-Mortem Timeline

We did not fail once. We failed in sequence—and each fix uncovered the next “simple” requirement.

```
  Deploy attempt          Symptom                          Root cause (actual)
  ──────────────          ───────                          ───────────────────
       1                  ALB AlreadyExists                Scheme drift: internal ALB
                                                           in CDK vs internet-facing live

       2                  AOSS Collection blocked          Stack tag change → REPLACEMENT
                                                           on collection resource

       3                  Bedrock KB 403 Forbidden         Private collection; Bedrock not
                                                           in network policy yet; KB CREATE
                                                           raced policy UPDATE

       4                  GuardDuty MalwarePlan 400        IAM role missing s3:ListBucket,
                                                           validation object, EventBridge
                                                           managed-rule permissions

       5                  Bedrock KB 404 index missing     Vector index must exist BEFORE
                                                           KnowledgeBase CREATE

       6                  npm ci failed in pipeline        package-lock.json out of sync
                                                           with new Lambda dependencies
```

Notice the pattern. Failures 3, 4, and 5 are not “hard” distributed systems problems. They are prerequisite checklists buried in AWS documentation pages you only read after the error string sends you there.

That is the thesis of this post. **Complex AWS deployment** often breaks on the small print, not the big design.

## Failure Mode 1: The Load Balancer You Did Not Mean to Replace

Changing an ALB from internet-facing to internal is not a tweak. It is a replacement. CloudFormation tries to create the new resource, the name collides with the old one, and the stack rolls back.

We had branched logic: greenfield sandbox wants a public ALB plus CloudFront; an existing VPC landing zone wants an internal ALB plus VPC Origin. One boolean drifted relative to what was already live. Synth looked fine. Deploy was not.

**Lesson:** For brownfield stacks, treat load balancer scheme, subnet placement, and security group ingress as frozen unless you plan a migration. Branch in CDK on _observed_ environment state (`isExistingVpc`, SSM parameters, or explicit config flags)—not on what greenfield _should_ look like next quarter.

## Failure Mode 2: Tags That Replace Instead of Update

OpenSearch Serverless collections are sensitive to tag changes. Propagate stack-level tags blindly and CloudFormation may schedule **Replacement**. Worse: a custom `Name` tag can block in-place updates entirely.

We pinned collection tags in code—frozen to what was already deployed— and excluded the collection from generic stack tag aspects. Unromantic. Effective.

**Lesson:** Know which resources in your template are replace-only for tag diffs. OpenSearch Serverless collections belong on that list. FinOps tags are vital; apply them with aspects that _exclude_ fragile resource types.

## Failure Mode 3: Bedrock Meets Private OpenSearch (Policy Order Matters)

A private **OpenSearch Serverless** collection needs:

- A VPC endpoint in your network policy (`SourceVPCEs`)
- A separate network rule allowing `bedrock.amazonaws.com` (`SourceServices`)
- Data access policies for the KB role _and_ your application role
- The vector index created with the exact field names Bedrock expects

We initially merged Bedrock access into in-place policy updates on resources that already existed. CloudFormation interleaved events: **KnowledgeBase CREATE started**, then **network policy UPDATE** completed. Bedrock hit the collection during the gap. `403 Forbidden`. Rollback reverted the policy work. Next deploy, same race.

Fix: **new** security and access policy resources dedicated to Bedrock—CREATE-only on a fresh deploy—plus explicit dependencies so KB waits for policies _and_ the KB role’s default policy attachment.

Still not enough.

**Lesson:** Read [prerequisites for a vector store you create](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-setup.html) as a deployment checklist, not bedtime reading. Private collections are a multi-policy project.

## Failure Mode 4: GuardDuty Malware Protection Is a Full IAM Template

Enabling **GuardDuty Malware Protection for S3** on an upload bucket sounds like one CDK construct. It is not. The service validates bucket ownership by writing a test object, configuring notifications, and managing EventBridge rules with a mandated prefix. `grantRead()` on the bucket does not cut it.

We needed, at minimum:

- `s3:ListBucket` on the bucket ARN
- `s3:PutObject` on a dedicated validation key path
- `s3:PutBucketNotification` / `GetBucketNotification`
- EventBridge rule lifecycle permissions with `events:ManagedBy` conditions
- KMS decrypt for SSE-KMS buckets

The error message said ownership validation failed. That was accurate. It was also easy to misread as an S3 bucket policy problem when it was the GuardDuty role.

**Lesson:** Copy AWS’s published IAM JSON for Malware Protection verbatim, then trim. Do not infer from S3 read grants.

## Failure Mode 5: The Vector Index Must Exist First

After policies were finally ordered correctly, Bedrock returned:

`no such index [my_env_bedrock_index]`

Of course it did. **KnowledgeBase** references an index name; it does not create the index for you when you bring your own OpenSearch Serverless collection. Console quick-create hides that step. IaC does not.

The index needs:

- `knn: true` settings
- A `knn_vector` field sized to your embedding model (1024 for Titan Text Embeddings v2)
- Text and metadata fields matching your `fieldMapping` (`AMAZON_BEDROCK_TEXT_CHUNK`, etc.)

For a VPC-only collection, something in your VPC must PUT the index—typically a Lambda custom resource with `aoss:APIAccessAll`, data access policy, and SigV4 to the collection’s VPC endpoint hostname.

**Lesson:** Treat “create KB in CDK” as two resources: index provisioner, then knowledge base. The AWS sample patterns do exactly this; the console wizard simply omits the lesson.

## Failure Mode 6: The Pipeline Broke on `npm ci`

After fixing AWS, the pipeline failed before synth. `npm ci` demands a lock file in sync with `package.json`. We added Smithy signing packages for the index Lambda locally, committed `package.json`, and forgot the lock refresh in the same commit.

Fast failure. Cheap failure. Still failure.

**Lesson:** Any CDK repo change that touches dependencies rides in the same commit as `package-lock.json`. Add `npm ci` to local pre-push if your CI uses it religiously.

## The Cascade Diagram (Why Rollbacks Hurt)

CloudFormation does not fail in isolation. One resource stuck in `CREATE_FAILED` cancels siblings. You learn the difference between root cause and collateral damage the hard way.

![CloudFormation rollback cascade when one resource fails](/img/blog/aws-cdk-deployment-failure-cascade.png)

```
                    ┌─────────────────┐
                    │  KB CREATE_FAIL │
                    └────────┬────────┘
                             │ stack rollback
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   S3 bucket UPDATE      Aurora UPDATE         OSS policy UPDATE
   cancelled             cancelled             REVERTED (policies
                                               lose Bedrock rules)
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                             ▼
              Next deploy repeats race unless
              you CREATE new policy resources or
              split stacks / custom resources
```

During rollback, the knowledge base resource disappears. OpenSearch policies may revert. Your _next_ deploy is not a clean retry—it is a new negotiation with whatever partial state survived.

**Study tip:** Screenshot the CloudFormation **Events** tab sorted by timestamp, not just the red resource. Ordering tells the story `cdk diff` cannot.

## How We Deploy Now (Discipline, Not Heroics)

These rules emerged from the post-mortem. They are boring. Boring is the point.

| Practice                                      | Why                                                               |
| --------------------------------------------- | ----------------------------------------------------------------- |
| Pipeline-only deploys to shared accounts      | No manual `cdk deploy` drift vs CI                                |
| Three stacks with SSM handoffs                | Foundation → Services → Application boundaries match blast radius |
| Separate CREATE policies for new access paths | Avoid UPDATE vs CREATE races on hot resources                     |
| Custom resource for AOSS index                | Bedrock KB has a hard prerequisite                                |
| Full GuardDuty IAM template                   | Ownership validation is real                                      |
| Frozen tags on replace-sensitive resources    | Especially OpenSearch Serverless collections                      |
| `npm ci` + lock file in same commit           | Synth must reproduce CI locally                                   |
| Image build before Services deploy            | ECR tags exist before ECS references them                         |

```
  Developer workflow (target steady state):

    edit CDK / app ──► PR ──► merge main ──► pipeline
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                             ▼                             ▼
              npm ci + test                  docker build                   cdk deploy L2
              (lock file!)                 (backend/api/client)           (Services)
                    │                             │                             │
                    └─────────────────────────────┴─────────────────────────────┘
                                                  │
                                                  ▼
                                         cdk deploy L3 (Application)
                                                  │
                                                  ▼
                                    smoke: upload → scan → extract → UI event
```

## How to Prepare (Before You Add “Just One More Service”)

This is an operational rehearsal list—not a certification guide.

1. **Read the prerequisite page for every managed service you do not create from scratch.** Bedrock KB + OpenSearch Serverless + private networking is three docs minimum.
2. **Model CloudFormation event order.** If resource B needs A’s side effect, `addDependency` is not optional politeness—it is correctness.
3. **Keep brownfield flags explicit.** `existingVpcId`, frozen tags, ALB scheme: name them in config, not in comments.
4. **Reproduce CI locally.** `npm ci`, `cdk synth`, `cdk diff` with the same context flags the pipeline passes (`env=sandbox`, layer toggles).
5. **Maintain a failure log.** One table like the timeline above saves the next engineer six deploy cycles.

If you have already built document pipelines on AWS, you know Step Functions and SQS. **Complex AWS deployment** asks whether your IaC encodes the _boring_ steps the console wizard hid—and whether your pipeline enforces them on every merge.

## Anti-Patterns That Feel Like Progress

- **“We’ll add KB in the same PR as the VPC refactor.”** Couple blast radius you cannot debug.
- **Grant-read IAM and hope GuardDuty works.** It will not.
- **Assume Bedrock creates the index.** It does not (bring-your-own-store path).
- **Stack tags everywhere with no exclusion list.** Replacement roulette.
- **Manual deploy to unblock, then fix CDK later.** Later is production drift.
- **Fixing only the red resource in the console.** The next pipeline run erases your heroism.

## Closing the Loop

The architecture was reasonable. The services were standard. The pain was deployment semantics: replacement traps, IAM templates, index prerequisites, policy ordering, lock files.

That is good news. None of this requires a novel algorithm. It requires reading the footnotes, encoding them in CDK, and letting the pipeline enforce the sequence—every time.

Build the failure log while the scars are fresh. Your next “simple” checkbox—AgentCore, Knowledge Base sync, cross-region DR—will thank you.

---

**Further reading**

- [Prerequisites for using a vector store with Amazon Bedrock Knowledge Bases](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-setup.html)
- [Malware Protection for S3 — IAM policy prerequisites](https://docs.aws.amazon.com/guardduty/latest/ug/malware-protection-s3-iam-policy-prerequisite.html)
- [Working with vector search collections in OpenSearch Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-vector-search.html)

---

## Series: AWS CDK on Complex Workloads

Follow-ups go deeper on mechanics without repeating the war stories.

| Part                                                                                           | Topic                                                                                          | Focus keyphrase angle       |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------- |
| **[1](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-complex-deployment-postmortem)**      | Post-mortem: when simple services break the stack                                              | AWS CDK deployment          |
| **[2](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-layered-stacks-pipeline)**            | Layer cake IaC—Foundation, Services, Application, SSM contracts, pipeline-only discipline      | CloudFormation stack layers |
| **[3](https://ioni.solarz.me/journal/post.html?slug=bedrock-opensearch-guardduty-iac-checklist)** | Bedrock + OpenSearch Serverless + GuardDuty—checklists, custom resources, dependency graphs    | Bedrock Knowledge Base IaC  |
| **[4](https://ioni.solarz.me/journal/post.html?slug=document-pipeline-event-driven-deploy)**      | End-to-end ingestion wiring—Step Functions, EventBridge, UI completion events, port migrations | AWS pipeline deployment     |

**Related FinOps track:** [AWS FinOps: Cost Observability for a Complex Document and AI Workload](https://ioni.solarz.me/journal/post.html?slug=aws-finops-cost-observability-complex-workload) (tags and dashboards for the same architecture shape).

**Related:** [Why the AWS Console Is Not Enough](https://ioni.solarz.me/journal/post.html?slug=why-the-aws-console-is-not-enough), [Building on AWS to Learn AWS](https://ioni.solarz.me/journal/post.html?slug=building-on-aws-to-learn-aws).

---

_Feel free to share your thoughts by emailing me or reaching out on social media._
