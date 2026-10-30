# open-immerse v2 全面审查（2026-10-30）

状态：审查报告。只记录问题与改法建议，不修改 PRD、ARCHITECTURE、RULES、DESIGN 或代码。
审查人：按 Wisdom 2026-10-30 23:30 与 23:32 的范围执行。
基线：`main` `0febb03`（`docs(spec): 入库 v2 设计稿并定义外发同意接口（v0.6）(#9)`）。
对照：Draft PR #10，分支 `feature/v2-jev-toggle`（标题「docs(spec): 质量评分开关与声明式处理路线（AC-85–AC-94）」）。该分支已合入 #9，本报告只读，不改它。
行号：`main` 上的文件用行号；只存在于 PR #10 的文字用章节号（`§3.4`、`§7.12`、`AC-85`–`AC-94`、`N-20`），因为该分支的行号会随重基而变。

严重度：

- **P0 必须改**：按字面开工会把功能做成另一回事，或让没有上下文的 coding agent 选错产品。
- **P1 建议改**：规格能读，但缺契约、缺单一决定点或两处说法不一致，实现时会各写一套。
- **P2 可延后**：不挡当前里程碑，合入前或对应里程碑开工前补上即可。

未核实的上游事实保持「未核实」，不补价格、基准或权重哈希。需要 Wisdom 拍板的事项只列在文末专节，本文不替他选。

---

## 1. 范围与方法

读过的权威规格：`PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`、`LICENSE`、`README.md`、`package.json`、`.github/workflows/ci.yml`、`eslint.config.js`、`workers/parser/pyproject.toml`、`docs/ci-and-environment.md`、`docs/backlog.md`、`docs/v2-gap-and-changes.md`（按条目核对，未逐字重读核实表）、`docs/v1-review.md`（矢量重绘与可迁移测试两节）、`docs/architecture/README.md` 文首与已确认需求表、`docs/reviews/2026-10-30-architecture-review.md` 的结论对照（其 P0 已由后续规格 PR 处理，本报告不重复开单）。

仓库现状：几乎全是规格。业务切片目录尚未建立。CI 只跑现有工具链（ESLint recommended、`node --test`、ruff、允许空 pytest、锁文件含 `pypdfium2` 且不含 PyMuPDF）。

PR #10 的 diff 覆盖 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`docs/backlog.md`、`docs/v2-gap-and-changes.md`。新增 `PRD §3.4`、`§3.5`、`AC-85`–`AC-94`、`ARCHITECTURE §7.12`、`RULES N-20`。

23:32 的两条补充各自成节：第 6 节核对 PR #10 是否漏写或写偏已定决定；第 7 节评估给外部 coding agent 的项目文档。

---

## 2. 总评

规格的主骨架可以保留，不需要推倒重来。切片边界、seam、预算先预留、按服务商外发同意、Apache-2.0 与 pypdfium2、UI 只依赖 seam，这些在 `main` 上已经写成可执行的约束。先前架构评审的 P0（ingest 编排、进程边界、预算闸门、译文裁图、删除 G17）已经进规格，`docs/backlog.md` 有处理表。

不能按 PR #10 的字面开工路线层。`§7.12` 与 `AC-91`–`AC-94` 把路线写成四类积木的配置，同一次改动里 `§7.1` 的流程图和「引擎 B 什么时候运行」仍按固定流水线写。两套句子同时成立时，agent 会实现其中一套并让验收失败。

仓库还不能让一个没有上下文的 coding agent 不走样地实现功能。`RULES.md` 本身写了禁止事项、分支、PR 与交接模板；默认入口 `README.md` 第一句是另一个产品，且没有 `AGENTS.md`、`.cursor` 规则、贡献指南、Issue 模板。当前 CI 全绿也不等于 `ARCHITECTURE §13` 的 G1–G18 已落地。

---

## 3. 建议保持

下列决定已经写进 `main`（路线层的增补在 PR #10），审查不建议改方向：

- 产品是 Windows / macOS 桌面应用：英文学术 PDF 到可对照、可追溯、公式不走样的中文阅读。技术栈 Electron + TypeScript + React + Python worker（uv）。
- API 优先：有托管 API 时默认 API；本地是同一端口的一等选项；没有 Key、拒绝外发或 API 不可用时不静默换服务商、不静默改本地（`PRD.md` 第 25 行，`ARCHITECTURE.md` §7.0）。
- 18 个切片与依赖矩阵（`ARCHITECTURE.md` §4.3）；UI 只经 seam；core 不 import UI（G13–G16，`RULES.md` §8）。
- 文件硬上限与「一个不变量一个文件」（`ARCHITECTURE.md` §6，`RULES.md` §1.3）。
- 服务商适配层与已登记格式：`openai-chat`、`anthropic-messages`、`gemini-generate-content`、`baidu-ocr`、`zhipu-layout-parsing`，以及 worker 侧的面壁格式（`ARCHITECTURE.md` §7.9.6，约第 1313–1326 行）。百度千帆走 `openai-chat`，规格已写明，不必再造一个千帆格式。
- 外发按服务商问一次；付费调用先 `BudgetGate.reserve`；译文 `failureKind` 三分：`check_failed` / `network` / `model_error`（`ARCHITECTURE.md` §8.1.1，约第 1484–1527 行）。
- PDF 渲染只用 pypdfium2（当前锁 `5.14.0`，许可证 Apache-2.0 OR BSD-3-Clause，与项目 Apache-2.0 兼容）。禁止 GPL / AGPL，含 PyMuPDF 与 MiniCPM `pdf` extra（`RULES.md` §1.5，`docs/ci-and-environment.md` 第 5 行）。
- BabelDOC 只借思路（N-19，`ARCHITECTURE.md` §7.11）。
- 订阅、计费、账号系统不进 v2。PR #10 的 `AC-94` 与 `§7.9.5` 预留 `account-token` 与空 `AccountSession`（返回 `not_in_v2`）。这是未合入，不是漏写。
- Unlimited-OCR 因为不输出坐标暂不接入（`PRD.md` Q12）。
- `DESIGN.md` 与 `docs/design-principles.md` 由 Loom 参照 Apple HIG 的思想与 Windows Fluent 编写，明确覆盖 Windows 与 macOS（`DESIGN.md` §0，`docs/design-principles.md` §3）。其他 Agent 不改正文（N-10）。

---

## 4. 问题清单

### 4.1 架构与模块边界

#### P0-1 流程图把多模态识别绑在「评分关闭」

证据（PR #10 `ARCHITECTURE.md` §7.1）：

