# INDEXING AND CONTEXT ROUTING DESIGN

## Status

Implemented as a documentation and repo-convention rollout on 2026-04-07. This pass added routing docs and index files, preserved the existing root `INDEX.md` as the single naming-convention exception, and did not add runtime enforcement.

## Purpose

This document defines a repo-wide approach for reducing unnecessary context loading, especially around large planning documents and dense documentation directories.

The immediate goal is to prevent agents from reading large files such as `docs/IMPLEMENTATION_PLAN.md` by default when they only need a narrow slice of information. The broader goal is to establish durable repository conventions so future agents with empty context can navigate the repo efficiently and consistently.

This design document is intended to drive an implementation pass. Once the implementation is complete and the repo has been updated accordingly, this document may be archived per the repo's normal design-doc workflow.

---

## Background

The repo currently contains at least one very large planning document, `docs/IMPLEMENTATION_PLAN.md`. In practice, agents may default to reading that entire file even when they are only working on a specific task, validation item, or subsystem. That creates unnecessary token spend and increases the risk of noisy or unfocused context.

This is especially undesirable for:

- the orchestrator, which should package narrowed context rather than pass broad repo context
- sub-agents, which should usually only read the minimum relevant material
- routine implementation or validation tasks that do not require architecture-wide replanning

The repo already has a structure that could benefit from routing aids, including directories such as `docs/validation/` and `docs/handoff/`. The repo should adopt an explicit index-first navigation model.

---

## Core Decisions

### 1. Adopt index-first context routing

Agents should consult a local index document before reading large documentation sets or large planning documents.

The goal is to help agents answer these questions before opening many files:

- What is this area of the repo for?
- Which file is authoritative for this question?
- Which file should be read first?
- Which files are likely unnecessary for the current task?
- Is reading the full planning document justified?

### 2. Use uniquely named index files

This repo will not use repeated generic filenames like `INDEX.md`.

Instead, every index file must:

- begin with an underscore
- include the name of the item it indexes before the word `INDEX`
- use all capital letters to match the repo's existing style for this class of documentation files

Examples:

- `docs/_DOCS_INDEX.md`
- `docs/validation/_VALIDATION_INDEX.md`
- `docs/handoff/_HANDOFF_INDEX.md`
- `docs/_IMPLEMENTATION_PLAN_INDEX.md`

This convention exists for three reasons:

- it keeps index files near the top of a directory tree
- it avoids duplicate filenames across the repo
- it makes the indexed scope obvious from the filename alone

### 3. Separate architecture decision from repo convention

This implementation should create two durable documents:

1. a repo conventions file for practical rules
2. an ADR for the architectural decision to use index-first context routing

The conventions file should capture operational rules such as naming, directory navigation, and document access behavior.

The ADR should capture the higher-level architectural decision and why the repo is adopting this pattern.

### 4. Do not require the full implementation plan for routine work

The repo should explicitly document that agents should not read the full `docs/IMPLEMENTATION_PLAN.md` for routine task execution.

Reading the full implementation plan should be reserved for cases such as:

- architecture-wide replanning
- implementation-plan maintenance or refactoring
- cross-stage design decisions
- explicit user instruction requiring a full-plan review

For ordinary work, agents should use a companion index and then read only the relevant sections of the implementation plan.

### 5. Add directory indexes where they improve routing

Dense directories should contain a local index document that helps agents choose the right file quickly.

This especially applies to directories such as:

- `docs/validation/`
- `docs/handoff/`
- any other documentation-heavy directory where agents may otherwise browse many files unnecessarily

### 6. Make this convention durable for future repos

This implementation should not only update the current repo. It should also update the repo's durable documentation so future agents understand the model.

This design should later become part of the seed flow for new repos, but that seed work does not need to be fully implemented in this pass unless it is already straightforward and truthful to do so.

---

## Required Repository Changes

### A. Create a durable repo conventions document

Create a persistent conventions file that future agents can use as a first-stop reference.

