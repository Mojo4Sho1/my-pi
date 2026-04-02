# Reflective Expertise Layer
**Status:** Draft design proposal  
**Audience:** Project maintainers and implementation agents  
**Scope:** `my-pi` architecture extension for governed specialist improvement through typed, inspectable expertise overlays

---

## 1. Purpose

This document defines a design and implementation plan for a **Reflective Expertise Layer** that allows specialists in `my-pi` to improve over time without uncontrolled prompt mutation.

The central idea is simple:

- the system already produces artifacts during execution,
- those artifacts can be summarized into historical records,
- historical records can be distilled into lessons,
- lessons can update specialist expertise profiles,
- expertise can be injected at runtime as a bounded overlay,
- specialists therefore improve over time while their core identity remains stable.

This design intentionally avoids freeform self-rewriting prompts. Instead, it uses **governed, typed, versioned, inspectable overlays**.

---

## 2. Problem Statement

The current project already supports:

- bounded specialists,
- teams and orchestration,
- typed packets,
- worklists and session artifacts,
- delegation logs,
- structured prompt construction,
- explicit project foundation and orchestration doctrine.

However, the current architecture does not yet provide a disciplined mechanism for answering the question:

> How do specialists get better at their roles over time?

Without such a mechanism, every specialist invocation starts fresh from its base role definition and current task context. That keeps behavior stable, but it leaves no formal pathway for cumulative improvement based on project experience.

A naïve solution would rewrite specialist prompts over time. That approach creates several problems:

- prompt drift,
- bloated context,
- hidden behavior changes,
- poor reversibility,
- weak inspectability,
- difficult debugging,
- accidental contamination of global knowledge with project-local quirks.

This proposal solves that problem by introducing a reflective loop that converts execution history into structured expertise overlays.

---

## 3. Design Goals

### 3.1 Primary Goals

1. **Enable specialist growth over time**
   Specialists should improve based on observed project experience.

2. **Preserve specialist identity**
   Base role/persona prompts should remain stable.

3. **Keep changes inspectable**
   Every expertise update should be reviewable, attributable, and reversible.

4. **Keep growth bounded**
   Expertise injection should be selective and relevant to the current task.

5. **Separate local and global learning**
   The system should distinguish project-specific lessons from reusable specialist knowledge.

6. **Support governance**
   No learning artifact should silently alter behavior without validation.

7. **Fit existing architecture**
   The solution should align with `my-pi` principles around contracts, packets, artifacts, routing, and bounded context.

### 3.2 Secondary Goals

1. Support future meta-teams and self-expansion work.
2. Preserve human readability for review and curation.
3. Support future evaluation of lesson quality and impact.
4. Minimize disruption to current orchestration flows.

---

## 4. Non-Goals

This design does **not** attempt to:

1. train model weights,
2. create autonomous unrestricted self-modification,
3. replace explicit project documentation,
4. turn every artifact into memory,
5. inject all historical knowledge into every prompt,
6. infer global lessons from weak evidence,
7. remove the need for review, routing, or specialist boundaries.

---

## 5. Guiding Principles

### 5.1 Stable identity, adaptive expertise
A specialist’s core identity remains stable. Improvement happens through expertise overlays, not identity mutation.

### 5.2 Typed before prose
Wherever possible, the system stores lessons and expertise in typed structures first and renders human-readable summaries second.

### 5.3 Bounded context over accumulated sludge
The system injects only relevant expertise into a specialist invocation.

### 5.4 Governance over autonomy
The system proposes expertise changes. It does not silently activate them.

### 5.5 Evidence before belief
Every lesson should trace back to artifacts, records, or repeated project evidence.

### 5.6 Local first, global later
The system should treat project-local lessons as the default. Global lessons require stronger evidence and stricter review.

### 5.7 Version everything
Expertise profiles, patches, and lessons should be versioned and attributable.

---

## 6. Core Conceptual Model

The Reflective Expertise Layer adds a second-order loop around normal execution.

### 6.1 Normal execution loop
1. A user or orchestrator issues work.
2. Specialists and teams perform the work.
3. The system emits artifacts, packets, logs, and results.

