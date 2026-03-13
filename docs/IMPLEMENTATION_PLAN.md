# IMPLEMENTATION_PLAN.md

## Purpose of this document

This document defines the staged implementation plan for this project.

It translates the durable architectural doctrine from `docs/PROJECT_FOUNDATION.md` into an ordered build strategy. It exists to preserve the intended implementation sequence, reduce drift, and provide a stable planning reference for future work.

This document is more stable than live handoff materials, but less foundational than the project foundation document.

This document is **not**:

- a live status tracker
- a sprint board
- a temporary task list
- a substitute for `docs/handoff/`

Live execution state, active tasks, and transitional progress belong in `docs/handoff/`. Runtime-produced execution artifacts belong in a dedicated runtime subtree rather than in `docs/handoff/`.

---

## Relationship to other core documents

This document should be read in relation to the following artifacts:

- `docs/PROJECT_FOUNDATION.md` for stable project doctrine and object model
- `docs/ORCHESTRATION_MODEL.md` for the execution object vocabulary
- `docs/WORKFLOW.md` for orchestrator and workflow behavior
- `docs/CANONICAL_DECISIONS.md` for settled architectural decisions
- `docs/handoff/` for live implementation state and current work

The role of this document is to answer:

**Given the current foundation, what should be built next, in what order, and what counts as completion for each stage?**

---

## Planning doctrine

The implementation plan follows the project's foundational design principles.

### 1. Walk before run

The project should stabilize its lower layers before introducing higher-order execution structures.

This means:

- specialists before teams
- teams before sequences
- packet structure before routing runtime
- validation before scale
- stable doctrine before broad implementation

---

### 2. Contracts before convenience

The system should define valid interfaces and behaviors before building automation on top of them.

Wherever possible, execution structure should be governed by:

- explicit contracts
- explicit packet models
- explicit routing rules
- explicit validation
- explicit activation rules

rather than by convenience-first implementation shortcuts.

---

### 3. Data and specs before hardcoded logic

Runtime behavior should be driven by declared artifacts rather than by embedding per-object policy directly in code.

This means:

- one generic team router rather than one router per team
- one shared execution model rather than custom routing logic per specialist bundle
- team-specific behavior declared in machine-readable routing definitions
- contracts and specs treated as authoritative inputs to runtime

---

### 4. Stable control plane before active execution plane

Before the router and validation tooling become real, the documentation and control-plane artifacts must be internally coherent.

Implementation should not race ahead while the project still has conflicting definitions of its core objects.

---

### 5. Expand only from proven exemplars

The project should not generalize prematurely.

When a new abstraction is introduced, it should be proven first through one or a very small number of exemplar implementations. Only after the abstraction is stable should it be expanded more broadly.

---

### 6. Project-native authority before host-platform realization

Project-native contracts, specs, routing definitions, canonical identities, and activation rules remain authoritative even if later host-platform realizations exist.

No implementation stage should force project-native objects into host-platform forms before there is a demonstrated benefit.

---

## Current implementation posture

The project already has a strong foundational and documentation skeleton, including:

- a stable project foundation
- an orchestration vocabulary
- a workflow/control orientation
- a live handoff area
- an initial specialist layer
- scaffold-level teams and sequences directories
- template and seed infrastructure at an early stage

At the same time, the following areas remain immature or intentionally thin:

- canonical object identity conventions in concrete artifact form
- packet model
- packet contracts
- specialist I/O governance
- activation governance in concrete artifact form
- team contracts
- machine-readable team routing definitions
- generic team routing runtime
- runtime artifact storage
- validation tooling for execution artifacts
- sequence execution design
- host-platform adapter realization strategy

This plan exists to grow those layers in the correct order.

---

## Stage overview

The intended implementation order is:

1. canonical control-plane alignment
2. identity and execution artifact model
3. specialist hardening
4. team object introduction
5. generic team routing runtime
6. validation and drift prevention
7. controlled team-layer expansion
8. sequence design and implementation later
9. host-platform realization and packaging only when justified

