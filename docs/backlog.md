# 待办与架构评审处理状态

状态：v0.6。当前版本仍是 v0.6，本文件不升这个号。变更指针：[spec-changelog.md](./spec-changelog.md)。日期：2026-11-04（Asia/Shanghai）。2026-10-31 补了诊断日志的规格状态（§4 新行、§6 的诊断事件枚举那条 P2-8）。同日把调试日志写成最多 7 天、总量上限 50 MB（先到先清）。§4 另有一行请 Loom 改 MD-16 的 test:core 措辞。同日 13:14 的决定记在 §10，不重开 Q3、Q5、D-D、D-E、W-4。2026-11-02 20:37 起，延期未修的审查或 QA 项按 [WORKFLOW.md](./WORKFLOW.md)「延期」记 Issue 并在 §4 加行。同日补上 #59、#61、#62、#33，并把 #60 写入已有的 `BaseHTTPMiddleware` 行。同日 Electron 外壳延期三条：#66、#67、#68。2026-11-03 补上 #76、#80。同日 10:40 Wisdom 批准 platform-node → contracts 值导入，记在 §12，ARCH §5.1 补 `PN --> C`。同日 PR #85 把 `score_best` / `score_best_batch` 记入 §4，Issue #86。同日核对 #80–#87：#80、#86 已各有一行。#81、#82、#84 已关闭，不加行。补 #83、#87。2026-11-04 补 #102 连着推 main 时 pending 被顶替、#106 缺 `bin.depcruise` 与 macOS 不跑 `check:deps`、#109 空 ID、#111，以及 `desktop-e2e-windows` 仍不是必需检查。G3、G5 已在 §7，不另加行。§10 的暂停句因 M1 已开工改记状态。同日按 Anvil 把 #33 的两条健康检查改记为已是 required（本代理再查分支保护仍是 403，不改设置）。同日 PR #122：§4 条目 4 改为已登记；§7 E-P1-1 记下 ADR 0002、0003，第一批其余项仍未建页。
用途：逐条记录[架构评审](./reviews/2026-10-30-architecture-review.md)的每个发现由哪个规格 PR 处理、落在规格哪里，以及还没处理、留给哪个里程碑的事。决定的理由见[差异清单](./v2-gap-and-changes.md) §6.6–§6.13；本文只记状态，不重述规格。§5 记 Jev 开关审查（2026-10-30 22:06）各项的处理状态。§8 收录还要等 M0 的项，也记下已经拍板的项（2026-10-31 01:08 建表；同日 D-D、D-E 与 W-4 的过渡默认已决定）。未决的行不代选。2026-11-04：§7 E-P1-8 改为已处理，验收结果格式在 `docs/acceptance/`，不预填数字。

三个规格 PR：

- **PR A**：架构评审修复 A（Wisdom 2026-10-30 19:57 批准，20:57 定下待定项；差异清单 §6.6）。
- **PR B**：架构评审修复 B 与服务商适配层（Wisdom 2026-10-30 19:45、19:46、19:57；差异清单 §6.7）。
- **PR C**：阅读顺序、M6 拆分、BabelDOC 借鉴与评审其余项（Wisdom 2026-10-30 21:12；差异清单 §6.8）。

「已处理」指规格已写明做法与验收；实现仍在对应里程碑。

## 1. P0

| 编号 | 发现 | 状态 | 落点 |
| --- | --- | --- | --- |
| P0-1 | 解析流水线没有归属切片 | 已处理（PR A） | ARCH §2.5、§4.2 `ingest`、§4.3、F-17；PRD §4 原则 3 |
| P0-2 | 不能把整个 application 搬进 utility 进程 | 已处理（PR A） | ARCH §1、§9 |
| P0-3 | 默认付费路径不受预算停机约束 | 已处理（PR A） | ARCH §7.8、§4.2 `budget`；PRD AC-06、AC-63 |
| P0-4 | `oi-md/1` 表达不了未核验公式的裁图 | 已处理（PR A） | ARCH §8.1.1；PRD AC-04、AC-48、AC-49 |
| G17 | 同一 PR 改 UI 与 core 即失败 | 已删除（PR A）；PR C 用 G18「一个 PR 一个切片」拦住「改 UI 又改另一个切片的 core」 | ARCH §13；RULES §2、§8 |

## 2. P1

| 编号 | 发现 | 状态 | 落点 |
| --- | --- | --- | --- |
| P1-1 | 外发同意的验收句子和决定正文不一致 | 已处理（PR B） | ARCH §7.0 第 6 条；PRD §3.3、AC-61 ⑦ |
| P1-2 | 外发同意没有端口 | 已处理（PR B） | ARCH §7.0 第 6 条、`EgressCheck`；PRD AC-65 |
| P1-3 | 远程 worker 不应收到用户的 Key | 已处理（PR B） | ARCH §10.1、§10.2；PRD AC-65 |
| P1-4 | 决策记录里还留着被取代的句子 | 已处理（PR B）；PR C 照同一做法删除被取代的句子 | 差异清单 §6.7、§6.8 |
| P1-5 | 阅读顺序两套实现，没有对拍夹具 | 已处理（PR C）：主顺序取版面模型，`engines/reading_order/` 校验与兜底；文字层基础档实现同一规则集的共有部分，以 `fixtures/parsing-rules/` 对拍 | ARCH §7.10；PRD AC-68–AC-71；RULES §2、§5 第 19 条 |
| P1-6 | 借用多模态翻译没有放置位置 | 已处理（PR C）：装配期复用，没有 `translation → repair` | ARCH §4.3；PRD AC-78 |
| P1-7 | Markdown 两条解析路径，与 IPC 体积冲突 | 已处理（PR C）：`pure.ts` 不导出解析器，G15 加检查，`readFile` / `readBlocks` 块窗口 | ARCH §4.5.3、§4.5.4、G15；PRD AC-79 |
| P1-8 | HTTP 错误映射写在三处 | 已处理（PR B） | ARCH §7.9.5、`ProviderFailure` |
| P1-9 | 存储与协议不能独立升级 | 已处理（PR B） | ARCH §8.4、§10.4；PRD AC-66 |
| P1-10 | Electron 安全基线缺口 | 已处理（PR B） | ARCH §9；PRD AC-67 |
| P1-11 | 门禁把「一个切片」和「一个 PR」焊反了 | 前半（G17）已处理（PR A）；后半已处理（PR C）：热点收窄为装配根、`slots.ts` 与被两个以上切片 import 的契约文件，契约 PR 上限 200 行，新增 G18，M1 违规样例改写 | ARCH §13 G11、G12、G18；RULES §2、§3；PRD AC-80、M1 |
| P1-12 | M6 承担了「公式变成已核验」的全部前提 | 已处理（PR C）：M3 加评分状态机与假评估器；M6 拆为 M6a–M6d；托管 API 核实通过前不建后端文件 | ARCH §7.1「评分分期」、§7.0、§10.3；PRD AC-84、§8 |

## 3. P2