- mermaid 节点写「多模态识别（只在评分关闭时，§7.4「评分开关」）」。
- 同节「全路径评估记录」把多模态写成「补救，以及评分关闭时的识别」。

同一次改动里：

- `§7.12` 的自定义组合允许「多模态 + 版面 + Jev」。
- `AC-92` ⑤：该组合下多模态识别的候选送 Jev，不记 `not-run`。
- `AC-88` ⑤：Jev 开着时识别列表里的多模态照常评分。
- `PRD §3.4`：「要只开 OCR、只开多模态或两者都开，改的是路线的识别列表，不再另设一个只会在评分关闭时生效的开关。」

agent 若按流程图实现，评分开着时多模态识别请求为 0，`AC-92` ⑤ 失败。

改法：识别是否运行只看路线的识别列表。评分开关只决定记 Jev 的 `scored` / `error` / `unavailable`，还是记 `not-run/disabled`。流程图、`§7.1` 正文与 `AC-18` 的举例改成同一句。补救仍只由有效低分触发，与「多模态作为识别来源」分开。

#### P0-2 引擎 B 仍被写成「什么时候运行不变」

证据：

- `main` `PRD.md` 第 36 行 S2：「什么时候运行 B 不因来源改变」。第 71 行设置表：「什么时候运行 B（对比与兜底）不因来源改变」。PR #10 的 diff 没有改这两处。
- PR #10 `ARCHITECTURE.md` §7.1：「引擎 B 什么时候运行不变：仍是对比与兜底。」
- 同分支 `AC-92` ①②：`multimodal-layout` 与 `multimodal-only` 下引擎 B 的请求为 0。`AC-88` ②：识别列表不含引擎 B 时，对应请求为 0。`§7.12` 预设表里，前两个预设的识别列不含引擎 B。

「对比与兜底」只描述 `ocr-layout` 与 `ocr-layout-jev`。把它写成全路线的不变式，agent 会在仅多模态路线上仍提交引擎 B。

改法：引擎 B 是否运行由路线识别列表决定。「对比与兜底」只写在 `ocr-layout` / `ocr-layout-jev` 两行预设说明里。S2、设置表第 71 行、`§7.1` 的那一句一起改。`AC-60` 测的是「来源为 API 时怎么请求」，保留；不要把它读成「每条路线都必须跑 B」。

#### P0-3 `LayoutEngine` 没有进入协议，换版面实现仍要改解析内部

证据：

- PR #10 `§7.12` 把版面端口写成 `parsing` 的 `LayoutEngine`，并写「以后换别的版面模型，只加一个 `LayoutEngine` 实现」。`AC-93` ②④ 要求本地与自建远程是同一个 `LayoutEngine`、同一 HTTP + SSE 协议，换实现时 `ingest` 与 `formula` 的 core 改动为 0。`N-20` 禁止在 core 里写死另一块积木。
- `main` `ARCHITECTURE.md` §7.2（约第 946 行）的 `LayoutDetector` 是引擎 A 的内部部件，不是独立端口。PR #10 没有改 §7.2。
- `main` `ARCHITECTURE.md` §10.2（约第 1669 行）作业种类仍是 `parse` / `evaluate` / `render`。PR #10 没有加版面作业，也没有写「`parse` 的配置里版面阶段可关、识别阶段另列」。

结果：换版面模型或关掉版面，仍要改 `parse_page` 内部。这与 `AC-93` ④、`N-20` 的验收直接冲突。引擎 A 今天把版面和识别绑在同一次 `parse` 里（`main` §7.1 引擎 A 节点），预设 `ocr-layout` 又要求「版面 + 引擎 A 的识别阶段」可分开描述。

改法：在 §7.2 与 §10.2 写出版面阶段与识别阶段的边界。两种都合规格的写法留到文末 D-2 由 Wisdom 定：独立 `layout` 作业，或 `parse` 作业的配置明确拆成可关的版面阶段与识别阶段，产物 schema 不变。无论选哪种，`LayoutEngine` 的 Protocol、输入 `PageInput`、输出 `LayoutResult`（区域 + 可选顺序）要写成与 `QualityEvaluatorBackend` 同级的拟议类型，不能只出现在 §7.12 的表里。

#### P0-6 评分开着时，多模态候选进不了「已核验 LaTeX」

证据（PR #10 `ARCHITECTURE.md` §7.5）：

- 第 2 步「识别候选」只列引擎 A、引擎 B、云 OCR。通过程序核对且有效分数不低于阈值才得到 `verified-latex`。
- 第 5 步程序核对才把「多模态识别」列进候选，且前提是评估记录为 `not-run/disabled`（评分关闭）。
- `AC-92` ⑤ 与 `AC-88` ⑤ 要求评分开着、路线含多模态时，多模态候选送 Jev。

agent 按第 2 步实现 `formula-policy` 时，多模态候选即使 Jev 高分也不会变成 `verified-latex`。自定义路线「多模态 + 版面 + Jev」的公式会落到裁图。

改法：第 2 步的识别候选与路线识别列表一致，包含多模态识别与手动重新识别的候选。第 5 步继续只处理 `not-run/disabled`。来源权重仍是配置值，不在本报告里填数字。

#### P1-1 路线配置没有拟议类型，文档模型与路线的关系没有写死

证据：PR #10 `§4.2` 点名 `route-presets.ts`、`route-config.ts`、表 `ing_route`（一行）。`§7.12` 用表格描述四类积木，没有像 `§7.0` / `egress` 那样给出 `RouteConfig` 的 TypeScript 形状。`§8.4` 的迁移例子仍只列候选页、采用版本、片段表，没有 `ing_route` 的 `schemaVersion`。`AC-91` ② 写「换路线只改配置」，没有写「文档模型的 schema 不随路线变；`ParseRun` 记录当时的路线 id 与配置摘要」。

没有快照时，事后无法回答「这篇文献当时走的哪条路线」。这和「结果要能追溯来源、评分、核对状态」是同一类要求。

改法：在 `contracts` 拟议 `RouteConfig`（版面：开/关与部署；识别来源列表；判定列表；兜底链 id；`schemaVersion`）。`ParseRun` 增加只读快照字段。声明：换预设不迁移文档模型。`ing_route` 的列与版本升级写进 `§8.4`。

#### P1-2 评分开关有两处存储，读的时候以谁为准没有写

证据（PR #10）：

- `quality` 增加 `scoring-switch` 与 `sqlite-scoring-switch-store`。
- `AC-91` ④：选预设时经 `scoring-switch` 改开关；只拨开关则路线变成自定义，版面与识别不动。
- `§7.12` 判定积木的列表里同时有「含不含 Jev」。

