# 待办与架构评审处理状态

状态：v0.6。日期：2026-10-30（Asia/Shanghai）。
用途：逐条记录[架构评审](./reviews/2026-10-30-architecture-review.md)的每个发现由哪个规格 PR 处理、落在规格哪里，以及还没处理、留给哪个里程碑的事。决定的理由见[差异清单](./v2-gap-and-changes.md) §6.6–§6.9；本文只记状态，不重述规格。§5 记 Jev 开关审查（2026-10-30 22:06）各项的处理状态。

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
| 阅读顺序实测：PP-DocLayoutV2、V3 开源输出与 AI Studio 托管 API 是否带阅读顺序 | M0（待执行，M3 开工前完成） | PRD §8 M0；差异清单 §7 |
| V3 不带顺序时标准档的顺序来源；高质量档是否改用 V2 | 实测后由 Wisdom 定 | ARCH §7.10「未决」 |
| 阅读顺序校验、题注绑定、扫描页判定、段落切分的阈值 | 基准定标（M3） | ARCH §7.10、§7.11；PRD QM-01、QM-02 |
| 百度 AI Studio PaddleOCR 托管 API 能否作为引擎 A 的来源 | M3 开工前 | ARCH §7.0；差异清单 §2.4.1 |
| worker 监管的重启上限与超时默认值 | M3（supervisor 实现 PR） | ARCH §10.5 |
| 诊断保留天数与体积的默认值 | M2 实测后 | ARCH §11 |
| Markdown 块窗口预算的默认值 | M2 实测后 | ARCH §4.5.3 |
| 首批 ADR：G18、`ui-events-declared`、`supervisor-state`、解析规则集 `oi-rules/1` | M1 建立 `docs/adr/` 时 | ARCH §16 |
| 高质量档是否开放 | M6d，QM-13 由用户拍板 | PRD §8 M6d |
| 「源码核对」是否改算「已核验」 | 待 Wisdom 定；翻转时同时改 RULES N-17 与 PRD AC-04、AC-87 | ARCH §7.5「唯一决定点」；差异清单 §6.9 |
| 手动「重新识别」是否保留 | 待 Wisdom 确认（规格已按「可以、但仍标未评分、没有自动补救」写） | PRD AC-90；差异清单 §6.9 |
| 切换路线后已处理论文是否自动重跑；能否按篇切换 | 待 Wisdom 定。规格先写为不改写已有采用版本，只有新解析和用户明确重跑才用新路线；路线是全局一条 | ARCH §7.12；PRD §3.5、§9 |
| 全局默认预设与来源优先级的默认顺序 | 全局默认保持待定（Wisdom 2026-10-30 23:55 起不再暂定「OCR+版面+Jev」）。来源优先级仍是提议：引擎 A → 引擎 B → 云 OCR → 多模态。M0 同一批论文对比后再由 Wisdom 定。新安装不预选路线 | ARCH §7.12、§7.1；PRD AC-86、AC-91 |
| 程序核对「与文字层或邻近内容一致」的重合比例阈值 | 基准定标（M4） | ARCH §7.5；PRD AC-89 |
| PP-DocLayout 在 8 GB 内存、无独显、CPU 上的内存与速度 | M0 实测；此前标未核实 | PRD §8 M0；差异清单 §7 |
| 订阅、按账号计费、账号系统、自有托管服务端 | 不进 v2。只预留 `AccountSession` 与 `account-token` 鉴权方案 | PRD §3.2、AC-94；ARCH §7.9.5 |
| 评分开关、三选一提示、「未评分」「源码核对」徽标与「为本文评分」入口的布局与文案 | 待 Loom；M6a 实现 | PRD §3.4、AC-85、AC-87 |
| 「明确不确定证据」作为补救入口的证据清单与验收 | 未定义，定义前不作为入口；需要时另开规格 PR | ARCH §7.1「低分再补」；差异清单 §6.9 第 8 条 |

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
| 可延后 1 | 三份规格的版本头太长 | 未处理；本次也没有改版本头（避开 PR #9） | PRD、ARCH、差异清单第 3 行 |
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
| P1-14 | DESIGN.md 文首（第 16 行）仍写「Loom 交付前 UI 只搭结构」。RULES 文首已写以 RULES 为准 | 未处理。过时句需 Loom 修改。本 PR 不改 DESIGN 正文（N-10）。负责人：Loom |
| P1-15 | README「历史草案」。该目录不授权实现，冲突时以根目录三份规格为准 | 已处理 |

### P2

