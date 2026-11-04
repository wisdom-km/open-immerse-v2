# PR #147 命令

日期：2026-11-04。工作目录除注明外是仓库根。Node v22.23.4（`.nvmrc`），PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。命令跑在 `f12cd76`。没有跑全量 `pnpm test`、全量 pytest、`pnpm run check`、e2e。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/platform-node/test/worker-stderr.test.ts packages/platform-node/test/value-guard.test.ts packages/contracts/test/diag-events.test.ts` | 0 | 4 个文件、48 通过、0 失败、0 跳过。命令点了 3 个路径；多出的文件是 `diag-events` 的类型测试（`Type Errors: no errors`） |
| `corepack pnpm exec eslint --max-warnings 0` 改动的 5 个 ts 文件 | 0 | `worker-stderr.ts`、`value-guard.ts`、`index.ts`、两个测试 |
| `corepack pnpm exec prettier --check` 同一批 ts 文件 | 0 | 交接命令之外，避免 G1 |
| `node tools/typecheck.mjs` | 0 | |
| `node tools/compare-spec-bytes/compare.mjs` | 0 | ARCHITECTURE.md 66 parts match `f8d5d01` |
| `node tools/check-docs/check.mjs` | 0 | findings 9，与开工时相同。未改 `tools/check-docs` |
| `corepack pnpm exec vitest run packages/platform-node/test/file-logger.test.ts` | 0 | 15 通过。`value-guard` 的调用方，交接命令之外 |
| `uv run pytest tests/test_diag_log.py -q` | 0 | 工作目录 `workers/parser/`。12 通过、0 失败、0 跳过 |
| `uv run ruff check oi_worker/diag_log.py tests/test_diag_log.py` | 0 | 工作目录 `workers/parser/` |
| `uv run ruff format --check` 上述两个文件 | 0 | 工作目录 `workers/parser/` |
| `uv run pyright oi_worker/diag_log.py tests/test_diag_log.py` | 0 | 0 errors |
| `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports` | 0 | 工作目录 `workers/parser/`。7 kept，0 broken |

`test:core` 不适用（`package.json` 没有这个脚本）。