规格没有写：启动时两处不一致（例如开关为关、路线判定列表仍含 Jev，或反过来）以哪一处为准、是否自动修、修之前请求发不发。

改法：见文末 D-3。选定之后写成一条不变量，并加一条 core 测试：人为把两处写成不一致时，读路径的行为唯一。

#### P1-3 `open-document.ts` 仍是一条固定流水线

证据：

- `main` `ARCHITECTURE.md` §4.2 `ingest` 行（约第 378 行）：`open-document.ts` 的职责是「入库 → 提交解析 → 取源码候选 → 评分 → 公式决定 → 必要时补救并重新评分 → 采用 → 按块翻译」。
- PR #10 把 `ingest-policy.ts` 改成「按路线做版面、识别……不点名任何积木的具体实现」，但同一行里 `open-document.ts` 仍是上面那句固定顺序。
- `RULES.md` §1.3：函数上限 80 行。把整条编排放进一个用例文件，有变成新的 `translateWholeDocument` 的风险（`ARCHITECTURE.md` §14 记录 v1 该函数 611 行）。

改法：`open-document.ts` 只做「取当前路线 → 循环调用 `ingest-policy` 给出的下一步 → 调对应切片的 `index.ts`」。步骤清单放在 `ingest-steps.ts`。policy 的输入输出保持纯函数。不要在用例文件里写死积木顺序。

#### P2-9 `reader` 的会话 hook 可能再长成上帝文件

证据：`main` `ARCHITECTURE.md` §4.2 `reader` 行把 `ui/hooks/use-document-session.ts` 与画布、译文栏、公式视图、选区工具条放在同一职责行，没有写会话状态的归属（当前文献、当前页、对照滚动、选区各在哪一层）。

改法：M2 搭阅读器之前，在该行写明 hook 只订阅 `window.oi` 与 `pure.ts`，不保存采用版本或译文正文的副本。状态以 core 的查询结果为准。此项不扩大产品范围。

### 4.2 可插拔

`main` §7.9 的格式表、鉴权方案（`bearer` / `x-api-key` / `x-goog-api-key` / `baidu-access-token`）和「一个能力一个端口」已经覆盖 23:32 里的 API 格式与 OCR 可扩展（百度、智谱、面壁）。PR #10 `§7.9.5` 补了 `account-token` 与空 `AccountSession`。PaddleOCR 托管 API 在核实前不建适配器，PR #10 也没有虚构版面托管商。这些保持。

P0-3 是可插拔在版面上的缺口，不在这里重复开单。

#### P2-4 `account-token` 没有出现在目录树

证据：PR #10 `§7.9.5` 正文预留 `auth/<scheme>.ts` 的 `account-token`。同节目录树没有列出该文件。agent 可能漏建空方案，或在格式适配器里分叉。

改法：目录树补一行：`auth/account-token.ts`，v2 调用即返回 `not_in_v2`，与 `AccountSession` 空实现同一条验收（`AC-94` ③）。

### 4.3 UI 与核心业务分离

`RULES.md` §8 与 `ARCHITECTURE.md` §2.1–§2.6、G13–G16 足够让 UI 任务停在 seam 上。缺口在入口文档（第 7 节）和下面这一条过时句。

#### P1-14 `DESIGN.md` 文首仍写「Loom 交付前 UI 只搭结构」

证据：`DESIGN.md` 第 16 行：「结构与行为规则可以先按本文实现（RULES：Loom 交付前 UI 只搭结构、不定视觉）。」Loom 的草案已于 2026-10-30 入库（同文件第 1–5 行，`RULES.md` 第 3、155 行写明不再标「待 Loom 产出」）。`RULES.md` 第 5 行又写：标「待审批」的视觉数值仍不是定稿。

两句一起读，agent 会要么忽略全部视觉规格，要么把待审批的数值当成定稿。

改法：删掉「交付前只搭结构」。改成与 `RULES.md` 第 5 行同一句：结构、状态与「当 seam 返回 X 时显示 Y」按 DESIGN 实现；标「待审批」的颜色、间距、字号不当作定稿。正文仍只由 Loom 改（N-10），本报告不改 `DESIGN.md`。

平台覆盖本身没有漏：`DESIGN.md` §0 与 `docs/design-principles.md` 第 13 行、第 39 行起的平台表已经写 Windows 与 macOS，并声明只借 Apple HIG 的思想、不抄素材。

### 4.4 后续开发与维护

#### P1-5 翻译失败的三分类有了，上游错误怎么归类没有表

证据：`ARCHITECTURE.md` §8.1.1 约第 1515 行：「请求本身失败（网络、超时）记 `network`，服务商返回错误或无法解析的输出记 `model_error`」。`ProviderFailure.kind`（约第 1298–1305 行）还有 `auth`、`quota`、`rate_limited`、`invalid_request`、`too_large`。校验失败走 `check_failed`，这条是清楚的。

`auth` / `quota` 算模型错误还是另有用户动作（去填 Key、去改预算），规格没有映射。agent 会各写一套，界面文案就和 `DESIGN.md` D7 对不上。

改法：在 §8.1.1 加一张表，只做归类，不新增产品状态。建议的对应关系（若 Wisdom 不同意，改表即可，不要另起一套枚举）：

| `ProviderFailure.kind` | `failureKind` | 用户下一步已经存在的入口 |
| --- | --- | --- |
| `timeout` | `network` | 重试 |
| `rate_limited` | `network` | 重试（遵守 `retryAfterMs`，不盲重发） |
| `auth`、`quota` | `model_error` | 设置里的 Key / 预算；文案可带原因码，枚举不增加 |
| `invalid_request`、`too_large`、`service_failed` | `model_error` | 重试或更换翻译服务 |
| 完整性校验不过 | `check_failed` | 重译；不把候选 LaTeX 写进 markdown |

解析、OCR、Jev 的用户可见错误见 P1-13。

#### P1-6 提示词只有缓存键字段，没有正文登记处

证据：`ARCHITECTURE.md` 约第 1544、1556 行：缓存键含「提示词模板版本」。没有写模板正文放在哪个文件、版本与模型 id 如何分开、改一句提示词是否必须升版本并让旧缓存失效。

改法：指定单一目录（例如 `packages/features/translation/src/domain/prompts/`，一个模板一个文件，文件头写版本）。改模板正文必须升版本，并加一条缓存测试：版本变化则不读旧译文。模型 id 继续只来自注册表，不写进模板文件名以外的第二处。此项不新增翻译产品能力。

#### P1-7 评测有指标，没有作业契约与记录格式

