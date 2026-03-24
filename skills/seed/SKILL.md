# Skill: seed

Invoke with `/seed` to bootstrap the current repo from a saved project template.

## What This Skill Does

When invoked, present the user with a numbered list of available seeds. Each seed is a subdirectory under `skills/seed/seeds/`. Read each seed's `SEED.md` for its one-line description to show in the menu.

## Invocation Steps

1. List all subdirectories in `skills/seed/seeds/`
2. For each, extract the `description:` line from its `SEED.md` front matter
3. Present a numbered menu, for example:
   ```
   Available seeds:
   1. new-project — Bootstrap a new project repo from scratch
   2. gpu-profiling-gfm — Setup a GPU profiling repo for graph foundation models

   Enter a number or seed name:
   ```
4. Wait for the user to respond with a number or seed name
5. Read the selected seed's full `SEED.md`
6. Execute the instructions in `SEED.md` inside the current repo

## Notes

- Seeds are non-interactive by design — they do not ask questions mid-execution
- Seeds assume you are already inside the target repo when `/seed` is invoked
- Add new seeds by creating a new subdirectory under `skills/seed/seeds/` with a `SEED.md`
