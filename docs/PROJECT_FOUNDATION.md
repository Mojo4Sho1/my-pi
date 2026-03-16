# PROJECT_FOUNDATION.md

## Purpose of this document

This document is the stable canonical reference for the foundational design of this project.

It defines the project's identity, scope, architectural doctrine, object model, control philosophy, platform posture, identity model, activation model, interface posture, and long-term direction. It is intentionally durable and should change only when the project's foundational understanding changes.

This document is **not** the place for transient progress notes, current status, temporary task tracking, or implementation handoff details. Live project state belongs in `docs/handoff/`.

---

## What this project is

This project is the long-term source-of-truth repository for a coding-focused orchestration system.

Its purpose is to support a structured, reusable, agent-friendly working environment for software creation, improvement, and maintenance. The system is designed to help an orchestrator and its downstream execution units work predictably over time through explicit contracts, durable documentation, bounded access, reusable components, and inspectable execution flows.

The repository is not just a codebase. It is the canonical home for the project's:

- foundational architecture
- execution doctrine
- governance rules
- reusable primitives
- routing definitions
- templates
- seeds
- handoff continuity
- platform-integration posture
- identity and activation rules
- interface and discovery doctrine
- public package decomposition over time

---

## Why this project exists

This project exists to create a durable and composable system for coding work that can scale in sophistication without collapsing into ambiguity.

The core problem it addresses is that agentic systems often become unreliable when they depend on implicit state, freeform collaboration, unclear boundaries, weak interfaces, or scattered project truth. This repository is intended to solve that by making the system explicit.

The project therefore prioritizes:

- narrow responsibilities
- explicit contracts
- declarative routing
- durable documentation
- bounded context
- reusable execution primitives
- machine-checkable structure
- human-readable architecture
- portable governance independent of any one tool runtime
- discoverable and maintainable invocation surfaces

The goal is not merely to automate tasks. The goal is to create a system that can be reasoned about, maintained, extended, validated, and trusted over the long term.

---

## Long-term vision

The long-term vision is a coding-oriented orchestration substrate built from reusable primitives that can be composed into increasingly capable execution structures over time.

At maturity, the project should support:

- individual specialists that perform narrow bounded work
- teams that compose specialists through explicit state-machine routing
- sequences that compose teams and/or specialists into higher-order workflows
- reusable contracts, templates, specs, and help surfaces that reduce ambiguity
- machine-enforced routing and validation
- human-readable visualizations of execution structure
- command-oriented invocation surfaces with progressive discovery
- dynamic orchestrator selection of the best specialist, team, sequence, or combination for a task
- governed creation of new primitives when capability gaps are identified
- decomposition of stable subsystems into public standalone packages when appropriate

The intended growth path is deliberate. The project should first become correct, explicit, and stable at the primitive level before it becomes broad or elaborate.

---

## Scope

This project is specifically for coding-oriented orchestration and adjacent engineering support.

In scope:

- code generation and modification
- review
- testing
- planning for coding tasks
- repository maintenance
- routing and execution structure for coding work
- project documentation needed to support coding workflows
- architecture for reusable agent execution within coding contexts
- tooling and runtime support for contracts, packets, routing, activation, and validation
- visual and machine-readable representations of execution structures
- agent-facing help and discovery surfaces for governed capabilities
- platform adapters and integration layers that allow the project to run on supported external tool ecosystems

Out of scope unless explicitly re-scoped later:

- generic life management
- broad personal assistant behavior
- unrelated productivity workflows
- open-ended conversation systems not grounded in coding work
- vague general-purpose autonomy without explicit governance

This repository should remain disciplined in scope. It is a coding system first.

---

## Project boundary

This repository defines the coding-oriented substrate and its supporting doctrine. It is not required to contain every future implementation detail forever.

As portions of the system stabilize, some components may be extracted into their own public packages or repositories. When that happens, this repository remains the canonical source of intent, architecture, governance, and integration logic unless and until governance is explicitly moved elsewhere.

This means the repository may eventually reference external packages or platform-specific artifacts while still preserving:

- foundational truth
- execution doctrine
- governance rules
- integration relationships
- identity and activation rules
- interface and discovery posture
- public/private decomposition strategy
- stable architectural intent

The project should remain architecturally portable even when it is implemented on top of a specific platform.

---

## Platform posture

The project may be implemented using a host platform that supports concepts such as extensions, skills, prompt templates, packages, settings, SDKs, RPC interfaces, or similar integration surfaces.

