# PR #112 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。gitleaks 8.30.1，装法与 CI 相同：`gitleaks_8.30.1_linux_x64.tar.gz`，sha256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb`，二进制 `/tmp/gitleaks`。`GATE_BASE=origin/main`（`6c59339`）。

代码提交是 `db3e03eea3a431bf8fe08a2a256a72bcec85d4f5`。下面的定向命令与 `pnpm check` 跑在这个提交上。本文件提交之后只改 docs。未改日志。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `pnpm test`（任务限定定向加 `pnpm check`）。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `env -u GITLEAKS_BIN -u CI corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 本地路径。1 个文件，3 passed，3 skipped。跳过的是三条 gitleaks 夹具。Type Errors: no errors |
| `env -u GITLEAKS_BIN CI=true corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 1 | 预期失败。3 failed，3 passed。失败的三条都是 `GITLEAKS_BIN is unset while CI=true. G9 must not skip in CI.`。不是 skip |
| `CI=true GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 与 CI 的 `node` job 相同：变量已设置。6 passed，0 skipped。Type Errors: no errors |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | G1 Prettier、lint、typecheck、typecheck:core、行数（178 个源文件）、`check:deps`（92 modules，175 dependencies，无违例）、G16、许可证 npm/pip/models、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（57 行非生成）、codegen（1 generator）与 G7。codegen 之后工作区干净 |

未在本机重跑 `workers/parser` 的 ruff、pyright、import-linter、pytest。diff 的代码只有 `tools/check-secrets/leak.test.ts`。