| 编号 | 发现 | 状态 | 落点 |
| --- | --- | --- | --- |
| P2-1 | 函数 80 行和「深模块」互相拉 | 已处理（PR C）：domain 纯函数只受文件上限，一个不变量一个文件 | ARCH §6；RULES §1.3；PRD AC-80 ④ |
| P2-2 | UI 事件总线能绕过依赖矩阵 | 已处理（PR C）：登记发布方与订阅方，载荷只能是普通数据，新增事件要 ADR | ARCH §4.3、§5.3、G5；PRD AC-82 |
| P2-3 | 历史草案的表格仍像现行需求 | 已处理（PR C）：表格上方加一句说明 | `docs/architecture/README.md` |
| P2-4 | 诊断包体积沿用 v1 | 已处理（PR C）：保留天数与体积可设置，默认值 M2 实测后定标 | ARCH §11；PRD AC-83 |
| P2-5 | CI 没有操作系统矩阵 | 已处理（PR C）：Linux 全部门禁 + Windows 无模型的 worker 健康检查与两侧夹具 | ARCH §13；PRD AC-80 ⑤ |
| P2-6 | 本机 worker 的监管状态机 | 已处理（PR C） | ARCH §10.5；PRD AC-81 |
| P2-7 | OpenAI 兼容子集可以先定 | 已处理（PR C）：`fixtures/providers/openai-chat-baseline/`，M4 之前建 | ARCH §7.9.7 |
| P2-8 | 录制样例不要带上真实论文页 | 已处理（PR B 的 §7.9.7 与 PR C 的 §12 统一规则） | ARCH §7.9.7、§12 |
| P2-9 | 仓库现状与 M1 目标的落差 | 不需要改规格（评审结论是预期的落差）；M1 当天引入 pnpm、Vitest、uv | PRD §8 M1 |
| P2-10 | 规格写法在制造漂移 | 作为写法执行（PR B、PR C）：删除被取代的句子，不追加「后来改为」；拆分规格文件等 M1 的 ADR 目录建立后再议 | 差异清单 §6.7、§6.8 |

## 4. 留给实现里程碑的事