Recommended path:

- `docs/REPO_CONVENTIONS.md`

This file should explain at minimum:

- the distinction between design docs and ADRs
- index naming conventions
- the rule against repeated generic `INDEX.md` filenames
- the rule that index files begin with `_`
- the expectation that agents consult indexes first
- the rule that the full implementation plan is rarely read end-to-end
- how agents should decide whether a full-plan read is justified

This document should be practical and directive, not theoretical.

### B. Create an ADR for index-first context routing

Create an ADR at a path consistent with the repo's preferred naming style.

Recommended path:

- `docs/adr/0002_INDEX_FIRST_CONTEXT_ROUTING.md`

If the numbering should be different because another ADR already exists, adjust the number accordingly.

This ADR should record:

- context
- decision
- consequences

It should explain why the repo is adopting index-first routing, why broad default reads are undesirable, and how this supports narrowed context for orchestrated work.

### C. Create a companion index for the implementation plan

Create:

- `docs/_IMPLEMENTATION_PLAN_INDEX.md`

This file should be short, operational, and organized so an agent can determine which portion of `docs/IMPLEMENTATION_PLAN.md` is relevant without reading the whole file.

It should include for each major stage or section:

- stage/section name
- one-sentence purpose
- when to read it
- when not to read it
- related files if applicable

It should also include an explicit instruction near the top such as:

- do not read the full implementation plan for routine task execution
- use this index to identify the minimum relevant section first

This file should complement the existing plan rather than duplicate it.

### D. Add local indexes to dense documentation directories

Audit the `docs/` tree and add index files where they would materially improve navigation.

At minimum, evaluate and likely add:

- `docs/_DOCS_INDEX.md`
- `docs/validation/_VALIDATION_INDEX.md`
- `docs/handoff/_HANDOFF_INDEX.md`

Each index should explain:

- purpose of the directory
- important files
- which files are authoritative for which questions
- common access patterns
- when a reader can skip certain files

Do not add indexes mechanically to trivial directories that do not need them.

### E. Update existing documentation to point agents to indexes first

Search for documentation that currently encourages broad reads or lacks routing guidance.

Update those docs so they consistently reflect the new model:

- consult local index first
- read the minimum relevant file or section
- avoid full-plan reads unless justified

Relevant files likely include:

- `README.md`
- `docs/IMPLEMENTATION_PLAN.md`
- any docs that describe agent workflow
- any docs that describe validation or handoff process
- any docs that discuss repo navigation or context management

### F. Add explicit guidance inside `docs/IMPLEMENTATION_PLAN.md`

Update the implementation plan itself so that it does not encourage broad default reads.

At minimum, add a clear note near the top that points readers to `docs/_IMPLEMENTATION_PLAN_INDEX.md` and explains that the full document should only be read when architecture-wide context is actually needed.

### G. Keep the repo truthful about current behavior

Do not document automation that does not yet exist as though it already exists.

If the repo does not yet enforce index-first routing programmatically, the docs should still present it as a repo convention and expected practice.

If future policy-file enforcement is mentioned, it must be described as planned or future work unless it is implemented in this same pass.

---

## Interaction With Existing Architectural Decisions

This design should align with earlier repo decisions, including:

- `next` remains a skill
- `seed` is a planned extension command
- cleanup and reconciliation should be policy-driven in the future
- repo-specific behavior should eventually be controlled through repo-local YAML policy files

This implementation does not need to fully implement policy files or orchestrator enforcement. However, the documentation should remain compatible with that future direction.

Where appropriate, the conventions and ADR may note that future policy files can reinforce these rules, but they must not claim current enforcement unless that enforcement is actually implemented.

---

## Guidance on Design Docs vs ADRs

This implementation should make the following distinction explicit in the repo:

### Design docs

Design docs are temporary working documents used to propose or drive changes. They live in `design/` and may later be archived when their work is complete.

### ADRs

