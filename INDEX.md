# INDEX.md

Bootstrap router for the `my-pi` repository.

Use this file to choose the next smallest routing document. Do not treat it as a reason to read broad parts of the repo by default.

## Default startup path

1. `AGENTS.md`
2. `INDEX.md`
3. the nearest relevant local index
4. only the specific file or section needed for the task

`INDEX.md` is the root bootstrap exception to the repo's underscore-prefixed index naming convention. Other index files use explicit names such as `_DOCS_INDEX.md`.

## Route from here

| If you need... | Read next | Notes |
|---|---|---|
| documentation routing | `docs/_DOCS_INDEX.md` | Main router for the docs tree |
| agent-definition routing | `agents/_AGENTS_INDEX.md` | Main router for orchestrator/specialist/team definitions |
| current project state | `STATUS.md` | Live execution and roadmap state |
| durable decisions | `DECISION_LOG.md` | Canonical decision ledger |
| repo navigation rules | `docs/REPO_CONVENTIONS.md` | Naming, routing, and truthfulness conventions |

## Root files

| File | Purpose |
|---|---|
| `AGENTS.md` | Auto-read behavioral guide plus repo-specific working rules |
| `CLAUDE.md` | Claude-specific pointer/context, if present |
| `STATUS.md` | Current project state and queued work |
| `DECISION_LOG.md` | Durable project decisions |
| `package.json` | Pi package manifest |
| `tsconfig.json` | TypeScript configuration |

## Directories

| Directory | Purpose | Read first |
|---|---|---|
| `extensions/` | Pi extensions and internal TypeScript libraries. Main build target. | task-relevant source files only |
| `agents/` | Agent definition specs that the extensions implement. | `agents/_AGENTS_INDEX.md` |
| `docs/` | Architecture, roadmap, validation, and handoff docs. | `docs/_DOCS_INDEX.md` |
| `skills/` | Pi skills (future) | task-relevant files only |
| `prompts/` | Pi prompts (future) | task-relevant files only |
| `themes/` | Pi themes | task-relevant files only |
| `tests/` | Validation and tests | task-relevant test files only |
