# Team Evaluation and Improvement

**Status:** Draft design note  
**Intended path:** `docs/design/TEAM_EVALUATION_AND_IMPROVEMENT.md`  
**Scope:** my-pi team-level orchestration, evaluation, and controlled improvement

## Purpose

This document proposes a framework for testing, evaluating, and improving **teams** in my-pi over time.

In my-pi, a team is not a loose group of agents chatting with each other. A team is an explicit orchestration unit with a defined state machine, bounded context, and controlled transitions. That structure creates an opportunity: we can evaluate teams in a disciplined way, measure whether they perform well, and improve them based on evidence rather than intuition alone.

This document focuses on four goals:

1. define how to test teams for correctness
2. define how to evaluate team outcomes on representative tasks
3. define how to measure team efficiency and workflow quality
4. define a controlled mechanism for improving teams over time

This document is intentionally separate from the project foundation and implementation plan. It is a design note for an evolving subsystem, not a settled doctrinal document.

---

## Why Team Evaluation Matters

Specialists can be tested in isolation, but teams introduce a different class of behavior. Once multiple specialists operate under a state machine, the system can fail or degrade in ways that do not appear at the specialist level.

A team may be:

- **correct but ineffective**  
  The state machine behaves as specified, but the team often fails to complete useful work.

- **effective but inefficient**  
  The team reaches acceptable outputs, but it does so with unnecessary loops, repeated handoffs, excessive review, or inflated token usage.

- **efficient but brittle**  
  The team appears fast on easy tasks, but it lacks robust recovery paths or fails unpredictably on edge cases.

- **apparently successful but structurally weak**  
  The team completes tasks, but downstream specialists repeatedly correct predictable upstream problems, indicating hidden workflow flaws.

Because my-pi teams use explicit states and transitions, they are far more inspectable than unconstrained multi-agent conversations. That makes it possible to evaluate team behavior rigorously and improve it systematically.

---

## Design Principles

This proposal follows several principles.

### 1. Separate correctness from quality

A team can satisfy its transition rules and still perform poorly. We must distinguish between:

- orchestration correctness
- task success
- workflow quality and efficiency

### 2. Prefer structured artifacts over ad hoc logs

A raw execution log is difficult to analyze and easy to misuse. We should emit structured team session artifacts that preserve the information needed for evaluation without relying on fragile transcript parsing.

### 3. Improve teams offline, not during live execution

Teams should not rewrite themselves during normal operation. Live self-modification makes debugging difficult, blurs responsibility, and makes regression analysis unreliable. Teams should improve through an offline review loop that generates proposals, which are then reviewed and versioned.

### 4. Optimize for quality first, then efficiency

A team is not better merely because it is cheaper or faster. Efficiency matters, but only after the team continues to meet quality and correctness requirements.

### 5. Keep evaluation aligned with my-pi architecture

The evaluation layer must respect the existing architecture:

- specialists remain narrow and typed
- teams remain state-machine-driven
- sequences remain higher-level orchestration units
- routing and contracts remain explicit
- versioning and governance remain first-class

---

## Three Levels of Team Testing

We should test teams at three distinct levels.

## 1. State-Machine Correctness

This level tests the deterministic orchestration layer. It asks whether the team transitions correctly under known conditions.

### What this level verifies

- valid transitions occur when expected
- invalid transitions are rejected
- terminal states are reached only under allowed conditions
- retry paths follow policy
- fail states trigger correctly
- guard conditions enforce preconditions
- unreachable states stay unreachable
- state transitions preserve required invariants

### Typical test style

These tests should look more like workflow-engine or compiler tests than model-quality tests. They should use controlled inputs and known specialist outputs to verify orchestration behavior.

### Example questions

- If the planner emits a complete plan, does the team move to the builder state?
- If the reviewer requests changes, does the team return to the correct corrective state?
- If a required artifact is missing, does the team terminate with the proper failure reason?
- If a retry limit is exceeded, does the state machine refuse another retry and enter a terminal escalation state?

### Acceptance criteria

A team passes this level when its state machine behaves exactly as its design specifies across both nominal and edge-case paths.

---

## 2. Contract-Level Task Success

This level tests whether the team actually fulfills its intended purpose on representative tasks.

A team can satisfy its transition rules and still fail to produce the right result. This level checks the team against its declared contract.

### What this level verifies

- required outputs are produced
- output structure matches the team contract
- required validation steps occur
- required evidence is attached
- the team terminates for the right reason
- the produced artifacts are usable by downstream consumers
- task success is not merely accidental or partial

### Typical test style

These tests should use representative task suites. Each suite should contain:

- straightforward tasks
- realistic tasks
- edge cases
- ambiguous tasks
- failure-inducing tasks
- tasks that should be declined or escalated

### Example questions

- Does the team produce both the implementation artifact and validation evidence?
- Does the team distinguish between "completed", "blocked", and "needs escalation"?
- Does the team preserve contract shape even when the task fails?
- Does the team avoid silently dropping required outputs?

### Acceptance criteria

A team passes this level when it reliably satisfies its declared purpose across a representative set of tasks.

---

## 3. Session Quality and Efficiency

This level evaluates how well the team reached its outcome.

A team may succeed but still waste time, tokens, transitions, or reviewer effort. This level focuses on workflow quality.

### What this level verifies

- unnecessary loops are rare
- repeated handoffs are justified
- the team avoids avoidable retries
- downstream specialists do not repeatedly catch predictable upstream mistakes
- token and latency cost remain reasonable relative to task class
- the observed path is close to an expected path for the task type
- review intensity matches task complexity

### Typical test style

These tests should compare execution traces and summary metrics across many sessions rather than only inspecting single outcomes.

### Example questions

- Did the team bounce between builder and reviewer more times than expected?
- Did the planner under-specify acceptance criteria, causing avoidable rework later?
- Did the tester run before the necessary context or artifacts were available?
- Did a simple task trigger an expensive full review path when a lighter path would have sufficed?

### Acceptance criteria

A team passes this level when it produces acceptable outcomes without persistent structural waste.

---

## Team Session Artifacts

To evaluate teams over time, each team session should be able to emit a structured artifact.

This artifact is not just a debug log. It is a durable record of what happened during a team session, why it happened, and how the session ended. It should support both manual review and automated analysis.

## Artifact goals

A team session artifact should:

- support replay and inspection of workflow behavior
- preserve transition logic and execution sequence
- expose useful summary metrics
- record outcome quality signals
- remain structured enough for batch analysis
- avoid retaining unnecessary raw context by default

## Suggested artifact name

**Team Session Artifact**

## Suggested schema

The exact schema remains open, but the artifact should include at least the following sections.

### 1. Session Metadata

- session id
- timestamp
- team name
- team version
- task category
- initiating route
- runtime or adapter identity
- starting state
- ending state
- termination reason

### 2. Task Summary

- normalized task description
- declared goal
- expected deliverables
- success criteria
- task difficulty or complexity estimate, if available
- task subclass label, if available

### 3. State Trace

- ordered list of visited states
- per-transition source and target state
- reason for each transition
- guard outcomes
- retry counts
- loop counters
- terminal condition reached

### 4. Specialist Invocation Summary

For each specialist call:

- specialist identity
- invocation order
- bounded input summary
- bounded output summary
- output contract status
- notable warnings or failure signals
- latency and token usage, if available

### 5. Artifacts Produced

- artifact type
- artifact identifier
- artifact status
- whether the artifact passed validation
- downstream consumer availability, if relevant

### 6. Validation and Review Signals

- validation steps executed
- pass/fail result for each validation step
- reviewer findings
- severity of findings
- whether the issues were corrected in-session
- whether the task required escalation

### 7. Outcome Summary

- final status
- success/failure/decline/escalation
- quality summary
- user-facing completion summary, if applicable
- whether human intervention occurred
- whether downstream correction was later required

### 8. Lightweight Metrics

- total steps
- total transitions
- per-state visit counts
- loop count
- retry count
- total latency
- per-specialist latency
- total token usage
- per-specialist token usage
- number of artifacts produced
- number of revisions
- cost estimate, if available

## Minimal artifact example

The schema below is illustrative only.

~~~json
{
  "session_id": "team-session-001",
  "timestamp": "2026-03-27T14:30:00Z",
  "team": {
    "name": "implementation_team",
    "version": "0.3.0"
  },
  "task": {
    "category": "code_change",
    "summary": "Implement a bounded parser update and attach validation evidence.",
    "expected_deliverables": [
      "patch",
      "validation_report"
    ],
    "success_criteria": [
      "patch applies cleanly",
      "tests pass",
      "report includes evidence"
    ]
  },
  "execution": {
    "starting_state": "plan",
    "ending_state": "complete",
    "termination_reason": "all deliverables produced and validated",
    "state_trace": [
      {
        "from": "plan",
        "to": "build",
        "reason": "planner emitted complete plan"
      },
      {
        "from": "build",
        "to": "review",
        "reason": "builder produced patch"
      },
      {
        "from": "review",
        "to": "test",
        "reason": "review passed"
      },
      {
        "from": "test",
        "to": "complete",
        "reason": "validation passed"
      }
    ]
  },
  "specialists": [
    {
      "name": "planner",
      "order": 1,
      "input_summary": "requested parser update with explicit validation requirement",
      "output_summary": "emitted plan with acceptance criteria",
      "contract_status": "valid"
    },
    {
      "name": "builder",
      "order": 2,
      "input_summary": "received approved plan",
      "output_summary": "produced patch",
      "contract_status": "valid"
    }
  ],
  "metrics": {
    "total_transitions": 4,
    "loop_count": 0,
    "retry_count": 0,
    "total_latency_ms": 41320,
    "total_tokens": 12840
  },
  "outcome": {
    "status": "success",
    "validation_passed": true,
    "human_intervention": false
  }
}
~~~

