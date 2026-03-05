# Architecture for Change: Applying Volatility-Based Decomposition to a Real Project

The first question people ask when they see AwsViz's architecture is: "Why don't you have an Ec2Service, an S3Service, a LambdaService?"

Because that is the classic mistake.

Decomposing a system by its functional areas (one service per AWS resource type) means that when AWS adds a new feature to EC2, or when I need to change how I correlate EC2 instances with their security groups, the change ripples across service boundaries. Functional decomposition couples your architecture to your requirements. When requirements change, the architecture breaks.

AwsViz uses volatility-based decomposition, rooted in the IDesign Method. Instead of asking "what does the system do?" I asked "what might change?" and encapsulated each answer in its own component.

## Identifying the Axes of Change

Before writing a single line of code, I sat down and listed every dimension of the system that could independently change over time. Not features. Not user stories. Axes of volatility.

I identified 16:

| #   | What Changes                                                | How Often  |
| --- | ----------------------------------------------------------- | ---------- |
| V1  | AWS service coverage (new resource types)                   | High       |
| V2  | Relationship inference rules (how resources connect)        | Medium     |
| V3  | CloudWatch metric definitions                               | Medium     |
| V4  | Health evaluation rules                                     | Medium     |
| V5  | Cost calculation logic                                      | Low-Medium |
| V6  | Presentation form factor (TUI vs Web)                       | Low        |
| V7  | Graph layout algorithm                                      | Medium     |
| V8  | Authentication method (SSO, role assumption)                | Low-Medium |
| V9  | Data source technology (SDK vs Config vs Resource Explorer) | Low        |
| V10 | Persistence technology (memory vs SQLite vs future DB)      | Low        |
| V11 | Caching strategy                                            | Medium     |
| V12 | Export format (JSON, CSV, SVG)                              | Low        |
| V13 | Graph filtering and query DSL                               | Medium     |
| V14 | Security analysis rules                                     | High       |
| V15 | Event processing (CloudTrail, change detection)             | Medium     |
| V16 | Rate limiting strategy                                      | Low-Medium |

Some of these cluster together. V1 (service coverage) and V16 (rate limiting) change together because adding a new AWS service provider means configuring its API rate limits. V2 (relationships) and V14 (security rules) both operate on the graph and evolve as analytical capabilities expand.

These clusters informed the component boundaries.

## The Component Taxonomy

IDesign defines four component types, each encapsulating a specific type of volatility:

**Managers** encapsulate workflow. They know _when_ to do things, not _how_. RefreshManager knows the refresh cycle: discover, enrich, build graph, publish snapshot. It does not know how to discover EC2 instances or calculate cost projections.

**Engines** encapsulate business logic. They know _how_ to compute things, not _where_ the data comes from. SecurityEngine knows how to analyze a graph for anti-patterns. It receives data as parameters and returns findings. No I/O. No external calls. Pure computation.

**Accessors** encapsulate resource access. They know _where_ data lives, not _what_ it means. Ec2Accessor calls the EC2 API, normalizes the response into domain types, and returns them. It does not decide whether a security group is dangerous.

**Clients** encapsulate presentation. They know _how to render_, not _what to render_. The TUI client and the React web app consume the same projections. Swap one for the other, nothing else changes.

The strict rule: Clients call Managers. Managers call Engines and Accessors. Never reverse. Never skip layers.

## Applied to AwsViz

Here is how the taxonomy maps to the actual codebase:

### Managers (Orchestration)

```
RefreshManager        - refresh cycle (V11: caching, timing, incremental vs full)
  DiscoveryManager    - discovery workflow (V1: which services to scan)
  EnrichmentManager   - enrichment workflow (V3+V4+V5: metrics, health, cost)
  GraphManager        - graph construction (V2: relationship building)
AuthManager           - credential workflow (V8: auth method)
ExportManager         - export workflow (V12: format selection)
```

RefreshManager is a coordinating Manager. It directly orchestrates sub-Managers because they share a strict sequential workflow. This is a documented exception to the cross-Manager rule, where normally inter-Manager coordination uses the event bus.

### Engines (Business Logic)

```
ServiceDiscoveryEngine - V1: routes discovery to the correct provider per service type
RelationshipEngine     - V2: infers edges between discovered resources
GraphFilterEngine      - V13: applies filter/group/zoom to the graph
CostEngine             - V5: cost aggregation, projection, enrichment
SecurityEngine         - V14: anti-pattern detection (open SGs, public S3, missing DLQs)
ExportEngine           - V12: serialization to different formats
```

Every Engine is pure. No I/O, no external calls, no injected Accessors. They accept data as parameters and return results. This makes them trivially testable. SecurityEngine has 13 unit tests, none of which require mocks, because there is nothing to mock. You pass a graph in, you get findings out.