证据：`PRD.md` §6.2 的 QM-01–QM-17 与 §8 M0 写了「待执行」。`ARCHITECTURE.md` §12 写了测试分层。`docs/v1-review.md` 有可迁移测试的索引。本仓库没有评测作业的输入输出、回归集存放位置、四条预设横向对比的记录格式。`fixtures/corpus` 在规格里是「清单 + sha256」，文件本身尚未入库（与 N-12 不提交大 PDF 一致）。

agent 做 M0 时会自己发明表格，路线对比无法复跑。

改法：在 `ARCHITECTURE.md` §12 增加一小节，只定义记录形状，不填数字：一篇文献的 id 与 PDF sha256、路线 id、各来源请求数、评估记录状态、显示决定计数、失败原因码。样例放 `fixtures/eval/` 的合成数据。v1 语料的取数步骤写清「只读 clone 旧仓库、不提交 PDF、清单记 sha256」，与 N-07、N-12 一致。

#### P1-8 按区块调用没有页级硬顶

证据：PR #10 `§7.12` 承认一页外部调用会从「一页一次」变成「一个区块一次」，常见是几次到十几次，并要求每次走预算闸门。`main` `ARCHITECTURE.md` §7.8 与 `PRD.md` 第 89 行：默认次数上限是占位值，数字经 Wisdom 批准后才写入（N-14）。规格没有「单页识别请求数硬顶」这一条。

占位上限若按篇而不是按区块，多模态加版面会在一页内打穿或形同虚设。本报告不填具体数字。

改法：在 §7.8 写明占位上限的计量单位必须覆盖「每页区块请求」。硬顶的具体 N 留到 M0 之后、经 Wisdom 批准再写入 `default-caps.ts`。在数字批准前，实现不得自选一个 N 当作已定标（N-14）。

#### P1-9 自动补救有用户故事，设置表没有这一行

证据：`PRD.md` 第 125 行 US-07「打开 / 关闭自动补救」。`ARCHITECTURE.md` §7.1 约第 898 行分支「补救开启」。`PRD.md` §3.3 设置表（约第 64–89 行）没有「自动补救」行，默认开或关未写。`docs/backlog.md` 已记为未处理。PR #10 未补。

改法：见文末 D-4。选定后在 §3.3 加一行，并让 `AC-05` 的「补救关闭」指这一行，而不是指评分开关。

#### P1-10 规格门禁与仓库 CI 的落差没有写成 Agent 禁令

证据：

- `ARCHITECTURE.md` §13（约第 1785–1813 行）要求 G1–G16、G18：`strict-type-checked`、`max-lines`、dependency-cruiser、import-linter、gitleaks、license-checker、Vitest、热点与 PR 体量。
- 仓库 `.github/workflows/ci.yml` 与 `docs/ci-and-environment.md` 只跑 lint、typecheck、`node --test`、ruff、pytest（允许退出码 5）、锁文件字符串检查。
- `eslint.config.js` 使用 `recommended`，没有 `strict-type-checked`、`max-lines-per-function`、`no-restricted-imports`。
- `docs/backlog.md` 把门禁落地放在 M1（P2-9 那一项），这是预期落差。

预期落差本身不是缺陷。缺陷是：没有一条 Agent 规则写「G1–G18 的脚本落地之前，不新建 `packages/features/**` 业务切片」。agent 看到 CI 全绿，会开始写切片，而 600 行、依赖方向、core 不碰 DOM 都还没有机器检查。

改法：在 `RULES.md` §6 增加一条（编号顺延，不要复用 N-01–N-20）：M1 门禁 PR 合入前，业务切片目录不创建；允许的代码限于工具链、契约草稿与测试夹具。`docs/ci-and-environment.md` 加一句：当前工作流全绿只说明工具链能跑，不等于 §13 已生效。`eslint.config.js` 的升级属于 M1 实现，本报告不改配置。

#### P1-13 解析、OCR、Jev 的用户可见错误没有与翻译三分法对齐

证据：翻译路径有 `failureKind`（见 P1-5）。Jev 有 `error` / `unavailable` 与原因码（`ARCHITECTURE.md` §7.3 约第 1012 行）。云 OCR 与解析失败的用户文案没有同一张原因表。`AC-56` 只约束翻译块。

这不是要求给解析再做一个新产品状态。缺的是一张映射，否则每个切片各写「失败了」。

改法：诊断事件与设置里的提示沿用三类词：校验失败、网络错误、模型错误。Jev 的 `unavailable/auth` 与预算到顶继续用已有文案（填 Key、已达上限、三选一），不新造第四类用户状态。具体表与 P1-5 放在同一处，避免两张表漂移。

#### P2-1 M6a 标题仍写「质量评分与预算」

证据：`PRD.md` 第 400 行（PR #10 同样保留）里程碑名是「M6a 质量评分与预算」。预算账本在 M3 交付（同文件里程碑表）。`docs/backlog.md` 已建议改名。

改法：标题改为「质量评分」，正文里对 `BudgetGate` 的接入保留。不改里程碑依赖。

#### P2-2 评估原因码散落

证据：`not-run/disabled`、`unavailable/budget`、`unavailable/consent_required`、`error/too_large` 等出现在 §7.1、§7.3、§7.4、AC 正文里，没有一张总表。

改法：在 `contracts` 拟议处列一张原因码表，正文改成引用。不新增原因码。

#### P2-3 规格版本头仍是 v0.6，内容已经超出

证据：`RULES.md` 第 3 行、`PRD.md` 与 `ARCHITECTURE.md` 文首仍标 v0.6。PR #10 增加了整节路线，也没有改版本号。`docs/backlog.md` 把「版本头过长」标为可延后。

改法：下一次规格 PR 把版本头收成「当前版本 + 变更指针」，历史句子移到 §16 / PRD §9。不要在本审查里改版本号。

#### P2-5 发版与坏模型停用没有清单

证据：`RULES.md` N-04 禁止 Agent 发版。`ARCHITECTURE.md` §8.4 写迁移失败回滚一份备份。`PRD.md` AC-66 写旧应用打开新库只读。没有：发布前检查清单、发现某 `evaluatorVersion` 或提示词版本有系统性错误时如何停用（停用之后新解析不再选用，已有记录不改写）。

改法：M8 前在 `docs/` 加一页发布清单，并在 `quality` 的部署规则里留「停用某个 `evaluatorVersion`」的配置位。不在本报告里设计发版流水线。

#### P2-7 许可证机器检查还只有包名字符串

证据：`docs/ci-and-environment.md` 第 53 行：CI 确认锁文件含 `pypdfium2` 且不含 PyMuPDF。`ARCHITECTURE.md` §13 G10 要求 license-checker 与 pip-licenses，属于 M1。当前检查挡得住包名，挡不住换一个名字的 AGPL 传递依赖。

