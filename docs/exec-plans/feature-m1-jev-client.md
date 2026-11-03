# 执行计划

跨 `quality` 与 `fixtures/protocol/`。第一笔提交只有本文件。基线 `origin/main@222ac93`（2026-11-03）。Forge 已通过 `9a1e4c5`，实现在 `ad7d218`。PR 保持 Draft，不合入。本分支同步 `main` 只用 merge。

## 现状理解

- 已有行为：`workers/parser/oi_worker/quality/batching.py`、`http_errors.py`、`backends/jev_http.py`、`backends/local_engine.py` 各只有一行 G6 占位 docstring。`httpx==0.28.1` 在 `pyproject.toml` 的 dev extra，不在运行时 `dependencies`。`uv.lock` 已锁 httpx 0.28.1、httpcore 1.0.9、certifi 2026.10.23、h11 0.16.0、anyio 4.16.0、idna 3.20。import-linter 已有 `quality backends stay apart`（`local_engine` 与 `jev_http` 互不 import）和 `python core forbids io`（`batching`、`http_errors` 禁止 import `httpx`）。`__main__.py` 只装配本机健康检查。worker 没有 `evaluate` 端点。
- 相关的节：PRD §3.3、§6.1.3 AC-59、§6.1.15 AC-103、AC-05、§8 M0/M1、§9 2026-11-02 16:38 / 17:03 / 17:21；ARCHITECTURE §7.2、§7.3、§7.4「面壁 API」、§7.8、§7.9.5、§10.1、§10.2、§10.3、§12、§15.4；RULES §1.5、§2、§4、N-05、N-12、N-14。
- 还没做的部分：`engines/base.py`、`contracts/src/worker/evaluate.ts`、`packages/providers`、`fixtures/protocol/provider-errors/`、`settings/domain/backend-choice.ts` 都不存在。`fixtures/protocol/` 只有 `versions/`。Python 侧没有值守卫。诊断事件的 worker stderr 在 backlog #73，留给 M3。

## 已定决定

Wisdom 2026-11-03 13:15，覆盖交接里对应的开放问题。下面照做。

- 密钥按 ARCHITECTURE §7.4 / §10.1：主进程按任务用请求头 `OI-Provider-Authorization` 传给本机回环 worker。worker 不读 `MODELBEST_API_KEY`，不落盘，不进日志。
- 范围：M1 只做最小 Jev 托管 API 客户端，加上可配置选择的 `local_engine` 桩。同一契约，桩失败或缺凭据都不改回 `'api'`。评测端点、完整管线、`settings/backend-choice` 留 M6a，本 PR 不新建。
- 重试次数和退避做成配置，默认不重试。具体退避数字等 M0 实测，不写进产品默认值。
- HTTP 库用 httpx。测试用 mock transport。CI 不发真实网络请求。
- Base URL 以官方文档为准，写在下面。查不到的标「未核实」，做成配置。
- 不新建 Python 日志脱敏。客户端不记录 key 或请求头。M0 只要求客户端在返回值里暴露耗时、usage、失败、重试次数。不写测量 runner。

## 系统行为

能用规格里已经写明的反应，就用那些反应。

### 请求

AC-59 ① 与 ARCHITECTURE §7.4「面壁 API」表：

- `POST {base}/chat/completions`。
- `model` 固定 `"MiniCPM-OCR-Jev"`。`stream` 恒为 `false`。`minicpm_ocr_jev.mode` 恒为 `"score"`。
- 每个请求的 `items` ≤ 64。65 项由 `quality/batching.py` 拆成 64 与 1。
- `messages` 非空，并带上该批的图和文本。空 `messages` 在官方文档里会得到 HTTP 400 `moderation_invalid_input`。
- 图片的 `image_url.url` 一律是 `data:image/png;base64,`。

本 PR 只做 `score`。`score_best`、`score_best_batch`、`GET /models`、自建 Docker 的无前缀图片，留到以后改 `jev_http` 主机配置的那个 PR。

### Base URL

做成配置，两个站点各自预置。

