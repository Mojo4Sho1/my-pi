# ONBOARDING AND LAYERED CONTEXT INITIALIZATION DESIGN

## Status

Proposed

## Purpose

This document defines a repo-wide design for onboarding fresh agents in `my-pi` through layered context initialization, machine-first artifacts, and explicit separation between stable reference material and run-specific working artifacts.

The immediate goals are:

1. reduce unnecessary context loading
2. make specialist and orchestrator onboarding deterministic
3. improve routing quality by separating stable constraints from working inputs
4. support fresh-context execution without relying on chat history
5. align project structure, artifacts, and onboarding flows with the contract-driven specialist and team architecture already being introduced

This design is intended to drive one or more implementation tasks. Once the implementation is complete and the durable repo documentation has been updated accordingly, this design document may be archived according to the repo's normal design-doc workflow.

---

## Background

`my-pi` is increasingly built around several architectural directions that all point toward the same need:

- fresh-context execution
- index-first document routing
- contract-driven specialists
- machine-first artifacts
- router-owned packet construction
- repo-local policy files
- durable conventions and decision records
- stronger teardown and observability

At the same time, the project has already exposed real pain points:

- agents over-read large documents such as the implementation plan
- different layers of documentation drift apart
- broad context loading wastes tokens and introduces noise
- team and specialist behavior is harder to reason about when onboarding is implicit
- fresh agents do not always know which docs are stable constraints versus which artifacts are specific to the current run

The project needs a more explicit onboarding model.

The key idea is that onboarding should not mean “load a lot of documents.” It should mean “load the right layers, in the right order, for the current role and step.”

---

## Design Inspiration

This design borrows from pipeline-oriented workspace thinking in the following ways:

- one stage, one job
- plain-text interfaces
- layered context loading
- editable intermediate outputs
- configure the factory, not the product

However, `my-pi` should not copy a simple folder-pipeline model literally.

Instead, these principles should be adapted to the existing `my-pi` architecture:

- a stage maps to a specialist invocation or team state
- an interface maps to validated machine-first artifacts and TaskPackets
- layered context maps to explicit onboarding layers
- edit surfaces remain available, but router validation remains authoritative
- factory configuration maps to seeds, policies, specs, conventions, and repo structure

---

## Problem Statement

The current system does not yet enforce a clear layered onboarding protocol for fresh agents.

As a result:

- orchestrator and specialists may load more context than needed
- stable constraints and run-specific artifacts are not always distinguished cleanly
- onboarding is too dependent on ad hoc file reading
- project structure does not yet fully reinforce the desired context model
- future teams and specialists risk inheriting inconsistent onboarding behavior

The project needs a context model in which:

1. every agent role has a clear onboarding stack
2. each layer has a distinct semantic purpose
3. stable references and working artifacts are kept structurally separate
4. agents load only what they need for the current stage
5. the filesystem and repo conventions reinforce the runtime model
6. the onboarding model remains compatible with contract-driven routing and machine-first artifacts

---

## Core Decisions

### 1. Adopt layered context initialization as a first-class architectural rule

Fresh agents in `my-pi` must be onboarded through explicit context layers.

The onboarding process should be deterministic and role-aware.

The agent should not infer its entire initialization sequence ad hoc from broad repo browsing.

### 2. Distinguish stable reference material from working artifacts

The system must clearly separate:

- reference material: stable rules, conventions, specs, policies, templates, decisions
- working artifacts: per-run packets, session records, upstream outputs, current task files

These two classes of content require different forms of attention.

Reference material should be treated as constraints and operating rules.

Working artifacts should be treated as current input.

They should not be mixed loosely in the same onboarding bundle.

### 3. One state, one job; one artifact, one owner

The principle of “one stage, one job” should be adapted to `my-pi` as:

- one specialist invocation has one bounded responsibility
- one team state has one clear purpose
- one artifact has one primary owner
- one packet represents one bounded handoff

This is preferred over both:

- a broad “everyone reads everything” model
- a shared mutable document edited by multiple roles

### 4. Plain text remains the interface, but canonical artifacts must be machine-first

The system should continue to use text-based interfaces.

However, canonical routing artifacts must be machine-first.

Preferred canonical forms are:

- YAML
- JSON

Markdown remains important for:

- human-facing docs
- design docs
- ADRs
- summaries
- conventions
- implementation notes

But Markdown should not be the canonical routing substrate for runtime handoff.

### 5. Every important output should remain inspectable

Intermediate outputs should remain inspectable and, when appropriate, editable by humans.

However, the runtime must re-validate any edited machine artifact before downstream use.

This preserves mixed-initiative benefits without weakening contract enforcement.

### 6. Configure the factory, not the product

A repo should be configured once with:

- conventions
- policies
- specs
- templates
- indexes
- routing structure
- team and specialist definitions

