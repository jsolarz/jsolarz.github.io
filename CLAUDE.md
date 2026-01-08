# Context Engineering

Lean context management for efficient AI assistance.

## Principles

1. **Context Window Awareness**: Every token depletes attention budget
2. **Maximize Signal-to-Noise**: Include only high-signal tokens
3. **Dynamic Retrieval**: Use tools to pull context just-in-time
4. **Clear Stale Data**: Automatically remove outdated information
5. **Persist Critical Info**: Use `SESSION-LEDGER.md` for long-term memory

## Strategies

### For This Project

- Use `codebase_search` and `grep` for runtime exploration
- Reference `.cursor/rules/` for behavior guidelines
- Update `SESSION-LEDGER.md` after every request
- Clear tool results once processed
- Prefer targeted edits over full file rewrites

### Context Organization

- Distinct sections: background, instructions, tool guidance
- Minimal set that fully outlines expected behavior
- Right altitude: specific enough to guide, flexible enough to adapt

### Memory

- `SESSION-LEDGER.md`: Mandatory persistent memory (see `.cursor/rules/01_session_ledger.mdc`)
- Track decisions, rationale, and context across sessions
- Maintain project state without context overload

## Best Practices

- Treat context as finite resource
- Use tools for just-in-time retrieval
- Measure effectiveness, detect context dilution
- Persist critical information outside context window
