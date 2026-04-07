# PI_EXTENSION_API.md

Quick reference for Pi's extension API as it applies to my-pi development. For full documentation, see the [pi-mono source](https://github.com/badlogic/pi-mono) under `packages/coding-agent/docs/extensions.md`.

Use this document for current API shape and package mechanics. Use [`docs/UPSTREAM_PI_POLICY.md`](/Users/josephcaldwell/Documents/dev/my-pi/docs/UPSTREAM_PI_POLICY.md) when the task involves upstream Pi version changes, compatibility review, or deciding whether to adopt a newer Pi release.

---

## Extension Structure

An extension is a TypeScript file that exports a default function receiving `ExtensionAPI`:

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Register tools, commands, event handlers
}
```

Extensions are loaded dynamically via jiti — no compilation step required.

---

## Tool Registration

Register tools the LLM can call via `pi.registerTool()`:

```typescript
import { Type } from "@sinclair/typebox";

pi.registerTool({
  name: "delegate-to-builder",
  description: "Delegate a bounded task to the builder specialist",
  parameters: Type.Object({
    objective: Type.String({ description: "What the builder should accomplish" }),
    allowedFiles: Type.Array(Type.String(), { description: "Files the builder may modify" }),
  }),
  async execute(toolCallId, params, signal, onUpdate, ctx) {
    // ... spawn sub-agent, collect result
    return {
      content: [{ type: "text", text: JSON.stringify(resultPacket) }],
      details: {},
    };
  },
});
```

Parameters use [TypeBox](https://github.com/sinclairzx81/typebox) for schema definition.

---

## Sub-Agent Spawning

The reference pattern (from pi-mono's subagent example) spawns isolated Pi processes:

```typescript
import { spawn } from "child_process";

const child = spawn("pi", [
  "--mode", "json",            // Emit JSONL events on stdout
  "--print",                   // Run once and exit (non-interactive)
  "--system-prompt", systemPrompt,  // Inject system prompt
  taskPrompt,                  // Positional arg: the task to execute
], { signal });

// Parse JSON events from stdout for messages, tool calls, results
// Handle SIGTERM → 5s wait → SIGKILL for cleanup
```

**CLI flag reference:**
- `--mode json` — emit structured JSONL events on stdout (required for programmatic parsing)
- `--mode text` — plain text output (default)
- `--mode rpc` — RPC protocol over stdin/stdout
- `--print` / `-p` — process prompt and exit (non-interactive)
- `--system-prompt` — inject a system prompt
- `--model` — override the model
- Prompt text is a **positional argument**, not a flag

**JSONL event types:** `session`, `agent_start`, `turn_start`, `message_start`, `message_update`, `message_end`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`, `turn_end`, `agent_end`

Key properties:
- Each sub-agent gets an **isolated context window** and tool configuration
- Communicates via **JSON-formatted events on stdout** (requires `--mode json`)
- Supports **abort signal** for cancellation
- Agent definitions from `~/.pi/agent/agents/` or `.pi/agents/` are discoverable

---

## Key API Methods

| Method | Purpose |
|--------|---------|
| `pi.registerTool(def)` | Register a tool the LLM can call |
| `pi.registerCommand(name, opts)` | Register a `/slash` command |
| `pi.on(event, handler)` | Subscribe to lifecycle events |
| `pi.sendMessage(msg, opts?)` | Inject a message into conversation |
| `pi.exec(cmd, args, opts?)` | Execute shell commands |
| `pi.getActiveTools()` / `pi.setActiveTools(names)` | Manage tool availability |
| `pi.appendEntry(type, data?)` | Persist state across sessions |

---

## Lifecycle Events (Relevant to Orchestration)

| Event | When | Use Case |
|-------|------|----------|
| `session_start` | Session loads | Initialize extension state |
| `before_agent_start` | Before LLM starts | Inject system prompt additions |
| `tool_call` | LLM invokes a tool | Intercept/modify tool calls |
| `tool_result` | Tool returns result | Transform results before LLM sees them |
| `turn_start` / `turn_end` | LLM interaction turn | Track delegation rounds |

---

## Extension Context (`ctx`)

Available in event handlers and tool `execute` functions:

- `ctx.ui.confirm(msg)` / `ctx.ui.input(prompt)` / `ctx.ui.select(opts)` — user interaction
- `ctx.ui.notify(msg)` — status notifications
- `ctx.cwd` — current working directory
- `ctx.hasUI` — check if interactive UI is available (false in print/JSON mode)
- `ctx.abort()` — abort current operation

---

## Package Declaration

Package resources are declared in `package.json`. In this repo the manifest is explicit:

```json
{
  "keywords": ["pi-package"],
  "pi": {
    "extensions": [
      "./extensions/orchestrator/index.ts",
      "./extensions/dashboard/index.ts"
    ],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

Important operational note:

- Pi only sees these resources after the package itself has been installed or otherwise loaded by Pi.
- Merely cloning the repo is not enough to make its skills, prompts, or extensions appear in Pi.
- Convention directories such as `extensions/`, `skills/`, and `prompts/` matter within a loaded package; they do not activate the package on their own.

---

## Key References

- **pi-mono repo:** https://github.com/badlogic/pi-mono
- **Extension docs:** `packages/coding-agent/docs/extensions.md` in pi-mono
- **Package docs:** `packages/coding-agent/docs/packages.md` in pi-mono
- **Subagent example:** `packages/coding-agent/examples/extensions/subagent/` in pi-mono
- **All examples:** `packages/coding-agent/examples/extensions/` (67+ examples)
