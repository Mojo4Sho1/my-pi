# Specialist Taxonomy Decision Log

## Status

Tracking log for decisions related to the specialist taxonomy and context
model defined in `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`.

This log distinguishes settled decisions from open or deferred ones.
Implementation work must not silently resolve any entry marked
`Open`, `Proposed`, or `Deferred`. New decisions belong here, not in
implementation patches.

## Status Labels

- `Canonical` — settled in `SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`
  and reflected in documentation. Implementation may still be pending.
- `Canonical decision; implementation pending` — the decision is
  settled, but the runtime/code/test work to realize it has not yet
  begun.
- `Canonical direction; implementation deferred` — the policy is
  settled, but execution intentionally waits on a prerequisite
  checkpoint (most often the YAML schema work).
- `Agreed, needs detail` — direction agreed; concrete shape still to be
  worked out. Use sparingly; prefer `Canonical direction` once the
  policy is firm.
- `Proposed` — recommended by the taxonomy doc but not yet ratified for
  this repository.
- `Open` — actively undecided; must be resolved before the relevant
  migration stage proceeds.
- `Deferred` — intentionally postponed; activation conditions must be
  recorded so a future agent can recognize when to revisit.
- `Superseded` — replaced by a later decision; kept for traceability.

---

## Settled (Canonical) Decisions

### D-T1: Four base specialist classes
- Status: `Canonical`
- Decision: The taxonomy uses exactly four base classes — `Planner`,
  `Scribe`, `Builder`, `Reviewer`.
- Rationale: Each base class has a distinct default context, posture,
  and artifact responsibility. No additional base class has been
  justified.
- Reference: `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md` §
  Base Specialist Classes.

### D-T2: Scribe replaces the earlier Designer naming
- Status: `Canonical`
- Decision: The base class for non-runtime blueprint artifacts is
  `Scribe`. Earlier discussions referenced this role as `Designer`.
- Rationale: `Scribe` more accurately reflects the artifact-creation
  posture and avoids implying broad architectural authority.
- Reference: taxonomy doc § Scribe.

### D-T3: Scribe owns non-runtime blueprint artifacts
- Status: `Canonical`
- Decision: Scribe artifacts include specifications, contracts, schemas,
  routing designs, role definitions, interface descriptions,
  invariants, documentation, context templates, team templates, and
  specialist templates.
- Rationale: A single base class for design and documentation artifacts
  preserves a clean Scribe/Builder boundary.
- Reference: taxonomy doc § Scribe.

### D-T4: Builder owns executable, operational, and implementation artifacts
- Status: `Canonical`
- Decision: Builder artifacts include code, scripts, tests,
  configuration, migrations, generated assets, runtime behavior, and
  validation harnesses.
- Rationale: Tests are executable validation artifacts and therefore
  belong under Builder, not Scribe.
- Reference: taxonomy doc § Builder.

### D-T5: Tests belong under Builder
- Status: `Canonical`
- Decision: A test-authoring specialist is a Builder variant
  (`builder-test`).
- Rationale: Tests execute and produce evidence, which is the Builder
  artifact category. Treating tests as Scribe artifacts would erode
  the Scribe/Builder boundary.
- Reference: taxonomy doc § Boundary Between Scribe and Builder.

### D-T6: Tester retired as an independent specialist
- Status: `Canonical`
- Decision: The historical `tester` role is retired as an independent
  base-style specialist. Its useful test-authoring responsibility
  becomes `builder-test`. Runtime mechanics are settled in D-O4
  (alias-first migration) and D-D1 (alias lifecycle).
- Rationale: Running tests is an action available to any suitable
  actor and does not by itself justify a specialist.
- Reference: taxonomy doc § Current Specialist Reclassification.

### D-T7: Specialist variants start with their base class name
- Status: `Canonical`
- Decision: Variants use the kebab-case pattern
  `<base-class>-<variant>`, e.g. `scribe-spec`, `builder-test`,
  `reviewer-critic`.
- Rationale: The taxonomy is visible from the variant identifier
  without requiring readers to inspect the specialist file.
