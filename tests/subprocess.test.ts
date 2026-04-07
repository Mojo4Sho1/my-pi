import { describe, it, expect, vi, beforeEach } from "vitest";

describe("spawnSpecialistAgent", () => {
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
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");

    const result = await spawnSpecialistAgent("system", "task");

    expect(mockSpawn).toHaveBeenCalledWith(
      "pi",
      ["--mode", "json", "--print", "--system-prompt", "system", "task"],
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
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");

    const result = await spawnSpecialistAgent("system", "task");
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
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");

    const result = await spawnSpecialistAgent("system", "task");
    expect(result.finalText).toBe("final answer");
  });

  it("extracts token usage from message_end events when present", async () => {
    const mockSpawn = vi.fn().mockImplementation(() =>
      createMockChild((child) => {
        child.stdout.push(
          JSON.stringify({
            type: "message_end",
            message: {
              role: "assistant",
              content: [{ type: "text", text: "final answer" }],
              usage: {
                input_tokens: 123,
                output_tokens: 45,
              },
            },
          }) + "\n"
        );
        child.stdout.push(null);
        child.stderr.push(null);
        child.emit("close", 0);
      })
    );

    vi.doMock("child_process", () => ({ spawn: mockSpawn }));
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");

    const result = await spawnSpecialistAgent("system", "task");
    expect(result.tokenUsage).toEqual({
      inputTokens: 123,
      outputTokens: 45,
      totalTokens: 168,
    });
  });

  it("accumulates text from message_update events when message_end has no content", async () => {
    const mockSpawn = vi.fn().mockImplementation(() =>
      createMockChild((child) => {
        // Simulate real Pi streaming: message_start, then message_updates with content,
        // then message_end with no content (just metadata)
        child.stdout.push(
          JSON.stringify({ type: "message_start", message: { role: "assistant" } }) + "\n"
        );
        child.stdout.push(
          JSON.stringify({ type: "message_update", content: [{ type: "text", text: "Hello " }] }) + "\n"
        );
        child.stdout.push(
          JSON.stringify({ type: "message_update", content: [{ type: "text", text: "world" }] }) + "\n"
        );
        // message_end with empty/no content — typical of real Pi output
        child.stdout.push(
          JSON.stringify({ type: "message_end", message: { role: "assistant", content: [] } }) + "\n"
        );
        child.stdout.push(null);
        child.stderr.push(null);
        child.emit("close", 0);
      })
    );

    vi.doMock("child_process", () => ({ spawn: mockSpawn }));
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");

    const result = await spawnSpecialistAgent("system", "task");
    expect(result.finalText).toBe("Hello world");
  });

  it("flushes remaining buffer on close (last line without trailing newline)", async () => {
    const mockSpawn = vi.fn().mockImplementation(() =>
      createMockChild((child) => {
        // agent_end event without trailing newline — sits in buffer
        const agentEnd = JSON.stringify({
          type: "agent_end",
          messages: [
            { role: "assistant", content: [{ type: "text", text: "final from agent_end" }] },
          ],
        });
        // No trailing \n — this is the bug scenario
        child.stdout.push(agentEnd);
        child.stdout.push(null);
        child.stderr.push(null);
        child.emit("close", 0);
      })
    );

    vi.doMock("child_process", () => ({ spawn: mockSpawn }));
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");

    const result = await spawnSpecialistAgent("system", "task");
    expect(result.finalText).toBe("final from agent_end");
  });

  it("prefers message_end content over accumulated message_update text", async () => {
    const mockSpawn = vi.fn().mockImplementation(() =>
      createMockChild((child) => {
        child.stdout.push(
          JSON.stringify({ type: "message_start", message: { role: "assistant" } }) + "\n"
        );
        child.stdout.push(
          JSON.stringify({ type: "message_update", content: [{ type: "text", text: "partial" }] }) + "\n"
        );
        // message_end WITH content should take precedence
        child.stdout.push(
          JSON.stringify({
            type: "message_end",
            message: { role: "assistant", content: [{ type: "text", text: "complete answer" }] },
          }) + "\n"
        );
        child.stdout.push(null);
        child.stderr.push(null);
        child.emit("close", 0);
      })
    );

    vi.doMock("child_process", () => ({ spawn: mockSpawn }));
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");

    const result = await spawnSpecialistAgent("system", "task");
    expect(result.finalText).toBe("complete answer");
  });

  it("rejects when aborted before spawn", async () => {
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");
    const controller = new AbortController();
    controller.abort();

    await expect(
      spawnSpecialistAgent("system", "task", controller.signal)
    ).rejects.toThrow("Aborted before spawn");
  });
});
