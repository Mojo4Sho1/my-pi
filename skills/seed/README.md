# `skills/seed/`

This directory currently holds seed definitions and related planning material for a future Pi extension command.

It is intentionally **not** an active Pi skill:

- there is no supported `/skill:seed`
- there is no implemented `/seed` command yet
- the intended long-term model is a real extension command because seed selection/application is interactive and more complex than a simple prompt expansion

For the current architecture:

- `next` is the active skill in this package and is invoked as `/skill:next`
- `seed` is planned future extension work
- the seed definitions under `skills/seed/seeds/` are repo assets for that future command, not a current command surface