### Accessors (Resource Access)

```
Ec2Accessor     - V1+V9: EC2 API (instances, security groups, VPCs, subnets)
S3Accessor      - V1+V9: S3 API (buckets, public access blocks)
LambdaAccessor  - V1+V9: Lambda API (functions, configurations)
RdsAccessor     - V1+V9: RDS API (instances, clusters)
SqsAccessor     - V1+V9: SQS API (queues, DLQ configuration)
SnsAccessor     - V1+V9: SNS API (topics, subscriptions)
DynamoDbAccessor - V1+V9: DynamoDB API (tables)
EcsAccessor     - V1+V9: ECS API (clusters, services, tasks)
CostExplorerAccessor - V5+V9: Cost Explorer + Budgets APIs
StsAccessor     - V8: STS API (caller identity, role assumption)
CredentialAccessor - V8: AWS credential chain resolution
SnapshotAccessor - V10: SQLite persistence for graph snapshots
```

Accessors return raw domain types. Ec2Accessor returns `AwsResource` records with normalized metadata. It does not decide whether a security group is open to the world. That is SecurityEngine's job. CostExplorerAccessor returns `ServiceCostEntry` records with raw dollar amounts. It does not calculate percentages or infer service types. That is CostEngine's job.

This separation was learned the hard way. An early version had the CostExplorerAccessor calling CostEngine internally to enrich its own results. That violated the dependency direction (Accessors must never call Engines) and created a circular dependency. The fix: return raw data from the Accessor, let the Manager pass it to the Engine for enrichment.

### Infrastructure (Cross-cutting)

```
EventBus              - In-memory pub/sub for cross-Manager coordination
ProjectionRebuilder   - Rebuilds read models when snapshots change
ProjectionStore       - Thread-safe storage for pre-built projections
SseBroadcaster        - Pushes projection updates to SSE subscribers
SqliteAccessor        - SQLite persistence for events and snapshots
AwsRateLimiter        - Per-service token bucket rate limiting
```

Infrastructure is the "utility closet." These components have side effects, state, or event subscriptions that do not fit the Manager/Engine/Accessor taxonomy. Each one is explicitly justified. The EventBus exists because Managers must not call each other directly. The ProjectionRebuilder exists because read models must be pre-built for zero-allocation query paths.

## The Data Flow

A complete refresh cycle:

```
RefreshManager publishes DiscoveryStartedEvent
  DiscoveryManager -> ServiceDiscoveryEngine -> [9 Accessors in parallel]
  -> Assembles AwsEnvironmentGraph (immutable snapshot)
  -> Publishes SnapshotReadyEvent

ProjectionRebuilder receives SnapshotReadyEvent
  -> GraphProjectionBuilder transforms graph to serialization-friendly DTO
  -> SecurityProjectionBuilder runs SecurityEngine.Analyze(graph)
  -> Stores projections in ProjectionStore
  -> Publishes ProjectionsRebuiltEvent

SseBroadcaster receives ProjectionsRebuiltEvent
  -> Serializes projections to JSON
  -> Pushes to all subscribed SSE clients

React client receives SSE event
  -> TanStack Query cache updated via useSseSubscription hook
  -> Components re-render with fresh data
```

Notice: every component does exactly one job. The SecurityEngine does not know about SSE. The SseBroadcaster does not know about security. The React client does not know about AWS APIs. Each component encapsulates its volatility and nothing else.

## Why This Matters

Three weeks after the initial architecture, AWS SDK updated the EC2 API response format. The change was contained entirely within Ec2Accessor. Nothing else noticed.

Two weeks later, I added security analysis. New engine (SecurityEngine), new projection builder (SecurityProjectionBuilder), registered in DI, done. The SSE pipeline picked it up automatically because the ProjectionRebuilder iterates over all registered IProjectionBuilder implementations. No existing code was modified except adding two DI registrations.

That is the payoff of volatility-based decomposition. The architecture absorbs change because each change is pre-allocated to a specific vault.

## The Numbers

As of today:

- 6 Managers, 6 Engines, 16 Accessors, 7 Infrastructure components
- 933 tests, 0 failures
- 5 web client pages, all code-split and lazy-loaded
- 5 SSE streams (graph, cost, security, resources, health)
- Zero external runtime dependencies

The next post covers how AI-assisted development made it possible for a single architect to build and maintain this system, while keeping the documentation and architecture in sync.

---

_This is part 2 of a series on building AwsViz. Previous: [Why the AWS Console Is Not Enough](/2026/01/28/why-the-aws-console-is-not-enough). Next: [Documentation-First Development with AI: How Ideas Become Architecture](/2026/02/09/documentation-first-development-with-ai)_