- Reference: taxonomy doc § Specialist Variant Naming Convention.

### D-T8: Default everyday team is planner -> builder -> reviewer
- Status: `Canonical`
- Decision: The default everyday implementation team is
  `planner -> builder -> reviewer`.
- Rationale: Smallest robust team for routine implementation tasks.
- Reference: taxonomy doc § Default Everyday Base Team.

### D-T9: Full design-to-build team is planner -> scribe -> builder -> reviewer
- Status: `Canonical`
- Decision: When non-runtime blueprint artifacts are required before
  implementation, the team expands to include Scribe.
- Rationale: Scribe is first-class but conditional. Design work should
  be made explicit, not implicit in the Builder.
- Reference: taxonomy doc § Full Design-to-Build Team.

### D-T10: Context presentation order and authority order are intentionally different
- Status: `Canonical`
- Decision: Presentation order leads with base specialist context and
  variant context, then global rules, the assembled specialist
  contract, the orchestrator task packet, task-specific context, the
  upstream artifacts and evidence, and the output template. Authority
  order leads with global repository rules and orchestrator packet
  constraints, then base/variant context, then task-specific context,
  then upstream artifacts.
- Rationale: Presentation order shapes role identity. Authority order
  protects correctness, safety, and scope discipline. The two roles
  are not interchangeable. See D-O7 for the staged encoding model
  that makes both orders explicit.
- Reference: taxonomy doc § Context Presentation Order and § Context
  Authority Order.

### D-T11: Future specialist/team builders consume structured YAML input artifacts
- Status: `Canonical`
- Decision: Specialist-creating and team-creating agents will receive
  YAML input artifacts describing the intended specialist or team
  before construction.
- Rationale: Improves consistency, reviewability, and validation of
  meta-team output.
- Detail: The full scope of the YAML checkpoint (templates, contract
  layers, effective-contract assembly, validation expectations) is
  recorded under D-A1.
- Reference: taxonomy doc § Future YAML Input Artifacts.

### D-O5: Generic builder identifier — keep `builder`
- Status: `Canonical`
- Decision: `builder` remains the generic base implementation
  specialist. The runtime is not required to rename `builder` to
  `builder-code`.
- Rationale: The default everyday team should remain
  `planner -> builder -> reviewer`. The generic Builder role is
  intentionally broad enough to cover bounded implementation-facing
  work. More specific Builder variants should be introduced only
  when the extra context is warranted.
- Policy:
  - Do not require a runtime rename from `builder` to `builder-code`.
  - Keep `builder` as the generic base implementation specialist.
  - `builder-code` may be introduced later as an optional Builder
    variant if the runtime needs to distinguish code implementation
    from other implementation-facing Builder work.
  - Do not replace the default team with
    `planner -> builder-code -> reviewer`.
- Note: The exact test-authoring expansion flow is not fully settled
  by this decision. Sequencing of the test-authoring expansion is
  tracked under the team / state-machine decisions (D-O6).
- Supersedes: previous Open status that asked whether the generic
  Builder should be renamed to `builder-code`.

### D-O2: Specialist metadata source format — staged hybrid with mandatory YAML checkpoint
- Status: `Canonical decision; implementation pending`
- Decision: Use a staged hybrid metadata model with a mandatory YAML
  checkpoint before runtime/type metadata migration begins.
- Rationale: Markdown taxonomy sections are sufficient for the current
  documentation-only phase. The project should move toward structured
  YAML metadata so future specialist and team builders can consume
  explicit input artifacts and so taxonomy compliance can be validated
  automatically.
- Staged model:
  1. Markdown taxonomy sections provide the immediate human-readable
     source of truth.
  2. Before runtime/type metadata migration begins, define YAML
     schemas and templates (see D-A1).
  3. After the schema is defined, add YAML front matter or structured
     YAML metadata to specialist and team definitions.
  4. During runtime migration, TypeScript metadata should mirror or
     consume the YAML/documentation metadata rather than independently
     redefining it.
  5. Add validation tests to detect drift between documentation
     metadata and runtime metadata.