## Retention guidance

The session artifact should not become an uncontrolled dump of raw prompts and outputs. By default, the system should prefer:

- bounded summaries over raw full-context storage
- structured fields over free-form transcript blobs
- explicit metadata over inferred metadata
- task-appropriate retention over maximal retention

If raw transcript capture is ever added, it should be gated behind a deliberate debugging or audit mode.

---

## Team Evaluation Metrics

The first version of this system should use simple, interpretable metrics. The goal is not to invent perfect measures immediately. The goal is to establish enough signal to support comparison, diagnosis, and improvement.

## Core metrics

### Completion Rate

The fraction of sessions that reach an acceptable successful terminal state.

### Escalation Rate

The fraction of sessions that terminate by escalating to a human, supervisor, or higher-level system.

### Decline Rate

The fraction of sessions that intentionally refuse or decline work because the task falls outside team scope or violates policy.

### Loop Rate

The fraction of sessions containing repeated state patterns above a defined threshold.

### Retry Rate

The average number of retries per session, optionally broken down by state or specialist.

### Reviewer-Catch Rate

The rate at which downstream review identifies issues introduced earlier in the workflow.

This metric matters because a high reviewer-catch rate may indicate weak upstream planning, building, or validation.

### Rework Depth

The number of corrective transitions that occur after the team first appears to have produced a complete artifact.

### Cost per Successful Session

Average latency, token usage, and optionally monetary cost conditioned on eventual success.

### Average Transition Count

The mean number of transitions for a task class. This metric can reveal over-routing or excess process overhead.

### Path Efficiency

A comparison between the observed state path and an expected path for the task class.

This metric will be approximate at first. It does not need to be mathematically sophisticated to be useful.

## Metric interpretation guidance

Metrics should never be interpreted in isolation.

For example:

- lower cost is not an improvement if failure rate rises
- fewer reviews are not an improvement if defect rate rises
- faster completion is not an improvement if escalation rate rises
- lower transition count is not an improvement if the team is skipping necessary validation

The evaluation layer should treat quality-preserving efficiency gains as improvements and quality-reducing shortcuts as regressions.

---

## Batch Review and Critique

Once the system accumulates a meaningful number of session artifacts, it should support batch review.

The purpose of batch review is not to assign blame to individual specialists. The purpose is to detect **workflow-level patterns** that single-session inspection may miss.

## Proposed reviewer role

A future subsystem or specialized evaluator may serve as a:

- **Team Critic**
- **Workflow Auditor**
- **Team Evaluator**

This document uses **Team Critic** as the working term.

## Responsibilities of the Team Critic

The Team Critic should review batches of session artifacts and identify patterns such as:

- frequent failure states
- repeated loop structures
- wasteful transitions
- specialists invoked too early or too late
- overuse of expensive review paths
- missing guard conditions
- avoidable retries
- mismatch between task subclass and team path
- recurring downstream correction of upstream omissions

## Expected outputs

The Team Critic should not directly mutate live teams. It should produce structured recommendations such as:

- identified issue
- supporting evidence
- affected team version
- affected task class or subclass
- severity
- likely root cause
- proposed workflow change
- estimated tradeoff
- confidence level

## Review cadence

The exact review cadence is open, but the system may support rules such as:

- review after every N sessions
- review after a threshold number of failures
- review after a version rollout
- review on demand by a human operator

A small early default might be something like "review after 5 or 10 sessions" for experimental teams, then move to larger windows once the team stabilizes.

---

## Controlled Improvement Loop

The system should improve teams through a controlled, versioned process.

## Proposed loop

1. a team executes
2. the team emits a structured session artifact
3. session artifacts accumulate over time
4. the Team Critic reviews a batch of artifacts
5. the Team Critic generates recommendations
6. a human or controlled approval layer reviews the recommendations
7. the team definition or routing policy is updated
8. the updated team receives a new version
9. the new version is compared against prior versions using the same evaluation framework

