# open-immerse v2 合入后复审（2026-10-30）

状态：审查报告。只记录问题与改法，不改 PRD、ARCHITECTURE、RULES、DESIGN、CI 或代码。
基线：`main` `23bd0f3`（`docs(review): v2 全面审查报告 (#11)`）。其父提交 `467a1ed` 是 PR #10。
对照：`docs/reviews/v2-full-review.md`、`docs/reviews/v2-engineering-maturity.md`。两份报告写于 #10 仍为 Draft 时；本报告只核合入后的正文还在不在。
行号：本文件写的是 `23bd0f3` 上的行。

严重度沿用前两份报告：

- **P0**：按字面实现会让验收互相失败，或让没有上下文的 agent 做成另一个产品行为。
- **P1**：规格能读，但缺单一决定点或两处说法不一致，实现时会各写一套。
- **P2**：不挡当前里程碑。

未核实的上游事实保持「未核实」。需要拍板的事项只列在文末。已修的旧条目不在问题列表里重复展开，只出现在第 5 节对照表。

---

## 1. 结论摘要

规格主骨架可以留着继续用。合入后的路线是四类积木的一份配置（`RouteConfig`），评分开关优先于路线且不改写路线，版面与引擎 A 的识别分成两次作业，兜底链的 id 只有 `crop-then-placeholder`。服务商格式表已经覆盖 OpenAI 兼容、Anthropic、Gemini、百度、智谱和面壁。界面到接口到 core 的方向写进了 `ARCHITECTURE.md` §2.1、`RULES.md` N-21 和 PRD AC-100。给外部 agent 的入口（README、`AGENTS.md`、贡献说明、Issue / PR 模板、ADR 索引、事故模板、三种版本号、CI 空跑说明）已经在仓库里。

还不能按验收字面开工的，是评分记录和公式显示这一段。`AC-88` / `AC-97` / `ARCHITECTURE.md` §7.4 把「开关开着、路线不含 Jev」记成 `not-run/disabled`；`AC-18`、`AC-84`、`AC-60` ⑤ 仍把 `not-run` 限定为「用户关掉了评分」，并仍把多模态识别写成评分关闭时才发生。三个不含 Jev 的预设在开关默认开着时，§7.5 第 4、5 步写明不出现，程序核对的 LaTeX 走不到；`AC-88` ⑤ 又要求这些候选走 `AC-89`。仅多模态没有版面区域，程序核对的「位置」仍要求「版面公式区域」。M3 若同时实现 `AC-84` 和 `AC-88`，测试不能一起通过。

CI 仍是空跑，而且文档已经承认这一点（`docs/ci-and-environment.md`「当前是空跑」）。`ARCHITECTURE.md` §13 的 G1–G18 里，没有一条按该节的工具和规则在工作流里执行。dependency-cruiser、Vitest、gitleaks、license-checker、import-linter 都不在仓库里。解耦的依赖方向有句子，没有机器检查。分支保护接口本次仍返回 403，必需检查是否打开保持未核实。

前两份报告的 P0 六条加工程两条：四条已修，两条部分（P0-1、P0-4），零条原样未修。P1 里完全未修、且 #10 明确留给别人的，是全面审查 P1-14（`DESIGN.md` 文首，Loom）和工程成熟度里留给管理员或后续里程碑的 E-P1-3 至 E-P1-10（E-P1-1、E-P1-2、E-P1-11、E-P1-12 已修）。本报告新开 3 条 P0、8 条 P1、4 条 P2，都是合入后正文里还在的句子。

---

## 2. 架构核对

这一节回答本次复审要看的产品结构。结论先写在这里，具体矛盾在第 3 节。

### 2.1 路线是可声明组合的积木

`ARCHITECTURE.md` §7.12 与 PRD §3.5、AC-91 把一条路线写成版面、识别来源列表、结果判定列表、兜底。`RouteConfig`（`ARCHITECTURE.md:1560`）带 `schemaVersion`。`ParseRun` 记 `routePresetId` 与 `routeConfigDigest`。`ing_route` 一行，换预设不迁移文档模型。四个预设在 `route-presets.ts` 一处。`open-document.ts` 的职责改成取路线、循环 `ingest-policy`、调切片 `index.ts`（`ARCHITECTURE.md:380`）。N-20 禁止在 core 里点名另一块积木。

还没收口的是：判定列表把 `program-check` 写成可配置成员，§7.5 又把第 4、5 步绑在「用户关掉开关」。见 P0-B。版面部署和引擎 A 的「本地 / API」是两套旋钮。见 P1-C。

### 2.2 本地与远程

Jev、引擎 B、翻译、问答、多模态补救在 `ARCHITECTURE.md` §7.0 表里都有「本地 / API」，走同一个端口或同一种 worker 作业。对话类格式在 §7.9.6：`openai-chat`（OpenAI、智谱 GLM、百度千帆 v2、Gemini 兼容端点、本机 Ollama / llama.cpp）、`anthropic-messages`、`gemini-generate-content`。OCR 格式是 `baidu-ocr`、`zhipu-layout-parsing`。面壁 Jev 与文档解析在 worker 侧。§7.9.4 写明：格式已有时新增服务商只加注册表记录，不改 `contracts` 和切片。

