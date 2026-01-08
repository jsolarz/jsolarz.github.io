# Agent Guidelines

Essential guidance for AI agents working on this blog website.

## Context Engineering

**Core Principle**: Context is finite. Maximize signal-to-noise ratio.

### Strategies

1. **Runtime Exploration**: Use tools (glob, grep, codebase_search) to pull context just-in-time
2. **Structured Notes**: Use `SESSION-LEDGER.md` for persistent memory (mandatory after every request)
3. **Compaction**: Summarize long conversations when approaching context limits
4. **Clear Stale Data**: Remove redundant tool outputs automatically

### Long-Horizon Tasks

- Use `SESSION-LEDGER.md` to track decisions and context across sessions
- Maintain TODO lists for complex multi-step tasks
- Clear tool results once processed

## Tool Design

- Minimal viable set (if human can't choose, agent can't either)
- Token-efficient returns
- Self-contained, robust to error
- Clear intended use

## Development Workflow

1. Start simple: minimal solutions first
2. Update `SESSION-LEDGER.md` after every request (mandatory)
3. No unnecessary files: only create what's explicitly needed
4. Direct implementation: work with codebase, not intermediate files
5. Performance first: optimize for speed, efficiency, minimal overhead

## File Management

See `.cursor/rules/file_management.mdc` for complete rules.

Key points:
- No unnecessary files
- Update `SESSION-LEDGER.md` after every request
- Documentation in `docs/` only when essential
