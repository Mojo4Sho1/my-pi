# CONTRACT.md

## Purpose

Define the current template model for this repository.

## Template classes

### Artifact templates

Generate a single artifact (for example, one document or one definition file).

### Bundle templates

Generate a coordinated set of artifacts for a repeatable workflow.

## Seed distinction

Seeds are bootstrap context packs.
Templates are generation recipes.
A template may generate seed artifacts, but templates and seeds remain distinct concepts.

## Directory model

- `templates/artifacts/` for single-artifact templates
- `templates/bundles/` for bundle templates
- `templates/CONTRACT.md` as the authoritative contract
- `templates/_TEMPLATES_INDEX.md` as routing entrypoint

## Bundle expectations

A bundle template should define its output set, expected order of generation, and minimal validation expectations.

## Placeholder/token strategy

Templates should use explicit, readable placeholders (for example, `{{PROJECT_NAME}}`) and avoid implicit magic substitutions.

## Output-path expectations

Templates should declare expected output paths relative to repository root and avoid writing outside intended subtrees.

## Update rule

Update this contract when template classes, token strategy, or output-path policy materially changes.