After that, each run should produce new task/session artifacts under the same configured factory.

This principle should shape:

- seeds
- repo structure
- policy templates
- onboarding defaults
- future project scaffolding

### 7. The onboarding model should support both orchestrators and specialists

The orchestrator and specialists should both use layered onboarding, but not identically.

The orchestrator may need a slightly broader routing layer and broader situational awareness.

Specialists should default to narrower onboarding and receive only the context required for their current task and contract.

### 8. The onboarding model should be reinforced by repo structure

This design should not live only in prompts or code.

The repo structure should make the intended context model visible and natural.

That includes:

- policy/config roots
- spec directories
- artifact directories
- indexes
- conventions docs
- ADRs
- design docs
- router-owned session artifact areas

---

## Context Layer Model

The system should adopt the following conceptual onboarding layers.

## Layer 0: Runtime Identity and Global Operating Rules

Purpose:

- establish the system the agent is inside
- provide high-level runtime constraints and command semantics
- communicate global safety and lifecycle expectations

Examples:

- package/runtime identity
- panic/teardown behavior
- command model
- broad operating rules
- global package assumptions

This layer should remain small.

It should answer:

- What system am I inside?
- What kind of runtime is this?
- What broad rules always apply?

## Layer 1: Repo Routing and Conventions

Purpose:

- teach the agent where to look
- define the repo’s navigation rules
- define durable conventions

Examples:

- repo conventions
- root or directory indexes
- decision-log usage rules
- design-doc versus ADR distinction
- naming conventions
- context-routing rules

This layer should answer:

- How does this repo expect me to navigate?
- Which docs are authoritative for which topics?
- What files should I consult first?

This layer is especially important for fresh agents.

## Layer 2: Role or Stage Contract

Purpose:

- define the agent’s exact job in the current invocation
- define boundaries and required inputs/outputs
- define what the current stage is supposed to accomplish

Examples:

- specialist spec
- team state definition
- current state contract
- allowed actions
- output template
- ownership boundaries

This layer should answer:

- What is my role right now?
- What am I allowed to do?
- What must I produce?
- What must I not change?

## Layer 3: Stable Reference Material

Purpose:

- provide durable constraints and reference material relevant to the current task type

Examples:

- relevant architecture docs
- policies
- templates
- specs
- coding standards
- implementation standards
- decision records
- stable task-family reference docs

This layer should be loaded selectively, not wholesale.

It should answer:

- What stable rules apply to this kind of work?
- What reusable reference material is relevant here?

## Layer 4: Run-Specific Working Artifacts

Purpose:

- provide the exact working inputs for the current run

Examples:

- current TaskPacket
- current team session artifact
- upstream validated artifacts
- current validation target
- files under active modification
- current user objective
- current acceptance criteria

This layer should be loaded last.

It should answer:

- What exactly am I acting on right now?

---

## Onboarding Profiles

## A. Orchestrator Onboarding Profile

The orchestrator should load:

1. Layer 0: runtime identity and global operating rules
2. Layer 1: repo routing and conventions
3. Layer 2: orchestrator-specific contract and routing role
4. selectively relevant Layer 3 reference docs
5. current Layer 4 working artifacts

The orchestrator may need broader routing awareness than specialists, but it should still avoid broad default reading of large planning docs.

The orchestrator should use indexes and routing docs first.

It should package narrowed downstream context rather than handing broad context to specialists.

## B. Specialist Onboarding Profile

A specialist should load:

1. Layer 0: minimal runtime identity
2. Layer 1: minimal repo routing and conventions necessary for the role
3. Layer 2: specialist contract and artifact template
4. selectively relevant Layer 3 references for the task
5. current Layer 4 packet and upstream artifacts

Specialists should not default to loading broad architecture docs or the full implementation plan unless explicitly required by the task.

Their onboarding should be narrow by default.

## C. Team-State Onboarding Profile

When a specialist is invoked inside a team, onboarding should also include:

- the current team state
- current team objective
- current team session artifact reference
- upstream role-owned artifacts required by the downstream contract
- transition semantics for success, failure, partial, and escalation

This is still bounded by the specialist’s contract.

---

## Structural Separation of Content

The repo should explicitly separate the following classes of content.

## 1. Stable Factory Configuration

Examples:

- `.pi/` or equivalent config root
- policy files
- templates
- repo conventions
- indexes
- seed-owned defaults
- specialist/team specs

These are configured once and reused across runs.

## 2. Stable Human Reference Material

Examples:

- `docs/`
- ADRs
- durable architecture docs
- conventions docs
- decision log

These are readable references, not current-run artifacts.

## 3. Active Design Material

Examples:

- `design/`

These are temporary proposal/implementation-driving docs.

They should not be confused with accepted durable decisions.

## 4. Runtime or Session Artifacts