| 事项 | 里程碑 | 出处 |
| --- | --- | --- |
| 阅读顺序实测：AI Studio 托管 API 是否带阅读顺序。PP-DocLayoutV2、V3 开源本机推理推迟，M0/M1 不下载、不跑 | AI Studio 一半仍是 M0（待执行，M3 开工前完成）。开源本机一半随本地路线推迟（Wisdom 2026-11-02） | PRD §8 M0；差异清单 §6.15、§7 |
| V3 不带顺序时标准档的顺序来源；高质量档是否改用 V2 | 实测后由 Wisdom 定 | ARCH §7.10「未决」 |
| 阅读顺序校验、题注绑定、扫描页判定、段落切分的阈值 | 基准定标（M3） | ARCH §7.10、§7.11；PRD QM-01、QM-02 |
| 百度 AI Studio PaddleOCR 托管 API 能否作为引擎 A 的来源 | M3 开工前 | ARCH §7.0；差异清单 §2.4.1 |
| worker 监管的重启上限与超时默认值 | M3（supervisor 实现 PR） | ARCH §10.5 |
| 产品诊断日志的保留天数与体积默认值 | M2 实测后。调试日志已定：最多 7 天，总量上限 50 MB（先到先清）；用户可随时清空；关闭调试模式时询问是否删除。不套用到产品诊断日志 | ARCH §11；PRD AC-101 |
| 诊断日志代码（白名单枚举、`Logger`、解析 / OCR / 翻译的 run 打点） | M1。规格已写入 ARCHITECTURE §11（Wisdom 2026-10-31）。仓库还没有 `packages/`，不在规格 PR 里建 `contracts/src/diag-events.ts` | ARCH §11；PRD S10、US-14、AC-101 |
| 一键导出诊断包与诊断页 | M2。记录骨架不提前到导出 UI | PRD US-14、AC-09、AC-10、AC-83 |
| 接 LangSmith 等云端追踪、默认对外上报日志、把文档全文写入日志 | M0/M1 明确不做。真遇到问题再评估 | ARCH §11；PRD AC-101 ④ |
| 请 Loom 更新 `docs/design/md-reader.md` MD-16 的 `test:core` 措辞 | Loom。N-10，agent 不改该文件。M1 前按 AGENTS.md：此项写不适用（脚本尚未提供）；M1 起以 package.json 实际脚本为准 | MD-16；AGENTS.md 命令节 |
| Markdown 块窗口预算的默认值 | M2 实测后 | ARCH §4.5.3 |
| 首批 ADR：G18、`ui-events-declared`、`supervisor-state`、解析规则集 `oi-rules/1` | M1 建立 `docs/adr/` 时 | ARCH §16 |
| 高质量档是否开放 | M6d，QM-13 由用户拍板 | PRD §8 M6d |
| 「源码核对」是否改算「已核验」 | 见 §8 W-5。本节不另写选项 | ARCH §7.5「唯一决定点」 |
| 手动「重新识别」是否保留 | 见 §8 W-1。开关开着时进不进得去见同节 D-F | PRD AC-90 |
| 切换路线后已处理论文是否自动重跑；能否按篇切换 | 见 §8 W-2、W-3 | ARCH §7.12；PRD §3.5 |
| 正式全局默认预设与来源优先级的默认顺序 | 见 §8 W-4。过渡默认预设已定为 `multimodal-layout`（Wisdom 2026-10-31）；来源优先级仍未决 | ARCH §7.12、§7.1；PRD AC-86、AC-91 |
| 程序核对「与文字层或邻近内容一致」的重合比例阈值 | 基准定标（M4） | ARCH §7.5；PRD AC-89 |
| 本机 PP-DocLayout（含 8 GB CPU 上的冷启动、单页耗时、峰值内存、是否 OOM） | 推迟，不是 M0/M1 门禁（Wisdom 2026-11-02）。只留 `LayoutEngine` 端口和 stub，不下载模型。标准档仍是 V3。plus-L 仍按 Q10、QM-13，不在本机 CPU 上作为 M0 测量。M0 改测面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）；Key 不在时标「未核实」，不预填数字 | PRD §8 M0、§9；差异清单 §6.15；ARCH §7.12 |
| 订阅、按账号计费、账号系统、自有托管服务端 | 不进 v2。只预留 `AccountSession` 与 `account-token` 鉴权方案 | PRD §3.2、AC-94；ARCH §7.9.5 |
| 评分开关、三选一提示、「未评分」「源码核对」「格式已核对」徽标与「为本文评分」入口的布局与文案 | 待 Loom；M6a 实现。规格只暂定「格式已核对」这几个字，不写颜色、位置或图标 | PRD §3.4、AC-85、AC-87、AC-89 |
| 「明确不确定证据」作为补救入口的证据清单与验收 | 未定义，定义前不作为入口；需要时另开规格 PR | ARCH §7.1「低分再补」；差异清单 §6.9 第 8 条 |
| 协议代码生成与其后的 worker 切片 | M1 前提。Forge 排序（2026-11-02，不是业主决定）：契约（#55）→ 代码生成与 worker 健康检查（#56）→ FastAPI、`__main__` 与 Windows 健康检查（#58）。代码生成必须先于任何使用协议模型的 worker 切片。`run.mjs` 生成 `workers/parser/oi_worker/protocol/`，datamodel-code-generator 钉 0.87.0（`tools/codegen/pin.json`） | PRD §8 M1；ARCH §10.1、§10.2、§10.4、§13 G7、F-11 |
| 把 `LaunchBearerMiddleware` 从 `BaseHTTPMiddleware` 换成纯 ASGI 中间件 | SSE 之前。`BaseHTTPMiddleware` 会缓冲请求体，不适合 `GET /v1/jobs/{id}/events` | ARCH §10.2；#58、#60 |
| 接管前收到 SIGINT / SIGTERM 时 worker 退出码非 0（130 带 `KeyboardInterrupt` 回溯，SIGTERM 为 143）。退出码 0 依赖 uvicorn 0.38.0 恢复信号处理再重新抛出。测试里等 `oi-worker-before-hold` 再发 SIGINT 已由 #107 改完，退出码没改 | M3（supervisor 实现 PR）一起改产品行为。桌面端不要把 130 / 143 当成崩溃 | #59；ARCH §10.1、§10.5；#107 |
| PR #55 / #56 审查 P2：`read*` 运行时校验的归属（条目 4）已登记；主版本不符时作业数为 0（条目 7，随 jobs API）仍开放。条目 2、3、5 已由 #96 收口。条目 1 与 6 已由 #109 收口：六个 `parse*` 对字符串打品牌，空字符串仍合法；`workerVersion` 的 pattern / maxLength 只从 schema 读。空 ID、空白 ID 与没有 maxLength 见下面的 #109 行 | 条目 4 已登记：三个 `read*` 与 schema 放在 `packages/contracts/src/worker/`（ARCHITECTURE §4.1；Wisdom 2026-11-04 05:26 批准 #61 第 4 条方案 A，PR #122）。条目 7 随 jobs API | #61；#96；#109；#122 |
| macOS 上的 worker 健康检查；`server.py`、`loopback.py`、`listen_port.py` 是否从 `api/` 移到 `oi_worker/runtime/` | 健康检查 job 与必需检查已在 main@d411710 完成。三个文件留在 `api/`，不搬。理由：jobs 尚未落地（`oi_worker/jobs/__init__.py` 只有分层占位，没有 jobs API）；ARCHITECTURE §10.3 把 HTTP 适配、端口和退出放在 `api/`，`runtime/` 是模型清单、设备探测与内存限制。以后 jobs PR 若仍要搬，先改 §10.3 和 import-linter，不在 #62 做。Forge 2026-11-03 按 #62 验收（注明不做理由）批准，待 Wisdom 合入确认 | #62；ARCH §10.3 |
| 把 `CI / node`、`CI / python-worker`、`CI / worker-health-windows` 与 `CI / worker-health-macos` 设为必需检查 | 以 2026-11-04 Anvil 查到的分支保护 API 为准：四条都已是 required。2026-11-04 本代理再查 `GET repos/wisdom-km/open-immerse-v2/branches/main/protection` 仍是 403。不改任何设置（N-02）。Issue #33 仍 OPEN，正文还要 `MODELBEST_API_KEY` | #33 |
| Linux 与 macOS 的 Playwright Electron 冒烟。外壳 PR 只在 `windows-latest` 跑。不加 xvfb，不改 `.cursor/install.sh` | 外壳开窗之后。不并进 #30（那是 M2 改 `.cursor/*`） | #66；PRD AC-67 ①；ARCH §9、§15.2 |
| 由契约生成 preload，不手写 IPC。外壳 PR 只暴露空的 `window.oi` | 另立 PR。现有 codegen 只生成 worker 协议 | #67；ARCH §9；G7 |
| 打包时按 ARCHITECTURE §9 设置 Electron Fuses。`EnableEmbeddedAsarIntegrityValidation` 各平台是否支持仍未核实 | M8。验收 AC-67 ③ | #68；ARCH §9 |
| Python worker 把结构化 JSON 写到 stderr，supervisor 收集并加上 `source: worker`。字段服从诊断事件白名单和禁止项。落地时要把 `source: "worker"` 纳入允许字段，避免读入时丢掉 | M3（与 supervisor 一起） | #73；ARCH §11 |
| 关闭调试模式前询问是否删除调试日志。M1 只把 `deleteFiles` 作为 `setDebugMode` 的参数，不画界面 | M2，交 Loom | #75；ARCH §11；PRD AC-101 ② |
| 诊断日志白名单字段值加长度/格式约束，并在落盘前脱敏 | M1 PR-B（`feature/m1-logging-impl` / PR #77） | #76；来源 PR #74 Anvil 低风险；ARCH §11、§7.9.5 |
| oi-app 协议按扩展名设置 Content-Type（`static-file.ts:19` 固定 text/html），并加 `X-Content-Type-Options: nosniff` | M2（开始服务非 HTML 资源时） | #69；PR #65 Forge 审查 + Anvil 低风险 |
| 打包后 renderer 路径 `dist/../../src/renderer` 失效 | M8 | #70；PR #65 Anvil 低风险 |
| desktop e2e 覆盖权限 check handler（`navigator.permissions.query`）并把单个冒烟测试拆开 | 本 PR #78 处理 | #71；PR #65 Forge 审查 |
| `app-protocol.ts` 的 `readUrl`/`readMethod` 透传内联 | 本 PR #78 处理 | #72；PR #65 Forge 审查 |
| app-protocol 的 `respond()` 返回的 HTTP 状态码（405/404）缺测试 | M1 | #80；来源 PR #78 计划审查 |
| `score_best` 与 `score_best_batch` 的请求形态。M1 客户端只实现 `mode: "score"`，这两种不算本 PR 漏测 | M6a | #86；PR #85 Forge 审查（2026-11-03）；ARCH §7.4 |
| 把「Cloud Linux 无法运行 Electron e2e」改成两件事实：Linux 上 `xvfb-run` 能跑；CI 仍只跑 `desktop-e2e-windows`。不改 CI，不改 `.cursor/*` | 本 PR 处理 | #83；来源 PR #78 Anvil。Linux 与 macOS 的 CI 冒烟仍是 #66 |
| `workers/parser/tests/test_import_gates.py` 与 `test_ruff_gates.py` 用裸 `uv` 起子进程。Windows 的 PATH 没有 `uv` 时 WinError 2 | M1 | #87；来源 PR #85 Anvil，tip `3eca4fc`。两文件不在该 PR 的 diff 里 |
| 连着推 `main` 时，进行中的那次不取消；已经 `pending` 的上一次会被更新的一次顶掉。`cancel-in-progress` 在 `refs/heads/main` 的 push 上为假。工作流没有 `queue` 键，GitHub 默认 `queue: single`（同组最多一个 pending）。要保留每一次 main 运行必须改工作流 | 未决。Agent 不改 CI（N-02） | #102 |
| `bin.depcruise` 缺失时 `tools/check-deps/launch-depcruise.mjs` 的 `depcruiseEntry()` 抛出 `dependency-cruiser bin.depcruise was not found`（找不到包，或 `bin.depcruise` 不是非空字符串）。单测只覆盖装好包之后的启动参数，没有缺 bin 的用例。`check:deps` 与 `tools/check-deps` 的 Vitest 只在 `worker-health-windows` 上跑（#108，`matrix.os == windows`），macOS 未跑。Windows 上 `node_modules/.bin/depcruise` 的 ENOENT 已由 #100 / #106 收口，issue #99 已关闭 | 缺 bin 的单测与 macOS 上的 `check:deps` 仍未做。不改 CI（N-02） | #106；#99；#108 |
| 六个 `parse*` 接受空字符串（`packages/contracts/test/ids.test.ts` 断言 `parseDocumentId("")` 为 ok）。空白字符串同样是 string，`parseId` 只拒绝非字符串，测试没有单独断言空白。`workerVersion` 没有 `maxLength`：64 与 65 个 `a` 都通过；`""` 与带尾随空格的版本串被 pattern `^\S+$` 拒绝。§10.4 只记下 schema 现况 | 未决。不在这里选定字符集或 64 字上限，也不把空 ID 判成非法 | #109；ARCH §10.4 |
| `check:format` 是否因 Prettier 3 默认读取 `.gitignore` 而忽略产物目录，本仓库还没测。`.prettierignore` 列了 `.github`、Markdown、json、yml、`tools/gate-fixtures`。`.gitignore` 已含 `dist/`、`test-results/`、`coverage/`。新的产物目录（`out/`、`release/`、生成的 `.js`）若两份忽略都没有，`pnpm check` 的 `check:format` 会失败 | M8 打包前核对。低优先级，不挡 M1。建议：`dist/` 下放不合格式的 `.js` 时 `check:format` 仍通过；M8 新目录同时进 `.gitignore` | #111；来源 PR #110 Anvil |
| `desktop-e2e-windows` 在规格里写明不是分支保护的必需检查。要不要改成必需是 Wisdom / 仓库管理员的决定，本行不是该决定。2026-11-04 用分支保护 API 核对现场名单时返回 403（`repos/wisdom-km/open-immerse-v2/branches/main/protection/required_status_checks`，`Resource not accessible by integration`；GraphQL `branchProtectionRules` 为 FORBIDDEN；rulesets 为空），现场必需名单没有重新核对 | 未决。Agent 不改分支保护（N-02） | #65、#74、#95、#105；`docs/ci-and-environment.md` |
| Issue #35 门禁收尾。条目 1 已由 #104 收口：RULES §1.5 按包名放行 PSF-2.0，`tools/check-license/dev-only.json` 点名 `typing_extensions`。条目 4 已收口：`tools/check-secrets/leak.test.ts` 有 `nottest_` 反例，`countsAsCi` 把非空且不是 `false` / `0` 的值都算 CI。条目 2：真实切片树上证明 UI 导入另一切片 application、导入 ingest、跨切片内部、G18，以及 `pure.ts` 能导入、不能到达 application / `node:fs` / domain。条目 3：删掉 `job-id.gen.ts` 占位复制，`jobs` 的 `JobId` 与 `parseJobId` 来自 `packages/contracts/src/ids.ts` | 条目 2、3 由本分支收口。不改门禁规则，不改 `packages/contracts/**` | #35 |

