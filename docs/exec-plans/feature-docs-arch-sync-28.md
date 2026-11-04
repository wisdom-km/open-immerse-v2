# 执行计划

超过 300 行，或跨模块，才复制本模板。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。复制为 `docs/exec-plans/<分支名>.md`。第一笔提交只有该文件。Forge 审查通过之前不写实现。小任务不用本模板，在 PR 描述写三行现状理解。

计划必须自包含：只读这一份文件就能接手，不依赖聊天记录。引用规格时写节号并链接到文件。目录用途、命名和何时必写见 [README.md](README.md)。

本文件是分支 `feature/docs-arch-sync-28` 的计划。基线 `origin/main@7a23dde`（`7a23dde47ef66aa1a2b3cbaddbb64194e7f0511c`，PR #141）。任务类型是纯文档 / 规格。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。第一笔提交只有本文件。

计划没有留到 Forge 审查后再写实现。交接写明先提交本文件，再改正文。这是 Cloud 的流程偏差（[RULES.md](../../RULES.md) §2）。PR 保持 Draft，不自行标成 Ready，不合入。

## 现状理解

- 已有行为：[docs/arch/03.md](../arch/03.md) 的目录树仍把 `src/renderer/` 写成「路由、布局插槽、全局 Provider」，把 `worker-client/` 与 `ui-kit/` 写成已有目录，把 18 个功能切片并列，`tools/` 只列 `check-file-size/`、`check-hotspots/`、`codegen/`。2026-11-04 在本基线上核对：`apps/desktop/src/renderer/` 只有 `index.html`；`packages/` 下没有 `worker-client/`、`ui-kit/`；`packages/features/` 只有 `budget`、`formula-source`、`ingest`、`jobs`、`markdown`；`tools/` 有 18 个目录加文件 `typecheck.mjs` 与目录 `vitest-collect/`。[docs/arch/04-02.md](../arch/04-02.md) 的 `reader` 行列出 `ui/hooks/use-document-session.ts`，没有订阅边界。[docs/backlog.md](../backlog.md) §6 P2-9（第 167 行）仍是未处理。§4 表末是第 110 行的停止信号 polish，没有 websocket 透传，也没有 #141 的三项未核实。[docs/approvals.md](../approvals.md) 末行是 2026-11-04 14:54，文末「共 44 条批准 + 1 条反馈记录 + 1 条决定」。[.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md) 第 21 行是「## 测试证据」。[docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 没有自检节。
- 相关的节：[ARCHITECTURE.md](../../ARCHITECTURE.md) §3（[docs/arch/03.md](../arch/03.md)）、§4.1（[docs/arch/04-01.md](../arch/04-01.md) 第 41 行已把 `supervisor-protocol.ts` 标为计划中）、§4.2 `reader` / `quality` / `repair`（[docs/arch/04-02.md](../arch/04-02.md)）、§4.3（[docs/arch/04-03.md](../arch/04-03.md) 仍有 `quality` 与 `repair` 节点，并写明删除的是 `repair → quality`）。[docs/adr/0003-repair-quality-removed.md](../adr/0003-repair-quality-removed.md) 只登记这条边。[PRD.md](../../PRD.md) §10 仍把「补救（Repair）」当作术语。[RULES.md](../../RULES.md) §7、§9：改规格要在 [docs/spec-changelog.md](../spec-changelog.md) 加一行。N-10：不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)、`docs/design/**`。设计原则 P7 与 DESIGN 只读，本 PR 不改界面。
- 还没做的部分：下面步骤 2–8。不改 `.github/workflows/**`，不改 `apps/`、`packages/`、`workers/`、`tools/` 的源码，不改 `tools/compare-spec-bytes/`。不碰 PR #142 的文件：`workers/parser/tests/api/test_app.py`、`docs/exec-plans/feature-m3-worker-testclient-warning-140.md`、`docs/evidence/140/**`。不做 #28 改进 1–3（check-docs 转必需、路径存在性检查、依赖图）与改进 5（AGENTS.md 过期提醒）。不碰 #119、#33、#61 第 7 项、#132、#133、#140、#73。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔提交只有它。来源核对逐条回应。`quality/`、`repair/` 不从目录树删除 | 提交 `17a779a` 只有本文件 | 本文件 |
| 2 | 改 [docs/arch/03.md](../arch/03.md) 四处：renderer 注释、`worker-client/` 与 `ui-kit/` 标计划中、切片区分已建与计划中、`tools/` 补齐。`quality/`、`repair/` 留在计划中，并注明 ADR 0003 删的是边 | 已写入。`vitest-collect/` 是目录 | `49114de` |
| 3 | [docs/arch/04-02.md](../arch/04-02.md) `reader` 行写上会话 hook 边界（Fixes #42） | 已写入文件格末尾 | `49114de` |
| 4 | [docs/backlog.md](../backlog.md)：第 167 行 P2-9 改为已处理；§4 表末加 websocket 透传与 #141 三项；文首状态行末补一句 | 已改。§3 第 53 行另一个 P2-9 未动 | `49114de` |
| 5 | [docs/approvals.md](../approvals.md) 在 14:54 之后加 10 行。15:44 计入批准。计数改为 54 条批准 + 1 条反馈记录 + 1 条决定 | 56 行日期记录：54 条批准 + 1 条反馈 + 1 条决定。15:28 用 `pull/139` | `49114de` |
| 6 | PR 模板在「## 测试证据」前加自检勾选。执行计划模板文末加「自检」节与同一行 | 两处都已加交接那句 | `49114de` |
| 7 | [docs/spec-changelog.md](../spec-changelog.md) 表首加一行。版本历史标记之内不改。规格版本仍是 v0.6 | 表首一行，PR 列改为 #143。版本历史标记之内未改 | 本提交与 `49114de` |
| 8 | `node tools/check-docs/check.mjs` 与 `node tools/compare-spec-bytes/compare.mjs`。发现数不得高于基线 9。arch 正文变化若让逐字比对失败，记在证据里，不改工具。Draft PR，正文第一行 `Fixes #42`，第二行 `Refs #28` | check-docs 退出码 0，发现数 9。compare 退出码 1，ARCHITECTURE.md 字节 37817。Draft PR #143 | [commands.md](../evidence/143/commands.md) |

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 开本文件所在的文档 PR，第二项 #73 等 #142 合入后再开。原话：「按你推荐开第一项，第二项等142合入后再开。」对应步骤 5 将写入的 15:57 行 | 评论 6625727777 的范围就是本 PR：03.md 四处、#42、approvals、backlog、PR 模板自检行。不改 CI、不改代码 | 2026-11-04 15:57 | Wisdom |
| 15:44「按推荐」计入批准，不标【决定，不计入批准】 | 评论 6625527767 的标题是「批准记录」，写了批准范围。表里其他「按推荐」都计入。现有不计入的行都自带【反馈】或【决定】标记。15:44 没有这个标记 | 2026-11-04 15:44 | Wisdom 的原话；记法按 approvals 现有惯例 |
| 目录树不删除 `quality/`、`repair/`，改为计划中 | 审计评论把 ADR 0003 读成切片已移除。ADR 0003 与 §4.3 写的是删除 `repair → quality`。§4.2 与 PRD §10 仍有这两个切片。目录未建，与其他未建切片一样标计划中。删名字会让 §3 与 §4.2 新产生不一致 | 2026-11-04 | 本计划按来源核对；不是新的业主决定 |
| 不改 `tools/compare-spec-bytes/` | 交接写明不改工具。arch 正文一改，拼接字节会对不上拆分基线。差异记在证据里，不在本 PR 加 amendment | 2026-11-04 | 交接范围 |
| 计划没有留到 Forge 审查后再写后面的提交。这是流程偏差 | [RULES.md](../../RULES.md) §2 要求 Forge 审查通过之前不写实现。交接要求提交计划后改正文。approvals 没有把「跳过 Forge 再写」单独批准 | 2026-11-04 | Cloud |

