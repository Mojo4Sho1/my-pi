# Layered Context Initialization — Staged Implementation Plan

## Context

The source design doc at `docs/archive/design/onboarding_layed_context.md` defines a layered context initialization model for fresh agents in my-pi. The goal: agents load the right context layers, in the right order, for their role and current step — instead of ad hoc broad reading.

The repo already has strong foundations (index-first routing, YAML specs, contract-driven routing, ADR system). This plan fills the gaps: durable onboarding documentation, structural separation of policies/onboarding under `specs/`, updated conventions, and onboarding-aware spec fields.

**Key decision:** Config root stays under `specs/` (new `specs/policies/` and `specs/onboarding/` subdirs) rather than a new `.pi/` directory. If the policy/onboarding surface grows large enough to justify its own root, that's a future split — documented as such.

**Access model:** The orchestrator reads policies and onboarding manifests; specialists receive only their own context via the packet. Directory structure serves organization and orchestrator discoverability, not enforcement — the routing layer handles access control.

---

## Stage 0: Queue Setup (execute in this session before handing off)

**Goal:** Add the onboarding side quest to the task queue and defer the main track.

### Tasks

1. **Update `docs/handoff/TASK_QUEUE.md`**:
   - Defer T-10 (mark as `deferred` with reason: "Deferred while onboarding side quest T-22–T-26 runs")
   - Add a new phase section: "Phase: Layered Context Initialization (Side Quest)"
   - Add tasks T-22 through T-26 as defined in the Handoff Integration section above
   - Mark T-22 as `queued`

2. **Update `docs/handoff/NEXT_TASK.md`** — Point to T-22 with:
   - Summary: implement durable onboarding documentation (Stage 1 of layered context initialization)
   - Rationale: this side quest establishes the onboarding architecture that all future stages benefit from
   - Scope: create `docs/LAYERED_ONBOARDING.md`, ADR 0002, decision log entry
   - Spec reference: `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` and `docs/archive/design/onboarding_layed_context.md`
   - Acceptance criteria from Stage 1 verification below

3. **Update `docs/handoff/CURRENT_STATUS.md`** — Record:
   - Active focus is now the onboarding side quest (T-22–T-26)
   - T-10 is deferred and will resume after T-26 completes
   - Link to `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` as the implementation guide

---

## Stage 1: Durable Onboarding Documentation

**Goal:** Add the core documentation that defines the layered onboarding model so all future agents understand it.

**Prerequisites:** Read `AGENTS.md`, `INDEX.md`, `docs/REPO_CONVENTIONS.md`, `docs/archive/design/onboarding_layed_context.md`

### Tasks

