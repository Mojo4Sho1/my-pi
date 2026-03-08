# OPERATING_MODEL.md

## Purpose

Structural overview of how the repository's operating layers fit together.

## Layer map

1. `docs/PROJECT_FOUNDATION.md`: stable project intent and scope boundaries.
2. `docs/ORCHESTRATION_MODEL.md`: object vocabulary and control hierarchy.
3. `docs/WORKFLOW.md`: orchestrator operating procedure.
4. `docs/handoff/*`: live state continuity artifacts.
5. specs: durable technical truth for implementation details.
6. `templates/*`: generation contracts and routing.
7. `seeds/*`: reusable bootstrap context packs.
8. `agents/*`: orchestrator, specialist, team, and sequence definitions.

## Access model reminder

Only orchestrator-class actors have broad default routing.
Downstream actors are narrow by default.

## Update rule

Update this document when operating layers are added, removed, or materially restructured.
