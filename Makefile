.PHONY: typecheck test test-watch

typecheck:
	npx tsc --noEmit

test:
	npm test

test-watch:
	npm run test:watch
