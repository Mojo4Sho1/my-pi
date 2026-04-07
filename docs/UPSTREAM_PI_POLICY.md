# UPSTREAM_PI_POLICY.md

## Purpose

This document defines how `my-pi` tracks the upstream Pi project, how upgrade decisions are made, what must be reviewed before updating, and what evidence is required before an update is accepted.

The goal is to prevent accidental breakage from upstream Pi changes while still benefiting from fixes and features that materially improve `my-pi`.

This is a governance document, not a changelog.

---

## Current Context

`my-pi` currently depends on Pi as an upstream runtime and extension substrate.

At the time of writing, the key coupling points are:

- `package.json` depends on `@mariozechner/pi-coding-agent`.
- `package.json` uses the `pi` manifest to declare package resources.
- `my-pi` extensions depend on Pi extension APIs and lifecycle behavior.
- `my-pi` spawns the `pi` CLI for specialist sub-agent execution.
- Current integration coverage includes mocked subprocess-based tests, not live spawned Pi sub-agent runs.

Because of this, Pi updates are **not** treated as routine dependency bumps. They are treated as **upstream compatibility reviews**.

---

## Policy Summary

`my-pi` does **not** automatically track the newest Pi release.

Instead:

1. `my-pi` stays pinned to a known-good Pi version line.
2. Upstream Pi is reviewed on a defined cadence and at specific trigger points.
3. Each review produces a written assessment artifact.
4. Pi is updated only when the expected value exceeds the migration and validation cost.
5. Pi upgrades must be validated against the `my-pi` surfaces that are actually coupled to upstream behavior.

---

## Guiding Principles

### 1. Stability over novelty

A new Pi release is not sufficient justification to update.

Updates should be adopted when they provide one or more of the following:

- a bug fix that affects a surface used by `my-pi`
- a new capability that simplifies or strengthens `my-pi`
- a security, correctness, or reliability improvement that matters in practice
- a compatibility need driven by future `my-pi` work

### 2. Minor-line jumps are explicit decisions

Because Pi is still in `0.x`, moving across minor lines is treated as a meaningful compatibility event.

Examples:

- `0.62.x -> 0.63.x`
- `0.63.x -> 0.64.x`
- `0.64.x -> 0.65.x`

Each minor-line jump requires an explicit review and recommendation.

### 3. Local evidence beats assumptions

Upgrade decisions must be based on:

- upstream changelog review
- inspection of relevant upstream source behavior
- inspection of `my-pi` coupling points
- validation against real `my-pi` execution paths

### 4. Do not upgrade on faith

If the review cannot explain why the update is safe, useful, and testable, the default decision is to defer.

---

## Review Triggers

An upstream Pi review should happen when any of the following occurs.

### Required triggers

- A new upstream **minor** release is published.
- A new upstream **patch** release touches a surface used by `my-pi`.
- `my-pi` work begins that would benefit from newer Pi capabilities.
- A bug or odd behavior appears in `my-pi` that may be caused by upstream Pi behavior.
- `my-pi` is more than one minor line behind Pi.

### Scheduled trigger

Even if no upgrade is planned, review upstream Pi on a recurring cadence:

- **default cadence:** once per month
- **active development cadence:** once per milestone if milestone work is Pi-adjacent

---

## Where to Look During Review

Every review must inspect the following upstream materials.

### Mandatory upstream inputs

- Pi coding-agent changelog
- Pi package documentation
- Pi extension loader and package/resource loading behavior when relevant
- Pi CLI behavior when `my-pi` uses spawned `pi` processes
- Pi extension API and lifecycle/event behavior when relevant

### Suggested upstream references

- `packages/coding-agent/CHANGELOG.md`
- `packages/coding-agent/docs/packages.md`
- extension loader source
- package/resource manager source
- CLI arg parsing or non-interactive execution paths when needed

---

## `my-pi` Coupling Surfaces