- Required checkpoint: Runtime TypeScript taxonomy metadata should
  not be added until the YAML schema/template decision (D-A1) is
  settled, unless this decision is explicitly superseded.
- Policy:
  - Do not require YAML front matter in the immediate
    documentation-only pass.
  - Do not let "YAML later" remain untracked.
  - Track YAML schema design as a required migration-plan milestone
    (Stage 3.5).
- Supersedes: previous Open status.

### D-O3: Runtime representation of base_class and variant — grouped taxonomy object
- Status: `Canonical decision; implementation pending`
- Decision: Runtime specialist metadata should eventually use a grouped
  `taxonomy` object that bundles base class, variant, and artifact
  responsibility into one conceptual unit.
- Rationale: The grouped object keeps base class, variant, and artifact
  responsibility together as one conceptual unit. This aligns with the
  future YAML metadata direction (D-O2, D-A1) and makes validation
  easier. The first runtime migration should prefer a simple grouped
  object plus validation tests over a complex type-level hierarchy.
- Target shape:
  ```ts
  taxonomy: {
    baseClass: "Planner" | "Scribe" | "Builder" | "Reviewer",
    variant: string | null,
    artifactResponsibility: string[]
  }
  ```
- Rules:
  - Generic base specialists use `variant: null`.
  - Specialized variants use base-class-prefixed kebab-case names.
  - Runtime validation should ensure each variant prefix matches its
    base class.
  - Runtime metadata should mirror or consume the future
    YAML/documentation metadata rather than independently redefining
    it.
- Deferred detail: A stricter discriminated union may be added later
  if the runtime benefits from compile-time enforcement. Tracked here
  rather than promoted to a separate Open decision.
- Supersedes: previous Open status that asked whether base class and
  variant should be flat fields, a discriminated union, or a grouped
  object.

### D-O4: tester -> builder-test runtime mechanics — staged alias-first migration
- Status: `Canonical decision; implementation pending`
- Decision: Migrate `tester` to `builder-test` through a staged
  alias-first migration. `builder-test` is the canonical taxonomy
  name; `tester` becomes a deprecated alias during the transition.
- Rationale: `builder-test` is canonical because test creation is a
  Builder variant responsibility (D-T5). Existing runtime references
  may still use `tester`, so an immediate rename is unnecessarily
  risky. The migration should preserve behavior while making the
  canonical target explicit.
- Migration path:
  1. Reclassify `tester` as transitional metadata:
     - `canonicalName: builder-test`
     - `currentRuntimeId: tester`
     - `baseClass: Builder`
     - `variant: builder-test`
     - `deprecatedAliases: [tester]`
     - `migrationStatus: transitional`
  2. Add `builder-test` as the canonical runtime identifier. `tester`
     should resolve as a deprecated alias during the transition.
  3. Update team definitions, docs, and tests to prefer `builder-test`.
  4. Remove or retain the deprecated alias only after an explicit
     compatibility decision (see D-D1 lifecycle states).
- Final-state rule: `builder-test` is canonical. `tester` is not
  canonical.
- Cleanup condition: Do not remove the `tester` alias until all current
  references have been migrated and tests confirm canonical names work.
- Supersedes: previous Open status.

### D-D1: Compatibility alias policy — temporary aliases with stage-gated lifecycle
- Status: `Canonical decision; implementation pending`
- Decision: Use temporary compatibility aliases with an explicit
  stage-gated deprecation lifecycle. Aliases exist to make staged
  migration safe, not to create permanent compatibility.
- Rationale: Aliases are useful for staged migrations, especially when
  runtime definitions, team definitions, tests, and documentation
  cannot all be safely changed in one pass. However, aliases should
  not become permanent alternate names because that weakens the
  taxonomy and creates ambiguity.
- Policy:
  - Every renamed specialist or team identifier must have one
    canonical name.
  - Legacy names may exist only as temporary compatibility aliases.
  - New documentation and new team definitions should use canonical
    names.
  - Deprecated aliases must include a canonical target, reason,
    lifecycle state, and cleanup condition.
  - Validation should eventually warn or fail when deprecated aliases
    appear in new definitions.
  - Alias removal requires an explicit decision-log update or
    migration-plan checkpoint.