改法：保持现状直到 M1。M1 的门禁 PR 必须包含 G10，而不是只保留字符串 grep。此项是预期落差的提醒，不单独挡路线规格。

#### P2-8 诊断事件没有枚举

证据：`ARCHITECTURE.md` §11 写了日志字段。多处要求「记诊断事件」，`diag-events.ts` 在目录规划里出现，事件名没有清单。

改法：在 §11 列白名单（外发询问、预算拒绝、上游 5xx 的 request id、评分不可用）。未列入的事件名不得出现在日志调用里。密钥与正文不进字段（已有 N-05）。

### 4.5 AI 产品工程

评测缺口见 P1-7。页级费用见 P1-8。提示词版本见 P1-6。

已经写清、建议保持的部分：假评估器永不产生「已核验」（AC-84）；评分错误不是低分（AC-05）；程序核对挡不住「能渲染但错」，QM-03 单列（PR #10 `§7.5`「已知代价」与 `AC-89` ⑤）；裁图不到再占位框，行内、行间、图、表都走这条链（`AC-89` ③）；外发同意与本地优先存储；`formulaDigest` 不含「是否已核验」，源码核对翻转不触发重译（`AC-57` ⑨，PR #10 `§8.1.1`）。

Jev 版本锁定的写偏见 P1-4。

#### P1-4 `1269e4f` 没有钉在 Jev 那一节，复核一句可以被读成「可以换提交」

证据：

- `docs/v2-gap-and-changes.md` 第 181 行：「锁定仓库提交（当前 `1269e4f`）、SDK 版本、权重 sha256；M6a 与 M6b 开工前各复核一次。」
- `main` `ARCHITECTURE.md` 第 920 行把 `1269e4f` 写在引擎 B 的 SDK 上，并注明托管流水线是否与该提交一致**未核实**。
- `§7.4` 用该提交引用了 Jev 文档行号（PR #10 约在自检与面壁 API 两段），Q1 的正文仍是「锁定上游提交，开工前复核」。权重 sha256 没有出现，这是对的，因为未核实，本报告也不编造。

「复核」若被理解成开工时可以改锁，则引擎 A、引擎 B、百度 OCR、智谱 OCR 经过的就不是同一次决定所锁定的评分器。

改法：在 `§7.4` 写明当前锁是 MiniCPM-OCR 仓库提交 `1269e4f`。M6a / M6b 的复核只记录与该提交的差异。更换提交必须另一次 Wisdom 决定（见 D-6）。评分开着时，引擎 A、引擎 B、百度 OCR、智谱 OCR 的候选都经这个锁定版本的 Jev 评分。评分关着时不调用 Jev，这是开关决定，见第 6 节与 D-7。

### 4.6 安全与合规

已经写清、建议保持：

- 密钥只在 main，经 `safeStorage`；worker 只在内存使用；远程 worker 不收桌面的服务商 Key（`ARCHITECTURE.md` §1、§10.1）。
- 开发 Key 只经环境变量，仓库不读 `.env`（N-05，`ARCHITECTURE.md` §15.4）。
- 日志对 `access_token`、`key`、`client_secret` 打码（`§7.9.5`）。
- 项目许可证 Apache-2.0（根目录 `LICENSE`）。pypdfium2 为 Apache-2.0 OR BSD-3-Clause。
- 禁止 AGPL / GPL（N-13）。

#### P2-6 第三方模型条款只写到「外发前询问」

证据：外发同意写明会发什么、不上传原 PDF（`PRD.md` §3.3）。arXiv 下载的频率、超时与冷却在 `ARCHITECTURE.md` §7.6。没有写：模型输出可否进入用户笔记导出、可否作为回归集再分发。v2 笔记库只读（N-18），导出范围本身已受 PRD 约束。

改法：在外发同意的规格里加一句指针：本应用不把用户文献或模型输出上传去做训练；回归集只用合成夹具或用户明确放入 `fixtures` 清单的文件。不在 v2 做订阅条款。若某家服务商的 ToS 禁止保存输出，实现时在该注册表记录里标「未核实 / 需 Wisdom 看过 ToS」，不要现在编造哪一家禁止。

### 4.7 跨文档矛盾

P0-1、P0-2、P0-6、P1-3、P1-14 都是跨文档或同文档前后矛盾，不另计。

#### P1-12 `AC-20` 的「关掉 API 来源」没有设置项

证据：`PRD.md` 第 179 行 AC-20：「托管 API 不可用（用户关掉 API 来源或拒绝外发）时……」。§3.3 的设置是每个能力「本地 / API」，外发是按服务商同意或拒绝。没有名为「关掉 API 来源」的总开关。agent 容易把它做成评分开关，或做成一个规格里不存在的全局开关。

`docs/backlog.md` 已建议改写 AC-20，状态仍是未处理。

改法：AC-20 改成两句已有机制：该能力选了「本地」，或该服务商的外发同意是拒绝。删掉「关掉 API 来源」这个没有对应设置项的说法。

#### P1-15 根 README 把历史草案说成当前方案

证据：

- `docs/architecture/README.md` 第 6–12 行有「历史输入」「不要当作 v2 范围」的横幅。
- 同文件第 16 行起仍列出手机平台、账号式的未来能力。
- 根 `README.md` 第 16–22 行把该目录称为「完整方案与阅读导航」，并写「当前为可审阅设计方案；应用实现、模型精度与双平台性能仍须按方案逐项验收。」
- `RULES.md` 第 7 行的优先级：用户指示 > RULES > ARCHITECTURE > PRD > `docs/architecture/` 草案。第 151 行：草案是历史输入。

横幅挡得住仔细读完文首的人。从根 README 点进去的 agent 会按第 22 行「按方案验收」，把手机同步或「多模态不能替代主流程」（草案第 19 行）当成 v2 范围。后者与 PR #10 的「多模态可以是识别来源」直接冲突。

改法：根 README 第 16–22 行改成：该目录是历史草案，冲突时以根目录三份规格为准，草案中的需求表不授权实现。草案正文保持不动（它们是历史记录）。详见第 7 节 P0-5。

---

## 5. 计数

| 严重度 | 条数 | 编号 |
| --- | --- | --- |
| P0 | 6 | P0-1、P0-2、P0-3、P0-4（第 6 节）、P0-5（第 7 节）、P0-6 |
| P1 | 15 | P1-1–P1-10、P1-12–P1-15，以及第 7 节的 P1-11 |
| P2 | 10 | P2-1–P2-10（P2-9 在 §4.1，P2-10 在第 7 节） |