例外已经写明，保持：版面托管 API 未核实，核实前只有本地与自建远程 worker（AC-93 ③）。云 OCR 没有同一 `OcrProvider` 的本地实现，表里把本地对应到引擎 A 的 OCR 兜底。TTS / ASR 留到 M7。`account-token` 的空实现写在 §7.9.5 正文，目录树仍没有 `auth/account-token.ts`（旧 P2-4，未修，见第 5 节）。

### 2.3 评分开关优先于路线

`ARCHITECTURE.md:1136` 与 AC-97：读的时候开关优先，两处都不自动改写。开关关着时所有路线跳过 Jev，路线含 Jev 才提示「当前路线包含评分，但评分已关闭」。开关开着但路线不含 Jev 时不送评，同样记 `not-run/disabled`，不提示那句。这条不变量本身是清楚的。

和它对着干的是显示路径和另外几条验收。见 P0-A、P0-B。

### 2.4 兜底

`RouteConfig.fallback` 只有 `'crop-then-placeholder'`。AC-89 ③ 要求行内公式、行间公式、图、表都走裁图再到占位框。图和表从裁图这一级开始。裁图拿不到才是占位框。这条链没有第二套。

页级占位和区块级占位共用一句文案，点击行为不同，记录上没有字段区分。见 P1-B。

### 2.5 界面与核心

依赖方向写在 `ARCHITECTURE.md:101`、`RULES.md:122`、PRD `AC-100`（`PRD.md:386`）。G13–G16 规定了 dependency-cruiser 的 from / to。eslint 的 import 边界被写成编辑器里的同一套规则，CI 以 dependency-cruiser 为准。

仓库里没有 dependency-cruiser 配置，`package.json` 没有对应 script，`eslint.config.js` 只用 `recommended`。N-22 禁止在 M1 门禁合入前新建 `packages/features/**`，所以今天没有可以违反的业务边。方向有规格，机器检查没有落地。哪些门控没跑，见第 6 节。

---

## 3. 问题列表

### P0-A 评估记录的产生条件有两套

`ARCHITECTURE.md:1139` 与 PRD `AC-88` ⑤（`PRD.md:374`）、`AC-92` ①、`AC-97` ④：开关开着但判定列表不含 Jev 时，不提交 `evaluate`，新候选记 `not-run/disabled`。多模态只要在识别列表里就运行，不看开关（`ARCHITECTURE.md:888`、`ARCHITECTURE.md:933`）。

同一仓库里还有这些句子：

- `PRD.md:220` AC-18：多模态写成「补救，以及评分关闭时的识别与手动重新识别」。`not-run` 的原因写成「只有 `disabled`：用户关闭了质量评分」。
- `PRD.md:363` AC-84 ③：「`not-run` 只在质量评分关闭时产生」。
- `PRD.md:283` AC-60 ⑤：「每个候选在进入采用版本前都有 Jev 评估记录」。
- `PRD.md:468` M6c：「评分关闭时多模态作为识别来源」。

M3 的退出条件同时要求 AC-18、AC-84 和 AC-91–AC-100。按 AC-84 实现，三个不含 Jev 的预设在开关默认开着时不能记 `not-run`（AC-84 不允许），也不能送评（AC-92 要求 Jev 请求为 0）。按 AC-18 的括号实现，评分开着时多模态识别请求为 0，AC-92 ⑤ 失败。

建议修法：AC-18、AC-84、AC-60 ⑤、M6c 改成与 `ARCHITECTURE.md:1139` 同一句。`not-run/disabled` 有两个来源：用户关掉开关，或开关开着但判定列表不含 Jev。识别是否运行只看识别列表。AC-60 ⑤ 改成「有评估记录」，Jev 的 `scored` 只在开关开着且路线含 Jev 时出现。

代价：只改验收和里程碑句子，不改已定的开关优先。不改的话 M3 的 core 测试没有唯一期望。

### P0-B 不含 Jev 的预设在默认开关下走不到程序核对 LaTeX

开关默认开（AC-85 ①）。三个预设的判定列不含 Jev（`ARCHITECTURE.md:1550`–`1552`）。`AC-88` ⑤ 要求这些候选走 AC-89。

`ARCHITECTURE.md:1148` 写在「关闭期间」下面：「源码核对与程序核对通过的 `checked-latex` 只在这时出现。」`ARCHITECTURE.md:1180`：「评分开着时只是第 4、5 步不出现。」`ARCHITECTURE.md:1182` 把第 4、5 步限定为「评分被用户关闭」。

于是「多模态+版面」「仅多模态」「OCR+版面」在用户不另外关掉开关时，公式不进入 `checked-latex` 和 `source-checked-latex`，直接落到裁图。预设表把它们的判定写成「程序核对」。两句不能同时当测试期望。

建议修法：先由 Wisdom 选定（第 8 节 D-A）。选定后只保留一种。若预设本身就代表「用程序核对、不送 Jev」，则开关开着且路线不含 Jev 时也走第 4、5 步，并改 `ARCHITECTURE.md:1148`、`:1180`、`:1182` 和 AC-89 ① 的「质量评分关闭时」。若程序核对 LaTeX 必须先关掉总开关，则改预设表和 AC-88 ⑤，写明这三个预设在开关仍开着时公式只显示裁图或占位框。