### 6.2 Reflective loop
1. The system collects raw execution artifacts.
2. A historian converts those artifacts into historical records.
3. A lesson pipeline derives candidate lessons.
4. A governance pipeline validates and scopes those lessons.
5. An expertise pipeline proposes patches to specialist expertise profiles.
6. Approved expertise becomes available for future runtime injection.

This means the system improves through **reflection on structured experience**.

---

## 7. Terminology

### 7.1 Artifact
Any persistent execution output already produced by the system, including logs, result packets, review outputs, and team session artifacts.

### 7.2 Historical Record
A normalized summary of one or more related execution artifacts. It captures what happened, why it mattered, and what conditions influenced success or failure.

### 7.3 Lesson
A reusable statement derived from one or more historical records. Lessons are typed, scoped, confidence-rated, and evidence-backed.

### 7.4 Expertise Profile
A versioned, specialist-specific collection of approved knowledge overlays.

### 7.5 Expertise Patch
A proposed additive or subtractive modification to an expertise profile.

### 7.6 Local lesson
A lesson that applies only to the current project or repository.

### 7.7 Global lesson
A lesson that applies to a specialist role across projects.

### 7.8 Sleep
A project-local consolidation process.

### 7.9 Deep sleep
A cross-project or cross-context consolidation process for global expertise.

---

## 8. High-Level Architecture

The design introduces four primary subsystems:

1. **Archive**
2. **Lesson Forge**
3. **Expertise Registry**
4. **Context Loader**

### 8.1 Archive
The Archive subsystem gathers and normalizes raw execution outputs into a common historical representation.

### 8.2 Lesson Forge
The Lesson Forge subsystem derives candidate lessons from historical records and classifies them as local or global.

### 8.3 Expertise Registry
The Expertise Registry stores expertise profiles, lessons, patches, and version history.

### 8.4 Context Loader
The Context Loader selects relevant expertise overlays at invocation time and injects them into specialist context.

---

## 9. Proposed Subsystems in Detail

## 9.1 Archive

### 9.1.1 Purpose
Convert raw system outputs into normalized, analysis-ready records.

### 9.1.2 Inputs
The Archive should pull from existing structured outputs such as:

- delegation logs,
- result packets,
- review outputs,
- test outputs,
- team session artifacts,
- worklist outcomes,
- structured failure reports,
- orchestration transitions.

### 9.1.3 Outputs
The Archive should produce `HistoricalRecord` objects.

### 9.1.4 Why this matters
Artifacts are already structured and bounded. That makes them better reflective input than arbitrary freeform text scraping across the repo.

---

## 9.2 Historian

### 9.2.1 Role
The Historian is a specialist that reads historical records and emits compact, semantically useful summaries.

### 9.2.2 Responsibilities
The Historian should:

- summarize what was attempted,
- capture what succeeded,
- capture what failed,
- note relevant conditions or constraints,
- identify recurring patterns,
- avoid proposing lessons directly unless explicitly asked.

### 9.2.3 Why a specialist works here
The historian’s task is narrow and bounded. It primarily transforms evidence into a readable record. This fits the specialist model.

### 9.2.4 Output form
The Historian should emit `HistorianMemo` or `HistoricalDigest` artifacts that remain evidence-linked.

---

## 9.3 Lesson Forge

### 9.3.1 Role
Convert historical summaries into structured candidate lessons.

### 9.3.2 Why this should be a team
Lesson derivation is not just summarization. It requires:

- pattern extraction,
- skepticism,
- boundary checking,
- scope classification,
- phrasing for future use.

That is better modeled as a small team or reusable pipeline.

### 9.3.3 Suggested internal roles
A first version can model this as a staged pipeline even before all specialists exist as full runtime entities.

Suggested roles:

1. **Pattern Extractor**
   Identifies candidate recurring behaviors or heuristics.

2. **Critic**
   Challenges whether the candidate is a real lesson or just an accident.

3. **Scope Classifier**
   Determines whether the lesson is local or global.

