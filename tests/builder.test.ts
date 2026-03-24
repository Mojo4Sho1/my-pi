import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildBuilderSystemPrompt, buildBuilderTaskPrompt } from "../extensions/specialists/builder/prompt.js";
import { parseBuilderOutput } from "../extensions/specialists/builder/result-parser.js";
import { createTaskPacket } from "../extensions/shared/packets.js";
import type { TaskPacket } from "../extensions/shared/types.js";

// --- Prompt Tests ---

describe("buildBuilderSystemPrompt", () => {
  const prompt = buildBuilderSystemPrompt();

  it("includes the builder role", () => {
    expect(prompt).toContain("Builder Specialist");
    expect(prompt).toContain("specialist_builder");
  });

  it("includes working style directives", () => {
    expect(prompt).toContain("Translate packet objective into minimal concrete edits");
    expect(prompt).toContain("Conservative with boundary crossings");
    expect(prompt).toContain("small, composable implementations");
  });

  it("includes scope constraints", () => {
    expect(prompt).toContain("ONLY modify files listed in the allowed write set");
    expect(prompt).toContain("Do NOT perform broad cleanup");
    expect(prompt).toContain("Do NOT silently expand scope");
  });

  it("includes anti-patterns", () => {
    expect(prompt).toContain("Do NOT claim validation beyond what was actually run");
    expect(prompt).toContain("Do NOT embed orchestration decisions");
  });

  it("includes required JSON output format", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"deliverables"');
    expect(prompt).toContain('"modifiedFiles"');
    expect(prompt).toContain('"escalation"');
  });
});

describe("buildBuilderTaskPrompt", () => {
  const baseTask: TaskPacket = createTaskPacket({
    objective: "Add error handling to auth module",
    allowedReadSet: ["src/auth/index.ts", "src/auth/types.ts"],
    allowedWriteSet: ["src/auth/index.ts"],
    acceptanceCriteria: ["Handles network errors", "Returns typed errors"],
    targetAgent: "specialist_builder",
    sourceAgent: "orchestrator",
  });

  it("includes all task packet fields", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).toContain(baseTask.id);
    expect(prompt).toContain("Add error handling to auth module");
    expect(prompt).toContain("src/auth/index.ts");
    expect(prompt).toContain("src/auth/types.ts");
    expect(prompt).toContain("Handles network errors");
    expect(prompt).toContain("Returns typed errors");
  });

  it("includes read and write sets", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).toContain("Allowed read set: src/auth/index.ts, src/auth/types.ts");
    expect(prompt).toContain("Allowed write set: src/auth/index.ts");
  });

  it("omits context when not provided", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).not.toContain("Additional context");
  });

  it("includes context when provided", () => {
    const taskWithContext = createTaskPacket({
      objective: "Fix bug",
      allowedReadSet: ["src/app.ts"],
      allowedWriteSet: ["src/app.ts"],
      acceptanceCriteria: ["Bug is fixed"],
      context: { priority: "high", ticket: "BUG-123" },
      targetAgent: "specialist_builder",
      sourceAgent: "orchestrator",
    });
    const prompt = buildBuilderTaskPrompt(taskWithContext);
    expect(prompt).toContain("Additional context");
    expect(prompt).toContain("BUG-123");
  });

  it("includes execution instruction", () => {
    const prompt = buildBuilderTaskPrompt(baseTask);
    expect(prompt).toContain("Execute this task within the stated scope");
  });
});

// --- Result Parser Tests ---

