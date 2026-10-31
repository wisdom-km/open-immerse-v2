# PR #21 命令

工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 20.19.2，PATH 里 nvm 的 bin 在前。`GITLEAKS_BIN=/tmp/gitleaks`（8.30.1）。`GATE_BASE=origin/main`（`c4dcf20`）。全量套件在提交 `7840ab53a1444c6489b50d81fdebd442ad907d57` 上跑过。本文件是随后的记录，不改检查行为。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `corepack pnpm run check` | 0 | lint、tsc --noEmit、typecheck:core、行数、dependency-cruiser、core 测试指令、npm/pip/模型许可证、G18、Conventional Commits、热点、PR 体量、codegen 后 `git diff` 都通过。`check-pr-size` 打印 1326 行非生成改动，提交说明含 `G12:` |
| `corepack pnpm test` | 0 | Vitest 24 个文件、29 个测试通过。违例夹具让对应检查器非 0，断言的是失败输出里的改正说明 |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check .`（`workers/parser/`） | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check .`（`workers/parser/`） | 0 | 25 files already formatted |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright`（`workers/parser/`） | 0 | 0 errors。有新版本提示，未升级 |
| `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports`（`workers/parser/`） | 0 | 6 kept |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest`（`workers/parser/`） | 0 | 3 passed |

没有跑 `pnpm test:core`：package.json 没有这个脚本。没有跑 `tsc -b`。

## 未知编号与规格引用

提交 `31a07bfea7887ef77bf9e2ff346226a0c3c2b2f0`。`GATE_BASE=origin/main`。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/gate-remediation` | 0 | 7 个文件、13 个测试通过 |
| `corepack pnpm run check` | 0 | `check-pr-size` 打印 1509 行非生成改动，先前提交说明里的 `G12:` 仍被接受 |