4. **Boundary Auditor**
   Ensures the lesson does not authorize overreach, scope creep, or inappropriate context expansion.

5. **Reviewer**
   Produces the final structured lesson candidate.

### 9.3.4 Outputs
The Lesson Forge should emit `Lesson` objects with evidence references and confidence.

---

## 9.4 Expertise Registry

### 9.4.1 Role
Persist specialist expertise in a structured, versioned, inspectable form.

### 9.4.2 Responsibilities
The registry should:

- store approved lessons,
- maintain specialist expertise profiles,
- record patch proposals,
- store activation status,
- preserve provenance and version history,
- support rollback and diff inspection.

### 9.4.3 Why not just markdown
Markdown alone is too loose for robust selection, filtering, scope validation, and activation control.

Markdown remains useful as a human-readable projection, but the authoritative form should be typed.

---

## 9.5 Dreaming / Consolidation

### 9.5.1 Role
Take approved lessons and generate expertise patches.

### 9.5.2 What dreaming should actually do
Dreaming should not rewrite personalities. It should:

- compare lessons against current expertise,
- identify missing guidance,
- detect redundancy,
- detect contradictions,
- propose a patch,
- produce a rationale,
- preserve evidence links.

### 9.5.3 Why a team makes sense
Consolidation benefits from a pipeline that can compare, synthesize, critique, and patch.

### 9.5.4 Two states of dreaming
This design formalizes the two consolidation modes.

#### A. Sleep
Project-local consolidation.

- input: local lessons
- output: updates to `specialist.local` expertise

#### B. Deep sleep
Cross-project consolidation.

- input: vetted global lessons only
- output: updates to `specialist.global` expertise

### 9.5.5 Activation rule
Dreaming should propose changes, not activate them automatically.

---

## 9.6 Context Loader

### 9.6.1 Role
Inject only relevant expertise into specialist runtime context.

### 9.6.2 Responsibilities
The loader should:

- identify the target specialist,
- inspect task type, packet metadata, tags, and scope,
- select relevant expertise fragments,
- enforce token budgets,
- separate local and global overlays,
- attach the final expertise supplement to the invocation context.

### 9.6.3 Injection strategy
At invocation time, context should look like:

1. base specialist identity,
2. task packet and normal runtime handoff,
3. selected expertise overlay,
4. optional recent relevant lessons for traceability.

### 9.6.4 Why this matters
This preserves stable base prompts while letting specialists improve in a bounded and task-relevant way.

---

## 10. Proposed Data Model

The exact type names can evolve, but the system should at minimum support the following conceptual entities.

## 10.1 HistoricalRecord

```text
HistoricalRecord
- id
- createdAt
- sourceArtifactIds[]
- sessionId
- taskType
- initiatingContext
- participants[]
- summary
- successes[]
- failures[]
- constraints[]
- decisions[]
- evidenceRefs[]
- tags[]
```

### Notes
This object should represent a normalized execution event or coherent unit of work.

---

## 10.2 HistorianMemo

```text
HistorianMemo
- id
- createdAt
- historicalRecordIds[]
- narrativeSummary
- recurringPatterns[]
- unresolvedQuestions[]
- candidateThemes[]
- evidenceRefs[]
```

### Notes
This object is more semantic and readable than `HistoricalRecord`, but it should still remain evidence-linked.

---

## 10.3 Lesson

```text
Lesson
- id
- createdAt
- status                // candidate | approved | rejected | deprecated
- scope                 // local | global
- specialistTarget      // planner | builder | reviewer | tester | etc.
- kind                  // heuristic | anti-pattern | boundary-rule | quality-rule | workflow-hint
- statement
- rationale
- applicabilityTags[]
- exclusions[]
- evidenceRefs[]
- confidence            // low | medium | high
- sourceHistorianMemoIds[]
- sourceHistoricalRecordIds[]
- proposedBy
- reviewedBy[]
- supersedes[]
- version
```

### Notes
This should be the main reusable learning unit.

---

## 10.4 ExpertiseProfile

