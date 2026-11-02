# PR #58 命令

日期：2026-11-02。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v20.19.2，PATH 前置 `/home/ubuntu/.nvm/versions/node/v20.19.2/bin`。Python 3.11.18，uv 0.13.6。没有截图。大文件：无。未改日志。

基线 `GATE_BASE=origin/main`（`63a879746a757714cb349ea7d613e3cd1ff79481`）。

## `c475c88cb79c1d00fd2b4b3adc66fcc033aaa015`

全量检查跑在这一笔。其后的证据记录不重跑这套。这一笔之前有一次 `pnpm run check` 失败：快照里的 `node_modules` 没有 `@sinclair/typebox`，ESLint 报的是既有契约文件。`corepack pnpm install --frozen-lockfile`（退出码 0，新增 1 个包）之后才是下面这一次。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（111 个源文件）、dependency-cruiser、core 测试位置、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量、codegen、G7。`check-pr-size`：636 行非生成 diff，提交说明里有 `G12:`。`codegen: 1 generators`。其后工作树干净 |
| `corepack pnpm test` | 0 | Vitest 51 个文件、81 通过、2 跳过。跳过的是 `tools/check-secrets/leak.test.ts`：当时未设 `GITLEAKS_BIN` |
| `GITLEAKS_BIN=/tmp/gitleaks node tools/gate-remediation/run.mjs --id G9 -- /tmp/gitleaks detect --source . --config .gitleaks.toml --redact --no-banner` | 0 | gitleaks 8.30.1。173 commits，no leaks found |
| `GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 2 通过。补上上面被跳过的 G9 用例，不是第二次全量 |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check .`（`workers/parser/`） | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check .`（`workers/parser/`） | 0 | 49 files already formatted |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest`（`workers/parser/`） | 0 | 90 passed。1 条 Starlette/anyio 弃用警告，不是失败 |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright`（`workers/parser/`） | 0 | 0 errors。提示 1.1.414 可用，未升级 |
| `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports`（`workers/parser/`） | 0 | 6 kept，0 broken。48 files，39 dependencies |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

进程级用例 `tests/api/test_server.py` 在上面的 pytest 里：启动 `python -m oi_worker`，读 stdout 的端口，`GET /v1/health` 为 200，响应体没有路径或 `key`，SIGTERM 后进程退出且端口拒绝连接。Windows job 还没在本环境跑。

对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。