## 来源核对

每一行是交接「来源核对」表里的一条。回应写本计划因此怎么做。GitHub 正文与评论于 2026-11-04 用 API 读过。「」内文字与评论原话一致。`/workspace/oi-v2/pr139-review/REVIEW.md` 与 `/workspace/oi-qa/v2-pr141-047c346/ANVIL.md` 不在本仓库。

| 来源 | 交接里的项 | 本计划怎么回应 |
| --- | --- | --- |
| [#28 评论 6625527114](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527114) | 03.md 四处不一致 | 评论核对的是 `origin/main@5ca0b33`。本基线 `7a23dde` 上四处仍在：第 23 行 renderer 注释、第 29 与 31 行两个不存在的包、第 33–37 行 18 个切片里只有 5 个目录、第 45–48 行 tools 只列 3 项。步骤 2 按「要写入的文本」改这四处。评论第 2 条写「按 ADR 0003，repair 和 quality 已移除」。这条与 ADR 正文不符，见下一段，不照这句删除切片名 |
| [docs/adr/0003-repair-quality-removed.md](../adr/0003-repair-quality-removed.md)、[docs/arch/04-02.md](../arch/04-02.md)、[docs/arch/04-03.md](../arch/04-03.md) 第 62 行 | 交接第 3 节「第 35 行删除 quality/、repair/」的理由 | ADR 标题是「删除 repair 到 quality」。正文决定是 `repair` 不再依赖 `quality`，补救仍产出候选，重新评分由 `ingest` 调 `quality`。§4.2 仍有两行。§4.3 的图仍有 `quality` 与 `repair`，并写「删除 `repair → quality`」。`packages/features/` 下这两个目录确实不存在。步骤 2 把它们与其他未建切片一起标「计划中」，不从树里删掉 |
| [#28 评论 6625527767](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527767) | 15:44 批准 | 原话「按推荐」。评论写明批准范围是上一条的 5 项改进，加上在下一个 docs PR 里修好 03.md 的 4 处不一致。步骤 5 照交接写入这一行，并计入批准。本 PR 只做 03.md 四处与改进 4 的自检行。改进 1–3 是 CI，交接第 1 节排除。改进 5（AGENTS.md 过期提醒）不在交接第 3 节，不做 |
| [Issue #42](https://github.com/wisdom-km/open-immerse-v2/issues/42) 正文 | reader hook 边界 | 正文要求在 ARCH §4.2 `reader` 行写明：会话 hook 只订阅 `window.oi` 与 `pure.ts`，不保存采用版本或译文正文的副本。验收是 ARCH 有该句。步骤 3 把这句话写进文件格，文件名与这句话连在一起 |
| [docs/backlog.md](../backlog.md) 第 167 行 P2-9 | 同一条 | 第 167 行是 §6 的 P2-9，状态仍是「未处理。M2 搭阅读器之前……」。§3 另有一条同号 P2-9（第 53 行，仓库现状与 M1 落差），不改。步骤 4 只改第 167 行的状态格为「已处理（本 PR，ARCH §4.2 reader 行，#42）」 |
| `workers/parser/oi_worker/api/auth.py` 第 25–27 行、`app.py` 第 12 行；交接写的 REVIEW.md 第 14 行 | websocket 透传 | REVIEW.md 不在本仓库。代码对得上：`scope["type"] != "http"` 时 `await self._app(...)` 后返回；`app.py` 第 12 行 `add_middleware(LaunchBearerMiddleware, token=token)`。文件头写明非 HTTP scope 原样转发。本仓库 `oi_worker/api/` 下没有 websocket 路由。步骤 4 在 §4 加一行，里程碑「M3 或首个 websocket 端点之前」。不改这两份 Python 文件 |
| [#141 评论 6625603468](https://github.com/wisdom-km/open-immerse-v2/pull/141#issuecomment-6625603468)；交接内联的 ANVIL.md 第 17–19 行 | #141 三项 | 评论末句：「Anvil 未核实项转 #69 后续：mac 上 INDEX.HTML 行为；截图内容；打包后 js/css Content-Type。」ANVIL.md 不在本仓库。步骤 4 按交接内联的三句写入 §4：mac 上 INDEX.HTML（Windows 200、Linux 404）；`window-1..3.png` 每张 2618B、内容未核实；打包后 assets 下 js/css 的 200 响应 Content-Type 未核实（只验了 404）。本 PR 不跑 e2e、不打包 |
| 交接 3.4 各行链接 | approvals 10 行 | 10 个评论都读过，原话与交接一致。15:28 的实际 URL 是 `pull/139`，不是 `issues/139`。15:50 是 `pull/141`。步骤 5 按实际路径写。15:02–15:54 是 9 行，加上 15:57 是 10 行，与评论 6625727777 的「9 行 + 本条」一致 |
| [#28 评论 6625527114](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527114) 改进 4 | PR 自检行 | 评论原文是「影响 arch 或 prd 吗？影响就在同一个 PR 里改。」15:57 的范围缩写成「影响 arch/prd？在同一 PR 更新」。交接给出的勾选句是「影响 arch / prd 吗？影响就在同一个 PR 里更新。」步骤 6 用交接这句，两处各一行。执行计划模板原来没有自检节，加一节「自检」来放这一行 |

## 要写入的文本

实现照下面写。不改 DESIGN、design-principles、`docs/design/**`、CI、代码，也不改 §4.2 里 `quality` 与 `repair` 的职责行。

### docs/arch/03.md

第 23 行注释改为：「当前只有 index.html；路由、布局插槽、全局 Provider 为计划中」。

第 29 行 `worker-client/` 注释改为：「计划中。oi-parse/1 的 TS 客户端（本机 / 远程共用）」。

第 31 行 `ui-kit/` 注释改为：「计划中。设计令牌与基础组件（按 Loom 的 DESIGN.md 实现）；markdown/ 为共享 MarkdownView（§4.5.4）」。

第 33–37 行换成：

```text
│  └─ features/                       # 按功能切片，见 §4
│     ├─ budget/  formula-source/  ingest/  jobs/  markdown/  # 已建
│     ├─ library/  document/  parsing/  formula/  translation/  # 计划中
│     ├─ quality/  repair/            # 计划中。ADR 0003 删的是 repair → quality，不是这两个切片（§4.2）
│     ├─ reader/  notes/  qa/  voice/ # 计划中
│     └─ settings/  diagnostics/      # 计划中。writing/ 为预留位，v2 不建目录（§4.4）
```

`tools/` 换成下面这些名字，保留 codegen 原有注释。`typecheck.mjs` 是文件，其余是目录（`vitest-collect/` 也是目录，不是文件）：

`check-commits/`、`check-core-tests/`、`check-deps/`、`check-docs/`、`check-file-size/`（保留「行数门禁」）、`check-format/`、`check-hotspots/`（保留「热点文件登记校验」）、`check-license/`、`check-one-slice/`、`check-pr-size/`、`check-secrets/`、`codegen/`、`compare-spec-bytes/`、`eslint/`、`gate-fixtures/`、`gate-remediation/`、`spawn-bin/`、`tsconfig-core/`、`typecheck.mjs`、`vitest-collect/`。

### docs/arch/04-02.md reader 行

文件格末尾的 `` `ui/hooks/use-document-session.ts` `` 改为：

`` `ui/hooks/use-document-session.ts` 会话 hook 只订阅 `window.oi` 与 `pure.ts`，不保存采用版本或译文正文的副本 ``

职责格不改。

### docs/backlog.md

文首状态行（第 3 行）句号之后补：「同日补 websocket 透传、#141 三项遗留；P2-9 已处理（#42）。」

§4 表在第 110 行之后加两行：

- 事项：worker `LaunchBearerMiddleware`（`workers/parser/oi_worker/api/auth.py`）对非 http scope（websocket、lifespan）直接透传，不校验 launch bearer。worker 目前无 websocket 路由，是潜在缺口；以后加 websocket 前须补鉴权。里程碑：M3 或首个 websocket 端点之前。出处：PR #139 Forge 审查。REVIEW.md 不在本仓库；代码见 `auth.py` 第 25–27 行，`app.py` 第 12 行 `add_middleware`。
- 事项：#141 Anvil 未核实三项（转 #69 后续）：mac 上 INDEX.HTML 的行为（Windows 200、Linux 404）；e2e 截图 window-1..3.png 每张 2618B，内容未核实；打包后 assets 下 js/css 的 200 响应实际 Content-Type 未核实（只验了 404 路径）。里程碑：#69 后续。本 PR 不核实。出处：#141 评论 6625603468。ANVIL.md 第 17–19 行不在本仓库，三句按交接内联写入。

第 167 行状态格改为：「已处理（本 PR，ARCH §4.2 reader 行，#42）」。发现格与留给格不改。第 53 行那个 P2-9 不改。

### docs/approvals.md

在 14:54 那一行之后、计数之前，按时间加上下面 10 行。15:28 用 `pull/139`。全部计入批准。文末改为：「共 54 条批准 + 1 条反馈记录 + 1 条决定」。44 + 10 = 54。原有的 1 条反馈、1 条决定不动。

| 时间 | Wisdom 原话 | 批了什么 | 对应位置 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-11-04 15:02 | 「同意批准」 | 合入 #138 @9c64cfd | PR #138 | https://github.com/wisdom-km/open-immerse-v2/pull/138#issuecomment-6624793605 |
| 2026-11-04 15:15 | 「只开69吧」 | 只开 #69；只改 apps/desktop/src/main/ 与测试，不改 CI | Issue #69 | https://github.com/wisdom-km/open-immerse-v2/issues/69#issuecomment-6625006385 |
| 2026-11-04 15:21 | 「按推荐」 | #69：仍只放行 .html；扩展名→MIME 表，未知 application/octet-stream；所有响应加 nosniff | Issue #69 | https://github.com/wisdom-km/open-immerse-v2/issues/69#issuecomment-6625123533 |
| 2026-11-04 15:28 | 「批准合入139。」 | 合入 #139 @8d38545 | PR #139 | https://github.com/wisdom-km/open-immerse-v2/pull/139#issuecomment-6625234586 |
| 2026-11-04 15:29 | 「那就是同意开140，然后按照你的建议，等139一合入就开始。」 | 开 #140（①②③），#139 合入后拉分支 | Issue #140 | https://github.com/wisdom-km/open-immerse-v2/issues/140#issuecomment-6625257930 |
| 2026-11-04 15:36 | 「OK，那就按照你的建议保留吧。」 | #141 .html 后缀不区分大小写保留，按 047c346 原样合入 | PR #141 | https://github.com/wisdom-km/open-immerse-v2/issues/69#issuecomment-6625357913 |
| 2026-11-04 15:44 | 「按推荐」 | #28 的 5 项改进 + 下一个 docs PR 修 03.md 4 处不一致 | Issue #28 | https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527767 |
| 2026-11-04 15:50 | 「批准合入」 | 合入 #141 @047c346（Fixes #69） | PR #141 | https://github.com/wisdom-km/open-immerse-v2/pull/141#issuecomment-6625603468 |
| 2026-11-04 15:54 | 「按推荐一的内容。」 | 流程：分支落后 main 时默认 merge 同步（不 rebase/force），PR 文件 blob 不变且新 tip CI 绿后 --match-head-commit 合入；不改仓库设置 | 流程 | https://github.com/wisdom-km/open-immerse-v2/pull/141#issuecomment-6625655280 |
| 2026-11-04 15:57 | 「按你推荐开第一项，第二项等142合入后再开。」 | 开本文档 PR；#73 等 #142 合入后再开 | Issue #28/#42/#73 | https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625727777 |

15:44 的「批了什么」写成「下一个 docs PR」，避免把尚未合并的本 PR 写成已经修完。原话与范围仍是那条评论。

### 模板

`.github/PULL_REQUEST_TEMPLATE.md` 在第 21 行「## 测试证据」之前加：

`- [ ] 影响 arch / prd 吗？影响就在同一个 PR 里更新。`

`docs/exec-plans/TEMPLATE.md` 在文末加：

```markdown
## 自检

- [ ] 影响 arch / prd 吗？影响就在同一个 PR 里更新。
```

模板原来没有自检节。只加这一节和这一行。上面四节的原文不改。不改 `.github/workflows/**`。

### 规格变更记录

[docs/spec-changelog.md](../spec-changelog.md) 表的第一行数据之前加一行。日期 2026-11-04。PR 号等 Draft PR 开出后填。文件列含 `docs/arch/03.md`、`docs/arch/04-02.md`、`docs/backlog.md`、`docs/approvals.md`、`docs/spec-changelog.md`、`docs/exec-plans/feature-docs-arch-sync-28.md`、`docs/exec-plans/TEMPLATE.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`docs/evidence/<PR号>/commands.md`。摘要写：同步 §3 目录树与 `origin/main@7a23dde` 的已建目录；`quality` / `repair` 仍是计划中的切片，ADR 0003 只删除 `repair → quality`。`reader` 会话 hook 只订阅 `window.oi` 与 `pure.ts`，不保存采用版本或译文正文的副本（Fixes #42）。approvals 补 15:02–15:57，15:44 计入批准。不改 CI，不改代码。规格版本仍是 v0.6。

`<!-- oi-split-body -->` 之前的版本历史不改。

### 检查

基线 `7a23dde` 上 `node tools/check-docs/check.mjs` 退出码 0：links 0、anchors 0、status 9、verbatim 0、findings 9。改完后 findings 仍须是 9，不得新增。9 条是既有的状态行 / 索引表，本 PR 不修。

`node tools/compare-spec-bytes/compare.mjs` 按 manifest 把章节拼回拆分基线 `f8d5d01`，amendment 只覆盖 §10.1 与 §10.5。03.md 与 04-02.md 的正文一改，ARCHITECTURE 会在某个字节对不上。按交接不改工具，把命令、退出码和差异字节记进 `docs/evidence/<PR号>/commands.md`。不跑 `pnpm exec prettier --check`（不覆盖 Markdown）。不跑全量 `pnpm test` / `pnpm check`。CI 的 `pnpm test` 会收集 `tools/compare-spec-bytes/compare.test.ts`，本 PR 预期那条「章节拼回去与基线一致」失败。这是不改工具的结果，写进 PR 的未验证项。

## 证据链接

- `docs/evidence/<PR号>/commands.md`：检查命令与退出码。Draft PR 开出后把 `<PR号>` 换成实际编号。
