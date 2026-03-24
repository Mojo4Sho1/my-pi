---
name: new-project
description: Bootstrap a new project repo from scratch
---

# Seed: new-project

> **STATUS: PLACEHOLDER**
> This seed contains stub sections only. The real instructions will be merged in during a dedicated Opus session. See Handoff Notes below.

## What This Seed Does

Sets up a new project repo to the user's standard preferences — directory structure, governance files, tooling config, CLAUDE.md, Makefile, and any other standard scaffolding.

## Agent Instructions

_TODO: Fill in during Opus session. Will include step-by-step instructions for the agent to follow when this seed is selected._

## Files to Create

_TODO: List every file the agent should create, with either verbatim content or a description of what to generate._

## Decisions to Make Upfront

_TODO: List any choices that should be determined before scaffolding begins (e.g., language, framework, license)._

## Templates

_TODO: Add a `templates/` subdirectory alongside this file with any files the agent should copy verbatim or with light substitution._

---

## Handoff Notes (for next session)

**Model:** Use Opus for this session — the seed content involves nuanced preferences and the user wants careful refinement.

**What to do:**
1. The user has real seed instructions to bring into this file — ask them to provide these at the start of the session
2. Replace all `_TODO` stubs above with the actual content
3. Create a `templates/` subdirectory with file templates the agent should scaffold (e.g., `CLAUDE.md`, `.gitignore`, `Makefile`, `README.md`)
4. Update the `description:` front matter line if the name/summary changes

**Design constraints already decided:**
- Seeds are non-interactive (agent does not ask questions mid-execution)
- The agent is already inside the target repo when `/seed` is invoked
- Seeds are standalone, not composable with other seeds

**Future consideration (do not implement yet):**
- Some seeds (especially one that creates a new repo on the user's behalf) will eventually need to be interactive — asking for repo name, visibility, target path before scaffolding. This is a planned enhancement, not in scope for this session.