代价：这是产品行为，不是措辞。选定前不要实现 `formula-policy` 的第 4、5 步分支。

### P0-C 仅多模态的程序核对位置条件无法成立

`ARCHITECTURE.md:1174` 与 AC-89 ①（`PRD.md:375`）：位置核对要求「候选所属区域是版面公式区域，行内 / 行间与版面一致」。`ARCHITECTURE.md:1213` 的 arXiv 对齐同样要求落在版面公式区域内。

预设 `multimodal-only` 的版面作业是 0 次（AC-92 ②，`ARCHITECTURE.md:1551`）。没有版面作业就没有版面公式区域。按字面做位置核对，这一预设的公式永远过不了程序核对，`checked-latex` 个数为 0。AC-92 ② 只断言请求数，测试可以全绿，预设名称里的「程序核对」仍然达不到。

对得上文字层之后的区块（AC-95 ②）是文字层外接框，不是 `LayoutEngine` 的区域。规格没有写这个框能不能充当第 5 步的「位置」。

建议修法：见第 8 节 D-B。在选定前，位置核对不要写成只认版面模型的区域。可选的写法留在决定里，本报告不代选。

代价：要改 `formula-policy` 的输入从哪来。不先定，仅多模态的公式显示没有可实现的通过条件。

### P1-A 整页块的类型表达不了「没有框」

`ARCHITECTURE.md:1584` 的 `WholePageBlock.bbox` 是必填字段。AC-95 ①（`PRD.md:381`）要求缺 `bbox` 的区块进入精确区域的次数为 0，并在对不上时做页级显示。必填类型里没有「缺框」这一种值。适配器要么编一个框，要么丢掉文字。页级显示需要这块文字还在，只是没有精确区域。

建议修法：规范化结果分成两类，一类带框，一类无框只挂在页上。无框的不进入 `bbox-align` 的精确区域。AC-95 ① 的计数对着这个类型写。

代价：改拟议类型和一条契约测试。不改产品范围。P0-4 的主契约已经有了，缺的是这一个分支。

### P1-B 同一种占位文案有两种点击

区块级：`ARCHITECTURE.md:1178` 与 AC-89 ③，「跳到第 N 页并定位该区域」。
页级：`ARCHITECTURE.md:1588` 与 AC-95 ⑤，跳到第 N 页，带区域定位的次数为 0。
PRD §3.4（`PRD.md:115`）只写「跳到该页」，没有定位。

`FormulaCropRef`（`ARCHITECTURE.md:1640`）的 `kind` 只有 `crop` 与 `page_link`。`page_link` 只有页码，没有「这一下点击是否带区域」。界面看到的句子都是「图见原文第 N 页（点击查看）」。

建议修法：见第 8 节 D-C。在 `FormulaCropRef` 上加一个已有信息能决定的标志（有精确区域 / 只有页），点击只读这个标志。三处正文改成引用它。

代价：一个字段加三条句子。不先定，阅读器会做成一种点击。

### P1-C 版面部署和引擎 A 的来源是两套开关

`RouteConfig.layout.deployment` 是 `'local' | 'remote' | 'api'`（`ARCHITECTURE.md:1563`）。§7.0 表把「版面、公式识别、OCR 兜底、表格」放在引擎 A 的同一行「本地 / API / 远程 worker」里（`ARCHITECTURE.md:768`）。AC-96 又要求版面作业和 `parse` 各走一次，`parse` 内部不再调用版面。

用户把路线里的版面设为本地、把引擎 A 设为 API 时，版面作业发到哪里，规格没有唯一答案。`api` 这个取值在托管版面 API 核实前也没有对应实现（AC-93 ③ 要求注册表户数为 0）。

建议修法：见第 8 节 D-D。在决定前，实现不要从 `deployment: 'api'` 发出请求。

代价：设置页少一个或合并一个控件。不决定就会做出两个都会被用户碰到的开关。

### P1-D 云 OCR 的输入仍假设版面属于引擎 A

`ARCHITECTURE.md:1223`：云 OCR 的输入是版面区域裁片，「版面来自引擎 A 或文字层基础档」。`ARCHITECTURE.md:1232`：不发整页图，不参与块的顺序。AC-96 已经把版面从引擎 A 的 `parse` 里拆出去。自定义路线可以「版面关 + 识别列表含云 OCR」。这时没有区域裁片，也没有写请求数应为 0 还是改发整页。

`ARCHITECTURE.md:1146` 在「关闭期间」里把多模态识别写成「只发区域裁片」。AC-88 ③ 在版面关掉时发整页。仅多模态关着评分时，两句冲突。

建议修法：云 OCR 的裁片来自版面作业的 `LayoutResult`，没有版面作业时该来源请求为 0，不改发整页（与 AC-71「云 OCR 不决定阅读顺序」一致）。多模态整页只走 `WholePageRecognition`，从 `ARCHITECTURE.md:1146` 的「只发区域裁片」里把版面关掉的情况指到 §7.12。见第 8 节 D-E，若要允许云 OCR 发整页，需要另定，本报告的建议是不允许。

代价：一条输入契约。允许整页会和 AC-71 对着干，所以默认建议是请求为 0。

### P1-E 已核验路径上的「程序核对」没有清单