Each stage below includes:

- purpose
- goals
- key deliverables
- dependencies
- exit criteria
- notes and cautions

---

# Stage 0 — Canonical control-plane alignment

## Purpose

Ensure that the stable repository documentation agrees on the core architecture before implementation expands.

This stage exists to eliminate conceptual drift across foundational and routing-oriented documentation.

## Goals

- align core docs around the updated foundation doctrine
- reconcile definitions of specialists, teams, sequences, contracts, packets, templates, seeds, canonical IDs, activation, runtime artifacts, and platform adapters
- ensure build-order expectations are consistent across major documentation artifacts
- preserve the distinction between stable truth, live truth, and runtime output

## Key deliverables

- updated `docs/PROJECT_FOUNDATION.md`
- reconciled `docs/ORCHESTRATION_MODEL.md`
- reconciled `docs/WORKFLOW.md`
- reconciled `INDEX.md` if needed
- updates to other durable docs that still carry outdated object descriptions
- handoff updates that reflect the newly settled doctrine without overloading the handoff layer

## Minimum reconciliation scope

The minimum Stage 0 reconciliation scope is:

- `docs/PROJECT_FOUNDATION.md`
- `docs/ORCHESTRATION_MODEL.md`
- `docs/WORKFLOW.md`
- `INDEX.md`

Other docs should be updated only if they clearly contradict these control-plane artifacts.

## Dependencies

- settled agreement on foundational doctrine

## Exit criteria

Stage 0 is complete when:

- `docs/PROJECT_FOUNDATION.md`, `docs/ORCHESTRATION_MODEL.md`, `docs/WORKFLOW.md`, and `INDEX.md` no longer contradict one another
- the role of specialists, teams, sequences, contracts, packets, templates, seeds, platform adapters, canonical IDs, and activation is coherent across major docs
- the repo's durable control-plane artifacts agree on build order and execution philosophy
- live handoff materials can reference the current doctrine without compensating for drift in the stable docs

## Notes and cautions

This stage should not become an excuse to defer implementation forever. It exists to remove foundational ambiguity, not to endlessly polish wording.

---

# Stage 1 — Identity and execution artifact model

## Purpose

Define the identity and execution artifact model that makes contract-governed runtime behavior possible.

This stage should establish canonical IDs, packets, and related execution artifacts as real project objects rather than vague future concepts.

## Goals

- define canonical identity conventions for first-class objects
- define packet roles and families
- define authoritative routing fields
- define the minimum packet governance needed for predictable transitions
- define how specialists interact with packets at their boundaries
- define where runtime artifacts will live

## Key deliverables

- canonical ID naming convention
- packet taxonomy
- packet contract structure
- packet naming conventions
- minimum required routing fields
- initial packet examples or templates
- runtime artifact location strategy
- clear distinction between packet payload content and routing metadata

## Sub-stages

### 1.1 Define canonical ID conventions

Define how first-class project-native objects are identified.

The convention should cover objects such as:

- specialists
- teams
- sequences
- packet types
- templates
- seeds
- adapters
- contracts or other governed artifacts if needed

The goal is stable human-readable IDs that survive file renames and directory moves.

### 1.2 Define packet families

Define the minimum useful packet families for the system.

The exact names may evolve, but the initial model should likely include artifacts for:

- inbound task or work request
- specialist output
- review result
- build result
- test result
- blocker or escalation
- terminal result
- team transition or state-progress signal

The goal is not to invent every future packet now. The goal is to define a usable minimal model.

### 1.3 Define canonical packet format

Adopt YAML as the canonical packet format.

Packet definitions and packet instances should be designed around YAML unless and until the project explicitly changes the canonical format.

The goal is to keep packet structure readable, inspectable, versionable, and easy to validate.

### 1.4 Define authoritative routing fields

Establish which packet fields are authoritative for routing and execution control.

Likely concerns include:

- packet type
- producer identity or role
- status or outcome
- terminal vs non-terminal meaning
- escalation indicator
- retryability
- target or next-state information if needed
- correlation or run identity if needed

The exact final field set may evolve, but the router must eventually depend on declared structured fields rather than prose.

### 1.5 Define packet-contract expectations

Define what a packet contract must specify.

Likely concerns include:

- canonical packet type ID
- required fields
- optional fields
- producer rules
- consumer rules
- validation rules
- terminal meaning
- allowed combinations of status and type
- compatibility expectations

### 1.6 Define packet and runtime artifact location strategy

Decide where packet contracts, packet templates, and related packet definitions should live in the repository.

Also decide where runtime-produced artifacts will live.

The current intended direction is:

- packet definitions live with other governed documentation according to the repository's documentation doctrine
- runtime-produced artifacts live in a dedicated runtime subtree, likely `runs/`
- runtime artifacts do **not** live in `docs/handoff/`

## Dependencies

- Stage 0 sufficiently complete to avoid conceptual drift in identity and packet definitions

## Exit criteria

Stage 1 is complete when:

- canonical identity conventions are defined
- packet families are defined well enough to support specialist I/O
- YAML is explicitly established as the canonical packet format
- authoritative routing fields are explicitly declared
- packet contracts have a defined structure
- the project has a coherent answer to what a valid packet is
- the project has a coherent answer to where runtime artifacts belong

## Notes and cautions

Do not overdesign packet taxonomy too early. The packet model should be strict enough to support routing, but lean enough to remain adaptable through early implementation.

---

# Stage 2 — Specialist hardening

## Purpose

Turn the initial specialist layer into a contract-governed primitive execution layer.

This stage exists to make specialists real typed transformers rather than merely role descriptions.

## Goals

- define specialist inputs and outputs explicitly
- align specialists with packet contracts
- clarify invariants, assumptions, escalation rules, canonical identity, and activation prerequisites
- make the initial specialist set usable as the basis for the first team
- define the minimum bounded input set for fresh specialist invocation

## Key deliverables

- upgraded specialist definitions
- specialist contract structure
- specialist input/output declarations
- specialist validation expectations
- specialist contract template
- fresh specialist invocation input doctrine in concrete operational form

## Sub-stages

### 2.1 Upgrade each initial specialist definition

The initial specialist set should be upgraded so that each specialist clearly declares:

- canonical ID
- purpose
- bounded scope
- accepted packet types
- emitted packet types
- required inputs
- expected outputs
- invariants
- forbidden assumptions
- escalation conditions
- activation prerequisites
- validation expectations

### 2.2 Create a specialist contract template

Create a reusable template to reduce drift when defining future specialists.

The template should encode the expected contract shape and promote consistency without forcing premature rigidity.

### 2.3 Define specialist validation rules

Decide what makes a specialist definition valid.

This may include both structural requirements and semantic expectations such as clear scope boundaries, explicit I/O declarations, canonical ID presence, and activation requirements.

### 2.4 Define fresh specialist invocation inputs

Translate the foundation-level doctrine into operational requirements.

A fresh specialist invocation should minimally receive:

- the specialist contract or a governed distilled execution definition
- the task packet
- the allowed read set
- any explicitly approved helper resources

The transport mechanism remains intentionally open at this stage.

### 2.5 Confirm bootstrap specialist sufficiency

Determine whether the initial specialist set is sufficient to support the first exemplar team.

The default assumption is that the initial set should be enough to prove the team abstraction before introducing additional specialist types.

## Dependencies

- Stage 1 sufficiently complete to give specialists a stable packet and identity model

## Exit criteria

Stage 2 is complete when:

- each initial specialist can be described as a contract-bound typed transformer
- each specialist has a canonical ID
- each specialist has declared packet-based I/O
- each specialist has clear escalation and activation behavior
- the minimum bounded input set for fresh specialist invocation is defined
- the specialist layer is stable enough to support at least one exemplar team definition without inventing new specialist semantics on the fly