The review must classify upstream changes against the actual `my-pi` surfaces that depend on Pi.

### Tier 1 — High-risk coupling surfaces

These must always be reviewed first.

#### A. Spawned `pi` subprocess behavior

Examples:

- CLI flags
- positional argument behavior
- non-interactive mode
- JSON mode
- print mode
- shutdown semantics
- stderr handling
- cancellation / timeout behavior

Reason:
`my-pi` uses spawned Pi subprocesses for specialist execution, so CLI and non-interactive runtime changes can directly break orchestration.

#### B. Extension lifecycle and context APIs

Examples:

- session lifecycle events
- event payload changes
- extension context shape
- cancellation support
- tool registration semantics
- hook behavior

Reason:
`my-pi` is extension-centric, so changes here can silently break behavior even if TypeScript still compiles.

#### C. Package/resource loading behavior

Examples:

- `package.json` `pi` manifest semantics
- extension entry resolution
- skills / prompts / themes loading
- precedence rules
- deduplication
- discovered vs explicit resources

Reason:
`my-pi` is packaged as a Pi package and depends on predictable resource loading.

### Tier 2 — Medium-risk coupling surfaces

Review these when changelog entries touch them.

- model registry APIs
- auth/header resolution
- resource provenance metadata
- command/tool metadata shape
- SDK session APIs
- runtime/session replacement APIs

### Tier 3 — Lower-priority surfaces

Usually informational unless `my-pi` adopts them.

- interactive TUI changes
- slash-command UI details
- provider catalog additions
- theme UX changes not used by `my-pi`

---

## Upgrade Decision Categories

Every review ends in exactly one of the following decisions.

### 1. Update now

Use this when:

- the upstream changes materially help `my-pi`
- no high-risk breakage is expected
- required compatibility changes are small and well understood
- validation cost is acceptable now

### 2. Update on a branch

Use this when:

- the update looks beneficial
- one or more high-risk surfaces are affected
- migration work is required
- a live validation pass is needed before merge

This is the expected default for most minor-line jumps.

### 3. Defer

Use this when:

- the release does not meaningfully benefit `my-pi`
- migration cost is not justified
- the review cannot establish enough confidence
- `my-pi` is in a phase where upstream churn would distract from core work

### 4. Freeze temporarily

Use this when:

- `my-pi` is in a stabilization phase
- a release deadline, demo, or milestone makes upstream movement too risky
- multiple upstream changes need to settle before reassessment

A freeze is not permanent abandonment. It is a deliberate pause.

---

## Decision Rubric

Use the rubric below during every review.

### Strong reasons to update

- fixes a bug in JSON / print / subprocess behavior used by `my-pi`
- fixes extension loading, startup loading, or resource precedence behavior relevant to `my-pi`
- adds extension capability that simplifies current `my-pi` code
- fixes a reliability issue that affects orchestrated sub-agent runs
- resolves a known upstream bug already impacting `my-pi`

### Strong reasons to defer

- breaking changes touch CLI, session lifecycle, extension APIs, or package loading
- required migration work is not yet scoped
- test coverage is insufficient to validate the risky surfaces
- the release value is mostly unrelated to `my-pi`

### Additional weighting questions

When in doubt, answer these:

1. Does this release change a Tier 1 coupling surface?
2. Does `my-pi` already rely on that surface in production code?
3. Would current tests definitely catch a break here?
4. Is there a concrete gain from updating now?
5. Can the required migration be stated clearly before touching the dependency?

If questions 1 and 2 are yes, and question 3 is no, default to **branch-only evaluation** or **defer**.

---

## Required Review Procedure

Each upstream review must follow this order.

### Step 1 — Record current state

Capture:

- current `my-pi` Pi dependency version
- latest upstream Pi version
- version gap summary
- date of review
- reviewer identity

### Step 2 — Read upstream changelog across the full gap

Do not review only the newest release.

