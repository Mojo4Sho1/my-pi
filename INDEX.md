# INDEX.md

Directory map for the `my-pi` repository.

## Root files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Pi auto-read behavioral guide |
| `CLAUDE.md` | Development context for Claude Code |
| `STATUS.md` | Current project state and queued work |
| `DECISION_LOG.md` | Durable project decisions |
| `package.json` | Pi package manifest |
| `tsconfig.json` | TypeScript configuration |

## Directories

| Directory | Purpose |
|-----------|---------|
| `extensions/` | Pi extensions — orchestrator, specialists, shared types. **Main build target.** |
| `agents/` | Agent definition specs (markdown). These are the contracts that extensions implement. |
| `docs/` | Architectural reference: project foundation, orchestration model, implementation plan, Pi extension API reference. |
| `skills/` | Pi skills (future) |
| `prompts/` | Pi prompts (future) |
| `themes/` | Pi themes |
| `tests/` | Validation and tests |
