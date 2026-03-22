# CANONICAL_DECISIONS.md

Durable canonical decisions that should not be re-inferred in later sessions.

These decisions remain in force until an explicit superseding decision is recorded in `DECISION_LOG.md`.

## Decisions

1. **Behavioral steering field is `working_style`**, not `persona`. Keeps steering implementation-oriented.

2. **`working_style` required for specialists**, optional for other agent classes until formally upgraded.

3. **Live state owned by `STATUS.md`** (single live-state control plane prevents drift).

4. **`docs/PROJECT_FOUNDATION.md` is stable architecture only**, not a live state source.

5. **Top-level `skills/` and `prompts/` are first-class package areas**, matching package config.

6. **Template contract/index must match actual structure**, not an unimplemented taxonomy.

7. **Phase transition to primitive implementation confirmed** after documentation stabilization.

8. **Initial specialist set fixed to planner, reviewer, builder, tester.** Minimum roles to prove the team abstraction.

9. **Canonical project foundation path is `docs/PROJECT_FOUNDATION.md`.**

10. **Startup flow: `AGENTS.md` (auto-read) → `INDEX.md`** (universal routing entrypoint).

11. **Only orchestrator-class actors have broad default routing.** Downstream actors are narrow by default.

12. **Extension-powered orchestration.** Build TypeScript Pi extensions implementing orchestrator/specialist routing as sub-agents with packet-based delegation and state-machine routing. Contracts and packet validation implemented in TypeScript types and runtime validation. Markdown agent definitions remain as specs that extensions implement. (2026-03-21)
