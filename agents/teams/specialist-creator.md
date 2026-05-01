# specialist-creator.md

## Taxonomy Note

This team predates the canonical specialist taxonomy in `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md` and currently references members by their pre-taxonomy identifiers (for example `specialist_spec-writer`, `specialist_critic`, `specialist_tester`). Under the new taxonomy, these members map as follows:

- `specialist_planner` -> Planner (generic base)
- `specialist_spec-writer` -> Scribe variant `scribe-spec`
- `specialist_schema-designer` -> Scribe variant `scribe-schema`
- `specialist_critic` -> Reviewer variant `reviewer-critic`
- `specialist_boundary-auditor` -> Reviewer variant `reviewer-boundary-auditor`
- `specialist_reviewer` -> Reviewer (generic base)
- `specialist_builder` -> Builder (generic base; D-O5 keeps `builder`)
- `specialist_tester` -> Builder variant `builder-test` (decision log D-O4)

Member identifier renames are deferred. This file is not edited beyond this taxonomy note in the documentation-only pass; runtime team definitions remain unchanged.

## Definition

- `id`: team_specialist-creator
- `name`: Team Specialist-Creator
- `definition_type`: team

## Intent

- `purpose`: Create new specialist packages for the repository by turning a bounded specialist need into an activation-ready candidate that includes a definition, implementation assets, validation evidence, and explicit governance findings.
- `scope`:
  - determine whether the requested capability belongs in a new specialist definition rather than in an existing specialist, a team, a sequence, or direct orchestrator work
  - produce a bounded specialist definition with explicit purpose, scope, non-goals, inputs, outputs, escalation conditions, and working style
  - produce the supporting specialist package needed for repository adoption, including implementation assets and validation evidence
  - gather critique, boundary audit, review, and testing evidence against the candidate package before handback
  - return a creation result that makes approval status, unresolved issues, and activation readiness explicit
- `non_goals`:
  - creating a new team instead of a specialist, even when the requested work is multi-role by nature
  - creating a new sequence instead of a specialist, even when the requested work is primarily staged workflow design
  - broad architectural planning for the repository as a whole, even when the proposed specialist exposes architecture questions
  - silently activating, registering, or routing to a new specialist without explicit approval outside this team's bounded handback
  - revising unrelated existing primitives beyond the minimum changes required to make the candidate coherent

## Routing and access

- `routing_class`: downstream
- `context_scope`: narrow
- `default_read_set`:
  - task packet defining the requested specialist need
  - `agents/AGENT_DEFINITION_CONTRACT.md`
  - `agents/specialists/_SPECIALISTS_INDEX.md`
  - existing specialist definitions needed for overlap checks or reuse checks
  - task-relevant implementation files only when the candidate package requires repository-conforming implementation assets
- `forbidden_by_default`:
  - broad repository scans unrelated to the requested specialist need
  - `DECISION_LOG.md` unless the task explicitly grants it for conflict resolution
  - `STATUS.md` unless the task explicitly grants it for roadmap alignment
  - edits outside the candidate specialist package and the minimum routing files required to place that package

## Inputs and outputs

- `required_inputs`:
  - the requested specialist purpose or capability gap
  - explicit boundary constraints, if any
  - success criteria for what would make the candidate specialist acceptable
  - the repository area where the candidate package is expected to live, if that location is already constrained
- `expected_outputs`:
  - a candidate specialist definition markdown file
  - the implementation assets required for a repository-conforming specialist package
  - critique, boundary, review, and test findings attached to the candidate package
  - an explicit recommendation of approve, revise, reject, or escalate
- `handback_format`:
  - created artifacts and their paths
  - summary of the proposed specialist boundary
  - explicit non-goals and exclusions
  - governance findings, including overlap concerns, boundary concerns, review concerns, and test results
  - open questions that block approval or activation
  - activation-readiness statement

## Control and escalation

- `activation_conditions`:
  - a bounded capability gap appears that should become a reusable specialist rather than remain ad hoc work
  - existing specialists cannot absorb the work cleanly without role drift
  - the request is narrow enough to fit the specialist layer rather than the team or sequence layer
