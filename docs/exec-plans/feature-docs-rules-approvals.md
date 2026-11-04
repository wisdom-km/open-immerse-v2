# 执行计划

超过 300 行，或跨模块，才复制本模板。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。复制为 `docs/exec-plans/<分支名>.md`。第一笔提交只有该文件。Forge 审查通过之前不写实现。小任务不用本模板，在 PR 描述写三行现状理解。

计划必须自包含：只读这一份文件就能接手，不依赖聊天记录。引用规格时写节号并链接到文件。目录用途、命名和何时必写见 [README.md](README.md)。

本文件是分支 `feature/docs-rules-approvals` 的计划。基线 `main@45241c4`（`45241c4960842640a84722d615821a03b762098f`，PR #136）。任务类型是纯文档 / 规格。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。第一笔提交只有本文件。计划没有留到 Forge 审查后再写实现，这是 Cloud 的流程偏差。PR 保持 Draft，不自行标成 Ready，不合入。

## 现状理解

- 已有行为：`DESIGN.md` 文首（入库说明与「状态：草案 v0.3」）里没有「只搭结构」。`rg "只搭结构" DESIGN.md` 无匹配。`RULES.md` 第 5 行仍写「DESIGN 文首若仍写「Loom 交付前 UI 只搭结构」，以本句为准，那一句留给 Loom 删（N-10，本文件不改 DESIGN 正文）。」第 174 行（§7）末句仍写「DESIGN 文首「交付前只搭结构」一句过时，以本文文首为准，正文等 Loom 删。」`docs/approvals.md` 末行是 2026-11-04 13:31「按推荐，我同意。」（#59 / PR #136），文末「共 34 条批准 + 1 条反馈记录」。`docs/backlog.md` 第 84 行 #136 已标已处理；第 187 行 M1-DEFER-G1 已写「已处理（PR #110）」；全文没有 131、135、137。`docs/exec-plans/feature-m1-deferred-gates.md` 第 49 行仍写「本文件的实际列先空着」；G1 那一行的实际列是 PR #110 进行中的句子，没有写上已接上与复核。G3、G5 两行仍是延后。`package.json` 没有 `check:docs` 脚本。`node tools/check-docs/check.mjs` 在本基线上是 links 0、anchors 0、status 9、verbatim 0、findings 9，只报告、退出码 0。
- 相关的节：[PRD.md](../../PRD.md) 与 [docs/prd/08.md](../prd/08.md) 的 M1（G1、G3、G5 仍是 M1 交付，不挡业务切片）；[ARCHITECTURE.md](../../ARCHITECTURE.md) 与 [docs/arch/13.md](../arch/13.md) 的 G1 / G3 / G5；[RULES.md](../../RULES.md) N-10、§7、§9；[DESIGN.md](../../DESIGN.md) 与 [docs/design-principles.md](../design-principles.md) 只读。批准格式见 [docs/approvals.md](../approvals.md)。待办表见 [docs/backlog.md](../backlog.md)。
- 还没做的部分：下面步骤 2–7。不改 `.github/**`，不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`，不改任何代码，不改 CI。G3、G5 的状态不改。G5 的认法不在本 PR。#132、#133 只在批准表补 13:34 那一行，不改它们的正文，也不为它们加 backlog 行。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔提交只有它。来源核对逐条回应。决策记录含 13:35，以及 13:28 记成决定、不计入批准 | `89b089d` 只有本文件 | 本文件 |
| 2 | 删 `RULES.md` 第 5 行那一句过时提醒，该行其余保留。删第 174 行末句，该行其余保留。不改 DESIGN | `7d4b24f`。`rg "只搭结构" RULES.md` 无匹配。DESIGN.md 不在 diff 里 | [docs/evidence/138/commands.md](../evidence/138/commands.md) |
| 3 | `feature-m1-deferred-gates.md`：G1 行的实际列改成 PR #110 已接上与 2026-11-04 复核；第 49 行「实际列先空着」改成与现状一致。G3、G5 两行不改 | `7d4b24f`。G3、G5 两行与 `origin/main` 相同 | 同上 |
| 4 | `docs/backlog.md`：M1-DEFER-G1 补 2026-11-04 复核和「#34 的 G1 部分可关闭」。第 84 行 #136 不改。§4 加 #131、#137（已处理）和一条未处理的停止信号 polish。G3、G5 两行不改 | `7d4b24f`。第 84 行未改。G3、G5 未改 | 同上 |
| 5 | `docs/approvals.md` 按时间插入 10 行。13:16、13:28 插在现有 13:31（#59）之前；另一条 13:31（#34）紧跟在 #59 那一行之后。13:28 标【决定，不计入批准】。计数改为 43 条批准 + 1 条反馈记录 + 1 条决定。旧行不改 | `7d4b24f`。43 条批准 + 1 条反馈 + 1 条决定。13:31 #59 仍在 #34 之前 | 同上 |
| 6 | `docs/spec-changelog.md` 在表首加本 PR 一行。版本历史标记之内不改。规格版本仍是 v0.6 | 本提交把「本 PR」改成 #138。版本历史标记之内未改 | 同上 |
| 7 | 只跑文档相关检查：`node tools/check-docs/check.mjs`，以及 `pnpm check` 里看 diff 的 `check:commits`、`check:pr-size`、`check:hotspots`。不跑全量测试。结果写入 `docs/evidence/<PR号>/commands.md`。Draft PR，正文含 `Fixes #134`、`Refs #34`、`Refs #131`、`Refs #136`、`Refs #137`、`Refs #135` | `7d4b24f` 上检查见证据。Draft PR [#138](https://github.com/wisdom-km/open-immerse-v2/pull/138) | 同上 |

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 删掉 RULES.md 两处过时提醒，放进本文件所在的文档 PR。原话：「你的建议是删掉吗？如果说你的建议是删掉的话，就删掉吧。」对应 [docs/approvals.md](../approvals.md) 2026-11-04 13:35 行（本计划步骤 5 写入） | DESIGN 文首已经没有那句。N-10 仍禁止改 DESIGN 正文 | 2026-11-04 13:35 | Wisdom |
| #34 只做 G1 的文档收尾。G3、G5 继续延后。不改 CI。原话：「按推荐，我同意。」对应 [docs/approvals.md](../approvals.md) 2026-11-04 13:31 的 #34 行（与已有的 #59 行不是同一条） | 评论 6623431479 的范围是先出方案、CI 另批。评论 6623507281 写明本次无 CI 改动，G5 认法不在本次 | 2026-11-04 13:31 | Wisdom |
| 13:28「就是其余几项不用开分支了。」记成【决定，不计入批准】，不计入批准计数 | 三条评论的标题是「现状」，不是「批准记录」。approvals.md 现有非批准只有【反馈，不计入批准】。本行沿用这个标记，改成决定。范围只是 #28、#61 第 7 项、#33 不开分支 | 2026-11-04 13:28 | Wisdom 的原话；记法由本计划按交接选择 |
| 计划没有留到 Forge 审查后再写后面的提交。这是流程偏差 | RULES §2 要求 Forge 审查通过之前不写实现。approvals.md 没有对应行，不记成 Wisdom 的批准 | 2026-11-04 | Cloud |
| 不改 AGENTS.md 第 11 行那句条件提醒 | 交接 2.1 只点名 RULES 两处。该句是「若 DESIGN 文首仍写」，DESIGN 已经不写，但它不是本 PR 点名的句子。14:54 的批准改了这一条 | 2026-11-04 | Forge（交接范围） |
| 删掉 AGENTS.md 第 11 行「DESIGN 文首若写「交付前只搭结构」，以 RULES 文首为准。」这一句，随 #138 合入。原话：「1按你的推荐，然后删掉，然后加入138一起合入。60和119可以并行开，就是你如果审查完之后并行是没有问题的话，那就并行。」对应 [docs/approvals.md](../approvals.md) 2026-11-04 14:54 行。这条不是合入批准 | 评论 6624659834 的范围是删这句条件句。不是合入批准，本 PR 保持 Draft | 2026-11-04 14:54 | Wisdom |
| #132、#133 不进 backlog，也不改 issue 正文 | 两份正文的范围都是只登记、不开分支。本 PR 只补 13:34 批准行 | 2026-11-04 13:34 | Wisdom |

