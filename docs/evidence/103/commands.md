# PR #103 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。gitleaks 8.30.1，装法与 CI 相同：`gitleaks_8.30.1_linux_x64.tar.gz`，sha256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`，二进制 `/tmp/gitleaks`。`GITLEAKS_BIN=/tmp/gitleaks`。`GATE_BASE=origin/main`（`d411710`）。

代码提交是 `a66358b`。下面的全量命令跑在这个提交上。本文件提交之后只改 docs。未改日志。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 提交前的定向确认。1 个文件，3 passed，0 skipped。Type Errors: no errors |
| `node tools/gate-remediation/run.mjs --id G9 -- /tmp/gitleaks detect --source . --config .gitleaks.toml --redact --no-banner` | 0 | gitleaks 8.30.1。273 commits scanned，no leaks found |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（174 个源文件）、`check:deps`（90 modules，164 dependencies，无违例）、G16、许可证 npm/pip/models、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（20 行非生成）、codegen（1 generator）与 G7。codegen 之后工作区干净 |
| `GITLEAKS_BIN=/tmp/gitleaks corepack pnpm test` | 0 | Vitest 71 个文件，169 passed，0 skipped，0 failed。Type Errors: no errors。这是 `a66358b` 上的一次全量 |

未在本机重跑 `workers/parser` 的 ruff、pyright、import-linter、pytest。diff 只有 `tools/check-secrets/leak.test.ts`。