However, the project's core architecture must not be reduced to the host platform's native vocabulary.

This repository therefore distinguishes between:

- **project-native architecture**, which defines the durable concepts of this system
- **platform-native implementation artifacts**, which are one possible way of realizing those concepts on a specific host platform

This distinction exists to preserve long-term maintainability and to reduce coupling to any one runtime ecosystem.

The project does not require every project-native object to have a host-platform realization. Host-platform artifacts should exist only when they materially improve execution, integration, distribution, interface quality, or maintainability.

---

## Core design principles

### 1. Reusable primitives before conveniences

The system should be built from reusable foundational components before introducing higher-level convenience abstractions.

Specialists come before teams.  
Teams come before sequences.  
Stable routing comes before adaptive orchestration.  
Explicit governance comes before automation convenience.

---

### 2. Complexity through composition

Higher-order behavior should emerge from composing simpler well-governed units rather than from building overly broad units that do too much.

The project should prefer:

- small well-defined primitives
- explicit interfaces
- declared transitions
- layered composition

over:

- monolithic agents
- hidden dependencies
- implicit coordination
- broad undefined responsibility

---

### 3. Orchestrator-first control

The orchestrator remains the default broad-context control authority for the system.

Downstream units should be narrower in responsibility and narrower in visibility unless explicitly granted broader access by design.

The system should default toward:

- central coordination of broad context
- local execution of bounded work
- explicit routing
- explicit escalation

rather than allowing downstream units to infer or accumulate broad hidden context.

---

### 4. Explicit access boundaries

Access should be intentionally granted, not assumed.

Units should receive the minimum context and artifacts needed to perform their role correctly. This applies to specialists, teams, and future higher-order structures.

The system should prefer:

- bounded task packets
- declared inputs
- bounded outputs
- explicit handoff artifacts

over unrestricted repository awareness or open-ended conversational memory.

---

### 5. Documentation-first continuity

Durable documentation is part of the system, not an afterthought.

Important design knowledge should live in stable, inspectable, versioned artifacts rather than in implicit memory or transient conversations.

The project should maintain clear distinctions between:

- stable foundational truth
- machine-readable execution definitions
- normative governance artifacts
- live handoff state
- generated run artifacts
- host-platform adapter artifacts
- help and discovery artifacts

---

### 6. Contract-governed execution

The system should prefer contract-governed execution over unconstrained collaboration.

Work units should not rely on informal interpretation of prose when predictable structure can be declared explicitly. Inputs, outputs, invariants, allowed transitions, terminal conditions, and activation rules should be represented through contracts and machine-readable artifacts wherever practical.

Predictability comes from declared interfaces and declared routing, not from assuming that downstream actors will "figure it out."

---

### 7. Structured packets over freeform inter-agent dialogue

Execution units should communicate primarily through contract-defined packets and other declared artifacts rather than through unconstrained natural-language exchange.

Narrative explanation may still exist for observability and debugging, but it is not the authoritative control surface of the system.

Routing and validation should depend on declared fields and declared rules, not on prose interpretation alone.

---

### 8. Human-readable and machine-readable parity

Important execution structures should be legible both to machines and to humans.

When a team or workflow exists, the system should strive to maintain both:

- a machine-readable definition suitable for enforcement and validation
- a human-readable depiction suitable for inspection and understanding

This principle exists to support both operational correctness and architectural clarity.

---

### 9. Platform insulation through adapter boundaries

The project should integrate with external platforms through documented adapter surfaces rather than by collapsing its architecture into platform-specific assumptions.

Platform-native artifacts are useful, but they should be treated as implementation vehicles rather than as the project's only source of truth.

This principle exists to make the project resilient to platform evolution, replacement, or partial migration.

---

### 10. Fresh bounded invocation over role mutation

When the system invokes a specialist or higher-order execution unit, it should prefer fresh bounded invocation over role swapping within a long-lived general session.

This principle preserves:

- bounded context
- reproducibility
- cleaner interfaces
- reduced hidden state
- clearer failure analysis

Role mutation may be useful in limited situations, but it should not be the default architectural model.

---

### 11. Canonical identity over filename or adapter identity

Project-native objects should have stable canonical identities that do not depend on filenames, directory location, or host-platform realization artifacts.

This principle exists to prevent drift when objects are moved, renamed, versioned, or realized on multiple host platforms.

---

### 12. Activation is a governed state, not mere existence

An object should not be treated as active merely because a file exists.

Callable participation in the system should be an explicit governed state that follows validation, indexing, and admission into the active callable ecosystem.

