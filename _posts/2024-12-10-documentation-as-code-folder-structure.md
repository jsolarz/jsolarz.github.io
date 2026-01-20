# Documentation as Code: The Technical Deep Dive

## Introduction

Documentation as Code sounds simple: treat documentation like source code. But the devil is in the details. How do you structure hundreds of documents? How do you maintain consistency? How do you ensure documentation stays current?

Over the past year, I've built a documentation system that processes thousands of pages, maintains semantic indexes, and generates knowledge graphs. This post dives into the technical decisions behind the folder structure, the reasoning for each choice, and how it all fits together.

## The Problem Space

Before diving into solutions, let's understand the problem:

**Scale**: Hundreds of documents covering requirements, architecture, design decisions, implementation details, API specs, and process guides.

**Audience Diversity**: Business stakeholders need high-level overviews. Architects need design decisions. Developers need implementation details. New team members need onboarding guides.

**Change Velocity**: Documentation must evolve with code. When code changes, documentation must change. When requirements change, documentation must change.

**Discoverability**: Finding the right document at the right time is critical. Traditional folder structures fail at scale.

## The Folder Structure

Here's the structure we settled on:

```
docs/
├── 01-requirements/      # Functional requirements and use cases
├── 02-architecture/      # System architecture and design
├── 03-design/            # Feature specifications and plans
├── 04-ui-design/         # Wireframes and UI specifications
├── 05-api/               # API documentation
├── 06-decisions/         # Architecture Decision Records (ADRs)
├── 07-operations/        # Deployment, monitoring, operations
├── 08-testing/           # Test strategies and plans
├── 09-management/        # Project management, tracking
└── 10-resources/         # Process guides, templates, references
```

### Why Numbered Prefixes?

Numbered prefixes (`01-`, `02-`, etc.) serve multiple purposes:

1. **Logical Ordering**: Documents flow from requirements → architecture → design → implementation → operations. The numbers enforce this flow.

2. **Navigation**: When browsing folders, documents appear in logical order. You don't need to remember folder names—the numbers guide you.

3. **Dependency Clarity**: Lower numbers depend on higher numbers. Requirements (01) inform architecture (02). Architecture (02) informs design (03). This creates a clear dependency graph.

4. **Tooling**: Scripts can process documents in order. Indexing, validation, and generation follow the numbered sequence.

**Trade-off**: Numbers create coupling. If you need to reorder, you must rename folders. But this coupling is intentional—it enforces the logical flow.

### Why These Specific Folders?

Each folder serves a distinct purpose:

**01-requirements/**: Functional requirements, use cases, user stories. This is the "what" of the system. Everything else flows from here.

**02-architecture/**: System architecture, component design, deployment architecture. This is the "how" at a high level. It defines the structure before implementation.

**03-design/**: Feature specifications, implementation plans, task breakdowns. This is the "how" at a detailed level. Each feature has its own folder with spec.md, plan.md, tasks.md.

**04-ui-design/**: Wireframes, mockups, user journey maps. This is the "what it looks like". Separate from functional requirements because UI evolves independently.

**05-api/**: API documentation, OpenAPI specs, endpoint documentation. This is the "how to integrate". Separate because APIs have their own lifecycle and audience.

**06-decisions/**: Architecture Decision Records (ADRs). This is the "why". Decisions are separate because they explain rationale, not just structure.

**07-operations/**: Deployment, monitoring, alerting, disaster recovery. This is the "how to run". Separate because operations have different concerns than development.

**08-testing/**: Test strategies, test plans, test documentation. This is the "how to verify". Separate because testing has its own lifecycle.

**09-management/**: Project tracking, status reports, meeting minutes. This is the "how to manage". Separate because management concerns are orthogonal to technical concerns.

**10-resources/**: Templates, guides, references. This is the "how to work". Separate because these are meta-documents about the process itself.

### Why Not Flatter?

Why not just put everything in one folder? Or use fewer folders?

**Discoverability**: At scale, flat structures become unmanageable. Finding a specific document requires scrolling through hundreds of files. Folders create natural groupings.

**Context**: Folder names provide context. A document in `03-design/search-engine/` is clearly a design document for the search feature. A document in `06-decisions/` is clearly a decision record.

**Processing**: Scripts can process folders independently. Index requirements separately from architecture. Generate API docs separately from design docs.

**Permissions**: Different folders might have different access controls. Requirements might be public. Operations might be restricted.

### Why Not Deeper?

Why not nest deeper? `docs/requirements/functional/use-cases/`?

**Cognitive Load**: Deep nesting requires remembering long paths. `docs/03-design/search-engine/spec.md` is easier to remember than `docs/design/features/search/engine/specification.md`.

**Tooling**: Shallow structures are easier to process. Scripts don't need to handle arbitrary nesting depths.

**Flexibility**: Shallow structures are easier to reorganize. Moving `03-design/search-engine/` to a different location is simpler than moving deeply nested folders.

**Convention**: Two levels (category → feature) is enough. Categories provide high-level grouping. Feature folders provide specific grouping.

## Feature-Level Structure

Within `03-design/`, each feature has its own folder:

```
03-design/
├── search-engine/
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
├── document-processing/
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
└── ...
```

### Why Three Files Per Feature?

**Separation of Concerns**: Each file serves a different audience and purpose:

- **spec.md**: What to build (user stories, requirements). For stakeholders and future developers.
- **plan.md**: How to build it (components, contracts, data models). For architects and senior developers.
- **tasks.md**: What to do next (implementation tasks). For implementers and project managers.

**Traceability**: Each file traces to different artifacts:
- spec.md → Use cases → Jira Epics/Stories
- plan.md → Components → Code structure
- tasks.md → Tasks → Jira Sub-tasks

**Maintenance**: When requirements change, update spec.md. When architecture changes, update plan.md. When implementation evolves, update tasks.md. Changes are isolated.

### Why Not One File?

**File Size**: Combining everything into one file creates massive documents (thousands of lines). Hard to navigate, hard to review, hard to maintain.

**Review Process**: Different files have different review processes. Specs need stakeholder review. Plans need architecture review. Tasks need technical review.

**Parallel Work**: Multiple people can work on different files simultaneously. Product manager updates spec.md while architect updates plan.md.

## The Technical Implementation

### Markdown as the Format

**Why Markdown?** It's human-readable, machine-processable, version-control friendly, and tool-agnostic. You can read it in a text editor, render it in a browser, process it with scripts, and diff it in Git.

**Trade-offs**: Markdown has limitations (no complex tables, limited formatting). But for documentation, these limitations are acceptable. The simplicity is worth it.

### Semantic Indexing Integration

The folder structure enables semantic indexing:

1. **Category-Level Indexing**: Index each category separately. Requirements index, architecture index, design index. Enables category-specific search.

2. **Feature-Level Indexing**: Index each feature folder separately. Search within a feature, or across features. Enables feature-specific discovery.

3. **Cross-Reference Detection**: Folder structure enables automatic cross-reference detection. `03-design/search-engine/spec.md` references `02-architecture/components.md`. Index can detect and link these.

### Knowledge Graph Generation

The folder structure enables knowledge graph generation:

1. **Entity Extraction**: Folder names become entities. `03-design/search-engine/` → Search Engine entity.

2. **Relationship Detection**: Folder structure reveals relationships. Features in `03-design/` relate to components in `02-architecture/`. Decisions in `06-decisions/` relate to features in `03-design/`.

3. **Dependency Mapping**: Numbered prefixes reveal dependencies. `03-design/` depends on `02-architecture/`. `02-architecture/` depends on `01-requirements/`.

## Validation and Consistency

### Folder Naming Conventions

**Categories**: Use numbered prefixes (`01-`, `02-`, etc.). Use kebab-case for readability (`ui-design`, not `ui_design` or `UIDesign`).

**Features**: Use kebab-case. Match component names where possible (`search-engine`, `document-processing`).

**Files**: Use lowercase with hyphens (`spec.md`, `plan.md`, `tasks.md`). Avoid underscores or camelCase.

### Automated Validation

Scripts validate:
- Folder names match conventions
- Required files exist (`spec.md`, `plan.md`, `tasks.md` in feature folders)
- Cross-references are valid (links to other documents exist)
- Numbered prefixes are sequential (no gaps)

### Consistency Enforcement

Templates ensure consistency:
- All `spec.md` files follow the same structure
- All `plan.md` files follow the same structure
- All `tasks.md` files follow the same structure

This consistency enables:
- Automated processing (scripts know what to expect)
- Easier navigation (developers know where to find things)
- Better search (semantic indexing benefits from consistent structure)

## Evolution and Maintenance

### Adding New Categories

When adding a new category (e.g., `11-security/`):
1. Choose appropriate number (maintains logical flow)
2. Update templates if needed
3. Update indexing scripts
4. Document in README

### Reorganizing Features

When reorganizing features:
1. Move folders (Git tracks moves)
2. Update cross-references
3. Rebuild indexes
4. Update knowledge graph

### Deprecating Documents

When deprecating documents:
1. Move to `_deprecated/` subfolder
2. Add deprecation notice
3. Update cross-references
4. Remove from active indexes (but keep in archive)

## Key Takeaways

- **Numbered prefixes** enforce logical flow and dependency clarity
- **Category folders** provide high-level grouping and context
- **Feature folders** provide specific grouping and organization
- **Three-file structure** (spec, plan, tasks) separates concerns and audiences
- **Markdown format** balances human-readability and machine-processability
- **Consistent naming** enables automated processing and easier navigation
- **Validation scripts** ensure consistency and correctness

## Conclusion

Documentation as Code isn't just about version control—it's about structure, consistency, and tooling. The folder structure I've described isn't arbitrary—every choice serves a purpose. Numbered prefixes enforce flow. Category folders provide context. Feature folders enable organization. Three-file structure separates concerns.

For enterprise systems with hundreds of documents, this structure isn't optional—it's essential. It enables semantic indexing, knowledge graph generation, automated validation, and consistent maintenance.

## What's Next?

This post covered the technical structure. In other posts, I explore how semantic indexing makes this structure searchable, how AI-assisted tooling maintains consistency, and how it all integrates into the development workflow.

- **Previous**: [Documentation as Code: Building a Semantic Knowledge Base](https://ioni.solarz.me/posts/documentation-as-code-semantic-indexing)
- **Next**: [Agentic Documentation: How AI Maintains Consistency](https://ioni.solarz.me/posts/agentic-documentation)