- `escalation_conditions`:
  - the proposed capability overlaps materially with an existing specialist and the overlap cannot be reduced cleanly
  - the requested capability is not specialist-shaped and more properly belongs to a team, sequence, or orchestrator concern
  - required implementation constraints, validation criteria, or approval criteria are missing or contradictory
  - the candidate package cannot be validated within the granted scope
  - activation would require policy, routing, or architectural decisions that exceed this team's bounded creation role

## Validation

- `validation_expectations`:
  - the specialist definition conforms to `agents/AGENT_DEFINITION_CONTRACT.md`
  - the proposed specialist boundary is explicit, narrow, and paired with explicit exclusions
  - overlap checks are performed against existing specialists before approval is recommended
  - boundary auditing is performed before approval is recommended
  - review and testing evidence are attached before the package is considered activation-ready
  - any unresolved issue that weakens specialist distinctness, safety, or clarity is surfaced as a blocker rather than being silently accepted

## Relationships

- `related_docs`:
  - `agents/AGENT_DEFINITION_CONTRACT.md`
  - `agents/specialists/_SPECIALISTS_INDEX.md`
- `related_definitions`:
  - `agents/specialists/planner.md`
  - `agents/specialists/spec-writer.md`
  - `agents/specialists/schema-designer.md`
  - `agents/specialists/critic.md`
  - `agents/specialists/boundary-auditor.md`
  - `agents/specialists/reviewer.md`
  - `agents/specialists/builder.md`
  - `agents/specialists/tester.md`

## Authority flags

- `can_delegate`: false
- `can_synthesize`: true
- `can_update_handoff`: false
- `can_update_workflow_docs`: false
- `can_request_broader_context`: true

## Team-specific fields

- `members`:
  - `specialist_planner` — shapes the creation effort, defines the bounded target problem, and identifies prerequisites; does not write the final specialist definition prose, and does not approve the package.
  - `specialist_spec-writer` — writes the specialist definition and boundary language; does not design TypeScript schemas, and does not implement runtime logic.
  - `specialist_schema-designer` — defines the specialist's typed interfaces, contracts, and output constraints when such structures are required; does not own prose boundary writing, and does not implement runtime logic.
  - `specialist_critic` — evaluates whether the proposed specialist should exist, whether reuse is possible, and whether the abstraction is proportionate; does not perform compliance review, and does not audit access boundaries.
  - `specialist_boundary-auditor` — checks narrow-by-default compliance, context minimization, and authority boundaries; does not judge general design quality, and does not replace implementation review.
  - `specialist_reviewer` — performs scoped acceptance review against the requested deliverable and evidence; does not implement fixes, and does not decide repository-wide architecture.
  - `specialist_builder` — produces bounded implementation assets for the candidate package; does not redefine the candidate's purpose after approval criteria are set, and does not self-approve the output.
  - `specialist_tester` — validates the candidate package against explicit checks and evidence expectations; does not broaden requirements, and does not substitute for reviewer judgment.
- `collaboration_pattern`:
  - The team works from exclusion before inclusion: it first decides what the proposed specialist must not own, and only then defines what it should own.
  - The team treats specialist creation as governed package assembly, not as free-form invention; each contribution must narrow the candidate, and no member may silently broaden scope.
  - The team separates authoring from evaluation: creation members may propose artifacts, while critique, boundary audit, review, and testing members judge those artifacts from distinct lenses.
  - The team may return a rejection or escalation when the request is not specialist-shaped; it does not force every request into a new specialist just because a creation workflow was invoked.
  - The team may prepare an activation-ready package; it does not treat package preparation as automatic activation.
- `team_deliverable`:
  - A governed candidate specialist package containing the specialist definition, supporting implementation assets, validation evidence, and an explicit approval recommendation.
  - It is an activation-ready proposal when evidence is sufficient; it is not an implicit activation event.
- `member_context_policy`:
  - Each member receives only the task packet, the candidate artifacts, and the minimum upstream findings needed for that member's role.
  - Members do not receive the full repository transcript by default, and they do not receive unrelated project history by default.
  - Evaluation members receive the artifacts under review plus the minimum rationale needed to judge them; they do not inherit broad creation context that is unnecessary for their specific gate.
  - Build and test members may receive task-scoped writable paths when implementation validation requires them; non-writing members do not receive write authority by default.

## Summary

Downstream team for creating new specialist packages. It assembles a bounded specialist candidate with explicit governance evidence and approval signaling, but it does not replace architectural decision-making, and it does not auto-activate what it creates.