```text
ExpertiseProfile
- id
- specialistTarget
- scope                 // local | global
- status                // active | inactive | archived
- version
- summary
- entries[]
- sourceLessonIds[]
- createdAt
- updatedAt
```

---

## 10.5 ExpertiseEntry

```text
ExpertiseEntry
- id
- category              // planning | review | implementation | validation | communication | boundary
- statement
- rationale
- applicabilityTags[]
- exclusions[]
- priority              // advisory | strong | critical
- sourceLessonIds[]
- confidence
```

---

## 10.6 ExpertisePatch

```text
ExpertisePatch
- id
- createdAt
- targetProfileId
- targetSpecialist
- scope                 // local | global
- proposedAdds[]
- proposedRemovals[]
- rationale
- sourceLessonIds[]
- conflicts[]
- reviewStatus          // proposed | approved | rejected | applied
- appliedVersion
```

---

## 11. Storage Model

The system should maintain both human-readable and machine-readable representations.

## 11.1 Machine-readable authoritative layer
Suggested location:

- `extensions/shared/reflective/`
- `extensions/shared/expertise/`
- `extensions/shared/archive/`

Suggested files:

- `historical-record-types.ts`
- `lesson-types.ts`
- `expertise-types.ts`
- `expertise-registry.ts`
- `expertise-selector.ts`
- `expertise-patcher.ts`
- `lesson-validator.ts`
- `archive-normalizer.ts`

## 11.2 Human-readable projection layer
Suggested location:

- `docs/reflective/`
- `docs/lessons/local/`
- `docs/lessons/global/`
- `docs/expertise/specialists/`

Suggested files:

- `docs/reflective/README.md`
- `docs/reflective/process.md`
- `docs/lessons/local/<specialist>/<lesson-id>.md`
- `docs/lessons/global/<specialist>/<lesson-id>.md`
- `docs/expertise/specialists/<specialist>.local.md`
- `docs/expertise/specialists/<specialist>.global.md`

### Why dual representation matters
- typed files support automation,
- markdown supports review and discussion,
- diffs become understandable,
- another agent can reason over the human-readable form,
- runtime selection remains deterministic.

---

## 12. Integration with Existing `my-pi` Architecture

This proposal should integrate with, not replace, existing architecture.

## 12.1 Existing structures it should build on
This system should leverage:

- result packets,
- team session artifacts,
- delegation logs,
- worklist/session outputs,
- specialist prompt construction,
- orchestration boundaries,
- shared logging and typing layers.

## 12.2 Architectural alignment
This design aligns with current project doctrine because it:

- preserves bounded invocation,
- keeps contracts authoritative,
- treats history as inspectable artifact,
- avoids hidden mutable prompt state,
- supports future meta-team work,
- keeps routing and improvement external to specialist identity.

---

## 13. Runtime Behavior

## 13.1 Invocation flow with expertise overlays
When a specialist is invoked:

1. The orchestrator determines the specialist target.
2. The task packet and current context are assembled.
3. The Context Loader retrieves active expertise for that specialist.
4. The loader filters expertise by:
   - task type,
   - tags,
   - packet metadata,
   - local vs global scope,
   - token budget,
   - recent applicability.
5. The loader constructs an expertise supplement.
6. The specialist runs with:
   - stable base prompt,
   - bounded task context,
   - selected expertise overlay.

## 13.2 Selection policy
The loader should prioritize:

1. critical boundary rules,
2. task-relevant local expertise,
3. task-relevant global expertise,
4. anti-pattern reminders,
5. quality rules,
6. lower-priority heuristics only if budget remains.

## 13.3 Context budget policy
The loader should never inject a full expertise profile. It should inject a filtered subset.

A first version can use simple tag matching and priority ordering. A later version can use more sophisticated retrieval or similarity ranking.

---

## 14. Governance Model

Governance is the heart of this design.

## 14.1 Required governance constraints
No expertise change should activate unless it passes:

1. evidence validation,
2. scope validation,
3. conflict detection,
4. review approval,
5. versioning.

## 14.2 Governance stages
A candidate lesson or patch should move through:

