# Test Artifact Template

**Template id:** `test-artifact`
**Schema version:** `v2`
**Artifact kind:** `output_template`
**Artifact type:** `test`

## Required Fields

- `testStrategy`: bounded strategy for the assigned behavior.
- `testCasesAuthored`: tests or fixtures created or revised.
- `executionCommands`: commands the builder should run or has run, depending on state.
- `expectedPassConditions`: explicit pass conditions.
- `coverageNotes`: known coverage and gap notes.

## Optional Fields

- `testExecutionResults`: results when execution is in scope.

## Format Rules

- Frame tests as authored artifacts, not generic validation ownership.
- Keep production-code changes out of scope unless explicitly authorized.

## Validation Expectations

- Authored tests must trace to acceptance criteria or target behavior.