## 5. Jev 开关审查（2026-10-30 22:06）的处理

审查只读；Wisdom 22:15 定下质量评分开关（差异清单 §6.9），并让「必须改」四项与「建议改」第 1 项一起修。其余项不在这次范围内，留在这里。

| 档 | 发现 | 状态 | 落点 |
| --- | --- | --- | --- |
| 必须改 1 | 评估状态集合不一致（三种 / 四种），「待评分」一词两用 | 已处理：规范状态四种，「待评分」「未评分」是界面标记 | ARCH §4.1 `evaluation.ts`、§7.1「评估状态与界面标记」；PRD AC-18、AC-84、§10 |
| 必须改 2 | ARCH §7.1「补救时序」与流程图矛盾 | 已处理：只有要补救的区域等补救，「待评分」「未评分」照常翻译 | ARCH §7.1「补救时序」 |
| 必须改 3 | 补救入口说法不一（「有明确不确定证据」与「只由有效低分触发」） | 已处理：统一为有效低分，按最保守的读法 | PRD S4、S5、M6c；ARCH §4.2 `repair`、§7.1、§7.5 |
| 必须改 4 | 正文与表格在多个来源之间怎么采用没有规则 | 已处理：`document/domain/region-selection.ts` | ARCH §4.2 `document`、§7.1「没有有效分数时的采用」；PRD AC-86 |
| 建议改 1 | PRD §3.3「多模态补救」一行引用 AC-07（超时不重发） | 已处理：改指 AC-05、AC-06。自动补救设置行已补上，默认开（Wisdom 2026-10-30 23:55） | PRD §3.3、AC-98 |
| 建议改 2 | M6a 名为「质量评分与预算」，但 `budget` 在 M3 已交付 | 未处理 | PRD §8 M6a |
| 建议改 3 | 把「部分用户找不到充值入口」作为用户反馈补进差异清单 §7，状态仍为未核实 | 未处理（§6.9 背景里已记这条反馈，§7 表未动） | 差异清单 §7 |
| 建议改 4 | AC-20 的「用户关掉 API 来源」没有对应设置项，易与「关闭评分」混淆 | 已处理：改成「选了本地」或「外发同意是拒绝」 | PRD AC-20 |
| 建议改 5 | 评估原因码散在各节，建议集中成表 | 未处理 | ARCH §4.1 `evaluation.ts` |
| 可延后 1 | 三份规格的版本头太长 | 已处理（Wisdom 2026-10-31 13:14，即 §6 P2-3）。版本头收成「当前版本 + 变更指针」，历史句子留在 PRD §9 与 ARCHITECTURE §16。版本号仍是 v0.6 | PRD、ARCH、差异清单第 3 行 |
| 可延后 2 | QM-03、QM-04 不按评分开关分开报告 | 已处理（随「源码核对」一起改口径） | PRD QM-03、QM-04、QM-12 |
| 可延后 3 | US-20 与两处 Q1 的措辞 | 已处理（开关直接影响这几句，随决定一起改） | PRD §9、US-20；差异清单 §6 Q1 |

## 6. 全面审查（PR #11，2026-10-30）

P0 已按 Wisdom 2026-10-30 23:55、23:56 写入规格（差异清单 §6.11）。P1 的逐条落点见下表（Wisdom 2026-10-31 00:21）。P2 不在这次改规格正文。P2-10 例外：23:55 明确要求 PR 模板，所以模板已经加上，不留在 P2 表。

### P1

