# Building on AWS to Learn AWS: A Professional Study Project

I have worked with cloud infrastructure for years. Azure, primarily, through my role at Microsoft. AWS, frequently, through customer engagements and personal projects. I can provision a VPC, configure security groups, deploy a Lambda function, and set up an RDS cluster without consulting documentation. I have done it hundreds of times.

But when I started studying for the AWS Solutions Architect Professional certification, I realized something uncomfortable: there is a meaningful gap between using AWS services and truly understanding them. I knew how to click through the Console. I did not fully understand the API surface, the rate limiting behavior, the pagination patterns, the edge cases in response schemas, or the relationships between services at the API level.

So I did what any architect with too many ideas and not enough time would do: I built a tool that forces me to interact with every AWS service at the SDK level.

## The Study Method

Most certification study plans follow a predictable pattern: read whitepapers, watch video courses, do practice exams. This works. It also does not stick. I remember things I have built far better than things I have read.

AwsViz is a study tool disguised as a product. Every feature I implement teaches me something about the AWS API surface:

**EC2 Discovery.** Implementing the Ec2Accessor taught me that `DescribeSecurityGroups` returns `IpPermissions` as a nested structure with both IPv4 and IPv6 CIDR ranges. The documentation mentions this. Building the open-to-world detection logic burned it into memory.

**S3 Public Access.** Implementing the S3Accessor taught me that `GetPublicAccessBlock` is a separate API call from `ListBuckets`, and that not all buckets have a public access block configured. The API throws an exception, not a null response, when the block is absent. I now know this at the code level, not the theory level.

**SQS Dead-Letter Queues.** Implementing the SqsAccessor taught me that DLQ configuration is stored in the `RedrivePolicy` attribute as a JSON string embedded inside the `GetQueueAttributes` response. Not a first-class field. A string you have to parse. This is the kind of detail that certification exams love and that you only discover by building against the API.

**Cost Explorer.** Implementing the CostExplorerAccessor taught me the difference between `GetCostAndUsage` (historical data), `GetCostForecast` (projection, which fails on the last day of the month), and `DescribeBudgets` (which lives in a completely separate SDK namespace, `AWSSDK.Budgets`, not `AWSSDK.CostExplorer`). These are API boundaries that only become visible when you write the code.

**STS.** Implementing the StsAccessor and AuthManager taught me the mechanics of `AssumeRole`, the difference between `GetCallerIdentity` and `GetSessionToken`, and how the credential chain resolves profiles. I have used profiles for years. I now understand how they work at the SDK level.

## The Architectural Benefit

The study method has a secondary benefit: it produces a real tool with real architecture. This is not a throwaway script. It is a .NET 10 application with 933 tests, volatility-based decomposition, and a proper component taxonomy.

Every AWS interaction is abstracted behind an Accessor interface. When the AWS SDK changes (and it does, regularly), the change is contained within one Accessor. When I need to add a new service (EKS, EventBridge, IAM), I implement a new Accessor that follows the existing pattern. The architecture absorbs new services because it was designed for exactly this kind of change.

This teaches two things simultaneously:

1. **AWS API behavior** (through Accessor implementation)
2. **Software architecture** (through the decomposition and testing patterns)

A certification exam can test the first. Only building something can teach the second.

## What I've Learned So Far

Some of the less obvious lessons from building against AWS APIs:

**Rate limiting is per-service, not per-account.** EC2, S3, Lambda, and RDS each have independent rate limits. A burst of EC2 DescribeInstances calls does not affect your S3 ListBuckets quota. AwsViz implements per-service token bucket rate limiting because a generic rate limiter would be either too conservative (throttling services that have capacity) or too aggressive (exceeding limits on busy services).

**Pagination is inconsistent.** Some AWS APIs use `NextToken`. Some use `Marker`. Some return the token in the response, others require you to check if the response is truncated. The `PaginateAsync` helper I built abstracts this, but the inconsistency was surprising for someone who assumed AWS had standardized on one pattern.