- Lifecycle (stage-gated):
  ```text
  active -> deprecated -> blocked-for-new-use -> removal-candidate -> removed
  ```
  - `active`: canonical name; new references should use this.
  - `deprecated`: old name still resolves; new references should not
    use it.
  - `blocked-for-new-use`: old name still resolves only for legacy
    compatibility; validation should fail if new docs, teams, or
    runtime definitions introduce it.
  - `removal-candidate`: all known references have been migrated;
    alias remains only until tests/validation confirm removal is
    safe.
  - `removed`: alias no longer resolves.
- Stage-gated rule: Every migration stage that leaves a deprecated
  alias in place must state the next condition required to advance
  that alias to the next lifecycle state (see migration plan Stage 7).
- Initial application: `tester` should become a deprecated alias for
  `builder-test` during runtime migration (see D-O4).
- Supersedes: previous Deferred status.

### D-O6: Conditional expansion encoding — evolve toward state-machine team model
- Status: `Canonical decision; implementation pending`
- Decision: Team definitions should evolve toward a state-machine
  model. Simple linear flows remain valid as human-readable shorthand
  and may compile into simple state machines.
- Rationale: The default everyday team is simple, but future teams may
  require conditional transitions, bounded retries, fan-out/fan-in,
  scout-style repo ingestion, synthesis nodes, nested subteams, and
  explicit escalation paths. A linear flow or named-flow-variant model
  is too limited as the long-term abstraction.
- Policy:
  - Simple teams may be documented as linear flows.
  - Runtime-capable team definitions should eventually represent
    nodes, transitions, retry policies, completion states, and
    escalation states.
  - Conditional expansions should be encoded as transition logic or
    optional nodes, not as unrelated duplicate teams.
  - Each node should eventually declare a specialist/team target,
    input contract, output contract, retry policy, and allowed
    transitions.
  - Retry loops must be bounded.
  - Advanced parallel or nested teams may be deferred, but the model
    should not preclude them.
- Deferred details (tracked here, not promoted to separate Open
  entries):
  - Exact YAML schema for state-machine team definitions (folded
    into D-A1 checkpoint).
  - Whether fan-out/fan-in is implemented in the first runtime
    migration.
  - Whether hierarchical subteams are implemented immediately or
    reserved for future teams.
- Supersedes: previous Open status.

### D-O7: Encoding context presentation and authority order — staged model
- Status: `Canonical decision; implementation pending`
- Decision: Use a staged encoding model that documents the orders
  immediately, standardizes them in prompt/template sections next, and
  eventually encodes them in structured context bundles that a runtime
  context assembler can validate and apply.
- Rationale: The distinction between presentation order and authority
  order is central to the specialist context model. It should be
  documented immediately, standardized in prompt/template sections
  next, and eventually encoded in structured context bundles.
- Staged model:
  1. Documentation stage:
     - Document presentation order and authority order in taxonomy
       and contract docs.
     - Ensure specialist docs reference the distinction where
       relevant.
  2. Template stage:
     - Standardize specialist prompt/context templates around the
       presentation order:
       ```text
       base specialist context
         -> variant context
         -> global repository rules
         -> assembled specialist contract
         -> orchestrator task packet
         -> task-specific context
         -> upstream artifacts and evidence
         -> output template
       ```
     - Include an explicit conflict-resolution section describing
       authority order.
  3. Schema checkpoint:
     - Define a structured context bundle schema as part of the
       YAML/schema work (see D-A1).
     - The schema should include both `presentation_order` and
       `authority_order`.
  4. Runtime stage:
     - Implement or update a context assembler that constructs
       specialist context in presentation order.
     - The assembler should include authority-order conflict rules.
     - Validation should detect missing required context sections or
       conflicting instructions where possible.
- Policy:
  - Do not rely on undocumented implicit prompt assembly long term.
  - Do not implement runtime context assembly before the YAML/context
    schema decision (D-A1) is settled, unless this decision is
    explicitly superseded.
  - Authority order must always constrain presentation order.
- Note: The presentation model includes the assembled specialist
  contract layer and the output template layer.
