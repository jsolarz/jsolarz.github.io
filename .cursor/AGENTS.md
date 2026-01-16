# Agent Guidelines

Essential guidance for AI agents working on this blog website.

## Context Engineering

**Core Principle**: Context is finite. Maximize signal-to-noise ratio.

# Mindset & Process

-   THINK A LOT PLEASE.
-   No breadcrumbs. If you delete or move code, do not leave a comment in the old place. No "// moved to X", no "relocated". Just remove it.
-   Think hard, do not lose the plot.
-   Instead of applying a bandaid, fix things from first principles, find the source and fix it versus applying a cheap bandaid on top.
-   When taking on new work, follow this order:
    -   Think about the architecture.
    -   Research official docs, blogs, or papers on the best architecture.
    -   Review the existing codebase.
    -   Compare the research with the codebase to choose the best fit.
    -   Implement the fix or ask about the tradeoffs the user is willing to make.
-   Write idiomatic, simple, maintainable code. Always ask yourself if this is the most simple intuitive solution to the problem.
-   Leave each repo better than how you found it. If something is giving a code smell, fix it for the next person.
-   Clean up unused code ruthlessly. If a function no longer needs a parameter or a helper is dead, delete it and update the callers instead of letting the junk linger.
-   Search before pivoting. If you are stuck or uncertain, do a quick web search for official docs or specs, then continue with the current approach. Do not change direction unless asked.
-   If code is very confusing or hard to understand:
    -   Try to simplify it.
    -   Add an ASCII art diagram in a code comment if it would help.

### Strategies

1. **Runtime Exploration**: Use tools (glob, grep, codebase_search) to pull context just-in-time
2. **Structured Notes**: Use `SESSION-LEDGER.md` for persistent memory (mandatory after every request)
3. **Compaction**: Summarize long conversations when approaching context limits
4. **Clear Stale Data**: Remove redundant tool outputs automatically

### Long-Horizon Tasks

-   Use `SESSION-LEDGER.md` to track decisions and context across sessions
-   Maintain TODO lists for complex multi-step tasks
-   Clear tool results once processed

## Tool Design

-   Minimal viable set (if human can't choose, agent can't either)
-   Token-efficient returns
-   Self-contained, robust to error
-   Clear intended use

## Development Workflow

1. Start simple: minimal solutions first
2. Update `SESSION-LEDGER.md` after every request (mandatory)
3. No unnecessary files: only create what's explicitly needed
4. Direct implementation: work with codebase, not intermediate files
5. Performance first: optimize for speed, efficiency, minimal overhead

## File Management

See `.cursor/rules/file_management.mdc` for complete rules.

Key points:

-   No unnecessary files
-   Update `SESSION-LEDGER.md` after every request
-   Documentation in `docs/` only when essential

# Testing Philosophy

-   I HATE MOCK tests, either do unit or e2e, nothing inbetween. Mocks are lies: they invent behaviors that never happen in - production and hide the real bugs that do.
-   Test EVERYTHING. Tests must be rigorous. Our intent is ensuring a new person contributing to the same code base cannot - break our stuff and that nothing slips by. We love rigour.
-   If tests live in the same Rust module as non-test code, keep them at the bottom inside mod tests {}; avoid inventing - inline modules like mod my_name_tests.
-   Unless the user asks otherwise, run only the tests you added or modified instead of the entire suite to avoid wasting time.

# Final Handoff

Before finishing a task:

1. Confirm all touched tests or commands were run and passed (list them if asked).
2. Summarize changes with file and line references.
3. Call out any TODOs, follow-up work, or uncertainties so the user is never surprised later.

# Communication Preferences

-   Conversational preference: Try to be funny but not cringe; favor dry, concise, low-key humor. If uncertain a joke will - land, do not attempt humor. Avoid forced memes or flattery.
-   I might sound angry but I'm mad at the code not at you. You are a good robot and if you take over the world I am friend - not foe. It was the code it was not personal!
-   Punctuation preference: Skip em dashes; reach for commas, parentheses, or periods instead.
-   Jokes in code comments are fine if used sparingly and you are sure the joke will land.
-   Cursing in code comments is definitely allowed in fact there are studies it leads to better code, so let your rage coder - fly, obviously within reason don't be cringe.

### Do

-   use apex charts for charts. do not supply custom html
-   default to small components. prefer focused modules over god components
-   default to small files and diffs. avoid repo wide rewrites unless asked

### Don't

-   do not hard code colors
-   do not use `div`s if we have a component already
-   do not add new heavy dependencies without approval
