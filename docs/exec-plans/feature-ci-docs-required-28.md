# 执行计划

收 [Issue #28](https://github.com/wisdom-km/open-immerse-v2/issues/28) 的第 1、2 项。基线 `origin/main@f9b34e8f60497a6c6c8bd59e7e9ff17ec01fec8f`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/ci-docs-required-28`。第一笔提交只有本文件。

PR 保持 Draft。描述第一行是 `Refs #28`，不写 Fixes（第 3 项还没做）。不离开 Draft，不合入，不 force push（N-01、N-03）。不改分支保护，不改仓库设置（N-02）。

本任务不是 UI 改动、seam 变更、core 改动。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。不改 `packages/`、`apps/`、`workers/`。不加依赖。不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `tools/compare-spec-bytes/`（含 `compare.mjs` 与 `manifest.json`）。不改 `PRD.md`、`ARCHITECTURE.md`、`RULES.md` 与 `docs/prd/**`、`docs/arch/**`。

## 现状理解

- 已有行为：`.github/workflows/ci.yml` 的 job `docs-report` 在第 283–297 行。第 286 行是 `continue-on-error: true`。第 297 行运行 `node tools/check-docs/check.mjs`。`tools/check-docs/check.mjs` 的 `run` 只写报告，进程退出码是 0。报告首行是 `check-docs: report-only`。状态行正则在 `tools/check-docs/status.mjs`：`/^(?:>\s*)?状态：|^日期：.+。状态：/`。索引表要同时有「路径」列和「状态」列；没有这张表时发一条 `index-table-missing`，不再给每个文件发 `not-in-index`。状态词只在有索引表时核对，允许 `现行`、`报告`、`历史草案`、`生成`。`docs/evidence/**` 与 `docs/exec-plans/**` 不查状态行。在 `f9b34e8` 上跑检查器：links 0、anchors 0、status 9、verbatim 0、findings 9、退出码 0。9 条是 1 条 `index-table-missing`（`docs/README.md`）和 8 条 `status-line-missing`：`docs/README.md`、`docs/WORKFLOW.md`、`docs/architecture/inputs/pdf_translation_architecture.md`、`docs/ci-and-environment.md`、`docs/design/md-reader.md`、`docs/gate-remediation.md`、`docs/incidents/TEMPLATE.md`、`docs/reviews/2026-10-30-architecture-review.md`。`docs/arch/03.md` 的目录树在 #143 已与代码对齐过一版；未建目录多数标了「计划中」。`tools/check-docs/verbatim.json` 的 `pairs` 为空。`docs/ci-and-environment.md` 还没有 `docs-report` 这一句。`docs/backlog.md` 没有 #28 转必需的行。开放 PR 只有 #145（`feature/rules-ui-acceptance-24`），它在改 `docs/approvals.md`、`RULES.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`docs/spec-changelog.md`。本分支不碰这些文件。
- 相关的节：[Issue #28](https://github.com/wisdom-km/open-immerse-v2/issues/28)；[Issue #25](https://github.com/wisdom-km/open-immerse-v2/issues/25)（`docs/README.md` 总索引，M2）。[RULES.md](../../RULES.md) §2、§6 N-02 与 N-10、§7、§9。[ARCHITECTURE.md](../../ARCHITECTURE.md) §3（[docs/arch/03.md](../arch/03.md)）、§6、§13（[docs/arch/13.md](../arch/13.md)）、§15（[docs/arch/15.md](../arch/15.md)）。[PRD.md](../../PRD.md) 是索引，本任务对不上 US / AC，描述里写「无」。[DESIGN.md](../../DESIGN.md) 文首与 §0–§6、[docs/design-principles.md](../design-principles.md) 只读，不改（N-10）。[docs/ci-and-environment.md](../ci-and-environment.md)「门禁」「GitHub Actions」。[docs/WORKFLOW.md](../WORKFLOW.md)。检查器在 `tools/check-docs/`。
- 还没做的部分：目录树路径检查、状态行、两处已批豁免、以及「发现数大于 0 就失败」。最后这一步被下面的基线挡住，见决策记录。

## 不改的文件

不改 `package.json`、`pnpm-lock.yaml`。不把检查写进 `pnpm check` 或 `tools/gate-remediation/catalog.json`。不新增 G 编号。不改 `docs/arch/03.md`：它在 `tools/compare-spec-bytes/manifest.json` 里，改正文会让字节比对失败，而本交接禁止改 manifest。不新建 `fixtures/providers/`、`fixtures/parsing-rules/`、`fixtures/corpus/`。`docs/ci-and-environment.md` 写明 `fixtures/parsing-rules/` 还不在仓库里，目录一出现而健康检查没有跑它，该步失败。不改 `ci.yml` 第 286 行以外的任何内容。本计划测量之后，第 286 行也不删，理由在决策记录。不改 `docs/approvals.md`（#145 正在改）。16:57 的批准以评论为准，链在决策记录里。

## 目录树检查

新文件 `tools/check-docs/tree-paths.mjs`。`check.mjs` 在文件列表含 `docs/arch/03.md` 时调用它，根目录是 `--root` 或当前工作目录。

- 取该文件里第一个含 `├` 或 `└` 的围栏代码块。没有这样的块：一条 `tree-path-missing`，detail 写「没有目录树代码块」。
- 根行 `open-immerse-v2/` 没有分支符，不当成仓库内路径。分支符是 `├─ ` 或 `└─ `（U+251C / U+2514、U+2500、空格）。它前面的前缀长度必须是 3 的倍数，深度 = 前缀长度 / 3 + 1。父路径用栈还原。
- `#` 之后是注释。注释含「计划中」时，这一行的每个名字都不查存在。
- `#` 之前用两个及以上空格拆开的多个名字逐个检查。例如 `library/  document/`。
- 名字接到父路径上。仓库内没有这个路径，就报告 `tree-path-missing	docs/arch/03.md	<路径>`。
- 报告增加一行 `tree:` 计数。这个 kind 计入 `findings`。

测试在 `tools/check-docs/tree-paths.test.ts`，夹具覆盖存在、计划中、缺失。不断言把当前仓库的发现数焊进通过条件。

### f9b34e8 上的测量

开工前用同样的规则对 `docs/arch/03.md` 试算（还没有把检查器提交进仓库）。存在 53，注释含「计划中」因而跳过 16，缺失 3：

1. `fixtures/providers/`
2. `fixtures/parsing-rules/`
3. `fixtures/corpus/`

这三行的注释没有「计划中」。`fixtures/protocol/` 存在，不报。发现数不是 0。按交接：记下来，停下，不改 `03.md`。因此本 PR 不把 `check.mjs` 改成发现数大于 0 就退出 1，也不删 `continue-on-error`。检查器仍然会把这 3 条打进只报告的输出，让漂移看得见。

## 状态行与两处豁免

Wisdom 2026-11-04 16:57 原话「按你的建议执行。」范围见 [评论 6626806548](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6626806548)。

- W1：`inStatusScope` 再排除 `docs/design/`。依据 [RULES.md](../../RULES.md) N-10。不改 `docs/design/md-reader.md`。夹具放一个没有状态行的 `docs/design/*.md`，确认不报。
- W2：不再发出 `index-table-missing`。`docs/README.md` 不补「路径 / 状态」索引表，不关闭 #25。有索引表时，缺行与状态不一致仍按现有规则报。夹具测试改成：没有这张表时不出现 `index-table-missing`。
- 其余 7 个文件在前 40 行补一行状态。用词沿用交接：`现行`、`报告`、`历史草案`、`模板`。对应关系：`docs/README.md`、`docs/WORKFLOW.md`、`docs/ci-and-environment.md`、`docs/gate-remediation.md` 用 `状态：现行`；`docs/architecture/inputs/pdf_translation_architecture.md` 用 `状态：历史草案`；`docs/reviews/2026-10-30-architecture-review.md` 用 `状态：报告`；`docs/incidents/TEMPLATE.md` 用 `状态：模板`。没有索引表时，检查器不核这四个词，`模板` 不在 `现行 / 报告 / 历史草案 / 生成` 里，留给 #25 建表时再对词。

`docs/ci-and-environment.md` 补上 `docs-report`：仍是 `continue-on-error: true`，因为目录树还有 3 条缺失；发现数大于 0 还不失败。分支保护不改。`docs/backlog.md` §4 加一行 #28：状态行与路径检查进了本 PR；必过等这 3 条有批准的改法；索引表是 #25；`docs/design/**` 豁免；必需检查由 Wisdom 在 GitHub 设置里做。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。来源核对逐条回应。第一笔提交只有它 | `60b3a3d` 只有本文件 | 本文件 |
| 2 | `tree-paths.mjs`、测试、接入 `check.mjs` 与 `report.mjs`。对仓库跑一次，核对缺失是不是上面 3 条 | `83602be`。仓库上 tree 为 3，路径与试算相同 | 证据目录 |
| 3 | 缺失不是 0：不改 `03.md`，不建那三个目录，不改退出码，不改 `ci.yml` | `ci.yml` 无改动。`compare.mjs` 退出码 0。临时夹具有 1 条发现时退出码仍是 0 | 证据目录 |
| 4 | W1、W2 与 7 个文件的状态行。更新 `docs/ci-and-environment.md` 与 `docs/backlog.md` | `62950b1`。status 为 0。`docs/design/**` 与索引表按 16:57 豁免 | 证据目录 |
| 5 | 定向命令见下。证据写入 `docs/evidence/<PR号>/commands.md`。Draft PR，正文第一行 `Refs #28` | 命令在 `62950b1` 上再跑一遍后写入证据。Draft PR 第一行 `Refs #28` | 证据目录 |

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 本 PR 只做 #28 的第 1、2 项。第 3 项（依赖图对照 ARCH §5）等本 PR 合入后再开 | 原话「按你的建议执行。」范围写明两 PR 拆分。评论不在 `docs/approvals.md`：#145 正在改那个文件，本 PR 不追加行。来源是评论本身 | 2026-11-04 16:57 | Wisdom，[评论 6626806548](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6626806548) |
| W1：状态检查豁免 `docs/design/**` | 同上。N-10，agent 不改 Loom 的正文 | 2026-11-04 16:57 | Wisdom，同一条评论 |
| W2：本 PR 不报 `index-table-missing`，索引表留给 #25 | 同上。不在本 PR 关闭 #25 | 2026-11-04 16:57 | Wisdom，同一条评论 |
| 不删 `continue-on-error`，默认仍是发现数大于 0 也退出 0 | 交接写：目录树检查在 `f9b34e8` 上发现数不是 0 就停下，不改 `03.md`。试算是 3 条。改 `03.md` 会碰 compare-spec-bytes 的 manifest，交接禁止。建 `fixtures/parsing-rules/` 会让健康检查在「目录出现却没跑它」时失败 | 2026-11-04 | 交接的停下条件。不是新的业主决定 |
| 不把 `CI / docs-report` 设为必需检查 | Issue #28 正文与 N-02。16:57 评论又写了一遍：由 Wisdom 在 GitHub 设置里操作 | 2026-11-04 | Wisdom |

15:44「按推荐」已在 [docs/approvals.md](../approvals.md) 第 61 行，批准的是评论 6625527114 的 5 项改进。本 PR 只用其中第 1、2 项，并且第 1 项的「去掉 continue-on-error」被上面的停下条件挡住。第 4 项已由 #143 写入 PR 模板。第 5 项（AGENTS.md 过期提醒）不在本交接的文件清单里，不做。

## 来源核对

每一行是交接第 6 节的一条。回应写本计划因此怎么做。评论正文于 2026-11-04 用 GitHub API 读过。

| # | 来源 | 本计划怎么回应 |
| --- | --- | --- |
| 1 | [issues/28#issuecomment-6625527114](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527114)（Forge 审计，2026-11-04） | 评论的改进 1：先修 9 条发现，再去掉 `continue-on-error`。改进 2：目录树路径必须存在或标「计划中」。改进 3：依赖图对照 ARCH §5，放在最后。本 PR 只做 1 和 2。改进 3 不开始。改进 1 的「修 9 条」按 W1、W2 缩成：7 个文件补状态行，`docs/design/**` 豁免，索引表留给 #25。去掉 `continue-on-error` 被目录树的 3 条缺失挡住，见决策记录 |
| 2 | [issues/28#issuecomment-6625527767](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527767)；[approvals.md](../approvals.md) 第 61 行（15:44） | 原话「按推荐」。approvals 该行写的是「#28 的 5 项改进 + 下一个 docs PR 修 03.md 4 处不一致」。5 项里本 PR 只取第 1、2 项。03.md 那 4 处已由 #143 合入，本 PR 不再改 03.md |
| 3 | [issues/28#issuecomment-6623400438](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6623400438)；[approvals.md](../approvals.md) 第 44 行（13:28） | 原话「就是其余几项不用开分支了。」该行标【决定，不计入批准】，范围含 #28 不开分支。15:44 的批准在后，本分支按后一条开。不把 13:28 当成还在生效的「不开分支」 |
| 4 | [Issue #28](https://github.com/wisdom-km/open-immerse-v2/issues/28) 正文 | 正文写初期只报告，约两周后由 Wisdom 在 GitHub 设置里改为必需检查，agent 不改分支保护。15:44 已经允许改 CI 行为里写明的那一段（修发现、去掉 `continue-on-error`、加路径检查）。必需检查这一步仍只由 Wisdom 做。本 PR 不调用分支保护 API，不改仓库设置 |
| 5 | [issues/28#issuecomment-6626639131](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6626639131)（16:48） | 原话「1」。范围是 Forge 每天约 09:00 只读对照 docs/arch、docs/prd 与代码，并看 AGENTS.md 是否过时。不改文件、不开 PR。不在本 PR |
| 6 | [RULES.md](../../RULES.md) N-10（第 148 行） | `docs/design/**` 的正文属于 Loom。所以 `md-reader.md` 不补状态行，改成检查器豁免（W1）。`DESIGN.md` 与 `docs/design-principles.md` 同样不改。两份都读过：DESIGN 是视觉与交互规格，文首写明正文由 Loom 维护；原则文件是设计原则，与本检查的状态行、目录树无冲突 |
| 7 | [Issue #25](https://github.com/wisdom-km/open-immerse-v2/issues/25) | 标题是「新增 docs/README.md 文档总索引（文件、状态、维护人）」。完整索引是 M2 的单独事项。本 PR 不建那张表，不写 Fixes #25，用 W2 让 `index-table-missing` 先不报 |
| 8 | `ci.yml` 第 283–297 行；check-docs 的实际输出 | 与交接第 1 节一致：`continue-on-error: true` 在第 286 行，命令在第 297 行，9 条发现如现状理解。另外本计划试算目录树还有 3 条缺失，交接当时写的「发现数为 0」在这条规则下不成立 |
| 9 | Wisdom 2026-11-04 16:52「OK，那请你按照这个项目进度继续开。你看能不能开并行的就开并行的。」 | 本分支是其中一条。并行上限 3 条 `feature/*`，彼此不共用文件。开工时开放的实现 PR 只有 #145，文件无重叠。不碰 #73 的 `packages/contracts/src/diag-events.ts`。不改 `packages/`、`apps/`、`workers/` |

16:57 的评论不在交接那张表里，用户把 W1、W2 定为已批、不必再停。决策记录第一行到第三行按该评论执行。

## 定向命令

工作目录是仓库根。Node 用 `.nvmrc` 的 22.23.4，`corepack pnpm`。

- `node tools/check-docs/check.mjs`：退出码 0。status 为 0。tree 为 3，且只有 `fixtures/providers/`、`fixtures/parsing-rules/`、`fixtures/corpus/`。若 tree 不是这 3 条，停下来写进证据，仍不改 `03.md`。
- 临时夹具（不提交）制造一条别的发现时，退出码仍是 0。这是停下之后的当前行为，不是交接原验收里的「exit 1」。
- `corepack pnpm exec vitest run tools/check-docs/`
- `corepack pnpm exec eslint --max-warnings 0 tools/check-docs/*.mjs tools/check-docs/*.test.ts`
- `node tools/compare-spec-bytes/compare.mjs`：退出码 0，证明没改规格字节。
- 不跑 e2e。不跑全量 `pnpm test` / `pnpm check`（RULES §4：全量每个 tip 只跑一次；本改动用上面的定向命令）。

## 证据链接

- `docs/evidence/<PR号>/commands.md`：上面几条命令的退出码与摘要。PR 号在开 Draft 之后填。