第 2 步（`ARCHITECTURE.md:1167`）写「程序核对通过」才标已核验，没有列出检查项。第 1 步是四项（位置、字符集、编号、可渲染）。第 5 步是五项，多了与文字层或邻近内容一致，而且只在 `not-run/disabled` 时做（`ARCHITECTURE.md:1170`）。N-17 要求 Jev 开启时「程序核对通过」才可能已核验。

五项里的重合比例阈值按 N-14 留到 M4，这是对的，本条不要求现在填数字。缺的是：已核验用的是四项还是五项。agent 会把第 5 步的五项拷到第 2 步，或只做可渲染。

建议修法：在 §7.5 第 2 步写明与第 1 步相同的四项，或写明与第 5 步相同的五项但阈值未定标时该项不参与已核验（只记录，不因此拒绝）。两种都测得了。不要两处都用「程序核对」四个字。

代价：一段话加一条夹具。不扩大核对范围，除非选定五项。

### P1-F 翻译预算用了一个不存在的块状态

`ARCHITECTURE.md:1248`：预算被拒时「块进入 `waiting-budget`」，seam 返回 `budget_exhausted`。`StoredTranslationBlock.status` 只有 `success`、`failed`、`retranslating`（`ARCHITECTURE.md:1628`）。`TranslationBlockView.display` 有 `pending`，没有 `waiting-budget`（`ARCHITECTURE.md:201`）。§8.1.1 的 `failureKind` 表没有预算这一行。

`budget_exhausted` 作为 `translatePage` 的错误已经存在（`ARCHITECTURE.md:187`）。块级状态没有对应值。界面会做成失败块、骨架，或一个规格里没有的第四种 `failureKind`。

建议修法：删掉 `waiting-budget` 这个状态名。页级拒绝继续用 seam 的 `budget_exhausted`，块保持没有新记录，`getBlocks` 用已有的 `pending`。不要给 `failureKind` 加第四类。若块上必须能看出「在等预算」，用 `display` 的一个新枚举值，并在 AC-56 的文案表加一行，交 Loom 写句子。

代价：删一个没有类型的词，或加一个枚举。加枚举要动 AC-56，范围更大。建议先删词。

### P1-G 手动重新识别在「开关开、路线无 Jev」时被关掉

AC-90 ①（`PRD.md:376`）与 `ARCHITECTURE.md:1151`：评分开着时 `ingest.rerecognizeRegion` 返回 `scoring_enabled`，请求为 0。三个不含 Jev 的预设在默认开关下也算「评分开着」，用户不能换来源。AC-90 自己标了待确认（旧 W-1）。这里多出来的是：即使保留这个入口，它是否只在总开关关闭时可用，还是在「这条路线实际上不送评」时也可用。

建议修法：跟 W-1 一起定，见第 8 节 D-F。未定之前保持 AC-90 的字面（开着就拒绝），并在预设说明里写一句，避免把入口做成这三个预设的默认能力。

代价：一个返回码的条件。不先写明，阅读器会给这三个预设做按钮，core 再拒绝。

### P1-H 多模态端口有两个名字，识别范围没覆盖整页

§7.12 识别来源写 `MultimodalProvider`（`ARCHITECTURE.md:1540`）。§7.3 的端口是 `MultimodalRepairProvider`（`ARCHITECTURE.md:1020`），识别走 `repair` 的 `recognizeRegions`（`ARCHITECTURE.md:157`、`:1146`）。N-20 要求一类积木一个端口。两个名字会让人再做一个端口，或在补救适配器里分叉整页逻辑。

`recognition-scope.ts` 的范围是公式区域、表格区域、非 trusted 页的正文，图区域不发，只发裁片（`ARCHITECTURE.md:1146`）。整页多模态没有落在这个文件的职责句里。

建议修法：对外只留一个名字，写在 §7.3 和 §7.12 同一行。`recognizeRegions` 增加整页输入，输出 `WholePageRecognition`；补救仍只收区域裁片。core 不按「是不是整页」去 import 两套实现。

代价：一个端口上的第二种输入。不新做产品能力，整页已经在 AC-95 里。

### P1-I 开工说明把「决定」收成 Q1–Q12，路线不在索引里

`AGENTS.md:21`：「决定只从 `docs/adr/README.md` 指到 Q1–Q12。」索引正文（`docs/adr/README.md:36`）写明 Q1–Q12 之后的决定不抄进索引，只留在 ARCHITECTURE §16 和差异清单 §6.1–§6.11。

阅读顺序的第 1、2 步仍会读到 PRD 和 ARCHITECTURE，所以这不是唯一入口。风险是 agent 把索引当「当前有效决定的名单」。路线、评分开关优先、独立版面作业、AC-100 都不在那张表上。差异清单 §6.9 还有被 §6.11 取代的句子，见 P2-A。

建议修法：索引加行，只指向 §16 和差异清单 §6.9–§6.11 的标题，不重写决定。`AGENTS.md` 那句改成「索引不复制决定；Q1–Q12 之后看 ARCHITECTURE §16」。独立 ADR 文件仍留到 M1。

代价：一张表加几行。避免第二份规格。

### P2-A 差异清单 §6.9 留着已被取代的补救句和 N-17

