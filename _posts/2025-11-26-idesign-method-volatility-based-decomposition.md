# IDesign Method: Designing for Change, Not Requirements

## Introduction

Most software architecture fails because it's designed around the wrong thing. We design around requirements, user stories, or data models—things that change constantly. When requirements change (and they always do), the architecture breaks.

I've been working with the IDesign Method for the past year, and it's fundamentally changed how I think about architecture. Instead of designing around what the system does, IDesign teaches you to design around what might change.

This post explores volatility-based decomposition—the core principle behind IDesign—and how it creates architectures that evolve gracefully instead of breaking when requirements change.

## The Classic Mistake

Traditional architecture decomposes systems based on functionality:

- "We need a Sales Service"
- "We need a Shipping Service"
- "We need a Payment Service"

This seems logical. Each service handles a specific business function. But here's the problem: requirements change constantly. When business needs evolve, these functionally-decomposed services break.

**Example**: The business decides to change how shipping works. Maybe they switch carriers, or add new shipping options, or integrate with a new logistics platform. In a functionally-decomposed system, this change ripples through multiple services. The Shipping Service changes, but so does the Order Service (which calls Shipping), the Payment Service (which needs shipping costs), and the Notification Service (which sends shipping updates).

One requirement change breaks multiple services. This is architectural fragility.

## The IDesign Insight

IDesign flips the question. Instead of asking "What does the system do?", ask "What might change?"

- The database technology might change (PostgreSQL → MongoDB)
- The business rules might change (new validation logic)
- The workflow might change (different approval steps)
- The external integration might change (different API provider)

Each of these is a **volatility axis**—a dimension along which the system might evolve. IDesign teaches you to encapsulate each volatility axis in its own component.

When a change occurs, it's contained within one component. The rest of the system doesn't break.

## Volatility-Based Decomposition

### The Vault Metaphor

Think of your architecture as a series of vaults. Each vault encapsulates one type of volatility. When a change occurs, it's contained within one vault. The other vaults remain untouched.

**Example**: You're building a document processing system. The business rules for extracting metadata might change (new fields, different validation). The storage mechanism might change (local files → S3 → Azure Blob). The workflow might change (different approval steps).

Each of these is a separate vault:
- **Metadata Extraction Engine**: Encapsulates extraction algorithm volatility
- **Document Storage Accessor**: Encapsulates storage mechanism volatility
- **Document Processing Manager**: Encapsulates workflow volatility

When the business adds a new metadata field, only the Metadata Extraction Engine changes. When you migrate to S3, only the Document Storage Accessor changes. When approval workflow changes, only the Document Processing Manager changes.

### Component Taxonomy

IDesign defines a strict component taxonomy based on volatility type:

**Managers** (Process Volatility - "When"):
- Encapsulate workflow and orchestration
- Know when to do things, not how
- Example: Document Processing Manager orchestrates upload → extraction → validation → approval

**Engines** (Logic Volatility - "How"):
- Encapsulate business rules and algorithms
- Know how to do things, not when
- Example: Metadata Extraction Engine knows how to extract fields using AI

**Accessors** (Resource Volatility - "Where"):
- Encapsulate external resources (databases, APIs, storage)
- Know where data lives, not what it means
- Example: Document Storage Accessor knows how to store files in S3

**Utilities** (Infrastructure Volatility):
- Encapsulate cross-cutting concerns
- Shared by all components
- Example: Logging Utility, Identity Utility

This taxonomy isn't arbitrary—it's based on volatility. Managers change when workflows change. Engines change when business rules change. Accessors change when storage technology changes.

## Closed Architecture

IDesign enforces a **closed architecture** pattern:

- Managers can call Engines and Accessors
- Engines can receive data as parameters (but typically don't call Accessors directly)
- Accessors are independent (don't call each other)
- No cross-tier calls (Engines don't call Engines, Accessors don't call Accessors)

This creates a clear dependency flow: Managers → Engines → Accessors.

**Why?** Volatility decreases top-down. Workflows change more often than business rules. Business rules change more often than storage technology. By enforcing this dependency flow, changes ripple downward, not upward.

**Example**: If you need to change how documents are stored (Accessor volatility), it doesn't affect business logic (Engine) or workflows (Manager). The change is isolated.

## Real-World Example: Search Feature

Let's see how volatility-based decomposition works in practice.

**Requirement**: Users need to search for documents using metadata filters.

**Traditional Approach**: Create a Search Service that handles everything—filtering, ranking, database queries.

**IDesign Approach**: Identify volatilities:

1. **Search Algorithm Volatility**: How we search might change (semantic search → full-text → hybrid)
   - **Component**: Search Engine (Engine)
   - **Encapsulates**: Search algorithm changes

2. **Database Schema Volatility**: Database structure might change (new indexes, different schema)
   - **Component**: Document Metadata Accessor (Accessor)
   - **Encapsulates**: Database access changes

3. **Workflow Volatility**: Search workflow might change (add caching, change ranking logic)
   - **Component**: Search Manager (Manager)
   - **Encapsulates**: Workflow orchestration changes

**Result**: When we switch from PostgreSQL to Elasticsearch, only the Document Metadata Accessor changes. When we improve ranking algorithms, only the Search Engine changes. When we add caching, only the Search Manager changes.

Each change is isolated. The architecture evolves gracefully.

## The Benefits

### Resilience to Change

By encapsulating volatility, changes are isolated. When requirements change, only the affected component changes. The rest of the system remains stable.

### Predictable Architecture

The component taxonomy (Managers, Engines, Accessors) creates a predictable structure. New developers can quickly understand where code belongs.

### Parallel Development

Clear contracts and isolated components enable parallel development. Multiple developers can work on different components simultaneously.

### Testability

Engines are pure business logic—they accept data as parameters and return results. No I/O, no external dependencies. Easy to test.

Accessors are simple—they just perform I/O operations. Easy to mock.

Managers orchestrate—they coordinate Engines and Accessors. Easy to test with mocks.

## The Trade-offs

Volatility-based decomposition isn't free:

**More Components**: You might have more components than a functionally-decomposed system. But each component is smaller and more focused.

**Upfront Analysis**: You need to identify volatilities before implementation. But this upfront investment prevents rework later.

**Learning Curve**: The taxonomy and patterns take time to learn. But once learned, they create predictable, maintainable architectures.

## Key Takeaways

- **Design around volatility, not requirements**: Requirements change constantly. Volatility axes are more stable.
- **Encapsulate each volatility in its own component**: When a change occurs, it's isolated.
- **Use component taxonomy**: Managers (when), Engines (how), Accessors (where) based on volatility type.
- **Enforce closed architecture**: Clear dependency flow prevents change propagation.
- **Isolate changes**: Each component encapsulates one type of change.

## Conclusion

IDesign Method isn't about following rules—it's about designing for change. By identifying what might change and encapsulating each volatility axis, you create architectures that evolve gracefully instead of breaking when requirements change.

For enterprise systems that need to evolve over years (not months), volatility-based decomposition isn't optional—it's essential.

## What's Next?

This post covered the core principle—volatility-based decomposition. In other posts, I explore how we apply IDesign in practice through spec-driven development, how we maintain architectural integrity with AI-assisted tooling, and how it all fits together.

- **Previous**: [Building Enterprise Systems with Spec-Driven Development](https://ioni.solarz.me/posts/spec-driven-development)
- **Next**: [The Complete Picture: How It All Fits Together](https://ioni.solarz.me/posts/the-complete-picture)
