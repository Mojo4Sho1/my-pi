# _ARTIFACTS_INDEX.md

## Purpose

Routing file for runtime and session-scoped artifacts under `artifacts/`.

This root is for outputs produced by a run. It is not a durable spec root and it is not the same thing as the explanatory docs tree.

## Distinction from Other Roots

- `specs/` holds durable, factory-style configuration and authoring structure.
- `docs/` holds durable human-facing architecture, conventions, and methodology.
- `artifacts/` holds run-scoped outputs such as session records and future validation outputs.

## Current Layout

| Path | Purpose |
|---|---|
| `artifacts/team-sessions/` | Placeholder root for router-owned team session artifacts |
| `artifacts/validation/` | Placeholder root for per-run validation outputs |

## Truthfulness Note

- Existing methodology docs under `docs/validation/` stay in `docs/` for now.
- `artifacts/validation/` is reserved for future run outputs, not for durable methodology.
- Creating this directory does not mean runtime artifact writing has been moved or expanded already.