P0-4 与 P0-5 放在专节，因为它们分别属于「PR #10 漏写」和「agent 入口文档」，严重度仍计入上表。

---

## 6. Draft PR #10 对照 2026-10-30 23:32 的已定决定

本节只回答：这些决定在 `feature/v2-jev-toggle` 里是写到了、写偏了，还是没写。`main` 上还没有 §3.4 / §7.12，那是未合入，不算 PR #10 漏写。

### 6.1 已写入，本报告不要求改方向

| 决定 | 写在哪里 |
| --- | --- |
| Jev 可关，默认开；关闭后界面「未评分」；关闭前的已核验记录不改写 | `PRD §3.4`、`AC-85` ①③ |
| 重新打开不自动补评；用户逐篇「为本文评分」 | `AC-85` ⑤、`§3.4`「重新打开之后」 |
| 路线含云 OCR 时，评分关着也照常请求，并走外发与预算 | `AC-86` ④、`§7.7` |
| arXiv 通过覆盖率与逐公式核对后标「源码核对」；是否算已核验只有 `formula/domain/source-check-standing.ts` | `AC-87`、`§7.5`「唯一决定点」。当前结论是不算。翻转要同时改 N-17 与 AC-04、AC-87 |
| 评分关闭时 OCR 与多模态照常；只开其中一个是改识别列表，由程序核对判定 | `§3.4`、`AC-88`、`AC-89` |
| 不通过先裁图，再占位框「图见原文第 N 页（点击查看）」；行内公式、行间公式、图、表都适用 | `AC-89` ③、`§7.5` 第 6 步与「降级链」 |
| 路线是四类积木的声明式组合，不把 A/B/C 写成三套死路线；换路线只改配置 | `§3.5`、`§7.12`、`AC-91`、`N-20` |
| 四个预设；`ocr-layout-jev` 暂定全局默认，等 M0 后由 Wisdom 改定 | `§7.12` 预设表、`AC-91` ③、`AC-92`。规格自己标了待定 |
| 版面 PP-DocLayout 可关；本地与自建远程同一协议；8 GB 内存无 GPU **未核实**，放进 M0 | `§7.12`「部署」、`AC-93`、PRD M0 |
| 能力在本地、第三方 API、自有托管之间切换；鉴权支持 API Key 与账号 token | `AC-94`、`§7.9.5` |
| 订阅与计费不进 v2，只预留接口 | `AC-94` ③、`§3.2` |
| 翻译失败按校验失败、网络错误、模型错误分开提示 | `main` 已有，PR #10 没有改坏。映射缺口是 P1-5，不是这条决定没写 |
| PDF 用 pypdfium2；项目许可证 Apache-2.0 | `main` §7.1「页面图」、`docs/ci-and-environment.md`、`LICENSE`、`RULES.md` §1.5 |
| Unlimited-OCR 因不输出坐标暂不接入 | `PRD` Q12 |
| DESIGN 与设计原则由 Loom 参照 Apple 准则，适用于 Windows 与 macOS | `DESIGN.md` §0、`docs/design-principles.md` §1–§3。文首过时句是 P1-14 |

API 格式（OpenAI 兼容、百度、Anthropic、Gemini；OCR 可扩展到百度、智谱、面壁）在 `main` `ARCHITECTURE.md` §7.9.6 已经覆盖。PR #10 没有删这张表。

### 6.2 写偏

| 编号 | 写偏的句子 | 与哪条已定决定冲突 |
| --- | --- | --- |
| P0-1 | §7.1 流程图与「全路径评估记录」：多模态识别只在评分关闭时 | 识别列表决定是否运行；Jev 开着且列表含多模态时要送评（`AC-88` ⑤、`AC-92` ⑤） |
| P0-2 | `PRD` S2、设置表、§7.1：引擎 B 什么时候运行不变，仍是对比与兜底 | `AC-92` ①② 要求两个多模态预设的引擎 B 请求为 0 |
| P0-6 | §7.5 第 2 步的已核验候选不含多模态 | 同上，评分开着时多模态高分也要能成为 `verified-latex` |
| P1-2 | 开关在 `scoring-switch`，判定列表又含 Jev，不一致时无规则 | `AC-91` ④ 已承认两处都会改，缺读路径 |
| P1-3 | `open-document.ts` 仍写死入库到翻译的固定顺序 | `AC-91` ①：core 不点名另一块积木的实现 |
| P1-4 | `1269e4f` 出现在差异清单和引擎 B 句；§7.4 只说锁定并复核 | 23:32：Jev 版本锁定该提交。复核一句见 D-6 |

### 6.3 漏写

#### P0-4 版面关掉之后，整页识别结果如何变成带坐标的块

证据（PR #10）：

- `AC-88` ③：版面关着时多模态发整页。预设 `multimodal-only` 就是这条（`§7.12`）。
- `AC-93` ⑤：「每个区块带坐标」。
- `§7.12` 版面行：关掉后不切块，识别积木收整页；文字层不可用时「用识别结果自带的顺序」。
- `main` `AC-71`：云 OCR 不决定阅读顺序。
- 点击占位框要「跳到第 N 页并定位该区域」（`AC-89` ③）。定位需要区域框。
- `§7.2` 的 `PageCandidate` 在 `main` 上假定区域来自版面或引擎。PR #10 没有定义整页多模态响应的字段，也没有定义没有框时 `page-placeholder` 的「该区域」是整页还是空。

v1 的教训是整页多模态替换进了同一个大文件（`ARCHITECTURE.md` §14）。这里缺的是契约，不是再加一条产品路线。

改法：见 D-1。在 Wisdom 选定之前，不要实现 `multimodal-only` 的切块推断。规格应明确写出选定的那一种，并给一条契约测试。

#### P0-3 与 P1-1 在本对照里的位置

`LayoutEngine` 只出现在 §7.12 的表，没有 Protocol、没有作业种类。这是漏写，详述在 P0-3。

`RouteConfig` 类型、`ing_route.schemaVersion`、`ParseRun` 路线快照没有写。`AC-91` 只说了「配置」两个字。详述在 P1-1。

### 6.4 看起来像漏写、实际是开关收窄，不在本报告里改

23:32 有一句：「引擎 A、引擎 B、百度 OCR、智谱 OCR 的结果都经过它评分。」

PR #10 的写法是：评分开着时这些来源的候选经过 Jev（`AC-18`、`AC-88` ⑤、`§7.1`「全路径评估记录」）。评分关着时记 `not-run/disabled`，不调用 Jev（`AC-85` ③）。这是 22:15 的收窄，和「可关、关闭显示未评分、重开不自动补评」一致。