Review every version between the currently used Pi version and the latest candidate version.

For each release, extract:

- breaking changes
- migration notes
- added features relevant to `my-pi`
- fixed items relevant to `my-pi`

### Step 3 — Map upstream changes to `my-pi` surfaces

For each extracted item, classify impact on:

- subprocess / CLI behavior
- extension API / lifecycle
- package/resource loading
- model / auth APIs
- runtime/session APIs
- other

Then identify the `my-pi` files or modules likely affected.

### Step 4 — Score risk

Assign a risk level:

- **Low** — no Tier 1 surfaces touched; value is clear
- **Medium** — one Tier 1 surface touched or medium migration work expected
- **High** — multiple Tier 1 surfaces touched, unclear migration, or inadequate validation coverage

### Step 5 — State the recommendation

Choose one:

- update now
- update on a branch
- defer
- freeze temporarily

### Step 6 — Define required migration work

List the exact items that must be changed before updating.

Examples:

- CLI flag changes
- event name migrations
- extension context changes
- package loading assumptions
- provenance field renames
- session API changes

### Step 7 — Define validation gates

List the tests and manual checks required before merge.

At minimum, if subprocess behavior is involved, include a **live spawned Pi smoke test**.

---

## Validation Requirements

### Minimum required before accepting an upgrade

Every Pi upgrade must satisfy all applicable checks.

#### Always required

- `my-pi` TypeScript compiles cleanly
- existing automated tests pass
- dependency install is reproducible
- package resource declarations still resolve correctly

#### Required when Tier 1 surfaces are touched

##### If subprocess / CLI behavior changed
- run at least one live spawned specialist sub-agent smoke test
- verify JSON output parsing still works
- verify final assistant text extraction still works
- verify stderr capture still works
- verify timeout and cancellation behavior still works

##### If extension lifecycle or context changed
- verify extension registration still works
- verify affected lifecycle hooks still fire
- verify event payload assumptions still hold
- verify extension context assumptions still hold

##### If package/resource loading changed
- verify explicit `pi.extensions` entries still resolve correctly
- verify skills/prompts/themes still load from package manifest
- verify no duplicate extension loading
- verify precedence rules do not shadow `my-pi` resources unexpectedly

### Recommended future validation additions

The following should exist long-term because current coverage is not enough for confident upstream upgrades:

- live subprocess integration tests
- smoke test for orchestrator spawning at least one real specialist run
- smoke test for package loading from `package.json` `pi` entries
- smoke test for startup loading of extensions / skills / prompts / themes

---

## Required Upgrade Artifact

Every upstream review must produce a written artifact.

Suggested path:

- `docs/upstream-reviews/pi/YYYY-MM-DD-pi-review.md`

### Required artifact contents

The artifact must include these sections.

#### 1. Review metadata
- date
- reviewer
- current `my-pi` Pi version
- candidate Pi version
- version gap

#### 2. Relevant upstream changes
Only include changes relevant to `my-pi`.

#### 3. `my-pi` surfaces likely affected
List files, modules, or behaviors.

#### 4. Risk assessment
Use `low`, `medium`, or `high`, with explanation.

#### 5. Recommendation
One of:
- update now
- update on a branch
- defer
- freeze temporarily

#### 6. Required migration work
Concrete checklist.

#### 7. Validation plan
Exact tests and manual checks.

#### 8. Confidence and unknowns
State what is known, what is inferred, and what remains unverified.

---

## Artifact Template

Use this template for every upstream Pi review.