| 编号 | 落点 | 状态 |
| --- | --- | --- |
| P1-1 | ARCHITECTURE §7.12 `RouteConfig`；§8.4 `ing_route` 的 `schemaVersion` 与 `ParseRun` 路线快照。换预设不迁移文档模型 | 已处理 |
| P1-2 | ARCHITECTURE §7.4「评分开关」、§7.12；PRD AC-85 ①、AC-97。读的时候开关优先，两处都不自动改写 | 已处理 |
| P1-3 | ARCHITECTURE §4.2 `ingest` 行：`open-document.ts` 只取路线、循环 `ingest-policy`、调切片 `index.ts`；步骤在 `ingest-steps.ts` | 已处理 |
| P1-4 | ARCHITECTURE §7.4「锁定版本」；PRD AC-99、M0。当前锁 `1269e4f`，复核只记差异，更换须先对比并单独开 PR | 已处理 |
| P1-5 | ARCHITECTURE §8.1.1 `ProviderFailure.kind` 到 `failureKind` 的表。与 P1-13 同一张表 | 已处理 |
| P1-6 | ARCHITECTURE §8.1.1「提示词正文只在一处」：`packages/features/translation/src/domain/prompts/`，文件头 `promptVersion` | 已处理 |
| P1-7 | ARCHITECTURE §12.1 `EvalRecord` | 已处理，算完成。形状已写：文献 id、PDF sha256、路线 id、各来源请求数、评估状态计数、显示决定计数、失败原因码；合成样例位置与 v1 语料只读 clone 也写了。不填数字。`fixtures/eval/` 里的样例文件和 `docs/acceptance/` 目录不在这条改法里，留到 M0（§7 E-P1-8） |
| P1-8 | ARCHITECTURE §7.8 第 4 条；`budget/domain/default-caps.ts` | 已处理，算完成。占位上限的计量单位必须覆盖每页区块请求，这一句已经写上。具体 N 不是这条的完成条件，留到 M0 之后经 Wisdom 批准再写入，批准前不得自填（N-14） |
| P1-9 | PRD §3.3「自动补救」行，默认开；AC-05 的「补救关闭」指这一行；AC-98 | 已处理 |
| P1-10 | RULES N-22；docs/ci-and-environment.md「当前是空跑」；README「CI 与云端环境」。`eslint.config.js` 按审查留到 M1，不在这条里改 | 已处理 |
| P1-11 | README 阅读顺序；AGENTS.md；.github/ISSUE_TEMPLATE/task.md；.github/PULL_REQUEST_TEMPLATE.md。审查里的 `.cursor/rules` 是可选，没有加（N-11） | 已处理 |
| P1-12 | PRD AC-20；ARCHITECTURE §7.4 推荐规则 1。没有名为「关掉 API 来源」的总开关 | 已处理 |
| P1-13 | 与 P1-5 同一张表：ARCHITECTURE §8.1.1。解析、OCR、Jev 的用户可见词只有校验失败、网络错误、模型错误 | 已处理 |
| P1-14 | DESIGN.md 文首（第 16 行）仍写「Loom 交付前 UI 只搭结构」。RULES 文首已写以 RULES 为准 | 已处理 @ PR #14（main@eb87d53） |
| P1-15 | README「历史草案」。该目录不授权实现，冲突时以根目录三份规格为准 | 已处理 |

### P2

| 编号 | 发现 | 状态 | 留给 |
| --- | --- | --- | --- |
| P2-1 | M6a 标题仍写「质量评分与预算」，预算在 M3 | 未处理。标题改为「质量评分」，正文里的 `BudgetGate` 接入保留，不改里程碑依赖 | M6a 开工前的规格整理 |
| P2-2 | 评估原因码散落，没有总表 | 未处理。不新增原因码。在 `contracts` 拟议处列一张现有原因码表，正文改成引用 | M3 写 `evaluation.ts` 时 |
| P2-3 | 规格版本头仍是 v0.6，内容已经超出 | 已处理（Wisdom 2026-10-31 13:14）。版本头收成「当前版本 + 变更指针」，历史句子留在 ARCHITECTURE §16 与 PRD §9。版本号仍是 v0.6，不在这次升 | 本次规格 PR |
| P2-4 | `account-token` 没有出现在 §7.9.2 的目录树 | 已处理（Wisdom 2026-10-31 13:14）。目录树补了 `auth/account-token.ts`。v2 调用仍返回 `not_in_v2`，与 AC-94 ③ 同一条验收。文件本身留到 M1 写 providers 目录时再建，本 PR 不建代码 | M1 写 providers 目录时 |
| P2-5 | 发版与坏模型停用没有清单 | 未处理。M8 前在 `docs/` 加一页发布清单，并在 `quality` 的部署规则里留「停用某个 `evaluatorVersion`」的配置位。已有记录不改写 | M8 前 |
| P2-6 | 第三方模型条款只写到「外发前询问」 | 未处理。外发同意里加一句：本应用不把用户文献或模型输出上传去做训练；回归集只用合成夹具或用户明确放入 `fixtures` 清单的文件。某家 ToS 禁止保存输出时标「未核实」，不编造 | 外发同意的下一次规格整理 |
| P2-7 | 许可证机器检查还只有包名字符串 | 未处理。保持到 M1。M1 的门禁 PR 必须包含 G10（license-checker 与 pip-licenses），不只保留字符串 grep | M1 |
| P2-8 | 诊断事件没有枚举 | 规格已写入 ARCHITECTURE §11 @ PR #16（Wisdom 2026-10-31）。白名单方向：外发询问、预算拒绝、上游 5xx 的 request id、评分不可用，以及解析 / OCR / 翻译的 run 日志（`pipeline.run`）。未列入的事件名不得出现在日志调用里。实现是 M1 代码跟进，本 PR 不写 logger | M1 代码（规格在 M0） |
| P2-9 | `reader` 的会话 hook 可能再长成上帝文件 | 未处理。M2 搭阅读器之前，在 ARCH §4.2 `reader` 行写明 hook 只订阅 `window.oi` 与 `pure.ts`，不保存采用版本或译文正文的副本 | M2 前 |

## 7. 工程成熟度（PR #11 第二轮，2026-10-31）

对照 `docs/reviews/v2-engineering-maturity.md`（分支 `feature/v2-full-review`）。Wisdom 2026-10-31 00:08 只批准两条 P0 和几项流程文件。下表里「未处理」的项这次不做。不改 CI 行为，不改分支保护。

