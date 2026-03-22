# CONTRACT.md

## Purpose

Define the current template model for this repository.

## Template classes

### Resource templates

Generate reusable template content for resource-specific outputs.

Current resource template directories are:
- `templates/extension/`
- `templates/prompt/`
- `templates/skill/`
- `templates/theme/`

## Seed distinction

Seeds are bootstrap context packs.
Templates are generation recipes.
A template may generate seed artifacts, but templates and seeds remain distinct concepts.

## Directory model

- `templates/extension/` for extension templates
- `templates/prompt/` for prompt templates
- `templates/skill/` for skill templates
- `templates/theme/` for theme templates
- `templates/CONTRACT.md` as the authoritative contract
- `templates/_TEMPLATES_INDEX.md` as routing entrypoint

## Placeholder/token strategy

Templates should use explicit, readable placeholders (for example, `{{PROJECT_NAME}}`) and avoid implicit magic substitutions.

## Output-path expectations

Templates should declare expected output paths relative to repository root and avoid writing outside intended subtrees.

## Update rule

Update this contract when template classes, token strategy, or output-path policy materially changes.
