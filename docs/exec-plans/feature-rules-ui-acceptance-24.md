# 执行计划

超过 300 行，或跨模块，才复制本模板。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。复制为 `docs/exec-plans/<分支名>.md`。第一笔提交只有该文件。Forge 审查通过之前不写实现。小任务不用本模板，在 PR 描述写三行现状理解。

计划必须自包含：只读这一份文件就能接手，不依赖聊天记录。引用规格时写节号并链接到文件。目录用途、命名和何时必写见 [README.md](README.md)。

本文件是分支 `feature/rules-ui-acceptance-24` 的计划。基线 `origin/main@f9b34e8`（`f9b34e8f60497a6c6c8bd59e7e9ff17ec01fec8f`，PR #143）。任务类型是纯文档 / 规则。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。第一笔提交只有本文件。

这次改动不到 300 行，也不跨切片。按 [RULES.md](../../RULES.md) §2，小任务本可以不建计划。交接要求第一笔提交只放本文件，并逐条回应来源核对，所以仍写这份计划。

计划没有留到 Forge 审查后再写实现。交接写明提交本文件之后依次改 RULES、PR 模板、规格变更记录和批准记录。这是 Cloud 的流程偏差（[RULES.md](../../RULES.md) §2）。PR 保持 Draft，不自行标成 Ready，不合入（N-03）。

## 现状理解

