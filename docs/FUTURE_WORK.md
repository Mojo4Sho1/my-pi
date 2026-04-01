# FUTURE_WORK.md

Deferred ideas and evolution paths. These concepts are architecturally sound but premature for current implementation stages. Each entry includes a "revisit when" trigger so the project knows when to bring them back.

Source design documents are archived in `docs/archive/design/`.

---

## Team Critic / Batch Review

A specialized evaluator that reviews batches of team session artifacts (from Stage 4d) and identifies workflow-level patterns: frequent failure states, wasteful transitions, repeated loops, overuse of expensive review paths, avoidable retries, recurring downstream correction of upstream omissions.

The Team Critic produces structured recommendations (not direct mutations) — identified issue, supporting evidence, affected team version, severity, proposed workflow change, estimated tradeoff, confidence level.

**Source:** `docs/archive/design/TEAM_EVALUATION_AND_IMPROVEMENT.md`, "Batch Review and Critique" and "Proposed reviewer role" sections.

**Revisit when:** Teams are producing session artifacts at volume (10+ sessions per team) and there's enough data to detect meaningful patterns.

---

## Controlled Team Improvement Loop

A versioned, governed process for improving teams based on Team Critic recommendations:

1. Team executes and emits session artifacts
2. Artifacts accumulate
3. Team Critic reviews a batch and generates recommendations
4. Human or approval layer reviews recommendations
5. Team definition is updated with a new version
6. New version is compared against prior versions using the three-level testing framework (4c)

Key constraints: no live self-rewrite during execution, all changes versioned, new versions evaluated against old versions on representative tasks, efficiency gains that reduce quality are regressions.

**Source:** `docs/archive/design/TEAM_EVALUATION_AND_IMPROVEMENT.md`, "Controlled Improvement Loop" and "Governance and Safety Constraints" sections.

**Revisit when:** Team Critic is operational and producing actionable recommendations.

---

## Campaign Supervisor

An automated, segment-scoped supervisor that manages execution of approved campaign plans. The supervisor launches fresh stage executors, evaluates handoff packages, decides whether to advance/retry/pause/escalate, and produces checkpoint packages at segment boundaries.

The campaign supervisor is intentionally segment-scoped (not campaign-global) and uses a relay model: fresh supervisor for each segment, fresh executor for each stage, continuity through repo artifacts.

**Source:** `docs/archive/design/SEGMENT_SUPERVISION_AND_EPISODIC_EXECUTION.md`, "Campaign Supervisor" and "Execution Model" sections.

**Revisit when:** Sequences (Stage 5d) are proven and there's demand for multi-segment autonomous execution beyond what `/plan` and `/next` commands provide.

---

## Feasibility / Plan-Shaping Team

A team that transforms a campaign plan into an execution-ready structure: stress-testing realism, identifying missing dependencies, breaking work into stages, determining specification needs, shaping stage contracts, defining checkpoint boundaries, identifying risky or ambiguous work.

This team prepares campaigns for execution but does not implement them.

**Source:** `docs/archive/design/SEGMENT_SUPERVISION_AND_EPISODIC_EXECUTION.md`, "Feasibility / Plan-Shaping Team" section.

**Revisit when:** Campaign supervision exists and there's a concrete need for automated plan decomposition.

---

## Automated Packet-Level Review Gates

Mandatory compliance and quality checks after every fine-grained task packet, with automated rework routing. Compliance review checks contract satisfaction before quality review evaluates implementation soundness.

The current architecture handles this through the reviewer and critic specialists within team state machines. Automated review gates would formalize this as a separate execution discipline within stage execution.

**Source:** `docs/archive/design/TASK_PACKETS_REVIEW_GATES_AND_WORKSPACE_ISOLATION.md`, "Review Gate Model" and "Compliance Review" / "Quality Review" sections.

**Revisit when:** The reviewer/critic compliance-vs-quality split (Stage 5a) is proven in practice and there's evidence that the current team-based review flow is insufficient for fine-grained task execution.

---

## Workspace Isolation Automation

Automated segment branching, workspace finalization status (ready for next packet / ready for merge / hold / discard), and branch readiness determination. The default model is one branch per campaign segment with structured finalization artifacts.

**Source:** `docs/archive/design/TASK_PACKETS_REVIEW_GATES_AND_WORKSPACE_ISOLATION.md`, "Workspace Isolation Model" and "Completion and Finalization" sections.

