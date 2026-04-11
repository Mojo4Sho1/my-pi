# _ONBOARDING_INDEX.md

## Purpose

Routing file for declarative onboarding manifests under `specs/onboarding/`.

Use this directory when the task is about onboarding profiles, layer-by-layer source lists, or future manifest-backed context assembly.

## Relationship to Policies

- `specs/policies/` defines the default rules and breadth expectations.
- `specs/onboarding/` defines concrete manifests that follow those policy defaults for specific actor classes.
- These manifests are durable scaffolding today. They do not mean automated runtime loading already exists.

## Current Manifests

| File | Purpose |
|---|---|
| `specs/onboarding/orchestrator.yaml` | Broader-but-bounded onboarding manifest for the orchestrator |
| `specs/onboarding/specialist-default.yaml` | Narrow default onboarding manifest for specialists |

## Working Rule

When the task is about onboarding profiles:

1. read this index
2. read the relevant manifest
3. check `specs/policies/onboarding-policy.yaml` for the shared defaults
4. confirm any runtime-behavior claim against `docs/LAYERED_ONBOARDING.md` and the TypeScript implementation
