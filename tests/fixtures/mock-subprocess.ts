#!/usr/bin/env node
/**
 * Mock subprocess for hardening tests.
 *
 * Simulates various subprocess failure modes based on arguments:
 * --timeout: sleep forever
 * --malformed-json: emit partial/corrupted JSON
 * --crash: exit non-zero mid-output
 * --empty: exit 0 with no output
 * --large-output: emit oversized response
 * --success: emit a valid message_end event
 */

const args = process.argv.slice(2);
const mode = args[0] || "--success";

function writeEvent(event: unknown) {
  process.stdout.write(JSON.stringify(event) + "\n");
}

function validMessageEnd(text: string) {
  return {
    type: "message_end",
    message: {
      role: "assistant",
      content: [{ type: "text", text }],
    },
  };
}

switch (mode) {
  case "--timeout":
    // Sleep forever — test should kill us
    setInterval(() => {}, 1000 * 60 * 60);
    break;

  case "--malformed-json":
    process.stdout.write('{"type": "message_en\n');
    process.stdout.write("not json at all\n");
    process.stdout.write('{"broken": true\n');
    process.exit(0);
    break;

  case "--crash":
    writeEvent({ type: "message_start", message: { role: "assistant" } });
    process.exit(1);
    break;

  case "--empty":
    process.exit(0);
    break;

  case "--large-output": {
    const largeText = "x".repeat(100_000);
    const jsonOutput = JSON.stringify({
      status: "success",
      summary: "Large output test",
      deliverables: [largeText],
      modifiedFiles: [],
    });
    writeEvent(validMessageEnd(`\`\`\`json\n${jsonOutput}\n\`\`\``));
    process.exit(0);
    break;
  }

  case "--success":
  default: {
    const jsonOutput = JSON.stringify({
      status: "success",
      summary: "Mock specialist completed successfully",
      deliverables: ["mock deliverable"],
      modifiedFiles: [],
    });
    writeEvent(validMessageEnd(`\`\`\`json\n${jsonOutput}\n\`\`\``));
    process.exit(0);
    break;
  }
}
