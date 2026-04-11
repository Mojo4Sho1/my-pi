# _POLICIES_INDEX.md

## Purpose

Routing file for durable policy configuration under `specs/policies/`.

Use this directory for machine-first policy defaults that shape how the repo should package context or interpret stable configuration. This is factory configuration, not a per-run artifact area.

## Authority

- Policies here are durable configuration inputs for the onboarding model.
- They describe intended defaults and routing rules; they do not prove runtime manifest loading already exists.
- Current runtime authority still lives in TypeScript until future loading code is implemented.

## Current Policies

| File | Purpose |
|---|---|
| `specs/policies/onboarding-policy.yaml` | Default layered-onboarding rules for orchestrator, specialists, and team-state execution |

## Working Rule

When the task is about onboarding defaults or profile breadth:

1. read this index
2. read `specs/policies/onboarding-policy.yaml`
3. confirm any runtime-enforcement question against the current TypeScript implementation and `docs/LAYERED_ONBOARDING.md`
