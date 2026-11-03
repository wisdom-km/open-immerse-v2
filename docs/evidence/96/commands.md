# PR #96 命令

日期：2026-11-03。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。未改日志。

代码提交是 `25ff78f`（条目 2）、`fbe8fdb`（条目 3）、`0c24680ca665d000abedc23924ed1fa5f8620534`（条目 5）。下面的全量命令跑在 `0c24680` 上。本文件提交之后只改 docs。

基线是 `origin/main` 的 `2f7a3286e361c9ab6c665026a3c9d7e9eac254d4`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/check-deps/contracts-kernel.test.ts tools/codegen/schema-module.test.ts tools/codegen/versions.test.ts` | 1，随后条目 2 的断言收紧后为 0 | 第一次：schema-module 与 versions 通过；kernel 用例失败，因为违规路径是相对的 `packages/kernel/src/index.ts`，不是临时目录绝对路径。改为断言 `→ packages/kernel/src/index.ts` 且不含仓库 kernel 绝对路径后，`vitest run` 只跑前两个文件：2 个文件、4 通过。Type Errors: no errors |
| `corepack pnpm exec eslint tools/check-deps/contracts-kernel.test.ts tools/codegen/schema-module.mjs tools/codegen/schema-module.test.ts` | 0 | 补上 `schema-module.d.mts` 之后。该声明文件不在 eslint 的匹配范围里 |
| 工作目录 `workers/parser/`：`node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check oi_worker/api/health.py tests/api/test_health.py tests/protocol/test_versions.py` | 0 | All checks passed |
| 同上，`--id G1 -- uv run ruff format --check` 同一组文件 | 0 | 3 files already formatted |
| 同上，`--id G3-pyright -- uv run pyright` | 0 | 0 errors, 0 warnings, 0 informations。`health_route.py` 未改 |
| 同上，`--id G8 -- uv run pytest tests/api/test_health.py tests/protocol/test_versions.py tests/protocol/test_health.py` | 0 | 27 passed |
| 工作目录 `workers/parser/`：ruff check `.`、ruff format --check `.`、lint-imports、pytest | 0 | ruff 全通过。import-linter 7 kept, 0 broken。pytest 161 passed，1 条既有 DeprecationWarning |
| `git diff --stat -- workers/parser/oi_worker/protocol/` | 0 | 无输出。提交前与 `pnpm run check` 里的 codegen 之后各看过一次 |
| `GATE_BASE=origin/main corepack pnpm run check` | 1，随后 0 | 未提交源码时 G7 的 `git diff --exit-code` 失败，diff 只有本 PR 的源码。提交 `0c24680` 之后重跑：退出码 0。check-pr-size 为 338 行非生成代码。codegen: 1 generators，之后工作区干净 |
| `corepack pnpm test` | 0 | 71 个文件，166 passed，2 skipped。跳过的是既有 G9（`tools/check-secrets/leak.test.ts`，`GITLEAKS_BIN` 未设置）。本 PR 没有新增 skip。Type Errors: no errors |
