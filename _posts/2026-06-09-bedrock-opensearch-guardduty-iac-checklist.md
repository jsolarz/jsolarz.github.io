---
title: "Bedrock Knowledge Base IaC: OpenSearch Serverless and GuardDuty Checklists"
date: 2026-06-09
slug: bedrock-opensearch-guardduty-iac-checklist
excerpt: Copy-paste deployment checklists for Bedrock Knowledge Bases on private OpenSearch Serverless, vector index custom resources, and GuardDuty Malware Protection IAM—what the console hides.
author: Jonathan Solarz
categories: aws cdk bedrock security
image: /img/blog/bedrock-opensearch-iac.jpg
series: aws-cdk-complex-deployments
series_part: 3
scene: |
  Knowledge bases do not summon themselves—OpenSearch Serverless, Bedrock policies, GuardDuty signals, all codified. You are holding a checklist forged from IaC battles where one missing permission voided the ritual.
  
  Run down the list before you claim RAG is "done"; production loves omitted security groups.

---

# Bedrock Knowledge Base IaC: OpenSearch Serverless and GuardDuty Checklists

The console wizards lie by omission. **Bedrock Knowledge Base IaC** looks like three clicks until your CloudFormation stack rolls back at 2 a.m. and the Events tab shows a policy UPDATE finishing *after* the knowledge base already tried to connect.

Part 3 is the checklist we wish we had before the first deploy on a document platform: private **OpenSearch Serverless**, a vector index that must exist first, and **GuardDuty Malware Protection for S3** with IAM nobody grants by accident.

![Bedrock Knowledge Base dependency order on OpenSearch Serverless](/img/blog/bedrock-opensearch-iac.png)

## In Brief

This is **part 3** of the AWS CDK complex deployment series—reference material, not war stories ([part 1 post-mortem](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-complex-deployment-postmortem)).

- **OpenSearch Serverless** needs encryption, network (VPC endpoint + Bedrock `SourceServices`), and data policies before anything calls the collection API.
- **Vector index** is a separate step: `knn_vector` field, Titan embedding dimensions, field names matching Bedrock’s `fieldMapping`.
- **CfnKnowledgeBase** must `DependsOn` policies, index provisioner, and the KB execution role attachment—in that dependency graph, not your gut.
- **GuardDuty Malware Protection** ships a full IAM template—S3 read grants are not enough.
- Use **CREATE-only policy resources** for new access paths to avoid UPDATE vs CREATE races on hot policies.

---

## OpenSearch Serverless: Three Policy Types, One Collection

A vector search collection is not “an OpenSearch domain with fewer buttons.” Serverless splits control plane concerns:

| Policy type | What it gates | IaC gotcha |
|-------------|---------------|------------|
| **Encryption** | KMS at rest | Must exist before collection |
| **Network** | VPCE ids + optional `SourceServices` | Bedrock needs `bedrock.amazonaws.com` on private collections |
| **Data access** | Who may call `aoss:APIAccessAll` | KB role, index Lambda, app role—often three principals |

```
  Deploy order (minimum viable private collection + Bedrock):

    Encryption policy ──► Network policy ──► Collection
                                │
                                ├── VPCE in SourceVPCEs (your VPC endpoint)
                                └── bedrock.amazonaws.com in SourceServices
                                │
    Data access policy(s) ◄─────┴── principals: KB role, index CR role, app
                                │
    VPC Lambda custom resource ──► PUT /{index}  (knn mapping)
                                │
    CfnKnowledgeBase ──► DependsOn: all of the above
```

### Network policy: two doors, not one

Private collections fail closed. Your workloads reach the collection through a **managed VPC endpoint** in your VPC. Bedrock reaches it through **`SourceServices`**—a distinct network rule, not implied by “we added a VPCE.”

If Knowledge Base creation starts before the network policy UPDATE completes, you get **403 Forbidden**. CloudFormation may roll back and revert the policy. Next deploy, same race.

**Fix:** Dedicated **CREATE** policy resources for the Bedrock path on first deploy. Explicit `addDependency` from `CfnKnowledgeBase` to each policy and to the role’s default policy attachment.

### Frozen tags on the collection

Stack-level tag aspects are convenient for FinOps. On `AWS::OpenSearchServerless::Collection`, tag diffs can trigger **replacement**. A custom `Name` tag can block updates entirely.

Pin collection tags to what is already live. Exclude the collection resource from generic tag aspects. Unromantic. Cheaper than replacing a vector store.

---

## Vector Index Custom Resource (Bring Your Own Store)

Bedrock does **not** create the index when you point a Knowledge Base at your own OpenSearch Serverless collection. The error is blunt:

`no such index [your_index_name]`

Console quick-create hides the PUT. IaC does not.

### Index body checklist (Titan Text Embeddings v2 example)

| Setting | Value | Why |
|---------|-------|-----|
| `index.knn` | `true` | Vector search |
| Vector field type | `knn_vector` | Bedrock compatibility |
| Dimensions | `1024` | Match embedding model |
| Text field | per `fieldMapping` | e.g. `AMAZON_BEDROCK_TEXT_CHUNK` |
| Metadata field | per `fieldMapping` | e.g. `AMAZON_BEDROCK_METADATA` |