- Supersedes: previous Open status.

### D-A1: YAML schema / template checkpoint scope
- Status: `Canonical decision; implementation pending`
- Refinements: location language refined by D-A3 (work converges into
  `specs/`); authoritative encoding refined by D-A4 (structured YAML
  is canonical); contract-layer surface refined by D-A5 (most layers
  are derived views, not new files); effective-contract assembly site
  refined by D-A6 (orchestrator-time, packet-borne).
- Decision: The YAML checkpoint must define v1 templates for
  specialist definitions, team definitions, context bundles, modular
  contract layers, invocation addenda, output template references, and
  generated effective-contract assembly.
- Rationale: The project needs structured YAML artifacts before
  runtime taxonomy metadata is added. Specialist definitions capture
  the base_class/variant/artifact responsibility model. Team
  definitions capture the future state-machine model (D-O6). Context
  bundles capture presentation order and authority order (D-O7).
  Contract layers and invocation addenda define the rules,
  constraints, and output expectations for specialist execution.
  Effective-contract assembly gives agents one concise execution
  contract while preserving modular source contracts for
  maintainability.
- Contract model: Use tiered modular source contracts for
  maintainability, but provide agents with a single assembled
  effective contract for execution.
- Contract layers:
  - Universal specialist contract: stable rules for all specialists.
  - Repository contract: project-specific rules.
  - Base class contract: Planner/Scribe/Builder/Reviewer rules.
  - Variant contract: specialist variant rules.
  - Team/node contract: state-machine node constraints such as
    retries, transitions, and handoff requirements.
  - Invocation addendum: small task-specific constraints.
  - Output template reference: required output or handoff format.
- Policy:
  - Stable contract layers should be committed.
  - Invocation addenda should be small and task-specific.
  - Effective contracts should be generated for agent consumption.
  - Effective contracts should be injected directly into context or
    written to an ignored cache.
  - Generated per-task contracts should not be committed by default.
  - Only source contracts, schemas, templates, and selected examples
    should be committed.
  - Plain Markdown links are useful for humans but should not be
    treated as reliable inclusion for agent context.
  - Lower contract layers may narrow higher layers, but they must
    not contradict them.
  - Runtime taxonomy metadata should not be added before this YAML
    checkpoint is complete, unless this decision is explicitly
    superseded.
- Required checkpoint outputs:
  - Specialist definition YAML template.
  - Team definition YAML template.
  - Context bundle YAML template.
  - Modular contract layer template.
  - Invocation addendum template.
  - Output template reference format.
  - Effective contract assembly model.
  - Field glossary.
  - Required vs optional field rules.
  - Alias/deprecation lifecycle fields.
  - Migration status fields.
  - At least one example specialist artifact.
  - At least one example team artifact.
  - At least one example contract / effective-contract artifact.
  - Validation expectations.
  - Open questions for schema v2.
- Suggested locations:
  - `agents/schemas/`
  - `agents/templates/`
  - `agents/contracts/`
  - `agents/examples/`
- Commit policy: Generated effective contracts should not be committed
  by default. If example effective contracts are committed, they must
  be clearly marked as examples.
- Supersedes: previous `Agreed, needs detail` status.

### D-A2: Validation tests for taxonomy compliance — layered validation
- Status: `Canonical direction; implementation deferred until schema work`
- Decision: Use layered validation for taxonomy compliance. Define
  validation categories now; implement automated validation after the
  YAML schema/template checkpoint (D-A1) is complete.
- Rationale: The taxonomy introduces base classes, variants, alias
  lifecycles, state-machine team definitions, context bundles, and
  contract layers. These will drift unless eventually validated.
  However, automated validation should not be implemented before the
  YAML schema and metadata source format are settled.
- Policy:
  - Use manual checklist validation during documentation
    assimilation.
  - Add schema-based validation after YAML templates are defined.
  - Add runtime alignment validation after TypeScript taxonomy
    metadata exists.
  - Add team state-machine validation when team definitions move
    beyond simple linear docs.
  - Validation should support staged enforcement: warning mode first,
    failure mode later.
  - Deprecated aliases should become progressively stricter through
    the alias lifecycle (see D-D1).