1. **Create `docs/LAYERED_ONBOARDING.md`** — The durable reference doc explaining the full model:
   - The 5 context layers (L0–L4) with purpose, examples, and "this layer answers" for each
   - Onboarding profiles: orchestrator (broader), specialist (narrow default), team-state (adds team context)
   - The stable-reference vs working-artifact distinction
   - The factory-vs-run distinction
   - How onboarding relates to contract-driven routing (onboarding provides inputs; contracts define what's required)
   - How onboarding relates to index-first routing (L1 mechanism)
   - Access model: orchestrator reads policies/manifests; specialists receive context via packet
   - Future escalation path: if policy/onboarding surface grows, may split to dedicated root (currently under `specs/`)
   - **Truthfulness:** clearly label what is implemented now (conventions, structure, docs) vs what is planned (automated bundle assembly, runtime manifest loading)

2. **Create ADR `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md`**:
   - Decision: adopt layered context initialization as a first-class architectural rule
   - Context: agents over-read, stable vs working artifacts not distinguished, onboarding is implicit
   - Alternatives considered: flat "read everything" model, strict automated bundles (too early), ad hoc prompting
   - Consequences: more structural docs to maintain, but deterministic onboarding and lower token spend

3. **Add entry to `DECISION_LOG.md`** for Decision #39 (or next available number):
   - "Layered context initialization adopted as first-class architectural rule"
   - Reference the ADR

### Files changed
- `docs/LAYERED_ONBOARDING.md` (new)
- `docs/adr/0002_LAYERED_CONTEXT_INITIALIZATION.md` (new)
- `DECISION_LOG.md` (append entry)

### Verification
- All three files exist and cross-reference each other
- LAYERED_ONBOARDING.md covers all 5 layers with concrete examples from this repo
- ADR follows the format of `docs/adr/0001_INDEX_FIRST_CONTEXT_ROUTING.md`
- Truthfulness rule respected: no claims of automated onboarding

---

## Stage 2: Update Conventions and Routing Docs

**Goal:** Update existing conventions and index files so the onboarding model is discoverable through the normal bootstrap path.

**Prerequisites:** Read `docs/REPO_CONVENTIONS.md`, `INDEX.md`, `docs/_DOCS_INDEX.md`, `AGENTS.md`, `specs/_SPECS_INDEX.md`, and the new `docs/LAYERED_ONBOARDING.md` from Stage 1.

### Tasks

1. **Update `docs/REPO_CONVENTIONS.md`** — Add a new section (after the existing navigation rules) covering:
   - Stable reference material vs working artifacts: what each is, where each lives
   - Specialists default to narrow onboarding (receive only their spec + packet)
   - Orchestrator has broader but bounded onboarding (reads indexes, policies, routing docs)
   - Machine-first artifacts (YAML/JSON) are canonical for runtime routing; Markdown for human reference
   - Factory-vs-run: repo config set once, runs produce artifacts under that config
   - Point to `docs/LAYERED_ONBOARDING.md` for the full model

2. **Update `INDEX.md`** — Add `docs/LAYERED_ONBOARDING.md` to the route table with a brief description

3. **Update `docs/_DOCS_INDEX.md`** — Add routing entry for `LAYERED_ONBOARDING.md` and the new ADR

4. **Update `AGENTS.md`** Key Documents table — Add `docs/LAYERED_ONBOARDING.md` row

### Files changed
- `docs/REPO_CONVENTIONS.md` (edit — new section)
- `INDEX.md` (edit — new route)
- `docs/_DOCS_INDEX.md` (edit — new entries)
- `AGENTS.md` (edit — new table row)

### Verification
- Bootstrap path AGENTS.md → INDEX.md → _DOCS_INDEX.md can route to the onboarding doc
- REPO_CONVENTIONS.md new section is concise and references the full doc
- No existing content broken or duplicated

---

## Stage 3: Structural Scaffolding — Policies and Onboarding Under `specs/`

**Goal:** Create the directory structure for policies and onboarding manifests under `specs/`, with index files and initial content.

**Prerequisites:** Read `specs/_SPECS_INDEX.md`, `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`, `docs/LAYERED_ONBOARDING.md` (from Stage 1), `docs/REPO_CONVENTIONS.md` (as updated in Stage 2).

### Tasks

1. **Create `specs/policies/` directory** with:
   - `specs/policies/_POLICIES_INDEX.md` — routing file explaining what policies are, listing current policies, noting this is the factory-configuration layer
   - `specs/policies/onboarding-policy.yaml` — defines the default onboarding rules:
     - Specialists: narrow by default (L0 minimal, L1 minimal, L2 own spec, L3 selective, L4 current packet)
     - Orchestrator: broader but bounded (L0 full, L1 full, L2 orchestrator contract, L3 selective via indexes, L4 current task)
     - Team-state: specialist profile plus team state, objective, and upstream artifacts
     - Index-first routing is the L1 mechanism
     - Machine-first artifacts are canonical for routing

2. **Create `specs/onboarding/` directory** with:
   - `specs/onboarding/_ONBOARDING_INDEX.md` — routing file explaining what onboarding manifests are and how they relate to policies
   - `specs/onboarding/orchestrator.yaml` — orchestrator onboarding manifest listing:
     - L0 sources (package identity, global rules)
     - L1 sources (INDEX.md, REPO_CONVENTIONS.md, local indexes)
     - L2 sources (orchestrator contract/role definition)
     - L3 sources (selectively: architecture docs, policies, specs — via indexes)
     - L4 sources (current TaskPacket, team session, user objective)
   - `specs/onboarding/specialist-default.yaml` — default specialist onboarding manifest:
     - L0 sources (minimal runtime identity)
     - L1 sources (minimal — only conventions relevant to role)
     - L2 sources (own specialist spec + artifact template)
     - L3 sources (only references relevant to current task type)
     - L4 sources (current packet + upstream validated artifacts)

3. **Update `specs/_SPECS_INDEX.md`** — Add entries for `specs/policies/` and `specs/onboarding/` with routing descriptions

4. **Create `artifacts/` directory scaffolding**:
   - `artifacts/_ARTIFACTS_INDEX.md` — routing file explaining this is the runtime/session artifact root, distinct from stable specs
   - `artifacts/team-sessions/` (empty dir with `.gitkeep`)
   - `artifacts/validation/` (empty dir with `.gitkeep`)
   - Note: existing `docs/validation/` content stays where it is for now; `artifacts/validation/` is for future per-run validation outputs

5. **Update `INDEX.md`** — Add `artifacts/` to the directories table
6. **Update `AGENTS.md`** — Add `artifacts/` to directory descriptions; note the stable-config vs runtime-artifact distinction

### Files changed
- `specs/policies/_POLICIES_INDEX.md` (new)
- `specs/policies/onboarding-policy.yaml` (new)
- `specs/onboarding/_ONBOARDING_INDEX.md` (new)
- `specs/onboarding/orchestrator.yaml` (new)
- `specs/onboarding/specialist-default.yaml` (new)
- `specs/_SPECS_INDEX.md` (edit)
- `artifacts/_ARTIFACTS_INDEX.md` (new)
- `artifacts/team-sessions/.gitkeep` (new)
- `artifacts/validation/.gitkeep` (new)
- `INDEX.md` (edit)
- `AGENTS.md` (edit)

### Verification
- `specs/_SPECS_INDEX.md` routes to both new subdirectories
- Policy and onboarding YAML files are well-formed and reference concrete repo paths
- `artifacts/` index explains its purpose and distinction from `specs/` and `docs/`
- INDEX.md and AGENTS.md reflect the new directories

---

## Stage 4: Onboarding-Aware Spec Fields

**Goal:** Extend the specialist and team YAML spec schemas to include onboarding metadata, so specs can declare what context they need.

**Prerequisites:** Read `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`, `specs/specialists/SPECIALIST_TEMPLATE.yaml`, `specs/teams/TEAM_TEMPLATE.yaml`, `specs/teams/build-team.yaml`, `specs/onboarding/specialist-default.yaml` (from Stage 3), `docs/LAYERED_ONBOARDING.md` (from Stage 1).

### Tasks

1. **Update `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`** — Add a new section "Onboarding Metadata (V1.1)" defining optional fields for both specialist and team specs:
   - **Specialist onboarding fields:**
     - `onboarding.profile`: reference to onboarding manifest (default: `specialist-default`)
     - `onboarding.layer3_refs`: list of stable reference doc paths/sections relevant to this specialist's typical work
     - `onboarding.layer1_conventions`: list of specific conventions relevant to this role (if narrower than default)
     - `onboarding.notes`: free-text onboarding notes for the orchestrator
   - **Team onboarding fields:**
     - `onboarding.profile`: reference to onboarding manifest
     - `onboarding.team_state_context`: list of team-state artifacts the orchestrator should provide
     - `onboarding.upstream_artifacts`: list of upstream artifact types consumed at team entry
   - Mark all new fields as optional — existing specs without them use defaults
   - Note: these fields are declarative metadata for orchestrator context construction; they do not trigger automated loading yet

2. **Update `specs/specialists/SPECIALIST_TEMPLATE.yaml`** — Add the new onboarding section with illustrative examples and comments

3. **Update `specs/teams/TEAM_TEMPLATE.yaml`** — Add the new onboarding section with illustrative examples

4. **Update `specs/teams/build-team.yaml`** — Add onboarding metadata appropriate for the build team (e.g., layer3_refs pointing to coding standards, architecture docs)

### Files changed
- `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` (edit — new section)
- `specs/specialists/SPECIALIST_TEMPLATE.yaml` (edit — new section)
- `specs/teams/TEAM_TEMPLATE.yaml` (edit — new section)
- `specs/teams/build-team.yaml` (edit — new section)

### Verification
- Schema doc clearly defines the new fields with types and descriptions
- Templates show the new fields with helpful comments
- build-team.yaml has realistic onboarding metadata
- All new fields are marked optional; existing specs remain valid without them
- No claims of automated loading — fields are declarative metadata

---

## Stage 5: Validation and Cleanup

**Goal:** Validate the implementation against the design doc's scenarios, archive the design doc, and ensure everything is consistent.

**Prerequisites:** Read `docs/archive/design/onboarding_layed_context.md` (the source design doc — especially the Validation Scenarios and Acceptance Criteria sections), then read all files created/modified in Stages 1–4.

### Tasks

1. **Validate against the 6 scenarios** from the design doc (section "Validation Scenarios"):
   - Scenario 1 (Specialist narrow onboarding): verify specialist-default.yaml defines narrow L1–L3; template shows narrow defaults
   - Scenario 2 (Orchestrator layered onboarding): verify orchestrator.yaml shows index-first L1, broader L3, context packaging responsibility
   - Scenario 3 (Stable ref vs working artifact): verify repo structure separates `specs/` + `docs/` from `artifacts/`; REPO_CONVENTIONS.md explains the distinction
   - Scenario 4 (Build-team state onboarding): verify build-team.yaml has onboarding metadata; team template shows team-state context fields
   - Scenario 5 (Human edit + revalidation): verify LAYERED_ONBOARDING.md documents that edited artifacts must be re-validated
   - Scenario 6 (Seed compatibility): verify structure can be scaffolded by a future seed; LAYERED_ONBOARDING.md documents this

2. **Validate against the 9 acceptance criteria** from the design doc and document results

3. **Check cross-references:** ensure all new docs reference each other correctly, all index files are updated, no broken links

4. **Archive the design doc:** Archive the source design doc under `docs/archive/design/onboarding_layed_context.md` per repo convention (design docs are temporary; the durable docs now live at `docs/LAYERED_ONBOARDING.md` and the ADR)

5. **Update `STATUS.md`** to reflect the completed onboarding work

6. **Add a DECISION_LOG.md entry** noting the `specs/` extension decision (policies and onboarding under specs rather than a new root), with the future escalation trigger documented

7. **Add future work items to `docs/FUTURE_WORK.md`** — Add entries for each deferred capability from this design, following the existing format (description + "Revisit when" trigger):
   - **Automated Onboarding Bundle Assembly** — Runtime code that reads onboarding manifests and automatically constructs context bundles for specialists. Requires changes to `extensions/shared/specialist-prompt.ts` and orchestrator logic. *Revisit when:* the declarative onboarding manifests (`specs/onboarding/`) have been stable for multiple stages and manual context construction in the orchestrator is a proven bottleneck.
   - **Dedicated Config Root Migration** — If `specs/policies/` and `specs/onboarding/` grow beyond ~10 files or the semantic distinction between "type specs" and "operational config" becomes a friction point, split to a dedicated root (e.g., `config/` or `.pi/`). The orchestrator would read the config root for policies; specialists would continue receiving context via packets only. *Revisit when:* `specs/` subdirectory count or conceptual overload makes the current structure confusing for fresh agents.
   - **Per-Specialist Onboarding Manifests** — Individual manifests like `specs/onboarding/builder.yaml` that override the default specialist profile. Currently the default manifest + spec-level `onboarding.*` fields are sufficient. *Revisit when:* multiple specialists need significantly different onboarding profiles that can't be expressed through the spec-level fields alone.
   - **Onboarding Seed Scaffolding** — A seed template that generates the full directory structure including `specs/policies/`, `specs/onboarding/`, `artifacts/`, indexes, and conventions. *Revisit when:* seeds are implemented and there's demand for bootstrapping new projects with the layered onboarding structure.
   - **Runtime Manifest Loading** — Code that reads `onboarding.profile` from a specialist spec and uses the referenced manifest to dynamically construct the system prompt context at invocation time. *Revisit when:* automated bundle assembly is in scope and the manifest format has stabilized through manual use.

### Files changed
- `docs/archive/design/onboarding_layed_context.md` (archived source design doc)
- `STATUS.md` (edit)
- `DECISION_LOG.md` (edit — new entry for specs/ extension decision)
- `docs/FUTURE_WORK.md` (edit — 5 new entries)

### Verification
- All 6 scenarios pass
- All 9 acceptance criteria met
- No broken cross-references
- Design doc archived, not deleted
- STATUS.md reflects current state truthfully
- All 5 future work items present in `docs/FUTURE_WORK.md` with "Revisit when" triggers
- Future work entries reference `docs/archive/design/onboarding_layed_context.md` as source

---

## Stage Summary

| Stage | Focus | New Files | Edited Files |
|-------|-------|-----------|-------------|
| 0 | Queue setup (handoff docs) | 0 | 3 |
| 1 | Core onboarding documentation | 2 | 1 |
| 2 | Conventions and routing updates | 0 | 4 |
| 3 | Directory scaffolding (policies, onboarding, artifacts) | 8 | 3 |
| 4 | Onboarding-aware spec fields | 0 | 4 |
| 5 | Validation, archival, cleanup, future work | 0 | 4 (+ 1 move) |

Each stage is self-contained. An agent starting with empty context should:
1. Read the handoff docs: `docs/handoff/NEXT_TASK.md` (active target), then `docs/handoff/CURRENT_STATUS.md` (recent context)
2. Read this plan for their assigned stage
3. Read the prerequisites listed for that stage
4. Execute the tasks
5. Run the verification checks
6. Commit the changes
7. Update handoff docs (see Handoff Integration below)

---

## Handoff Integration

This work is queued as a **side quest** in the project's task queue (`docs/handoff/TASK_QUEUE.md`), with task IDs T-22 through T-26 (one per stage). The main implementation track (T-10: live build-team validation) is deferred while this runs.

### Task Queue Entries

The following tasks should be added to `TASK_QUEUE.md` under a new phase header:

| ID | Status | Task | Specs to Read | Acceptance Criteria |
|----|--------|------|---------------|---------------------|
| T-22 | queued | Onboarding Stage 1: Durable onboarding documentation | `docs/archive/design/onboarding_layed_context.md`, `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 1) | `docs/LAYERED_ONBOARDING.md` exists with all 5 layers; ADR 0002 exists; decision log entry added |
| T-23 | queued | Onboarding Stage 2: Update conventions and routing docs | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 2), `docs/REPO_CONVENTIONS.md` | REPO_CONVENTIONS has onboarding section; INDEX.md, _DOCS_INDEX.md, AGENTS.md updated with new routes |
| T-24 | queued | Onboarding Stage 3: Structural scaffolding (policies, onboarding, artifacts) | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 3), `specs/_SPECS_INDEX.md` | `specs/policies/`, `specs/onboarding/`, `artifacts/` exist with indexes and initial YAML content |
| T-25 | queued | Onboarding Stage 4: Onboarding-aware spec fields | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 4), `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` | Schema doc has V1.1 onboarding fields; templates and build-team.yaml updated |
| T-26 | queued | Onboarding Stage 5: Validation, archival, cleanup | `docs/design/ONBOARDING_IMPLEMENTATION_PLAN.md` (Stage 5), `docs/archive/design/onboarding_layed_context.md` | All 6 scenarios validated; design doc archived; future work items in FUTURE_WORK.md |

### Per-Stage Handoff Protocol

**Before starting a stage**, the agent must:
- Read `docs/handoff/NEXT_TASK.md` to confirm they're working on the right task
- Read `docs/handoff/CURRENT_STATUS.md` for recent context

**After completing a stage**, the agent must:
1. Update `docs/handoff/CURRENT_STATUS.md` — record what was completed, any gaps or notes for the next agent
2. Update `docs/handoff/TASK_QUEUE.md` — mark the completed task `done`, confirm the next task is `queued`
3. Update `docs/handoff/NEXT_TASK.md` — point to the next stage's task (T-23 after T-22, etc.)
4. If this was the **final stage (T-26)**: restore T-10 as the active task in `NEXT_TASK.md` and update `CURRENT_STATUS.md` to note the side quest is complete and the main track resumes

### Restoring the Main Track

After T-26 completes, the next agent should find:
- `NEXT_TASK.md` pointing back to **T-10** (live build-team validation)
- `CURRENT_STATUS.md` noting: "Onboarding side quest (T-22 through T-26) complete. Main track resumes with T-10."
- `TASK_QUEUE.md` showing T-22 through T-26 as `done` and T-10 as `active`

---

## Future Work (Not In Scope)

- **Automated onboarding bundle assembly**: Runtime code that reads manifests and constructs context bundles. Requires changes to `extensions/shared/specialist-prompt.ts` and orchestrator logic.
- **Dedicated config root**: If `specs/policies/` and `specs/onboarding/` grow beyond ~10 files or the semantic distinction between "type specs" and "operational config" becomes a friction point, split to a dedicated root (e.g., `config/` or `.pi/`). The orchestrator would then read the config root for policies; specialists would continue receiving context via packets only.
- **Per-specialist onboarding manifests**: Individual manifests like `specs/onboarding/builder.yaml` that override the default. Currently the default + spec-level `onboarding.*` fields are sufficient.
- **Seed scaffolding**: A seed template that generates the full directory structure including `specs/policies/`, `specs/onboarding/`, `artifacts/`, indexes, and conventions.
- **Runtime manifest loading**: Code that reads `onboarding.profile` from a specialist spec and uses the referenced manifest to construct the system prompt context.