**Not all regions support all services.** Cost Explorer is a global service that only accepts requests to `us-east-1`. Budgets has the same constraint. If you configure your SDK client for `eu-west-1`, Cost Explorer calls fail silently or with unhelpful error messages. This is the kind of gotcha that study materials mention in passing but that becomes obvious when your integration test suite fails.

**Error responses are service-specific.** S3 returns `NoSuchBucketPolicy` when a bucket has no policy. Cost Explorer returns an empty result set when no data exists for a period. SQS returns attributes as a flat `Dictionary<string, string>` that you have to interpret yourself. There is no universal "no data" pattern. Each Accessor handles its service's error semantics independently.

## The Hands-On Architect

I use the term "hands-on architect" deliberately. There is a school of thought that says architects should not write code. They should produce diagrams, review pull requests, and make technology decisions from a high level.

I disagree.

An architect who does not write code cannot understand the real constraints of the technologies they recommend. They cannot feel the pagination inconsistency. They cannot experience the rate limiting behavior. They cannot discover the edge cases in error handling. They operate on theory.

AwsViz exists because I believe architects should build things. Not everything. Not production-critical systems where a team should own the implementation. But tools, prototypes, proof-of-concepts, and study projects that keep your hands on the keyboard and your understanding rooted in reality.

The AWS Solutions Architect Professional exam tests whether you understand AWS services at a depth that goes beyond "I know what EC2 does." It tests whether you understand how services interact, how they fail, how they scale, and how to choose between them. Building a tool that exercises these interactions is the most effective study method I have found.

## Deploying the Study Tool on AWS

There is a beautiful circularity to this project: a tool that visualizes AWS infrastructure, deployed on AWS infrastructure.

The deployment target is ECS Fargate. A single container running the .NET API host, serving the React SPA as static files from embedded wwwroot. An IAM role with read-only permissions (`ec2:Describe*`, `s3:ListAllMyBuckets`, `s3:GetBucketPublicAccessBlock`, `sqs:GetQueueAttributes`, `ce:GetCostAndUsage`, `sts:GetCallerIdentity`, etc.). No VPC dependencies beyond what Fargate provides. No RDS. No ElastiCache. Just a container and an IAM role.

This deployment teaches another layer of AWS: ECS task definitions, Fargate networking, IAM policy authoring, CloudWatch Logs integration, and container image management via ECR. The tool that teaches AWS services also teaches AWS deployment.

## The Professional Context

I am a Software Architect at Microsoft. I work with enterprise customers across the Middle East and Africa, helping them modernize with cloud, AI, and thoughtful architecture. My day job is Azure-centric. My study project is AWS-centric.

This is deliberate. Understanding both cloud platforms makes me a better architect. I can recommend AWS when it fits better. I can explain Azure differences to AWS-native teams. I can design multi-cloud architectures from experience, not from reading comparison blog posts.

The certification is a formal validation of knowledge I already apply. The tool is a practical application of that knowledge. Together, they close the gap between "I have worked with AWS" and "I understand AWS."

---

_This is part 5 of a series on building AwsViz, an AWS account visualization tool. Previous: [The One-Page Dashboard: Why TUI Apps Still Matter](/2026/03/24/the-one-page-dashboard-why-tui-apps-still-matter)._

_The complete series:_

1. _[Why the AWS Console Is Not Enough](/2026/01/28/why-the-aws-console-is-not-enough)_
2. _[Architecture for Change: Volatility-Based Decomposition](/2026/02/02/architecture-for-change-volatility-based-decomposition)_
3. _[Documentation-First Development with AI](/2026/02/29/documentation-first-development-with-ai)_
4. _[The One-Page Dashboard: Why TUI Apps Still Matter](/2026/02/16/the-one-page-dashboard-why-tui-apps-still-matter)_
5. _Building on AWS to Learn AWS (this post)_