`docs/v2-gap-and-changes.md:513`：「没有自动补救，AC-05 的自动补救仍为 0。」同日 23:55 已改为自动补救默认开，评分关闭时因为没有有效分数所以请求为 0，设置行本身不改写（PRD `AC-98`，`PRD.md:89`）。`docs/v2-gap-and-changes.md:510` 写「RULES N-17 不改」，N-17 已在 23:55 写成「评分并且程序核对通过」（`RULES.md:146`）。

RULES 的写法是删掉被取代的句子，不在后面追加「后来改为」。§6.11 是后写的，但 §6.9 的表还在。

建议修法：§6.9 那两格改成指向 §6.11 的一句，或直接改成现在的决定。不要两套都留着。

代价：两格表格。不改行为。

### P2-B `LayoutDetector` 仍是另一个 Protocol

`ARCHITECTURE.md:968` 的 `LayoutEngine.detect` 带 `CancelToken`。`ARCHITECTURE.md:977` 的 `LayoutDetector.detect` 不带，注释说它只是 worker 侧的名字。AC-96 要求 `parse` 内部不再调用版面。两个 Protocol 会让人在 `parse_page` 里再接一个检测器。

建议修法：删掉 `LayoutDetector`，或把它写成 `LayoutEngine` 的类型别名，签名与 `LayoutEngine` 相同。

代价：删一个拟议类型。P0-3 的作业边界已经写了，这是残留名字。

### P2-C 给 agent 的旁路句子还在引用已删的门或另一套点击

- `RULES.md:122` 用现在时写「CI 用 dependency-cruiser 挡住反向依赖」。N-22 和 CI 文档写明 M1 之前这条没跑。agent 会以为 G13 已经红灯。
- `docs/design/md-reader.md:359` MD-16 仍写 G13–G17。文首说明（同文件第 23 行）要求按 G13–G16 读。G17 已删除。
- `docs/v1-review.md:377`：占位卡点击跳回原页位置。AC-95 ⑤ 的页级点击不带区域定位。v1 审查不是执行授权，README 仍把它列在规格导航里。

建议修法：N-21 加半句「脚本在 M1 落地，在那之前以 N-22 为准」。MD-16 的编号由 Loom 改（N-10），在此之前 AGENTS 不必再提 G17。v1 审查 §4.8 加一句「页级点击以 AC-95 为准」，或在 README 的 v1 审查链接旁写「占位点击以 PRD 为准」。

代价：三处半句。不改 CI。

### P2-D 流程图和注释仍有「一律送评」

- `ARCHITECTURE.md:1202`：arXiv 对齐通过后的箭头是「→ Jev」，没有开关和路线条件。
- `ARCHITECTURE.md:1018`：`OcrProvider.recognize` 注释「必须送评（Q1）」。开关关掉或路线不含 Jev 时记的是 `not-run`，不是送评。

正文别处已经写了条件。图和注释会被单独抄进实现。

建议修法：箭头改成「有评估记录；送评仅当开关开着且路线含 Jev」。注释改成「必须有评估记录」。

代价：一处图、一处注释。

---

## 4. 验收 AC-01–AC-100

AC-01 到 AC-100 编号连续，没有缺号。多数条款写成了次数、0 次或逐字节相等，核心路径可以做成 core 测试或契约测试。下面只列现在还不能当唯一期望、或对不上用户故事的条目。

### 4.1 两套期望，测试不能同时通过

| 条款 | 原因 |
| --- | --- |
| AC-18、AC-84、AC-60 ⑤ | 与 AC-88、AC-92、AC-97 的 `not-run` 条件不一致。见 P0-A |
| AC-88 ⑤、AC-89 ① | 前者要求「开关开着但路线不含 Jev」走 AC-89；后者和 §7.5 把程序核对 LaTeX 限定在用户关掉开关。见 P0-B |
| AC-89 ① 的位置、AC-92 ②、AC-95 | 仅多模态没有版面区域。见 P0-C |
| AC-95 ① 与 `WholePageBlock.bbox` | 缺框在类型里不存在。见 P1-A |
| AC-89 ③ 与 AC-95 ⑤ | 同文案两种点击。见 P1-B |

### 4.2 阈值还没写，通过/失败没有数

这些按 N-14 留着是对的，不要在实现里填一个数当成已定标。

- AC-37：笔记库确认阈值「待定标」。只能测「超过阈值时先确认」，不能测具体文件数。
- AC-89 的一致性：没有可比对内容时判不通过，这一支可以测。有文字层时的重合比例没有数，通过那一支不能测。
- AC-56 的颜色 token 标了待审批。结构、`role="status"`、`failureKind` 文案可以测。色值不能当通过条件。
- §6.2 的 QM-01–QM-17 目标栏是「待基准定标」。它们不是 AC，不要放进 PR 红灯。

### 4.3 追溯不到一条用户故事

| 条款 | US 列 | 说明 |
| --- | --- | --- |
| AC-21 | 全部 | 解耦约束，没有单独的 US。AC-100 追溯到 US-33，AC-21 仍写「全部」 |
| AC-45 | 全部 | Markdown 解耦，同样 |
| AC-27 | — | Q5 预留接口。没有 US |
| AC-52 | — | 源码区间与往返。没有 US |
| AC-53 | — | 写入类型预留。没有 US |
| AC-54 | — | `write_disabled`。没有 US |
| AC-55 | — | 编辑槽为空。没有 US |