| 编号 | 做什么 | 状态 |
| --- | --- | --- |
| E-P0-1 | README 对齐 v2，AGENTS.md | 已处理。与 23:55 的入口是同一份，不另写第二份规格 |
| E-P0-2 | 写明当前 CI 是空跑 | 已处理。README 与 docs/ci-and-environment.md「当前是空跑」 |
| E-P1-1 | ADR 索引 | 已处理：`docs/adr/README.md` 指向 Q1–Q12，并指向 2026-11-04 的 `docs/adr/0001-m4-desktop-ui.md`。ingest 九条边与删除 `repair → quality` 已是 ADR 0002、0003（PR #122）。第一批其余项仍未建页：`formula-source`、Markdown 的依赖边、`budget`、`packages/providers` 与外发检查、存储升级规则、G18、`ui-events-declared`、`supervisor-state`、解析规则集 `oi-rules/1` |
| E-P1-2 | Issue 与 PR 模板 | 已处理。字段来自 RULES §2 与 §8.4，PR 模板含所在提交 SHA |
| E-P1-11 | 事故复盘模板 | 已处理：`docs/incidents/TEMPLATE.md` |
| E-P1-12 | 三种版本号 | 已处理。README「三种版本号」 |
| E-P1-3 | 把两个 CI job 设为必需检查 | 以 2026-11-04 Anvil 查到的分支保护 API 为准：`CI / node` 与 `CI / python-worker` 已是 required，另有 `CI / worker-health-windows`、`CI / worker-health-macos`。四条都已设为必需。Issue #33 仍 OPEN（还要 `MODELBEST_API_KEY`）。Agent 不改设置（N-02） |
| E-P1-4 | CODEOWNERS | 已处理。`.github/CODEOWNERS` 是 `* @wisdom-km`。按路径拆所有者仍等 Wisdom 指定 |
| E-P1-5 | Conventional Commits 检查 | 已处理。`pnpm run check:commits`，并进 `pnpm check` |
| E-P1-6 | dependency-cruiser 与 `tsconfig.core.json` | 已处理。规则在 `tools/check-deps/`，core 编译配置是 `tsconfig.core.json` |
| E-P1-7 | 空测试目录不再把 pytest 退出码 5 当成通过；Vitest 要有会失败的样例 | 已处理。pytest 退出码 5 使 CI 失败；Vitest 夹具覆盖各门禁的违规样例 |
| E-P1-8 | `docs/acceptance/` 结果格式 | 已处理。空模板在 [acceptance/TEMPLATE.md](./acceptance/TEMPLATE.md)，目录说明在 [acceptance/README.md](./acceptance/README.md)。不预填数字。M0 第一份结果按该模板另交，本行不附结果 |
| E-P1-9 | 提示词目录与 Jev 模型卡 | 未处理。M4 / M6a |
| E-P1-10 | Dependabot 与 gitleaks | gitleaks 8.30.1 已接入 CI（G9）。Dependabot 仍未加 |
| E-P2-1–E-P2-10 | 并发取消、quarantine 目录、发版清单、崩溃只写本机、红队、`.env.example`、SECURITY.md、不用通用功能开关、Prettier、合入后是否删分支 | 其中 Prettier（E-P2-9）已随 M1-DEFER-G1 接上。其余未处理，按原报告的里程碑。E-P2-10 由管理员决定，Agent 不改仓库设置 |
| M1-DEFER-G1 | G1 Prettier | 已处理（PR #110）。`pnpm check` 的 `check:format` 跑 Prettier `--check`，只覆盖 `*.ts`、`*.tsx`、`*.mjs`、`*.js`、`*.cjs`。Python 格式仍是 ruff format。不格式化 Markdown 与 `.github/**` |
| M1-DEFER-G3 | G3 `tsc -b` | 未处理。Wisdom 2026-10-31 14:12：第一个包使用 project references 之前保持 `tsc --noEmit`。PR #110 明确不做，仍按这个触发条件。Issue #34 仍开放 |
| M1-DEFER-G5 | G5 `ui-events-declared` | 未处理。Wisdom 2026-10-31 14:12：规格先定义怎样从代码认出发布和订阅，再写这条检查。PR #110 明确不做，仍按这个触发条件。Issue #34 仍开放 |

## 8. M0 后决定（Wisdom 2026-10-31 01:08）

R-A 已由 Wisdom 于 2026-10-31 01:14 改标签解决。D-D、D-E 于同日决定。W-4 的过渡默认预设于同日定为 `multimodal-layout`；正式全局默认与来源优先级仍未决定。R-B 与 §8.2 里其余行仍未决定。已决定的行写结论，不再用「当前建议」代替。仍开放的行里，「当前建议」是规格里已经写着的临时行为。M0 用 PRD §8 那一批：合成样页和少量开放获取论文，四个预设各跑一遍，结果写入差异清单 §7。2026-11-02 起不在 8 GB 本机上测 PP-DocLayout 的冷启动、单页耗时、峰值内存或是否 OOM；本机只留端口和 stub。同一批论文上改记面壁 API 的单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。单篇费用保留，给占位预算上限定标。由带 `MODELBEST_API_KEY` 的 Cloud Agent 跑；Key 不在时标「未核实」，不预填数字（RULES N-14；Wisdom 2026-11-02，PRD §8 M0）。这一项不改 W-4「正式默认等 M0」。Wisdom 看完路线对比再定正式全局默认。R-B 与尚未决定的行选定之前不要改编号核对或那些返回码。

### 8.1 两个风险

R-A 已解决。R-B 仍标为「M0 实测后决定」。

| id | 风险 | 当前临时写法 | M0 测量什么 | 决定门槛 | 选项 |
| --- | --- | --- | --- | --- | --- |
| R-A | 开关开着、路线不含 Jev 时，可渲染但内容错误的公式会被标已核验（AC-89 ⑤） | 已通过改标签解决（Wisdom 01:14）。路线不含 Jev 时，不论开关，程序核对通过是 `format-checked-latex`，徽标暂定「格式已核对」，不算已核验。`checked-latex` 并入这一条。能渲染但错的公式不再标已核验。QM-03 仍单独报告这一类与真值等价的比例，不并入已核验。徽标视觉待 Loom | 不再为决定这一条而测。同一批若记下「格式已核对」里能渲染但错的个数，只供给 QM-03，不据此改回已核验 | 已决定，不再设门槛 | 不再选择。00:46 的「标已核验」与当时列的「改标未评分」都不采用 |
| R-B | 仅多模态的区块没有编号字段。候选自带编号时，编号核对不过 | `WholePageBlock` 没有编号字段。仅多模态按「区域没有编号」处理：候选带编号则编号项不过，不能进入 `verified-latex` 或 `format-checked-latex`（AC-89 ①，ARCHITECTURE §7.5 第 5 步）。不在 M0 之前加字段，也不放宽这项 | 仅多模态、开关开着，在同一批上记下：对得上文字层的公式区块个数；其中候选 LaTeX 自带编号的个数；这些带编号的候选里，编号核对是唯一失败项的个数；因此改走裁图或占位框的个数。文字层在校正框附近是否看得到同一个编号，分开记一列，供对照，不据此自动判过 | Wisdom 看的数是：「仅因自带编号而核对不过」的公式区块，占仅多模态公式区块的比例。规格不写「超过多少就加字段」。比例高到仅多模态几乎没有 LaTeX、或比例很低，都由 Wisdom 看这批后选。选 ② 或 ③ 时同一 PR 改 AC-89 ① 与 §7.5 的编号项 | ① 维持现行：没有编号字段，候选带编号则这项不过。② 给 `WholePageBlock` 加可选编号，编号来自多模态输出，核对改比这个字段；字段空着时仍按「区域没有编号」。③ 仅多模态在区块没有编号字段时，不因候选自带编号而判这项不过 |

### 8.2 待定项

仍开放的行标为「M0 后决定」。那些行的「当前建议」等于规格里已经写着的临时行为。D-D、D-E 已决定。W-4 只决定了过渡默认，正式默认与来源优先级仍开放。