```md
# Pi Upstream Review — YYYY-MM-DD

## Metadata
- Reviewer:
- Current `my-pi` Pi version:
- Candidate Pi version:
- Version gap:
- Decision status:

## Executive Summary
- Recommendation:
- Risk:
- Why:

## Relevant Upstream Changes
### Breaking changes
- ...

### Additions worth adopting
- ...

### Fixes relevant to `my-pi`
- ...

## `my-pi` Surfaces Affected
- `path/to/file`
- behavior:
- why it matters:

## Required Migration Work
- [ ] ...
- [ ] ...
- [ ] ...

## Validation Plan
- [ ] TypeScript compile
- [ ] Full automated tests
- [ ] Live spawned specialist smoke test
- [ ] Package resource loading check
- [ ] Manual review of affected behavior

## Recommendation
### Decision
- Update now / Update on a branch / Defer / Freeze temporarily

### Rationale
- ...

## Confidence and Unknowns
- Confidence:
- Unknowns:
```

---

## Automation Goal

Long-term, an agent should be able to generate the upgrade artifact automatically.

The automation should **not** auto-upgrade Pi by default.

Its job is to produce a reviewable assessment artifact.

### Automation inputs

- `my-pi/package.json`
- relevant `my-pi` source files
- relevant `my-pi` tests
- Pi changelog
- Pi package docs
- Pi loader / package / CLI sources when needed

### Automation outputs

- version gap summary
- extracted relevant upstream changes
- impact mapping to `my-pi`
- risk rating
- recommendation
- migration checklist
- validation checklist
- unresolved unknowns

### Automation rules

The agent must:

1. Determine the current pinned Pi version in `my-pi`.
2. Determine the latest upstream Pi version under review.
3. Read the full changelog across the version gap.
4. Ignore unrelated upstream churn.
5. Prioritize Tier 1 surfaces.
6. Identify `my-pi` files likely affected.
7. Produce a written artifact.
8. Refuse to say “safe to upgrade” unless the evidence supports it.

### Minimum evidence required for an automated “update recommended” assessment

The automation must not recommend updating unless it has all of the following:

- changelog coverage across the entire version gap
- explicit mapping from upstream changes to `my-pi` surfaces
- identified migration items for all touched Tier 1 surfaces
- a validation plan that includes live smoke testing when subprocess or non-interactive behavior is involved

---

## When `my-pi` Should Reduce Upstream Dependence

`my-pi` should continue tracking Pi intentionally until Pi is behind a stable compatibility boundary.

That boundary exists only when all of the following are true:

- subprocess launching is wrapped by a stable local adapter
- CLI assumptions are centralized
- lifecycle/event assumptions are centralized
- package/resource loading assumptions are documented and insulated
- updates can be evaluated by changing a small, well-defined compatibility layer instead of multiple core modules

At that point, `my-pi` may move from **active upstream tracking** to **selective maintenance mode**.

Selective maintenance mode means:

- review less often
- update only for high-value fixes or security/correctness reasons
- avoid churn that does not materially improve `my-pi`

This is the point where `my-pi` becomes operationally independent enough that Pi no longer dictates routine maintenance priorities.

---

## Current Default Posture for `my-pi`

Until the compatibility boundary described above exists, `my-pi` should use this default posture:

- stay on a known-good pinned Pi version line
- review upstream Pi on schedule and on trigger events
- prefer branch-based evaluation for minor-line jumps
- require written upgrade artifacts
- require live validation for subprocess-sensitive changes
- defer updates that do not clearly benefit `my-pi`

---

## Maintenance Rules for This Policy Document

Update this document when any of the following changes:

- `my-pi` changes how it depends on Pi
- new Tier 1 coupling surfaces appear
- the upgrade artifact format proves insufficient
- automation capabilities become more concrete
- `my-pi` reaches a genuine compatibility boundary and changes tracking posture

This document should be reviewed whenever the upstream review workflow itself changes.

---

## References

- `my-pi/package.json`
- `my-pi/STATUS.md`
- `my-pi/extensions/shared/subprocess.ts`
- `pi-mono/packages/coding-agent/CHANGELOG.md`
- `pi-mono/packages/coding-agent/docs/packages.md`

Recommended artifact location:

- `docs/UPSTREAM_PI_POLICY.md`
```