- Required validation categories:
  1. Specialist taxonomy validation.
  2. Alias lifecycle validation.
  3. Team definition and state-machine validation.
  4. Context bundle and contract-layer validation.
  5. Runtime/docs alignment validation.
- Deferred detail: Exact test files, validation script names, and CI
  integration should be decided after the YAML schema checkpoint
  (D-A1).
- Supersedes: previous `Agreed, needs detail` status.

### D-A3: Stage 3.5 schema work converges into `specs/`, not a parallel `agents/` tree
- Status: `Canonical`
- Decision: All Stage 3.5 (T-29) schema, template, contract-layer,
  and example artifacts land under the existing `specs/` tree. The
  literal "suggested locations" in D-A1 and the Stage 3.5 plan
  (`agents/schemas/`, `agents/templates/`, `agents/contracts/`,
  `agents/examples/`) are overridden by this decision.
- Rationale: A V1 schema and templates already exist at
  `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`,
  `specs/specialists/SPECIALIST_TEMPLATE.yaml`,
  `specs/teams/TEAM_TEMPLATE.yaml`, and `specs/teams/build-team.yaml`,
  and Decision #45 in the project-level `DECISION_LOG.md` already
  chose `specs/` as the home for machine-readable routing artifacts.
  Creating a parallel `agents/` schema tree would silently fork the
  source-of-truth and require future reconciliation work.
- Policy:
  - Stage 3.5 schema work extends
    `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md` to V2 in place,
    rather than creating a new schema doc.
  - New artifact types may add new directories under `specs/` only as
    they are needed (e.g. `specs/contracts/`, `specs/templates/`,
    `specs/examples/`). They are not pre-created.
  - The Stage 3.5 section of
    `agents/SPECIALIST_TAXONOMY_MIGRATION_PLAN.md` must be updated to
    point at `specs/` paths so a fresh agent does not re-create the
    parallel tree.
  - Existing `specs/` schema fields are preserved for V1
    compatibility; V2 extends them with taxonomy fields.
- Scope: This decision overrides only the file-location language in
  D-A1. The substantive checkpoint scope of D-A1 (specialist
  definition, team definition, context bundle, modular contract
  layers, invocation addendum, output template reference, effective
  contract assembly, field glossary, required vs optional rules,
  alias/lifecycle and migration-status fields, examples, validation
  expectations, schema-v2 open questions) remains canonical.

### D-A4: Authoritative encoding for specialists and teams is structured YAML under `specs/`
- Status: `Canonical decision; implementation pending`
- Decision: For routing, validation, and taxonomy metadata, the
  authoritative source for each specialist and team is a structured
  YAML file under `specs/specialists/<id>.yaml` and
  `specs/teams/<id>.yaml`. The narrative `agents/specialists/*.md`
  and `agents/teams/*.md` files remain the human-readable role
  descriptions and reference the YAML as authoritative.
- Rationale: Matches the project-wide rule already recorded in
  `docs/handoff/CURRENT_STATUS.md` that machine-first artifacts
  (YAML/JSON) are canonical for routing while Markdown is for human
  reference. Gives D-A2 layered validation a single concrete target
  per specialist and per team. Avoids the dual-source-of-truth risk
  of having taxonomy metadata in both `.md` and `.yaml`.
- Policy:
  - Each existing specialist gets a committed
    `specs/specialists/<id>.yaml` carrying full V2 taxonomy metadata
    (`base_class`, `variant`, `aliases`, `migration_status`, plus the
    existing V1 contract and prompt fields).
  - Each canonical team flow gets a committed
    `specs/teams/<id>.yaml` (default everyday team, design-to-build
    team).
  - Narrative `.md` files in `agents/specialists/` and `agents/teams/`
    keep their Taxonomy sections but explicitly reference the YAML as
    the authoritative source for taxonomy/contract fields.
  - YAML is not yet runtime authority. Runtime alignment with YAML
    remains a Stage 4+ responsibility (consistent with the existing
    Authority section of
    `specs/schemas/SPECIALIST_AND_TEAM_YAML_SPEC.md`).