若 23:32 那一句是要求「无论开关都调用 Jev」，就与开关决定冲突。本报告不改规格。见 D-7。

手动「重新识别」、切换路线后是否重跑、能否按篇切换、全局默认与来源优先级，PR #10 已经标成待 Wisdom 确认，并先按保守行为写进规格。本报告不把它们算作漏写，集中放在第 8 节。

---

## 7. 给外部 coding agent 的项目文档

问题：一个没有参加过这些讨论的 coding agent，只靠仓库里的文档，能不能按已定决定实现功能，而不做成矢量重绘、固定双引擎或手机同步。

结论：不能。`RULES.md` 的禁止事项、分支、PR 字段和交接模板是够用的；默认入口和若干「看起来像需求」的文档会把 agent 带偏。当前 CI 全绿也不能代替规格门禁。

### 7.1 仓库里有什么、没有什么

| 文档 | 现状 |
| --- | --- |
| `README.md` | 有。第 2 行产品描述是错的。规格链接是对的，但没有「开工前必读」的顺序 |
| `AGENTS.md` | 无 |
| `.cursor/rules` 或等价规则 | 无。`.cursor/environment.json` 只描述安装，N-11 禁止 Agent 擅自改它 |
| `CONTRIBUTING` | 无 |
| `RULES.md` §6 N-01–N-19 | 有，适用于人类与 Agent。N-20 只在 PR #10 |
| `RULES.md` §8.4 交接模板 | 有，字段完整 |
| `RULES.md` §2 分支与 PR | 有：`feature/`、`fix/`、`chore/`；PR 先 Draft；描述必填五项；不自行合入 |
| Issue 模板 | 无（`.github/` 下只有 `workflows/ci.yml`） |
| PR 模板 | 无。必填项在 `RULES.md` §2，不在 GitHub 模板里 |
| CI 说明 | `docs/ci-and-environment.md` 对当前工具链是准确的，没有声明它不等于 `ARCHITECTURE.md` §13 |

### 7.2 问题

#### P0-5 README 把产品写成「公式提取与矢量重绘」

证据：`README.md` 第 2 行：`Open Immerse v2 - PDF formula extraction and vector redraw project`。

`PRD.md` 开篇是英文学术 PDF 的中文对照阅读。`docs/v1-review.md` 写明矢量重绘不立项。`RULES.md` N-06 禁止扩大到 PRD §3.2 之外。

这是 agent 打开仓库后的第一句。它会去找矢量重绘的实现，或把公式识别理解成「抽出路径再重画」，与「未核验则裁图、不把 LaTeX 冒充已核验」相反。

改法：第 2 行改成 `PRD.md` §1 的一句话（中文即可）。紧接着写阅读顺序，例如：

1. `PRD.md`（做什么、不做什么、验收编号）
2. `ARCHITECTURE.md`（切片、端口、协议）
3. `RULES.md` §6 与 §8（禁止事项与交接）
4. 涉及界面时再读 `DESIGN.md` 与 `docs/design-principles.md`；「待审批」的视觉数值不是定稿
5. `docs/architecture/` 是历史草案，不授权实现

并写一句：与根目录三份规格冲突时，以规格为准；不要实现矢量重绘、浏览器扩展、手机客户端、订阅计费。

#### P1-11 没有一份给无上下文 agent 的开工说明

证据：第 7.1 节的缺文件。`RULES.md` 第 4 行写「适用对象：所有人类开发者与 AI Agent」，但 agent 的默认入口通常是 README 或 `AGENTS.md`，不会先翻到第 4 行。

含糊之处：

- 规格冲突时的优先级在 `RULES.md` 第 7 行，README 没有复述。
- 「一个 PR 一个切片」在 `RULES.md` §2，Issue 模板不存在，任务卡不会强制填写切片名与任务类型（`RULES.md` §8.3 要求任务说明里有那一行约束，但没有模板把这句话放进去）。
- N-20（禁止在 core 写死另一块积木）在 PR #10 合入前，从 `main` 开工的 agent 读不到。
- `DESIGN.md` 面向「Cursor Cloud Agents」（第 18 行），同时又有 P1-14 的过时句。

互相矛盾之处：

- README 第 22 行要求「按方案逐项验收」，方案指向含手机能力的历史草案（P1-15）。
- README 第 2 行的矢量重绘与 `docs/v1-review.md`、PRD §3.2 矛盾（P0-5）。
- `docs/architecture/README.md` 第 19 行「多模态仅补充低分区域，不能替代主流程」与 PR #10「多模态可以是识别来源」矛盾。草案有横幅，根 README 仍把它当成完整方案。

改法（仍不扩大产品，只加导航）：

- 增加根目录 `AGENTS.md`，短，只做指针：产品一句话、五步阅读顺序、N-01–N-20 的位置、交接模板位置、当前 CI 不等于 G1–G18、M1 前不建业务切片（与 P1-10 同一句）、冲突时以 RULES > ARCHITECTURE > PRD > 草案。
- 不要把规格正文复制进 `AGENTS.md`，避免再出现一份会漂移的副本。
- `.cursor/rules` 若要加，只放同一指针，不另写产品规则。N-11 不因本条而授权修改 `environment.json`。
- Issue 模板最少三栏：关联的 US/AC、切片名、任务类型（UI 改动 / seam 变更 / core 改动）。正文附上 `RULES.md` §8.3 规定的那一句约束。
- PR 模板把 `RULES.md` §2 的五项和 §8.4 模板抄成空栏。这是 P2-10，可以跟 `AGENTS.md` 同一个 PR，也可以等第一个实现 PR 之前再加。

#### P2-10 没有 PR 模板

证据：`.github/` 无 `PULL_REQUEST_TEMPLATE.md`。必填项已在 `RULES.md` 第 66–71 行。agent 仍经常漏「UI–core 交接说明」。

改法：见 P1-11。严重度放在 P2，因为规则正文已经存在，缺的是 GitHub 会自动展开的空表格。

### 7.3 哪些文档已经能约束 agent

下列内容本身清楚，问题是 agent 可能读不到，而不是内容错：

- `RULES.md` §2：分支前缀、Conventional Commits、Draft PR、不自行合入、解析规则集必须同 PR。
- `RULES.md` §6：N-01 至 N-19（force push、直推 main、合入、发版、密钥、扩大范围、旧仓库、绕过 CI、手改生成物、改 DESIGN、改 environment、付费 CI、AGPL、填待定标数字、把模型输出当已核验、UI 任务改 core、绕过 Jev 进入已核验、笔记库写入、复制 BabelDOC）。
- `RULES.md` §8.4：交接说明的字段。
- `docs/ci-and-environment.md`：Node 20.19.2、pnpm 10.34.9、uv 与 pytest 退出码 5 的说明，与工作流一致。
- `ARCHITECTURE.md` §14：v1 单文件 16,641 行的教训，用来拒绝上帝文件。

