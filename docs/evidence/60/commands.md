# PR #60 命令

日期：2026-11-04。分支 `feature/m3-worker-asgi-auth-60`。实现提交是 `d84d921865b7e623c141b91e967a42c999467974`。下面的检查跑在该提交上。本文件是之后补上的记录，不改产品代码。工作目录是仓库根，除非另注。Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。worker 用 `workers/parser` 里的 uv，Python 3.11。未改日志。`test:core` 不适用（`package.json` 没有这个脚本）。没有跑全量 `pnpm test`，没有跑全量 pytest，没有跑 `pnpm run check`。没有改 `.github/`。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `uv run pytest tests/api/test_auth.py tests/api/test_auth_streaming.py tests/api/test_app.py tests/api/test_health.py -W error::DeprecationWarning --tb=line -q` | 2 | 收集 `test_app.py` 时失败。`starlette/testclient.py:51`：`anyio.abc.BlockingPortal` 别名弃用。这是改动前就有的 `TestClient` 导入警告，不是 `BaseHTTPMiddleware`。收集被打断，同一次运行里其它文件没有执行 |
| `uv run pytest tests/api/test_auth.py tests/api/test_auth_streaming.py tests/api/test_app.py tests/api/test_health.py --tb=line -q` | 0 | 29 passed，1 warning。警告仍是上面那条 `TestClient` |
| `uv run pytest tests/api/test_auth.py tests/api/test_auth_streaming.py tests/api/test_health.py -W error::DeprecationWarning --tb=line -q` | 0 | 15 passed，0 warning。新流式测试在这条里面 |
| `uv run pytest tests/api/test_server.py --tb=line -q` | 0 | 4 passed。验收要求现有 `test_server.py` 仍通过。交接命令清单没有这一条，所以单独跑，不是全量 |
| `uv run ruff check oi_worker/api/auth.py tests/api/test_auth.py tests/api/test_auth_streaming.py` | 0 | All checks passed |
| `uv run ruff format --check oi_worker/api/auth.py tests/api/test_auth_streaming.py` | 0 | 2 files already formatted |
| `uv run pyright oi_worker/api/auth.py tests/api/test_auth_streaming.py` | 0 | 0 errors, 0 warnings, 0 informations。提示 pyright 1.1.414 可用，未升级 |
| `uv run lint-imports` | 0 | 7 kept，0 broken。验收要求改动文件不新增分层问题 |
| `corepack pnpm run check:size` | 0 | 213 source files within hard limits。`auth.py` 56 行，`test_auth_streaming.py` 185 行 |
| `node tools/check-docs/check.mjs` | 0 | links 0，anchors 0。status 9 条是既有文件，没有本计划 |
| `corepack pnpm run check:commits` | 0 | subjects match Conventional Commits |

worker 命令的工作目录是 `workers/parser/`。`rg -n 'BaseHTTPMiddleware' oi_worker` 无输出。

原始输出在 `/opt/cursor/artifacts/commands-60.log`。