- 已有行为：[RULES.md](../../RULES.md) 第 224 行是 `## 9. Definition of Done`。第 228–238 行是条件表，列是「条件 | 怎样算达到 | 已有条文」。第 238 行是「现状理解」。第 240 行写「PR 仍先开 Draft……合入由 Wisdom 决定（N-03）」。§9 与 [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) 都没有「上手验收」。模板第 17 行和第 66 行是任务类型「UI 改动 / seam 变更 / core 改动 / 不适用」。第 62 行是「## UI–core 交接说明」。[docs/approvals.md](../approvals.md) 第 65–66 行是 2026-11-04 16:34 的两行，第 68 行是「共 56 条批准 + 1 条反馈记录 + 1 条决定」。表体第 9–66 行共 58 行：第 10 行是反馈，第 44 行是决定，其余 56 行是批准。[docs/spec-changelog.md](../spec-changelog.md) 表首是 #143，规格版本仍是 v0.6。版本历史在第 13 行，到「日期：2026-11-03（Asia/Shanghai）。」为止，后面是 `<!-- /oi-split-body -->`。
- 相关的节：[RULES.md](../../RULES.md) §2、§7、§8、§9、N-03、N-10。[PRD.md](../../PRD.md) 是索引，正文在 `docs/prd/`；一句话在 [docs/prd/01.md](../prd/01.md)；AC-100 在 [docs/prd/06-01-12.md](../prd/06-01-12.md)，管的是依赖方向和 core 测试，不是人手走查。[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1 在 [docs/arch/02-01.md](../arch/02-01.md)，五条执行规则保持原文。[DESIGN.md](../../DESIGN.md) 是草案 v0.3，视觉数值标「待审批」；§5 的 DS、§5.1 的 UIX 是界面验收，不写合入前由谁上手。[docs/design-principles.md](../design-principles.md) 全文读过，P7 是「界面只表达，规则在 core」。这三份设计正文本 PR 不改（N-10）。[docs/WORKFLOW.md](../WORKFLOW.md) 写角色和离开 Draft，不另写产品规则；本 PR 不改它。
- 还没做的部分：下面步骤 2–6。不改 `.github/workflows/**`，不加依赖，不改 `tools/**`（compare 失败时也不在本计划里加 amendment，先停下来报告）。不改 `packages/`、`apps/`、`workers/`，不碰 `packages/contracts/src/diag-events.ts`。不改 [docs/WORKFLOW.md](../WORKFLOW.md)、[docs/backlog.md](../backlog.md)、`tools/check-docs/**`。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)、`docs/design/**`。不改 N-01–N-22。不升规格版本号。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔提交只有它。来源核对逐条回应 | 提交 `3a31b6c` 只有本文件 | 本文件 |
| 2 | 在 [RULES.md](../../RULES.md) §9 表、第 238 行「现状理解」之后加一行「UI 上手验收」。不改表里其他行，不改 N-01–N-22。加完立刻跑 `node tools/compare-spec-bytes/compare.mjs`。非 0 就停下，把失败输出写进证据，不加 amendment | 写入第 239 行。compare 退出码 0，未改 manifest | [commands.md](../evidence/145/commands.md) |
| 3 | [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) 在「UI–core 交接说明」整节之后新开「## UI 上手验收（RULES §9）」，放交接给出的勾选。不改 `.github/` 下其他文件 | 第 77–81 行。另有一句链回 RULES §9 | `26edf8f` |
| 4 | [docs/spec-changelog.md](../spec-changelog.md) 表首加一行。版本历史那一段（span）不改。规格版本仍是 v0.6。PR 号等开 PR 后填 | 表首一行，PR 列改为 #145。span 未改 | 本提交 |
| 5 | [docs/approvals.md](../approvals.md) 在 16:34 两行之后加 16:57 一行。第 68 行计数改为 57 条批准。若开工时 main 已不是 f9b34e8，按当时的批准数加 1，并在 PR 里写明 | 第 67 行。计数在第 69 行，57 条批准。基线仍是 f9b34e8，没有另加批准 | `26edf8f` |
| 6 | `node tools/check-docs/check.mjs` 发现数不得多于基线 9。`grep -n "上手验收"` 两处都有且互相引用。证据放 `docs/evidence/<PR号>/commands.md`。Draft PR，正文第一行是 `Fixes #24`，前面没有 HTML 注释 | check-docs 退出码 0，发现数 9。grep 两处都有。Draft PR #145 | [commands.md](../evidence/145/commands.md) |

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 开工做 #24。原话：「按你的建议执行。」范围：RULES §9 与 PR 模板加「UI 改动合入前须由 Loom 或 Wisdom 上手验收」；改 RULES 所需的 compare-spec-bytes amendment 一并批准；不改 CI、不加依赖。步骤 5 把这一行写入 approvals。来源：https://github.com/wisdom-km/open-immerse-v2/issues/24#issuecomment-6626807241 | 评论写明回复 Forge 16:55 第 3 条，推荐现在批 #24 开工。created_at 是 2026-11-04T08:57:26Z，即 16:57 UTC+8 | 2026-11-04 16:57 | Wisdom |
| compare 若失败，先报告，本 PR 不加 amendment | 批准已经包含 amendment，但交接写明失败时先停下，等 Forge 确认后再加唯一替换。old 必须在基线 f8d5d01 里只出现一次。预计 span 不覆盖 §9，不需要改 manifest | 2026-11-04 | 交接；批准范围含 amendment，使用与否另按 compare 结果 |
| 勾选放在新节「UI 上手验收（RULES §9）」，不插进 UI–core 那一节的中间 | 交接允许写在该节里，或紧挨着新开一节。新开一节不改现有交接栏，标题里的「UI 上手验收」对得上 RULES 表「已有条文」那一格 | 2026-11-04 | 本计划；不是新的业主决定 |
| 计划提交后继续改正文，不留到 Forge 审查通过 | [RULES.md](../../RULES.md) §2 要求审查通过之前不写实现。交接步骤写明第一笔只交计划，然后改四处文档。approvals 没有把「跳过 Forge 再写」单独批准 | 2026-11-04 | Cloud |
| 不改 [docs/WORKFLOW.md](../WORKFLOW.md)、[docs/backlog.md](../backlog.md)、`tools/check-docs/**`、CI、依赖、`diag-events.ts` | 交接禁止。开工时唯一打开的 PR 是 #144，只动 diag 契约、它的测试、它自己的计划和证据 | 2026-11-04 | 交接 |

## 来源核对

每一行是交接「来源核对」表里的一条。回应写本计划因此怎么做。Issue #24 正文与评论 6626807241 于 2026-11-04 用 GitHub API 读过。「」内文字与原文一致。`handoffs/28-ci.md` 不在本仓库。

