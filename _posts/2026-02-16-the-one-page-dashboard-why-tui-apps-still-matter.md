# The One-Page Dashboard: Why TUI Apps Still Matter for Cloud Operations

Open a terminal. Type a command. See the answer.

That is the fastest possible path from question to answer in software operations. No browser to open. No credentials to enter into a web UI. No loading spinners. No JavaScript bundle to download. You are already authenticated (your AWS profile is configured), already connected (SSH or local), and already in context (the terminal is where you work).

Yet most modern cloud tooling assumes you want a web browser. AWS built the Console. Datadog built a SaaS dashboard. Grafana built a web application. These are fine tools. They are also the wrong tool when you are SSHed into a bastion host and need to know if your environment is healthy before deploying.

AwsViz has a TUI. This post explains why, what it looks like, and why the terminal is the right delivery vehicle for operational infrastructure tools.

## The Terminal as First-Class Citizen

Cloud operators live in the terminal. We SSH into instances, kubectl into clusters, terraform plan our infrastructure, and tail logs from CloudWatch. Our muscle memory is built around command-line patterns.

When I need to check on my environment, I do not want to context-switch to a browser. I want to stay where I am and see the answer in the same terminal where I am about to run the next command. This is not nostalgia for the 1980s. It is an efficiency argument.

Web dashboards require:

- A browser (not always available on servers or jump boxes)
- Authentication flow (SSO redirect, MFA challenge, wait for page load)
- Network path from your browser to the dashboard service
- Mental context switch from terminal workflow to browser workflow

A TUI requires:

- A terminal (already open)
- AWS credentials (already configured)
- One command

The math is straightforward.

## What the TUI Shows

AwsViz Pulse (the TUI client) is built on Terminal.Gui v2 for .NET. It provides a single-screen dashboard with:

**Service Overview.** Every discovered resource, grouped by service type, with state indicators. Running instances are green. Stopped instances are yellow. At a glance, you see what is up and what is down.

**Cost Summary.** Monthly estimate, trend, budget utilization. No navigating to Cost Explorer. No setting date ranges. The numbers are there when you open the app.

**Security Findings.** Open security groups, public S3 buckets, queues without dead-letter queues. Severity-coded. The most critical findings are at the top.

**Relationship Graph.** Using Terminal.Gui's built-in GraphView, a visual representation of how resources connect. Which instances are protected by which security groups. Which subnets belong to which VPCs.

All of this on a single screen, refreshed automatically. Press R to force a refresh. Press Q to quit. That is the entire interface.

## Design Decisions for Terminal UIs

Building TUI apps in 2026 comes with specific constraints and lessons:

**Thread safety.** Terminal.Gui owns the main thread. All UI updates must happen on the UI thread. Long-running AWS API calls run on background threads and post results back to the UI thread via events. I learned this the hard way: calling async methods synchronously from the render path blocks the entire UI.

**Render-path discipline.** In Terminal.Gui's `OnDrawingContent`, you must not allocate. No new arrays, no string formatting, no LINQ queries. Pre-compute everything on data change, cache it, and draw from the cache. This is the same discipline you apply to game engine render loops.

**Keyboard-first design.** There is no mouse in most terminal scenarios. Every action must be reachable via keyboard. Global shortcuts (Q, R) are registered via `OnKeyDown` on the top-level Window, not through HotKeyBindings (which interfere with text input in child views). This was a painful discovery that cost hours of debugging.

**Color as information.** In a terminal, you have limited space. Color must carry meaning. Green for healthy/running, yellow for warning/stopped, red for critical/error. No decorative colors. Every color is a data channel.

## Enabling This for Customers

The TUI is not just for my personal use. The architecture supports a deployment model where customers run AwsViz in their own environment:

**Self-contained binary.** AwsViz has zero external dependencies at runtime. No database server. No Redis. No message queue. SQLite handles persistence. In-memory projections handle reads. A single .NET 10 binary or Docker container is the entire deployment.

**AWS Marketplace potential.** A self-contained container that discovers and visualizes an AWS account, deployed via ECS Fargate or a simple EC2 instance, consuming only AWS API calls. The customer grants an IAM role with read-only permissions, runs the container, and gets a complete visualization of their environment.

**Two delivery modes from one codebase.** The TUI runs locally on the operator's machine, calling Managers directly (in-process). The API host runs as a service (container, Fargate, EC2), exposing SSE streams and REST endpoints for the React web dashboard. Both consume the same core: same Managers, same Engines, same Accessors. The presentation layer is the only difference.

This is the Client tier in the component taxonomy. The volatility being encapsulated is the form factor (V6). Terminal vs. browser is a presentation concern. The business logic, the data pipeline, the security analysis, and the cost calculations are identical regardless of which client renders them.

## The Browser Dashboard

For teams, the web dashboard provides the same data with richer visualization. Built with React 19, TanStack Query for server state management, and Recharts for cost trend charts, it consumes the API over HTTP and SSE.

The web client is code-split by route. Each page (Dashboard, FinOps, Resources, Graph, Security) loads independently. TanStack Query manages caching, deduplication, and background refetching. SSE subscriptions push live updates into the query cache, so the page updates automatically when the backend refreshes.

But the web dashboard exists because some users prefer browsers. It is not the primary interface. The TUI is.

## The Snapshot Problem

One of the most frustrating aspects of cloud operations is the lack of a snapshot. "What did my environment look like at 3 PM yesterday when the incident started?"

The Console shows you the current state. The CLI shows you the current state. Grafana shows you metrics over time, but not resource topology over time.

AwsViz stores snapshots in SQLite. Each refresh cycle produces an immutable `AwsEnvironmentGraph`. On startup, the last snapshot is loaded and served immediately while a fresh discovery runs in the background. This means cold starts are not blind. You always have data, even if it is a few hours old.

Historical snapshots are planned. The goal is to answer "what changed between 2 PM and 3 PM?" by comparing graph snapshots. Which resources were added, removed, or changed state? Which security group rules were modified? This is the forensic capability that no existing tool provides out of the box.

---

_This is part 4 of a series on building AwsViz. Previous: [Documentation-First Development with AI](/2026/02/09/documentation-first-development-with-ai). Next: [Building on AWS to Learn AWS: A Professional Study Project](/2026/02/23/building-on-aws-to-learn-aws)_
