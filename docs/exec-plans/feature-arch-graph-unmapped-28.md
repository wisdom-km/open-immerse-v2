# 执行计划

收 [Issue #28](https://github.com/wisdom-km/open-immerse-v2/issues/28) 里依赖图的 unmapped：包根 `src/index.ts` 只转出时穿透，并让 `--strict` 在 unmapped 大于 0 时失败。基线 `origin/main@9949f5c`（含已合入的 #149，merge `dd5b8e0`）。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/arch-graph-unmapped-28`。第一笔提交只有本文件。

本任务是工具，不是切片，也不同时改 TS 产品代码与 worker。Wisdom 2026-11-04 19:33 已经拍板。本次指示是计划先行，然后在同一条 Draft PR 里做完。不等另一次审查才写实现。

PR 保持 Draft。描述第一行是 `Refs #28`，不写 `Fixes #28`（转必过、分支保护都不在这次）。不离开 Draft，不合入，不 force push，不 rebase（N-01、N-03）。不改 `.github/workflows/**`，不改分支保护（N-02）。

任务类型写「不适用」。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。这里不改 UI，也不改 core。

## 现状理解

- 已有行为：`node tools/check-arch-graph/check.mjs` 在 #149 合入后的 main 上报告 undocumented 0、planned 22、unmapped 1。唯一 unmapped 是 `SEAM → DOM`，示例 `packages/features/jobs/src/index.ts:1`。该文件两行都是转出：`export { parseJobId, sameJobId } from "./domain/job-id.js"` 与 `export type { JobId } from "./domain/job-id.js"`。`layer-of.mjs` 把 `packages/features/*/src/index.ts` 标成 SEAM。`check.mjs` 的 `--strict` 只在 `report.undocumented.length > 0` 时返回 1。CI 的 `node` job 不传 `--strict`，步骤带 `continue-on-error: true`。
- 相关的节：[docs/arch/05-01.md](../arch/05-01.md) §5.1（23 条无标签实线 + 2 条带标签实线 + 2 条虚线，节点里没有 SEAM）；[docs/arch/02-03.md](../arch/02-03.md) 与 [02-04.md](../arch/02-04.md) §2.4（切片公开入口是 `src/index.ts`，UI 到 domain 只经 `src/pure.ts`）；[docs/arch/06.md](../arch/06.md) 与 [13.md](../arch/13.md) 的 G12；[docs/ci-and-environment.md](../ci-and-environment.md)「依赖图对照」；[docs/exec-plans/feature-ci-depgraph-28.md](feature-ci-depgraph-28.md)。DESIGN 与 [docs/design-principles.md](../design-principles.md) 本任务用不到界面，不改（N-10）。
- 还没做的部分：穿透、非转出语句报错、`--strict` 计入 unmapped、`docs/ci-and-environment.md` 这三句。不改 ARCH 分层，不加 §5.1 节点。

另外四个切片的包根是 `export {}`：`budget`、`formula-source`、`ingest`、`markdown`。仓库里没有产品代码 import `@oi/feature-*` 或这些 `index.ts`。unmapped 只来自 `jobs` 那条转出边，不是来自导入方。

不改 `packages/**`、`apps/**`、`workers/**`、`.github/workflows/**`、`docs/arch/**`、`docs/prd/**`、`docs/approvals.md`、`docs/backlog.md`、`docs/spec-changelog.md`、PR 模板、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`、`dependency-cruiser.config.mjs`、根 `package.json`、`pnpm-lock.yaml`。不加依赖。

## 做法

新模块 `tools/check-arch-graph/passthrough.mjs`。`check.mjs` 只改 `--strict` 的失败条件。`layer-of.mjs` 与 `parse-mermaid.mjs` 不改：`src/index.ts` 仍是 SEAM，`src/pure.ts` 仍是 DOM，测试与 e2e 仍排除，仍不扫 `tools/`，C→K 仍只认 type-only。

穿透只用于 `packages/features/<切片>/src/index.ts`（`layer-of` 标 SEAM 的那个文件）。`packages/contracts`、`kernel` 等包的 `src/index.ts` 仍是该包那一层，不穿透。否则 `@oi/contracts` 会从「到 C」变成「到 contracts 内部文件」，§5.1 的 C 节点就空了。

判定（读源码，不另引入解析器）：

- 允许：`export … from`、`export * from`、`export * as 名字 from`、`export type … from`、`export type * from`，以及空的 `export {}` / `export type {}`。注释和空行忽略。
- 不允许：先 `import` 再 `export`、值或类型声明、表达式、副作用 import。第一条不合格语句的行号记入 `arch-index`。
- 只含允许语句的文件是穿透：这个文件作为 cruise 源模块时不产生边。别的文件 import 它时，边的两端是导入方所在层和转出最终目标所在层（转出链上再遇到穿透 index 就继续跟）。最终文件是 `src/pure.ts` 时 `viaPure` 仍为真；最终文件是 `domain/**` 时为假。所以 UI 经 index 转到 domain 内部，仍是 undocumented，原因 `bypasses-pure`。
- 空的 `export {}` 没有目标，不产生边，也不报 `arch-index`。四个现有切片就是这种文件。本 PR 不能改 `packages/**`。若把 `export {}` 当成失败，main 上 `--strict` 无法在 unmapped 已是 0 时退出 0。`export {}` 没有声明绑定，也不是 import 后再导出。

含不允许语句的 index 不穿透。它自己的出边仍按 SEAM 记 unmapped，另外报 `arch-index`，带 `文件:行` 和一行「修复：」。修复行的锚点写 `docs/ci-and-environment.md#依赖图对照`，不写 §5.1：这条规则不在 ARCH 里，本 PR 也不改 `docs/arch/**`。

报告多一行计数：

```text
arch-graph: undocumented <n>
arch-graph: planned <n>
arch-graph: unmapped <n>
arch-graph: index <n>
arch-index	<文件:行>
修复：包根 src/index.ts 只允许转出语句。……锚点：docs/ci-and-environment.md#依赖图对照
```

默认退出码仍是 0。`--strict` 在 undocumented、unmapped、index 任一大于 0 时退出码 1，三者都是 0 时退出码 0。planned 只提示。index 与 undocumented 同级：都进报告，都只在 `--strict` 下让进程失败。CI 步骤不改，仍然不传 `--strict`。

`compare.test.ts` 第 40–43 行与第 70 行现在写死 `SEAM → DOM`、`packages/features/jobs/src/index.ts:1`。那条边穿透后不再是 unmapped 样例。改成仍会 unmapped 的路径（对不上层的 `packages/features/*/src/*.ts`，两端不是纯转出 index）。`reduce.test.ts` 里「seam re-export」那条期望改成：纯转出不产生 unmapped。`layer-of.test.ts` 里 index 仍是 seam，不动。

预期在 main 工作区上：undocumented 0、unmapped 0、index 0。planned 仍是 22，因为没有产品代码 import 这些 index；若跑出来不是 22，在 PR 描述里写明多出来或少掉的是哪一条。

## 来源核对

`/workspace/oi-v2/pr149-review/REVIEW.md` 不在这台机器上。已读 GitHub 上同一份审查正文：[pull/149#issuecomment-6628852731](https://github.com/wisdom-km/open-immerse-v2/pull/149#issuecomment-6628852731)。该评论正文第 43 行是 nit 2，第 51 行是 Q2，与交接写的行号一致。没有编造文件里没有的句子。

| # | 来源 | 回应 |
| --- | --- | --- |
| 1 | [issues/28#issuecomment-6629523507](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629523507)（19:33 批准） | 做目标 1–4。原话「那就按你的推荐吧。选第一个吧」以及「然后大家的，你该提issue该提issue该改那个文档就改文档。」范围是现在就开本分支：穿透、非转出报错、`--strict` 计入 unmapped、规则写入文档。不改 CI，不改 `packages/contracts`，不碰 `approvals.md` / `backlog.md`。与 #67 契约 PR、文档 PR 并行。批准记在该评论。本 PR 不改 `docs/approvals.md`（交接禁止，另一个 PR 正在改它） |
| 2 | [issues/28#issuecomment-6629072036](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629072036)（19:06） | 19:06 把 unmapped=0 和 `--strict` 与「转必过」放在同一步。19:33 把前半改成现在就做，并且不改 CI。本 PR 不把 `node` job 改成必过，不传 `--strict`，不改 `continue-on-error`，不改分支保护 |
| 3 | [issues/28#issuecomment-6629044497](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629044497)（路径映射风险） | 在 `docs/ci-and-environment.md` 写明：unmapped 是有一端落不进 §5.1 节点（路径对不上 `layer-of.mjs`，或一端仍是 SEAM）。对不上的文件不会静默丢掉。穿透不改变路径映射。`--strict` 在 unmapped 大于 0 时失败，用来抓住以后改目录却忘了改映射。CI 仍不跑 `--strict`，所以这条还不会拦住合入；拦住合入仍等转必过 |
| 4 | REVIEW 第 51 行 Q2（评论 6628852731） | 采用选项二：再导出看成穿过，按导入方的层算边。不把 index 塞进 APP 或 DOM，不加 §5.1 节点。19:33 已批准现在就做，不再「先只报告」 |
| 5 | REVIEW 第 43 行 nit 2 | `--strict` 计入 unmapped。`docs/ci-and-environment.md` 写 unmapped 的含义、穿透规则和 `--strict` 行为，各一两句 |
| 6 | [pull/149#issuecomment-6628872243](https://github.com/wisdom-km/open-immerse-v2/pull/149#issuecomment-6628872243)（18:54） | 其余映射不改：`pure.ts` 仍是 DOM；`index.ts` 在 `layer-of` 里仍是 SEAM；测试、e2e、playwright 仍排除；不扫 `tools/`；C→K 仍用 `dependencyTypes` 核对 type-only。穿透是归约规则，不是改这五条映射 |
| 7 | [docs/exec-plans/feature-ci-depgraph-28.md](feature-ci-depgraph-28.md) | 沿用五个模块、同一份 mermaid 解析、同一套层名、同一启动方式（`launch-depcruise.mjs`）。不另写禁止规则，不改 `check:deps`。输出仍是 undocumented / planned / unmapped，本 PR 只追加 index |
| 8 | [docs/arch/05-01.md](../arch/05-01.md) | 图仍是 23 + 2 + 2。不改该文件。解析测试继续锁定这 27 条。不把交接旧稿里的「24 实线」写进实现 |

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件作为第一笔提交 | 提交 `9ddb528`，只有本文件 | 本文件 |
| 2 | 新增 `passthrough.mjs` 与声明、测试。`reduce.mjs` 用它穿透或报 `arch-index`。`compare.mjs` 把 index 打进报告。`check.mjs` 的 `--strict` 同时看 undocumented、unmapped、index | 提交 `7f21dd3`。`layer-of.mjs` 与 `parse-mermaid.mjs` 未改 | 证据目录的 Vitest 一节 |
| 3 | 更新 `compare.test.ts` 第 40–43、70 行；更新 `reduce.test.ts` 的纯转出期望。补三条：纯转出穿透成功；含逻辑的 index 报 `arch-index`；经 index 的 UI→domain 仍是 undocumented（`bypasses-pure`）。夹具证明 `--strict` 在 unmapped 大于 0 时退出 1，等于 0 时退出 0 | 同上。`compare.test.ts` 的 unmapped 样例改为 `packages/features/jobs/src/notes.ts:4`。夹具与仓库图的 `--strict` 都按预期退出 | 证据目录 |
| 4 | `docs/ci-and-environment.md`「依赖图对照」补 unmapped、穿透、`--strict` 各一两句。不改 CI 工作流 | 三句已写入该节。`.github/workflows/**` 无 diff | `docs/ci-and-environment.md` |
| 5 | 定向：`vitest run tools/check-arch-graph`，以及 `node tools/check-arch-graph/check.mjs` 与 `--strict`。不跑全量 `pnpm check` / `pnpm test`（归 Anvil）。证据 `docs/evidence/<PR号>/commands.md` | 见证据目录。main 工作区：undocumented 0、planned 22、unmapped 0、index 0。两条命令退出码都是 0。planned 没有变化 | `docs/evidence/<PR号>/commands.md` |

交接写「G12 200 行」。规格里的 200 行只在「只改 `packages/contracts`」时触发（[docs/arch/13.md](../arch/13.md) G12；[docs/ci-and-environment.md](../ci-and-environment.md) 门禁）。本 PR 不改 contracts。非生成 diff 超过 600 行才要在提交说明写 `G12:`。单文件硬上限仍是 §6 的 600（测试 800），不调上限（N-08）。新逻辑放 `passthrough.mjs`，不堆进 `check.mjs`。

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话。本 PR 不改 [docs/approvals.md](../approvals.md)；对应批准在 issue 评论，不在该文件里。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 现在就做穿透、非转出报错、`--strict` 计入 unmapped，并写入文档 | 原话：「那就按你的推荐吧。选第一个吧，然后它并不影响并行是吧？那你就开吧。」以及「然后大家的，你该提issue该提issue该改那个文档就改文档。」范围见评论正文四条。不改 CI，不改 contracts，不碰 approvals / backlog | 2026-11-04 19:33 | Wisdom，[评论 6629523507](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629523507) |
| 不把检查转成必过 | 19:06 原话是把 unmapped=0 与 `--strict`「和转必过放在同一步」。19:33 改为现在做前半，并写明不改 CI。本 PR 不改工作流 | 2026-11-04 19:33 | Wisdom，同上；时间安排取代 [评论 6629072036](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6629072036) |
| 穿透采用审查 Q2 选项二，映射 Q1–Q5 不改 | 18:54 原话「按推荐」。Q2 的选项二是穿过。19:33 选定现在实施穿过，而不是 ARCH amendment | 2026-11-04 18:54 与 19:33 | Wisdom，[评论 6628872243](https://github.com/wisdom-km/open-immerse-v2/pull/149#issuecomment-6628872243) 与 6629523507 |
| 空的 `export {}` 视为没有目标的穿透，不报错 | 四个切片已经是这种文件。不允许改 `packages/**`。把它报错会让 main 上的 `--strict` 在 unmapped 已是 0 时仍失败。它没有绑定，也不是「import 后再导出」 | 2026-11-04 | 本计划的实现决定，不是新的业主范围 |
| 默认退出码保持 0；index 与 undocumented 一样只在 `--strict` 下失败 | 与现有报告模式同级。CI 不传 `--strict`。若默认就因 index 退出 1，等于改了 CI 步骤的结果，而交接禁止改 CI | 2026-11-04 | 本计划的实现决定，对齐 19:33「不改 CI」 |

## 证据链接

- `docs/evidence/<PR号>/commands.md`：Draft PR 开出后按 PR 号补上。本段先不链到还不存在的路径。

## 自检

- [x] 影响 arch / prd 吗？不影响。不改 `docs/arch/**` 与 `docs/prd/**`。穿透不新增 §5.1 节点。句子写在 `docs/ci-and-environment.md`。不改 `docs/spec-changelog.md`（交接禁止）。