Something in the **VPC** must PUT the index—typically a Lambda behind a CloudFormation custom resource:

- Security group that can reach the **OpenSearch Serverless VPC endpoint**
- Data access policy entry for the Lambda role
- SigV4 to the **collection endpoint hostname** (not the public OpenSearch domain pattern you may know from older projects)
- Run **before** `AWS::Bedrock::KnowledgeBase` CREATE

```
  Custom resource lifecycle:

    Create/Update ──► Lambda ──► PUT index (idempotent)
    Delete        ──► optional: leave index (data retention) or DELETE with care

  KnowledgeBase ──DependsOn──► CustomResource ──DependsOn──► Data policy for Lambda
```

Link: [prerequisites for a vector store you create](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-setup.html).

---

## CfnKnowledgeBase Dependency Graph

Treat this as a small DAG, not a list of resources in one construct.

```
                    ┌─────────────────────┐
                    │ Encryption policy   │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Network policy      │
                    │ (+ Bedrock service) │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Collection          │
                    └──────────┬──────────┘
                               ▼
         ┌─────────────────────┴─────────────────────┐
         ▼                     ▼                     ▼
  Data policy (KB)    Data policy (index λ)   Data policy (app)
         │                     │                     │
         └──────────┬──────────┴──────────┬──────────┘
                    ▼                     ▼
             IAM role +            Custom resource
             default policy         (index PUT)
                    │                     │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ CfnKnowledgeBase    │
                    └─────────────────────┘
```

**Bedrock Knowledge Base IaC** fails when any edge in that graph is implicit.

---

## GuardDuty Malware Protection for S3: IAM Checklist

Malware Protection validates bucket ownership. It writes a test object. It touches notifications and EventBridge rules with a mandated prefix. **`grantRead(uploadBucket)`** will not save you.

Minimum permission **categories** (verify against current AWS docs before deploy):

| Category | Examples | Symptom if missing |
|----------|----------|-------------------|
| Bucket discovery | `s3:ListBucket` on bucket ARN | Plan creation 400 |
| Validation object | `s3:PutObject` on `BucketOwnerFullControl` validation key | Ownership validation failed |
| Notifications | `s3:PutBucketNotification`, `GetBucketNotification` | Plan stuck / partial |
| EventBridge | `events:PutRule`, `PutTargets`, … with `ManagedBy` condition | Managed rule errors |
| KMS (if SSE-KMS) | `kms:Decrypt`, `GenerateDataKey` | Encrypted bucket failures |

Start from AWS’s published Malware Protection policy JSON. Trim only with intent.

Link: [Malware Protection for S3 — IAM prerequisites](https://docs.aws.amazon.com/guardduty/latest/ug/malware-protection-s3-iam-policy-prerequisite.html).

### Wiring with the upload path

Typical document flow:

```
  User upload ──► S3 (scan bucket) ──► GuardDuty tags object ──► EventBridge
                                                      │
                                                      ▼
                                            scan-mover Lambda ──► ready bucket ──► ingestion queue
```

Enable **EventBridge notifications** on the upload bucket in CDK (`EventType.OBJECT_CREATED` → EventBridge). The malware plan and downstream Lambdas assume that event fabric exists.

---

## Copy-Paste Pre-Deploy Checklist

Run this mentally before every Services-layer deploy that touches search or upload:

**OpenSearch Serverless**

- [ ] Encryption policy CREATE complete
- [ ] Network policy includes VPCE **and** Bedrock `SourceServices`
- [ ] Data policies include KB role, index Lambda role, application role
- [ ] Collection tags frozen / aspect exclusion configured
- [ ] Index custom resource tested against embedding model dimensions
- [ ] KnowledgeBase DependsOn index + policies + role attachment

**GuardDuty**

- [ ] Malware Protection plan targets correct bucket ARN
- [ ] Role policy copied from AWS template (not inferred)
- [ ] KMS statements present if bucket uses SSE-KMS
- [ ] EventBridge on bucket enabled for downstream automation

**Pipeline**

- [ ] New Lambda deps reflected in `package-lock.json` (`npm ci` in CI)
- [ ] Index provisioner in VPC subnets with OpenSearch VPCE route

---

## When to Split Services vs Application

Keep **collection, KB, GuardDuty plan** in Services (platform). Keep **scan-mover Lambda, Step Functions** in Application (workflow). If a resource both defines the store and consumes it, you will circular-reference yourself into synth errors.

---

## Series Navigation

| Part | Topic |
|------|--------|
| [1 — Post-mortem](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-complex-deployment-postmortem) | When simple services break the stack |
| [2 — Layer cake](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-layered-stacks-pipeline) | CloudFormation stack layers + pipeline |
| **3 (this post)** | **Bedrock Knowledge Base IaC** checklists |
| [4 — End-to-end wiring](https://ioni.solarz.me/journal/post.html?slug=document-pipeline-event-driven-deploy) | Step Functions, EventBridge, UI events |

---

**Further reading**

- [Working with vector search collections in OpenSearch Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-vector-search.html)
- [Create a knowledge base by connecting to a data source in OpenSearch Serverless](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-setup-oss.html)
- [GuardDuty Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/malware-protection-s3.html)

---

*Feel free to share your thoughts by emailing me or reaching out on social media.*
