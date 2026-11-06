# 执行计划

本文件是分支 `feature/docs-daycheck-2026-11-06-28` 的计划。任务类型是纯文档 / 规格。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。第一笔提交只有本文件。

本任务不足 300 行，也不跨切片实现。仍按本次交接写计划：路径就是本文件。计划列在第一笔提交写完。实际列在改正文之后填。Wisdom 的任务原文要求写完计划后继续做，不因第一笔提交再等待 Forge。这覆盖 [RULES.md](../../RULES.md) §2「Forge 审查通过之前不写实现」。PR 保持 Draft。不合入，不标 Ready，不 force push，不改分支保护，不发版。

## 现状理解

- 已有行为：2026-11-06 核对 `origin/main` 与本地 `main` 都是 `d8113a1e98c41aaf37258c7f3cf00bd6c64d5a59`（`feat(reader): M2 ③ reader 核心与 PDF.js 适配 (#176)`）。与 Loom 核实基线相同，没有 tip 漂移。[docs/arch/03.md](../arch/03.md) 第 37 行 renderer 只写 `index.html` 与 `oi-api.d.ts`；第 42 行仍把 SQLite 与文件资产和 safeStorage、HTTP 客户端写在同一句「计划中」；第 48 行 `library/` 与尚未建的 `document/`、`parsing/`、`formula/`、`translation/` 同在「计划中」；第 50 行 `reader/` 与尚未建的 `notes/`、`qa/`、`voice/` 同在「计划中」。[docs/arch/12-01.md](../arch/12-01.md) 第 6 行写样例放 `fixtures/eval/`，没有「计划中」。磁盘：`packages/features/` 有 `library/`（`src/` 35 个文件）和 `reader/`（`src/` 19 个文件，无 `src/ui/`）；没有 `document/`、`parsing/`、`formula/`、`translation/`、`notes/`、`qa/`、`voice/`。`packages/platform-node/src/` 只有 `index.ts`、`logging/`、`storage/`（11 个文件，含 `open-storage.ts`、`data-root.ts`）；没有 `sqlite/`、`http/`、`secrets/`、`assets/`。`apps/desktop/src/renderer/` 有 `index.html`、`oi-api.d.ts`、`main.tsx`、`slots.ts`、`library.css`。`slots.ts` 只导出文献库贡献数组。`fixtures/` 只有 `protocol/`，没有 `fixtures/eval/`。`reader` 的 README 写「没有阅读场景界面」。
- 相关的节：[ARCHITECTURE.md](../../ARCHITECTURE.md) §3（[docs/arch/03.md](../arch/03.md)）、§12.1（[docs/arch/12-01.md](../arch/12-01.md)）。§4.1（[docs/arch/04-01.md](../arch/04-01.md)）仍把 `sqlite/`、`assets/`、`secrets/`、`http/` 列为模块文件职责，那是目标清单，本计划不改。§4.2 的 `reader` 行仍列阅读界面文件，那是目标职责，本计划不改。§5.3 描述目标插槽名，本计划不改。§8.2 是数据根布局，不是源码目录，本计划不改。[RULES.md](../../RULES.md) §7：改规格要在 [docs/spec-changelog.md](../spec-changelog.md) 加一行。计划引用的批准要记在 [docs/approvals.md](../approvals.md)。逐字比对用 `tools/compare-spec-bytes/manifest.json` 的唯一替换，基线仍是 `f8d5d01dc8af81b73689c7229c983192551fa6fe`，不改 `compare.mjs`。N-10：不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)、`docs/design/**`。本任务无界面。原则 P4 与 DESIGN D1 是优先系统控件；这里不新增控件。
- 还没做的部分：下面步骤 2–7。不改 PRD、RULES、DESIGN 正文。不改 `apps/`、`packages/`、`workers/`、`fixtures/` 的实现目录。不新建 `fixtures/eval/`。不改依赖、锁文件、CI、依赖边、门禁脚本与比对基线。不重做 2026-11-05 日检 7 条（#164）。不做 #28 的 CI 增强，不做视觉 12 项，不补历史审批积压。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔提交只有它。写明 5 条来源、SHA、范围、验收 | 提交 `1c88f51` 只有本文件 | 本文件 |
| 2 | 改 [docs/arch/03.md](../arch/03.md) 第 37、42、47–51 行。`library/` 与 `reader/` 标已建。`document/` 等与 `notes/` 等仍计划中。`reader/` 单独一行，写明核心与 PDF.js 适配、没有阅读界面。platform-node 写明 SQLite 与文件存储路径已在 `storage/`；safeStorage、HTTP 客户端仍计划中。renderer 补上三个现有文件；路由与全局 Provider 仍计划中 | 已按「要写入的文本」写入。`quality/` 与 `settings/` 两行未改 | 同文件 |
| 3 | [docs/arch/12-01.md](../arch/12-01.md) 第 6 行给 `fixtures/eval/` 加「计划中」。不改路径，不新建目录。不在 §3 目录树加 `eval/` 行 | 已写入。未新建 `fixtures/eval/`，§3 未加 `eval/` | 同文件 |
| 4 | [docs/approvals.md](../approvals.md) 只加 13:22 与 13:55 两行。计入批准。总数 103 改为 105。不补这两次之间的历史积压 | 已写入。文首日期改为 2026-11-06 | 同文件 |
| 5 | [docs/spec-changelog.md](../spec-changelog.md) 表首加一行。版本历史标记之内不改。规格版本仍是 v0.6。PR 号等 Draft PR 开出后填 | 表首一行。PR 列是 [#177](https://github.com/wisdom-km/open-immerse-v2/pull/177) | 同文件 |
| 6 | `tools/compare-spec-bytes/manifest.json` 在 `amendments` 末尾为上述正文各加一条唯一替换。`old` 是当前拼接正文里只出现一次的句子，`new` 是改后的句子。不改基线，不改 `compare.mjs` | 追加四条。拼接模拟与工作区正文一致 | 同文件 |
| 7 | 跑文档门禁：`node tools/check-docs/check.mjs`、`node tools/compare-spec-bytes/compare.mjs`、`git diff --check`，以及 `corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts`。不跑全量产品测试。失败只修失败项再测。日志写入 `docs/evidence/<PR号>/commands.md`。Draft PR，正文用 `Refs #28`，不用 `Fixes` | 四条命令与 `check-commits` 退出码都是 0。check-docs findings 0。compare 对准 `f8d5d01`，ARCHITECTURE 365716 字节。vitest 14 passed。Draft PR #177，正文 `Refs #28` | [commands.md](../evidence/177/commands.md) |

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。那两行在步骤 4 写入。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 5 条全部纳入下一份文档 PR。原话：「全部纳入，纳入前你让 Loom 核实一下。」 | 日检 [issuecomment-6673896663](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6673896663)。Loom 已于 13:25 核实 5/5 成立，基线与本计划的 main 相同。核实完成前不改文档；开工时核实已经完成 | 2026-11-06 13:22 | Wisdom |
| 可以开 PR 修改仓库。原话：「批准可以开 pr 修改仓库」。不含合入 | 范围是核实记录 [issuecomment-6677707543](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6677707543) 的 5 条。只校正目录与实现状态 | 2026-11-06 13:55 | Wisdom |
| 不在 §3 的 `fixtures/` 下加 `eval/` 行 | Loom 把这一行标成可选，日检原句与验收第 5 条只点 [docs/arch/12-01.md](../arch/12-01.md)。加上会扩大「仅 5 条」的范围 | 2026-11-06 | 本计划按验收第 5 条；不是新的业主决定 |
| 不改 §4.1 的 `sqlite/`、`assets/`、`secrets/`、`http/` 路径 | 那些行是模块职责清单。验收第 3 条只改 §3 的状态句，并禁止声称这些独立目录已经存在 | 2026-11-06 | 本计划按验收第 3 条；不是新的业主决定 |
| 第一笔提交之后继续改正文，不等 Forge 再审计划 | 任务原文要求如此。这覆盖 RULES §2 的等待。PR 仍是 Draft | 2026-11-06 | Wisdom 的任务指示 |

## 来源核对

每一行对本次交接点名的来源。GitHub 评论于 2026-11-06 用 API 读过。本地 `git fetch origin main` 之后 `origin/main` 仍是 `d8113a1e98c41aaf37258c7f3cf00bd6c64d5a59`。没有实质冲突，不扩大范围。

| 来源 | 主张 | 本计划怎么回应 |
| --- | --- | --- |
| [#28 评论 6673896663](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6673896663) | 今日日检 5 条 NEW。基线 `main@d8113a1`。昨日 7 条不复报。不做 CI | 步骤 2、3 只改这 5 条。昨日 7 条、CI、视觉项不在范围 |
| [#28 评论 6677657688](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6677657688) | 13:22 原话「全部纳入，纳入前你让 Loom 核实一下。」5 条都进文档 PR，不扩实现 | 步骤 4 记这一行。实现不早于 Loom 核实 |
| [#28 评论 6677707543](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6677707543) 与附件 `LOOM-VERIFY.md` | 5/5 成立。基线 `d8113a1e98c41aaf37258c7f3cf00bd6c64d5a59`。目录已建不等于产品完成。给出最小改文 | 步骤 2、3 采用该报告的最小改文。`reader/` 单独成行，以便写明没有阅读界面。不把「已建」写成功能完成 |
| [#28 评论 6678088734](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6678088734) | 13:55 原话「批准可以开 pr 修改仓库」。按核实记录改文档并开 Draft PR。不含合入 | 本分支与 Draft PR。描述用 `Refs #28` |
| [docs/approvals.md](../approvals.md) 里已有的 #28、文献库、阅读、存储、fixtures 行 | 用来排除范围：不是重做昨日 7 条，不是 CI 增强，不是视觉 12 项，也不补全部历史审批 | 步骤 4 只加本次两行。已有的 2026-11-04 15:44、16:48、16:57、17:28、18:33、19:06 与 2026-11-05 09:21 等行不动 |

## 验收

1. [docs/arch/03.md](../arch/03.md)：`library/` 在「已建」行。同行不带 `document/`、`parsing/`、`formula/`、`translation/`。不写「文献库全部完成」。
2. 同文件：`reader/` 为已建，注释写明核心与 PDF.js 适配、没有阅读界面。`notes/`、`qa/`、`voice/` 仍在「计划中」。不写「阅读功能全部完成」。
3. 同文件：platform-node 写明 SQLite 与文件存储路径已在 `storage/`。safeStorage、HTTP 客户端仍是「计划中」。不写已有 `sqlite/`、`assets/`、`secrets/` 目录，也不写文件资产业务全部完成。
4. 同文件：renderer 注释列出 `index.html`、`oi-api.d.ts`、`main.tsx`、`slots.ts`、`library.css`。路由、全局 Provider 仍计划中。`slots.ts` 写成文献库贡献数组，不称布局系统完成。
5. [docs/arch/12-01.md](../arch/12-01.md)：`fixtures/eval/` 后有「计划中」。路径仍是 `fixtures/eval/`。仓库不新建该目录。

## 要写入的文本

### docs/arch/03.md

第 37 行改为：

```text
│     ├─ src/renderer/                # 当前有 index.html、oi-api.d.ts、main.tsx、slots.ts、library.css；路由、全局 Provider 为计划中。slots.ts 现为文献库贡献数组（非正式布局系统）
```

第 42 行改为：

```text
│  ├─ platform-node/                  # Node 侧基础设施：SQLite、文件资产、safeStorage、HTTP 客户端、日志落盘。SQLite 与文件存储路径已在 storage/（open-storage.ts、data-root.ts 等）；safeStorage、HTTP 客户端计划中；日志落盘已在 logging/
```

第 47–51 行改为：

```text
│     ├─ budget/  formula-source/  ingest/  jobs/  markdown/  library/  # 已建
│     ├─ document/  parsing/  formula/  translation/  # 计划中
│     ├─ quality/  repair/            # 计划中。ADR 0003 删的是 repair → quality，不是这两个切片（§4.2）
│     ├─ reader/                      # 已建。核心与 PDF.js 适配；没有阅读界面
│     ├─ notes/  qa/  voice/          # 计划中
│     └─ settings/  diagnostics/      # 计划中。writing/ 为预留位，v2 不建目录（§4.4）
```

`quality/` 与 `settings/` 两行保持现在的文字。`reader/` 不并进「已建」总行，避免「没有阅读界面」被读成整行切片的注释。

### docs/arch/12-01.md

第 6 行改为：

```text
M0 的路线对比与以后的回归只用这一份记录形状，不在这里填数字。样例放 `fixtures/eval/`（计划中），用合成数据。v1 语料只读 clone 旧仓库，不提交 PDF，清单记 sha256（RULES N-07、N-12）。
```

### docs/approvals.md

文首日期改为 2026-11-06。在 2026-11-05 17:44 那一行之后加：

| 时间 | Wisdom 原话 | 批了什么 | 对应位置 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-11-06 13:22 | 「全部纳入，纳入前你让 Loom 核实一下。」 | #28 今日日检 5 条全部纳入下一份文档 PR。只校正文档与已实现现状，不扩实现。前置是 Loom 逐条核实 | Issue #28 | https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6677657688 |
| 2026-11-06 13:55 | 「批准可以开 pr 修改仓库」 | 按核实记录改这 5 条文档并开 Draft PR。只做目录与实现状态校正，不扩代码。不含合入授权 | Issue #28 | https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6678088734 |

文末改为：「共 105 条批准 + 1 条反馈记录 + 3 条决定 + 3 条合入同步」。

### 规格变更记录

表的第一行数据之前加一行。日期 2026-11-06。文件列含 `docs/arch/03.md`、`docs/arch/12-01.md`、`docs/approvals.md`、`docs/spec-changelog.md`、`docs/exec-plans/feature-docs-daycheck-2026-11-06-28.md`、`tools/compare-spec-bytes/manifest.json`、`docs/evidence/<PR号>/commands.md`。摘要写：Refs #28。按 2026-11-06 日检校正 §3 与 §12.1 的目录现状。`library/` 与 `reader/` 切片已建；阅读界面未建。SQLite 与文件存储路径在 `storage/`。safeStorage 与 HTTP 客户端仍计划中。`fixtures/eval/` 标计划中，不建目录。approvals 只补 13:22 与 13:55。manifest 加唯一替换，对准拆分基线。不改基线 `f8d5d01`，不改 `compare.mjs`，不改 CI。规格版本仍是 v0.6。

`<!-- oi-split-body -->` 之前的版本历史不改。

### compare-spec-bytes

四条 `source` 都是 `ARCHITECTURE.md`，追加在现有 `amendments` 之后。`old` 取改前、且在拼接正文里只出现一次的原句；`new` 取上面要写入的句子。检查器把替换作用在基线 `f8d5d01` 上，再与拆分正文比对。

## 检查

开工时在 `d8113a1e98c41aaf37258c7f3cf00bd6c64d5a59` 上：`node tools/check-docs/check.mjs` 退出码 0，findings 0。`node tools/compare-spec-bytes/compare.mjs` 退出码 0，ARCHITECTURE.md 365491 字节与基线经替换后一致。改完后这两条仍须退出码 0，findings 仍是 0。另跑 `git diff --check` 与 `corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts`。不跑 `pnpm test` 全量，不跑 `pnpm check` 全量。Node 使用 22.23.4。

## 证据链接

- [docs/evidence/177/commands.md](../evidence/177/commands.md)：检查命令、退出码与输出摘要。Draft PR 是 #177。

## 自检

- [x] 影响 arch / prd 吗？影响就在同一个 PR 里更新。本 PR 改了 ARCHITECTURE 的 §3 与 §12.1，没有改 PRD。