## Notes and cautions

This stage should favor clarity and boundedness over completeness. Specialists should remain narrow.

At this stage, specialists remain project-native governed objects. Host-platform realizations may be considered later only if they materially help execution.

---

# Stage 3 — Team object introduction

## Purpose

Introduce teams as real governed execution structures rather than placeholder concepts.

This stage is the bridge from the primitive specialist layer to reusable structured composition.

## Goals

- define the canonical team contract
- define the machine-readable team routing spec
- require human-readable team routing depictions
- define team identity and activation expectations
- create one exemplar team

## Key deliverables

- team contract structure
- team-routing spec format
- team diagram and visualization requirement
- one fully defined exemplar team
- initial team activation criteria

## Sub-stages

### 3.1 Define the team contract

The team contract should specify what a team is and how it is governed.

It should likely include:

- canonical ID
- team purpose
- member specialists
- entry conditions
- accepted entry packet types
- expected output or exit packet types
- allowed states
- terminal states
- escalation conditions
- invariants
- validation expectations
- activation prerequisites
- relationship to the machine-readable routing definition
- relationship to the human-readable routing depiction

### 3.2 Define the machine-readable team routing spec

Define the artifact that the future team router will consume.

This spec should declare, directly or indirectly:

- valid states
- start state
- terminal states
- member associations
- transition rules
- accepted packet types
- authoritative routing fields
- state-level expectations
- failure and escalation outcomes

### 3.3 Define the human-readable routing depiction requirement

Specify what counts as the required human-readable depiction of a team's state machine.

The exact format may evolve, but every team should have a companion artifact that allows humans to understand routing without reading low-level runtime code or raw machine specs.

### 3.4 Define team activation requirements

Define what it means for a team to be active and eligible for runtime selection.

At minimum, this should include:

- valid team contract
- valid routing spec
- discoverability in the appropriate index or registry
- any required validation completed

### 3.5 Create one exemplar team

Create one simple but real team using the stable specialist layer.

This exemplar should be intentionally narrow and should exist to prove:

- the team contract model
- the team routing spec
- the human-readable depiction requirement
- the feasibility of generic runtime enforcement later

Only one team is needed at this stage. The goal is to prove the abstraction, not to maximize coverage.

## Dependencies

- Stage 2 complete enough that specialist contracts are usable as team building blocks

## Exit criteria

Stage 3 is complete when:

- the repo contains a canonical team contract model
- the repo contains a machine-readable team routing spec format
- the repo defines the human-readable routing requirement
- the repo defines what makes a team active
- one exemplar team exists with all required components
- the exemplar team is understandable without relying on informal chat explanation

## Notes and cautions

Do not create multiple teams merely because the directory exists. Prove the team abstraction first.

---

# Stage 4 — Generic team routing runtime

## Purpose

Create the generic reusable team-routing runtime that enforces team state-machine execution.

This stage is where the project moves from declarative team design to executable team enforcement.

## Goals

- implement a team-agnostic routing runtime
- enforce team routing from declared artifacts
- validate packets and transitions before downstream consumption
- persist run state and trace
- avoid team-specific hardcoded logic
- define the boundary between project-native routing logic and any future host-platform adapter

## Key deliverables

- shared runtime or core transition engine
- team router interface or wrapper
- packet validation hooks
- transition enforcement behavior
- run-state persistence strategy
- integration with team routing definitions
- adapter boundary doctrine in executable form

## Sub-stages

### 4.1 Define the runtime boundary

Explicitly define what the runtime does and does not do.

It should do things like:

- load team routing definitions
- validate packets
- validate current state
- determine legal next transitions
- reject illegal transitions
- emit next valid task or handoff artifacts
- persist run state and trace

It should not:

- semantically interpret freeform prose to infer routing
- invent team-specific policy
- act as a coordinator agent
- allow specialists to choose arbitrary downstream recipients by default

### 4.2 Define run-state persistence structure

Translate the runtime artifact doctrine into concrete repository structure and format.