---

### 13. CLI-first adapter posture where practical

Where the project exposes governed capabilities through an adapter layer, it should prefer command-oriented, text-based, discoverable interfaces over bespoke opaque protocol surfaces when practical.

This principle exists to improve maintainability, portability, inspectability, and agent usability without collapsing project governance into the adapter itself.

---

### 14. Progressive discovery over prompt overloading

The project should prefer interfaces that allow an agent or human to discover capability progressively through concise command lists, help output, subcommand usage, and man-page-style references instead of relying on large static prompt dumps.

This principle exists to preserve context efficiency and improve long-term usability.

---

### 15. Errors should guide recovery

When an invocation fails, the system should prefer error output that helps the caller recover.

Errors should be informative, actionable, and aligned with governed usage surfaces rather than merely reporting failure.

---

## Foundational execution doctrine

The project adopts the following execution doctrine.

### Specialists do not collaborate through freeform conversation by default

A specialist should receive bounded declared input, perform narrow work, and emit bounded declared output. It should not be expected to negotiate control flow conversationally with peer specialists.

### Teams are not group chats

A team is not a loose collection of specialists exchanging prose until work finishes. A team is a governed execution structure with explicit routing rules, entry conditions, transition conditions, and terminal outcomes.

### Routing is authoritative

Routing authority belongs to declared team execution rules and the runtime that enforces them. Specialists do not choose downstream recipients by default.

### Packets carry execution state across boundaries

Packets and related execution artifacts are first-class mechanisms for transferring bounded work, routing signals, and results between units.

### Narrative is secondary

Human-readable explanation is useful for traceability, debugging, and auditability, but should remain secondary to declared fields and declared routing artifacts.

### Validation is expected

Wherever practical, contracts, packets, transitions, execution definitions, and activation boundaries should be machine-checkable before downstream consumption.

### Fresh invocation is preferred

When invoking specialists, teams, or future higher-order units, the project should prefer creating fresh bounded executions over mutating the identity of an already-running broad-context actor.

### Discovery should be on-demand

Where the system provides interactive usage surfaces, discovery should happen on demand through help/man/usage mechanisms rather than by assuming the entire interface must be loaded into context up front.

---

## Canonical identity doctrine

Every first-class project-native object should have a stable canonical ID.

Canonical IDs should be:

- human-readable
- stable across file renames and moves
- meaningful enough to inspect in git and documentation
- unique within the repository's object namespace

Canonical IDs should be used to identify objects such as:

- specialists
- teams
- sequences
- packet types
- contracts
- templates
- seeds
- platform adapters
- help/man artifacts
- other governed objects as needed

Filenames are implementation details. Friendly display names are presentation details. Canonical IDs are identity.

Where host-platform artifacts exist, they should declare which canonical object they realize rather than becoming the object's identity themselves.

---

## First-class object model

The system recognizes the following as first-class project objects.

### 1. Specs

Specs are durable descriptive artifacts that preserve project truth about an object, subsystem, or execution structure.

A spec explains what something is, what it contains, how it is organized, or how it should be interpreted.

Specs are descriptive, architectural, and durable.

Examples include:

- architecture specs
- object specs
- execution specs
- machine-readable routing specs

---

### 2. Contracts

Contracts are first-class governance artifacts.

A contract defines what is valid, required, allowed, forbidden, expected, or guaranteed for a project object or interaction surface. Contracts exist to reduce ambiguity and constrain behavior.

Contracts are normative rather than merely descriptive.

Contracts may govern:

- specialists
- teams
- sequences
- packets
- templates
- handoff artifacts
- host-platform adapter artifacts
- help/man surfaces
- other project objects as needed

A spec may describe an object, but a contract governs validity and behavior.

---

### 3. Packets

Packets are first-class execution artifacts.

A packet is a bounded structured artifact used to transfer work, state, decisions, or results between execution units or between stages of an execution structure.

Packets should be designed to support predictable routing, bounded context, and machine validation.

The canonical packet format should be YAML unless and until the project explicitly adopts a different canonical format.

Packets may represent:

- incoming work
- intermediate outputs
- review results
- build results
- test results
- team transition state
- terminal results
- escalation requests

Packets are execution artifacts, not general prose notes.

---

### 4. Specialists

Specialists are primitive execution units with narrow responsibility.

A specialist should be a contract-bound typed transformer: it accepts declared inputs, performs bounded work, and emits declared outputs subject to invariants and failure rules.

