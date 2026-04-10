# 0002_LAYERED_CONTEXT_INITIALIZATION.md

## Context

`my-pi` increasingly relies on fresh-context execution, narrow specialists, contract-driven routing, machine-first artifacts, and index-first document access. Those pieces all push toward the same need: fresh agents should load the right context for their role and current step instead of browsing broadly and implicitly.

The repo had already exposed the failure modes:

- agents over-read dense planning material
- stable reference docs and current-run artifacts are not always distinguished clearly
- onboarding remains too dependent on ad hoc file reading
- future specialists and teams risk inheriting inconsistent startup behavior

Alternatives considered:

- a flat "read everything that might matter" model, which increases token waste and noise
- immediate strict automated onboarding bundles, which is premature before the manifest structure is durable
- continuing with ad hoc prompting, which keeps onboarding implicit and harder to reason about

## Decision

Adopt layered context initialization as a first-class architectural rule for `my-pi`.

This means:

- fresh agents should reason through five conceptual layers, L0 through L4
- index-first routing is the normal Layer 1 mechanism
- the orchestrator has broader but still bounded onboarding
- specialists remain narrow by default and should receive current context through packets and validated artifacts
- stable reference material and run-specific working artifacts are distinct and should stay structurally and conceptually separate
- future onboarding manifests and policy files, when added, should live under `specs/` rather than a new config root

This ADR is a durable documentation and conventions rollout. It does not claim automated onboarding bundle assembly or runtime manifest loading in the current implementation pass.

The durable reference for the model is `docs/LAYERED_ONBOARDING.md`. The canonical decision ledger entry is `DECISION_LOG.md` Decision #44.

## Consequences

Positive:

- fresh-agent startup becomes more deterministic
- default token spend stays lower because broad reads become less normal
- the repo's narrow-context architecture is reinforced in durable docs
- future seeds, policies, and onboarding manifests now have a clearer target model

Tradeoffs:

- more routing and conventions docs must be maintained
- authors must keep the stable-reference versus working-artifact distinction truthful
- some future automation is intentionally deferred until the structure stabilizes

Governance:

- `DECISION_LOG.md` remains the canonical active/superseded decision ledger
- `docs/LAYERED_ONBOARDING.md` is the durable operational reference for the model
- the design proposal remains at `docs/design/onboarding_layed_context.md` until a later archival pass
