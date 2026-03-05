# Why the AWS Console Is Not Enough: Building the Dashboard I Actually Need

I manage AWS infrastructure. I have for years. And every single day I perform the same ritual: open the Console, click through five services, mentally stitch together a picture of what my environment looks like right now, then alt-tab to the CLI to get the numbers the Console makes you hunt for, then check Grafana for the metrics the Console buries three clicks deep.

It works. It's also insane.

This post is about why I started building AwsViz, what specifically frustrates me about existing tools, and what I think a proper AWS environment dashboard should look like.

## The Console Problem

The AWS Console is a web application designed to manage individual services. It is not designed to give you a picture of your environment. These are fundamentally different jobs.

When I open the EC2 console, I see EC2 instances. When I open the RDS console, I see databases. When I open VPC, I see networking. But what I actually want to know is: "What is the current state of everything I've deployed, right now, on one screen?"

The Console cannot answer that question. It was never designed to. Each service page is an island. The mental model the Console gives you is a filing cabinet organized by AWS service, not by your workload, your application, or your deployment.

Specific pain points:

**No cross-service view.** I want to see that my EC2 instance in us-east-1 is associated with security group sg-abc, which belongs to VPC vpc-123, which has a NAT gateway attached, and that the instance is running a task registered in ECS, consuming messages from SQS queue xyz. The Console gives me each piece in a different tab. I have to build the graph in my head.

**Buried operational data.** To get the current cost burn rate, I leave the service pages entirely, navigate to Cost Explorer, set a date range, wait for it to load, and then try to correlate that with what I just saw in EC2. The same goes for CloudWatch metrics. There is no way to look at an instance and its metrics and its cost on the same page.

**No security posture at a glance.** Security groups with 0.0.0.0/0 inbound rules. S3 buckets without public access blocks. SQS queues without dead-letter queues. Each of these requires navigating to the specific resource and manually inspecting its configuration. There is no dashboard that aggregates security anti-patterns across your account.

**Stale context.** The Console does not stream. You load a page, you see a snapshot. If something changes (an instance stops, a deployment rolls out), you have to refresh manually. There is no live view.

## The CLI Problem

The AWS CLI is better for scripting and automation, but it has its own limitations as an operational tool.

The CLI gives you raw data. Need to find all security groups open to 0.0.0.0/0?

```bash
aws ec2 describe-security-groups \
  --query 'SecurityGroups[?IpPermissions[?contains(IpRanges[].CidrIp, `0.0.0.0/0`)]]' \
  --output table
```

That works. But now correlate that with the instances those groups are attached to, the VPC they live in, and the cost of those instances. You are writing a shell script, not operating infrastructure. And the output is text. You cannot sort it, filter it, drill down into it. You pipe it through jq and hope you got the query right.

The CLI is a data extraction tool. It is not an operational dashboard.

## The Third-Party Problem

"Just use Grafana." "Just use Datadog." "Just use CloudWatch dashboards."

I have. They solve the metrics and alerting problem. They do not solve the environment topology problem. Grafana can show me a time-series of CPU utilization, but it cannot show me the relationship between my EC2 instance, its security group, its VPC, and the RDS database it connects to. That is a graph problem, not a metrics problem.

Tools like Lucidchart or draw.io can draw architecture diagrams, but they are static. They are documentation artifacts. They go stale the moment you deploy something new.

What I want is a live architecture diagram that discovers itself from the actual AWS APIs, overlaid with cost, health, and security data. A single pane of glass for the entire account.

That tool does not exist. So I am building it.

## What AwsViz Is

AwsViz is an AWS account visualization suite. It discovers every resource in your account, infers the relationships between them, and presents the whole picture in a single view. It runs as a TUI for terminal operators and as a web dashboard for teams.

The core idea: discover resources via AWS APIs, build a graph of relationships (EC2 instances belong to security groups, which belong to VPCs, which contain subnets), enrich the graph with cost and health data, and present the result as a live, streaming dashboard.

Key design decisions:

- **Self-contained.** No external database. No third-party SaaS dependencies. SQLite for persistence, in-memory projections for reads. Runs as a single binary or container.
- **Real-time.** Server-Sent Events stream projection updates to connected clients. When a refresh completes, every connected browser updates automatically.
- **Security-first.** The tool runs a security analysis engine that flags anti-patterns: security groups open to the world, S3 buckets without public access blocks, SQS queues missing dead-letter queues, stopped instances still incurring EBS charges. These findings appear the moment you connect.
- **Two form factors.** A Terminal.Gui TUI for operators who live in the terminal. A React web dashboard for teams who prefer a browser. Both consume the same data pipeline.

## What I Want to See When I Open It

One page. Four sections:

1. **Cost:** Monthly estimate, trend, delta vs. prior month, budget utilization, top cost drivers by service
2. **Resources:** Every discovered resource, searchable, filterable by service type, sortable by name or state
3. **Graph:** Resource topology with relationships (ProtectedBy, MemberOf, Contains), distribution by service type
4. **Security:** Findings sorted by severity, with specific recommendations, filterable by category

No clicking through tabs. No navigating to different AWS services. No correlating data in my head. The environment state, on one screen, live.

## Why Now

I have been thinking about this tool for years. What changed is that AI-assisted development made it feasible for a single architect to build it. I am using Cursor with a comprehensive set of architectural rules to maintain the rigor I would expect from a team, while moving at a pace that would not be possible without AI assistance.

But this is not "vibe coding." Every component has a documented rationale. Every architectural decision follows volatility-based decomposition principles. Every interface is defined before implementation. The AI enforces the architecture, it does not invent it.

The next post in this series covers the architecture: how I decomposed the system using the IDesign Method, why the component taxonomy matters, and how volatility-based thinking creates software that absorbs change without breaking.

---

_This is part 1 of a series on building AwsViz, an AWS account visualization tool. Next: [Architecture for Change: Applying Volatility-Based Decomposition to a Real Project](/2026/02/02/architecture-for-change-volatility-based-decomposition)_
