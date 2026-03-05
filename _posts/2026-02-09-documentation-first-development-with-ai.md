# Documentation-First Development with AI: How Ideas Become Architecture

I have a confession that will sound strange coming from someone who uses AI-assisted development daily: I prefer to read the manual.

I am not a "vibe coder." I do not open an IDE, describe what I want in natural language, and accept whatever comes out. That approach produces code that works but cannot be maintained, extended, or explained to someone else six months later. It produces software without architecture.

What I do instead is write the architecture first, document the decisions, define the interfaces, and then use AI as an implementation partner that operates within those constraints. The documentation is the source of truth. The AI enforces it.

This post is about that workflow and why it produces better results than either pure manual development or pure AI generation.

## The Documentation-First Principle

Every feature in AwsViz starts the same way:

1. **Volatility analysis.** What axis of change does this feature address? If I cannot name the volatility, the feature does not get a component.
2. **Interface definition.** What is the contract? What goes in, what comes out? The interface is defined in the Contracts project before any implementation exists.
3. **Architecture documentation.** Which component taxonomy does this belong to? Manager, Engine, or Accessor? What does it orchestrate, compute, or access?
4. **Implementation.** Now, and only now, do I write code.

This is not theoretical. The security analysis feature I built last week followed this exact path:

- Volatility: V14 (security analysis rules change frequently as new checks are added)
- Interface: `ISecurityEngine` with a single method: `IReadOnlyList<SecurityFinding> Analyze(AwsEnvironmentGraph graph)`
- Taxonomy: Engine (pure computation, no I/O)
- Implementation: 5 checks, 13 tests, wired into the projection pipeline

The entire feature, from model definition to SSE streaming to a React page with severity filters, was built in a single session. But it was built fast because the architecture already had a slot for it. The projection pipeline pattern was documented. The SSE integration pattern was documented. The Engine-must-be-pure constraint was documented. I did not have to make architectural decisions during implementation because they were already made.

## How AI Fits In

I use Cursor with Claude as my development environment. Cursor is not autocomplete with marketing. It reads my entire codebase, including the architecture documentation, the volatility analysis, the interface definitions, and a comprehensive set of rules that encode the architectural constraints.

Here is what my `.cursor/rules/` directory contains:

- **IDesign Method orchestrator:** Routes to the correct phase-specific rule based on SDLC stage
- **Architecture layer structure:** Defines the dependency rules (Clients -> Managers -> Engines/Accessors -> Contracts, never reverse)
- **Communication style rules:** How to talk to me (concise, expert-level, no hand-holding)
- **Code documentation standards:** What goes in comments and what does not
- **Session ledger requirements:** Log every action for continuity across sessions

These rules mean the AI operates within architectural constraints. When I ask it to implement SecurityEngine, it already knows:

- Engines are pure. No I/O, no injected Accessors.
- Engines accept data as parameters and return results.
- Engines are `internal sealed class` with a `public interface` in Contracts.
- Tests for Engines require zero mocks.

The AI does not invent the architecture. It implements within it. The difference is fundamental.

## The Session Ledger

One of the most valuable practices I adopted is the session ledger. Every interaction with the AI is logged: what was requested, what was done, what files were modified, what decisions were made. This serves two purposes:

1. **Continuity.** When I start a new session, the AI reads the ledger and picks up exactly where we left off. No context loss, no repeated explanations.
2. **Audit trail.** I can look back and understand why every decision was made. This is documentation that writes itself during development.

The ledger also captures lessons learned. When the AI made a mistake (injecting an Accessor into an Engine, using synchronous `.Result` in an async context, adding a `--trailer "Made-with: Cursor"` to git commits), those patterns were captured as rules to prevent recurrence.

## The Learning Loop

Here is the loop that makes this work:

```
Document the architecture
  -> Define interfaces
  -> AI implements within constraints
  -> Tests verify behavior
  -> Mistakes get captured as rules
  -> Rules prevent recurrence
  -> Architecture documentation stays current
```

The key insight is that documentation is not a byproduct of development. It is the input. The architecture docs are not written after the code; they are written before. The code is the implementation of the documentation, not the other way around.

When the AI produces code that violates an architectural constraint (and it does, regularly), the violation is caught by:

- Build-time analysis (the project has strict analyzers, formatting rules, and nullable reference types)
- Test failures (933 tests catch behavioral regressions)
- My review (I read every line the AI produces)

The violation is then captured as a lesson and encoded as a rule. Over time, the rule set becomes a comprehensive expression of the project's architectural intent. New AI sessions operate with the accumulated wisdom of every past session.

## What This Is Not

This is not "prompt engineering." I am not crafting clever prompts to trick the AI into producing good code. I am building a system of constraints (documentation, rules, interfaces, tests) that make it difficult for the AI to produce bad code.

This is also not "the AI writes the architecture." I write the architecture. The AI writes the implementation. These are different cognitive tasks. Architecture requires understanding trade-offs, anticipating change, and making decisions with incomplete information. Implementation requires translating a well-defined spec into working code. AI is good at the second task. It is not good at the first.

The combination is powerful because each participant does what it does best. I decide what to build and how it should be structured. The AI translates those decisions into code faster than I could type it manually, while maintaining consistency with patterns established across 933 tests and 35+ source files.

## For the Documentation-Savvy

If you, like me, prefer reading documentation over watching tutorials, and writing specs over sketching on whiteboards, this workflow is a natural fit. The documentation is not overhead. It is the primary artifact. The code is a verified implementation of the documentation.

Every lesson learned during development gets captured. Every architectural decision has a rationale. Every component has a documented volatility justification. When I come back to this project in six months, or when someone else picks it up, the documentation tells the complete story of why the system is shaped the way it is.

That is not something vibe coding produces.

---

_This is part 3 of a series on building AwsViz. Previous: [Architecture for Change: Volatility-Based Decomposition](/2026/03/10/architecture-for-change-volatility-based-decomposition). Next: [The One-Page Dashboard: Why TUI Apps Still Matter](/2026/03/24/the-one-page-dashboard-why-tui-apps-still-matter)_