## 来源核对

每一行是交接「来源核对」表里的一条。回应写本计划因此怎么做。GitHub 正文与评论于 2026-11-04 用 API 读过。「」内文字与下表原话一致。`/workspace/oi-v2/scope-59-34/SCOPE.md` 不在本仓库，本机也没有这份文件。

| 来源 | 交接里的项 | 本计划怎么回应 |
| --- | --- | --- |
| `RULES.md` @45241c4 第 5、174 行 | 2.1 要删的两句原文 | 两句与交接逐字相同。步骤 2 只删这两句。第 5 行删完后，上一句「不当作定稿。」直接接「其他人或 Agent **不得**改正文（N-10）。」第 174 行停在「不再标「待 Loom 产出」。」 |
| [issues/134](https://github.com/wisdom-km/open-immerse-v2/issues/134) 正文 | 2.1 范围与 13:35 批准 | 正文范围是只删这两处、不改 DESIGN、放进下一个文档 PR。原话与决策记录第一行相同。步骤 5 的来源列指向该 issue 正文「批准记录」，不是评论。评论区另有一条 Forge 进度，不是批准 |
| [issues/34#issuecomment-6623431479](https://github.com/wisdom-km/open-immerse-v2/issues/34#issuecomment-6623431479) | 2.2 先出方案、CI 另批；2.3 的 13:31 #34 行 | 原话「按推荐，我同意。」范围是 Forge 先出方案，涉及 CI 的改动另批。步骤 5 把这一行放在已有 13:31（#59，评论 6623430891）之后，因为 6623431479 的编号更后。不改 CI |
| [issues/34#issuecomment-6623507281](https://github.com/wisdom-km/open-immerse-v2/issues/34#issuecomment-6623507281) | 2.2 只补 backlog 与执行计划实际列；G3/G5 延后；无 CI 改动 | 步骤 3、4 只补 G1。G3、G5 的 backlog 行与计划表不改。不改 `.github/workflows`。G5 认法不写 |
| `/workspace/oi-v2/scope-59-34/SCOPE.md` 任务 2 | 2.2 G1 本机 0 文件不符合；G3/G5 现状 | 文件不在本机。同一事实写在评论 6623507281：main@d2dfcb5，0 个文件不符合。本仓库能对上的部分：`package.json` 的 `check` 以 `check:format` 开头；`tools/check-format/check.mjs` 的 glob 是 `**/*.{ts,tsx,mjs,js,cjs}`；`.prettierignore` 含 `.github` 与 `**/*.md`；没有 `packages/contracts/src/ui-events.ts`；`tsconfig*.json` 没有 `composite` 或 `references`。G3、G5 的 backlog 仍是未处理。0 这个数字不在本机重测，沿用该评论对 d2dfcb5 的记录 |
| `docs/exec-plans/feature-m1-deferred-gates.md` 第 47–54 行 | 2.2 实际列为空 | 第 49 行仍写「本文件的实际列先空着」。G1 行（表的第 2 步）的实际列还是「Forge 批准后就在本 PR 做」，没有写 PR #110 已接上。步骤 3 改这两处。第 3、4 步（G3、G5）的格子不改 |
| `docs/backlog.md` 第 84、187 行 | 2.2、2.4 现状 | 第 84 行已是「已处理（#136）」，步骤 4 不改这一行。第 187 行已有 PR #110 与覆盖范围，步骤 4 只在句末补复核与「#34 的 G1 部分可关闭」。在本基线上检索 131、135、137，没有命中 |
| `docs/approvals.md` @45241c4 末行与计数 | 2.3 缺哪些行 | 末行是 13:31 #59，计数是 34 条批准 + 1 条反馈。交接列出的 13:16 至 14:25 共 10 行都不在表里。步骤 5 只追加这 10 行 |
| issue #130 正文「批准记录」 | 2.3 的 13:16 | 原话「你就按照顺序先开吧，然后能并行的就并行开。」时间 13:16 (UTC+8)。范围是按顺序开遗留项，第一项是锚点规则，浅克隆兜底与之合为一个分支。来源列写 issue 正文，不写成评论 |
| #28 / #61 / #33 评论 | 2.3 的 13:28 | 三条评论都引用同一句「就是其余几项不用开分支了。」#28 是 check-docs 不开分支；#61 第 7 项继续搁置；#33 不开分支。记成一条决定，来源列写三个链接 |
| issue #132、#133 正文 | 2.3 的 13:34；2.5 不进本 PR | 两份正文都是 13:34 原话「开」，范围只登记、不开分支、不改代码。步骤 5 写一行。不改这两份 issue，不加 backlog |
| [issues/135#issuecomment-6623647655](https://github.com/wisdom-km/open-immerse-v2/issues/135#issuecomment-6623647655) | 2.3 的 13:47；2.4 的 #137 | 原话「…我这个同意按推荐。」范围是另开小分支，给起子进程的测试设明确超时，只改测试、不改 CI。批准行照抄。backlog 用 #137 的已处理行承接，不在本 PR 改测试 |
| [pull/131#issuecomment-6623665760](https://github.com/wisdom-km/open-immerse-v2/pull/131#issuecomment-6623665760) | 2.3 的 13:48；2.4 的 #131 | 原话「批准合入」。范围是合入 #131 @03b9b8c。`gh pr list --state merged`：#131 的 mergedAt 是 2026-11-04T05:49:18Z，即 13:49（UTC+8）。backlog 写合入 13:49，Fixes #130 |
| [pull/137#issuecomment-6623985445](https://github.com/wisdom-km/open-immerse-v2/pull/137#issuecomment-6623985445) | 2.3 的 14:10；2.4 的 #137 | 原话「批准合入137。」范围是合入 #137 @7c6b7a7。mergedAt 是 2026-11-04T06:11:26Z，即 14:11（UTC+8） |
| [pull/136#issuecomment-6624141225](https://github.com/wisdom-km/open-immerse-v2/pull/136#issuecomment-6624141225) 与 [issues/59#issuecomment-6624141955](https://github.com/wisdom-km/open-immerse-v2/issues/59#issuecomment-6624141955) | 2.3 的 14:20 | 两条评论正文相同。原话「按推荐」，选项 1：compare-spec-bytes 的 amendments 随 #136 合入，不是合入批准。批准表写一行、两个链接 |
| [pull/136#issuecomment-6624220484](https://github.com/wisdom-km/open-immerse-v2/pull/136#issuecomment-6624220484) | 2.3 的 14:25 | 原话「批准合入 136」。合入 #136 @ade9f3e。mergedAt 是 2026-11-04T06:26:20Z。backlog 第 84 行已经记了 #136，不另加行 |
| `workers/parser/oi_worker/api/server.py` 第 60–76 行，`stop_signals.py` 的 `arm_quiet_stop` / `restore_handlers` / `_quiet_exit` | 2.4 polish | `__main__.py` 先 `arm_quiet_stop()`，装上 `_quiet_exit`。`_run_until_stop` 用 `install_hold` 记下当时的处理函数，`finally` 里 `restore_handlers(previous)` 把它恢复回来。`_serve` 在这个任务返回之后才 `_mark_exit()`。Windows 上 `_quiet_exit` 调用 `os._exit(0)`。serve 结束到写出 `{"event":"exited"}` 之间若再来停止信号，这一行可能被跳过。PR #136 的 review 评论 API 为空，issue 评论只写「PASS with nits」，没有贴出这条原文。代码与交接描述一致。步骤 4 在 §4 加一行，状态未处理，时机是下一个碰 worker 停止信号的 PR（M3）。本 PR 不改这两份 Python 文件 |

## 要写入的文本

实现照下面写。已有批准行、G3/G5 行、backlog 第 84 行，都不改措辞。

### RULES.md 第 5 行

删掉这一句，含句号：「DESIGN 文首若仍写「Loom 交付前 UI 只搭结构」，以本句为准，那一句留给 Loom 删（N-10，本文件不改 DESIGN 正文）。」

留下的该行以「不当作定稿。」接「其他人或 Agent **不得**改正文（N-10）。」

### RULES.md 第 174 行

删掉末句，含句号：「DESIGN 文首「交付前只搭结构」一句过时，以本文文首为准，正文等 Loom 删。」

该行停在：「`DESIGN.md` 与 `docs/design-principles.md` 已于 2026-10-30 入库，不再标「待 Loom 产出」。」

### 执行计划实际列

`feature-m1-deferred-gates.md` 第 49 行改为：

「计划列在开工前填。G1 的实际列已按 PR #110 与 2026-11-04 的复核填上。G3、G5 的实际列仍是当时的延后，状态不改。」

G1 那一行（表中步骤 2）的实际列改为：

「已由 PR #110 接上。`check:format` 是 `pnpm check` 第一步。2026-11-04 在 main@d2dfcb5 本机跑过，0 个文件不符合。只覆盖 `*.ts`、`*.tsx`、`*.mjs`、`*.js`、`*.cjs`。Markdown 与 `.github/**` 不格式化。」

### backlog

M1-DEFER-G1 的状态格在现有句号之后补：「2026-11-04 复核：main@d2dfcb5 上 0 个文件不符合，`check:format` 是 `pnpm check` 第一步。#34 的 G1 部分可关闭。」

§4 表末加三行：

- check-docs 标题锚点按 GitHub 规则生成。已处理（#131，Fixes #130，合入 2026-11-04 13:49 UTC+8）。出处 #130、#131。
- 起子进程的门禁测试设明确超时。已处理（#137，#135，合入 2026-11-04 14:11 UTC+8）。只改测试，不改 CI。出处 #135、#137。
- `_run_until_stop` 的 `finally` 把 `arm_quiet_stop` 装的 `_quiet_exit` 恢复回来；serve 结束后的第二个停止信号在 Windows 上可能跳过 `{"event":"exited"}`。未处理。下一个碰 worker 停止信号的 PR（M3）。出处 PR #136 审查 nit。

文首状态段末补一句，记下这三行与 G1 复核，不改更早的句子。

### approvals 新行

时间顺序：13:16、13:28、（已有 13:31 #59）、13:31 #34、13:34、13:35、13:47、13:48、14:10、14:20、14:25。

13:47 的省略号是评论里的「…」（U+2026），不是三个句点。14:10 的原话含句号：「批准合入137。」14:25 的原话在 136 前有空格：「批准合入 136」。

文末改为：「共 43 条批准 + 1 条反馈记录 + 1 条决定」。9 条新批准加上原 34 条。13:28 不计入批准。

### 检查

`pnpm run check:docs` 在 `package.json` 里没有这个脚本，不新增脚本。改跑 `node tools/check-docs/check.mjs`。另跑 `GATE_BASE=origin/main` 下的 `check:commits`、`check:pr-size`、`check:hotspots`。不跑 lint、typecheck、test、codegen。新 Markdown 不得增加 links 或 anchors 计数；status 的 9 条是基线，本 PR 不修。

## 证据链接

- [docs/evidence/138/commands.md](../evidence/138/commands.md)：检查命令与退出码。Draft PR [#138](https://github.com/wisdom-km/open-immerse-v2/pull/138)。