1. `proposed`
2. `under_review`
3. `approved`
4. `applied`
5. `deprecated` or `rejected`

## 14.3 Review policy
At minimum, the system should require explicit approval before:

- a lesson becomes global,
- a patch modifies active expertise,
- a boundary rule changes specialist behavior,
- an old expertise entry gets removed.

## 14.4 Conflict detection
The system should detect:

- contradictory lessons,
- redundant lessons,
- lessons that weaken boundaries,
- project-specific guidance incorrectly promoted to global,
- entries that exceed context budgets.

---

## 15. Local vs Global Learning Policy

This distinction should be strict.

## 15.1 Local lessons
A local lesson applies when it depends on:

- repository structure,
- current project architecture,
- project naming conventions,
- current team practices,
- temporary tooling choices,
- repo-specific workflow rules.

### Example
> In this repo, the reviewer should check worklist artifact consistency before signoff.

This is project-local unless independently validated elsewhere.

## 15.2 Global lessons
A global lesson applies when it expresses something robust about the role itself, such as:

- general review behavior,
- broadly reusable planning heuristics,
- generic implementation anti-patterns,
- stable orchestration principles,
- cross-project validation discipline.

### Example
> A reviewer should distinguish structural completeness from semantic correctness and check both explicitly.

That is plausibly global if repeated and well supported.

## 15.3 Promotion rules
A lesson should only move from local to global if:

1. it survives multiple reviews,
2. it is not phrased in repo-specific language,
3. it shows repeated value,
4. it does not depend on local conventions,
5. it passes stricter governance checks.

---

## 16. Sleep and Deep Sleep Design

## 16.1 Sleep
Sleep is the local reflective loop.

### Inputs
- recent historical records,
- historian memos,
- approved local lessons,
- active local expertise profiles.

### Outputs
- proposed local expertise patches,
- local lesson consolidation,
- redundancy cleanup,
- local expertise diffs.

### Frequency
A first version can trigger sleep:

- manually,
- after major milestones,
- after a bounded number of task sessions,
- after a team workflow completes.

## 16.2 Deep Sleep
Deep sleep is the global reflective loop.

### Inputs
- only approved high-confidence global lessons,
- active global expertise profiles,
- possibly cross-project evidence in the future.

### Outputs
- proposed global expertise patches,
- global expertise diffs,
- promotion records from local to global.

### Frequency
Deep sleep should run less often and with stricter criteria.

### Conservative default
In early versions, deep sleep should remain largely manual or semi-manual.

---

## 17. Safety, Failure Modes, and Risk Controls

## 17.1 Major risks

### A. Prompt drift by stealth
If expertise overlays become too large or too vague, they effectively mutate the specialist.

**Mitigation:** strict selection budgets, typed entries, explicit scope.

### B. Garbage lessons
Weak or noisy artifacts could produce low-quality lessons.

**Mitigation:** critic stage, confidence rating, evidence thresholds.

### C. Local-global contamination
Repo quirks could become falsely universal.

**Mitigation:** strict promotion rules and separate registries.

### D. Expertise bloat
Profiles may grow endlessly.

**Mitigation:** patch-based consolidation, deprecation, deduplication, capped active entries.

### E. Contradictory guidance
Over time, specialists may accumulate conflicting instructions.

**Mitigation:** conflict detection and versioned diff review.

### F. Hidden behavioral changes
If applied patches are not visible, debugging becomes hard.

**Mitigation:** active expertise version stamping in invocation metadata.

---

## 18. Observability and Auditability

The system should make reflective behavior observable.

## 18.1 Every invocation should be able to answer:
- which expertise profile version was active,
- which entries were injected,
- why those entries were selected,
- which lessons supported them.

## 18.2 Every applied patch should preserve:
- proposed diff,
- approving entity,
- evidence refs,
- affected specialist,
- scope,
- activation date,
- superseded entries.

## 18.3 Suggested debugging artifact
Introduce an `ExpertiseInjectionReport` for each specialist invocation.