**Revisit when:** Sequence execution (Stage 5d) is operational and there's demand for automated branch management beyond manual git workflows.

---

## Merlin Integration Points

Design checkpoint packages for Merlin consumption, enable cross-campaign continuity, align terminology between my-pi execution-side and Merlin control-plane vocabularies. my-pi should return structured checkpoint packages that Merlin can use for long-horizon supervision.

**Source:** `docs/archive/design/SEGMENT_SUPERVISION_AND_EPISODIC_EXECUTION.md`, "Relationship to Merlin" section.

**Revisit when:** Merlin exists as a concrete system with defined interfaces.

---

## Hashline Editing Extension

An editing-substrate experiment that provides hashline-based file editing as a separate PI extension, orthogonal to the orchestration layer. PI allows extensions to override built-in tools (`read`, `edit`, `grep`) by registering tools with the same names, or to run with `--no-tools` and provide extension-owned implementations. This means hashline editing can be tested as a separate extension beneath `my-pi` rather than as a rewrite of the orchestrator.

Key constraints: do not add hashline logic to the orchestrator, do not make it part of the orchestration milestone, test on a dedicated branch as an editing-substrate extension, adopt only if it clearly improves edit reliability for the chosen model mix.

Proposed ownership: `extensions/hashline-tools/` (short term) or an external companion package.

**Source:** `docs/archive/design/design_doc.md`, Section 5.1.

**Revisit when:** The core workflow substrate (through Stage 5a at minimum) is stable and there's a concrete need to improve edit reliability for the chosen model mix. Should be evaluated with explicit comparative testing on the actual `my-pi` model/tool stack, not just by proxy from external benchmarks.

---

## Isolated Execution Environments

Running specialists or entire teams in isolated backends (e.g., sandboxed workspaces, separate branches) with explicit merge behavior. Applies at two levels:

1. **Specialist-level isolation** — an individual specialist executes in its own sandbox, merging results back on success.
2. **Team-level isolation** — the team as an opaque unit operates in its own sandbox. Since teams already present an opaque interface (send TaskPacket in, get ResultPacket out), isolating the entire team preserves that abstraction cleanly. Results are merged only on successful team completion.

Should be introduced as an **execution backend abstraction**, not as ad-hoc per-specialist or per-team behavior. The abstraction should work uniformly across both levels.

**Source:** `docs/archive/design/design_doc.md`, Section 5.2.

**Revisit when:** Routing and contracts are solidified (through Stage 5a at minimum) and there's demand for stronger execution isolation at either the specialist or team level. The current architecture benefits more from stronger contracts, observability, and routing clarity than from infrastructure-heavy isolation layers.

---

## Executor Resumption Checkpoint

A lightweight, overwrite-only checkpoint file that an active executor maintains during campaign segment execution. Provides a safety net for ungraceful exits (rate limits, disconnects, crashes) — if the session dies mid-segment, the next executor reads the checkpoint and resumes rather than restarting from scratch.

**Location:** `.pi/checkpoint.md` at the project root (gitignored). The `.pi/` directory is model-agnostic — this is a my-pi orchestrator concern, not tied to any specific LLM provider. The `.pi/` directory also provides a natural home for other runtime artifacts if needed later.

**Design properties:**
- **Overwritten, never appended** — always reflects current execution state, never accumulates stale observations. Avoids the staleness and noise problems of persistent memory files.
- **Deleted on successful segment completion** — if the file exists, the previous session exited ungracefully. The next executor treats this as a recovery scenario.
- **Minimal content** — just enough to resume: current segment ID, completed steps, in-flight step, remaining steps, blockers encountered. Target 10–20 lines, not a knowledge base.
- **Not a substitute for handoff packages** — handoff packages (Stage 5d) are the structured artifacts produced at clean campaign checkpoints. The resumption checkpoint is strictly a crash-recovery mechanism for mid-segment interruptions.

**Why not a memory file:** A persistent memory file accumulates cross-session knowledge, which goes stale and creates a token tax. The checkpoint is ephemeral by design — it exists only during active execution and is cleaned up when no longer needed. Cross-cutting project knowledge belongs in repo artifacts (CLAUDE.md, code comments, decision log), not in ambient memory.

**Revisit when:** First real multi-session campaign execution (sequence-level, Stage 5d+). The checkpoint mechanism needs to be tested against real ungraceful exits to determine optimal write frequency and content structure.