Likely concerns include:

- run state snapshot format
- transition log format
- packet lineage or correlation format
- terminal summary format
- `runs/` subtree organization
- retention or cleanup policy if needed later

### 4.3 Implement the core transition engine

Build the reusable team-agnostic engine that interprets the declared routing spec.

The runtime should treat teams as data and contracts, not as custom code paths.

### 4.4 Implement validation hooks

Add clear failure modes for:

- invalid packet shape
- unknown packet type
- illegal transition
- invalid state
- missing required fields
- terminal state inconsistencies
- undeclared emitters or consumers
- activation violations where applicable

### 4.5 Define host-platform adapter boundary

If a host-platform realization later becomes useful, define how the adapter interacts with the runtime.

At this stage, the key requirement is that the adapter:

- reads project-native contracts and specs
- respects canonical identities
- respects activation state
- does not become the source of routing truth

### 4.6 Support routing depiction alignment

Either generate the human-readable depiction from the machine-readable routing spec or provide a mechanism to validate alignment between them.

## Dependencies

- Stage 3 complete enough to provide one exemplar team and stable team artifacts

## Exit criteria

Stage 4 is complete when:

- one exemplar team can be executed end-to-end by the generic team router
- the router does not depend on hardcoded team-specific logic
- invalid packets and invalid transitions fail clearly
- runtime state is persisted in a structured inspectable way outside `docs/handoff/`
- team routing is driven by declared artifacts rather than prose or implicit code paths
- the project has a clear adapter boundary for future host-platform realization without requiring it yet

## Notes and cautions

The implementation language is intentionally not fixed at the planning level. The first implementation may be in Python, but the runtime should remain architecturally language-agnostic.

A future host-platform adapter may be implemented in a different language if required by the platform surface.

---

# Stage 5 — Validation and drift prevention

## Purpose

Build validation support that prevents contracts, specs, packets, diagrams, runtime definitions, activation state, and adapters from drifting apart.

This stage turns architectural discipline into enforceable practice.

## Goals

- validate key repository object types
- detect structural and cross-reference drift
- reduce the likelihood of invisible control-plane inconsistency
- make execution artifacts safer to trust
- validate activation and identity consistency where appropriate

## Key deliverables

- contract validation rules
- packet validation tooling
- team-routing spec validation
- cross-reference validation
- diagram and spec consistency checks
- identity and activation consistency checks
- initial adapter conformance validation approach if adapters exist

## Sub-stages

### 5.1 Contract validation

Validate that contracts contain the required structure and references.

### 5.2 Packet validation

Validate packet instances and packet definitions against packet contracts.

### 5.3 Team-routing spec validation

Validate team execution definitions for structural completeness and internal consistency.

Likely concerns include:

- unknown states
- unreachable terminal states
- undeclared members
- unknown packet types
- missing entry conditions
- invalid transition targets

### 5.4 Cross-reference validation

Validate that indexes, contracts, specs, visuals, runtime assumptions, and canonical IDs remain aligned.

### 5.5 Diagram and spec consistency validation

Ensure that the human-readable routing depiction remains meaningfully aligned with the machine-readable routing definition.

### 5.6 Identity and activation validation

Ensure that objects with canonical IDs are uniquely identifiable and that active objects satisfy their activation requirements.

### 5.7 Adapter conformance validation

If host-platform adapters exist by this stage, validate that they conform to project-native governance rather than bypassing it.

## Dependencies

- Stage 4 sufficiently complete that the system has real execution artifacts worth validating

## Exit criteria

Stage 5 is complete when:

- the repo can mechanically detect common contract/spec/router drift
- packet validity can be checked systematically
- team-routing definitions can be checked systematically
- diagram/spec mismatch is detectable rather than silently tolerated
- identity and activation inconsistencies are detectable
- adapter drift is detectable if adapter artifacts exist

## Notes and cautions

Validation should start with high-value checks, not exhaustive bureaucracy. The goal is drift prevention, not burden for its own sake.