| id | 事项 | 选项 | 当前建议（规格已写的临时行为，本次不代选） | M0 要的数据 |
| --- | --- | --- | --- | --- |
| W-1 | 保留手动「重新识别」（AC-90） | ① 保留。只在评分开关关闭时可用，返回码与结果标记维持 AC-90。② 删掉这个入口，AC-90 标为不做 | 保留。开关开着（含三个不含 Jev 的预设）返回 `scoring_enabled`，请求 0 次。正文与表格标「未评分」。公式通过程序核对标「格式已核对」（AC-90 ④）。不自动、不批量。开关开着能否进入见 D-F，本行不代选 | 四个预设上，记下程序核对不过、因而显示裁图或占位框的公式区域个数。同时记下「多模态+版面」「仅多模态」的识别列表里，除当前来源外还有没有可换的来源（这两个预设常常没有第二来源）。这个个数只说明有没有东西可换，不据此自动保留或删除 |
| W-2 | 换路线后是否重跑已处理的论文 | ① 不改写已有采用版本与译文。只有新解析的页，以及用户明确「按新路线重跑」的文献，才用新路线。② 切换路线后自动重跑已处理论文 | ①。见 ARCHITECTURE §7.12「已处理的文献与按篇切换」、PRD §3.5 | 路线对比里已有的「一页外部调用次数」，四个预设各记一列，作为自动重跑的代价。同一篇论文从预设 A 换到预设 B 时，公式显示决定（LaTeX / 裁图 / 占位框）发生变化的个数。调用次数看自动重跑贵不贵，变化个数看不重跑会留下多少旧显示。规格不写「变化超过多少就自动重跑」 |
| W-3 | 单篇切换路线 | ① 全局一行 `ing_route`，所有文献用同一条路线。② 每篇文献可以各自选路线 | ① | 同一批里，按论文分开看四个预设的 LaTeX / 裁图 / 占位框比例是否差很多。规格不预写「差很多」的数字。Wisdom 看每篇是否需要不同预设 |
| W-4 | 默认预设与识别源优先级 | 正式默认预设：① 继续不指定正式 id，等 M0。② 写成四个预设 id 中的一个（具体哪一个等这批数据，本行不预填）。来源优先级：③ 维持提议顺序，引擎 A → 引擎 B → 云 OCR → 多模态。④ 改这个顺序。② 和 ④ 可以跟 ① 或 ③ 分开选。过渡默认不在这些选项里重开 | 已决定一部分（Wisdom 2026-10-31）。过渡默认：新安装与恢复默认的预设 id 是 `multimodal-layout`，不是空，也不要求用户先选一条。理由已批准：多模态是主路径；先版面再识别更稳；OCR 路线留给本地、隐私和对比。正式全局默认仍等 M0 四路线对比（质量、面壁 API 单篇耗时、客户端内存（不含本地模型），同一批论文）之后由 Wisdom 写入，本行不预填正式 id。来源优先级仍未决定：按现行提议顺序实现（引擎 A → 引擎 B → 云 OCR → 多模态），M0 之前不写成已决定，也不新造另一种顺序 | 正式默认用已有路线对比：阅读顺序是否可用、显示落在 LaTeX / 裁图 / 占位框的哪一级、每页外部调用次数、失败原因，并看同一批上的质量、面壁 API 单篇耗时、客户端内存（不含本地模型）。来源优先级另记：多个来源都通过时，按提议顺序选中的那一个与人工对照不一致的次数。过渡默认不靠这批数字改写 |
| W-5 | 「源码核对」是否算已核验 | ① 不算。`source-check-standing.ts` 保持 `source_checked`。② 算。同一 PR 改 RULES N-17、PRD AC-04、AC-87，并翻转该函数 | ① 不算。`source-checked-latex` 在没有 Jev 分数时出现，含开关开着但路线不含 Jev（01:14 起这一支不再变成 `verified-latex`）。本行仍不代选它算不算已核验 | 这批里的 arXiv 论文，开关关掉，记下 `source-checked-latex` 的个数，以及其中与 PDF 不一致的个数。另记一列：开关开着且路线不含 Jev 时，这些候选仍是 `source-checked-latex` 的个数（01:14 之后不再变成 `verified-latex`）。不要把这一列提前算成已核验。规格不写「不一致超过多少就算或不算」 |
| D-C | 占位框点击要不要定位区域 | ① 在 `FormulaCropRef` 上加标志（有精确区域 / 只有页），点击只读这个标志，三处正文改成引用它。② 维持现有两句，不加字段 | ②。区块级点击定位该区域（AC-89 ③）；页级点击不定位（AC-95 ⑤）。文案相同。审查里建议过加字段，那不是决定。未定之前不要收成一种点击 | 四个预设上，页级占位框个数与区块级占位框个数。仅多模态预期页级更多。规格不写「页级超过多少就加字段」 |
| D-D | 版面部署和引擎 A 的「本地 / API」是一个开关还是两个 | ① 两个开关。版面只读 `RouteConfig.layout`；引擎 A 的设置只覆盖识别阶段。`deployment: 'api'` 在托管版面 API 核实之前不发请求。② 合成一个开关（要改 AC-96，版面作业与 `parse` 不再各走一次） | 已决定（Wisdom 2026-10-31）：①。两个设置。版面只读 `RouteConfig.layout`。引擎 A 的设置只覆盖识别 / `parse` 阶段。界面可以一键选路线预设，底下仍是这两个旋钮。托管版面 API 核实之前，版面 `deployment: 'api'` 不发请求。不选 ②，不把两次作业合成一次 | 阅读顺序实测里，AI Studio 托管 API 是否返回版面区域（PRD §8 已有的那一项）。结果写入差异清单 §7 之前，版面 `api` 不发请求。这项测量不重开本行 |
| D-E | 版面关掉时，按区域识别的来源发不发 | ① 没有版面作业时这些来源请求为 0，不发整页。② 允许发整页（须改 AC-71） | 已决定（Wisdom 2026-10-31）：①。11:14 续定：没有版面作业（版面关掉，含 `multimodal-only`）时，引擎 A 的识别（`parse`）、引擎 B（MiniCPM-OCR，含面壁 API 与本机 SDK）、云 OCR（百度、GLM-OCR 及同类）请求都为 0，不发整页。整页只走多模态，再用 PDF 文字层校正。理由：引擎 A 只消费版面裁片（AC-96）；引擎 B 的 SDK 内部会跑 PP-DocLayoutV3，跑它等于悄悄把版面加回来；三条用同一条规则。识别列表含这三项之一且版面关着时，`route-config` 校验失败，原因码 `sources_require_layout`，不静默跳过、不写入路线。四个预设不改（`multimodal-only` 本来就不含引擎 A、引擎 B）。已知代价：关掉版面后没有 OCR 兜底，只剩多模态，再按裁图、占位框降级。不选 ② | 自定义组合「版面关，识别列表含引擎 A、引擎 B 或云 OCR」校验失败，原因码 `sources_require_layout`，路线不写入，这三项请求为 0。不把失败改成静默跳过。四个预设不改。决定已经写下，不靠这次复核重开 |
| D-F | 开关开着、路线不含 Jev 时，重新识别是否可用 | ① 与其他「开关开着」相同，返回 `scoring_enabled`。② 路线不含 Jev 时允许进入。选 ② 仍要 W-1 先保留入口 | ①，含三个不含 Jev 的预设（AC-90 ①） | 与 W-1 同一批计数。再加上：这三个预设在开关默认开着时，核对不过、用户会想换来源、却被 `scoring_enabled` 拒绝的公式区域个数。W-1 决定入口在不在；本行决定开关开着时进不进得去 |

