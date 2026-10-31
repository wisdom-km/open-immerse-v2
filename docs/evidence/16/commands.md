# PR #16 命令记录

日期：2026-10-31。命令全表所在提交：`2a744e0328d5a8be0d4886ebcb2ad295eba758b3`。Node 以 `.nvmrc` 的 v20.19.2 为准。本文件只记测试日志，没有截图（本 PR 不改界面）。大文件：无。

Cloud Agent 的 PATH 里 `/exec-daemon/node`（v22.23.4）排在 nvm 前面。不改 PATH 时 `node -v` 是 v22.23.4。下表是把 `/home/ubuntu/.nvm/versions/node/v20.19.2/bin` 放在 PATH 前面之后的退出码。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `nvm install` | 0 | 已安装 20.19.2 |
| `nvm use` | 0 | Now using node v20.19.2。裸 `node` 仍可能指向 `/exec-daemon/node`，见文首 |
| `corepack enable` | 0 | pnpm@10.34.9 |
| `corepack pnpm install --frozen-lockfile` | 0 | Lockfile is up to date |
| `corepack pnpm run lint` | 0 | eslint，无警告 |
| `corepack pnpm run typecheck` | 0 | 目前空跑：`typecheck: no .ts or .tsx sources; skipped.` |
| `corepack pnpm test` | 0 | 目前空跑：`node --test`，`# tests 0` |
| `corepack pnpm test:core` | 254 | 脚本尚未提供。Command "test:core" not found。M1 前写不适用 |
| `uv python install`（`workers/parser/`） | 0 | Python 3.11.18 已在 |
| `uv sync --frozen --extra dev` | 0 | Checked 7 packages |
| `uv run ruff check .` | 0 | All checks passed |
| `uv run ruff format --check .` | 0 | 无输出。检查通过（没有需要改格式的文件） |
| `uv run pytest` | 5 | 目前空跑。collected 0 items。CI 把 5 当作空跑通过 |
| `node --test --test-name-pattern does-not-match` | 0 | 用例尚未提供。tests 0 |
| `uv run pytest -k does_not_match` | 5 | 用例尚未提供。collected 0 |
| `uv run pytest tests/test_does_not_exist.py` | 4 | 文件不存在。单测文件尚未提供 |

全表（含 `test:core` 254）跑在 `2a744e0328d5a8be0d4886ebcb2ad295eba758b3`。`a0ce565bb08e5d7c5444cb9ad68a93186fc01fdb` 上只复跑了 `corepack pnpm run lint`、`corepack pnpm run typecheck`、`corepack pnpm test`（退出码都是 0）和 `uv run pytest`（退出码 5）。