describe("parseBuilderOutput", () => {
  it("extracts structured JSON from a code fence", () => {
    const text = `I've completed the changes.

\`\`\`json
{
  "status": "success",
  "summary": "Added error handling to auth module",
  "deliverables": ["Try-catch wrappers for API calls"],
  "modifiedFiles": ["src/auth/index.ts"]
}
\`\`\``;

    const result = parseBuilderOutput(text);
    expect(result.status).toBe("success");
    expect(result.summary).toBe("Added error handling to auth module");
    expect(result.deliverables).toEqual(["Try-catch wrappers for API calls"]);
    expect(result.modifiedFiles).toEqual(["src/auth/index.ts"]);
    expect(result.sourceAgent).toBe("specialist_builder");
  });

  it("extracts raw JSON block at end of text", () => {
    const text = `Done with implementation.

{"status": "success", "summary": "Fixed the bug", "deliverables": ["Bug fix"], "modifiedFiles": ["src/app.ts"]}`;

    const result = parseBuilderOutput(text);
    expect(result.status).toBe("success");
    expect(result.summary).toBe("Fixed the bug");
  });

  it("falls back to partial on malformed JSON", () => {
    const text = "I made some changes but the JSON got corrupted: {invalid json here}";
    const result = parseBuilderOutput(text);
    expect(result.status).toBe("partial");
    expect(result.summary).toContain("I made some changes");
  });

  it("falls back to partial on missing JSON", () => {
    const text = "I implemented the feature as requested. All tests pass.";
    const result = parseBuilderOutput(text);
    expect(result.status).toBe("partial");
    expect(result.summary).toBe(text);
  });

  it("returns failure on empty input", () => {
    const result = parseBuilderOutput("");
    expect(result.status).toBe("failure");
    expect(result.summary).toContain("no output");
  });

  it("returns failure on whitespace-only input", () => {
    const result = parseBuilderOutput("   \n  ");
    expect(result.status).toBe("failure");
  });

  it("handles all four status values", () => {
    for (const status of ["success", "partial", "failure", "escalation"] as const) {
      const text = `\`\`\`json\n{"status": "${status}", "summary": "test", "deliverables": [], "modifiedFiles": []}\n\`\`\``;
      const result = parseBuilderOutput(text);
      expect(result.status).toBe(status);
    }
  });

  it("includes escalation details when present", () => {
    const text = `\`\`\`json
{
  "status": "escalation",
  "summary": "Cannot proceed",
  "deliverables": [],
  "modifiedFiles": [],
  "escalation": {
    "reason": "Required changes exceed allowed write scope",
    "suggestedAction": "Expand allowedWriteSet to include src/config.ts"
  }
}
\`\`\``;

    const result = parseBuilderOutput(text);
    expect(result.status).toBe("escalation");
    expect(result.escalation).toBeDefined();
    expect(result.escalation!.reason).toBe("Required changes exceed allowed write scope");
    expect(result.escalation!.suggestedAction).toContain("src/config.ts");
  });

  it("always sets sourceAgent to specialist_builder", () => {
    const text = `\`\`\`json\n{"status": "success", "summary": "done", "deliverables": [], "modifiedFiles": []}\n\`\`\``;
    expect(parseBuilderOutput(text).sourceAgent).toBe("specialist_builder");

    // Also for fallback cases
    expect(parseBuilderOutput("no json here").sourceAgent).toBe("specialist_builder");
    expect(parseBuilderOutput("").sourceAgent).toBe("specialist_builder");
  });

  it("truncates long text in fallback summary", () => {
    const longText = "x".repeat(600);
    const result = parseBuilderOutput(longText);
    expect(result.status).toBe("partial");
    expect(result.summary.length).toBeLessThanOrEqual(503); // 500 + "..."
    expect(result.summary).toContain("...");
  });

  it("rejects JSON with invalid status", () => {
    const text = `\`\`\`json\n{"status": "invalid", "summary": "test", "deliverables": [], "modifiedFiles": []}\n\`\`\``;
    const result = parseBuilderOutput(text);
    // Should fall back since "invalid" is not a valid PacketStatus
    expect(result.status).toBe("partial");
  });

  it("handles missing deliverables and modifiedFiles in JSON", () => {
    const text = `\`\`\`json\n{"status": "success", "summary": "done"}\n\`\`\``;
    const result = parseBuilderOutput(text);
    expect(result.status).toBe("success");
    expect(result.deliverables).toEqual([]);
    expect(result.modifiedFiles).toEqual([]);
  });
});

// --- Subprocess Tests (mocked) ---

describe("spawnBuilderAgent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  function createMockChild(setup: (child: any) => void) {
    const { EventEmitter } = require("events");
    const { Readable } = require("stream");
    const child = new EventEmitter() as any;
    child.stdout = new Readable({ read() {} });
    child.stderr = new Readable({ read() {} });
    child.kill = vi.fn();
    setTimeout(() => setup(child), 10);
    return child;
  }

  it("spawns pi with correct arguments", async () => {
    const mockSpawn = vi.fn().mockImplementation(() =>
      createMockChild((child) => {
        const event = JSON.stringify({
          type: "message_end",
          message: {
            role: "assistant",
            content: [{ type: "text", text: '```json\n{"status":"success","summary":"done","deliverables":[],"modifiedFiles":[]}\n```' }],
          },
        });
        child.stdout.push(event + "\n");
        child.stdout.push(null);
        child.stderr.push(null);
        child.emit("close", 0);
      })
    );

    vi.doMock("child_process", () => ({ spawn: mockSpawn }));
    const { spawnBuilderAgent } = await import("../extensions/specialists/builder/subprocess.js");

    const result = await spawnBuilderAgent("system", "task");

    expect(mockSpawn).toHaveBeenCalledWith(
      "pi",
      ["--print", "-s", "system", "-p", "task"],
      expect.objectContaining({ stdio: ["ignore", "pipe", "pipe"] })
    );
    expect(result.exitCode).toBe(0);
    expect(result.finalText).toContain("success");
  });

  it("captures stderr", async () => {
    const mockSpawn = vi.fn().mockImplementation(() =>
      createMockChild((child) => {
        child.stderr.push("some warning\n");
        child.stdout.push(null);
        child.stderr.push(null);
        child.emit("close", 1);
      })
    );

    vi.doMock("child_process", () => ({ spawn: mockSpawn }));
    const { spawnBuilderAgent } = await import("../extensions/specialists/builder/subprocess.js");

    const result = await spawnBuilderAgent("system", "task");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("some warning");
  });

  it("extracts final text from last assistant message", async () => {
    const mockSpawn = vi.fn().mockImplementation(() =>
      createMockChild((child) => {
        // First message
        child.stdout.push(
          JSON.stringify({
            type: "message_end",
            message: { role: "assistant", content: [{ type: "text", text: "first" }] },
          }) + "\n"
        );
        // Second (final) message
        child.stdout.push(
          JSON.stringify({
            type: "message_end",
            message: { role: "assistant", content: [{ type: "text", text: "final answer" }] },
          }) + "\n"
        );
        child.stdout.push(null);
        child.stderr.push(null);
        child.emit("close", 0);
      })
    );

    vi.doMock("child_process", () => ({ spawn: mockSpawn }));
    const { spawnBuilderAgent } = await import("../extensions/specialists/builder/subprocess.js");

    const result = await spawnBuilderAgent("system", "task");
    expect(result.finalText).toBe("final answer");
  });

  it("rejects when aborted before spawn", async () => {
    const { spawnBuilderAgent } = await import("../extensions/specialists/builder/subprocess.js");
    const controller = new AbortController();
    controller.abort();

    await expect(
      spawnBuilderAgent("system", "task", controller.signal)
    ).rejects.toThrow("Aborted before spawn");
  });
});
