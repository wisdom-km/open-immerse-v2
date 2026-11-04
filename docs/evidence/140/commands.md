# PR #140 命令

日期：2026-11-04。分支 `feature/m3-worker-testclient-warning-140`。基线 `5ca0b333a7d4f7c61ea083500531fde393ff7bd3`。实现提交是 `e927abc29b62d0cc625aa3b0f41df4e6ba6759a4`。改完之后的检查跑在该提交上。工作目录是仓库根，除非另注。Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。worker 用 `workers/parser` 里的 uv，Python 3.11.18。未改日志。`test:core` 不适用（`package.json` 没有这个脚本）。没有跑全量 `pnpm test`，没有跑无参数的 `uv run pytest`，没有跑 `pnpm run check`。没有改 `.github/`。没有改 `pyproject.toml` 与 `uv.lock`。

## 改代码之前

工作目录 `workers/parser/`。提交 `5ca0b33`，`tests/api/test_app.py` 仍导入 `TestClient`。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `uv run pytest tests/api/test_app.py -W error::DeprecationWarning -q` | 2 | 收集阶段 `ERROR tests/api/test_app.py`，`Interrupted: 1 error during collection`。`starlette/testclient.py:51` 访问 `anyio.abc.BlockingPortal`，警告原文：`DeprecationWarning: The anyio.abc.BlockingPortal alias is deprecated, use anyio.from_thread.BlockingPortal instead.` |

## 改代码之后

worker 命令的工作目录是 `workers/parser/`。实现提交 `e927abc`。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `uv run pytest tests/api/test_auth.py tests/api/test_auth_streaming.py tests/api/test_app.py tests/api/test_health.py -W error::DeprecationWarning` | 0 | 29 passed。输出里没有 warning 行，也没有 `DeprecationWarning`。`test_app.py` 14 条都在这 29 条里 |
| `uv run pytest tests/api/test_app.py -W error::DeprecationWarning -v` | 0 | 14 passed。9 个用例函数都在，坏协议头仍是 6 个参数 |
| `uv run ruff check tests/api/test_app.py tests/api/conftest.py` | 0 | All checks passed。`conftest.py` 未改，命令仍按交接带上 |
| `uv run ruff format --check tests/api/test_app.py tests/api/conftest.py` | 0 | 2 files already formatted |
| `uv run pyright tests/api/test_app.py tests/api/conftest.py` | 0 | 0 errors, 0 warnings, 0 informations。提示 pyright 1.1.414 可用，未升级 |
| `uv run lint-imports` | 0 | 7 kept，0 broken |
| `rg -n TestClient tests` | 1 | 无输出。rg 没有匹配时退出码是 1 |

回到仓库根，PATH 已把 Node v22.23.4 放在前面：

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm run check:size` | 0 | 213 source files within hard limits。`test_app.py` 163 行，测试文件上限 800 |
| `node tools/check-docs/check.mjs` | 0 | links 0，anchors 0。status 9 条是既有文件，没有本计划，也没有本证据目录 |
| `corepack pnpm run check:commits` | 0 | 当时范围是 `5ca0b33..e927abc`。subjects match Conventional Commits |

原始输出在 `/opt/cursor/artifacts/commands-140.log`。
