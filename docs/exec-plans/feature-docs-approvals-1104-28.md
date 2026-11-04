# 执行计划

超过 300 行，或跨模块，才复制本模板。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。复制为 `docs/exec-plans/<分支名>.md`。第一笔提交只有该文件。Forge 审查通过之前不写实现。小任务不用本模板，在 PR 描述写三行现状理解。

计划必须自包含：只读这一份文件就能接手，不依赖聊天记录。引用规格时写节号并链接到文件。目录用途、命名和何时必写见 [README.md](README.md)。

本文件是分支 `feature/docs-approvals-1104-28` 的计划。基线 `origin/main@9949f5c`（`9949f5c8e90ed47d6ab517a44c8174aa85613297`，PR #148）。任务类型是纯文档。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。第一笔提交只有本文件。

计划没有留到 Forge 审查后再写后面的提交。交接写明先提交本文件，再改正文。这是 Cloud 的流程偏差（[RULES.md](../../RULES.md) §2）。PR 保持 Draft。描述第一行是 `Refs #28`。不自行标成 Ready，不合入，不 force push，不 rebase。

## 现状理解

- 已有行为：[docs/approvals.md](../approvals.md) 末行是 2026-11-04 18:50，文末「共 64 条批准 + 1 条反馈记录 + 1 条决定」。日期行 66：02:06 含「【反馈，不计入批准】」，13:28 含「【决定，不计入批准】」，其余 64 行计批准。第 69 行 17:28 原话「按推荐」，来源 `pull/146#issuecomment-6627414506`。第 73 行 18:33 原话「按推荐吧」，来源 `issues/28#issuecomment-6628516445`。开工时用 API 对过这两条评论，原话一致，本 PR 不改这两行。[docs/backlog.md](../backlog.md) 第 89 行 #67 仍是「另立 PR」；第 91 行 #73 仍是「M3（与 supervisor 一起）」；第 109 行 #28 已写 #146 与只报告的依赖图，没有合入 SHA，也没有 19:06 的 unmapped=0。文首状态行停在 17:28 的 fixtures 句。[.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) 第 79 行是相对链接 `[RULES.md](../RULES.md)`。[docs/arch/03.md](../arch/03.md) 第 35 行已是「计划中。ADR 0003 删的是 repair → quality，不是这两个切片（§4.2）」。
- 相关的节：[RULES.md](../../RULES.md) §2、§7、§9；[docs/WORKFLOW.md](../WORKFLOW.md)；[docs/exec-plans/README.md](README.md) 与 [TEMPLATE.md](TEMPLATE.md)；[docs/exec-plans/feature-preload-codegen-67.md](feature-preload-codegen-67.md)（#67 只读，措辞：方案之后是契约 PR，再是生成器与 `ipc-router` 同一个 PR）；[docs/arch/05-01.md](../arch/05-01.md) §5.1 与 [docs/exec-plans/feature-ci-depgraph-28.md](feature-ci-depgraph-28.md)（无标签实线 23、带标签实线 2、虚线 2）；[docs/arch/11.md](../arch/11.md) 已有 worker stderr 行格式；[docs/design-principles.md](../design-principles.md) §1 与 [DESIGN.md](../../DESIGN.md) 只读（N-10）。[PRD.md](../../PRD.md) 与 `docs/prd/`、`docs/arch/` 的状态仍是 v0.6，本 PR 不改那些正文。
- 还没做的部分：下面步骤 2–5。不改 `docs/arch/**`、`docs/prd/**`、`RULES.md`、`PRD.md`、`DESIGN.md`、`docs/design/**`、`.github/workflows/**`、`tools/**`、`packages/contracts/**`、`docs/exec-plans/feature-preload-contract-67.md`。不加 `docs/spec-changelog.md` 一行：交接文件清单没有它，本 PR 不改规格正文。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔提交只有它。来源核对逐条回应。§2.4 写明仓库不改 | `75d82cc` 只有本文件 | 本文件 |
| 2 | [docs/approvals.md](../approvals.md) 按时间加 15 行。13 行来自交接表（其中 2 行标【决定，不计入批准】），再加 16:46「批准合入」与 16:48「1」。17:28、18:33 不重复。文末改为「共 77 条批准 + 1 条反馈记录 + 3 条决定」 | `41ffc57`。日期行 81 = 77 批准 + 1 反馈 + 3 决定 | 本文件「要写入的文本」 |
| 3 | [docs/backlog.md](../backlog.md) 第 89、91、109 行与文首状态句 | `67c45f0`。#67 进行中，#73 已处理，#28 补上合入 SHA 与 unmapped=0 | 本文件 |
| 4 | PR 模板第 79 行改为纯文本 | `9abeb5d`。第 79 行无相对链接 | 本文件 |
| 5 | `node tools/check-docs/check.mjs` 与 `node tools/compare-spec-bytes/compare.mjs`。退出码写入 `docs/evidence/<PR号>/commands.md`。Draft PR，正文第一行 `Refs #28` | 两条退出码都是 0。check-docs `findings: 0`。Draft PR #150，正文第一行 `Refs #28` | [commands.md](../evidence/150/commands.md) |

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 契约 `source` 拆两步，不随实现 PR 一起改。原话：「1」 | 将写入的 16:46 决定行。取代同分钟更早的「按推荐」行第 4 项 | 2026-11-04 16:46 | Wisdom |
| diag 事件的可选 `source` 只允许 `"worker"`。原话：「OK，那就按照你的建议去执行吧。」 | 将写入的 16:50 行 | 2026-11-04 16:50 | Wisdom |
| 转必过之前 unmapped=0，`--strict` 在 unmapped>0 时失败。原话：「按推荐，然后149，你的建议是合不合？」 | 将写入的 19:06 行。不含 #149 合入 | 2026-11-04 19:06 | Wisdom |
| 以后 PR 统一 squash；不做 MVP 收缩。原话：「第一个就按照你的建议，然后第二个不用收缩范围。」 | 将写入的 19:24 行，标【决定，不计入批准】 | 2026-11-04 19:24 | Wisdom |
| 16:46 的三条按评论创建时间排：先「按推荐」，再 #143「批准合入」，再「1」 | 评论 6626601417、6626611938、6626612874 的 `created_at` 依次是 08:46:11Z、08:46:47Z、08:46:50Z。决定行不写「上一行」，改指 6626601417，避免插进 #143 之后指错 | 2026-11-04 | 本计划按时间顺序；不是新的业主决定 |
| 决定行沿用「【决定，不计入批准】」，与 13:28 行同一标记 | 交接写「标【决定】」。现有唯一的决定行用更长的这一标记。计数按这个标记排除，才能得到交接的 77 / 3 | 2026-11-04 | 本计划沿用现有记法 |
| 19:29「都按照你的建议开。」不另记一行 | 评论 6629444698 的范围就是写入交接的 13 行、漏记的 2 行、backlog 与模板。评论 6629443868 是同一句，范围是另开 #67 契约 PR。交接写明本 PR 不碰那支的文件，也没有把 19:29 自身列入要写入的行。计数保持 77 | 2026-11-04 | 本计划按交接范围；不是新的业主决定 |
| `docs/arch/03.md` 不改 | 第 35 行已经是「ADR 0003 删的是 repair → quality，不是这两个切片」。上一版交接的错误措辞不在本仓库 | 2026-11-04 | 交接 §2.4 |
| 不加 spec-changelog 行 | 交接允许改的文件没有它。本 PR 不改 PRD、ARCHITECTURE、RULES、DESIGN、`docs/arch/**`、`docs/prd/**` | 2026-11-04 | 交接 §3 |
| 计划没有留到 Forge 审查后再写后面的提交。这是流程偏差 | [RULES.md](../../RULES.md) §2 要求 Forge 审查通过之前不写实现。交接要求提交计划后改正文 | 2026-11-04 | Cloud |