A specialist should remain narrow enough that its behavior is inspectable, testable, and reusable.

Specialists are the foundational execution primitive from which higher-order structures are composed.

At present, specialists are project-native governed objects. A host-platform realization may exist later if it materially improves execution, but a host-platform artifact is not required for a specialist to exist.

---

### 5. Teams

Teams are reusable compositions of specialists governed by explicit routing and execution rules.

A team is a contract-governed state machine over specialists. It defines:

- entry conditions
- member roles
- allowed transitions
- terminal states
- routing authority
- expected outputs
- failure and escalation conditions

A team is a local execution structure, not merely a list of members.

Teams are project-native architectural objects even when their execution is hosted through platform-specific tooling.

---

### 6. Sequences

Sequences are higher-order reusable workflow structures that compose specialists and/or teams into broader repeatable execution patterns.

A sequence exists above the team layer. It governs ordered or branched progression across larger phases of work.

Sequence design is intentionally deferred until the team layer and team router are stable. Sequences are part of the long-term model, but they are not the immediate implementation priority.

---

### 7. Templates

Templates are construction artifacts used to create new valid objects in a consistent form.

Templates are not contracts. A template helps create an artifact. A contract defines what makes that artifact valid.

Templates should exist when they materially improve consistency, reduce ambiguity, or lower the burden of creating new project objects.

Templates may be project-native, host-platform-native, or both, depending on the artifact being generated.

---

### 8. Seeds

Seeds are starting-point artifacts used to bootstrap a new project, subsystem, or configuration bundle with sensible initial structure.

Seeds are distinct from templates. A template typically describes how to form a specific artifact. A seed provides an initial bundle or scaffold from which work begins.

---

### 9. Handoff artifacts

Handoff artifacts preserve live project continuity.

They hold dynamic state such as:

- current status
- active task
- queue state
- pending decisions
- recent outcomes
- transitional execution context

They are intentionally separate from stable foundational and architectural documents.

---

### 10. Platform adapters

Platform adapters are first-class implementation-layer artifacts that map project-native concepts onto host-platform mechanisms.

Examples may include:

- extension-based runtimes
- skill generation or export layers
- prompt-template front doors
- package manifests
- SDK or RPC wrappers
- settings bridges
- command-oriented adapter surfaces

Platform adapters are important implementation artifacts, but they do not replace project-native contracts, specs, routing definitions, or canonical identities.

---

### 11. Help and discovery artifacts

Help and discovery artifacts provide governed usage surfaces for humans and agents.

Examples may include:

- command help output
- subcommand usage references
- man-page-style documentation
- concise command indexes
- recovery-oriented error references

These artifacts exist to make governed capabilities discoverable and usable. They are not replacements for contracts or specs.

---

## Contracts and their roles

Because contracts are first-class governance objects, the system should treat different contract levels distinctly.

### Specialist contracts

A specialist contract should define the specialist as a narrow bounded transformer.

Typical concerns include:

- canonical ID
- purpose
- allowed inputs
- required input schema
- expected outputs
- output schema
- invariants
- forbidden assumptions
- failure conditions
- escalation conditions
- side-effect policy
- acceptance criteria
- activation prerequisites
- mapping to any host-platform realization, if applicable

Specialists should remain simple enough that their contracts are clear and enforceable.

---

### Team contracts

A team contract should define the team as a governed execution structure rather than merely listing members.

Typical concerns include:

- canonical ID
- team purpose
- member specialists
- entry packet type
- exit packet type
- routing principles
- allowed states
- terminal conditions
- escalation conditions
- invariants
- validation expectations
- coordination model
- activation prerequisites
- relationship to the team's machine-readable routing spec
- relationship to any host-platform execution adapter

The team contract is normative and human-readable.

---

### Sequence contracts

A sequence contract should define the conditions and structure of higher-order workflow execution.

Typical concerns include:

- canonical ID
- sequence purpose
- eligible entry conditions
- participating specialists and/or teams
- ordered stages
- branching rules
- completion criteria
- abort criteria
- recovery expectations
- activation prerequisites
- relationship to machine-readable sequence execution definitions
- relationship to any host-platform execution adapter

Sequence contracts should remain conceptual until the team layer is stable enough to support them well.

---

### Packet contracts

Packet contracts define the structure and semantics of execution packets.

Typical concerns include:

- canonical packet type ID
- required fields
- optional fields
- authoritative routing fields
- producer rules
- consumer rules
- validation rules
- terminal or non-terminal meaning
- compatibility expectations