建议：AC-21、AC-45 改记 US-33 或写「约束，无单独故事」。AC-52–AC-55 若属于 Markdown 只读，记到 US-23 或 US-27。AC-27 记到 Q5 的那条范围外说明，不要留空。空的 US 列不是实现错误，是以后拆任务时对不上卡。

### 4.4 机器检查还不存在，条款先不能红

AC-21、AC-33（`react/no-danger`）、AC-45、AC-54（禁止 `fs` 写入导入）、AC-100 ③ 依赖 G2 / G13 / G15 / G16。这些脚本不在当前工作流里。条款本身写得可以测，要等 M1 门禁 PR。在那之前不要把「CI 全绿」当成它们通过。

AC-90 标了待 Wisdom 确认。在 D-F / W-1 选定前，它的返回码可以写测试，产品是否保留这个入口还没定。

---

## 5. 前两份报告的修复状态

「已修」指 #10 合入后的规格里有了审查要求的那句，并且没有留下会让该条验收失败的旧句。「部分」指主句改了，旧句还在。「未修」指审查点名的文件仍是原样，或 #10 明确留给后续里程碑、这次也没做。

工程项里，审查自己写成「现在只加一句说明、脚本留到 M1」的，说明已经写上就算已修；脚本没落地仍记未修。

### 5.1 全面审查 P0 / P1

| 编号 | 状态 | 合入后落在哪 |
| --- | --- | --- |
| P0-1 | 部分 | 流程图（`ARCHITECTURE.md:888`）和 §7.1「全路径评估记录」已改成识别看列表。AC-18、AC-84、M6c 仍写评分关闭时才识别、`not-run` 只来自关掉开关。见本报告 P0-A |
| P0-2 | 已修 | PRD S2、§3.3 引擎 B 行、§7.1 写明是否调用由识别列表决定。AC-92 ⑥ 写明「对比与兜底」不是全路线不变式 |
| P0-3 | 已修 | `LayoutEngine` 在 §7.2、§7.3；作业种类含 `layout`（§10.2）；AC-96。残留的 `LayoutDetector` 见本报告 P2-B，不把 P0-3 打回未修 |
| P0-4 | 部分 | `WholePageRecognition` 与 AC-95 已写。缺框表达不了，页级与区块级点击没有字段区分。见 P1-A、P1-B |
| P0-5 | 已修 | README 首句是中文对照阅读，并写了阅读顺序和不要做矢量重绘 |
| P0-6 | 已修 | §7.5 第 2 步的识别候选含多模态识别与手动重新识别 |
| P1-1 | 已修 | `RouteConfig`、`ing_route.schemaVersion`、`ParseRun` 路线快照、换预设不迁移文档模型 |
| P1-2 | 已修 | AC-97：开关优先，两处都不自动改写。显示路径的另一套句子是 P0-B，不是这一条的读路径 |
| P1-3 | 已修 | `open-document.ts` 只取路线、循环 policy、调 `index.ts`；步骤在 `ingest-steps.ts` |
| P1-4 | 已修 | §7.4「锁定版本」与 AC-99：锁 `1269e4f`，复核只记差异，更换要对比并单独开 PR |
| P1-5 | 已修 | §8.1.1 有 `ProviderFailure.kind` 到 `failureKind` 的表。`waiting-budget` 是新问题 P1-F |
| P1-6 | 已修 | 提示词目录与 `promptVersion` 写在 §8.1.1。目录本身按 E-P1-9 留到 M4 |
| P1-7 | 已修 | §12.1 的 `EvalRecord` 形状已写。样例文件和 `docs/acceptance/` 按审查改法留到 E-P1-8 |
| P1-8 | 已修 | §7.8 第 4 条要求占位上限按每页区块请求计。具体 N 仍待批准，这是审查自己的完成条件 |
| P1-9 | 已修 | PRD §3.3 有自动补救行，默认开；AC-05、AC-98。差异清单 §6.9 旧句见 P2-A |
| P1-10 | 已修 | N-22；CI 文档与 README 写明空跑不等于 G1–G18。eslint 按审查留到 M1 |
| P1-11 | 已修 | README 阅读顺序、`AGENTS.md`、Issue 模板、PR 模板。索引范围过窄见 P1-I |
| P1-12 | 已修 | AC-20 改为「选了本地」或「外发同意是拒绝」，并写明没有「关掉 API 来源」总开关 |
| P1-13 | 已修 | 与 P1-5 同一张表；解析、OCR、Jev 的用户可见词收成三类 |
| P1-14 | 未修 | `DESIGN.md:16` 仍写「Loom 交付前 UI 只搭结构」。RULES 文首已写以 RULES 为准。正文只由 Loom 改（N-10） |
| P1-15 | 已修 | README「历史草案」写明该目录不授权实现 |

### 5.2 工程成熟度 P0 / P1