云 OCR 不另加预设 id 白名单（Wisdom 2026-10-31）：维持现行写法。版面开着时，云 OCR 可以出现在非 `ocr-*` 的组合上（例如 `multimodal-layout`），仍按版面区域裁片请求。不把「只能挂在 `ocr-*` 预设 id 上」写成规则。M0 之后再评估。这次不改 ARCHITECTURE 与 PRD 的识别规则。

## 9. PR #12 终审的 P2（Forge @ `e11e54b`，2026-10-31）

PR #12 已合入 `main`（`c14e4b6`）。下面三条来自 Forge 对 `e11e54b` 的终审，不挡当前里程碑。本段只记状态，供同步到 GitHub 后提醒负责人。R12-P2-1、R12-P2-3 与 §6 P1-14 已由 PR #14（main@eb87d53）处理。

| 编号 | 发现 | 状态 | 负责人 |
| --- | --- | --- | --- |
| R12-P2-1 | ADR 索引：`docs/adr/README.md` 末句仍写差异清单 §6.1–§6.11。§6.12（合入后复审的决定）已在差异清单。那一句改为 §6.1–§6.12，不抄决定正文 | 已处理 @ PR #14（main@eb87d53） | Loom |
| R12-P2-2 | 供应链：`.cursor/install.sh` 用 curl 管道到 sh 安装 uv（`https://astral.sh/uv/${uv_version}/install.sh`），没有校验哈希，并用 `sudo` 把 `uv` / `uvx` 链到 `/usr/local/bin` | 已处理。钉住哈希：期望值在 `workers/parser/.uv-install.sha256`，与 `.uv-version` 放在一起；脚本把安装脚本下载到临时文件，sha256 通过后才执行，失败则 `exit 1`。保留 sudo 软链，注释写明 sudo 仅用于 Cloud Agent VM。Wisdom 2026-10-31 08:21 批准的 RULES N-11 一次性例外，仅限本任务；未改 N-11 条文，也未改 `.cursor/environment.json` | Wisdom |
| R12-P2-3 | 设计跟进，三处一起做：① DESIGN.md 文首仍是 §6 P1-14 那句「Loom 交付前 UI 只搭结构」；② `docs/design-principles.md` 正文 P2 的状态示例仍缺「格式已核对」「源码核对」「未评分」「占位框」；③ DESIGN 新增徽标 §3.7，验收 DS-28…DS-31 | 已处理 @ PR #14（main@eb87d53） | Loom |

### 已知、不挡合入的风险

下面三项仓库里已有记录，这里只提醒，不新开编号。

- CI 已跑一部分 ARCHITECTURE §13 门禁。还没接上的见 `docs/ci-and-environment.md`「门禁」。全绿不等于 G1–G18 全部已有。
- `main` 的分支保护要 Wisdom 在仓库设置里打开。Agent 不改分支保护（N-02；§7 E-P1-3）。
- §8 里尚未决定的项等 M0。R-A、D-D、D-E 已决定。W-4 的过渡默认已决定，正式全局默认与来源优先级未决定。R-B 与 §8.2 其余行仍未决定。选定之前不改编号核对或那些返回码。

## 10. 2026-10-31 13:14 记下、不改已决定条文

Wisdom 2026-10-31 13:14。不重开 Q3、Q5、D-D、D-E、W-4。M0 费用、M3 真值表与显示链确认的正文在 PRD §8、§9，ARCHITECTURE §7.13，差异清单 §6.14。这里只记暂停、风险和愿景，不另写一套规则。

- **不挡 M1 的规格 PR 暂停，直到 M1 开工。** 本次是点名要写的。写完之后，不挡住里程碑的规格整理先停。挡住 M1 的缺口（门禁、空跑、契约包）不在这句里，仍按各自的里程碑做。M1 已经开工：契约包 #55、协议代码生成 #56、健康检查 #58、G1 #110 均已合入。「直到 M1 开工」已经满足，不再暂停不挡里程碑的规格整理。挡住里程碑的缺口仍按各自里程碑。原决定不重开 Q3、Q5、D-D、D-E、W-4。
- **阅读顺序的两侧实现，退出条款只记风险。** 现行规则不变：一套规则集，TS 与 Python 两侧实现，用 `fixtures/parsing-rules/` 对拍；改规则必须两侧和夹具同一个 PR（ARCHITECTURE §7.10，RULES §5 第 19 条）。风险是两侧会长期分叉、对拍成本会上去。不在这里加「可以只留一侧」的出口，也不改 M2、M3 的退出条件。
- **`architecture-redesign` 的 v1.1 是 v3+ 愿景。** 本仓库没有这份文件。v1 审查引用过 `docs/architecture-redesign.md`（手机、写作、音频在那份旧稿里）。那些能力是 v3 及以后的愿景，与已经决定的 Q3（v2 只做桌面端）、Q5（写作辅助移出 v2 实现，只留架构预留）冲突。不按那份愿景实现，不重开 Q3、Q5。
- **公式显示链已在文档里。** 核对过：v2 没有矢量重绘。显示链是 LaTeX → 裁图 → 占位框（ARCHITECTURE §7.5；PRD AC-04、AC-89）。v1 审查 §4.7、差异清单 §5、README、AGENTS.md 已经这样写。本次只确认，不改这些句子的含义。落点在差异清单 §6.14。

## 11. 2026-11-02 面壁 API 为主路线

Wisdom 2026-11-02 16:38 UTC+8。原文与决定正文在 PRD §9 和差异清单 §6.15。这里只记状态，不另写一套规则。不重开 Q3、Q5、Q9、Q10、D-D、D-E、W-4。

- 面壁 API 是已经写成面壁的能力的主路线。本地部署是第二路线：M0/M1 只留接口和 stub，不下载模型，不设本地推理门禁。标为推迟，不删除。
- M0 不再测本机模型。要测的是面壁 API 单篇耗时、单篇费用、失败率与重试，以及客户端内存（不含本地模型）。Key 不在时标「未核实」。
- N-22：业务切片的门禁前提由已经在 CI 的 G6、pyright、gitleaks 满足。G1 Prettier 已进入 `pnpm check`（本节 M1-DEFER-G1）。G3、G5 仍是 M1 交付（Issue #34，本节 M1-DEFER-G3、M1-DEFER-G5），不挡住业务切片。
- 同日 17:03：面壁 Jev 的托管 API 与本地部署在契约里都是一等。本地预留：`jev.route` 选 `local` 时可以完全不调用面壁 API。正文在 PRD §9 与差异清单 §6.15，验收 AC-103。不另写一套规则。PP-DocLayout 与其余本机推理仍是上面的第二路线。
- 同日 17:21：原文「Jev API 客户端提前到 M1，M6a 接进完整流程」。最小托管 API 客户端是 M1 交付，M0 测量用它；M6a 接入完整流程。本地仍是 stub。正文在 PRD §9 与差异清单 §6.15。不另写一套规则。

## 12. 2026-11-03 platform-node 值导入 contracts

2026-11-03 10:40 Wisdom 批准 platform-node → contracts 值导入，ARCH §5.1 补 `PN --> C`。`contracts` 仍是叶子。`contracts` → `kernel` 仍只许 type-only。门禁规则不在本决定里改。不重开 Q3、Q5、D-D、D-E、W-4。
