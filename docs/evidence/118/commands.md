# PR #118 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。gitleaks 8.30.1，装法与 CI 相同：`gitleaks_8.30.1_linux_x64.tar.gz`，sha256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`，二进制 `/tmp/gitleaks`。`GATE_BASE=origin/main`（`865c2f50f1844ccd528ebc651af10902ce2def6b`）。

代码提交是 `5232c7062b9f9ebcdfe4e9b1cd501e499070e369`。`pnpm check` 跑在这个提交上。本文件提交之后只改 docs。未改日志。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `pnpm test`（验收是定向 vitest 加一次 `pnpm check`）。

旧判定没有单独提交。下面第一行是工作区里已经加上 `CI=1` / `CI=0` / `CI=false` 三条测试、`binary()` 仍是 `env.CI === "true"` 时的结果。然后才改判定并提交。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `env -u GITLEAKS_BIN -u CI corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 1 | 旧判定。1 failed，5 passed，3 skipped。失败的是 `fails when CI is 1 and GITLEAKS_BIN is missing (G9)`：`expected [Function] to throw an error`，函数没有抛，走了 skip。同一次里 `CI=0` 和 `CI=false` 通过，因为旧判定本来就会 skip。这两条不是「旧代码失败」的证据 |
| `env -u GITLEAKS_BIN -u CI corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 新判定，提交 `5232c70` 的代码。6 passed，3 skipped。跳过的是三条 gitleaks 夹具。Type Errors: no errors |
| `env -u GITLEAKS_BIN CI=1 corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 1 | 新判定，预期失败。6 passed，3 failed。失败的三条夹具都抛 `GITLEAKS_BIN is unset while CI=1. G9 must not skip in CI.`，不是 skip |
| `env -u GITLEAKS_BIN CI=0 corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 新判定。6 passed，3 skipped。`CI=0` 仍允许在没有二进制时 skip |
| `env -u GITLEAKS_BIN CI=false corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 新判定。6 passed，3 skipped。`CI=false` 同样 skip |
| `env -u GITLEAKS_BIN CI=true corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 1 | 新判定，预期失败。6 passed，3 failed。抛错文案含 `CI=true`，与原来的断言一致 |
| `CI=1 GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 9 passed，0 skipped |
| `CI=0 GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 9 passed，0 skipped |
| `CI=false GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 9 passed，0 skipped |
| `env -u CI GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 9 passed，0 skipped。Type Errors: no errors |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 跑在 `5232c70`。G1 Prettier、lint、typecheck、typecheck:core、行数（184 个源文件）、`check:deps`（92 modules，175 dependencies，无违例）、G16、许可证 npm/pip/models、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（51 行非生成）、codegen（1 generator）与 G7。codegen 之后工作区干净 |

未在本机重跑 `workers/parser` 的 ruff、pyright、import-linter、pytest。diff 的代码只有 `tools/check-secrets/leak.test.ts`。