## Why this loop is preferable

This loop preserves:

- debuggability
- version comparability
- human oversight
- rollback capability
- architectural discipline

It avoids the main risks of online self-modification:

- hidden drift
- hard-to-explain regressions
- loss of reproducibility
- unstable evaluation targets

## Improvement trigger candidates

The system may trigger a review when:

- failure rate crosses a threshold
- loop rate crosses a threshold
- reviewer-catch rate remains high across sessions
- a new team version rolls out
- a new task subclass appears frequently
- a human operator requests diagnosis

---

## Candidate Improvements the System May Recommend

The Team Critic should recommend **structural** or **policy-level** changes, not vague generic advice.

## Examples of plausible recommendations

### Transition and guard changes

- add a guard before entering the builder state
- block review until required artifacts exist
- route directly to escalation after a retry limit
- add a fast-fail terminal state for impossible tasks

### Contract changes

- require the planner to emit explicit acceptance criteria
- require a builder to produce an artifact manifest
- require the tester to emit structured validation evidence
- strengthen the output contract for a high-failure specialist

### Routing changes

- bypass a heavy review path for trivial edits
- add a lightweight path for low-risk tasks
- send certain failure classes directly to correction instead of full replanning
- split mixed task categories into narrower routing buckets

### Team structure changes

- split an overloaded team into two narrower teams
- separate planning-heavy tasks from validation-heavy tasks
- extract a recurring review pattern into a reusable sub-team
- retire a team path that sees low value and high cost

### Observability changes

- add a missing metric
- add a missing failure reason code
- record a task subclass label that is currently absent
- improve artifact summaries to support diagnosis

---

## Governance and Safety Constraints

This subsystem should remain tightly governed.

## Core constraints

### 1. No live self-rewrite during execution

A team session must not rewrite its own state machine or routing policy while it is running.

### 2. Recommendations are advisory until approved

The Team Critic may propose changes, but proposals do not become active automatically unless the system explicitly supports that path under clearly defined governance.

### 3. All changes must be versioned

Any update to:

- states
- transitions
- guards
- retry policies
- routing rules
- team contracts

must create a new versioned definition.

### 4. Evaluate new versions against old versions

A new version should not replace an old version on intuition alone. It should be compared on representative tasks using the three levels of testing.

### 5. Do not optimize efficiency in isolation

Any apparent efficiency gain that reduces correctness or quality is a regression.

### 6. Keep session artifacts bounded

Observability is valuable, but uncontrolled retention can make the system harder to maintain, harder to analyze, and more expensive to operate.

---

## Rollout Plan

This idea should enter the project gradually.

## Phase 1: Basic Team Session Artifacts

Introduce a minimal structured session artifact for team runs.

### Deliverables

- session metadata
- state trace
- outcome status
- lightweight metrics
- artifact summary

### Goal

Gain visibility into team behavior without changing workflow logic.

---

## Phase 2: Offline Analysis and Reporting

Add tooling to inspect batches of session artifacts.

### Deliverables

- artifact parser or loader
- summary reports
- simple aggregate metrics
- failure pattern analysis
- loop detection
- version-to-version comparisons

### Goal

Make team behavior measurable and comparable.

---

## Phase 3: Team Critic Prototype

Introduce a structured reviewer process that examines batches of session artifacts and produces recommendations.

### Deliverables

- critic prompt or evaluator logic
- recommendation schema
- evidence attachment format
- confidence and severity labels

### Goal

Turn observations into actionable proposals.

---

## Phase 4: Controlled Proposal Workflow

Connect recommendations to a governed improvement process.

### Deliverables

- proposal review process
- approval checkpoints
- version bump policy
- rollback policy
- experimental rollout path

### Goal

Allow measured change without sacrificing architectural stability.

---

## Phase 5: Comparative Evaluation Across Team Versions

Establish repeatable comparisons between team versions.

### Deliverables

- benchmark task sets
- before/after evaluation reports
- regression checks
- efficiency and quality comparison summaries

### Goal

Make team evolution evidence-based and reversible.

---

## Relationship to Existing Documentation

This design note should begin as a standalone document. It should not immediately modify foundational documents.

## Why this should start as a standalone note

- the idea is important but still evolving
- the implementation details remain open
- the concept spans testing, observability, governance, and future tooling
- the project foundation should remain stable and concise
- the implementation plan should not absorb every design discussion too early

## Likely future integration points

Once this design stabilizes, parts of it may move into:

- project doctrine around teams and observability
- implementation stages for session artifacts and evaluation tooling
- team-definition standards
- routing or governance documentation

At that point, the system can feather stable pieces into broader project documentation while preserving this file as the original design record.

---

## Suggested Near-Term Implementation Notes

These notes are intentionally practical rather than final.

### Start with artifacts, not automatic improvement

The first meaningful step is to make team sessions observable in a structured way. Improvement mechanisms should follow only after the artifacts are reliable.

### Prefer bounded summaries over full transcripts

A system that stores everything by default will become noisy and expensive. Start with concise, deliberate schema fields.

### Keep failure reasons explicit

The artifact should distinguish among:

- task failure
- contract violation
- policy refusal
- scope mismatch
- retry exhaustion
- missing artifact
- validation failure
- escalation

### Make version identity unavoidable

Every session artifact should record the precise team version used. Otherwise later comparisons will become ambiguous.

### Keep metrics simple at first

A small set of good metrics is more valuable than a large set of weakly defined metrics.

---

## Open Questions and Ambiguities

The following questions remain open. They should stay in this document until the project resolves them.

## Artifact schema questions

1. How much of each specialist invocation should the artifact retain by default?
2. Should the artifact store bounded summaries only, or support optional raw transcript capture behind a debug flag?
3. What is the right balance between human readability and machine-readability in the artifact schema?
4. Should artifacts be emitted as JSON only, or should the system also support a human-oriented summary form?

## Evaluation questions

5. What is the minimum number of sessions required before batch review becomes meaningful?
6. Should all teams use the same core metrics, or should some metrics be team-specific?
7. How should path efficiency be defined for teams with multiple legitimate workflows?
8. How should the system weight quality, latency, cost, and transition count when they point in different directions?

## Task classification questions

9. Should teams label task subclasses during execution, or should that labeling happen before routing?
10. How granular should task categories and subclasses become before they stop helping evaluation?
11. How should the system handle tasks that blend categories and legitimately require multiple workflow shapes?

## Governance questions

12. Who or what approves recommended team changes?
13. Should the project allow any automatic approval path for low-risk recommendations, or should all structural changes require explicit human review?
14. How should rollback work when a new team version improves one metric but harms another?

## Merlin and cross-layer questions

15. At what point should Merlin consume team-session-level signals from my-pi?
16. Should Merlin only observe aggregate metrics, or should it also have access to individual session summaries?
17. Where should the boundary remain between my-pi workflow evaluation and Merlin-level orchestration evaluation?

## Storage and retention questions

18. How long should session artifacts be retained?
19. Should retention policy differ between successful and failed sessions?
20. What data should be redacted or omitted to keep artifacts bounded and safe to analyze?

## Product and usability questions

21. Should users ever see a human-readable summary of a team session?
22. Should developers have a dashboard view for team health?
23. How should the system communicate that a team is improving over versions without implying false certainty?

---

## Non-Goals

This proposal does **not** aim to do the following.

### 1. It is not a plan for unrestricted self-modifying teams

The goal is controlled, evidence-based improvement, not autonomous mutation during live execution.

### 2. It is not a replacement for specialist-level testing

Specialists still require their own unit tests, contract tests, and evaluation workflows.

### 3. It is not a generic logging framework for every runtime event

The focus here is team-level observability and evaluation, not exhaustive system telemetry.

### 4. It is not an optimization scheme for token cost alone

Efficiency matters, but only alongside correctness and quality.

### 5. It is not a requirement that every team immediately support full evaluation

This system should roll out gradually. Early teams may emit minimal artifacts before richer analysis exists.

### 6. It is not a substitute for architectural judgment

Metrics and critique can guide improvement, but they do not replace careful design decisions.

---

## Initial Recommendation

The project should adopt the following order of operations:

1. define a minimal Team Session Artifact schema
2. emit artifacts for team runs
3. build simple offline analysis over collected artifacts
4. define a Team Critic that reviews batches of artifacts
5. generate controlled recommendations for workflow changes
6. version and compare team updates using the same three levels of testing

This order keeps the system measurable, debuggable, and aligned with my-pi's architectural ethos.

---

## Summary

Teams introduce a new layer of behavior that specialist-level tests cannot fully capture. Because my-pi models teams as explicit state machines, the project can evaluate them systematically.

The core proposal is straightforward:

- test teams at three levels
- emit structured team session artifacts
- analyze artifacts across many runs
- review patterns offline
- improve teams through a controlled, versioned loop

This gives my-pi a path toward evidence-driven workflow improvement without sacrificing clarity, stability, or architectural discipline.