ADRs are durable decision records. They capture important accepted decisions, why those decisions were made, and what consequences follow from them. They should remain in the repo as long-term project memory.

This distinction should be reflected in `docs/REPO_CONVENTIONS.md`.

---

## Recommended Content Shape for the New Index Files

### `_DOCS_INDEX` files should answer:

- What is the purpose of this directory?
- Which files are most commonly relevant?
- Which files are authoritative for which subjects?
- What should an agent read first for common tasks?
- Which files are background-only and can often be skipped?

### `_IMPLEMENTATION_PLAN_INDEX` should answer:

- Which stage or section is relevant to the current task?
- Does this task require architecture-wide context or only one stage?
- What related docs exist outside the plan?
- Is the full plan unnecessary here?

---

## Scope Boundaries

### In scope

- adding index files
- creating durable conventions and ADR docs
- updating documentation to prefer indexes and narrow reads
- improving routing around the implementation plan
- aligning repo docs with this navigation model

### Out of scope for this pass unless already straightforward

- full refactor of `docs/IMPLEMENTATION_PLAN.md` into multiple stage files
- automatic enforcement through the orchestrator
- implementation of repo-local context-routing policy files
- seed-level propagation of these conventions into future repos

These may be mentioned as future directions, but only if clearly labeled as such.

---

## Preferred Naming Conventions

For this implementation, follow these naming rules:

### Index files

- must start with `_`
- must include the indexed subject before `INDEX`
- must use all capital letters
- must avoid generic repeated names like `INDEX.md`

Examples:

- `_DOCS_INDEX.md`
- `_VALIDATION_INDEX.md`
- `_HANDOFF_INDEX.md`
- `_IMPLEMENTATION_PLAN_INDEX.md`

### Design documents

Design documents do **not** need to start with `_`.

They should continue to follow the repo's existing preference for all-capital naming for this class of document.

### Other durable docs

Use the repo's existing naming style consistently. Do not introduce unnecessary mixed conventions if the repo already favors upper-case document names for major planning/design artifacts.

---

## Acceptance Criteria

This design is successfully implemented when all of the following are true:

1. The repo contains a durable conventions document, recommended as `docs/REPO_CONVENTIONS.md`.
2. The repo contains an ADR that records the decision to use index-first context routing.
3. The repo contains `docs/_IMPLEMENTATION_PLAN_INDEX.md`.
4. Dense directories in `docs/` that benefit from routing contain clearly named underscore-prefixed index files.
5. Documentation consistently tells agents to consult indexes first rather than reading large docs broadly.
6. `docs/IMPLEMENTATION_PLAN.md` points readers to its companion index.
7. The repo contains no misleading guidance that routine tasks should require a full read of the implementation plan.
8. The documentation is truthful about what is implemented now versus what is only planned.
9. The naming convention for index files is applied consistently and does not introduce duplicate generic `INDEX.md` filenames.

---

## Suggested Implementation Sequence

1. Audit the `docs/` tree and identify directories that need indexes.
2. Create `docs/REPO_CONVENTIONS.md`.
3. Create the ADR for index-first context routing.
4. Create `docs/_IMPLEMENTATION_PLAN_INDEX.md`.
5. Add local directory indexes where useful.
6. Update `README.md`, `docs/IMPLEMENTATION_PLAN.md`, and other relevant docs to point to indexes first.
7. Sweep the repo for contradictory or outdated navigation guidance.
8. Summarize what changed, what remains future work, and any remaining ambiguity.

---

## Instructions for the Implementing Agent

Use this document as the source of truth for the implementation pass.

You should:

- make the changes directly in the repo
- keep the repo truthful
- avoid inventing automation that does not yet exist
- preserve existing architectural decisions unless they directly conflict with this design
- update related docs so the new model is coherent across the repo
- report changed files and any unresolved ambiguity

When this work is complete, the repo should clearly guide future agents toward narrow, index-first document access rather than broad default reading.
