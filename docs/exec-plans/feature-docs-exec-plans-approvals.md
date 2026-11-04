# 执行计划

超过 300 行，或跨模块，才复制本模板。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。复制为 `docs/exec-plans/<分支名>.md`。第一笔提交只有该文件。Forge 审查通过之前不写实现。小任务不用本模板，在 PR 描述写三行现状理解。

计划必须自包含：只读这一份文件就能接手，不依赖聊天记录。引用规格时写节号并链接到文件。目录用途、命名和何时必写见 [README.md](README.md)。

本文件是分支 `feature/docs-exec-plans-approvals` 的计划。基线 `origin/main@dd0630b`（`dd0630bd19f5aa1e26c068ab846e72f309edb7b2`，PR #125）。任务类型是纯文档 / 规格。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。第一笔提交只有本文件。计划没有留到 Forge 审查后再写实现，这是 Cloud 的流程偏差。PR 保持 Draft，不自行标成 Ready，不合入。

## 现状理解

- 已有行为：`docs/exec-plans/TEMPLATE.md` 有三节，「现状理解」「计划 / 实际」「证据链接」。没有决策记录，文首没有自包含要求，目录没有 README。同目录还有 13 份计划，都不搬动：`feature-m1-check-docs.md`、`feature-m1-contracts-codegen-p2.md`、`feature-m1-contracts-codegen-p3.md`、`feature-m1-deferred-gates.md`、`feature-m1-e2e-split-protocol-inline.md`、`feature-m1-electron-shell.md`、`feature-m1-empty-slices-adr.md`、`feature-m1-jev-client.md`、`feature-m1-log-guard-fixes.md`、`feature-m1-logging-contract.md`、`feature-m1-logging-impl.md`、`feature-m1-split-prd-arch.md`、`feature-m1-worker-server.md`。其中只有 `feature-m1-split-prd-arch.md` 自己写了批准与审查，其余没有决策记录。RULES §2 第 76 行要求超过 300 行或跨模块时，描述里改放执行计划链接；第 78 行要求先复制模板、第一笔提交只有计划。§9「现状理解」行的依据列只链到 TEMPLATE。两处都没有「Cloud 交接附上计划文件」，也没有「计划里的批准必须在 `docs/approvals.md` 有行」。[AGENTS.md](../../AGENTS.md) 没有指向这个目录和 `docs/approvals.md`。[docs/approvals.md](../approvals.md) 记到 2026-11-04 04:22，共 21 条批准 + 1 条反馈，旧行不改。`docs/spec-changelog.md` 最新一行是 #125。PRD 与 ARCHITECTURE 在根目录是索引，正文在 `docs/prd/` 与 `docs/arch/`。
- 相关的节：RULES §2、§6（N-01–N-22）、§7、§9；AGENTS.md「开工前阅读」「按任务类型阅读」；[docs/WORKFLOW.md](../WORKFLOW.md)「执行计划」；`.github/PULL_REQUEST_TEMPLATE.md`；ARCHITECTURE §4.1（`docs/arch/04-01.md` 已写下 05:26 的例外）；DESIGN.md 与 `docs/design-principles.md` 只读（N-10）。
- 还没做的部分：下面步骤 2–8。本改动不跨切片，也不改 TS 与 worker。预计行数不到 300。仍写这份计划，是因为交接与 RULES §2 要求第一笔提交只有计划，并且 10:21 批准的就是把执行计划做成带决策记录的一等产物。这不改 RULES §2 的门槛数字。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔提交只有它。决策记录至少有 10:21 一行。来源核对逐条回应 | `cf83455` 只有本文件。`26bc8a5` 把待写入根目录的示例链接放进代码块，避免 check-docs 报 missing-file | 本文件 |
| 2 | 新增 `docs/exec-plans/README.md`。覆盖用途、门槛（只链 RULES §2）、命名、自包含、Decision Log、批准须在 approvals.md 有行、交接附计划。不建 `active/`、`completed/`，不搬动 13 份计划 | `2c8edf2`。没有 `active/`、`completed/`，13 份计划未改 | [docs/evidence/127/commands.md](../evidence/127/commands.md) |
| 3 | `TEMPLATE.md` 在「计划 / 实际」之后、「证据链接」之前加「决策记录（Decision Log）」。文首加一句自包含要求并指向 README。已有三节文字不改 | `2c8edf2`。三节正文与 `origin/main` 相同 | 同上 |
| 4 | `AGENTS.md` 加一句指针，不复制规则正文 | `2c8edf2`。「按任务类型阅读」那段末尾一句 | 同上 |
| 5 | RULES §2 第 78 行那条后补一句；§9「现状理解」行的依据列加 README 链接。N-01–N-22 条文 diff 为 0 | `2c8edf2`。§6 的 N-01–N-22 与 `origin/main` 逐字相同 | 同上 |
| 6 | `docs/approvals.md` 按时间追加 12 行（交接清单 11 行，加上 10:12）。计数改为 33 条批准 + 1 条反馈。旧 22 行 diff 为 0 | `2c8edf2`。04:22 及以前的行未改。计数是 33 条批准 + 1 条反馈 | 同上 |
| 7 | `docs/spec-changelog.md` 加本 PR 一行，摘要含 Wisdom 2026-11-04 10:21 原文 | 本提交。摘要含 10:21 原文。版本历史标记之内未改 | 同上 |
| 8 | `GATE_BASE=origin/main corepack pnpm run check` 与 `node tools/check-docs/check.mjs` 退出码 0。结果写入 `docs/evidence/<PR号>/commands.md`。开 Draft PR，描述首行 `Refs #27` | `26bc8a5` 上门禁与 check-docs 退出码都是 0。Draft PR [#127](https://github.com/wisdom-km/open-immerse-v2/pull/127)，描述首行 `Refs #27` | 同上 |

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 本 PR 加入 `docs/exec-plans/`（自包含计划，带 Decision Log）以及把 `docs/approvals.md` 补到当天已核对的批准。原话：「对，我批准了，你就按照你的建议把它放进下一个文档PR里吧。就这个文档PR结束了，你就把它放进去。」对应 [docs/approvals.md](../approvals.md) 2026-11-04 10:21 行，来源 [issuecomment-6620794911](https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6620794911) | #125 合入之后的下一个文档 PR 做这件事。2026-10-31 第 3 项已批的 ExecPlan 做法，缺的是决策记录入库 | 2026-11-04 10:21 | Wisdom |
| 计划没有留到 Forge 审查后再写后面的提交。这是流程偏差 | RULES §2 要求 Forge 审查通过之前不写实现。`docs/approvals.md` 没有对应行，不记成 Wisdom 的批准 | 2026-11-04 | Cloud |
| 不建 `active/` 与 `completed/`，不搬动现有 13 份计划 | 交接范围写明不建这两个子目录，已有 13 份计划留在原地。`docs/approvals.md` 没有对应行 | 2026-11-04 | Forge（交接范围） |
| `docs/approvals.md` 增加 10:12 一行。原话：「同意，你把第二条写成你的固定规则吧，然后第一条通知所有bot执行。」对应同文件 2026-11-04 10:12 行，来源 [issuecomment-6622138729](https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6622138729) | 补记评论给出了原话，并已写入 approvals.md | 2026-11-04 10:12 | Wisdom |
| 不收录「03:35 规则」，也不收录 04:02、05:15、05:17 | 交接写明没有原话的批准不写。这四个时间没有 approvals.md 行，也没有标成批准记录的评论 | 2026-11-04 | Forge（交接范围） |
| 本计划按「来源核对」逐条回应。Cloud 交接之后也要附上计划路径，计划里引用的批准要能在 approvals.md 对上时间 | 10:12 批准的第 2 条：交接含「来源核对」，Cloud 计划逐条回应。10:21 把这件事放进本 PR 的规范，不另写一套门槛 | 2026-11-04 10:12、10:21 | Wisdom |

没有标成「Forge 排序，非业主决定」的行。不等 Forge 审计划就写实现的那一行，作者是 Cloud。不建子目录、不搬已有计划、不收录没有来源的时间，作者是 Forge（交接范围）。其余文件取舍沿用交接列出的清单。

## 来源核对

每一行是交接「来源核对」表里的一条，加上评论 6622138729 里的 10:12。回应写本计划因此怎么做。GitHub 评论于 2026-11-04 用 API 读过正文，「」内文字与下表原话一致。`/workspace/oi-v2/openai-review/REPORT.md` 与 `openai-review2/REPORT.md` 不在本仓库，本机也没有这两份文件。对这两条的回应依据是交接对条目的转述，以及仓库里已经落地的 TEMPLATE。

| 来源 | 交接里的项 | 本计划怎么回应 |
| --- | --- | --- |
| [issues/27#issuecomment-6620794911](https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6620794911) | 10:21 批准原话与范围：批准依据、补行 10:21、全部「要做的事」 | 决策记录第一行照抄原话。步骤 2–7 只做交接列出的 README、TEMPLATE、AGENTS、RULES 两处指针、approvals 补行、changelog。不改 PRD、ARCHITECTURE 正文 |
| `openai-review/REPORT.md` 第 8 项、A2 | exec-plan 一等产物、决策日志入库、首提交只交计划；计划/实际分栏；决策日志只记影响后续的决定 | 报告文件不在仓库。交接转述的这些点里，计划/实际分栏已经在 TEMPLATE，本 PR 不改那一节的文字。步骤 1 保证第一笔提交只有本文件。步骤 3 补上决策记录，并且只记影响后续的决定。README 写明该目录是一等产物 |
| `openai-review2/REPORT.md` 第 7、11 项，N5 | 模板、超过 300 行的门槛、「现状理解」为首节 | 报告文件不在仓库。TEMPLATE 已有这三节，「现状理解」仍是第一节。步骤 3 不改这三节的文字，只在文首加自包含一句，并在「计划 / 实际」与「证据链接」之间插入决策记录。门槛只引用 RULES §2，不改 300 行，不改跨模块的定义 |
| `docs/exec-plans/TEMPLATE.md` 与 13 份计划 | 没有 Decision Log，没有 README | 步骤 2、3 补这两样。13 份计划的正文不改，不移动 |
| RULES.md 第 76、78、238 行 | 已有计划门槛与第一笔提交只有计划 | 第 76 行不改。第 78 行那条末尾补交接指定的一句。第 238 行依据列加 README 链接。不改门槛，不加新的禁止条文，不改 N 编号 |
| AGENTS.md | 没有 exec-plans / approvals 指针 | 步骤 4 在「按任务类型阅读」那段末尾加一句指针 |
| PR #116、`docs/approvals.md` | 中心记录已建，止于 04:22 | 步骤 6 只在表末追加。04:22 及以前的 22 行一个字不改。新行的「来源」列写评论链接 |
| [issues/61#issuecomment-6615827081](https://github.com/wisdom-km/open-immerse-v2/issues/61#issuecomment-6615827081)；PR #122 正文 | 05:26「A」。ARCHITECTURE §4.1 的例外 | 补行 05:26。原话「A」。`docs/arch/04-01.md` 已写 `readHealthResponse`、`readProtocolHeader`、`readUnsupportedProtocol` 是 oi-parse/1 的运行时校验，留在 contracts，是接受的例外。本 PR 不改该节 |
| pull/120、118、121、122 的批准评论 | 05:50–10:04 的合入批准 | 补行 05:50、05:51、05:52、10:04。原话分别是「批准 #120，macOS 绿了就合入」「批准 #118，macOS 绿了就合入」「批准 #121，CI 绿了就合入」「批准合入 #122」。SHA 以评论为准：ee05407、22caf3f、08a1357、204eff7 |
| [issues/123#issuecomment-6620885462](https://github.com/wisdom-km/open-immerse-v2/issues/123#issuecomment-6620885462) | 10:27 colorama / Windows CI | 补行 10:27。两条原话都抄：「colorama 按包名放行为 BSD-3-Clause」「Windows CI 暂不改」。不改 `package-aliases.json`，不改工作流 |
| [issues/27#issuecomment-6621420997](https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6621420997)；[pull/125#issuecomment-6621435772](https://github.com/wisdom-km/open-immerse-v2/pull/125#issuecomment-6621435772) | 11:05「按推荐就行」 | 补行 11:05。#125 已经合入。本 PR 不重做 catalog、占位页或 `docs/arch/` |
| [pull/124#issuecomment-6621603309](https://github.com/wisdom-km/open-immerse-v2/pull/124#issuecomment-6621603309)；[issues/123#issuecomment-6621603953](https://github.com/wisdom-km/open-immerse-v2/issues/123#issuecomment-6621603953) | 11:18「批准合入」 | 补行 11:18。合入 #124 @ 9facc97。本 PR 不改 #124 的代码 |
| [pull/125#issuecomment-6621922357](https://github.com/wisdom-km/open-immerse-v2/pull/125#issuecomment-6621922357)、[6622059835](https://github.com/wisdom-km/open-immerse-v2/pull/125#issuecomment-6622059835) | 11:40 有条件合入，以及 slug 遗留 | 补行 11:40，原话保留「影影响」。6622059835 是 Forge 的条件核对，不是另一条 Wisdom 原话，写在同一行的来源里。check-docs 的 slug 修复不在本 PR |
| [issues/61#issuecomment-6621927948](https://github.com/wisdom-km/open-immerse-v2/issues/61#issuecomment-6621927948)；[issues/35#issuecomment-6621928509](https://github.com/wisdom-km/open-immerse-v2/issues/35#issuecomment-6621928509) | 11:41 并行开工；文件冲突禁区 | 补行 11:41。两条评论原话相同。范围写上评论里的条件：与当前活跃 PR #125 无文件重叠。禁碰清单照交接执行，因为 #35 的分支正在改那些文件 |
| PR #125 正文、`docs/spec-changelog.md` | 拆分后的索引；changelog 的行格式 | 必读时核对过：根目录 PRD、ARCHITECTURE 是索引。changelog 新行用现有四列：日期、PR、文件、摘要。规格版本仍写 v0.6 |
| [issues/27#issuecomment-6622138729](https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6622138729) | 交接写「10:12 先不加」。评论补上之后按原话写入 | 评论正文是补记，原话在「」内。补行 10:12，插在 10:04 与 10:21 之间。表内时间用评论里的 10:12。来源列注明这是补记，评论发表于 11:57 |

## 要写入的文本

实现照下面写。已有三节、N-01–N-22、approvals 旧行、13 份计划，都不改措辞。

### README

新文件 `docs/exec-plans/README.md`：

```markdown
# 执行计划

本目录放执行计划。超过 300 行，或跨模块，先复制 [TEMPLATE.md](TEMPLATE.md)，再写实现。门槛在 [RULES.md](../../RULES.md) §2（[2. 分支、提交与 PR](../../RULES.md#2-分支提交与-pr)），这里不另立标准。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。

文件名是 `<分支名>.md`，与分支同名，放在本目录。不设 `active/` 与 `completed/`。已有计划留在原地。

计划必须自包含。接手的人只读这一份文件就能继续，不依赖聊天记录。引用规格时写节号，并链接到那一节。

决策记录（Decision Log）只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 里对应的行。Forge 的排序标「Forge 排序，非业主决定」。

计划里引用的 Wisdom 批准，必须在 [docs/approvals.md](../approvals.md) 有对应的行。没有记在那里的，不算已批准。

Cloud 交接附上该计划文件的路径。

小任务不用本目录。在 PR 描述写三行现状理解（RULES §2）。
```

### TEMPLATE

在现有第一段之后、`## 现状理解` 之前加一段：

```markdown
计划必须自包含：只读这一份文件就能接手，不依赖聊天记录。引用规格时写节号并链接到文件。目录用途、命名和何时必写见 [README.md](README.md)。
```

在 `## 证据链接` 之前加：

```markdown
## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
|  |  |  |  |
```

`## 现状理解`、`## 计划 / 实际`、`## 证据链接` 三节里现有的句子不改。

### AGENTS.md

「按任务类型阅读」下、表格之前的那段末尾加一句：

```text
超过 300 行或跨模块的任务，先按 [docs/exec-plans/README.md](docs/exec-plans/README.md) 写计划；交接附上该计划文件；批准以 [docs/approvals.md](docs/approvals.md) 为准。
```

### RULES.md

§2 这一条的末尾补一句，前面的句子不动：

```text
Cloud 交接附上该计划文件；计划引用的批准须在 [docs/approvals.md](./docs/approvals.md) 有行。
```

§9 表「现状理解」行的「已有条文」列，在 TEMPLATE 链接之后加上：

```text
[docs/exec-plans/README.md](./docs/exec-plans/README.md)
```

### approvals.md 追加的 12 行

插在 04:22 那一行之后。时间用评论正文里的 Asia/Shanghai 时间。11:40 的错字「影影响」保留。10:12 的「所有bot」保留。

| 时间 | Wisdom 原话 | 批了什么 | 对应位置 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-11-04 05:26 | 「A」 | #61 第 4 条方案 A：oi-parse/1 运行时校验留在 contracts，作为接受的例外 | ARCHITECTURE §4.1（PR #122） | https://github.com/wisdom-km/open-immerse-v2/issues/61#issuecomment-6615827081 |
| 2026-11-04 05:50 | 「批准 #120，macOS 绿了就合入」 | 合入 #120 @ ee05407（必需检查绿后） | PR #120 | https://github.com/wisdom-km/open-immerse-v2/pull/120#issuecomment-6616303827 |
| 2026-11-04 05:51 | 「批准 #118，macOS 绿了就合入」 | 合入 #118 @ 22caf3f | PR #118 | https://github.com/wisdom-km/open-immerse-v2/pull/118#issuecomment-6616304679 |
| 2026-11-04 05:52 | 「批准 #121，CI 绿了就合入」 | 合入 #121 @ 08a1357 | PR #121 | https://github.com/wisdom-km/open-immerse-v2/pull/121#issuecomment-6616326125 |
| 2026-11-04 10:04 | 「批准合入 #122」 | 合入 #122 @ 204eff7 | PR #122 | https://github.com/wisdom-km/open-immerse-v2/pull/122#issuecomment-6620565051 |
| 2026-11-04 10:12 | 「同意，你把第二条写成你的固定规则吧，然后第一条通知所有bot执行。」 | (1) 所有 bot：Wisdom 批与 issue 相关的范围时，立即在该 issue 评论记录时间、原话、范围和来源；(2) Forge 固定规则：写 Cloud 交接前按 issue 号和关键词检索 issue 评论、审查报告和 docs/approvals.md，交接必须含「来源核对」，Cloud 计划逐条回应，Forge 审 PR 时逐条勾对 | Issue #27 | https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6622138729 （补记，评论发表于 2026-11-04 11:57） |
| 2026-11-04 10:21 | 「对，我批准了，你就按照你的建议把它放进下一个文档PR里吧。就这个文档PR结束了，你就把它放进去。」 | 本 PR：exec-plans 规范 + approvals 中心记录 | 本 PR | https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6620794911 |
| 2026-11-04 10:27 | 「colorama 按包名放行为 BSD-3-Clause」「Windows CI 暂不改」 | colorama 包名别名 → BSD-3-Clause；worker-health-windows 不改 | PR #124 `package-aliases.json` | https://github.com/wisdom-km/open-immerse-v2/issues/123#issuecomment-6620885462 |
| 2026-11-04 11:05 | 「按推荐就行」 | #125 三项：catalog 指向章节文件；删 27 个占位页、只改相对路径前缀；正文放 `docs/arch/` 并回退 RULES 第 7/169 行 | PR #125 | https://github.com/wisdom-km/open-immerse-v2/issues/27#issuecomment-6621420997 ；https://github.com/wisdom-km/open-immerse-v2/pull/125#issuecomment-6621435772 |
| 2026-11-04 11:18 | 「批准合入」 | 合入 #124 @ 9facc97（Fixes #123） | PR #124 | https://github.com/wisdom-km/open-immerse-v2/pull/124#issuecomment-6621603309 ；https://github.com/wisdom-km/open-immerse-v2/issues/123#issuecomment-6621603953 |
| 2026-11-04 11:40 | 「风险这个先测试下有没有影响吧，要没有影响咱就批准合入，要有影影响的话，咱们就先修锚点再合。」 | #125 @ 3c2f159 有条件合入：5 个特殊字符锚点在 GitHub 渲染页实测能跳转（Forge 在 bad72bf 核对满足） | PR #125 | https://github.com/wisdom-km/open-immerse-v2/pull/125#issuecomment-6621922357 ；https://github.com/wisdom-km/open-immerse-v2/pull/125#issuecomment-6622059835 |
| 2026-11-04 11:41 | 「我看并行的名额还剩两个，它俩是不影响的是吧？就是不影响当前任务的。如果不影响的话，那就都批准。」 | 并行开工 #61 剩余项（1/4/6）与 #35 剩余项（2/3），条件是与当前活跃 PR #125 无文件重叠 | Issue #61、#35 | https://github.com/wisdom-km/open-immerse-v2/issues/61#issuecomment-6621927948 ；https://github.com/wisdom-km/open-immerse-v2/issues/35#issuecomment-6621928509 |

表下计数改为：共 33 条批准 + 1 条反馈记录。

### 不收录

- 「03:35 规则」。#122 的 10:04 评论只提到这个名字，没有原话。不另开一行。
- 04:02、05:15、05:17。没有标成批准记录的评论，approvals.md 也没有行。按交接「找不到来源的批准不写」，不收录。

### changelog

`docs/spec-changelog.md` 的表头下加一行。PR 列在 Draft 开出之后写成 `[#编号](链接)`。摘要含 Wisdom 2026-11-04 10:21 原文：「对，我批准了，你就按照你的建议把它放进下一个文档PR里吧。就这个文档PR结束了，你就把它放进去。」文件清单用最终 diff。规格版本仍是 v0.6。不改 `<!-- oi-split-body -->` 之前的版本历史。

## 不改的文件

验收要求 `git diff --name-only origin/main` 最终只含：

- `docs/exec-plans/README.md`
- `docs/exec-plans/TEMPLATE.md`
- `docs/exec-plans/feature-docs-exec-plans-approvals.md`
- `AGENTS.md`
- `RULES.md`
- `docs/approvals.md`
- `docs/spec-changelog.md`
- `docs/evidence/<PR号>/**`

因此不改 `docs/WORKFLOW.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、PRD、ARCHITECTURE、`docs/prd/`、`docs/arch/`、`docs/architecture/`。WORKFLOW「执行计划」一节和 PR 模板仍没有「交接附上计划文件」这句。那是本任务范围外的残留，写在 PR 风险里，不在这里改。

禁碰（`feature/m1-issue35-real-tree` 正在改）：`tools/check-deps/real-tree*`、`packages/features/jobs/**`、`tools/codegen/manifest.json`、`tools/check-file-size/allowlist.json`、`docs/ci-and-environment.md`、`docs/backlog.md`、`docs/exec-plans/feature-m1-issue35-real-tree.md`。本计划不需要改这些文件。

不改 `.github/workflows/**`、`tools/**`、`package.json`、lockfile、`.cursor/environment.json`、`.cursor/install.sh`。不 force push，不合入，不改分支保护。不做 check-docs 的 slug 修复。

## 证据链接

- [docs/evidence/127/commands.md](../evidence/127/commands.md)：`26bc8a5` 上 `GATE_BASE=origin/main corepack pnpm run check` 与 `node tools/check-docs/check.mjs` 的退出码。Draft PR [#127](https://github.com/wisdom-km/open-immerse-v2/pull/127)。