---

# Stage 6 — Controlled team-layer expansion

## Purpose

Expand the team layer only after the first team and router have proven stable.

This stage exists to refine abstractions from real usage rather than speculative generalization.

## Goals

- add additional teams only when they test new useful patterns
- refine contracts and specs based on observed pain points
- improve the router incrementally from actual team usage
- maintain discipline around what belongs in team design versus what belongs in sequence design
- refine activation and discovery patterns as the active callable ecosystem grows

## Key deliverables

- one or more additional teams, if justified
- refined team contracts
- refined packet taxonomy, if justified
- improved runtime behavior based on real needs
- updated validation rules where needed
- better activation and indexing patterns if needed

## Sub-stages

### 6.1 Add a second team only if it adds new information

The next team should only be added if it exercises a meaningfully different routing pattern or exposes a weakness in the current abstractions.

### 6.2 Refine packet and contract structures from use

Use proven friction points rather than hypothetical edge cases to improve the packet model and team contracts.

### 6.3 Improve the router only when exemplars justify it

Do not overgeneralize the runtime based on imagined future complexity.

### 6.4 Stabilize team authoring patterns

Use accumulated examples to determine whether team templates, validation helpers, or authoring conventions need to be strengthened.

### 6.5 Refine active callable ecosystem rules

As more teams become active, refine how the system determines discoverability, eligibility, and activation state across specialists and teams.

## Dependencies

- Stage 5 sufficiently complete to support stable growth without rapid drift

## Exit criteria

Stage 6 is complete when:

- the team abstraction has been exercised beyond the first exemplar
- the router remains generic and understandable
- the team layer can grow without immediate conceptual breakdown
- the project has evidence-based confidence in the team model
- activation and discovery remain governed rather than ad hoc

## Notes and cautions

Do not allow controlled expansion to become uncontrolled expansion. Teams should be added because they teach the system something, not because the architecture allows it.

---

# Stage 7 — Sequence design and later implementation

## Purpose

Begin sequence-layer design only after the team layer is stable enough to support higher-order workflow composition.

This stage is intentionally deferred.

## Goals

- define sequences in terms informed by stable team behavior
- avoid prematurely designing a sequence runtime around assumptions that may change
- reuse shared lower-level machinery where appropriate
- preserve the distinction between team routing and sequence orchestration

## Key deliverables

- sequence contract
- machine-readable sequence execution definition
- human-readable sequence depiction
- sequence-runtime design and later implementation
- reuse strategy for shared lower-level state-machine and runtime components
- sequence activation rules

## Dependencies

- Stage 6 complete enough that the team layer feels stable, boring, and trustworthy

## Exit criteria

Stage 7 is complete when:

- sequences are defined from real lower-layer knowledge rather than speculation
- sequence behavior is clearly distinct from team behavior
- the sequence layer reuses lower-level mechanisms intelligently without collapsing abstractions

## Notes and cautions

Sequence work should remain explicitly deferred until the team layer is stable. The project should resist the temptation to design ahead too aggressively here.

---

# Stage 8 — Host-platform realization and packaging, when justified

## Purpose

Realize selected project-native objects on a host platform only when doing so materially improves execution, integration, distribution, or maintainability.

This stage exists to prevent premature platform coupling while still allowing practical integration when the lower layers are ready.

## Goals

- define which objects merit host-platform realization
- define adapter contracts for those realizations
- preserve project-native authority
- package stable implementation surfaces when appropriate

## Key deliverables

- host-platform adapter strategy
- adapter contracts
- any justified extension-like runtime adapter
- any justified skill-like or other host-platform realization artifacts
- package structure if stable bundling becomes useful

## Sub-stages

### 8.1 Decide which project-native objects merit realization

Not every object should become a host-platform artifact.

Only realize objects when there is a demonstrated implementation benefit.

### 8.2 Define adapter contracts

For any chosen realization, define:

- which canonical object it serves or realizes
- what documented platform surface it uses
- what it may and may not do
- how it respects canonical IDs and activation state
- how drift is detected

### 8.3 Realize selected runtime surfaces

The strongest near-term candidate remains the team router as a host-platform adapter if and when a host platform is actually used for runtime execution.

Other realization choices should be treated as optional and evidence-driven.

### 8.4 Package stable bundles if useful

Once realization artifacts are cohesive enough, bundle them into packages or equivalent deployment units where that materially improves versioning, reuse, or installation.

## Dependencies

- lower layers stable enough that platform realization will not constantly churn

## Exit criteria

Stage 8 is complete when:

- project-native authority remains intact
- realized artifacts are clearly adapters rather than replacements for governance
- any packages preserve architectural clarity rather than hide it
- platform coupling remains controlled and reversible

## Notes and cautions

This stage should not begin just because a host platform supports skills, extensions, prompt templates, packages, SDK, or RPC. Platform realization should follow need, not novelty.

---

## Cross-stage dependencies summary

The critical dependency chain is:

- Stage 0 enables consistent implementation
- Stage 1 enables specialist hardening
- Stage 2 enables team definition
- Stage 3 enables the router
- Stage 4 enables meaningful validation
- Stage 5 enables safe expansion
- Stage 6 enables informed sequence design
- Stage 7 enables cleaner host-platform realization decisions where needed

This dependency order is intentional and should not be casually bypassed.

---

## Immediate next practical arc

The next implementation arc should focus on the following sequence:

1. finish control-plane reconciliation
2. define canonical ID conventions
3. define packet model and packet contracts in YAML
4. define runtime artifact location and `runs/`-style separation from handoff
5. harden the initial specialist layer around packet-based I/O
6. define the team contract and team-routing spec format
7. create one exemplar team
8. build the generic team router against that exemplar
9. add validation to prevent drift
10. expand the team layer carefully
11. defer sequence execution work until the team layer is stable
12. defer host-platform realization decisions until they are justified by actual implementation needs

This is the canonical near-term implementation path.

---

## Explicitly deferred work

The following work is intentionally deferred and should remain out of scope until the appropriate stage is reached:

- sequence runtime implementation
- detailed sequence-routing architecture
- coordinator-agent design for especially complex teams
- broad adaptive routing behavior beyond declared team rules
- autonomous primitive activation without governance
- forcing specialists or other objects into host-platform-native forms without clear benefit
- premature generalization across many team patterns
- final language lock-in where the architecture does not require it
- rich template inheritance or template-engine sophistication before repeated real use justifies it
- cost/latency exception policy for bypassing fresh invocation before real execution data exists

Deferral is intentional discipline.

---

## How to use this document

This document should be used to:

- orient new contributors and agents
- determine what class of work is appropriate next
- evaluate whether a proposed implementation step is in the right stage
- identify dependencies before beginning a new subsystem
- avoid skipping foundational layers

This document should not be used to:

- track daily progress
- record live status
- replace current task handoff
- justify bypassing stage dependencies without explicit architectural reason

---

## Updating this document

This document should be updated when:

- the implementation sequence materially changes
- stage boundaries or exit criteria become clearer
- a previously deferred area becomes active
- proven implementation experience requires revising the staged plan

This document should not be updated merely to mirror everyday project churn.

---

## Summary statement

This project should be implemented in deliberate layers.

The immediate path is not toward complex orchestration or host-platform realization. The immediate path is toward a stable execution substrate:

- canonical identities for first-class objects
- packets as first-class execution artifacts in YAML form
- specialists as contract-bound typed transformers
- teams as contract-governed state machines
- one generic reusable team router
- runtime artifacts separated from handoff continuity
- validation to prevent drift
- controlled team expansion only after the first exemplar is proven
- sequence design only after the team layer is stable
- host-platform realization only when it is justified and can remain adapter-like

The project should preserve discipline in build order so that later sophistication rests on stable lower layers rather than on accumulated ambiguity.