Packet contracts are critical because predictable routing depends on predictable packet structure.

---

### Platform adapter contracts

Where a host platform is used, the project may define contracts for adapter-layer artifacts.

Typical concerns include:

- canonical adapter ID
- which project-native object the adapter realizes or serves
- required documented platform surface
- allowed dependencies on host-platform features
- persistence expectations
- invocation semantics
- activation prerequisites
- upgrade and migration expectations
- failure isolation behavior
- discovery/help expectations if the adapter is user- or agent-facing

Adapter contracts exist to prevent platform integration from becoming an ungoverned side channel.

---

### Help and discovery contracts

Where the project provides command-oriented or interactive usage surfaces, it may define contracts for help and discovery behavior.

Typical concerns include:

- which governed capability the help surface documents
- required usage synopsis
- subcommand or option discovery expectations
- examples policy
- recovery/error guidance expectations
- relationship to canonical objects and adapter surfaces

These contracts exist to keep help/man surfaces aligned with governed capabilities rather than letting them drift into stale prose.

---

## Teams as state machines

A team should be modeled as a state machine, not as a freeform collaboration space.

This means a team should define, directly or indirectly:

- valid states
- start state
- allowed emitting members
- valid transition conditions
- terminal states
- failure states
- escalation states
- output conditions

A team's internal execution should be understandable as a set of governed transitions over declared artifacts.

This design is intended to:

- preserve specialist purity
- avoid hidden routing logic
- reduce ambiguity
- support validation
- improve debugging
- support future automation of team creation
- make team behavior legible to humans and machines

---

## Team coordination model

By default, teams should not require a dedicated coordinator agent.

However, every true team must have an explicit coordination mechanism.

The default project position is:

- no dedicated coordinator agent by default
- yes to explicit coordination authority
- yes to explicit routing ownership
- yes to runtime enforcement of transitions
- no to specialists selecting downstream recipients by default

The preferred default is a non-agentic coordination mechanism: a reusable runtime that enforces the team's declared routing rules.

This keeps specialists narrow while keeping team behavior predictable and inspectable.

A dedicated coordinator agent remains a possible future exception for unusually complex teams, but it is not part of the default design and may never be necessary.

---

## Team routing runtime

The project intends teams to be executed by a generic reusable routing runtime rather than by per-team hardcoded logic.

The runtime should be team-agnostic. Team-specific behavior should live in team-specific declared artifacts, not in custom router code for each team.

The routing runtime should, at minimum, support the following responsibilities:

- load a team's machine-readable routing definition
- validate incoming packets against packet contracts
- validate current state against team rules
- determine legal next transitions
- reject invalid transitions
- emit the next valid task or handoff artifact
- persist execution state and trace information
- recognize terminal, failure, and escalation outcomes

The specific implementation language is intentionally not fixed at the foundation level. The first implementation may be in Python, but the architecture should remain language-agnostic.

If hosted on a platform that supports extensions or similar runtime hooks, the team router may be realized there as a platform adapter, but the routing logic must remain governed by project-native contracts and specs.

If a command-oriented interface exists for the router, it should remain an adapter surface over governed routing rather than becoming the routing source of truth.

---

## Machine-readable routing definitions

Each team should have a machine-readable execution definition that declares how the team routes work.

This artifact should describe, directly or indirectly:

- valid states
- start state
- terminal states
- member associations
- transition rules
- accepted packet types
- authoritative routing fields
- validation expectations

This routing definition is a first-class part of team execution and should be treated as a durable governed artifact.

It may be implemented as a dedicated state-machine spec or as a clearly defined machine-readable team execution spec. The project should prefer clarity and enforceability over taxonomy purity.

---

## Human-readable routing depictions

Each team should also have a human-readable routing depiction.

This artifact exists so that humans can quickly understand how a team behaves without reading low-level machine definitions or runtime code.

The project intends teams to have both:

- a machine-readable routing definition used by tooling and runtime enforcement
- a human-readable depiction used for inspection, discussion, and maintenance

The exact rendering format may evolve over time, but the requirement for legible human-readable routing should remain.

This is especially important because future systems that create new teams should be expected to generate both the machine-readable routing definition and the human-readable visual depiction before a team is considered complete.

---

## Specialists as typed transformers

A specialist should be treated as a typed transformer with bounded authority.

A specialist should:

- accept declared inputs
- perform narrow bounded work
- emit declared outputs
- respect its contract
- avoid making undeclared assumptions
- avoid taking over routing authority

A specialist should not:

- infer broad project state unless explicitly provided
- decide arbitrary downstream routing
- silently change packet structure
- rely on prose as the sole control surface
- become a disguised mini-orchestrator

This doctrine exists to preserve composability and predictability.

---

## Routing doctrine

The following routing rules should guide the project.

### 1. Routing depends on declared fields

The system should route based on explicit structured fields and declared transition rules, not on prose interpretation alone.

### 2. Specialists do not choose recipients by default

A specialist emits a valid contract-governed output. The routing authority determines what happens next.

### 3. Invalid transitions should fail clearly

When a transition is invalid, the system should reject it explicitly rather than silently guessing.

### 4. Validation precedes downstream consumption

Wherever practical, packets and transition artifacts should be validated before a downstream unit is asked to consume them.

### 5. Terminal conditions should be explicit

Success, failure, blocked, and escalation conditions should be declared rather than implied.

### 6. Fresh invocations should preserve boundedness

Invocation mechanisms should preserve clean execution boundaries rather than encouraging long-lived context accumulation or role mutation.

### 7. Interactive usage should be progressively discoverable

Where the project exposes command-like or help-like usage surfaces, a caller should be able to discover capability progressively through command listings, help output, subcommand usage, and related references.

---

## Fresh specialist invocation doctrine

A fresh specialist invocation should receive only the minimum bounded inputs required to perform its work correctly.

The default minimum bounded input set is:

- the specialist contract or a governed distilled execution definition derived from it
- the task packet
- the allowed read set
- any explicitly approved helper resources

Nothing else should be included by default.

The exact transport mechanism for these inputs is an implementation concern and may vary by runtime or host platform. The architectural requirement is boundedness, not a specific transport format.

---

## Activation doctrine

Activation is a governed state transition for project objects that participate in runtime selection or execution.

An object should be considered **active** only when all applicable requirements are satisfied, including:

- the object exists in valid governed form
- required validation has passed
- the object is indexed or otherwise discoverable by the system
- the object is marked eligible for runtime selection or use
- if a host-platform realization exists, that realization is properly associated with the canonical object

Activation is therefore distinct from:

- draft existence
- candidate existence
- file presence
- unreviewed generation

Activation is admission into the active callable ecosystem.

---

## Interface and discovery doctrine

Where the project exposes governed capabilities through an adapter surface, it should prefer interfaces that are:

- text-based where practical
- command-oriented where appropriate
- progressively discoverable
- aligned with canonical objects
- recoverable through good help and error output

This does not mean every governed object must become a command or CLI artifact. It means that when the project chooses to expose an invocation surface, that surface should be easy to inspect, easy to document, easy to validate, and easy for an agent to navigate.

The project should prefer:

- concise command indexes
- `--help`-style usage output
- subcommand discovery
- man-page-style documentation where useful
- examples only when they materially improve clarity
- consistent invocation semantics where practical

The project should avoid requiring large static prompt dumps simply to explain how to use governed capabilities.

---

## Error and diagnostics doctrine

Errors should help the caller recover rather than merely report failure.

Where the project provides interactive or command-like interfaces, errors should aim to communicate:

- what failed
- why it failed, if known
- which governed object or input was involved
- what the caller can try next
- which help surface or command is relevant, when applicable

Diagnostics should preserve useful failure detail rather than hiding it.

If the runtime distinguishes between normal output and failure diagnostics, the system should preserve that distinction rather than collapsing failures into vague summaries.

---

## Validation doctrine

Validation is not optional decoration. It is part of the architecture.

The project should strive for machine-checkable validation of:

- contract structure
- packet structure
- routing definitions
- transition legality
- index consistency
- cross-reference integrity
- declared-vs-actual object shape
- adapter-layer conformance to project governance
- activation preconditions where applicable
- help/discovery alignment where applicable

The purpose of validation is not merely correctness in isolation. It is also to prevent architectural drift and reduce ambiguity over time.

---

## Host-platform mapping doctrine

The project may use a host platform with its own artifact types. When that happens, the following mapping doctrine should apply.

### Project-native objects remain authoritative

The project-native contract, spec, routing definition, canonical identity, and activation rules remain authoritative even when a host-platform realization exists.

### Host-platform artifacts are optional realizations

A host-platform artifact should exist only when it materially improves execution, integration, distribution, or maintainability.

The project should not force every project-native object into a host-platform-native form prematurely.

### Team routing may map to extensions or equivalent runtime hooks

A host platform's extension-like construct may be an appropriate implementation vehicle for the team routing runtime, provided that:

- the router remains generic and team-agnostic
- routing behavior is driven by project-native specs and contracts
- the extension does not become a substitute for project governance
- platform-specific behavior is isolated behind adapter boundaries

### Command-like adapter surfaces are preferred where practical

Where a host platform can expose governed capabilities through commands, command help, or equivalent text-based discovery surfaces, the project should prefer that style when it improves usability and maintainability.

This preference does not require the project to adopt any specific external protocol. It is an interface posture, not a protocol commitment.

### Prompt templates may exist as convenience front doors

Prompt-template-like constructs may be used for ergonomic entrypoints, scaffolding, or operator convenience, but they should not become the authoritative home of:

- specialist identity
- packet semantics
- routing rules
- team definitions
- sequence definitions
- foundational governance

### Packages may bundle stable implementation surfaces

When platform-native artifacts become cohesive enough, they may be bundled and versioned as packages or equivalent deployment units. Packaging should preserve architectural clarity rather than hide it.

---

## Primitive hierarchy and growth order

The project should continue to grow in the following order:

1. specialists
2. packet contracts and packet structure
3. team contracts
4. team machine-readable routing definitions
5. generic team routing runtime
6. team visualization and supporting validation
7. richer team reuse patterns
8. sequence contracts and sequence execution definitions
9. sequence routing and runtime
10. dynamic primitive selection and governed primitive creation
11. richer discovery/help/man surfaces for stable governed capabilities
12. higher-order automation and package decomposition where appropriate

This hierarchy is intentional. The project should learn to walk before it runs.

---

## Templates, contracts, and seeds

These object types serve different purposes and should remain distinct.

### Contracts

Normative governance artifacts that define validity, behavior, interface expectations, and activation requirements.

### Templates

Construction artifacts that help create new valid objects in a consistent form.

### Seeds

Bootstrap bundles that create an initial starting structure for a project, subsystem, or configuration set.

The project should preserve these distinctions because they reduce ambiguity for both humans and agents.

---

## Documentation structure doctrine

The repository should organize documentation so that both humans and agents can find the relevant governing material with minimal ambiguity.

The preferred pattern is:

- stable global foundation documents for durable architectural truth
- local indexes for major subtrees
- local contracts near the artifacts they govern
- centralized templates when centralization improves discoverability
- explicit handoff artifacts for live state
- explicit platform adapter docs when implementation artifacts depend on an external host runtime
- explicit help/man/discovery artifacts where interactive usage surfaces exist

This means the project should generally favor:

- colocated governance
- discoverable indexes
- centralized generation artifacts when useful
- minimal routing hops to find the right governing documentation
- separation between project-native truth and platform-native implementation files
- separation between normative governance and usage/help surfaces

---

## Stable truth vs live truth

The project should continue to distinguish clearly between stable truth and live truth.

### Stable truth

Belongs in foundational documents, durable contracts, stable specs, and other long-lived architectural artifacts.

### Live truth

Belongs in handoff materials, active task packets, queue state, run state, and current execution context.

This separation prevents foundational documents from becoming cluttered with transient operational detail.

---

## Runtime artifact separation

Runtime-produced artifacts should remain separate from handoff continuity artifacts.

`docs/handoff/` exists for human-readable live project continuity, not for raw execution traces or high-volume runtime output.

Runtime artifacts such as:

- run state snapshots
- transition logs
- packet histories
- execution traces
- terminal run summaries
- command invocation traces where applicable

should live in a dedicated runtime-oriented subtree, such as `runs/`, rather than in `docs/handoff/`.

The exact runtime subtree structure may evolve, but runtime output should remain clearly separated from stable docs and handoff continuity.

---

## Public decomposition and future packaging

As the project matures, some stable subsystems may be extracted into public standalone packages or repositories.

Likely future extraction candidates may include:

- routing runtimes
- validation tooling
- spec utilities
- visualization tooling
- reusable packet and contract infrastructure
- platform adapter packages
- governed specialist bundles
- command/help/man surface packages if they become stable and reusable

Any such decomposition should preserve the coherence of the overall architecture. Extraction is a packaging decision, not a license to scatter project truth.

---

## Dynamic primitive selection and creation

A long-term goal of the project is for the orchestrator to choose, at runtime, the most appropriate specialist, team, sequence, or combination thereof for a given task.

This capability should be built only after the lower layers are stable.

A further long-term goal is governed primitive creation: the system should eventually be able to identify capability gaps and participate in the creation of new specialists, teams, or other primitives when justified.

