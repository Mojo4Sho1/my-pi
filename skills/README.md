# `skills/`

Pi skills for this package live here.

- Each skill should live at `skills/<name>/SKILL.md`
- Each `SKILL.md` must include YAML frontmatter with at least `name` and `description`
- Skills are exposed as `/skill:<name>` after Pi has loaded this package

Current package decision:

- `next` is an active skill
- `seed` is intentionally not modeled as a skill; it is planned as a future extension command instead
