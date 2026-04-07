import { describe, it, expect } from "vitest";
import { createTaskPacket } from "../extensions/shared/packets.js";
import docFormatterExtension from "../extensions/specialists/doc-formatter/index.js";
import {
  buildDocFormatterSystemPrompt,
  buildDocFormatterTaskPrompt,
  DOC_FORMATTER_PROMPT_CONFIG,
} from "../extensions/specialists/doc-formatter/prompt.js";

describe("DOC_FORMATTER_PROMPT_CONFIG", () => {
  it("has the correct specialist ID", () => {
    expect(DOC_FORMATTER_PROMPT_CONFIG.id).toBe("specialist_doc_formatter");
  });

  it("has the correct role name", () => {
    expect(DOC_FORMATTER_PROMPT_CONFIG.roleName).toBe("Doc Formatter Specialist");
  });

  it("defines markdown normalization contracts", () => {
    expect(DOC_FORMATTER_PROMPT_CONFIG.inputContract?.fields).toEqual([
      {
        name: "markdownContent",
        type: "string",
        required: true,
        description: "Raw markdown content to normalize",
      },
    ]);
    expect(DOC_FORMATTER_PROMPT_CONFIG.outputContract?.fields).toEqual([
      {
        name: "normalizedMarkdown",
        type: "string",
        required: true,
        description: "Normalized markdown content",
      },
    ]);
  });

  it("is read-only", () => {
    expect(DOC_FORMATTER_PROMPT_CONFIG.constraints).toContain(
      "You may ONLY normalize markdown content — do NOT write files."
    );
    expect(DOC_FORMATTER_PROMPT_CONFIG.antiPatterns).toContain(
      "claim file modifications were made"
    );
  });
});

describe("buildDocFormatterSystemPrompt", () => {
  const prompt = buildDocFormatterSystemPrompt();

  it("includes the doc-formatter role", () => {
    expect(prompt).toContain("Doc Formatter Specialist");
    expect(prompt).toContain("specialist_doc_formatter");
  });

  it("includes read-only constraints", () => {
    expect(prompt).toContain("ONLY normalize markdown content");
    expect(prompt).toContain("do NOT write files");
    expect(prompt).toContain("Preserve document meaning");
  });

  it("includes normalized markdown output fields", () => {
    expect(prompt).toContain("```json");
    expect(prompt).toContain('"status"');
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"normalizedMarkdown"');
    expect(prompt).toContain('"modifiedFiles"');
  });
});

describe("buildDocFormatterTaskPrompt", () => {
  const task = createTaskPacket({
    objective: "Normalize a markdown handoff note",
    allowedReadSet: ["docs/handoff/NEXT_TASK.md"],
    allowedWriteSet: [],
    acceptanceCriteria: ["Normalized markdown returned", "No files modified"],
    context: { markdownContent: "# Title\n\n- item one\n- item two" },
    targetAgent: "specialist_doc_formatter",
    sourceAgent: "orchestrator",
  });

  it("includes task packet fields", () => {
    const prompt = buildDocFormatterTaskPrompt(task);
    expect(prompt).toContain(task.id);
    expect(prompt).toContain("Normalize a markdown handoff note");
    expect(prompt).toContain("docs/handoff/NEXT_TASK.md");
    expect(prompt).toContain("Normalized markdown returned");
    expect(prompt).toContain("No files modified");
  });

  it("includes markdown context", () => {
    const prompt = buildDocFormatterTaskPrompt(task);
    expect(prompt).toContain("Additional context");
    expect(prompt).toContain("markdownContent");
  });

  it("shows an empty write set for read-only work", () => {
    const prompt = buildDocFormatterTaskPrompt(task);
    expect(prompt).toContain("Allowed write set: ");
  });
});

describe("docFormatterExtension", () => {
  it("registers the expected delegation tool via the shared factory", () => {
    let capturedTool: { name: string; label: string; description: string } | undefined;
    const mockPi = {
      registerTool(config: { name: string; label: string; description: string }) {
        capturedTool = config;
      },
    };

    docFormatterExtension(mockPi as any);

    expect(capturedTool).toBeDefined();
    expect(capturedTool?.name).toBe("delegate-to-doc-formatter");
    expect(capturedTool?.label).toBe("Delegate to Doc Formatter");
    expect(capturedTool?.description).toContain("markdown-normalization");
  });
});
