# LAYERED_ONBOARDING.md

Durable reference for layered context initialization in `my-pi`.

Companion records:

- `DECISION_LOG.md` Decision #44
- `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md`
- source proposal: `docs/design/onboarding_layed_context.md`

## Purpose

Layered context initialization means a fresh agent loads the right context layers, in order, for its current role and current task.

The goal is not "read more." The goal is "read the smallest truthful set of inputs that lets the role act correctly."

This is a durable conventions-and-documentation rule today. It is not yet an automated runtime bundle system.

## Truthful implementation status

Implemented now:

- index-first routing through `AGENTS.md`, `INDEX.md`, and local indexes
- narrow-by-default specialist execution with bounded packets
- contract-driven routing and validation in the TypeScript runtime
- durable docs and ADRs that explain the onboarding model

Planned, not implemented yet:

- declarative onboarding manifests under `specs/onboarding/`
- onboarding policy files under `specs/policies/`
- automated onboarding bundle assembly
- runtime manifest loading that builds prompts directly from onboarding metadata

## Layer model

### L0: Runtime identity and global operating rules

Purpose:

- establish what system the agent is inside
- communicate broad operating and safety rules
- define lifecycle expectations that apply regardless of task

Examples in this repo:

- `AGENTS.md`
- platform/runtime instructions that define command and editing behavior
- broad project-level rules such as fresh-context execution and bounded delegation

This layer answers:

- What system am I inside?
- What broad rules always apply?
- What kind of execution model am I participating in?

### L1: Repo routing and conventions

Purpose:

- teach the agent how to navigate the repo
- define which files are authoritative for which topics
- keep fresh agents from over-reading broad documentation

Examples in this repo:

- `INDEX.md`
- `docs/REPO_CONVENTIONS.md`
- `docs/_DOCS_INDEX.md`
- `docs/handoff/_HANDOFF_INDEX.md`
- `specs/_SPECS_INDEX.md`

This layer answers:

- How should I route through this repo?
- Which index or conventions file should I open first?
- Which doc class is authoritative for this question?

### L2: Role or stage contract

Purpose:

- define the agent's exact job for the current invocation
- define allowed actions, required outputs, and ownership boundaries
- make the current role explicit instead of implicit

Examples in this repo:

- specialist prompt configs in `extensions/specialists/*/prompt.ts`
- packet and contract types in `extensions/shared/types.ts`
- contract validation in `extensions/shared/contracts.ts`
- team definitions in `extensions/teams/definitions.ts`
- durable YAML authoring specs under `specs/`

This layer answers:

- What is my role right now?
- What must I produce?
- What am I not allowed to change?
- What inputs are required before I act?

### L3: Stable reference material

Purpose:

- provide durable, reusable reference material relevant to the task family
- supply architecture, policy, standards, and decision context
- stay selective rather than broad

Examples in this repo:

- `DECISION_LOG.md`
- `docs/PROJECT_FOUNDATION.md`
- `docs/ORCHESTRATION_MODEL.md`
- `docs/PI_EXTENSION_API.md`
- `docs/validation/METHODOLOGY.md`
- narrowly relevant sections routed through local indexes

This layer answers:

- What stable rules apply to this kind of work?
- Which reusable docs or decisions matter here?
- What constraints should guide implementation or review?

### L4: Run-specific working artifacts

Purpose:

- provide the exact inputs for the current run
- carry the bounded handoff payload for the current task or team state
- separate current work from stable reference material

Examples in this repo:

- the current `TaskPacket` and upstream validated artifacts
- router-owned team session artifacts
- `docs/handoff/NEXT_TASK.md` for bounded relay execution
- current acceptance criteria and user objective
- files under active modification

This layer answers:

- What exactly am I acting on right now?
- Which artifacts from this run are authoritative inputs?
- What current deliverable or acceptance target am I trying to satisfy?

## Onboarding profiles

### Orchestrator profile

The orchestrator uses the full layered model:

1. L0 for runtime identity and global rules
2. L1 for repo routing and conventions
3. L2 for orchestrator-specific delegation and synthesis responsibilities
4. selective L3 references needed to package downstream context correctly
5. current L4 task artifacts, handoff docs, packets, and team/session state