---

## 8. 需要 Wisdom 决定

本报告不选答案。PR #10 已经列过的五项保持原样，审查新发现的附在后面。

### PR #10 已标待定（规格先按保守行为写了）

| id | 事项 | 规格现在的临时写法 |
| --- | --- | --- |
| W-1 | 手动「重新识别」（`AC-90`）是否保留 | 保留为评分关闭时的手动动作，不自动、不批量 |
| W-2 | 切换路线后，已处理论文是否自动重跑 | 不改写已有采用版本与译文 |
| W-3 | 能否按篇选择路线 | 先只做全局一条 `ing_route` |
| W-4 | 全局默认预设，以及来源优先级的默认顺序 | 预设暂定 `ocr-layout-jev`；优先级提议为引擎 A → 引擎 B → 云 OCR → 多模态。M0 同一批论文对比后再定 |
| W-5 | 「源码核对」是否改算已核验 | 不算。唯一决定点 `source-check-standing.ts`。若改，同一 PR 修改 N-17、AC-04、AC-87 |

### 本轮审查新提出

| id | 事项 | 为什么现在定不了 |
| --- | --- | --- |
| D-1 | 版面关闭、仅多模态时，块坐标从哪来 | `AC-93` ⑤ 要求每块有坐标，`AC-88` ③ 又允许发整页。可选：没有版面就不提供该预设；或整页只产生一个页级块，占位与点击以整页计；或允许模型返回框，框不合法则整页裁图。选定前 `multimodal-only` 没有可实现的 `PageCandidate` |
| D-2 | 版面与引擎 A 的识别阶段是否必须分成两次作业 | P0-3。独立 `layout` 作业，或同一次 `parse` 内两个可关阶段。选一种之后才能写 §10.2 |
| D-3 | 评分开关与路线判定列表不一致时以谁为准 | P1-2。可选：以 `scoring-switch` 为准并立刻改写路线为自定义；或读的时候路线列表覆盖开关。需要一条不变量 |
| D-4 | 自动补救开关的默认值，以及设置行放在 §3.3 的哪一行 | P1-9。US-07 与 §7.1 都假设这个开关存在。默认开或关会改变付费请求，本报告不代填 |
| D-6 | M6a / M6b 复核之后，能否更换 `1269e4f` | P1-4。建议：复核只记差异，换提交另一次决定。若你希望复核本身就可以换锁，需要写明谁批准 |
| D-7 | 「引擎 A、引擎 B、百度 OCR、智谱 OCR 都经过 Jev」是否包含评分关闭的时候 | 第 6.4 节。现规格：关闭时不调用。若要关闭时也调用，则与「可关、请求数为 0、显示未评分」冲突，需要你明确改哪一边 |

D-5 空号不用，避免和 W-5 混淆。

程序核对的重合比例阈值仍按规格：M4 用基准集定标，不在这里填数字（N-14）。「明确不确定证据」PR #10 已写成 v2 不作为补救入口，本报告不把它重新打开成产品范围。

---

## 9. 规格没有写、实现时会踩到的风险

这些不扩大 v2 范围。它们是按现有句子做下去会遇到的后果。

1. **按区块计费在数字批准前没有硬顶。** `§7.12` 已承认一页可能有十几次外部调用。`default-caps` 的占位单位若仍按「每篇」或「每页一次」设计，多模态加版面会在用户看到预算数字之前打出大量请求。见 P1-8。不要在实现 PR 里自填 N。
2. **程序核对会放过「能渲染但错」的公式。** PR #10 已经把这写成已知代价，并用 QM-03 单独报告。agent 若为了「看起来更聪明」加一条模型自检，就违反 N-17 与 N-15。保持夹具 `AC-89` ⑤ 即可。
3. **面壁开通与充值入口未核实。** 差异清单 §7 与 `PRD §3.4` 已标未核实。规格没有写价格，这是对的。不要在设置文案里写具体价格或「免费」。
4. **版面预设写「部署暂定本地」，和 API 优先、8 GB 无 GPU 目标叠在一起。** `§7.12` 已把 8 GB CPU 的峰值内存与单页耗时标成未核实，并放进 M0。M0 出数之前，不要在 README 或设置推荐里写「目标机器可以本地跑版面」。API 优先表里，版面的托管 API 仍是未核实（百度 AI Studio），核实前注册表户数为 0（`AC-93` ③）。这条保持。
5. **空的 `AccountSession` 会被提前做成账号系统。** `AC-94` ③ 写了返回 `not_in_v2`、相关代码与表为 0。agent 看到「自有托管」四个字，仍可能加登录页。开工说明里应指向这一条验收（P1-11）。
6. **密钥路径被「方便调试」绕开。** N-05 与 §15.4 已禁止仓库内 `.env` 与命令行参数里的 Key。实现 PR 若加 `.env.example` 且示例里有看起来像真 Key 的字符串，gitleaks 在 M1 之前还不存在（P1-10）。在那之前靠评审，不靠 CI。
7. **并行 agent 会按历史草案做手机同步，或按 README 做矢量重绘。** 见 P0-5 与 P1-15。这是文档问题，不是需要新功能。

---

## 10. 建议的规格修改顺序

不在本 PR 里改规格。下一份规格 PR（可以是 PR #10 上的增补，也可以是 #10 合入后的新 PR）建议按这个顺序，避免 agent 在矛盾句子上开工：

1. 改 P0-1、P0-2、P0-6：流程图、S2、§7.5 第 2 步与 `AC-88` / `AC-92` 使用同一套「识别看列表、评分看开关」。
2. 等 D-1、D-2 有答复后，补 P0-3、P0-4 的 Protocol 与整页契约。没有答复就在规格里写「`multimodal-only` 与独立版面作业在决定前不实现」。
3. 补 P1-1 的 `RouteConfig` 与 `ParseRun` 快照，并处理 D-3。
4. 改 README（P0-5）并加 `AGENTS.md` 指针（P1-11）。这一步不依赖路线决定，可以单独的文档 PR。
5. P1-5、P1-9、P1-12、P1-14 是小的规格对齐，可跟 1 放在同一个 PR，前提是 D-4 已有默认值；没有默认值就先改 AC-20 的措辞（P1-12），补救开关继续标待定。

M1 的门禁落地（P1-10）按现有里程碑走，不提前把 G1–G18 的脚本塞进本审查。
