# 方向检索输出

命令：`rg -n "platform-node|contracts ←|← kernel|-->" *.md docs/`

```text
DESIGN.md:76:  App["启动"] --> Home["首页<br/>最近 PDF · 最近本地 Markdown · 打开"]
DESIGN.md:77:  Home -->|"Mod+O 选 PDF / 拖入"| Reader["阅读主屏<br/>原文 | 译文 | 侧栏(笔记/问答/大纲)"]
DESIGN.md:78:  Home --> Lib["文献库"] --> Reader
DESIGN.md:79:  Home -->|"Mod+O 选 .md / Mod+Shift+O"| MD["Markdown 阅读 / 笔记库<br/>(md-reader.md)"]
DESIGN.md:80:  MD -->|"链接到库内 PDF"| Reader
DESIGN.md:81:  Reader -->|"首次某服务商要收数据<br/>（core 判定）"| Consent["外发同意对话框（模态）"]
DESIGN.md:82:  Consent -->|"同意"| Reader
DESIGN.md:83:  Consent -->|"拒绝 → 能力降级提示（就地）"| Reader
DESIGN.md:84:  Reader -->|"降级提示「去设置」"| Settings
DESIGN.md:85:  Home -->|"Mod+,（应用内页）"| Settings["设置页（应用内，替换主区域，可返回）<br/>通用 · 外观 · AI 服务 · 模型来源 · 翻译 · 预算 · 隐私与数据 · 高级 · 关于"]
DESIGN.md:86:  Settings --> Privacy["隐私与数据<br/>外发前询问开关 · 数据去向列表"]
DESIGN.md:87:  Reader -->|"Mod+,"| Settings
DESIGN.md:88:  Settings -->|"返回 / Esc"| Reader
DESIGN.md:89:  Privacy -->|"把开关从开改为关"| ConfirmOff["确认关闭询问（模态，一次）"]
DESIGN.md:90:  Privacy -->|"某服务商「撤回同意」"| Withdraw["确认撤回（模态，危险）"]
ARCHITECTURE.md:36:  R -- "contextBridge" --> P
ARCHITECTURE.md:37:  P -- "IPC invoke / event" --> M
ARCHITECTURE.md:38:  M -- "MessagePort（seam 形状的请求与事件）" --> U
ARCHITECTURE.md:39:  M -- "拉起 / 关闭；stdin 传一次性令牌" --> W1
ARCHITECTURE.md:40:  U -- "HTTP + SSE（oi-parse/1）<br/>127.0.0.1 + 一次性令牌" --> W1
ARCHITECTURE.md:41:  U -- "HTTPS + SSE（oi-parse/1）<br/>服务令牌；不带服务商 Key" --> W2
ARCHITECTURE.md:42:  W1 -- "HTTPS（jev_http / 引擎 B 云端后端）" --> QE
ARCHITECTURE.md:45:  U -- "HTTPS（服务商适配层 packages/providers，§7.9）<br/>先过 EgressCheck 与 BudgetGate" --> API
ARCHITECTURE.md:46:  U -- "HTTPS，≥3 s 一次、单连接<br/>（formula-source 适配器）" --> ARX
ARCHITECTURE.md:76:| **adapters** | 端口实现：SQLite 仓储、文件资产、服务商端口实现（经 `providers`）、worker 客户端、IPC 处理器 | 本切片 application（实现其 ports）与 domain、`platform-node`、`providers`（只经 `@oi/providers` 入口，§7.9）、`contracts`、`kernel` | ui、其他切片的 adapters；服务商的主机名、请求格式、鉴权头（只在 `providers`，F-18） |
ARCHITECTURE.md:77:| **ui** | React 组件、hooks、视图模型；通过 `window.oi` 调命令、订阅事件 | 本切片的展示 seam `src/pure.ts`（纯函数与类型，§2.4）、`contracts`、`ui-kit`、React、PDF.js（仅 reader 切片） | 本切片 domain / application 的内部文件、adapters、`platform-node`、Electron、Node 内置模块、其他切片的 ui |
ARCHITECTURE.md:128:| **imperative shell**（被驱动方适配器与装配） | `features/*/src/adapters/**`（其中 `ipc-handlers.ts` 是驱动方：IPC → seam）、`platform-node`、`worker-client`、`apps/desktop/src/main/**`、生成的 preload；worker 的 `api/`、`jobs/`、`runtime/` 与模型推理 | adapters、workers |
ARCHITECTURE.md:274:│  ├─ platform-node/                  # Node 侧基础设施：SQLite、文件资产、safeStorage、HTTP 客户端、日志落盘
ARCHITECTURE.md:356:| `platform-node/src/sqlite/connection.ts` | 打开数据库、WAL、单写者 |
ARCHITECTURE.md:357:| `platform-node/src/sqlite/migrate.ts` | 汇总各切片 `migrations/` 并按（切片, 版本）执行 |
ARCHITECTURE.md:358:| `platform-node/src/assets/file-asset-store.ts` | 暂存 → 校验摘要 → 提交引用 |
ARCHITECTURE.md:359:| `platform-node/src/secrets/safe-storage-secret-store.ts` | Electron `safeStorage` 加密存取 |
ARCHITECTURE.md:360:| `platform-node/src/http/http-client.ts` | 超时、有界重试、取消、按幂等性决定能否重发 |
ARCHITECTURE.md:361:| `platform-node/src/http/redact.ts` | 请求 / 响应日志脱敏；URL 查询参数 `access_token`、`key`、`client_id`、`client_secret` 一律打码（§7.9.5） |
ARCHITECTURE.md:362:| `platform-node/src/logging/file-logger.ts` | JSON 行日志落盘。调试日志写在 `<应用数据目录>/debug/`，最多 7 天且总量上限 50 MB（先到先清，§11）。产品诊断日志的天数与体积仍等 M2 实测 |
ARCHITECTURE.md:371:| `providers/src/transports.ts` | `ChatTransport`、`OcrTransport`：发送要求 `Reservation`，连接前调 `EgressCheck`，经 `platform-node/http` 发出 |
ARCHITECTURE.md:410:  ingest --> library
ARCHITECTURE.md:411:  ingest --> parsing
ARCHITECTURE.md:412:  ingest --> document
ARCHITECTURE.md:413:  ingest --> quality
ARCHITECTURE.md:414:  ingest --> formula
ARCHITECTURE.md:415:  ingest --> fsrc
ARCHITECTURE.md:416:  ingest --> repair
ARCHITECTURE.md:417:  ingest --> translation
ARCHITECTURE.md:418:  ingest --> jobs
ARCHITECTURE.md:419:  library --> document
ARCHITECTURE.md:420:  parsing --> document
ARCHITECTURE.md:421:  parsing --> jobs
ARCHITECTURE.md:422:  formula --> document
ARCHITECTURE.md:423:  fsrc["formula-source"] --> document
ARCHITECTURE.md:424:  fsrc --> formula
ARCHITECTURE.md:425:  fsrc --> jobs
ARCHITECTURE.md:426:  quality --> document
ARCHITECTURE.md:427:  repair --> formula
ARCHITECTURE.md:428:  repair --> jobs
ARCHITECTURE.md:429:  translation --> document
ARCHITECTURE.md:430:  translation --> formula
ARCHITECTURE.md:431:  translation --> jobs
ARCHITECTURE.md:432:  translation --> markdown
ARCHITECTURE.md:433:  markdown --> library
ARCHITECTURE.md:434:  markdown --> jobs
ARCHITECTURE.md:435:  notes --> document
ARCHITECTURE.md:436:  notes --> markdown
ARCHITECTURE.md:437:  qa --> document
ARCHITECTURE.md:438:  qa --> notes
ARCHITECTURE.md:439:  qa --> markdown
ARCHITECTURE.md:440:  voice --> document
ARCHITECTURE.md:441:  voice --> notes
ARCHITECTURE.md:442:  voice --> jobs
ARCHITECTURE.md:654:    PN["platform-node"]
ARCHITECTURE.md:663:  UI --> UK
ARCHITECTURE.md:664:  UI -- "只经 src/pure.ts" --> DOM
ARCHITECTURE.md:665:  UI --> C
ARCHITECTURE.md:666:  PRE --> C
ARCHITECTURE.md:667:  MAIN --> ADP
ARCHITECTURE.md:668:  MAIN --> APP
ARCHITECTURE.md:669:  MAIN --> PN
ARCHITECTURE.md:670:  MAIN --> PV
ARCHITECTURE.md:671:  ADP --> APP
ARCHITECTURE.md:672:  ADP --> DOM
ARCHITECTURE.md:673:  ADP --> PN
ARCHITECTURE.md:674:  ADP --> WC
ARCHITECTURE.md:675:  ADP --> PV
ARCHITECTURE.md:676:  APP --> DOM
ARCHITECTURE.md:677:  APP --> C
ARCHITECTURE.md:678:  DOM --> C
ARCHITECTURE.md:679:  DOM --> K
ARCHITECTURE.md:680:  APP --> K
ARCHITECTURE.md:681:  PN --> K
ARCHITECTURE.md:682:  PN --> C
ARCHITECTURE.md:683:  WC --> C
ARCHITECTURE.md:684:  PV --> PN
ARCHITECTURE.md:685:  PV --> C
ARCHITECTURE.md:686:  PV --> K
ARCHITECTURE.md:689:  C -- "仅 type-only" --> K
ARCHITECTURE.md:692:只允许箭头方向。`contracts` 到 `kernel` 只允许 type-only import（Wisdom 2026-11-02 17:58）。反方向（例如 domain → application、application → adapters、ui → application、platform-node → features、providers → features）一律禁止。ui 到 domain 的箭头只能经过本切片的 `src/pure.ts`（§2.4），不得 import domain 内部文件。`platform-node` 可以值导入 `contracts`（Wisdom 2026-11-03 10:40）。`contracts` 仍是叶子（G5 `contracts-is-leaf` 不变），`contracts` → `kernel` 仍只允许 type-only import。
ARCHITECTURE.md:889:  IN["原 PDF + SHA-256"] --> PRE["预处理（pypdfium2）<br/>文字层检测 · 页面渲染 · 坐标帧<br/>（所有识别来源共用同一张页面图）"]
ARCHITECTURE.md:890:  IN --> AX["识别积木：arXiv 源码（§7.6）<br/>路线含它且文献有编号才运行"]
ARCHITECTURE.md:891:  PRE --> LAY{"路线的版面积木开着？"}
ARCHITECTURE.md:892:  LAY -- "是" --> LJOB["版面作业 layout（§7.2、§10.2）<br/>输入页面图<br/>输出带坐标和阅读顺序的区块<br/>本地与远程同一 LayoutEngine"]
ARCHITECTURE.md:893:  LAY -- "否" --> WHOLE["不切块。整页只走多模态（AC-95）<br/>引擎 A 识别、引擎 B、云 OCR 请求为 0<br/>没有 OCR 兜底；坐标见 §7.12"]
ARCHITECTURE.md:894:  LJOB --> REC["识别积木：只跑路线识别列表里的来源<br/>多模态 / 云 OCR / 引擎 A 的识别阶段 / 引擎 B<br/>列表不含的来源请求为 0<br/>引擎 A、引擎 B、云 OCR 都要有版面作业<br/>多模态只要列表含它就运行，不看评分开关"]
ARCHITECTURE.md:895:  PRE --> T["文字层基础档<br/>（无服务时降级，TS 实现）"]
ARCHITECTURE.md:896:  REC --> N["规范化为统一文档模型<br/>（候选页 PageCandidate）"]
ARCHITECTURE.md:897:  WHOLE --> N
ARCHITECTURE.md:898:  T --> N
ARCHITECTURE.md:899:  AX -- "对齐通过的公式候选" --> N
ARCHITECTURE.md:900:  N --> SW{"评分开关开着，且路线的判定列表含 Jev？"}
ARCHITECTURE.md:901:  SW -- "是" --> Q["质量评估（Jev）<br/>这条路线上的识别候选都送评<br/>含多模态识别；只有 scored 算分"]
ARCHITECTURE.md:902:  SW -- "开关关着" --> OFF["不调用 Jev<br/>记 not-run/disabled<br/>路线配置不改写<br/>路线含 Jev 时界面提示「当前路线包含评分，但评分已关闭」<br/>正文与表格按来源优先级采用（AC-86）<br/>正文与表格标「未评分」<br/>公式直接走第 4、5 步，不经过低分判断"]
ARCHITECTURE.md:903:  SW -- "开关开着但路线不含 Jev" --> OFF2["不调用 Jev<br/>记 not-run/disabled<br/>不改写路线，不提示上面那句<br/>公式走第 4、5 步"]
ARCHITECTURE.md:904:  Q --> D{"按 §7.5 选出的候选<br/>是否有效低分？"}
ARCHITECTURE.md:905:  OFF --> PJ{"第 4、5 步通过？"}
ARCHITECTURE.md:906:  OFF2 --> PJ
ARCHITECTURE.md:907:  PJ -- "是" --> FMT["采用<br/>第 4 步：源码核对<br/>第 5 步：格式已核对<br/>都不算已核验"]
ARCHITECTURE.md:908:  FMT --> ACC
ARCHITECTURE.md:909:  PJ -- "否" --> CROP["裁图，拿不到再占位框<br/>标「未评分」，不算已核验"]
ARCHITECTURE.md:910:  CROP --> ACC
ARCHITECTURE.md:911:  D -- "否，且有有效高分并通过程序核对，标已核验" --> ACC["采用：AcceptedPageRevision"]
ARCHITECTURE.md:912:  D -- "有效高分但四项核对不过" --> HICROP["裁图，拿不到再占位框<br/>不算已核验"]
ARCHITECTURE.md:913:  HICROP --> ACC
ARCHITECTURE.md:914:  D -- "评分错误 / 不可用 / 阈值未定标" --> PEND["按来源优先级采用，标「待评分」<br/>公式显示裁图（拿不到时占位框）<br/>不算已核验、不触发补救<br/>评分恢复后自动补评"]
ARCHITECTURE.md:915:  PEND --> ACC
ARCHITECTURE.md:916:  D -- "是，且自动补救开、预算与外发都通过" --> RP["区域补救（仅目标区域）<br/>先试引擎 B 区域候选（若路线含它且声明支持）<br/>仍低分再调用多模态"]
ARCHITECTURE.md:917:  D -- "是，但自动补救关 / 预算到限 / 外发被拒" --> FB["保留原图 + 候选，标待复核<br/>超预算即停"]
ARCHITECTURE.md:918:  RP --> Q2["重新校验 + 重新评分"]
ARCHITECTURE.md:919:  Q2 -- "通过" --> ACC
ARCHITECTURE.md:920:  Q2 -- "不过" --> FB
ARCHITECTURE.md:921:  FB --> ACC
ARCHITECTURE.md:922:  ACC --> TR["翻译（按原文区块）：占位保护 → LLM → 完整性校验<br/>→ 还原为 Markdown + LaTeX（oi-md/1）→ 译文区块记录（§8.1.1）"]
ARCHITECTURE.md:923:  TR --> OUT["阅读视图（译文逐块经 MarkdownView）<br/>· 笔记 Markdown 导出（整篇译文导出延后）"]
ARCHITECTURE.md:1211:  ID["编号与版本识别<br/>第 1 页戳 / 元数据 / 用户输入"] --> C{"本地缓存<br/>（编号, 版本）"}
ARCHITECTURE.md:1212:  C -- "命中" --> P
ARCHITECTURE.md:1213:  C -- "未命中" --> F["下载<br/>≥ 3 s 间隔 · 单连接 · 20 s 超时<br/>403 / 429 → 冷却 24 h"]
ARCHITECTURE.md:1214:  F --> U["解包<br/>gzip（tar 或单个 tex）<br/>路径与体积上限检查"]
ARCHITECTURE.md:1215:  U --> P["TeX 解析<br/>主文件 · \input · 宏 · 公式单元 · 编号"]
ARCHITECTURE.md:1216:  P --> AL["与公式区域对齐<br/>版面区域，或仅多模态的校正后框<br/>整体词覆盖率 · 逐公式核对"]
ARCHITECTURE.md:1217:  AL -- "通过" --> CAND["arXiv 公式候选<br/>→ 统一文档模型<br/>有评估记录；送评仅当开关开着且路线含 Jev（§7.5）"]
ARCHITECTURE.md:1218:  AL -- "失败" --> FB["回落：该公式只走识别链路<br/>记录原因码"]
ARCHITECTURE.md:1224:| 下载 | 两次请求间隔 ≥ 3 s、同一时刻单连接、超时 20 s；403 / 429 进入 24 h 冷却并持久化；离线、超时、HTTP 错误、解包失败各有原因码；不得为绕过限流使用多连接或多机 | `arxiv-http-client.ts` 经 `platform-node/http`；端点沿用 v1 的 `https://arxiv.org/src/<编号><版本>`，是否改用 arXiv 为程序访问推荐的 `export.arxiv.org` **未核实**，M4 开工前确认 | `background/arxiv-source.js:8-10`、`:17-24`、`:178`、`:237-267` |
ARCHITECTURE.md:1281:新包 `packages/providers`，属于 shell 层（§2）：依赖 `contracts`、`kernel`、`platform-node`；不依赖任何切片、Electron、React。只有切片的 adapters 与装配根经 `@oi/providers` 入口使用它（G5 `providers-boundary`）。utility 进程启用后它随适配器一起搬（§1），密钥明文仍只在 main。
ARCHITECTURE.md:1370:1. **鉴权。** 适配器不读密钥。鉴权方式（`auth/<scheme>.ts`）每次请求向 main 要请求头的值：`ProviderAuthorizer.authorize({ vendorId, host, slot })`；main 核对 `host` 在该服务商的 `allowedHosts` 里才返回（§1）。Key 只放请求头，不放 URL：Gemini 用 `x-goog-api-key` 请求头，不用 `?key=` 查询参数。唯一的例外是百度 OCR 的 `access_token`（官方文档给的是查询参数写法）：用 API Key 与 Secret Key 换取 token 的请求由 main 发出，这两个值不出 main；token 只缓存在 main 的内存里，到期（`expires_in`）前重新换取；带 token 的完整 URL 不进日志，`platform-node/src/http/redact.ts` 对查询参数 `access_token`、`key`、`client_id`、`client_secret` 一律打码。API Key 与账号 token 是同一端口的两种实现（Wisdom 2026-10-30 22:44）：已有的 `bearer`、`x-api-key`、`x-goog-api-key`、`baidu-access-token` 属于 API Key 一类；预留 `account-token`，用账号会话换来的访问令牌填同一个请求头，格式适配器与 core 不区分它和 API Key。v2 不实现账号系统。`contracts/src/account-session.ts` 的 `AccountSession`（取令牌、刷新）由装配根注入空实现，调用返回 `not_in_v2`。订阅、按账号计费、账号系统与自有托管服务端不在 v2（PRD §3.2），只留这个端口。
ARCHITECTURE.md:1945:  [*] --> stopped
ARCHITECTURE.md:1946:  stopped --> starting: 需要 worker 的能力被调用 / 用户「重新启动」
ARCHITECTURE.md:1947:  starting --> handshaking: stdout 报出端口
ARCHITECTURE.md:1948:  starting --> crashed: 启动超时或进程退出
ARCHITECTURE.md:1949:  handshaking --> ready: health、协议版本、capabilities 通过
ARCHITECTURE.md:1950:  handshaking --> incompatible: 主版本不在支持范围（§10.4）
ARCHITECTURE.md:1951:  handshaking --> crashed: 握手超时或失败
ARCHITECTURE.md:1952:  ready --> crashed: 进程退出或健康检查连续失败
ARCHITECTURE.md:1953:  crashed --> starting: 未超过重启上限（退避后）
ARCHITECTURE.md:1954:  crashed --> degraded: 重启次数用尽
ARCHITECTURE.md:1955:  ready --> stopping: 应用退出
ARCHITECTURE.md:1956:  stopping --> stopped
ARCHITECTURE.md:1957:  incompatible --> stopped: 用户更新 worker 后重试
ARCHITECTURE.md:1958:  degraded --> starting: 用户「重新启动」（计数清零）
ARCHITECTURE.md:1971:Wisdom 2026-10-31 批准把产品诊断日志提前。与现有里程碑表一起看，切分是：本节规格算 M0；代码骨架（白名单枚举、`Logger`、流水线打点）在 M1，随契约包落地；一键导出、诊断页，以及产品诊断日志的保留天数与体积设置，仍在 M2（PRD US-14、AC-09、AC-10、AC-83）。调试日志的 7 天与 50 MB 已在本节写死，不属于这项未定设置。`packages/contracts/src/diag-events.ts` 是诊断事件白名单。`Logger` 与 `Clock` 在 `packages/kernel`。file-logger 仍在 `platform-node`，不在这份契约里。规格见本节；处理状态见 [backlog](./docs/backlog.md)。
ARCHITECTURE.md:1973:- **日志**：`kernel` 只定义 `Logger` 接口；`platform-node/src/logging/file-logger.ts` 输出 JSON 行。每条至少有 `ts`、`level`、`event`、`feature`。`event` 只能来自白名单。不记录正文、译文、提示词、密钥、绝对路径。Markdown 阅读只记 `FileId`、文件数、耗时与错误码，不记文件路径与内容。
ARCHITECTURE.md:2047:| G5 依赖方向 | dependency-cruiser | `no-circular`、`layer-direction`、`no-cross-feature-internals`、`feature-dependency-matrix`（§4.3；含 `ingest` 的九条出边，任何切片 import `ingest` 或 `budget` 即失败）、`renderer-isolation`、`electron-only-in-desktop`、`contracts-is-leaf`（`packages/contracts` 不依赖 `features`、`platform-node`、`providers`、`worker-client`、`ui-kit`、`apps`）、`contracts-kernel-type-only`（Wisdom 2026-11-02 17:58：`packages/contracts` 依赖 `kernel` 只允许 type-only import）、`ui-events-declared`（只有在 `contracts/src/ui-events.ts` 登记的切片能发布或订阅该事件，§5.3）、`providers-boundary`（`packages/providers` 只被 `features/*/src/adapters/` 与 `apps/desktop/src/main/` 导入，只经 `@oi/providers` 入口；它自己不导入任何切片、Electron 与 UI，§7.9.2）；Q3 相关规则单列为 G13、G15、G16 |
ARCHITECTURE.md:2200:| platform-node 值导入 contracts（Wisdom 2026-11-03 10:40） | 批准 `platform-node` → `contracts` 的值导入，供诊断日志落盘读取 `readDiagEvent`。§5.1 增加 `PN --> C`。`contracts` 仍是叶子（`contracts-is-leaf` 不变）。`contracts` → `kernel` 仍只允许 type-only import。这次批准代替该边的 ADR，不另建 `docs/adr/` 页。dependency-cruiser 与其余门禁不在本 PR 改，规则落地属 PR #77 | §5.1、§13 G5 |
ARCHITECTURE.md:2203:- 本文的任何结构性修改（新增切片、新增依赖边、调整上限）都需要 ADR（`docs/adr/`），并在同一个 PR 更新本文与对应 CI 配置。Q4 新增的 `formula-source` 切片、Markdown 阅读方案新增的 `markdown` 切片及其五条依赖边（`translation`、`notes`、`qa` → `markdown`；`markdown` → `library`、`jobs`）、架构评审新增的 `ingest` 切片及其九条出边、`budget` 切片与删除的 `repair → quality`，以及修复 B 新增的 `packages/providers` 包与 `providers-boundary` 规则、`EgressCheck` 端口、存储与协议的升级规则（§8.4、§10.4，须在 M2 建第一张业务表之前合入），以及 PR C 新增的 G18、`ui-events-declared`、`supervisor-state` 与解析规则集 `oi-rules/1`，在 M1 建立 `docs/adr/` 时作为第一批 ADR 登记。2026-11-03 10:40 批准的 `platform-node` → `contracts` 值导入同样等到那时登记；门禁配置不在批准它的文档 PR 里改。
docs/exec-plans/feature-m1-logging-contract.md:9:- 已有行为：`packages/contracts` 与 `packages/kernel` 已在。`packages/kernel/src/index.ts` 只再导出 `Result`。没有 `diag-events.ts`、`logger.ts`、`clock.ts`。没有 `packages/platform-node`。诊断事件还不能被类型或运行时拒绝。`desktop-e2e-windows` 跑 Playwright Electron 冒烟，不上传截图。`apps/desktop/playwright.config.ts` 没有 `screenshot`。
docs/exec-plans/feature-m1-logging-contract.md:10:- 相关的节：PRD S10、US-14、AC-101（§6.1.13）、§8 M1 行、§9 诊断日志决定。AC-09 是 M2，本计划只保证不违反。ARCHITECTURE §2.5 `diagnostics` 行、§4.1 文件表（`diag-events.ts`、`logger.ts`、`clock.ts`、`file-logger.ts`）、§4.3（`diagnostics` 不被业务切片 import）、§11、§7.9.5 的 URL 打码留给 `platform-node`。RULES §2 契约单独成 PR、§4 调试模式与证据、§5 第 8 条、N-10、N-11。
docs/exec-plans/feature-m1-logging-contract.md:16:- `packages/platform-node` 在实现 PR 新建，只放 logging。本 PR 不建这个包，不建空目录。
docs/exec-plans/feature-m1-logging-contract.md:61:- 不建 `packages/platform-node`，不写 `file-logger.ts`，不执行 7 天与 50 MB 的删除，不执行清空，不把 logger 接到 `apps/desktop`。天数、体积和目录名只做成常量。`deleteFiles` 只是 `setDebugMode` 的参数。AC-101 ②③⑤ 的文件行为在实现 PR 用 core 测试证明。
docs/exec-plans/feature-m1-logging-contract.md:64:- 不做 URL 查询参数打码。那是 `platform-node/src/http/redact.ts`，在实现 PR 或更晚的 HTTP 客户端里。
docs/evidence/74/commands.md:41:diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。没有改 worker。没有建 `packages/platform-node`。
docs/backlog.md:3:状态：v0.6。当前版本仍是 v0.6，本文件不升这个号。变更指针：[spec-changelog.md](./spec-changelog.md)。日期：2026-11-03（Asia/Shanghai）。2026-10-31 补了诊断日志的规格状态（§4 新行、§6 的诊断事件枚举那条 P2-8）。同日把调试日志写成最多 7 天、总量上限 50 MB（先到先清）。§4 另有一行请 Loom 改 MD-16 的 test:core 措辞。同日 13:14 的决定记在 §10，不重开 Q3、Q5、D-D、D-E、W-4。2026-11-02 20:37 起，延期未修的审查或 QA 项按 [WORKFLOW.md](./WORKFLOW.md)「延期」记 Issue 并在 §4 加行。同日补上 #59、#61、#62、#33，并把 #60 写入已有的 `BaseHTTPMiddleware` 行。同日 Electron 外壳延期三条：#66、#67、#68。2026-11-03 补上 #76。同日 10:40 Wisdom 批准 platform-node → contracts 值导入，记在 §12，ARCH §5.1 补 `PN --> C`。
docs/backlog.md:249:## 12. 2026-11-03 platform-node 值导入 contracts
docs/backlog.md:251:2026-11-03 10:40 Wisdom 批准 platform-node → contracts 值导入，ARCH §5.1 补 `PN --> C`。`contracts` 仍是叶子。`contracts` → `kernel` 仍只许 type-only。门禁规则不在本决定里改。不重开 Q3、Q5、D-D、D-E、W-4。
docs/gate-remediation.md:7:<!-- gate-remediation-table:start -->
docs/gate-remediation.md:29:<!-- gate-remediation-table:end -->
docs/v1-review.md:152:| `net/fetch.js` | 816 | 统一出站 HTTP：按用途超时、重试、并发、脱敏、测试中拒绝未打桩请求 | 间接 | **复用规则** | platform-node/http |
docs/v1-review.md:171:| `platform/index.js` | 58 | 平台骨架 `{target, kv, library, net}` | 间接 | 复用接口思路 | platform-node + 各切片 ports |
docs/v1-review.md:174:| `platform/record-key.js` | 92 | 纯键比较与范围 | 间接 | 复用规则 | platform-node/sqlite |
docs/v1-review.md:175:| `platform/tx-guard.js` | 133 | 事务回调只能 await 后端自身请求 | 间接 | **复用规则** | platform-node/sqlite（事务包装） |
docs/v1-review.md:176:| `platform/kv.js` / `net.js` | 105 / 20 | 小型 KV、网络传输注入 | 间接 | 重写 | settings/adapters、platform-node/http |
docs/v1-review.md:510:- v2 落点：`platform-node/http/http-client.ts`，并与 PRD AC-07 对齐。
docs/design/md-reader.md:8:>   3. **文件适配器**：正文里说的「`platform-node` 的文件适配器」，在规格中是 `features/markdown/src/adapters/*`（用 `platform-node` 的基础能力）。`platform-node` 本身不带业务规则。
docs/design/md-reader.md:45:- **UI–core 解耦（ARCHITECTURE §2.1、RULES §8）**：Markdown 解析、wikilink / 相对路径解析、文件监视与去抖、路径越界与安全校验、LaTeX 的安全白名单，全部写在 core（新切片 `markdown` 的 domain / application，加 `platform-node` 的文件适配器）。renderer 只拿到**结构化克隆安全的普通数据**（第 3.3 节）把它画出来，不读文件系统、不自己解析链接。
docs/design/md-reader.md:137:  Home -->|"打开 PDF"| PR
docs/design/md-reader.md:138:  Home --> Lib --> PR
docs/design/md-reader.md:139:  Home -->|"Ctrl/⌘+O 选 .md / 拖入"| MF
docs/design/md-reader.md:140:  Home -->|"Ctrl/⌘+Shift+O"| MV
docs/design/md-reader.md:141:  MF -->|"「打开所在文件夹为笔记库」"| MV
docs/design/md-reader.md:142:  MV -->|"点 [[note]]"| MV
docs/design/md-reader.md:143:  MV -->|"链接到库内 PDF"| PR
docs/design/md-reader.md:144:  PR -->|"笔记「在笔记库中显示」（如已导出）"| MV
docs/design/md-reader.md:298:**v2 必须不做**：不在 preload 暴露 `writeFile`；装配根不注入 `MdFileWriter`（用例收到写请求返回 `write_disabled`）；`platform-node` 不为 markdown 实现写入适配器；UI 不显示「编辑」按钮或快捷键；任何代码不得以「保存译文」「导出」等名义写入用户笔记库文件夹（应用自有数据目录除外）。
docs/design/md-reader.md:367:| MD-25 | 调用写入用例返回 `write_disabled`；`getCapabilities` 返回 `canWrite:false`；platform-node 中没有 markdown 写入适配器（依赖检查） |
```
