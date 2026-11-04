# 执行计划

修 [Issue #60](https://github.com/wisdom-km/open-immerse-v2/issues/60)。分支 `feature/m3-worker-asgi-auth-60`。基线 `origin/main` `45241c4`。第一笔提交只有本文件。实现在其后的提交。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

本任务只改 worker 的启动令牌中间件和它的测试。不改 TS 切片。行数远低于 G12 的 600 行。交接要求第一笔只放这份计划，然后同一条 Draft PR 里改：不等另一次 Forge 审查才写实现。开工批准在 [Issue #60 评论](https://github.com/wisdom-km/open-immerse-v2/issues/60#issuecomment-6624660689)。

## 现状理解

- 已有行为：`workers/parser/oi_worker/api/auth.py` 第 17 行 `class LaunchBearerMiddleware(BaseHTTPMiddleware)`。`authorization_failure` 在 Bearer 不匹配时返回 `JSONResponse`，状态 401，体是 `{"code":"auth.bearer"}`，不回显令牌。比较走 `bearer_matches`（`hmac.compare_digest` 比较 SHA-256）。`app.py` 第 12 行 `app.add_middleware(LaunchBearerMiddleware, token=token)`。`GET /v1/health` 也走这层。非 HTTP scope 由 Starlette 0.48.0 的 `BaseHTTPMiddleware.__call__` 直接交给下游。`call_next` 把下游的响应消息放进 `anyio` 内存流，`dispatch` 返回之后才把 `Response` 送出去；下游在两块之间暂停时，第一块到不了客户端。
- 相关的节：[docs/arch/10-01.md](../arch/10-01.md) §10.1（每个请求，含健康检查，都要 Bearer；401 体 `{"code":"auth.bearer"}`；恒定时间比较）、[docs/arch/10-02.md](../arch/10-02.md) §10.2（`GET /v1/jobs/{id}/events` 是 SSE）。[docs/prd/08.md](../prd/08.md) M3 交付本机与远程同一套 HTTP + SSE。DESIGN.md 与 [docs/design-principles.md](../design-principles.md) 没有这条中间件的界面规则。本任务是 worker，不是 UI 改动 / seam 变更 / core 改动。
- 还没做的部分：纯 ASGI 的 `__init__(app, token)` 与 `async __call__(scope, receive, send)`。HTTP 仍要 Bearer。非 HTTP 原样转发。匹配的请求不读、不缓冲体。不实现 jobs / SSE 路由。

在 `45241c4` 上实测 `uv run pytest tests/api/test_auth.py tests/api/test_app.py -W default`：18 passed，1 warning。警告是 `starlette/testclient.py:51` 的 `anyio.abc.BlockingPortal` 别名，由 `test_app.py` 导入 `TestClient` 触发。Starlette 0.48.0 的 `BaseHTTPMiddleware` 没有 `warnings.warn`。

## 不改的文件

不改 `.github/**`、`.cursor/**`。不改 `docs/backlog.md`、`docs/approvals.md`、`docs/spec-changelog.md`、`RULES.md`、`AGENTS.md`。不改 `docs/exec-plans/feature-docs-rules-approvals.md`、`docs/exec-plans/feature-m1-deferred-gates.md`。不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`docs/prd/**`、`docs/arch/**`、`ARCHITECTURE.md`（N-10）。不改 `packages/**`、`apps/**`、`fixtures/**`、`tools/**`。不改 `pyproject.toml`、`uv.lock`、`package.json`、`pnpm-lock.yaml`。不改 `stop_signals.py`、`server.py` 以及其他 worker 模块。`app.py` 的 `add_middleware` 调用签名不变，本计划不改 `app.py`。现有 `tests/api/test_auth.py` 的断言不改语义，本计划不改这个文件。

`#119` 是文字层合成夹具，不碰 `oi_worker/api/auth.py`。`#138` 已合入，它改过的 `AGENTS.md`、`RULES.md`、`docs/approvals.md`、`docs/backlog.md`、`docs/spec-changelog.md` 与两份执行计划，本 PR 仍不碰。

## 来源核对

| 来源 | 核对结果 |
| --- | --- |
| Issue #60 正文「现象/证据」 | 对得上前半，警告的归因不符。`auth.py` 第 17 行就是 `class LaunchBearerMiddleware(BaseHTTPMiddleware)`。缓冲：`BaseHTTPMiddleware.__call__` 用内存流收齐下游响应，`dispatch` 返回后才送出，不适合 SSE。弃用警告：正文写 pytest 1 条 Starlette/anyio 警告。实测也是 1 条，但是 `starlette/testclient.py:51` 的 `anyio.abc.BlockingPortal`，不是 `BaseHTTPMiddleware` 发出的。处理：仍换成纯 ASGI。新测试不导入 `TestClient`，并断言这条路径 0 条 `DeprecationWarning`。交接命令里的 `-W error::DeprecationWarning` 含 `test_app.py`，会继续打到 `testclient.py:51`。那条不在本 PR 的可改文件里，不改 `test_app.py`，也不改 `pyproject.toml`。退出码写进证据。 |
| Issue #60 正文「要做的事」「验收标准」 | 对得上。纯 ASGI，行为不变，401 不回显。现有 auth 测试通过；中间件路径上的 `BaseHTTPMiddleware` 警告不再出现；新增流式不缓冲测试。对应交接 §2 第 1–3 条。`rg -n 'BaseHTTPMiddleware' workers/parser/oi_worker` 应无输出。 |
| [评论 6624660689](https://github.com/wisdom-km/open-immerse-v2/issues/60#issuecomment-6624660689) | 对得上。Wisdom 2026-11-04 14:54（UTC+8）原话「1按你的推荐，然后删掉，然后加入138一起合入。60和119可以并行开，就是你如果审查完之后并行是没有问题的话，那就并行。」范围是开工 #60，与 #119 并行，前提是不碰同一批文件。`docs/approvals.md` 没有 14:54 这一行。本 PR 不补。 |
| [docs/backlog.md](../backlog.md) 第 83 行 | 对得上。§4 该行是「把 `LaunchBearerMiddleware` 从 `BaseHTTPMiddleware` 换成纯 ASGI 中间件」，时机「SSE 之前」，并写 `BaseHTTPMiddleware` 会缓冲请求体，不适合 `GET /v1/jobs/{id}/events`。细差：Starlette 0.48.0 里请求被 `_CachedRequest` 包住；SSE 被挡住的是响应要等 `dispatch` 返回才送出。处理：不改这一行。实现上请求体原样交给下游，响应块原样 `send`。 |
| [docs/approvals.md](../approvals.md) 第 43 行 | 对得上。2026-11-04 13:31「按推荐，我同意。」批的是开分支修 #59，格内写「#60 稍后或另批」。说明当时 #60 未批。现在的开工批准是上面的 14:54 评论。不改 `approvals.md`。 |
| [feature-m3-worker-stop-signals-59.md](feature-m3-worker-stop-signals-59.md) 第 15 行 | 对得上。该行写不改 `oi_worker/api/auth.py`、`oi_worker/api/app.py`，留给 #60。本 PR 改 `auth.py`。`app.py` 调用保持可用则不改。 |
| [feature-m1-logging-contract.md](feature-m1-logging-contract.md) 第 77 行 | 对得上。该行写「#60 是 `BaseHTTPMiddleware`。与日志无关。」本 PR 不改日志代码。 |
| [docs/arch/10-01.md](../arch/10-01.md) §10.1、[docs/arch/10-02.md](../arch/10-02.md) §10.2 | 对得上。§10.1：包括 `GET /v1/health` 的每个请求都要 `Authorization: Bearer <令牌>`，恒定时间比较，缺失或错误返回 401，体 `{"code":"auth.bearer"}`。§10.2：`GET /v1/jobs/{id}/events` 是 SSE，支持 `Last-Event-ID`。本 PR 不加这条路由。 |
| `/workspace/oi-qa/v2-pr58-5c01793/ANVIL.md` 第 74 行 | 不符。本机没有这个文件，全盘也没有 `ANVIL.md`。处理：不编造第 74 行。Issue #60 正文、backlog 第 83 行、[docs/spec-changelog.md](../spec-changelog.md) 里 #58 那一行已经记下同一件事（SSE 之前换成纯 ASGI）。以这三处为准，不改它们。 |
| [workers/parser/oi_worker/api/app.py](../../workers/parser/oi_worker/api/app.py) | 对得上。`add_middleware(LaunchBearerMiddleware, token=token)`。Starlette 用 `cls(app, **kwargs)` 构造。`__init__(self, app, token)` 保持这个调用可用。不改 `app.py`。 |
| [workers/parser/tests/api/test_auth.py](../../workers/parser/tests/api/test_auth.py) | 对得上。断言 `bearer_matches` 与 `authorization_failure`：匹配、拒绝、401 体恰好 `{"code":"auth.bearer"}`、不回显令牌。这两个函数保留，现有断言不改语义。 |
| [AGENTS.md](../../AGENTS.md) 第 55–57 行 | 对得上。第 57 行的 Python 单测是在 `workers/parser/` 里 `uv run pytest tests/test_<模块>.py`。交接用文件路径，不跑全量 pytest，也不跑 `pnpm test`。 |
| [tools/check-file-size/check.mjs](../../tools/check-file-size/check.mjs) 第 27 行 | 对得上。`source` 600、`test` 800。`auth.py` 现 54 行，改完仍远小于 600。新测试远小于 800。 |

## 实现

`workers/parser/oi_worker/api/auth.py`：

- `LaunchBearerMiddleware` 不再继承 `BaseHTTPMiddleware`。`__init__(self, app, token)` 只保存下游 app 与令牌。
- `async __call__(scope, receive, send)`：`scope["type"] != "http"` 时 `await self._app(scope, receive, send)` 后返回。HTTP 用现有的 `authorization_failure(Request(scope), token)`。拒绝时 `await denied(scope, receive, send)`，不调用下游。通过时把原来的 `receive` / `send` 交给下游，不读请求体，不包响应。
- `bearer_matches`、`authorization_failure`、`AUTH_CODE`、`UNAUTHORIZED` 保持现在的行为。401 仍由 `JSONResponse` 构造，不另开文件。
- 删掉 `starlette.middleware.base` 的导入。`oi_worker/` 里不再出现 `BaseHTTPMiddleware`。

不改 `app.py`。不给 `create_app` 加路由。

`workers/parser/tests/api/test_auth_streaming.py`（只在这个文件里装路由）：

- 一个测试用的 `FastAPI()`，`add_middleware(LaunchBearerMiddleware, token=...)`，挂一条逐块 `yield` 的 `StreamingResponse`。路径只存在于测试。
- 令牌匹配时：下游先交出第一块，然后停在事件上。客户端（httpx `ASGITransport` 的 `stream`，若该客户端自己会等完整响应，则改用测试里的 ASGI `send` 记录）在后续块产生前收到第一块。再放开下游，收到第二块。
- 令牌错误时：同一路由返回 401，体 `{"code":"auth.bearer"}`，响应里没有正确令牌也没有错误令牌，路由函数未被调用。
- 非 HTTP：`lifespan` 直接透传。`websocket` 同样透传。
- 上述路径用 `warnings.catch_warnings` 断言 0 条 `DeprecationWarning`。不导入 `TestClient`。
- 假令牌用已有测试的 `oitest_` 前缀。

## 计划 / 实际

计划列在开工前填。实际列在实现提交之后回填。证据写在 `docs/evidence/60/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件 | 第一笔只有本文件 | 本文件 |
| 2 | `auth.py` 改为纯 ASGI；保留 `bearer_matches` 与 `authorization_failure`；不改 `app.py` | `LaunchBearerMiddleware` 不再继承 `BaseHTTPMiddleware`。非 HTTP 原样转发。HTTP 仍用 `authorization_failure`，通过时把原来的 `receive` / `send` 交给下游。`app.py` 未改 | `workers/parser/oi_worker/api/auth.py` |
| 3 | 新增 `tests/api/test_auth_streaming.py`：第一块先到、错误令牌 401 且下游未被调用、非 HTTP 透传、该路径 0 条 `DeprecationWarning` | 三条测试都在这个文件里。路由只用 `add_api_route` 装在测试里的 `FastAPI()` 上。httpx `ASGITransport` 会等完整响应，所以客户端是测试里的 ASGI `send` | `workers/parser/tests/api/test_auth_streaming.py` |
| 4 | 只跑交接列出的定向命令。不跑全量 pytest，不跑 `pnpm test`，不跑 `pnpm run check` | 已跑。带 `-W error::DeprecationWarning` 的整条命令退出码 2：收集 `test_app.py` 时 `starlette/testclient.py:51` 的既有 `BlockingPortal` 警告变成错误。去掉这个开关后 auth / streaming / app / health 为 29 passed。`test_auth.py`、`test_auth_streaming.py`、`test_health.py` 加 `-W error` 为 15 passed、0 warning | `docs/evidence/60/commands.md` |

`test:core` 不适用（`package.json` 没有这个脚本）。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 开工 #60，与 #119 并行（前提：不碰同一批文件） | Wisdom 原话「1按你的推荐，然后删掉，然后加入138一起合入。60和119可以并行开，就是你如果审查完之后并行是没有问题的话，那就并行。」见 [Issue #60 评论](https://github.com/wisdom-km/open-immerse-v2/issues/60#issuecomment-6624660689)。`docs/approvals.md` 还没有这一行。本 PR 不写 | 2026-11-04 14:54 | Wisdom |
| 第一笔之后同一 PR 里写实现，不等另一次审查 | 交接写明计划提交之后就改，并开 Draft。批准已经在 Issue #60 | 2026-11-04 | 交接 |
| 分支用 `feature/m3-worker-asgi-auth-60` | 交接点名。RULES §2 的功能分支前缀也是 `feature/` | 2026-11-04 | 交接 |
| 不改 backlog 第 83 行，不改 approvals 第 43 行 | 交接写明这两行由 Forge 之后的文档 PR 同步 | 2026-11-04 | 交接 |
| 401 仍用现有 `authorization_failure`，不另开文件 | 职责还是启动令牌。`JSONResponse` 的 ASGI 调用不读请求体 | 2026-11-04 | 本计划 |
| 流式测试不用 httpx `ASGITransport` 当客户端 | 0.28.1 的该传输要等 `app()` 整个返回才把块交给调用方，测不到「第一块先到」。测试里的 ASGI `send` 在下游还停着时就能看见第一块 | 2026-11-04 | 本计划 |
| 不改 `test_app.py` 来消掉 `BlockingPortal` 警告 | 这条警告在改动前就有，来自 Starlette `TestClient`，不在本 PR 可改文件里。新测试断言自己的路径 0 条 `DeprecationWarning` | 2026-11-04 | 本计划 |

## 证据链接

- `docs/evidence/60/commands.md`