The orchestrator is broader than a specialist, but still bounded. It should route through indexes first and then package narrow downstream context instead of forwarding broad repo context.

### Specialist profile

Specialists are narrow by default:

1. minimal L0 runtime identity
2. only the L1 routing/conventions needed for the role
3. L2 specialist contract and output template
4. only the L3 references relevant to the current task type
5. the current L4 packet and validated upstream artifacts

Specialists should not default to broad architecture reads or full-plan reads for routine work. In this repo, the orchestrator is responsible for packaging the needed context into the packet.

### Team-state profile

When a specialist is invoked inside a team, the specialist profile is extended with team-state-specific L4 inputs:

- current team state
- current team objective
- current team session artifact reference
- upstream role-owned artifacts required by the downstream contract
- transition semantics for `success`, `partial`, `failure`, and `escalation`

This adds situational context without turning the specialist into a broad-reader.

## Stable reference material vs working artifacts

The repo should keep stable references and working artifacts conceptually separate even when both are plain text.

Stable reference material:

- `docs/` durable architecture, conventions, and methodology
- `docs/adr/` accepted architectural decision records
- `DECISION_LOG.md` as the canonical decision ledger
- `specs/` durable authoring/spec structure
- indexes and conventions files that teach routing

Working artifacts:

- packets and validated upstream outputs used for the current invocation
- team session artifacts and other router-owned run records
- current task files under active modification
- handoff documents that define the current bounded relay target

Active design material:

- `docs/design/` proposal-driving documents

Design docs are useful reference inputs, but they are not themselves durable accepted decisions. They should not be confused with either runtime artifacts or durable architecture records.

## Factory vs run

`my-pi` follows "configure the factory, not the product."

Factory configuration is the stable setup reused across many runs:

- conventions
- indexes
- policies and onboarding manifests when they are added
- team and specialist specs
- templates and durable reference docs

Run artifacts are produced for one execution episode:

- packets
- session artifacts
- current validation outputs
- current task edits and deliverables

The factory defines how work should be done. A run is one bounded execution inside that configured factory.

## Access model

The access model is role-aware:

- the orchestrator may read policies, onboarding manifests, indexes, and routing docs so it can package context correctly
- specialists receive context via the packet and relevant validated artifacts, not by broad default repo access
- team-state specialists additionally receive current state and upstream artifacts needed by the contract

Directory layout is for organization and discoverability. It is not the enforcement mechanism by itself. Runtime boundaries are still enforced through packets, contracts, routing, and write-scope controls.

## Relationship to contract-driven routing

Layered onboarding complements contract-driven routing; it does not replace it.

- onboarding determines which inputs are loaded
- contracts define which inputs are required and which outputs are allowed
- packets remain the bounded unit of work
- router validation remains authoritative
- downstream context should be built from validated artifact fields, not from loose broad context

In short: onboarding answers "what should this actor read first?" Contracts answer "what must this actor receive and produce?"

## Relationship to index-first routing

Index-first routing is the normal L1 mechanism in this repo.

The default startup path remains:

1. `AGENTS.md`
2. `INDEX.md`
3. the nearest relevant local index
4. only the smallest relevant durable reference doc or section
5. current run artifacts last

This keeps fresh agents from treating large planning docs as default startup context.

## Human edit surfaces and revalidation

Machine-first artifacts remain inspectable and may be edited by humans when needed.

That does not remove runtime guardrails:

- machine-first artifacts remain canonical for routing
- any edited artifact must be re-validated before downstream use
- role ownership rules still apply
- summaries remain derived views where possible

This preserves mixed-initiative work without weakening correctness.

## Repo-structure direction

The repo does not yet implement the full future onboarding structure, but the direction is now explicit.

Current decision:

- future policies and onboarding manifests should live under `specs/`, not under a new `.pi/` root

Future escalation path:

- if policy/onboarding material grows large enough to overload `specs/`, a dedicated config root may be introduced later

That future split is not implemented in this pass.

## Seed compatibility

This model is intended to be seed-friendly.

A future seed should be able to scaffold:

- routing indexes
- conventions docs
- ADR scaffolding
- `specs/` structure for policies and onboarding manifests
- runtime artifact roots

That future seed work is compatible with this doc, but not yet implemented.