| 编号 | 状态 | 合入后落在哪 |
| --- | --- | --- |
| E-P0-1 | 已修 | README 产品句与 `AGENTS.md`。与 P0-5、P1-11 是同一份入口 |
| E-P0-2 | 已修 | `docs/ci-and-environment.md`「当前是空跑」，README 复述。脚本没补上，审查要求的就是这句 |
| E-P1-1 | 已修 | `docs/adr/README.md` 有模板和 Q1–Q12 索引。独立 ADR 文件仍在 M1。索引不覆盖路线，见 P1-I |
| E-P1-2 | 已修 | `.github/ISSUE_TEMPLATE/task.md`、`.github/PULL_REQUEST_TEMPLATE.md`，字段来自 RULES §2 与 §8.4 |
| E-P1-3 | 未修 | 必需检查仍是文档里的「建议」。本次 `GET` 分支保护返回 403，是否已开未核实。Agent 不改（N-02） |
| E-P1-4 | 未修 | 无 CODEOWNERS。等人名 |
| E-P1-5 | 未修 | 无 commitlint。留给 M1 的 `pnpm check` |
| E-P1-6 | 未修 | 无 dependency-cruiser，无 `tsconfig.core.json`。留给 M1 |
| E-P1-7 | 未修 | pytest 退出码 5 仍被工作流改成 0（`.github/workflows/ci.yml:85`）。无会失败的 Vitest 样例。留给 M1 |
| E-P1-8 | 未修 | 无 `docs/acceptance/`，无 `fixtures/eval/`。留给 M0 |
| E-P1-9 | 未修 | 无提示词目录，无 Jev 模型卡。留给 M4 / M6a。规格位置已由 P1-6 写上 |
| E-P1-10 | 未修 | 无 Dependabot，无 gitleaks。本次按原决定不加 |
| E-P1-11 | 已修 | `docs/incidents/TEMPLATE.md` |
| E-P1-12 | 已修 | README「三种版本号」：规格 v0.6、应用 semver 尚未存在、worker `0.0.0` |

全面审查 P2-1 至 P2-9 在 `docs/backlog.md` 仍为未处理。P2-10（PR 模板）已修。工程 E-P2-1 至 E-P2-10 未修，按原报告的里程碑。`delete_branch_on_merge` 本次读取仍为关。这些不在上面逐条展开。

---

## 6. CI 门控：哪些还没有按 §13 执行

工作流是 `.github/workflows/ci.yml`。它会真的失败的只有：锁文件安装、ESLint `recommended`（`--max-warnings 0`）、`tools/typecheck.mjs` 在出现 `.ts` 之后调用的 `tsc`、`node --test` 里真正失败的测试、ruff check、ruff format、uv 版本针、`uv.lock` 里出现 `pymupdf` / `fitz` 包名或缺少 `pypdfium2`。

今天没有 `.ts` 源文件，`tools/typecheck.mjs:27` 打印跳过并以退出码 0 结束。pytest 没有测试时退出码 5，工作流第 85–88 行把它改成 0。`package.json` 的 script 只有 `lint`、`typecheck`、`test`。没有 `pnpm check`、`pnpm test:core`、Prettier、Vitest、dependency-cruiser、gitleaks、license-checker、import-linter。

G17 已从规格删除，不算未执行的门。

| 门控 | §13 要求 | 当前工作流 | 判定 |
| --- | --- | --- | --- |
| G1 格式 | Prettier 与 ruff format | 只有 ruff format。没有 Prettier | 未按规格执行 |
| G2 Lint | `strict-type-checked`、`max-lines-per-function`、复杂度、`no-restricted-imports`、Markdown 与服务商主机名规则；ruff | ESLint `recommended` 加 ruff 的 E/F/I/UP/B。没有那些规则 | 未按规格执行 |
| G3 类型 | `tsc -b` strict，mypy 或 pyright strict | 无 `.ts` 时跳过；无 Python 类型检查 | 空跑 |
| G4 行数 | `tools/check-file-size` | 无此脚本 | 未执行 |
| G5 依赖方向 | dependency-cruiser 矩阵 | 无此工具 | 未执行 |
| G6 Python 分层 | import-linter | 无 | 未执行 |
| G7 生成物 | `pnpm codegen` 后 `git diff --exit-code` | 无 | 未执行 |
| G8 测试 | Vitest 与 pytest，空套件不得当通过 | `node --test` 零文件仍成功；pytest 退出码 5 被改成 0 | 空跑 |
| G9 密钥 | gitleaks | 无 | 未执行 |
| G10 许可证 | license-checker、pip-licenses、模型清单 | 只 grep 包名 `pypdfium2` / `pymupdf` / `fitz` | 未按规格执行 |
| G11 热点 | `tools/check-hotspots` | 无 | 未执行 |
| G12 PR 体量 | 600 行 / 契约 200 行 | 无 | 未执行 |
| G13 core 不依赖 UI | dependency-cruiser `core-no-ui` | 无 | 未执行 |
| G14 core 编译环境 | `tsconfig.core.json`，禁用 DOM 全局 | 根 `tsconfig.json` 有 strict，没有 `tsconfig.core.json`，也没有源文件可编 | 未执行 |
| G15 UI 只经 seam | `ui-through-seam` 等 | 无 | 未执行 |
| G16 core 测试 | Vitest 工程 `core` | 无 `test:core` | 未执行 |
| G17 | 已删除 | 不适用 | 不适用 |
| G18 一个 PR 一个切片 | 脚本 | 无 | 未执行 |