- Resolves: ambiguity in D-O2 step 3 about whether YAML metadata is
  delivered as front matter on `.md` files or as standalone `.yaml`.
  The answer is standalone `.yaml` under `specs/`. Front matter on
  `.md` files is not used.

### D-A5: Contract-layer files are introduced only where no existing artifact owns the layer
- Status: `Canonical`
- Decision: Of the seven contract layers in D-A1 (universal,
  repository, base-class, variant, team-node, invocation addendum,
  output template), three become new committed files; the remaining
  four are derived sections of artifacts that already exist or are
  introduced elsewhere.
- New committed files (under `specs/`):
  - `specs/contracts/universal.md` — universal specialist contract
    (stable rules for all specialists).
  - `specs/contracts/repository.md` — repository-specific contract;
    lifts agent-relevant rules from `AGENTS.md` and other repo-level
    docs into a single addressable contract layer.
  - `specs/templates/<artifact_type>.md` — output template per
    canonical artifact type, referenced by id from specialist YAML
    `artifact_template` blocks.
- Layers as views, not files:
  - Base-class contract — section of
    `agents/SPECIALIST_TAXONOMY_AND_CONTEXT_MODEL.md`.
  - Variant contract — block in the specialist YAML under
    `specs/specialists/<id>.yaml`.
  - Team-node contract — the existing `transition_rules`,
    `per_state_expected_artifact`, `partial_handling`, and
    `loop_limits` blocks in team YAML.
  - Invocation addendum — generated per-task; never committed
    (consistent with D-A1 commit policy).
- Rationale: Each rule should live with the artifact it constrains.
  Inventing five new file formats for layers that already have
  natural homes increases maintenance cost and creates ambiguity
  about which file is authoritative for which rule.
- Policy:
  - The Stage 3.5 schema doc lists every contract layer and
    explicitly states whether it is a committed file or a derived
    view, so layer composition is unambiguous.
  - References between layers use stable ids (e.g.
    `output_template: <artifact_type>`) rather than relative paths
    where practical.
  - New contract-layer files may be added later only when an existing
    artifact cannot naturally host the layer; such additions belong
    in this decision log, not in implementation patches.

### D-A6: Effective-contract assembly site — orchestrator-time, packet-borne
- Status: `Canonical decision; implementation pending`
- Decision: The effective specialist contract is assembled by the
  orchestrator before delegation and delivered to the specialist via
  the task packet. Specialists do not assemble their own effective
  contract.
- Rationale: Aligns with Decision #44 (layered context
  initialization), which establishes that specialists receive context
  only via the task packet. Keeps specialist runtime narrow and
  avoids forcing each specialist to know the full layer stack and
  layer-resolution rules.
- Scope of T-29 (Stage 3.5):
  - T-29 specifies the assembly model only: layer ordering
    (per D-O7 presentation order), the conflict-resolution rule that
    authority order overrides presentation order on conflict, and the
    schema/shape of the assembled effective contract.
  - T-29 does not implement an assembler. Implementation is a
    Stage 4-or-later concern.
- Policy:
  - Generated effective contracts are not committed to the repository
    (consistent with D-A1 commit policy).
  - Example effective contracts may be committed under
    `specs/examples/`, clearly marked as examples.
  - The orchestrator is the sole assembler in v1. Specialist runtime
    treats the effective contract as opaque incoming context and does
    not re-derive it from source layers.
  - The schema describes a context bundle distinct from onboarding
    manifests under `specs/onboarding/`. Onboarding manifests are
    static per-role startup context; the context bundle is the
    per-task assembled context delivered with the packet (see D-O7).
- Resolves: ambiguity about whether D-O7 stage-4 runtime context
  assembly happens at orchestrator-time or at specialist-time.

### D-D3: Doc-formatter base class and variant — not promoted
- Status: `Canonical decision; cleanup/migration deferred`
- Decision: Do not promote `doc-formatter` to a canonical specialist
  variant.