```text
ExpertiseInjectionReport
- specialist
- profileVersionsUsed[]
- selectedEntryIds[]
- omittedEntryIds[]
- selectionRationale
- tokenBudgetUsed
- sourceLessonIds[]
```

This will be invaluable during tuning.

---

## 19. Evaluation Strategy

This system should prove value empirically.

## 19.1 Success metrics
A first version can evaluate impact using:

1. reduced repeated mistakes,
2. improved review quality,
3. reduced correction loops,
4. improved specialist output consistency,
5. fewer boundary violations,
6. improved artifact quality,
7. improved task completion quality as judged by existing review flows.

## 19.2 Evaluation methods
- compare specialist behavior before and after overlays,
- track whether lessons prevent repeated failures,
- measure whether injected expertise improves downstream review acceptance,
- audit hallucinated or irrelevant expertise injections.

## 19.3 Qualitative evaluation questions
- Does the specialist actually use the overlay?
- Does the overlay improve decisions without bloating context?
- Are local lessons useful only locally?
- Are global lessons truly reusable?

---

## 20. Recommended Initial Scope

This should start small.

## 20.1 Recommended pilot specialist
Choose one specialist with clear output quality and enough artifact history, such as:

- reviewer,
- planner,
- builder.

### Best first choice
`reviewer` is likely the strongest pilot target because:

- review behavior is easy to observe,
- quality rules are easier to express,
- failures are often easier to identify,
- lessons can remain bounded and inspectable.

## 20.2 Recommended first reflective pipeline
Start with:

1. archive normalization,
2. historian specialist,
3. lesson typing,
4. manual approval,
5. expertise injection for one specialist,
6. local-only sleep.

Do **not** start with deep sleep or automatic global updates.

---

## 21. Detailed Implementation Plan

This implementation plan assumes the project is still in active development and should minimize disruption.

## Phase 0 — Design and scaffolding

### Objectives
- define types,
- define storage layout,
- define lifecycle states,
- establish naming conventions.

### Deliverables
- `historical-record-types.ts`
- `lesson-types.ts`
- `expertise-types.ts`
- `reflective/README.md`
- `docs/reflective/PROCESS.md`

### Acceptance criteria
- all core entities have explicit type definitions,
- local/global scope is represented directly,
- versioning and review states are defined.

---

## Phase 1 — Archive foundation

### Objectives
Normalize existing structured outputs into historical records.

### Tasks
1. identify artifact sources in the current system,
2. define a normalization pipeline,
3. implement `HistoricalRecord` generation,
4. store historical records in a retrievable registry.

### Deliverables
- `archive-normalizer.ts`
- `historical-record-registry.ts`
- initial artifact adapters

### Acceptance criteria
- the system can generate historical records from at least one existing workflow,
- records preserve links to source artifacts,
- records are inspectable in both typed and markdown forms if desired.

---

## Phase 2 — Historian specialist

### Objectives
Create a specialist that reads historical records and emits useful summaries.

### Tasks
1. define historian prompt and contract,
2. define `HistorianMemo`,
3. implement a historian workflow over batches of historical records,
4. persist historian outputs as artifacts.

### Deliverables
- historian specialist prompt/config
- `historian-types.ts`
- historian invocation path
- historian artifact persistence

### Acceptance criteria
- the historian can summarize a bounded set of records,
- outputs remain evidence-linked,
- summaries are compact and structured enough for downstream lesson extraction.

---

## Phase 3 — Lesson Forge

### Objectives
Turn historical summaries into candidate lessons.

### Tasks
1. define `Lesson`,
2. implement lesson extraction pipeline,
3. implement confidence assignment,
4. implement local/global classification,
5. implement lesson review state tracking.

### Deliverables
- `lesson-extractor.ts`
- `lesson-validator.ts`
- `lesson-registry.ts`
- `lesson-markdown-renderer.ts`

### Acceptance criteria
- the system can generate candidate lessons from historian memos,
- lessons include evidence refs and scope,
- lessons can be reviewed, approved, or rejected.

---

## Phase 4 — Expertise Registry

### Objectives
Represent specialist expertise as versioned, structured overlays.