另外：没有 Windows 任务；`push` 与 `pull_request` 都会跑；必需检查未核实（API 403）。这些和 E-P1-3、E-P2-1 一致，不另开问题。

解耦要靠 G5、G13、G15、G16。四条都未执行。N-22 挡住了在门禁之前新建业务切片，这是现在唯一生效的限制，它是文档禁令，不是 CI。

---

## 7. 已经对齐、本报告不要求改方向的部分

- 产品是 Windows / macOS 桌面应用：英文学术 PDF 的中文对照阅读。矢量重绘、手机、订阅不在范围内。README 首句与此一致。
- 外发按服务商询问；付费调用先 `BudgetGate.reserve`；远程 worker 不收桌面的服务商 Key。
- PDF 渲染锁定 pypdfium2 5.14.0。禁止 PyMuPDF。项目许可证 Apache-2.0。
- 假评估器永不产生已核验（AC-84 ②）。评分错误不是低分（AC-05）。
- `formulaDigest` 不含「是否已核验」。源码核对翻转不因此重译（AC-57 ⑨）。
- 全局默认预设保持待定，新安装不预选路线（AC-91 ③）。
- BabelDOC 只借思路（N-19）。Unlimited-OCR 不接入（Q12）。
- `AccountSession` 返回 `not_in_v2`（AC-94 ③）。

---

## 8. 需要 Wisdom 拍板

本报告不选答案。已经在规格里标成待定、本轮没有新信息的，原样保留。新的放在后面。

### 8.1 规格里仍然待定（#10 之前就有）

| id | 事项 | 规格现在的临时写法 |
| --- | --- | --- |
| W-1 | 手动「重新识别」是否保留 | 保留为评分关闭时的手动动作。和 D-F 一起看 |
| W-2 | 切换路线后，已处理论文是否自动重跑 | 不改写已有采用版本与译文 |
| W-3 | 能否按篇选择路线 | 全局一条 `ing_route` |
| W-4 | 全局默认预设，以及来源优先级的默认顺序 | `defaultPresetId` 为空，新安装不预选。优先级提议为引擎 A → 引擎 B → 云 OCR → 多模态 |
| W-5 | 「源码核对」是否改算已核验 | 不算。决定点 `source-check-standing.ts`。若改，同一 PR 修改 N-17、AC-04、AC-87 |

### 8.2 本轮新提出

| id | 事项 | 为什么现在定不了 |
| --- | --- | --- |
| D-A | 开关开着、路线不含 Jev 时，公式走不走第 4、5 步 | P0-B。AC-88 ⑤ 说走 AC-89。§7.4 与 §7.5 说 `checked-latex` 只在用户关掉开关时出现。三个预设的默认体验差在这一句 |
| D-B | 没有版面区域时，程序核对的「位置」用什么 | P0-C。仅多模态对得上文字层之后是字形外接框，不是版面公式区域。可选：用校正后的框；或这一预设的公式只走裁图；或没有版面就不提供该预设 |
| D-C | 占位框点击要不要定位区域 | P1-B。区块级要定位，页级不要。需要一个记录字段，不能靠文案区分 |
| D-D | 版面部署和引擎 A 的「本地 / API」是一个开关还是两个 | P1-C。建议：版面只看 `RouteConfig.layout`，引擎 A 的设置只覆盖识别阶段；`api` 在托管版面核实前不可选。若要合成一个开关，需要改 AC-96 |
| D-E | 版面关掉时云 OCR 发不发 | P1-D。建议：不发整页，请求为 0。若要发整页，要改 AC-71 |
| D-F | 开关开着但路线不含 Jev 时，重新识别是否可用 | P1-G。AC-90 现在一律返回 `scoring_enabled`。若 W-1 保留入口，要定这三个预设算不算「评分开着」 |

### 8.3 要人在仓库设置里做、Agent 不做

| id | 事项 | 现状 |
| --- | --- | --- |
| E-P1-3 | 把 `CI / node`、`CI / python-worker` 设为 `main` 的必需检查 | 文档仍是「建议」。保护规则 API 403，未核实 |
| E-P1-4 | CODEOWNERS 的路径归属 | 没有文件。不要在审查里填人名 |
| E-P2-10 | 合入后是否删除分支 | `delete_branch_on_merge` 为关 |

P1-14 不需要新决定：删 `DESIGN.md` 第 16 行的「交付前只搭结构」，改成与 RULES 文首同一句。执行人是 Loom。

---

## 9. 建议的修改顺序

仍不在本报告里改规格。

1. 先定 D-A、D-B。没有这两条，不要实现 `formula-policy` 和第 4、5 步。
2. 按选定结果改 P0-A、P0-B、P0-C，让 AC-18、AC-84、AC-88、AC-89、§7.5 使用同一套条件。
3. 补 P1-A、P1-B 的类型字段（D-C）。这是契约，适合单独的规格 PR。
4. D-D、D-E、D-F 可以跟 2 放在一起，也可以等对应里程碑。未定之前按本报告的建议保守实现：版面不发未核实的托管 API，云 OCR 在没有版面时请求为 0，重新识别保持 AC-90 的字面。
5. P1-I 和 P2-A 是索引和差异清单，不依赖产品决定，可以单独的文档 PR。
6. G1–G18 的脚本仍按 M1。不要为了本报告提前改工作流。
