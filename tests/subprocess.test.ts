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

  it("rejects when aborted before spawn", async () => {
    const { spawnSpecialistAgent } = await import("../extensions/shared/subprocess.js");
    const controller = new AbortController();
    controller.abort();

    await expect(
      spawnSpecialistAgent("system", "task", controller.signal)
    ).rejects.toThrow("Aborted before spawn");
  });
});