- 国际站 `https://api.modelbest.ai/v1`。出处：[面壁开放平台 OCR Correctness Decision API](https://platform.modelbest.ai/console/docs/api/ocr-jev)。2026-11-03 打开该页，页面标注 Updated Oct 29, 2026，写明 `POST https://api.modelbest.ai/v1/chat/completions`。与 ARCHITECTURE §7.4（2026-10-30 查阅，页面标注 2026-10-29）一致。默认用这一站。
- 国内站预置字符串 `https://api.modelbest.cn/v1`，来自规格所记的上游文档，标「未核实」。2026-11-03 打开 `https://platform.modelbest.cn/console/docs/api/ocr-jev`，页面没有给出 API 正文。不把它当默认。

### 凭据

- 客户端函数接收调用方传入的凭据字符串。不读 `os.environ`，不读 `MODELBEST_API_KEY`，不读 `.env`。
- 发往面壁时放进 `Authorization: Bearer <传入值>`。
- 传入值为空：对面壁的请求为 0，结果 `unavailable`，原因 `auth`，不带分数（AC-59 ④ 的 worker 侧）。
- 本 PR 不实现读取 `OI-Provider-Authorization` 的作业端点。以后的作业层从该头取出值，再传给这个客户端。测试直接传入 `oitest_` 前缀的假 key（`.gitleaks.toml` 允许这个前缀）。
- 客户端不写日志。返回值、异常文本、录制样例里 key 原文出现 0 次。测试证明 key 原文只出现在发往面壁的 `Authorization` 头（AC-59 ⑤ 的 worker 侧）。

### 响应

AC-59 ② 的 worker 侧，ARCHITECTURE §7.2：

- `choices[0].message.content` 再解析一次 JSON。
- `results[i]` 对应 `items[i]`。
- 上游 `verdict` 与原始分原样放进 `EvalOutcome`。
- `content` 解析失败时，整批记 `service_failed`。这一失败不带本客户端造的分数。
- §7.3 的 verdict 规范化留在 TS `quality/domain`，本 PR 不做。

### HTTP 错误

`quality/http_errors.py` 是纯规则，不 import `httpx`。映射成 ARCHITECTURE §7.9.5 的 `ProviderFailure`：`kind`、`retryable`、`retryAfterMs`、`httpStatus`、`vendorCode`、`requestId`。

| HTTP | kind | 规格里的后续 |
| --- | --- | --- |
| 400、422 | `invalid_request` | 不重试，记 `error/invalid_request` |
| 404 | `invalid_request`，`vendorCode` 为 `not_found` | 不重试 |
| 401、403 | `auth` | 不重试，整批 `unavailable`，原因 `auth` |
| 402 | `quota` | 不重试，整批 `unavailable`，原因 `quota` |
| 413 | `too_large` | 表内写拆半重试。见下一节的默认 |
| 429 | `rate_limited` | `retryAfterMs` 取自响应。字段名见「审查结论」 |
| 5xx，含用量无效的 502 | `service_failed` | 表内写有上限的退避 |
| 超时 | `timeout` | 表内写有上限的退避 |

响应头 `X-Request-Id` 记入 `requestId`。样例放 `fixtures/protocol/provider-errors/`，合成数据，无真实 key，无真实论文页。目录 README 记下上面的文档链接与查阅日期 2026-11-03。本 PR 只加 Python 断言。

### 重试

默认不重试是 Wisdom 2026-11-03 13:15 已定的行为，产品默认 `max_retries = 0`。不另写退避毫秒的产品默认值。

- 默认下请求只发出一次。413 记 `too_large`，不拆半。429、5xx、超时不再请求，也不睡一段自造的时间。
- 测试要走重试路径时，必须显式传入 `max_retries > 0`。退避毫秒只出现在该测试夹具里。
- 显式允许重试时，413 按规格拆半，拆半函数在 `batching.py`。429 只使用响应里已经给出的 `retryAfterMs`。
- 本 PR 没有 `BudgetGate`，不造额度信封。信封扣次留 M6a。与 §10.2「没有信封不得调用付费上游」的关系见「审查结论」。

### usage

AC-59 ⑥ 的 worker 侧：顶层 `usage.prompt_tokens` 原样放进返回值。响应没有 usage 时，不记成 0，不写单价。不写入预算账本。

### 本地桩

AC-103 ②③，AC-05 的 worker 侧：

- `local_engine` 与 `jev_http` 实现同一个 `QualityEvaluatorBackend`。
- `jev.route` 为 `'local'` 时，对 `api.modelbest.ai`、`api.modelbest.cn` 以及任何面壁 Jev HTTP 的调用为 0。不下载模型。
- 桩的结果是 `unavailable`，不带分数。缺凭据或桩失败都不把 route 改成 `'api'`。
- 本 PR 没有补救代码，因此不发出补救请求。
- 现有 import-linter 契约继续禁止两个后端互 import。按 `jev.route` 分支的模块见「审查结论」。`__main__.py` 本计划不改。

### 测量字段

`score` 的返回值带上：耗时、HTTP 状态、重试次数、`usage`、失败。不写诊断文件，不调用 `packages/platform-node/src/logging/value-guard.ts`，不新建事件名。

## 计划 / 实际

计划列在开工前填。实际列与证据在 Forge 通过之后填。参数超过 4 个时收成一个配置对象。普通文件硬上限 600 行，函数硬上限 80 行；`batching.py` 与 `http_errors.py` 仍是 Python core，不受 80 行，圈复杂度仍 ≤ 15。不加行数 allowlist。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | `batching.py`：按 64 分批；另给「拆半」，只在调用方显式允许重试时由 HTTP 模块使用 | `chunks` 默认 64。`split_in_half` 少于 2 项返回空，否则从中点切开。65 项为 64 与 1 | `tests/quality/test_batching.py` |
| 2 | `http_errors.py`：上表的纯映射。样例进 `fixtures/protocol/provider-errors/` | 纯映射，不 import `httpx`。`Retry-After` 支持秒数与 HTTP-date，解析不到为 `None` 且不重试。样例 13 个，只给 Python 断言 | `tests/quality/test_http_errors.py` |
| 3 | 新建 `quality/request_body.py`：只构造 `mode: "score"` 的请求体。纯模块，不 import `httpx` | 顶层只有 `model`、`messages`、`minicpm_ocr_jev`、`stream`。图片一律 `data:image/png;base64,`。有 `case_id` 才写入 | `tests/quality/test_request_body.py` |
| 4 | 新建 `quality/response_body.py`：二次解析 `content`，`results[i]` 对齐 `items[i]`，解析失败整批 `service_failed`，上游分原样 | `0.0` 与 `-1.0` 原样留下。`content` 不是 JSON 字符串、条数不符、布尔分都整批失败。缺 `prompt_tokens` 为 `None`，不记 0 | `tests/quality/test_response_body.py` |
| 5 | 新建最小 `QualityEvaluatorBackend`（`max_batch = 64`，`describe`，`evaluate`）。`describe` 只含部署、模型名 `MiniCPM-OCR-Jev`、base URL 所属站点。不填写未核实的权重 sha256，不填 `template_md5`。不手改 `protocol/`，不新建 `evaluate.ts`。文件位置见「审查结论」 | 放在 `quality/evaluator.py`。`evaluate` 只返回 `list[EvalOutcome]`。失败项不带分数，也不带上游 verdict。不建 `engines/base.py` | `oi_worker/quality/evaluator.py` |
| 6 | `jev_http.py`：httpx。测试注入 mock transport，未打桩的请求失败。缺凭据时请求数为 0。产品默认 `max_retries = 0`。`score` 返回结果里带测量字段；`evaluate` 按 §7.2 返回 `list[EvalOutcome]` | 未注入 transport 时 `_RefuseTransport` 拒绝联网。未打桩请求抛 `AssertionError`，不记成失败结果。缺凭据 0 次 HTTP。测量在 `JevScoreResult`：耗时、状态、`prompt_tokens`、失败、`retry_count` | `tests/quality/test_jev_http.py` |
| 7 | `local_engine.py`：同一 Protocol 的桩。`unavailable`，不带分数，面壁调用数为 0，不下载模型 | `deployment` 为 `local-stub`，`model` 与 `site` 为空。`attempts` 为空，`retry_count` 为 0。不 import `jev_http` | `tests/quality/test_local_engine.py` |
| 8 | 唯一按 `jev.route` 分支的模块。`'api'` 用 `jev_http`，`'local'` 用桩。两个后端互不 import。不因失败改 route。模块路径见「审查结论」 | `quality/select_backend.py`。`'local'` 不构造 HTTP 后端。其他取值 `ValueError("jev.route")`，不回显原值。`__main__.py` 未改。import-linter 增加 protected：只有 `select_backend` 可以 import 两个后端 | `tests/quality/test_select_backend.py`；G6 |
| 9 | 把 `httpx` 从 dev extra 升到运行时 `dependencies`。`uv.lock` 用 uv 重生成，不手改。G10 通过。`request_body.py` 与 `response_body.py` 加入 `python core forbids io` 的 `source_modules`（收紧，不放宽 forbidden 列表）。`package-aliases.json` 里 httpx、certifi 的理由不再写「不随应用发布」。不改白名单 | `httpx==0.28.1` 进入 `dependencies`，并从 dev extra 删除。`uv.lock` 只改依赖组。`evaluator.py` 一并列入禁止 IO 的源模块。别名只改第 43、49 行的 `reason`。白名单与 `dev-only.json` 未改。`check-license:pip` 通过 | `tools/check-license/package-aliases.json`；`docs/evidence/85/commands.md` |
| 10 | 测试放 `workers/parser/tests/quality/`，与包镜像。用例名 `<结果> when <条件>`，对应 AC 加编号前缀。假 key 只用 `oitest_` 前缀。不读源码做断言。无 `@live` 用例，产品代码不读 `MODELBEST_API_KEY` | 7 个文件、50 个用例。假 key 为 `oitest_jevclient`。全量 pytest 153 通过 | `docs/evidence/85/commands.md` |
| 11 | 每个实现 tip 全量跑一次 `pnpm run check`、`pnpm test`，以及 worker 的 pyright、ruff format、ruff check、lint-imports、pytest。日志写入 `docs/evidence/<PR号>/` | 在 `ad7d218` 各跑一次，退出码都是 0。非生成 diff 1578 行，提交说明有 `G12:` | `docs/evidence/85/commands.md` |

## 文件清单

实现提交 `ad7d218` 改了这些路径：

- `workers/parser/oi_worker/quality/batching.py`
- `workers/parser/oi_worker/quality/http_errors.py`
- `workers/parser/oi_worker/quality/request_body.py`（新）
- `workers/parser/oi_worker/quality/response_body.py`（新）
- `workers/parser/oi_worker/quality/evaluator.py`（新，Protocol 位置若改，以审查结论为准）
- `workers/parser/oi_worker/quality/backends/jev_http.py`
- `workers/parser/oi_worker/quality/backends/local_engine.py`
- `workers/parser/oi_worker/quality/select_backend.py`（新，装配分支若改，以审查结论为准）
- `workers/parser/pyproject.toml`
- `workers/parser/uv.lock`
- `tools/check-license/package-aliases.json`（只改已有两条理由的句子）
- `fixtures/protocol/provider-errors/`（新样例与 README）
- `workers/parser/tests/quality/`

不改：`__main__.py`、`api/`、`protocol/`、`contracts/`、`packages/`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/*`、`docs/spec-changelog.md`。不建 `utils` / `helpers` / `common`。不建 `quality/render/` 与 `self_check.py`。

## AC 对照

| 验收 | 本 PR | 延后 |
| --- | --- | --- |
| AC-59 ① | 请求形态、64 分批、`messages` 非空、PNG data URI、`mode: "score"` | `score_best*` 与 Docker 无前缀形态 |
| AC-59 ② | worker：二次解析、下标对齐、上游 verdict 与分原样、解析失败整批 `service_failed` | TS `quality/domain` 规范化 |
| AC-59 ③ | Python 映射与 `provider-errors` 样例。重试动作服从配置，产品默认不重试 | TS `packages/providers` 的断言；设置里的提示；额度信封扣次 |
| AC-59 ④ | worker：无凭据时对面壁请求为 0，结果 `unavailable/auth` | 外发同意 |
| AC-59 ⑤ | worker：假 key 只出现在发往面壁的 `Authorization` | 回环头的端点、远程 worker、renderer「已设置 / 未设置」、诊断包 |
| AC-59 ⑥ | 返回值里的 `usage.prompt_tokens` 原样；没有 usage 时不记为 0；不写单价 | 预算账本 |
| AC-59 ⑦ | 不做 | M6a，`evaluatorVersion` 不改写旧结果 |
| AC-103 ②③ | 同一 Protocol；`'local'` 对面壁调用为 0；失败 `unavailable`；不回退 |  |
| AC-103 ①④ | 不做 | M6a 的设置键校验与外发对话框 |
| AC-103 ⑤ | 两个后端互不 import；只有一处按 `jev.route` 分支 | 本机推理替换桩时的 diff 路径检查 |
| AC-05 | worker 自己产生的 `unavailable` / `error` 不带分数，且本 PR 没有补救请求 | 完整补救链路在 M6a |
| 测量 | 返回值暴露耗时、HTTP 状态、重试次数、usage、失败 | runner、诊断事件、`docs/acceptance/` |

## 依赖

httpx 已在锁文件里，给 FastAPI `TestClient` 用。本计划把它升为运行时依赖。Wisdom 2026-11-03 13:15 指定用它。

| 项 | 内容 |
| --- | --- |
| 用途 | `jev_http` 的 HTTP 传输。测试用 `httpx.MockTransport`，CI 不连外网 |
| 许可证 | httpx 0.28.1 为 BSD-3-Clause。`tools/check-license/package-aliases.json` 已把 pip-licenses 的 `BSD License` 记成这个 SPDX。传递依赖 httpcore、h11、anyio、idna 在白名单内。certifi 2026.10.23 是 MPL-2.0，白名单已含 MPL-2.0。升到运行时之后只改了 httpx 与 certifi 两条 `reason`，白名单未改 |
| 体积 | 锁里的 wheel：httpx 73517 字节，httpcore 78784，h11 37515，certifi 135082，idna 69583，anyio 134521。升组不引入新的包名 |
| 替代 | 标准库 `urllib`。Q9 已指定 httpx，本计划不改选 |

G10 在 `ad7d218` 通过，没有改白名单。这是「审查结论」的第 6 条。

## 不做

- `POST /v1/jobs` 的 `evaluate`、作业 JSON、SSE、额度信封接线。
- `contracts/src/worker/evaluate.ts`、`packages/providers`、`settings/domain/backend-choice.ts`。
- 外发对话框、`BudgetGate`、verdict 规范化、`evaluatorVersion` 改写旧结果。
- 模型下载、本机推理、`quality/render/`、`self_check.py`、自建 Docker 端点。
- 读 `MODELBEST_API_KEY` 的产品代码或 `@live` 冒烟。
- Python 值守卫、诊断事件、测量 CLI。
- 手改 `oi_worker/protocol/`。改 DESIGN、`docs/design/**`、`.cursor/*`、CI 行为、分支保护。

## 审查结论

Forge 2026-11-03 审查 `9a1e4c5` 通过，九条按下面执行。本计划不再留开放问题。

1. 上游 `0.0` / `-1.0`：worker 原样上报，含 `providerVerdict`。丢弃只在 TS `quality/domain`。
2. `fixtures/protocol/provider-errors/`：本 PR 只做 Python 断言。TS 侧留 M6a。
3. 按 `jev.route` 分支的模块是新建的 `quality/select_backend.py`。`__main__.py` 不改。import-linter：只有 `select_backend` 可以同时 import 两个后端。
4. `QualityEvaluatorBackend` 只放 `quality/evaluator.py`。不建 `engines/base.py`。
5. 测量字段放 `score` 的返回值。`evaluate` 仍只返回 `list[EvalOutcome]`。
6. 只改正 certifi / httpx 的别名理由。不改许可证白名单。改动的两行写在 PR 描述里。
7. `retryAfterMs` 只解析响应头 `Retry-After`。秒数与 HTTP-date 都支持，解析不到为 `None`。解析不到时不自造等待，按不重试处理。
8. 本 PR 只做 `mode: "score"`。`score_best` / `score_best_batch` 不算漏测，在 `docs/backlog.md` §4 记一行。
9. 本 PR 不提供任何作业端点，不从产品路径调用付费上游。客户端模块 docstring 写明调用方必须先持有 §10.2 额度信封，信封扣次在 M6a 作业层。真实网络调用 0 次。

## 证据链接

- `docs/evidence/85/commands.md`：`ad7d218` 上的 node 与 python-worker 命令和退出码。