Examples:

- `artifacts/team-sessions/...`
- machine-first specialist outputs
- router-owned session artifacts
- validation result artifacts
- task-run artifacts

These are per-run and change frequently.

## 5. Source-of-Truth Specs

Examples:

- `specs/specialists/...`
- `specs/teams/...`

These define structured specialist and team behavior.

---

## Recommended Repo Structure Direction

This design does not require an immediate full repo reorganization, but it does recommend the following direction.

### Recommended stable config root

Preferred future path:

- `.pi/`

This may contain:

- `.pi/policies/`
- `.pi/templates/`
- `.pi/onboarding/`
- `.pi/runtime/` if needed

If the repo prefers a different config root, that choice should be documented in conventions and used consistently.

### Recommended spec roots

- `specs/specialists/`
- `specs/teams/`

### Recommended artifact roots

- `artifacts/team-sessions/`
- `artifacts/validation/`
- `artifacts/runs/` if needed later

### Recommended durable doc roots

- `docs/`
- `docs/adr/`

### Recommended temporary design root

- `design/`

---

## Onboarding Inputs by Layer

The implementation should define what kinds of artifacts may appear in each onboarding layer.

### Allowed Layer 1 inputs

Examples:

- `REPO_CONVENTIONS.md`
- root or directory index files
- brief routing notes
- durable repo usage conventions

### Allowed Layer 2 inputs

Examples:

- specialist YAML spec
- team YAML spec
- current state template
- role-owned artifact template
- input/output contract summary

### Allowed Layer 3 inputs

Examples:

- specific architecture doc sections
- relevant ADRs
- stable policy files
- coding/test/style guidance
- narrowly relevant sections of the implementation plan via index routing

### Allowed Layer 4 inputs

Examples:

- TaskPacket
- validated upstream artifacts
- team session artifact
- current target files
- current acceptance criteria
- current validation objective

---

## Relationship to Contract-Driven Routing

This design must remain fully aligned with the contract-driven specialist and team architecture.

That means:

- onboarding provides the inputs
- contracts define what is required and what is allowed
- router validation remains authoritative
- packets remain the bounded unit of work
- artifacts remain machine-first
- downstream context is constructed from validated artifact fields only

This design does not replace contract-driven routing.

It improves how agents are initialized before they act within that routing system.

---

## Relationship to Index-First Context Routing

This design should explicitly build on the repo’s existing move toward index-first document access.

Index-first routing should be treated as a Layer 1 mechanism.

The onboarding system should prefer:

1. local or root index
2. conventions doc
3. role contract/spec
4. selectively relevant reference docs
5. current working artifacts

Large files such as the implementation plan should be entered through indexes, not broad default reads.

---

## Relationship to Policies and Seeds

This design should be compatible with future policy-driven behavior.

Examples:

- onboarding policy
- context-routing policy
- teardown policy
- verification policy
- orchestration policy

These policies should live in the stable configuration layer, not in run artifacts.

This design should also be compatible with future seeds.

A seed should establish the factory by including:

- config roots
- policy templates
- spec templates
- repo conventions
- ADR scaffolding
- design directory
- indexes
- artifact structure

A run should then operate within that seeded configuration.

---

## Role of Human Edit Surfaces

Humans should remain able to inspect and edit canonical machine artifacts when needed.

However, the system must preserve these rules:

1. machine-first artifacts remain canonical
2. human edits must be re-validated before downstream routing
3. role ownership rules still apply
4. durable reference docs must not be mistaken for current-run artifacts
5. summaries remain derived views where possible

This lets the repo benefit from mixed-initiative collaboration without weakening runtime correctness.

---

## Documentation and Prompting Implications

The implementation should make the onboarding model visible in both durable docs and runtime-facing materials.

That includes:

- repo conventions
- ADRs
- implementation plan references
- specialist/team specs
- routing/index docs
- prompt-generation logic if onboarding bundles are assembled there

The system should stop assuming that “agent onboarding” is informal or implicit.

It should become a defined architectural concern.

---

## Future Onboarding Artifacts

The design should allow future addition of explicit onboarding bundles or manifests.

Possible future paths include:

- `.pi/onboarding/orchestrator.yaml`
- `.pi/onboarding/specialist-default.yaml`
- `.pi/onboarding/team-state.yaml`

These are not required to be fully implemented in this pass unless already straightforward.

But the implementation should not block that future direction.

---

## Implementation Requirements

## A. Document the onboarding layer model durably

The repo must gain durable documentation explaining:

- the context layers
- the difference between stable references and working artifacts
- role-specific onboarding expectations
- how onboarding interacts with packet routing

## B. Update repo conventions to reflect the new model

`REPO_CONVENTIONS` or equivalent durable conventions docs should be updated so future agents understand:

- consult indexes first
- stable reference material is separate from working artifacts
- specialists default to narrow onboarding
- orchestrator has broader but still bounded onboarding
- machine-first artifacts are canonical for runtime use

## C. Add or update specs/templates to reflect layered onboarding

The specialist/team spec model introduced elsewhere should be updated or designed so that it can declare onboarding-relevant information such as:

- required Layer 2 contract material
- allowed Layer 3 references
- expected Layer 4 working inputs

## D. Reinforce the factory-vs-run distinction in repo structure

Where appropriate, add or update directories and templates so the repo structure reflects:

- stable config
- stable reference docs
- temporary design docs
- runtime artifacts
- specs

## E. Keep changes truthful

If the implementation only establishes the conventions and structure, the docs must say so.

Do not claim a fully automated onboarding bundle system unless it is actually implemented in this pass.

---

## Suggested Artifacts and Templates to Introduce

At minimum, the implementation should consider adding or preparing:

- a durable doc explaining layered onboarding
- a durable conventions update reflecting layered context rules
- optional onboarding template examples
- specialist/team spec fields for onboarding metadata
- stable config directories or placeholders if appropriate
- artifact root placeholders if appropriate

---

## Validation Scenarios

The implementing agent should validate at least the following scenarios.

### Scenario 1: Specialist narrow onboarding

- a specialist receives only the repo routing/conventions it needs
- the specialist receives its contract/spec and current packet
- the specialist does not require broad architecture reads for routine work

### Scenario 2: Orchestrator layered onboarding

- the orchestrator uses indexes and conventions first
- the orchestrator loads broader routing context than a specialist
- the orchestrator packages narrowed downstream context instead of forwarding broad repo context

### Scenario 3: Stable reference vs working artifact separation

- reference material and working artifacts are stored separately
- docs explain the difference clearly
- onboarding logic or conventions reflect this difference

### Scenario 4: Build-team state onboarding

- a team-state specialist receives state-specific onboarding
- upstream validated artifacts are provided as Layer 4 inputs
- unrelated docs are not required for routine state execution

### Scenario 5: Human edit and revalidation model

- a machine-first artifact may be inspected or edited
- downstream use still requires router/runtime validation

### Scenario 6: Seed compatibility

- the new conventions can be cleanly included in future seed scaffolding
- the factory-vs-run distinction remains understandable

---

## Scope

### In scope

- defining the layered onboarding model
- defining stable reference vs working artifact separation
- aligning onboarding with packet-and-artifact routing
- defining how orchestrator and specialists differ in onboarding breadth
- recommending repo structure that reinforces the model
- documenting how seeds and policies should fit the model
- preparing templates/spec fields where useful

### Out of scope for this pass unless already straightforward

- full automation of onboarding bundle assembly
- large-scale repo restructure beyond what is needed now
- full UI/widget work
- full code generation from onboarding specs
- broad runtime analytics
- distributed or multi-repo onboarding federation

These future directions may be mentioned, but they must not be presented as implemented unless they truly are.

---

## Acceptance Criteria

This design is successfully implemented when all of the following are true:

1. the repo has durable documentation defining layered onboarding
2. the repo explicitly distinguishes stable reference material from working artifacts
3. the conventions/docs explain that specialists default to narrow onboarding
4. the conventions/docs explain that the orchestrator has broader but still bounded onboarding
5. the onboarding model is aligned with contract-driven packet/artifact routing
6. the repo structure and docs reinforce the factory-vs-run distinction
7. index-first routing is integrated into the onboarding model
8. the docs remain truthful about what is currently implemented versus planned
9. future seeds can clearly incorporate the new onboarding/configuration pattern

---

## Suggested Implementation Sequence

1. add durable documentation for layered onboarding
2. update repo conventions to reflect the model
3. align specialist/team spec direction with onboarding needs
4. reinforce stable config/spec/artifact separation in repo structure where appropriate
5. update relevant docs to stop implying broad default context loading
6. connect the new model to seeds, policies, and contract-driven routing
7. validate the model against representative orchestrator and specialist flows
8. report changed files, remaining gaps, and any future-work items honestly

---

## Instructions for the Implementing Agent

Use this document as the source of truth for the implementation pass.

You should:

- implement the layered onboarding and context-initialization model coherently
- preserve alignment with machine-first artifacts and contract-driven routing
- distinguish stable references from working artifacts clearly
- keep specialists narrow by default
- allow orchestrator onboarding to be broader but still bounded
- reinforce the factory-vs-run distinction in repo structure and docs
- keep documentation truthful about what is implemented now versus what is only planned
- report changed files, validations performed, and any unresolved ambiguity

When this work is complete, `my-pi` should have a clear, reusable, and durable onboarding architecture for fresh agents that reduces unnecessary context loading and makes runtime behavior easier to reason about.