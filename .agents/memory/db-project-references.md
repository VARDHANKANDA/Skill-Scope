---
name: DB project references must be built
description: lib/db must have its TypeScript declarations compiled before api-server typecheck passes
---

## Rule
Run `cd lib/db && pnpm exec tsc -b` before running `pnpm --filter @workspace/api-server run typecheck` in any new environment, or after adding new tables/exports to lib/db.

**Why:** The api-server tsconfig uses TypeScript project references (`"references": [{"path": "../../lib/db"}]`). tsc resolves `@workspace/db` via the compiled `dist/*.d.ts` files, not through the package.json `exports` field. If `lib/db/dist/` is absent or stale, all imports of tables from `@workspace/db` fail with "Module has no exported member".

**How to apply:** Any time the DB schema changes or CI reports "Module '@workspace/db' has no exported member", rebuild lib/db declarations first. The package.json exports point to `./src/index.ts` (works for esbuild runtime), but tsc project references require `dist/`.