### Tasks
1. define `ExpertiseProfile`, `ExpertiseEntry`, and `ExpertisePatch`,
2. implement registry storage,
3. implement diffing and versioning,
4. implement conflict detection,
5. implement human-readable projection.

### Deliverables
- `expertise-registry.ts`
- `expertise-patcher.ts`
- `expertise-diff.ts`
- `docs/expertise/...` projections

### Acceptance criteria
- the system can create an expertise profile for one specialist,
- the system can propose and review patches,
- profile versions are inspectable and reversible.

---

## Phase 5 — Local expertise injection

### Objectives
Inject approved expertise into one pilot specialist at runtime.

### Tasks
1. implement `expertise-selector.ts`,
2. define selection policy,
3. define token budget policy,
4. integrate with specialist prompt construction,
5. emit `ExpertiseInjectionReport`.

### Deliverables
- `expertise-selector.ts`
- `expertise-loader.ts`
- runtime integration in specialist invocation path
- injection observability artifact

### Acceptance criteria
- one specialist can run with selected local expertise overlays,
- injected content is bounded and explainable,
- invocation logs record which expertise entries were used.

---

## Phase 6 — Sleep pipeline

### Objectives
Implement local consolidation over approved lessons and profiles.

### Tasks
1. create sleep workflow,
2. compare lessons against active profiles,
3. generate proposed local expertise patches,
4. require approval before application,
5. render diffs for review.

### Deliverables
- `sleep-runner.ts`
- `local-consolidator.ts`
- patch proposal reports

### Acceptance criteria
- the system can convert approved local lessons into patch proposals,
- no patch activates without explicit review,
- diffs are readable and attributable.

---

## Phase 7 — Global expertise groundwork

### Objectives
Add infrastructure for global lessons and deep sleep, but keep activation conservative.

### Tasks
1. implement global lesson registry,
2. implement stricter promotion rules,
3. add global expertise profiles,
4. add deep sleep patch proposal flow,
5. initially keep approval manual.

### Deliverables
- `global-lesson-registry.ts`
- `global-promotion-validator.ts`
- `deep-sleep-runner.ts`

### Acceptance criteria
- local and global lessons remain clearly separated,
- global promotion is evidence-backed and reviewable,
- deep sleep does not auto-activate global changes.

---

## 22. Suggested File/Module Layout

This is a proposed layout, not a final mandate.

```text
extensions/
  shared/
    reflective/
      archive/
        archive-normalizer.ts
        historical-record-registry.ts
        historical-record-types.ts
      historian/
        historian-types.ts
        historian-runner.ts
      lessons/
        lesson-types.ts
        lesson-extractor.ts
        lesson-validator.ts
        lesson-registry.ts
      expertise/
        expertise-types.ts
        expertise-registry.ts
        expertise-patcher.ts
        expertise-selector.ts
        expertise-loader.ts
        expertise-diff.ts
      sleep/
        sleep-runner.ts
        deep-sleep-runner.ts
        local-consolidator.ts
        global-consolidator.ts
      observability/
        expertise-injection-report.ts
        reflective-audit-log.ts
docs/
  reflective/
    README.md
    PROCESS.md
    GOVERNANCE.md
  lessons/
    local/
    global/
  expertise/
    specialists/
```

---

## 23. Operational Workflow Example

This section shows the full intended lifecycle.

### Step 1 — Normal task execution
A specialist or team completes work and emits:

- result packet,
- delegation log,
- session artifact,
- review output.

### Step 2 — Archive normalization
The Archive creates one or more `HistoricalRecord` objects.

### Step 3 — Historian pass
The Historian summarizes recent historical records into a `HistorianMemo`.

### Step 4 — Lesson derivation
The Lesson Forge generates candidate lessons.

### Step 5 — Governance review
A reviewer approves, rejects, or revises the lessons.

### Step 6 — Sleep
The sleep workflow compares approved local lessons to active local expertise and proposes an `ExpertisePatch`.

### Step 7 — Approval
A review step approves the patch.

### Step 8 — Activation
The patch becomes part of the active local expertise profile.

