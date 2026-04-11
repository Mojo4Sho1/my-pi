# _SPECS_INDEX.md

## Purpose

Routing file for the durable `specs/` tree.

Use this file when the task is about YAML authoring structure, concrete specialist/team specs, or the future source-of-truth authoring layer introduced during Stage 5a.7.

## Authority

- `specs/` is durable authoring/spec territory.
- `docs/design/` remains proposal and redesign territory.
- Current runtime authority still lives in TypeScript until YAML loading is implemented in a later stage.

## Start Here

| If you need... | Read next | Why |
|---|---|---|
| the concrete YAML schema and authoring rules | `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` | Durable reference for YAML structure decisions |
| onboarding policy defaults | `specs/policies/_POLICIES_INDEX.md` | Routes to factory-configuration policies for layered onboarding |
| onboarding manifests and profile scaffolding | `specs/onboarding/_ONBOARDING_INDEX.md` | Routes to declarative onboarding manifests under `specs/` |
| a reusable specialist spec example | `specs/specialists/SPECIALIST_TEMPLATE.yaml` | Shows the full specialist shape with illustrative values |
| a reusable team spec example | `specs/teams/TEAM_TEMPLATE.yaml` | Shows the full team shape with illustrative values |
| the canonical starter team spec | `specs/teams/build-team.yaml` | Concrete Stage 5a.7 build-team authoring spec |

## Directory Layout

| Path | Purpose |
|---|---|
| `specs/schemas/` | Durable schema/reference documents for authoring structures |
| `specs/policies/` | Factory-configuration policy files for layered onboarding defaults |
| `specs/onboarding/` | Declarative onboarding manifests for orchestrator and specialist profiles |
| `specs/specialists/` | Reusable and concrete specialist YAML specs |
| `specs/teams/` | Reusable and concrete team YAML specs |

## Current Working Rule

When YAML structure questions arise:

1. read this index
2. read `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`
3. read the smallest relevant template or concrete spec
4. confirm any runtime-mapping question against the current TypeScript implementation