## 来源核对

每一行是交接「来源核对」里的一条，加上开工时 API 搜到的补漏。GitHub 正文于 2026-11-04 用 `gh api` 读过。「」内文字与评论里的原话一致。

| 来源 | 交接里的项 | 本计划怎么回应 |
| --- | --- | --- |
| [issues/73#issuecomment-6626601417](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626601417) | S1，16:46「按推荐」 | 原话一致。步骤 2 写入四项范围，并写明第 4 项已被同分钟的决定取代 |
| [issues/73#issuecomment-6626612874](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626612874) | S2，16:46「1」 | 原话一致。评论标题是「Wisdom 决定」。步骤 2 标【决定，不计入批准】，并点名被取代的是 6626601417 第 4 条 |
| [issues/73#issuecomment-6626681427](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626681427) | S3，16:50 | 原话「OK，那就按照你的建议去执行吧。」一致 |
| [pull/144#issuecomment-6626890898](https://github.com/wisdom-km/open-immerse-v2/pull/144#issuecomment-6626890898)；[issues/73#issuecomment-6626918379](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626918379) | S4，17:01；backlog #73 | 原话「批准合入」。进度评论写 main@3942b78。步骤 2 记合入 #144 @5b7207c。步骤 3 把第 91 行改为已处理 |
| [pull/145#issuecomment-6627410101](https://github.com/wisdom-km/open-immerse-v2/pull/145#issuecomment-6627410101)、[6627413702](https://github.com/wisdom-km/open-immerse-v2/pull/145#issuecomment-6627413702) | S5，17:27 | 两则原话都是「批准合入145」。只记一行，来源格注明同分钟重复 |
| [pull/146#issuecomment-6627414506](https://github.com/wisdom-km/open-immerse-v2/pull/146#issuecomment-6627414506) | S6，17:28 已在第 69 行 | 原话「按推荐」与现有行一致。不改、不重复 |
| [pull/147#issuecomment-6627836012](https://github.com/wisdom-km/open-immerse-v2/pull/147#issuecomment-6627836012) | S7，17:51 | 原话「批准合入147」。记合入 #147 @8a60a36 |
| [pull/147#issuecomment-6628019650](https://github.com/wisdom-km/open-immerse-v2/pull/147#issuecomment-6628019650)；[issues/73#issuecomment-6628035688](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6628035688) | S8，18:03；backlog #73 | 原话「批准合入147 新tip」。进度评论写 main@c925524，并点名 approvals 16:46/16:50 与 backlog #73 留给本 PR。步骤 2 写明取代 17:51。步骤 3 写上实现 SHA，supervisor 仍随 M3 |
| [issues/28#issuecomment-6628516445](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6628516445) | S9，18:33 已在第 73 行 | 原话「按推荐吧」与现有行一致。不改、不重复 |
| [pull/149#issuecomment-6628872243](https://github.com/wisdom-km/open-immerse-v2/pull/149#issuecomment-6628872243) | S10，18:54 | 原话「按推荐」。批了什么写明不是合入批准 |
| [issues/28#issuecomment-6629072036](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629072036)、[6629044497](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629044497) | S11，19:06；backlog #28 | 原话「按推荐，然后149，你的建议是合不合？」。来源格带上风险登记。步骤 3 在第 109 行补上 unmapped=0 |
| [pull/149#issuecomment-6629079104](https://github.com/wisdom-km/open-immerse-v2/pull/149#issuecomment-6629079104) | S12，19:07 #149 | 原话一致。记合入 #149 @8744be3。创建时间 11:07:30Z，排在 #148 那条之前 |
| [pull/148#issuecomment-6629086133](https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6629086133) | S13，19:07 #148 | 原话「合入，那148也合入。」。记 @1f2e718，并写明已被 19:18 取代 |
| [pull/148#issuecomment-6629248653](https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6629248653) | S14，19:18 | 原话「批准」。记新 tip e6631f5 |
| [issues/28#issuecomment-6629345577](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629345577) | S15，19:24 | 原话一致。评论标题是「决定记录」。标【决定，不计入批准】 |
| [issues/67#issuecomment-6629357419](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6629357419) | S16，backlog #67 | 方案已合入 main@9949f5c。剩余是契约 PR，然后生成器 + ipc-router PR。与 [feature-preload-codegen-67.md](feature-preload-codegen-67.md) 的顺序一致。步骤 3 把第 89 行改为进行中 |
| [issues/28#issuecomment-6628453240](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6628453240)、[6629153643](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629153643) | S17，backlog #28 | #146 已合入 main@6988420。#149 已合入 main@dd5b8e0，检查在 node job 只报告。步骤 3 补这两句。边数若写入，写 23 条普通实线 |
| 交接点名的 `/workspace/oi-v2/pr145-review/REVIEW.md` 第 37 行 | S18，模板第 79 行 | 该审查文件不在本仓库。仓库里第 79 行仍是相对链接。步骤 4 改成纯文本，与模板第 1 行「完成条件见 RULES.md §9」同一写法 |
| 交接点名的 `/workspace/oi-v2/pr143-review/REVIEW.md` 第 26 行与 `REVIEW2.md` 第 30 行 | S19，§2.4 | 两份审查不在本仓库。`grep` 见 [docs/arch/03.md](../arch/03.md) 第 35 行，措辞已经正确。不改仓库文件 |
| 交接点名的 `/workspace/oi-v2/pr149-review/REVIEW.md` 第 45 行 | S20，23 条实线 | 审查不在本仓库。[docs/arch/05-01.md](../arch/05-01.md) 第 24–47 行有 24 个 `-->`，其中 1 个带标签（「只经 src/pure.ts」）。第 50 行是另一条带标签实线（「仅 type-only」）。无标签实线是 23。已合入的 [feature-ci-depgraph-28.md](feature-ci-depgraph-28.md) 写的是同一组数。backlog 若写边数，写 23 条普通实线 |
| [docs/approvals.md](../approvals.md) 第 69、73 行与文末；[docs/backlog.md](../backlog.md) 第 89、91、109 行 | S21，现状行号 | 在 `9949f5c` 上对过，行号与交接一致 |
| [pull/143#issuecomment-6626611938](https://github.com/wisdom-km/open-immerse-v2/pull/143#issuecomment-6626611938) | 追加，16:46「批准合入」 | 原话一致。范围是合入 #143 @2d8ffe9。按创建时间插在两条 16:46 之间。授权是 [issues/28#issuecomment-6629444698](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629444698) |
| [issues/28#issuecomment-6626639131](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6626639131) | 追加，16:48「1」 | 原话一致。范围是每日只读检查。同一条 19:29 评论授权写入 |
| [issues/28#issuecomment-6629444698](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629444698)、[issues/67#issuecomment-6629443868](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6629443868) | 补漏：19:29「都按照你的建议开。」 | 不另记一行。理由见决策记录。#67 上 18:50 的 [issues/67#issuecomment-6628807091](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628807091) 与已有的 18:50 行是同一次批准，不重复。#73 上 15:57 的 6625729128 与已有的 15:57 行相同，不重复。#146 的 18:28「批准合入146」已在表里 |
| 交接写的 `openai-review*/REPORT.md` | 无相关条目 | 那些报告不在本仓库。issue 与 PR 评论已按关键词搜过，上表即补漏结果 |

## 计数

开工时日期行 66 = 64 批准 + 1 反馈 + 1 决定。

新增 15 行：交接表 13 行里，16:46「1」与 19:24 两行标【决定，不计入批准】，其余 11 行计批准；追加的 16:46「批准合入」与 16:48「1」计批准。11 + 2 = 13。64 + 13 = 77。决定 1 + 2 = 3。反馈仍是 1。

新的日期行 66 + 15 = 81。77 + 1 + 3 = 81。文末写成：「共 77 条批准 + 1 条反馈记录 + 3 条决定」。

## 要写入的文本

实现照下面写。不改第 69 行与第 73 行。

### docs/approvals.md

在 16:34「批准合入142。」之后、16:57 之前，按时间插入：

| 时间 | Wisdom 原话 | 批了什么 | 对应位置 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-11-04 16:46 | 「按推荐」 | #73 四项：同 PR 补 ARCH §11 worker stderr JSON 行格式 + manifest amendment；不接 supervisor，只做 `oi_worker/diag_log.py` 与 `platform-node/src/logging/worker-stderr.ts`；单行 8192 字节、超长整行丢弃；第 4 项（contracts `source`）已被同分钟的决定取代。不加依赖、不改 CI | Issue #73 | https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626601417 |
| 2026-11-04 16:46 | 「批准合入」 | 合入 #143 @2d8ffe9（CI 6/6，Forge 复审 PASS 6626549750） | PR #143 | https://github.com/wisdom-km/open-immerse-v2/pull/143#issuecomment-6626611938 |
| 2026-11-04 16:46 | 「1」 | 【决定，不计入批准】取代 16:46「按推荐」行（评论 6626601417）第 4 项：拆两步，① 契约 PR 只给 `packages/contracts/src/diag-events.ts` 加可选 `source: "worker"` 与测试，先合；② 再开 #73 实现 PR | Issue #73、PR #144/#147 | https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626612874 |
| 2026-11-04 16:48 | 「1」 | #28 每日只读检查：Forge 每天约 09:00（UTC+8）比对 `docs/arch`、`docs/prd` 与 main 的路径、切片、工具清单，并检查 AGENTS.md 是否过时；有出入就在 Issue #28 发汇总。只读，不改文件、不开 PR、不占分支 | Issue #28 | https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6626639131 |
| 2026-11-04 16:50 | 「OK，那就按照你的建议去执行吧。」 | 契约 PR 中 diag 事件的可选 `source` 只允许 `"worker"`；其他取值整条拒收（`diag_event_rejected`），不静默丢字段 | Issue #73、PR #144 | https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626681427 |

在 16:57 两行之后、17:28 之前：

| 时间 | Wisdom 原话 | 批了什么 | 对应位置 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-11-04 17:01 | 「批准合入」 | 合入 #144 @5b7207c（CI 6/6，Forge PASS 6626875277） | PR #144 | https://github.com/wisdom-km/open-immerse-v2/pull/144#issuecomment-6626890898 |
| 2026-11-04 17:27 | 「批准合入145」 | 合入 #145 @ee223a7（Fixes #24） | PR #145 | https://github.com/wisdom-km/open-immerse-v2/pull/145#issuecomment-6627410101（同分钟重复记录 6627413702） |

在 17:28 之后、18:28 之前：

| 时间 | Wisdom 原话 | 批了什么 | 对应位置 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-11-04 17:51 | 「批准合入147」 | 合入 #147 @8a60a36（Fixes #73） | PR #147 | https://github.com/wisdom-km/open-immerse-v2/pull/147#issuecomment-6627836012 |
| 2026-11-04 18:03 | 「批准合入147 新tip」 | 合入 #147 新 tip 2c7cc8d，CI 转绿后合入（取代 17:51） | PR #147 | https://github.com/wisdom-km/open-immerse-v2/pull/147#issuecomment-6628019650 |

在 18:50 之后：

| 时间 | Wisdom 原话 | 批了什么 | 对应位置 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-11-04 18:54 | 「按推荐」 | #149 分层映射 Q1–Q5：`src/pure.ts` 归 DOM；`src/index.ts` 单独算 SEAM 只报告；测试/e2e/playwright 不进图；不扫 `tools/`；C→K 用 dependencyTypes 核 type-only。不是合入批准 | PR #149 | https://github.com/wisdom-km/open-immerse-v2/pull/149#issuecomment-6628872243 |
| 2026-11-04 19:06 | 「按推荐，然后149，你的建议是合不合？」 | 分层映射风险不单开分支；#28 转必过之前要求 check-arch-graph unmapped=0，`--strict` 在 unmapped>0 时失败，与转必过同一步。不含 #149 合入 | Issue #28 | https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629072036（风险登记 6629044497） |
| 2026-11-04 19:07 | 「按推荐，然后149也合入了。148你的建议是合不合？」 | 合入 #149 @8744be3 | PR #149 | https://github.com/wisdom-km/open-immerse-v2/pull/149#issuecomment-6629079104 |
| 2026-11-04 19:07 | 「合入，那148也合入。」 | 合入 #148 @1f2e718，排在 #149 之后；tip 变了须重批（已被 19:18 取代） | PR #148 | https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6629086133 |
| 2026-11-04 19:18 | 「批准」 | 合入 #148 新 tip e6631f5（取代 19:07） | PR #148 | https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6629248653 |
| 2026-11-04 19:24 | 「第一个就按照你的建议，然后第二个不用收缩范围。」 | 【决定，不计入批准】1) 以后 PR 统一 squash 合入（#149 普通 merge 是例外，不回滚）；2) 不做 MVP 收缩，按 M2–M8 推进到第一个安装包 | 流程、Issue #28 | https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629345577 |

文末一行改为：共 77 条批准 + 1 条反馈记录 + 3 条决定

### docs/backlog.md

文首状态行（第 3 行）句号之后补：「同日下午：#73 已处理（契约 #144 main@3942b78、实现 #147 main@c925524，supervisor 接线仍随 M3）；#67 进行中（方案 #148 已合入 main@9949f5c，剩契约 PR 与生成器 + ipc-router PR）；#146 已合入 main@6988420，#149 已合入 main@dd5b8e0，转必过前需 unmapped=0。」

第 89 行里程碑改为：「进行中：方案 #148 已合入 main@9949f5c。剩契约 PR，以及生成器 + `ipc-router` PR。现有 codegen 只生成 worker 协议」。出处追加 `https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6629357419`。事项格不改。

第 91 行里程碑改为：「已处理：契约 #144（main@3942b78）、实现 #147（main@c925524）。supervisor 接线仍随 M3 supervisor PR」。出处追加这两条：`https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626918379`、`https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6628035688`。事项格不改。

第 109 行里程碑在现有句子上补：#146 已合入 main@6988420；#149 已合入 main@dd5b8e0，check-arch-graph 在 node job 只报告、`continue-on-error: true`。ARCH §5.1 的普通实线是 23 条。转必过之前要求 unmapped=0，`--strict` 在 unmapped>0 时失败，与转必过同一步（Wisdom 2026-11-04 19:06）。约两周的观察句保留。出处追加 `https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6628453240`、`https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629153643`、`https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629072036`。

### .github/PULL_REQUEST_TEMPLATE.md

只改第 79 行。现文：

`条件在 [RULES.md](../RULES.md) §9「UI 上手验收」。`

改为：

`条件在 RULES.md §9「UI 上手验收」。`

### docs/arch/03.md

不改。第 35 行保持：「计划中。ADR 0003 删的是 repair → quality，不是这两个切片（§4.2）」。

## 证据链接

- `docs/evidence/150/`：[commands.md](../evidence/150/commands.md)

## 自检

- [ ] 影响 arch / prd 吗？不影响。不改 `docs/arch/**`、`docs/prd/**`、PRD、ARCHITECTURE。