| # | 来源 | 交接里的项 | 本计划怎么回应 |
| --- | --- | --- | --- |
| 1 | [Issue #24](https://github.com/wisdom-km/open-immerse-v2/issues/24) 正文 | Wisdom 2026-10-31 16:28 的决定（M2 待办 #4）：RULES §9 和 PR 模板加「凡是 UI 改动的 PR，合入前须由 Loom 或 Wisdom 实际上手体验并在 PR 中留下结论」；两处都有并互相引用；UI PR 模板里有勾选项；触发时机是 M2 开工、第一个 UI PR 之前 | 正文标题是「DoD 增加 UI 体验检查（UI 改动后由 Loom 或 Wisdom 上手验收）」。背景写「Wisdom 2026-10-31 16:28 决定（M2 待办 #4）」。要做的事、验收、触发时机与交接这三句一致。16:28 的原话只在 issue 正文里这样引用，本仓库没有另一份聊天记录。步骤 2、3 按交接给出的那一行和勾选写入。RULES 的「已有条文」链接模板并点名「UI 上手验收」；模板新节标题写「RULES §9」，勾选写任务类型为「UI 改动」时要留下结论，非 UI 写「不适用」。不改 DESIGN 的 DS / UIX，那些是界面规格，不是这条合入条件 |
| 2 | [issues/24#issuecomment-6626807241](https://github.com/wisdom-km/open-immerse-v2/issues/24#issuecomment-6626807241)（16:57） | 开工批准，原话「按你的建议执行。」；amendment 一并批准；不改 CI、不加依赖 | 评论作者是 wisdom-km。原话是「按你的建议执行。」范围写明 #24 开工、两处加这条、amendment 一并批准、不改 CI、不加依赖。步骤 5 按这句写入 approvals，计入批准。不改 `.github/workflows/**`，不加依赖。amendment 只在 compare 非 0 且 Forge 确认之后才加；本计划不预先改 manifest |
| 3 | [docs/approvals.md](../approvals.md) 第 68 行 | 现在的计数是 56 条批准，加上本条后为 57 | 在 f9b34e8 上第 68 行就是这句。表体 58 行里，反馈 1、决定 1、批准 56。16:57 是新的批准，不是反馈也不是决定。步骤 5 改为「共 57 条批准 + 1 条反馈记录 + 1 条决定」。基线若在写入前变了，按当时批准数加 1，并在 PR 描述写明 |
| 4 | [RULES.md](../../RULES.md) 第 224–240 行 | §9 的结构 | 第 224 行是该标题。第 227 行说明栏目在 PR 模板、模板开头指向本节。表在第 228–238 行，最后一行是「现状理解」。第 240–242 行是 Draft、Forge、N-03，以及只改文档时交接说明写「不适用」。步骤 2 只在第 238 行后加一行，这三行和表里已有的九行都不改 |
| 5 | [tools/compare-spec-bytes/manifest.json](../../tools/compare-spec-bytes/manifest.json) 第 118–125 行（spans） | RULES 只比对 spec-changelog 里的迁移段，所以 §9 的改动不会触发 compare（交接写已实测） | span 的 path 是 `RULES.md`，file 是 `docs/spec-changelog.md`，start 是「Q1–Q12 已由 Wisdom 于 2026-10-30 全部决定；」，end 是「日期：2026-11-03（Asia/Shanghai）。」，bodyEnd 是 `<!-- /oi-split-body -->`。这段在 changelog 第 13 行，§9 表和表首新行都在它外面。交接说本地加一行后 compare 仍是 exit 0。步骤 2 改完立刻跑，退出码 0，RULES span 仍是 2795 字节。manifest 未改。见 [commands.md](../evidence/145/commands.md) |
| 6 | handoffs/28-ci.md（不在本仓库；交接第 1 节已内联） | 28-ci PR1 不碰 approvals、spec-changelog、模板、RULES，没有冲突 | 本仓库没有这份交接文件。交接第 1 节列出的文件是 `tools/check-docs/**`、`ci.yml`、一批 docs 状态行、`ci-and-environment.md`、backlog、它自己的 exec-plan 和 evidence，没有本 PR 的四个文件。本 PR 也不碰那些文件。开工时打开的 PR 只有 [#144](https://github.com/wisdom-km/open-immerse-v2/pull/144)（`feature/m3-diag-source-contract-73`），文件是 `packages/contracts/src/diag-events.ts`、其测试、`docs/exec-plans/feature-m3-diag-source-contract-73.md`、`docs/evidence/144/commands.md`。无重叠。不改 `diag-events.ts` |
| 7 | [RULES.md](../../RULES.md) §7 / §9「文档同步」 | 改了规格就要在 spec-changelog 里加一行 | §7 写规格变更记在 [docs/spec-changelog.md](../spec-changelog.md)，不升应用变更记录，版本仍是 v0.6。§9「文档同步」要求同一 PR 改掉因此失真的句子和入口，并加一行变更记录，不把正文再抄进第二份文件。步骤 4 在表首加一行，span 内的版本历史不改。入口就是 PR 模板，步骤 3 改它。PRD、ARCHITECTURE、DESIGN 里没有「合入前无人手验收」这种会被本条弄假的句子，不改 |

## 要写入的文本

实现照下面写。不改 DESIGN、design-principles、`docs/design/**`、CI、依赖、`tools/**`、`packages/`、`apps/`、`workers/`、WORKFLOW、backlog、check-docs。

### RULES.md §9 表

在第 238 行之后插入这一行，前后行不动：

`| UI 上手验收 | 任务类型为「UI 改动」的 PR，合入前由 Loom 或 Wisdom 实际上手体验，并在 PR 里留下结论（通过 / 不通过 + 一句理由）。没有 UI 改动的写「不适用」 | 本节；[.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md)「UI 上手验收」 |`

### .github/PULL_REQUEST_TEMPLATE.md

在文件末尾、UI–core 那一节之后另起一节：

```markdown
## UI 上手验收（RULES §9）

条件在 [RULES.md](../RULES.md) §9「UI 上手验收」。

- [ ] 任务类型为「UI 改动」：Loom 或 Wisdom 已上手验收，结论：____（验收人、时间）。非 UI 改动写「不适用」
```

勾选句与交接一致。多出来的「条件在……」是为了模板指回 RULES §9，满足 #24 的互引。不改该文件其他行。

### docs/spec-changelog.md

在表头分隔行之后、现有 #143 那一行之前插入。PR 列在开 PR 后写成实际编号。文件列写实际路径，不用省略号。摘要保留 Wisdom 原话，并写明 §9 增加 UI 上手验收、模板有勾选、approvals 16:57 计入后为 57、manifest 未改（仅当 compare 为 0）、规格版本仍是 v0.6。span 那一段一个字不改。

### docs/approvals.md

在第 66 行（16:34「批准合入142。」）之后、计数之前插入：

`| 2026-11-04 16:57 | 「按你的建议执行。」 | #24 开工：RULES §9 与 PR 模板加「UI 改动合入前须由 Loom 或 Wisdom 上手验收」；改 RULES 所需的 compare-spec-bytes amendment 一并批准；不改 CI、不加依赖 | Issue #24 | https://github.com/wisdom-km/open-immerse-v2/issues/24#issuecomment-6626807241 |`

第 68 行改为：`共 57 条批准 + 1 条反馈记录 + 1 条决定`。

### 验收命令

开工前在 f9b34e8 上跑过 `node tools/check-docs/check.mjs`，退出码 0，`findings: 9`（`index-table-missing` 1 条，`status-line-missing` 8 条）。改完后发现数不得多于 9。

`node tools/compare-spec-bytes/compare.mjs` 预期退出码 0，且不改 manifest。非 0 则停止，不写 amendment。

`grep -n "上手验收" RULES.md .github/PULL_REQUEST_TEMPLATE.md` 两处都要有。不跑 vitest，不跑 e2e。

## 证据链接

- `docs/evidence/145/commands.md`：compare、check-docs、grep。

## 自检

- [ ] 影响 arch / prd 吗？不影响。本 PR 不改 PRD 与 ARCHITECTURE 正文。
