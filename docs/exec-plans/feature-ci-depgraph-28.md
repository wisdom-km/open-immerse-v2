# 执行计划

收 [Issue #28](https://github.com/wisdom-km/open-immerse-v2/issues/28) 的第 3 项：把 dependency-cruiser 的 import 图归约成 [ARCH §5.1](../arch/05-01.md#51-层间依赖图) 的层，只报告漂移。基线 `origin/main@6988420`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/ci-depgraph-28`。第一笔提交只有本文件。

本任务是工具和 CI，不是切片，也不同时改 TS 产品代码与 worker。Wisdom 2026-11-04 18:33 已经拍板接入方式。本次指示是计划先行，然后在同一条 Draft PR 里做完。不等另一次审查才写实现。

PR 保持 Draft。描述第一行是 `Refs #28`，不写 `Fixes #28`（report-only 转必需、分支保护、PR1 的 4 个 nit 都还在）。不离开 Draft，不合入，不 force push（N-01、N-03）。不改分支保护（N-02）。

任务类型写「不适用」。UI–core 交接说明写「不适用」（[RULES.md](../../RULES.md) §9）。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。这里不改 UI，也不改 core。

## 现状理解

- 已有行为：`dependency-cruiser` 17.4.3 已在 devDependencies（`package.json` 与 `pnpm-lock.yaml` 已锁）。`pnpm run check:deps` 走 `tools/check-deps/check.mjs` → `launch-depcruise.mjs`，规则由 `build-rules.mjs` 生成，含 G5 `contracts-is-leaf`、`contracts-kernel-type-only`、G13、G15 与 [§4.3](../arch/04-03.md#43-切片之间的依赖允许的方向) 切片矩阵。它在 `pnpm run check` 里是必需检查，并在 `ci.yml` 的 windows 矩阵里单跑。这是禁止规则。没有把实际 import 图归约成 [§5.1](../arch/05-01.md#51-层间依赖图) 层节点再对照的报告。
- 相关的节：[docs/arch/05-01.md](../arch/05-01.md) §5.1；[docs/arch/04-03.md](../arch/04-03.md) §4.3（切片矩阵，本 PR 不改、不另写一套）；[docs/arch/06.md](../arch/06.md) §6 行数；[docs/arch/13.md](../arch/13.md) G5、G12、G13、G15；[RULES.md](../../RULES.md) §1.5、§2、§3、§9、N-01、N-02、N-10、N-21；[docs/ci-and-environment.md](../ci-and-environment.md)；[docs/approvals.md](../approvals.md)；[docs/backlog.md](../backlog.md)。DESIGN 与设计原则本任务用不到界面，不改（N-10）。
- 还没做的部分：只报告的 §5.1 对照、`node` job 里 Check 之后的 `continue-on-error` 步骤、backlog 第 109 行、approvals 里 #28 的 16:57 / 17:28 / 18:28 / 18:33。

基线 `origin/main@6988420`。不改 `packages/`、`apps/`、`workers/`、`docs/arch/**`、`docs/prd/**`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`dependency-cruiser.config.mjs`、`tools/check-deps/build-rules.mjs`、`tools/check-deps/feature-edges.mjs`、根 `package.json`、`pnpm-lock.yaml`。不碰 `docs/exec-plans/feature-preload-codegen-67.md`。不加依赖。不 force push。不改分支保护。

## §5.1 全部边

来源是 [docs/arch/05-01.md](../arch/05-01.md) 第一个 mermaid 块（第 24–50 行）。文件里子串 `-->` 共 27 处：2 处在文首 split-header 注释（`<!-- oi-split-header -->` 与结束标记），25 处是 mermaid 实线。两条虚线写的是 `.->`，子串 `-->` 数不到它们。交接写的「实线 24 + 带标签 2 + 虚线 2」多算了 1。逐条是 27 条：无标签实线 23、带标签实线 2、带标签虚线 2。测试锁定这 27 条。

| # | 种类 | 从 | 到 | 标签 |
| --- | --- | --- | --- | --- |
| 1 | 实线 | UI | UK | |
| 2 | 实线 | UI | DOM | 只经 src/pure.ts |
| 3 | 实线 | UI | C | |
| 4 | 实线 | PRE | C | |
| 5 | 实线 | MAIN | ADP | |
| 6 | 实线 | MAIN | APP | |
| 7 | 实线 | MAIN | PN | |
| 8 | 实线 | MAIN | PV | |
| 9 | 实线 | ADP | APP | |
| 10 | 实线 | ADP | DOM | |
| 11 | 实线 | ADP | PN | |
| 12 | 实线 | ADP | WC | |
| 13 | 实线 | ADP | PV | |
| 14 | 实线 | APP | DOM | |
| 15 | 实线 | APP | C | |
| 16 | 实线 | DOM | C | |
| 17 | 实线 | DOM | K | |
| 18 | 实线 | APP | K | |
| 19 | 实线 | PN | K | |
| 20 | 实线 | PN | C | |
| 21 | 实线 | WC | C | |
| 22 | 实线 | PV | PN | |
| 23 | 实线 | PV | C | |
| 24 | 实线 | PV | K | |
| 25 | 虚线 | ADP | PY | HTTP（oi-parse/1） |
| 26 | 虚线 | PY | C | 生成的协议模型 |
| 27 | 实线 | C | K | 仅 type-only |

节点 13 个：UI、PRE、MAIN、ADP、APP、DOM、PN、WC、PV、UK、C、K、PY。

## 节点映射（建议，待 Wisdom 确认）

本 PR 按下面这张表实现。Wisdom 若否决某一行，只改 `tools/check-arch-graph/layer-of.mjs`，不改 §5.1，不改产品代码。

| 节点 | 路径或包名 |
| --- | --- |
| UI | `packages/features/*/src/ui/**`、`apps/desktop/src/renderer/**` |
| PRE | `apps/desktop/src/preload/**` |
| MAIN | `apps/desktop/src/main/**` |
| ADP | `packages/features/*/src/adapters/**` |
| APP | `packages/features/*/src/application/**` |
| DOM | `packages/features/*/src/domain/**`，以及 `packages/features/*/src/pure.ts` |
| PN | `packages/platform-node/**`、`@oi/platform-node` |
| WC | `packages/worker-client/**`、`@oi/worker-client`（目录现在没有，[04-01.md](../arch/04-01.md) 标计划中） |
| PV | `packages/providers/**`、`@oi/providers` |
| UK | `packages/ui-kit/**`、`@oi/ui-kit`（目录现在没有） |
| C | `packages/contracts/**`、`@oi/contracts` |
| K | `packages/kernel/**`、`@oi/kernel` |
| PY | `workers/parser/**`。depcruise 只扫 `packages` 与 `apps`，这条只出现在图上 |
| SEAM | `packages/features/*/src/index.ts`、包名 `@oi/feature-*`。不是 §5.1 的节点 |

`src/pure.ts` 归到 DOM：§5.1 的 UI→DOM 写明只经这个文件。UI import `src/pure.ts` 记成 UI→DOM，并带 `via=src/pure.ts`。UI 直接 import `src/domain/**` 不算这条带标签的边，输出 `bypasses-pure`。`pure.ts` 自己 import domain 是 DOM→DOM，自环丢掉。

建议里待确认的边界：

1. `src/index.ts` 不归进 APP / ADP / DOM。它是 [§2.4](../arch/02-04.md#24-seam-的形状规则) 的 seam 桶。进、出它的边输出 `arch-edge-unmapped`，不算 undocumented，也不失败。另一方案是把它当成 APP，那时 `jobs` 的 re-export 会变成已画出的 APP→DOM。本 PR 不采用，避免 seam 以后再导出 adapters 时被误报成 APP→ADP。
2. 测试文件不进图：路径含 `/test/`、`/tests/`、`/__tests__/`，或文件名 `*.test.*` / `*.spec.*`。
3. `apps/desktop/e2e/**` 与 `playwright.config.ts` 同样排除。它们是测试装置，不是 §5.1 的层。
4. `tools/**` 不进 cruise 根。与现有 `check:deps` 一样，只扫 `packages` 与 `apps`。
5. 同层自环、Node 内置、npm 包丢掉。保留 `local` / `aliased` / `aliased-tsconfig` / `aliased-tsconfig-paths`，含 type-only。
6. `C → K` 用 depcruise 的 `dependencyTypes` 含 `type-only` 来核对。边上每一条都是 type-only 才算画出的那条。出现值导入则记 `value-import`，并且图上那条 type-only 边仍算 planned。现有 `check:deps` 的禁止规则不改。
7. 图上有、代码里没有的边（含两条虚线，以及 WC、UK 还没建包）输出 `arch-edge-planned`，只提示，不失败。
8. 代码里有、图上没有的边输出 `arch-edge-undocumented`，带一个示例 `文件:行`、一行「修复：」和锚点 `docs/arch/05-01.md#51-层间依赖图`。默认退出码 0。`--strict` 时 undocumented 大于 0 才退出码 1。planned 与 unmapped 在 `--strict` 下也不失败。

## 预跑（main@6988420，实现前）

命令：用现有 `launch-depcruise.mjs`，`--config dependency-cruiser.config.mjs --output-type json packages apps`。退出码 0。109 个模块。按上面的映射归约（测试与 e2e 源模块 47 个已排除）。

对得上图的 5 条：

| 边 | 示例 | 备注 |
| --- | --- | --- |
| C → K | `packages/contracts/src/diag-events.ts:1` | 全部 type-only，含 `result.ts` 的 `export type` |
| DOM → C | `packages/features/jobs/src/domain/job-id.ts:1` | |
| MAIN → PN | `apps/desktop/src/main/composition-root.ts:3` | |
| PN → C | `packages/platform-node/src/logging/file-logger.ts:4` | 边上不都是 type-only。该行本身是 `import type`。实现里示例改取一条值导入 |
| PN → K | `packages/platform-node/src/logging/debug-retention.ts:4` | 值导入 |

`arch-edge-undocumented`：0。按 Wisdom 18:33，即便大于 0 也不改产品代码、不改 05-01.md，只列在 PR 里。这次没有要修的边。

`arch-edge-planned`：22。就是上表 27 条里除掉这 5 条。含 UI→UK、ADP→WC、WC→C（包还没建），以及两条虚线 ADP→PY、PY→C。

`arch-edge-unmapped`：1。`SEAM → DOM`，`packages/features/jobs/src/index.ts:1`（`export { parseJobId, sameJobId } from "./domain/job-id.js"`，另有一行 `export type`）。这是映射问题，不是「图上没画的层间边」。本 PR 不改 `jobs` 的代码。

## 来源核对

检索了 Issue #28 正文和全部评论、`docs/approvals.md`、`docs/backlog.md`，以及仓库内 `#28`、`depcruise`、`dependency-cruiser`、`依赖图`、`05-01`。`/workspace/oi-v2/openai-review*/REPORT.md` 与其他 `*/REPORT.md` 不在本仓库，本机也没有这些文件。下表对报告的回应只依据交接转述，不编造报告原文。

| # | 来源 | 回应 |
| --- | --- | --- |
| 1 | Issue #28 正文：先 report-only，稳定约两周后转必需 | 本 PR 默认退出码 0。CI 步骤 `continue-on-error: true`。不改分支保护，不把这一步写成必需检查（N-02） |
| 2 | [评论 6625527114](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527114) | 第 3 项原文是「从 dependency-cruiser 生成依赖图，再与 ARCH §5 对比：放在最后做。〔CI 改动〕」。本 PR 只做这一项 |
| 3 | [评论 6625527767](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625527767)；[approvals.md](../approvals.md) 15:44 | 原话「按推荐」。批准 5 项改进。第 3 项因此获批。第 1、2 项已由 #146 合入，本 PR 不做 |
| 4 | [评论 6626806548](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6626806548) | 16:57 原话「按你的建议执行。」PR2 是第 3 项，PR1 合入后开。approvals 里同一分钟的行是 #24（评论 6626807241），不是这一条。本 PR 补上 #28 这一行 |
| 5 | [评论 6628453240](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6628453240) | #146 已合入 main@6988420。剩下 PR2、分支保护（Wisdom 本人）、4 个 nit。本 PR 不处理那 4 个 nit，不改分支保护 |
| 6 | [评论 6623400438](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6623400438)；approvals 13:28 | 「#28 不开分支」已被 15:44 取代。本 PR 开 `feature/ci-depgraph-28` |
| 7 | 评论 6625727777、6626639131、6626694079 | 文档同步 PR、每日 09:00 只读日检、#143 进度。不在本 PR |
| 8 | [backlog.md](../backlog.md) 第 109 行 | 写明依赖图对照仍是第 3 项。做完后改成：报告已接上，只报告，约两周后由 Wisdom 决定是否必过 |
| 9 | backlog 第 103 行（#106 / #99 / #108） | 缺 bin 的单测、macOS 不跑 `check:deps`。不在本 PR，不改 `launch-depcruise.mjs` 的行为，不加那条用例 |
| 10 | backlog 第 187 行 E-P1-6 | dependency-cruiser 与 `tsconfig.core.json` 已处理。复用根上的 `dependency-cruiser.config.mjs` 与 `tools/check-deps/tsconfig.paths.json`，两个文件都不改 |
| 11 | openai-review/REPORT.md 第 42–43 行（文件不在仓库） | 交接转述：报错要带「修复：」和文档锚点。undocumented 每条下面加一行修复，锚点指 §5.1。不把文案再写进 `gate-remediation/catalog.json`：这一步还不是门禁编号 |
| 12 | pr55-review/REPORT.md 第 55、75、82 行（文件不在仓库） | 交接转述：contracts 叶子、type-only、`tsconfig.paths.json` 只被 depcruise 配置引用。本 PR 用 `dependencyTypes` 核对 C→K 的 type-only，不改那份 paths 文件，不放宽叶子规则 |
| 13 | readiness、research-review、pr21-review 的 REPORT.md（文件不在仓库） | 交接转述：只提到 dependency-cruiser 已建或 #28 属 M1，没有新要求。本 PR 不另加范围 |
| 14 | RULES.md 第 86 行、第 131 行、N-21、§1.5 | 根 `package.json` 与 depcruise 配置是热点。本 PR 不动这两处。不绕过边界规则。没有新依赖，§1.5 的许可证审核不触发。dependency-cruiser 已在锁文件，许可证是 MIT |

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件作为第一笔提交 | 提交 `696c8ef`，只有本文件 | 本文件 |
| 2 | `tools/check-arch-graph/`：`parse-mermaid.mjs`、`layer-of.mjs`、`reduce.mjs`、`compare.mjs`、`check.mjs`，各带 `*.test.ts`。启动复用 `../check-deps/launch-depcruise.mjs`。不放进 `tools/check-deps/`，避免和已经进 `pnpm run check` 的入口混在一起 | 五个模块、声明文件和测试都在 `tools/check-arch-graph/`。提交 `d5d386a` | 证据目录的 Vitest 一节 |
| 3 | 不改 `package.json`。CI 在 `node` job 的 Check 之后加一步 `node tools/check-arch-graph/check.mjs`，`continue-on-error: true`。不加入 `check` 脚本 | `.github/workflows/ci.yml` 的 `node` job 在 Check 与 Unit tests 之间加了 `Arch graph` | 工作流文件 |
| 4 | 更新 `docs/ci-and-environment.md`、`docs/backlog.md` 第 109 行、`docs/approvals.md` 四行、`docs/spec-changelog.md` 一行。证据 `docs/evidence/<PR号>/commands.md` | ci-and-environment 加了「依赖图对照」。backlog 第 109 行改成已接上、只报告。approvals 补 16:57（#28）、17:28、18:28、18:33，批准数 61。changelog 与证据在 PR 号出来后写入 | 证据目录 |
| 5 | 定向检查：本工具、`tools/check-deps` 的 Vitest、eslint、`check:deps`、`check-file-size`、`compare-spec-bytes`、`check-docs`。不反复跑全量 | 见证据目录。不跑全量 `pnpm check` / `pnpm test`，留给 CI 这个 tip 的一次 | 证据目录 |

实现时 `node tools/check-arch-graph/check.mjs` 在 main 工作区上的输出：undocumented 0，planned 22，unmapped 1（`SEAM → DOM`，`packages/features/jobs/src/index.ts:1`）。与预跑计数一致。没有要改的产品代码。

工具放在 `tools/check-arch-graph/` 而不是 `tools/check-deps/arch-graph/`：这一项是反向对照，不是禁止规则。`docs/arch/03.md` 的 tools 树本 PR 不改（改 arch 要 amendment）。新目录暂时不在那棵树上，留给下一个改 §3 的文档 PR。check-docs 只要求树上列出的路径存在，不要求每个现有目录都上树。

输出行：

```text
arch-graph: undocumented <n>
arch-graph: planned <n>
arch-graph: unmapped <n>
arch-edge-undocumented	<FROM>	<TO>	<文件:行>
修复：……锚点：docs/arch/05-01.md#51-层间依赖图
arch-edge-planned	<FROM>	<TO>
arch-edge-unmapped	<FROM>	<TO>	<文件:行>
```

非生成 diff 若超过 600 行，提交说明写一行 `G12:`：对照工具按一个职责一个文件拆开，再加计划和测试，拆成多个 PR 会留下不能单独运行的半套。不调行数上限（N-08）。

## 决策记录（Decision Log）

只记会影响后续的决定。Wisdom 的决定写原话，并链到 [docs/approvals.md](../approvals.md) 对应行。Forge 的排序标「Forge 排序，非业主决定」。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 可以改 `.github/workflows/ci.yml` | 原话「按推荐吧」。范围第 1 条写明可以改这个文件。实现提交把这句话写入 approvals | 2026-11-04 18:33 | Wisdom，[评论 6628516445](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6628516445) |
| Check 后面加一步，`continue-on-error: true`，只报告，不进 `check` 脚本 | 同一条范围第 2 条。约两周后由 Wisdom 决定是否改成必过 | 2026-11-04 18:33 | Wisdom，同上 |
| 首跑「代码有、图上没有」的边本 PR 不修，只列给 Wisdom | 同一条范围第 3 条。预跑这条数是 0 | 2026-11-04 18:33 | Wisdom，同上 |
| 不改 `package.json` / `pnpm-lock.yaml`，不加依赖 | 同一条评论，以及本次任务说明。覆盖交接里「package.json 加一行 script」的建议。CI 直接调用 `node tools/check-arch-graph/check.mjs` | 2026-11-04 18:33 | Wisdom，同上 |
| 映射边界按本文件「节点映射」实现，等 Wisdom 确认 | 交接 W4 要求计划里给推荐。本次任务第 4 点是「在计划里提出映射边界，请 Wisdom 确认」，不是已经点头。未确认前不把它写成批准 | 2026-11-04 | 本计划的建议，待 Wisdom 确认 |
| 16:57 拆两 PR、17:28 三个 fixtures、18:28 合入 #146 补进 approvals | RULES §2：计划引用的批准必须在 approvals.md 有行。18:33 评论写「待补进下一个文档 PR」 | 2026-11-04 | Wisdom 的原话已在各评论；记入 approvals 是本 PR |

## 证据链接

- `docs/evidence/<PR号>/`：实现提交之后补 `commands.md`。

## 自检

- [x] 影响 arch / prd 吗？影响就在同一个 PR 里更新。本 PR 不改 `docs/arch/**` 与 `docs/prd/**`。CI 与 backlog 的句子在 `docs/ci-and-environment.md`、`docs/backlog.md`、`docs/spec-changelog.md` 更新。
