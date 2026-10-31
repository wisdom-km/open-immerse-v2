# PR #23 命令

工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 20.19.2，PATH 里 nvm 的 bin 在前。全量套件在提交 `a5f98b99e110fe2083070469790ab5ea49b60698` 上跑过。本文件是随后的记录，不改检查行为。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `corepack pnpm run check` | 0 | lint、tsc --noEmit、typecheck:core、行数、dependency-cruiser、core 测试指令、npm/pip/模型许可证、G18、Conventional Commits、热点、PR 体量、codegen 后 `git diff` 都通过。`check-file-size` 打印 55 个源文件在硬上限内。`check-pr-size` 打印 207 行非生成改动 |
| `corepack pnpm test` | 0 | Vitest 24 个文件、30 通过、2 跳过。含 `tools/check-file-size` 与 `tools/gate-remediation` 的漂移测试 |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check .`（`workers/parser/`） | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check .`（`workers/parser/`） | 0 | 25 files already formatted |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright`（`workers/parser/`） | 0 | 0 errors。有新版本提示，未升级 |
| `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports`（`workers/parser/`） | 0 | 6 kept |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest`（`workers/parser/`） | 0 | 3 passed |

没有跑 `pnpm test:core`：package.json 没有这个脚本。没有跑 `tsc -b`。