- Rationale: The current doc-formatter performs narrow, read-only
  Markdown normalization. That may be useful as a utility transform,
  but it does not require a distinct specialist identity, decision
  boundary, artifact responsibility, or review lens. The preferred
  long-term mechanism is for output templates and effective contracts
  (D-A1) to make upstream specialists produce correctly structured
  Markdown directly.
- Policy:
  - Treat doc-formatter as an optional utility or transitional
    helper, not a core specialist.
  - Do not route to doc-formatter by default.
  - Do not include doc-formatter in the canonical specialist
    taxonomy.
  - Preserve it only if current workflows depend on it.
  - Revisit only if repeated workflows show that Markdown
    normalization requires a distinct specialist stage.
  - If future formatting behavior mutates repository files or runs
    formatting tools, evaluate it separately as a possible Builder
    utility or Builder variant.
- Migration consequence: `doc-formatter` should not be migrated into
  the canonical taxonomy unless a future decision supersedes this.
- Supersedes: previous Deferred status that left classification open.

---

## Proposed Decisions

### D-P1: scribe-spec replaces spec-writer
- Status: `Proposed`
- Decision: `spec-writer` is reclassified as the Scribe variant
  `scribe-spec`.
- Open question: file rename and runtime identifier rename are tracked
  separately (see D-O1; runtime alias mechanics now follow D-D1).

### D-P2: scribe-schema replaces schema-designer
- Status: `Proposed`
- Decision: `schema-designer` is reclassified as the Scribe variant
  `scribe-schema`.
- Open question: D-O1 (filenames). Runtime mechanics follow D-D1.

### D-P3: scribe-routing replaces routing-designer
- Status: `Proposed`
- Decision: `routing-designer` is reclassified as the Scribe variant
  `scribe-routing`.
- Open question: D-O1. Runtime mechanics follow D-D1.

### D-P4: reviewer-critic replaces critic
- Status: `Proposed`
- Decision: `critic` is reclassified as the Reviewer variant
  `reviewer-critic`.
- Open question: D-O1. Runtime mechanics follow D-D1.

### D-P5: reviewer-boundary-auditor replaces boundary-auditor
- Status: `Proposed`
- Decision: `boundary-auditor` is reclassified as the Reviewer variant
  `reviewer-boundary-auditor`.
- Open question: D-O1. Runtime mechanics follow D-D1.

---

## Open Decisions

### D-O1: Specialist filename rename strategy
- Status: `Open`
- Question: Should specialist `.md` files be renamed immediately to
  match the canonical variant names, or should current filenames be
  retained with explicit Taxonomy notes for a transitional period?
- Considerations:
  - Renaming files breaks inbound documentation links and historical
    references.
  - Keeping current filenames keeps documentation links stable but
    risks obscuring the canonical names.
  - A compromise is to add taxonomy aliases inside each file and
    defer rename to the cleanup stage.
- Default during this pass: keep current filenames, add Taxonomy
  sections, defer rename to Stage 7.

---

## Deferred Decisions

### D-D2: Validation-focused Reviewer variant — `reviewer-validation`
- Status: `Deferred with activation condition`
- Decision: Do not create `reviewer-validation` yet. Keep it as a
  deferred possible Reviewer variant.
- Rationale: Test creation belongs to `builder-test`, and simple test
  execution can be performed by any suitable actor. A
  validation-focused Reviewer variant is only warranted if repeated
  workflows show a need for independent validation-evidence
  interpretation beyond ordinary review.
- Activation condition: Create `reviewer-validation` only if workflows
  repeatedly require a distinct reviewer to evaluate whether
  validation evidence actually supports acceptance, whether the right
  checks were selected, whether risks remain untested, or whether
  failures come from implementation, test design, or ambiguous
  specification.

---

## Superseded Decisions

(none yet)

---

## New Open Questions Discovered in This Pass

None at this time. The settled decisions above intentionally fold
secondary detail (e.g. discriminated unions for runtime types,
fan-out/fan-in implementation, hierarchical subteams) into deferred
notes on the parent decision rather than introducing new top-level
Open entries. If implementation surfaces new ambiguity, log it here
as `Open` or `Deferred` rather than resolving it inside a patch.
