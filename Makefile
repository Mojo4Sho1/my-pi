.PHONY: typecheck test test-watch relay

typecheck:
	npx tsc --noEmit

test:
	npm test

test-watch:
	npm run test:watch

# Run the next validation task through the Pi orchestrator.
# Reads docs/handoff/NEXT_TASK.md and delegates to the appropriate specialist(s).
#
# Usage:
#   make relay                    # run next task from NEXT_TASK.md
#   make relay MODEL=claude-...   # override model
relay:
	@if [ ! -f docs/handoff/NEXT_TASK.md ]; then \
		echo "Error: docs/handoff/NEXT_TASK.md not found"; exit 1; \
	fi
	@TASK=$$(cat docs/handoff/NEXT_TASK.md); \
	echo "=== Relay: running next task ==="; \
	echo ""; \
	pi $(if $(MODEL),--model $(MODEL)) \
		--print \
		"Read docs/handoff/NEXT_TASK.md and execute the task described there. Use the orchestrate tool with the specialist flow and relevant files specified in the document. After completion, update all handoff docs per the verification checklist."
