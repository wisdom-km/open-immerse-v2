# PR #56 命令

日期：2026-11-02。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v20.19.2，PATH 前置 `/home/ubuntu/.nvm/versions/node/v20.19.2/bin`。Python 3.11.18，uv 0.13.6。没有截图。大文件：无。未改日志。

基线 `GATE_BASE=origin/main`（`2d77787a867f42c6e3997821b247e78250953e49`）。

## `eb50a6e67d4075c9745e466c21bdae0257314992`

全量检查跑在这一笔。其后的证据记录不重跑这套。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（94 个源文件）、dependency-cruiser、core 测试位置、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量、codegen、G7。`check-pr-size`：1023 行非生成 diff。`codegen: 1 generators`。其后工作树干净 |
| `corepack pnpm test` | 0 | Vitest 49 个文件、79 通过、2 跳过。跳过的是 `tools/check-secrets/leak.test.ts`：当时未设 `GITLEAKS_BIN` |
| `GITLEAKS_BIN=/tmp/gitleaks node tools/gate-remediation/run.mjs --id G9 -- /tmp/gitleaks detect --source . --config .gitleaks.toml --redact --no-banner` | 0 | gitleaks 8.30.1。152 commits，no leaks found |
| `GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run --test-name-pattern 'gitleaks or secret or leak'` | 0 | 实际正则是这三段用竖线连接。22 通过、59 跳过。补上上面被跳过的 G9 用例，不是第二次全量 |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check .`（`workers/parser/`） | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check .`（`workers/parser/`） | 0 | 37 files already formatted |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest`（`workers/parser/`） | 0 | 57 passed |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright`（`workers/parser/`） | 0 | 0 errors。提示 1.1.414 可用，未升级 |
| `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports`（`workers/parser/`） | 0 | 6 kept，0 broken。32 files，16 dependencies |

## `296bd1905e9e891543bab5ae9f9b4e811a1d40cc`

Forge 审查后的修改。全量 `pnpm run check` 跑在这一笔。针对测试在提交前跑过，代码与这一笔相同。本段是随后的记录，不重跑全量。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 同上各门禁。`check-file-size`：99 个源文件。`check-pr-size`：1173 行非生成 diff。`codegen: 1 generators`。其后工作树干净 |
| `corepack pnpm exec vitest run tools/codegen/versions.test.ts tools/codegen/pin.test.ts tools/codegen/drift.test.ts tools/codegen/hand-edit.test.ts packages/contracts/test/worker-protocol.test.ts tools/gate-remediation/catalog.test.ts` | 0 | 7 个文件、10 通过 |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest tests/api/test_protocol_version.py tests/protocol/test_versions.py tests/api/test_health.py`（`workers/parser/`） | 0 | 29 passed |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright`（`workers/parser/`） | 0 | 0 errors。未升级 |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。