However, primitive creation must be governed.

The project should distinguish between:

- generating a candidate primitive artifact
- validating that primitive against project contracts
- reviewing and approving it
- activating it
- adding it to the active callable pool

The project should not treat primitive creation as unrestricted autonomous self-modification.

---

## Governed specialist creation

The project may eventually support the creation of specialists and, if useful, their host-platform realization artifacts.

When that happens, the creation path should remain governed.

A specialist should not be considered active merely because an orchestrator can draft it.

The preferred long-term path is:

1. identify a capability gap
2. invoke a governed specialist-creation process
3. generate the specialist contract, any realization artifact, and supporting validation materials
4. review and validate the candidate
5. activate it only after acceptance

This doctrine exists to preserve maintainability and prevent ungoverned capability sprawl.

---

## Near-term priorities

The near-term priorities of the project should be:

1. preserve a stable and coherent documentation ontology
2. define specialists as contract-bound typed transformers
3. define packets as first-class execution artifacts in YAML form
4. elevate contracts to first-class governance objects
5. define teams as contract-governed state machines
6. create team contracts and machine-readable routing definitions
7. build a generic reusable team routing runtime
8. provide validation support for packets and transitions
9. require human-readable routing depictions for teams
10. define a clean host-platform adapter posture without over-coupling to any one platform
11. preserve canonical identity and governed activation across all first-class objects
12. define command/help/man posture as an interface layer over governed capabilities, not a replacement for them
13. defer sequence execution design until the team layer is stable

These priorities should guide current work even as details evolve iteratively.

---

## What success looks like

The project is succeeding when:

- architectural truth is explicit and durable
- specialists remain narrow and reusable
- contracts materially reduce ambiguity
- packets make execution boundaries clear
- teams behave like inspectable governed state machines
- routing is explicit and enforceable
- validation catches drift early
- canonical identity remains stable across moves, renames, and realizations
- activation is governed rather than implied
- humans can understand system behavior from the docs
- machines can execute system behavior from declared artifacts
- host-platform integrations remain adapters rather than architectural replacements
- fresh bounded invocation is the norm rather than role mutation
- command/help/man surfaces make governed capabilities easier to discover without replacing governance
- errors guide recovery rather than forcing guesswork
- growth into higher-order structures happens only after the lower layers are stable

---

## Intentionally deferred design

The project intentionally defers some higher-order design until the lower layers are proven.

Deferred areas include:

- sequence runtime details
- sequence-specific routing implementation
- dedicated coordinator agents for unusually complex teams
- broad adaptive orchestration patterns beyond what the stable team layer requires
- autonomous primitive activation without governance
- sophisticated host-platform realization strategies for all project-native objects
- final choices of serialization beyond the current canonical packet format where the architecture does not require them
- final choices of rendering, packaging, or implementation language where the architecture does not depend on them
- rich shell-style composition semantics for command surfaces before the governed capability model is stable

Deferral is intentional discipline, not incompleteness.

---

## Iteration policy

This document is stable but not frozen.

It should be revised when foundational understanding changes, when key architectural doctrine becomes clearer, or when previously open design questions become settled enough to deserve canonical expression.

It should not be revised merely to record transient activity, temporary implementation notes, or changing operational status.

The project is expected to iterate. The purpose of this file is to capture the most durable conclusions of that iteration.

---

## Summary statement

This project is a coding-focused orchestration substrate built on explicit contracts, first-class packets, reusable specialists, contract-governed teams, durable documentation, bounded execution, stable canonical identity, governed activation, discoverable usage surfaces, and insulated platform integration.

Its default execution philosophy is not freeform agent collaboration. Its default philosophy is explicit governance, explicit routing, explicit validation, and composable execution structures.

Specialists are narrow typed transformers.  
Teams are governed state machines over specialists.  
Sequences are higher-order workflows that will follow once teams are stable.  
Contracts define validity.  
Specs preserve truth.  
Packets carry execution state.  
Templates help create valid artifacts.  
Seeds bootstrap new structure.  
Platform adapters realize project-native concepts on external runtimes without replacing them.  
Help/man/discovery artifacts expose governed capabilities without replacing governance.  
Handoff artifacts preserve live continuity.  
Runtime artifacts remain separate from handoff continuity.  
Canonical IDs preserve stable identity.  
Activation governs admission into the callable system.  
Command-oriented interfaces are preferred where practical.  
Errors should help the caller recover.

The system should remain disciplined, inspectable, composable, portable, and discoverable as it grows.