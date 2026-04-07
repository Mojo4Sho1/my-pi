# my-pi

My custom Pi package for extension-powered orchestration, package-local skills, and related tooling.

Current implementation includes orchestrator-driven specialist/team execution plus artifact-backed dashboard observability with a persistent session widget.

Additional repo guidance lives in the docs set:

- [`docs/IMPLEMENTATION_PLAN.md`](/Users/josephcaldwell/Documents/dev/my-pi/docs/IMPLEMENTATION_PLAN.md) for staged build strategy and current roadmap
- [`docs/PI_EXTENSION_API.md`](/Users/josephcaldwell/Documents/dev/my-pi/docs/PI_EXTENSION_API.md) for Pi extension/package mechanics used by this repo
- [`docs/UPSTREAM_PI_POLICY.md`](/Users/josephcaldwell/Documents/dev/my-pi/docs/UPSTREAM_PI_POLICY.md) for how this project evaluates upstream Pi changes, version bumps, and compatibility risk

## Choosing Between Skills, Prompts, and Extensions

This repo uses three different Pi resource types. They are related, but they are not interchangeable.

### Skill

A skill is a reusable agent workflow with substantial instructions and optional helper files.

- Use a skill when the capability is mostly "follow this workflow" rather than "run custom runtime logic."
- Skills live at `skills/<name>/SKILL.md`.
- A Pi skill requires YAML frontmatter with at least `name` and `description`.
- Skills are invoked as `/skill:<name>`.
- In this repo, `next` belongs here because it is primarily a reusable workflow: read the handoff docs, run the orchestrator, verify the result, and update the handoff state.

### Prompt template

A prompt template is a lightweight reusable prompt snippet.

- Use a prompt template when the capability is mostly a short reusable prompt with minimal logic.
- Prompt templates live under `prompts/`.
- Prompt templates are exposed as bare `/<name>`.
- We are not using prompt templates for `next` or `seed` because both capabilities need more structure than a simple prompt expansion.

### Extension command

An extension command is a real slash command implemented by a Pi extension.

- Use an extension when the capability needs interactive behavior, validation, completions, state, deterministic handling, or custom runtime logic.
- Extensions live under `extensions/` and are registered through the package manifest.
- Extensions can register true custom slash commands such as `/<name>`.
- `seed` fits this model long term because browsing available seeds, letting the user choose one, validating inputs, and applying it cleanly is interactive and stateful.
- If we ever want bare `/next` instead of `/skill:next`, that would also be an extension-command decision, not a prompt-template decision.

## Decision Rubric

- Use a skill when the capability is mostly a reusable agent workflow with substantial instructions and optional helper files.
- Use a prompt template when the capability is mostly a reusable prompt/snippet with minimal logic.
- Use an extension when the capability needs a real slash command, interactive behavior, validation, completions, state, or deterministic handling.

## Current Command Map

| Name | Type | Invocation | Status | Purpose |
|---|---|---|---|---|
| `next` | Skill | `/skill:next` | Available | Execute the next queued handoff task using the orchestrator and then advance the handoff docs only after successful verification. |
| `seed` | Planned extension command | `/seed` | Not implemented yet | Browse, select, and apply project seeds. Seed definitions exist in the repo, but the command surface is future work. |

Current prompt-template surface:

- No prompt templates are currently shipped in this package.

Current extension-command surface:

- No custom slash commands from this package are currently documented as available.
- The package does ship two extensions today: [`extensions/orchestrator/index.ts`](/Users/josephcaldwell/Documents/dev/my-pi/extensions/orchestrator/index.ts) and [`extensions/dashboard/index.ts`](/Users/josephcaldwell/Documents/dev/my-pi/extensions/dashboard/index.ts), but they do not currently make `next` or `seed` available as bare slash commands.

## Package Loading

Package resources only appear in Pi after Pi has actually loaded this package.

- A checked-out repo is not automatically an active Pi package.
- The package must be installed or otherwise loaded through your normal Pi package workflow before its skills, prompts, themes, and extensions appear.
- In this repo, the manifest for those resources is [`package.json`](/Users/josephcaldwell/Documents/dev/my-pi/package.json).
- If Pi has not loaded this package yet, commands like `/skill:next` will not appear even though the files exist in the repo.

## Common Mistakes

- Skills use `/skill:name`, not bare `/<name>`.
- Bare `/<name>` is for prompt templates or extension commands.
- A checked-out repo is not enough on its own; Pi must load the package before package resources appear.
- A feature with lots of instructions is usually a skill; a short reusable text snippet is usually a prompt template; an interactive command with selection or validation is usually an extension.