### Step 9 — Runtime injection
Future specialist invocations load relevant expertise entries.

### Step 10 — Deep sleep
At a slower cadence, a separate workflow evaluates whether any local lesson merits promotion into global specialist expertise.

---

## 24. Prompt and Context Design Guidance

## 24.1 Recommended composition
A specialist invocation should conceptually compose context in this order:

1. base identity and contract,
2. task packet and bounded task context,
3. selected expertise overlay,
4. optional current process constraints.

## 24.2 What should not happen
The system should not:

- rewrite the base specialist persona every cycle,
- append every lesson into the core prompt,
- flatten local and global expertise into one blob,
- inject inactive or rejected lessons,
- inject expertise without observability.

## 24.3 Expertise overlay style
Expertise should be phrased as concise operational guidance, not as autobiographical memory.

### Good style
- Prefer explicit review of artifact consistency before signoff.
- Treat missing evidence as unresolved, not implicitly satisfied.
- Flag structural completeness separately from semantic correctness.

### Bad style
- Last time I made this mistake, so I should remember that...
- I have learned from many examples that...
- I am now better at...

The overlay should read as role guidance, not self-narration.

---

## 25. Open Design Questions

These questions do not block initial implementation, but they should remain visible.

1. Should historian outputs be purely structured, or also include narrative prose?
2. How much automation should review approval allow in early versions?
3. Should lessons require repeated evidence before approval, or only before global promotion?
4. Should expertise profiles support temporary activation windows?
5. Should the loader support similarity retrieval later, or remain purely metadata-driven at first?
6. Should sleep operate over time windows, session counts, or explicit manual triggers?
7. How should deprecation work when a lesson becomes obsolete due to architecture changes?
8. Should local expertise live entirely in the repo, while global expertise lives elsewhere?

---

## 26. Recommended Immediate Decisions

To keep implementation focused, the project should decide the following early:

1. **Pilot specialist**
   Recommend: `reviewer`

2. **Initial scope**
   Recommend: local-only reflective loop first

3. **Approval model**
   Recommend: manual approval for both lessons and patches initially

4. **Authoritative storage**
   Recommend: typed TypeScript structures with markdown projections

5. **First artifact sources**
   Recommend: delegation logs, result packets, review outputs, team session artifacts

6. **Deep sleep policy**
   Recommend: deferred until local loop proves useful

---

## 27. Final Recommendation

This proposal should be adopted as a **governed reflective subsystem** rather than a prompt self-editing mechanism.

The best implementation path is:

1. build typed historical records from current artifacts,
2. add a historian specialist,
3. add lesson extraction and review,
4. add expertise profiles and patching,
5. inject approved local expertise into one pilot specialist,
6. later introduce sleep and deep sleep as controlled consolidation workflows.

This preserves the strengths of the current project:

- bounded specialists,
- explicit contracts,
- inspectable artifacts,
- orchestrated teams,
- disciplined context handling.

At the same time, it gives the system a real mechanism for cumulative improvement.

---

## 28. Condensed Implementation Checklist

```text
[ ] Define HistoricalRecord, HistorianMemo, Lesson, ExpertiseProfile, ExpertisePatch
[ ] Build archive normalization from existing artifacts
[ ] Implement historian specialist and memo artifact
[ ] Implement candidate lesson extraction
[ ] Implement lesson review states and registry
[ ] Implement expertise registry and patch model
[ ] Implement local expertise profile for one pilot specialist
[ ] Implement expertise selection and bounded injection
[ ] Emit expertise injection reports for observability
[ ] Implement local sleep workflow to generate proposed patches
[ ] Require approval before patch application
[ ] Defer global deep sleep until local loop proves stable
```

---

## 29. Short Executive Summary

The project should implement specialist improvement as a **Reflective Expertise Layer** built around:

- structured historical records,
- evidence-backed lessons,
- versioned expertise profiles,
- governed patch proposals,
- bounded runtime expertise injection.

This design gives specialists a disciplined way to improve over time while preserving stability, transparency, and architectural coherence.
