# OPERATING_MODEL.md

## Purpose

Structural overview of how the repository's operating layers fit together.

## Layer map

1. `docs/PROJECT_FOUNDATION.md`: stable project intent and scope boundaries.
2. `docs/CANONICAL_DECISIONS.md`: durable canonical decisions that survive across loops.
3. `docs/ORCHESTRATION_MODEL.md`: object vocabulary and control hierarchy.
4. `docs/WORKFLOW.md`: orchestrator operating procedure.
5. `docs/IMPLEMENTATION_PLAN.md`: staged build strategy translating foundation into ordered implementation.
6. `docs/handoff/*`: live state continuity artifacts.
7. specs: durable technical truth for implementation details.
8. `templates/*`: generation contracts and routing.
9. `seeds/*`: reusable bootstrap context packs.
10. `agents/*`: orchestrator, specialist, team, and sequence definitions, governed by `agents/AGENT_DEFINITION_CONTRACT.md`.

## Access model reminder

Only orchestrator-class actors have broad default routing.
Downstream actors are narrow by default.

## Update rule

Update this document when operating layers are added, removed, or materially restructured.