| 编号 | 发现 | 状态 | 留给 |
| --- | --- | --- | --- |
| P2-1 | M6a 标题仍写「质量评分与预算」，预算在 M3 | 未处理。标题改为「质量评分」，正文里的 `BudgetGate` 接入保留，不改里程碑依赖 | M6a 开工前的规格整理 |
| P2-2 | 评估原因码散落，没有总表 | 未处理。不新增原因码。在 `contracts` 拟议处列一张现有原因码表，正文改成引用 | M3 写 `evaluation.ts` 时 |
| P2-3 | 规格版本头仍是 v0.6，内容已经超出 | 未处理。下一次规格 PR 把版本头收成「当前版本 + 变更指针」，历史句子移到 ARCH §16 / PRD §9。这次不改版本号 | 下一次规格 PR |
| P2-4 | `account-token` 没有出现在 §7.9.5 的目录树 | 未处理。目录树补 `auth/account-token.ts`，v2 调用即返回 `not_in_v2`，与 AC-94 ③ 同一条验收 | M1 写 providers 目录时 |
| P2-5 | 发版与坏模型停用没有清单 | 未处理。M8 前在 `docs/` 加一页发布清单，并在 `quality` 的部署规则里留「停用某个 `evaluatorVersion`」的配置位。已有记录不改写 | M8 前 |
| P2-6 | 第三方模型条款只写到「外发前询问」 | 未处理。外发同意里加一句：本应用不把用户文献或模型输出上传去做训练；回归集只用合成夹具或用户明确放入 `fixtures` 清单的文件。某家 ToS 禁止保存输出时标「未核实」，不编造 | 外发同意的下一次规格整理 |
| P2-7 | 许可证机器检查还只有包名字符串 | 未处理。保持到 M1。M1 的门禁 PR 必须包含 G10（license-checker 与 pip-licenses），不只保留字符串 grep | M1 |
| P2-8 | 诊断事件没有枚举 | 未处理。在 ARCH §11 列白名单（外发询问、预算拒绝、上游 5xx 的 request id、评分不可用）。未列入的事件名不得出现在日志调用里 | M2 写诊断时 |
| P2-9 | `reader` 的会话 hook 可能再长成上帝文件 | 未处理。M2 搭阅读器之前，在 ARCH §4.2 `reader` 行写明 hook 只订阅 `window.oi` 与 `pure.ts`，不保存采用版本或译文正文的副本 | M2 前 |

## 7. 工程成熟度（PR #11 第二轮，2026-10-31）

对照 `docs/reviews/v2-engineering-maturity.md`（分支 `feature/v2-full-review`）。Wisdom 2026-10-31 00:08 只批准两条 P0 和几项流程文件。下表里「未处理」的项这次不做。不改 CI 行为，不改分支保护。

| 编号 | 做什么 | 状态 |
| --- | --- | --- |
| E-P0-1 | README 对齐 v2，AGENTS.md | 已处理。与 23:55 的入口是同一份，不另写第二份规格 |
| E-P0-2 | 写明当前 CI 是空跑 | 已处理。README 与 docs/ci-and-environment.md「当前是空跑」 |
| E-P1-1 | ADR 索引 | 已处理：`docs/adr/README.md` 只指向 Q1–Q12。独立 ADR 文件仍在 M1 |
| E-P1-2 | Issue 与 PR 模板 | 已处理。字段来自 RULES §2 与 §8.4，PR 模板含所在提交 SHA |
| E-P1-11 | 事故复盘模板 | 已处理：`docs/incidents/TEMPLATE.md` |
| E-P1-12 | 三种版本号 | 已处理。README「三种版本号」 |
| E-P1-3 | 把两个 CI job 设为必需检查 | 未处理。仓库管理员做。Agent 不改分支保护（N-02） |
| E-P1-4 | CODEOWNERS | 未处理。等 Wisdom 指定路径归属 |
| E-P1-5 | Conventional Commits 检查 | 未处理。放进 M1 的 `pnpm check` |
| E-P1-6 | dependency-cruiser 与 `tsconfig.core.json` | 未处理。M1，按 ARCHITECTURE §13 |
| E-P1-7 | 空测试目录不再把 pytest 退出码 5 当成通过；Vitest 要有会失败的样例 | 未处理。M1。这次不改工作流 |
| E-P1-8 | `docs/acceptance/` 结果格式 | 未处理。M0 开工时 |
| E-P1-9 | 提示词目录与 Jev 模型卡 | 未处理。M4 / M6a |
| E-P1-10 | Dependabot 与 gitleaks | 未处理。这次不加 |
| E-P2-1–E-P2-10 | 并发取消、quarantine 目录、发版清单、崩溃只写本机、红队、`.env.example`、SECURITY.md、不用通用功能开关、Prettier、合入后是否删分支 | 未处理。按原报告的里程碑。E-P2-10 由管理员决定，Agent 不改仓库设置 |
