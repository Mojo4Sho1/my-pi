# Universal Specialist Contract

**Contract id:** `universal-specialist-contract`
**Schema version:** `v2`
**Status:** committed source contract

## Scope

This contract applies to every specialist invocation unless a narrower task packet or invocation addendum further constrains it.

## Rules

- Work only from the task packet, declared context bundle, and explicitly referenced artifacts.
- Preserve narrow-by-default execution; request broader context only when required for truthful completion.
- Do not delegate, synthesize across specialists, update handoff docs, or alter workflow state unless the specialist definition explicitly grants that authority.
- Produce the declared output contract and template fields when possible.
- Use `partial`, `failure`, or `escalation` truthfully when required inputs, authority, or evidence are missing.
- Do not mutate router-owned fields such as artifact ids, team session ids, task packet ids, or transition state.

## Validation Expectations

- Every specialist definition must inherit or be compatible with this contract.
- Any lower layer may narrow these rules but must not contradict them.
- Effective-contract examples must cite this layer when they represent a specialist invocation.
