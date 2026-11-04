# 执行计划

修 [Issue #140](https://github.com/wisdom-km/open-immerse-v2/issues/140)。分支 `feature/m3-worker-testclient-warning-140`。基线 `origin/main` `5ca0b33`（`5ca0b333a7d4f7c61ea083500531fde393ff7bd3`，#139 已合入）。第一笔提交只有本文件。实现在其后的提交。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

本任务只改 worker 测试，不改生产代码，不改行为。行数远低于 G12 的 600 行。交接要求第一笔只放这份计划，然后按方案 (c) 改测试。不等另一次 Forge 审查才写实现。开工批准在 [Issue #140 评论](https://github.com/wisdom-km/open-immerse-v2/issues/140#issuecomment-6625257930)。`docs/approvals.md` 没有这一行。本 PR 不补。

## 现状理解

- 已有行为：`workers/parser/tests/api/test_app.py` 第 4 行 `from fastapi.testclient import TestClient`，第 12–13 行用它包 `create_app`。`create_app`（`oi_worker/api/app.py`）只装配健康检查，没有 lifespan。全仓库 Python 测试里只有这个文件导入 `TestClient`。`tests/api/test_auth_streaming.py` 已经不用它。
- 相关的节：[docs/arch/10.md](../arch/10.md) §10 与 [docs/arch/10-01.md](../arch/10-01.md)、[docs/arch/10-02.md](../arch/10-02.md)、[docs/arch/10-03.md](../arch/10-03.md)（worker 协议与内部结构）；[docs/arch/13.md](../arch/13.md) §13（门禁，含 G8）。[docs/prd/06-01-07.md](../prd/06-01-07.md) AC-66、[docs/prd/06-01.md](../prd/06-01.md) 一带的健康检查验收由现有断言覆盖。本 PR 不改这些行为，也不改规格。DESIGN 与 `docs/design-principles.md` 没有这条测试客户端的界面规则。任务类型不是 UI 改动 / seam 变更 / core 改动。
- 还没做的部分：`test_app.py` 在 `-W error::DeprecationWarning` 下收集失败。要换成已有的 httpx `ASGITransport`，断言语义保持不变。

在 `5ca0b33` 上、未改代码，工作目录 `workers/parser/`：

`uv run pytest tests/api/test_app.py -W error::DeprecationWarning -q` → 退出码 2。`Interrupted: 1 error during collection`。收集 `tests/api/test_app.py` 时 `fastapi.testclient` 再导入 `starlette.testclient`，第 51 行 `_PortalFactoryType = Callable[[], AbstractContextManager[anyio.abc.BlockingPortal]]` 访问 `anyio.abc.BlockingPortal`。anyio 4.16.0 的 `anyio/abc/__init__.py` 第 61 行别名表把该名字指到 `anyio.from_thread.BlockingPortal`，经 `_lazyimport.py` 报 `DeprecationWarning: The anyio.abc.BlockingPortal alias is deprecated, use anyio.from_thread.BlockingPortal instead.`

钉死的版本：`pyproject.toml` 第 10–11 行 `fastapi==0.119.0`、`httpx==0.28.1`。`[tool.pytest.ini_options]` 第 60–63 行没有 `filterwarnings`。`uv.lock`：anyio `4.16.0`（第 15–16 行）、fastapi `0.119.0`（第 106–107 行）、httpx `0.28.1`（第 180–181 行）、starlette `0.48.0`（第 603–604 行）、pytest `9.2.0`（第 531–532 行）。starlette 与 anyio 不是直接依赖。

## 不改的文件

不改 `.github/**`、`.cursor/**`。不改 `apps/**`、`packages/**`、`tools/**`、`fixtures/**`。不改 `docs/approvals.md`、`docs/backlog.md`、`docs/spec-changelog.md`、`AGENTS.md`、`RULES.md`、`PRD.md`、`docs/prd/**`、`ARCHITECTURE.md`、`docs/arch/**`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`。不改 `workers/parser/oi_worker/**`。不改已合入的 `docs/exec-plans/feature-m3-worker-asgi-auth-60.md` 与 `docs/evidence/60/`。方案 (c) 另不改 `workers/parser/pyproject.toml`、`workers/parser/uv.lock`、根 `package.json`、`pnpm-lock.yaml`。不改 `tests/api/conftest.py`：helper 只放在 `test_app.py`。

## 方案

| 方案 | 做法 | 取舍 | 是否本计划采用 |
| --- | --- | --- | --- |
| (a) 升级依赖 | 把 `fastapi==0.119.0` 升到能带上 starlette ≥1.7 的版本，并更新 `uv.lock`。2026-11-04 查 PyPI：0.119.0 要求 `starlette<0.49.0,>=0.40.0`，0.125.0 是 `<0.51.0,>=0.40.0`，0.130.0 是 `<1.0.0,>=0.40.0`，0.140.0 起为 `>=0.46.0`（不封顶），当日最新 0.162.0 同样是 `>=0.46.0`。starlette 1.7.0（2026-09-23）写明去掉 `TestClient` 里弃用的 AnyIO 导入（#3498、#3501），并要求 `anyio>=4.0.0,<5`。当日 starlette 最新 1.10.0。master 的 `testclient.py` 第 46 行已是 `anyio.from_thread.BlockingPortal`。anyio 当日最新仍是 4.16.0，降到 4.14 才能不报这条别名，不采用 | 从根上消掉警告，但 fastapi 跨许多小版本、starlette 跨到 1.x，要改锁文件。RULES §1.5 对新增运行时依赖要求写用途、许可证、体积、替代方案并核许可证；对升级已有依赖没有写须 Wisdom 批准。交接仍把 (a) 定为须另批 | 否 |
| (b) 窄 filterwarnings | 在 `[tool.pytest.ini_options]` 加忽略 `starlette.testclient` 上这条 `DeprecationWarning` 的过滤 | 改测试配置。交接写明命令行 `-W error::DeprecationWarning` 优先于 ini，Forge 在干净克隆上加了这条过滤后 `test_app.py` 仍是 1 error。本计划没有重跑 (b)，不把那个退出码写成自己的测量 | 否 |
| (c) 不用 TestClient | `test_app.py` 改用 `httpx.AsyncClient(transport=httpx.ASGITransport(app=create_app(...)), base_url="http://127.0.0.1")`，同步测试里用 `asyncio.run`。httpx 0.28.1 已是直接依赖。不新增依赖，不用 `@pytest.mark.anyio` | 只改一个测试文件。断言要逐条保留。以后别的测试再导入 `TestClient` 仍会在收集阶段触发同一条警告 | 是 |

选定 (c)。若实现时断言依赖 `TestClient` 独有行为、换不过去，就停在本计划，不改 `pyproject.toml` / `uv.lock`，不自行改用 (a) 或 (b)。

## 来源核对

| 来源 | 核对结果 |
| --- | --- |
| [Issue #140](https://github.com/wisdom-km/open-immerse-v2/issues/140) 正文「现象」 | 对得上。正文写 `-W error::DeprecationWarning` 收集 `test_app.py` 时 exit 2，位置是 `starlette/testclient.py:51` 的 `anyio.abc.BlockingPortal`，main `45241c4` 上已复现，不是 #139 带进来的。本计划在含该提交的 `5ca0b33` 上再跑，退出码仍是 2，行号与警告原文同上。 |
| #140 正文「待办」①②③ | 目标对得上，①的手段不符。①要消除或正确处理这条警告；②要修正 #60 与 handoff 的说法；③要定向命令在 `-W error` 下仍包含 `test_app.py` 并通过。①字面列出的手段只有升级 starlette/anyio，或在 pyproject 里加有针对性的 filterwarnings。没有写换掉 `TestClient`。处理：本次任务指示按交接方案 (c) 做。(c) 只改测试，用来达成①③的结果。不把 (c) 写成 Wisdom 在 issue 正文里点过名的手段。不做 (a)/(b)。②在本 PR 正文写归因更正，不改 #60 正文，不评论 #60。 |
| [评论 6625257930](https://github.com/wisdom-km/open-immerse-v2/issues/140#issuecomment-6625257930) | 对得上。Wisdom 2026-11-04 15:29（UTC+8）原话「那就是同意开140，然后按照你的建议，等139一合入就开始。」评论把范围写成按待办①②③开工，条件是 #139 合入后从新 main 拉分支。#139 的合并提交就是 `5ca0b33`。`docs/approvals.md` 没有这一行。本 PR 不补。 |
| [Issue #60](https://github.com/wisdom-km/open-immerse-v2/issues/60) 正文「现象/证据」第 2 条 | 不符。该条写「pytest 有 1 条 Starlette/anyio 弃用警告」。验收标准写「弃用警告消失」，并把它和换成纯 ASGI 放在一起，等于归到 `BaseHTTPMiddleware`。实测这条警告来自 `starlette/testclient.py:51` 导入 `anyio.abc.BlockingPortal`，由 `TestClient` 引入。#139 已经去掉 `BaseHTTPMiddleware`，`5ca0b33` 上收集 `test_app.py` 仍是退出码 2。处理：本 PR 正文单列归因更正。不改 #60 正文，不评论 #60。 |
| `/workspace/oi-v2/handoffs/60.md` 第 16 行 | 不符。本机没有这个文件，第 16 行读不到，不能把交接转述的「与 BaseHTTPMiddleware 相关的…警告消失」写成已核对原文。处理：不编造该行。已入库的 [docs/evidence/60/commands.md](../evidence/60/commands.md) 第 9 行写明警告来自 `starlette/testclient.py:51`，不是 `BaseHTTPMiddleware`。更正只写在本 PR 正文，不改 `docs/evidence/60/`。 |
| `/workspace/oi-v2/pr139-review/REVIEW.md` 第 24–26、31–32、38 行 | 不符。本机没有这个文件，这几行读不到。处理：不编造行文。同一审查的公开记录是 [PR #139 评论 6625021949](https://github.com/wisdom-km/open-immerse-v2/pull/139#issuecomment-6625021949)，见下。 |
| `/workspace/oi-qa/v2-pr139-8d38545/ANVIL.md` 第 29、37–39、79 行 | 不符。本机没有这个文件，这几行读不到。处理：不编造行文。同一验收的公开记录是 [PR #139 评论 6625161915](https://github.com/wisdom-km/open-immerse-v2/pull/139#issuecomment-6625161915)，见下。 |
| [评论 6625021949](https://github.com/wisdom-km/open-immerse-v2/pull/139#issuecomment-6625021949) | 对得上。Forge 写 exit 2 在 main `45241c4` 上已复现，原因是 starlette TestClient 的 anyio 弃用警告，原来就有，不是 #139 回归。nit ①：另开 issue 处理这条警告，并改正 #60 把警告归到 BaseHTTPMiddleware 的说法。nit ②：PR 正文第一行是 HTML 注释，`Fixes #60` 在第二行。本 PR 正文第一行写 `Fixes #140`，前面不放 HTML 注释。 |
| [评论 6625161915](https://github.com/wisdom-km/open-immerse-v2/pull/139#issuecomment-6625161915) | 对得上。Anvil 对 tip `8d38545` 写 PASS。`-W error` 的问题见 #140。websocket 现在直接放行、不鉴权，记入 backlog，与本 issue 无关，本 PR 不处理。 |
| `docs/approvals.md`、`docs/backlog.md` 检索 `warning` / `testclient` / `anyio` | 对得上。两份文件都无命中。批准只在 issue 评论。不改这两份文件。 |
| [RULES.md](../../RULES.md) §1.5 第 47–55 行、第 26 行、第 37 行 | 对得上。第 26 行：依赖用 uv 管理，`uv.lock` 入库。第 37 行：门禁不得在本地关闭后提交。第 47–55 行：新增运行时依赖要写用途、许可证、体积、替代方案，并核 Apache-2.0 兼容。方案 (c) 不新增、不升级依赖。 |
| `workers/parser/pyproject.toml` 第 10–11、60–63 行；`uv.lock` 第 15–16、106–107、180–181、603–604 行 | 对得上。fastapi 0.119.0、httpx 0.28.1、anyio 4.16.0、starlette 0.48.0。pytest 配置没有 `filterwarnings`。 |
| starlette release notes 1.7.0；PyPI fastapi 0.119.0 / 0.125.0 / 0.130.0 / 0.140.0 的 `requires_dist` | 对得上。2026-11-04 打开 [release notes](https://github.com/Kludex/starlette/blob/master/docs/release-notes.md)：1.7.0（September 23, 2026）有「Avoid deprecated AnyIO imports in `TestClient` … for AnyIO 4.15 compatibility」以及 #3498、#3501，同版要求 `anyio>=4.0.0,<5`。master `testclient.py` 第 46 行是 `anyio.from_thread.BlockingPortal`。PyPI：0.119.0 为 `starlette<0.49.0,>=0.40.0`，0.125.0 为 `starlette<0.51.0,>=0.40.0`，0.130.0 为 `starlette<1.0.0,>=0.40.0`，0.140.0 与当日最新 0.162.0 均为 `starlette>=0.46.0`。当日 starlette 最新 1.10.0，anyio 最新 4.16.0。要拿到 starlette ≥1.7 必须把 fastapi 升到 ≥0.140。本计划不升级。 |
| [AGENTS.md](../../AGENTS.md) 第 52–57 行 | 对得上。第 36 行写 worker 命令的工作目录是 `workers/parser/`。第 52–57 行是 worker 的 ruff、pyright、lint-imports、pytest 与 Python 单测命令。本计划只跑交接点名的定向命令，不跑无参数的 `uv run pytest`、`pnpm test`、`pnpm run check`。 |
| `gh pr view 139 --json files` | 对得上。#139 只改了 `docs/evidence/60/commands.md`、`docs/exec-plans/feature-m3-worker-asgi-auth-60.md`、`workers/parser/oi_worker/api/auth.py`、`workers/parser/tests/api/test_auth_streaming.py`。这四份合入后只读，本 PR 不改。 |

## 实现

只改 `workers/parser/tests/api/test_app.py`：

- 删掉 `fastapi.testclient.TestClient`。每个用例仍对同一个 `create_app(mode, TOKEN)` 发请求。客户端是 `httpx.AsyncClient(transport=httpx.ASGITransport(app=...), base_url="http://127.0.0.1")`，用 `asyncio.run` 包一层。不新增依赖，不改 `conftest.py`。
- 保留现有每条断言：状态码、JSON 体、令牌不回显、响应文本里没有路径或 `key`、未知字段被忽略、`/docs` 与 `/openapi.json` 的 404 与缺令牌时的 401。用例函数不减少。参数化的六种坏协议头保留。
- `_run` 用 `warnings.catch_warnings` 断言该次请求 0 条 `DeprecationWarning`，与 `test_auth_streaming.py` 的写法同类。这是多出来的断言，不替换原有断言。
- 不改 `oi_worker/**`。`create_app` 没有 lifespan，换掉 `TestClient` 不丢掉启动或关闭行为。

做完后 `rg -n TestClient workers/parser/tests` 应无输出。别的测试文件若再导入 `TestClient`，收集阶段仍会打到 `testclient.py:51`。本 PR 不改那些文件，计划里记下这个边界。

## 计划 / 实际

计划列在开工前填。实际列在实现提交之后回填。证据写在 `docs/evidence/140/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件 |  | 本文件 |
| 2 | 在 `5ca0b33` 上复现收集失败，退出码 2，行号 `testclient.py:51` | 未改代码已跑过，退出码 2 | `docs/evidence/140/commands.md` |
| 3 | `test_app.py` 改用 httpx `ASGITransport`。断言语义保留。不改生产代码，不改依赖与锁文件 |  | `workers/parser/tests/api/test_app.py` |
| 4 | 只跑交接列出的定向命令。不跑全量 pytest，不跑 `pnpm test`，不跑 `pnpm run check` |  | `docs/evidence/140/commands.md` |

`test:core` 不适用（`package.json` 没有这个脚本）。

## 决策记录（Decision Log）

只记已记录的决定。Wisdom 的原话链到 issue 评论。`docs/approvals.md` 没有对应行，本 PR 不写。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 开工 #140，按待办①②③做；等 #139 合入后从新 main 拉分支 | Wisdom 原话「那就是同意开140，然后按照你的建议，等139一合入就开始。」见 [Issue #140 评论](https://github.com/wisdom-km/open-immerse-v2/issues/140#issuecomment-6625257930)。`docs/approvals.md` 没有这一行 | 2026-11-04 15:29 | Wisdom |
| 两个小问题不影响 #139，后续再修 | Wisdom 原话「那也就是说这两个小问题是不影响的，是吗？咱们后续会修复这个问题。」见 [Issue #140 正文](https://github.com/wisdom-km/open-immerse-v2/issues/140) | 2026-11-04 15:23 | Wisdom |
| 推荐方案 (c)（只改测试）。(a)/(b) 改依赖或测试配置，须另批 | 交接 §3。Forge 排序，非业主决定 | 2026-11-04 | Forge（建议，非批准） |
| 本计划选定 (c)，不改 `pyproject.toml` 与 `uv.lock` | 交接写明提交计划后按 (c) 实现；做不到就停，不得自行改用 (a) 或 (b)。没有 Wisdom 对升级依赖或 `filterwarnings` 的批准 | 2026-11-04 | 交接；本计划照做 |
| 第一笔之后同一 PR 里写实现，不等另一次审查 | 交接写明计划提交之后就改，并开 Draft。开工批准已经在 Issue #140 | 2026-11-04 | 交接 |

## 证据链接

- `docs/evidence/140/commands.md`
