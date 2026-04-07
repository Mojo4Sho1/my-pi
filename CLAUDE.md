# CLAUDE.md

All project guidance for AI agents lives in **[AGENTS.md](AGENTS.md)**. Read that file first -- it covers architecture, conventions, development commands, key files, and gotchas.

This file contains only Claude-specific instructions.

## Claude-Specific Guidance

- If the implementation plan (`docs/IMPLEMENTATION_PLAN.md`) already has detailed specs (types, function signatures, file changes), **skip plan mode and execute directly**. Plan mode adds significant token overhead and provides no value when the plan already exists.
- If the plan is vague or leaves open questions, use plan mode to resolve them.
