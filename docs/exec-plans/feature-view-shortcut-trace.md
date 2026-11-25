# 执行计划

视图快捷键的临时诊断。第一笔只有本文件。产品代码、测试和构建不在这一笔。Forge 审查通过之前不写实现。行为边界以 [docs/arch/11.md](../arch/11.md) 为准；文件白名单以本文件为准。两边冲突时，行为以 §11 为准，可改路径以本文件为准。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 现状理解

- 现在已有的行为：Windows 菜单把原文、对照、译文登记成 `Ctrl+1`、`Ctrl+2`、`Ctrl+3`。这三项的 `MenuItem.click` 调用 `gate.click`，不直接 `dispatchMenu`。`gate.click` 在多条已有分支返回 0 时不调用 `ports.dispatch`。阅读屏只听自定义窗口事件，没有 `keydown`。工具栏走 `chooseView`，不经过这个 click。
- 相关的节：[DESIGN.md](../../DESIGN.md) §4.10 的 11.1（2026-11-04 03:21 已批的系统菜单快捷键）、[docs/design-principles.md](../design-principles.md) P4、[ARCHITECTURE.md](../../ARCHITECTURE.md) §11（正文在 [docs/arch/11.md](../arch/11.md)）、[RULES.md](../../RULES.md) §4 调试模式与 §5 第 8 条、[docs/exec-plans/feature-reader-view-modes-e2-174.md](feature-reader-view-modes-e2-174.md) 的 H7。PRD 没有为这三键单列 AC，本计划不改 PRD。
- 还没做的部分：session02 的 stdout 只有 CRLF，stderr 为空，没有 click 或 gate 记录。缺行不能写成没有进入回调。

## 身份与分支

父提交必须是 `75c17c773ef70fef64c63c078f1b4e97aa2b537f`，tree `bde902c43048919aec882414d2f18ab02fa0a47b`。这是 PR #237 的冻结候选，分支 `feature/reader-view-modes-e2-174`。本分支 `feature/view-shortcut-trace` 从该提交拉出。不把提交加到那条分支上，不从缺少这份实现的 `main` 开工。

Draft PR 是 #238。基线是 `feature/reader-view-modes-e2-174`，并叠在 PR #237 上。diff 只应含本分支的诊断增量。PR #237 仍是 Draft。本 PR 也保持 Draft。不 Ready，不合入，不发版。

2026-11-25 12:05 的 [评论 7152527730](https://github.com/wisdom-km/open-immerse-v2/pull/237#issuecomment-7152527730) 只批准静态诊断设计。它不是写代码、测试或构建的许可。实施许可是 12:24 的 [评论 7152823577](https://github.com/wisdom-km/open-immerse-v2/pull/237#issuecomment-7152823577)。本文件先交 Forge 审。审查通过之后，按 12:24 已批范围直接写实现，不再向用户要一次重复批准。

## 目标

在默认关闭的主进程记录里，只对已经写下的成对 `click` 与 `gate` 作判定。缺 `click` 行写成观测不足，不写成没有进入回调。不把结果写成根因已定，也不写成快捷键 PASS。

- 有成对记录且 `result` 为 0：进入了该 click，gate 拒绝。`reason` 是已有分支。
- 有成对记录且 `result` 为 1：两支都不成立，停止，不改分发。
- 没有这对记录，或槽位不能唯一对应到某一步：观测不足。

不改切换逻辑，不绕过 gate，不新增 renderer `keydown`，不把视图项改成直接 `dispatchMenu`。无可见界面变化。快捷键仍只走系统菜单加速键。

## 白名单

本阶段只改下面五份。不改产品代码和测试。

| 阶段 | 路径 | 动作 |
| --- | --- | --- |
| 本阶段 | `docs/exec-plans/feature-view-shortcut-trace.md` | 本文件，第一笔单独提交 |
| 本阶段 | `docs/arch/11.md` | 诊断边界的唯一行为正文 |
| 本阶段 | `tools/compare-spec-bytes/manifest.json` | 为 §11 追加一条唯一替换。字节比对要它，不是产品改动 |
| 本阶段 | `docs/spec-changelog.md` | 记这一笔规格 |
| 本阶段 | `docs/approvals.md` | 记 12:24 原话。12:05 不另计成实施许可 |

实现阶段才允许下面六份。Forge 审查通过之前不创建、不修改。

| 路径 | 动作 |
| --- | --- |
| `apps/desktop/src/main/view-shortcut-trace.ts` | 新文件。只做开关、序号和写入 |
| `apps/desktop/src/main/view-menu-gate.ts` | 在已有返回点调用可选 `trace`。`click()` 仍返回 `Promise<number>` |
| `apps/desktop/src/main/library-wiring.ts` | 安装菜单时读一次开关，接上 click 入口和关闭行 |
| `apps/desktop/test/view-shortcut-trace.test.ts` | 新测试。锁关闭、写入失败和 `armed`/`closed` |
| `apps/desktop/test/view-menu-gate.test.ts` | 只加原因、短路和抛错不改返回值 |
| `apps/desktop/test/view-menu-wiring.test.ts` | 只加视图 click 的顺序，以及非视图项不写 `click` |

实现阶段若真的跑了命令，原始输出只追加到 `docs/evidence/<本 PR 号>/commands.md`。本阶段不建这个文件，因为没有命令。

明确不改：`PRD.md`、`docs/prd/**`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`packages/contracts/**`、`packages/features/**`、`apps/desktop/src/renderer/**`、`apps/desktop/src/preload/**`、core、`shell.tsx`、`library-menu.ts`、CI、锁、依赖清单、`docs/exec-plans/feature-reader-view-modes-e2-174.md`。根 `ARCHITECTURE.md` 只是索引，§11 正文在 `docs/arch/11.md`，不改索引。

上一稿说「四文件」是不准确的。实现是三份 main、两份既有测试加一份新测试，再加本阶段的计划、§11、manifest、changelog 和台账。两处记录不是两处调用，也不是两行改动。

## 记录点

这些点都在实现阶段。本阶段不写。

`view-shortcut-trace.ts` 提供一个对象，没有模块级可变状态。序号、是否已写 `armed`、是否已写 `closed`、写入失败次数都在这个对象上。`installApplicationMenu` 创建它，经 `ViewMenuGatePorts` 的可选 `trace` 传进 gate。测试各自新建对象。开关不在每次 click 时重读。

`library-wiring.ts` 的调用点：

1. `installApplicationMenu` 读一次 `OI_VIEW_SHORTCUT_TRACE`。值恰好是 `1` 才创建对象，否则传 `undefined`。
2. 创建之后调用一次 `arm()`，写出 `step:"armed"`。
3. `viewEntry` 的 click 第一行、`gate.click` 之前，写 `step:"click"` 和槽位。然后仍是 `void gate.click(item.event).catch(...)`。
4. 这个 catch 只在 promise 拒绝时写 `step:"gate"`、`result:0`、`reason:"click-rejected"`。它不替换 gate 已经返回的数字。菜单回调本来就不使用这个数字。
5. `bindViewMenuLifecycle` 之后，若 epoch 存在且开关打开，再 `epoch.subscribe` 一次。通知种类为 `closed` 时调用 `markClosed()`。这个监听不调用 gate，不改变销毁顺序。成功写出一行之后退订。写失败则保持订阅，以便下一次关闭再试。epoch 不存在时不写 `closed`。生产的 `startLibrary` 会传入 epoch。

`view-menu-gate.ts` 的调用点是已有返回，不是新的判断：

- `click`：`destroyed`、`busy`、`pending`（在现有 `await settle` 之后）、`uncommitted`、`event-absent`。
- `replaceShape` 内部把失败细节放在该次调用的局部变量里，随结果交给 `rebuildAndDispatch`。不写到 gate 状态上，也不留给下一次 click。细节是 `replace-threw`、`replace-stale`、`post-check-threw`、`post-check-false`，外加该函数里已有的 `destroyed`。
- `dispatchRequested`：`dispatchAllowed` 按现有布尔顺序取第一个失败，然后是 `mark-changed`、`dispatch-threw`、`destroyed-after-dispatch`。
- `closePendingAfterDispatch`：`destroyed`、`pending-budget`、`pending-after`。最终数字仍是 1 时原因是 `accepted`。最终仍是 0 且原因已经确定时，不另造原因。

不记 `oneDescribedSlot` 的命中个数和 `checked`。那需要一块可被下一次替换覆盖的暂存，会把启动检查错记到后来的 click 上。`post-check-false` 已经能说明这次重建没通过检查。

每次写出的键只有 `n`、`step`、`slot`、`result`、`reason`、`dropped`。`slot` 只在 `click` 和 `gate` 出现，只许 `original`、`contrast`、`translation`。`result` 和 `reason` 只在 `gate` 出现。`dropped` 只在 `closed` 出现，是这个对象上的写入失败次数。未知事件或未知原因的行不写。不调用产品 `Logger`。不写 diagnostics 或 debug 目录。不读焦点，不记路径、文献、正文、译文、提示词、凭据、窗口 id 或 mark 文本。

## 不变量

实现阶段的测试必须锁住这些句子。本阶段不跑。

1. 开关不是 `1` 时，ports 上没有 `trace`。stdout 不增加这些行。`click` 的返回值与现在相同。
2. `traced(n, reason)` 同步执行，先选定 `n`，再尝试写入，然后返回同一个 `n`。写入抛错或返回失败时，返回值仍是 `n`，失败次数加 1。
3. `if (state.destroyed || state.busyAttempt !== 0)` 拆成两个 `if`。destroyed 为真时返回 0 且不再读 `busyAttempt`。`shapeAtStart === null || !slotHasEvent(...)` 同样：shape 为 null 时返回 0 且不调用 `slotHasEvent`。两处拆开的中间都没有 `await`。
4. `pending` 那条先完成现有的 `await settle`，再记原因并返回 0。不在 settle 之前写 gate 行。
5. 替换失败的细节只活在那一次 `replaceShape` 调用的局部变量里。下一次 click 看不到它。
6. `armed` 最多一行。`closed` 最多一行。第二次关闭通知不再写。
7. 非视图菜单项的 click 不写 `step:"click"`。
8. 视图 click 的顺序是先 `click` 行，再 `gate` 行。`n` 从 1 起每次加 1。

## 怎样读记录

行为以 [docs/arch/11.md](../arch/11.md) 为准。这里只把判定写开。

缺 `click` 行一律不能推出没有进入 `MenuItem.click`。`armed`、`closed`、连续的 `n`、`dropped` 为 0，以及写入时没有同步抛错，都不能证明 stdout 已经收全，也不能证明关闭之后没有还没写完的记录。这些行可以留下，但不把缺行收成负向结论。不另做 flush 或传输。

本批只用已经写下的成对记录：

| 已有记录 | 判定 |
| --- | --- |
| 某一步对上唯一的 `click` 加紧随的 `gate`，且 `result` 为 0 | 这一步进入了回调，gate 拒绝。`reason` 是已有分支 |
| 同上面，且 `result` 为 1 | 两支都不成立。停止，不改分发 |
| 没有 `click`，或只有 `click` 没有 `gate`，或同一步能对上多于一行 | 这一步观测不足 |

四步的槽位依次是 `original`、`original`、`contrast`、`translation`。前两步是菜单「原文」和 Ctrl+1，记录里没有动作来源。收齐的槽位若是 `original`、`contrast`、`translation`，同时符合「菜单有、Ctrl+1 无」和「菜单无、Ctrl+1 有」。这两种都成立时，菜单和 Ctrl+1 都是观测不足。不能用 Ctrl+2 或 Ctrl+3 的记录去决定缺的是哪一个 `original`。

操作者在每步之后写下当时看见的栏位，来源是操作者本人，不是 stdout。它只保留这一步结束时人看见什么。它不能把上面两种分法收成一种，也不能把缺的 `click` 行写成没有进入回调。不解释成系统抢走了键，也不解释成焦点在页码框。session02 的菜单仍是 UNCONFIRMED。

## 规格依据

PRD、RULES、DESIGN、`docs/design-principles.md` 不改。

- DESIGN §4.10 11.1 已经规定 Ctrl+1/2/3 走系统菜单。P4 要求菜单用系统控件。本诊断不新增界面，也不新增一套按键监听。
- RULES §4 与 §5 第 8 条已经禁止日志里的正文、译文、提示词、密钥和绝对路径。调试模式默认关，调试文件写在应用数据目录的 `debug/`。这次默认不写，打开时也不写那个目录，所以不占用调试模式的 7 天和 50 MB。
- RULES N-10 禁止改 DESIGN 和设计原则。这里没有视觉变更。
- ARCHITECTURE §11 的诊断事件白名单不增加条目。临时 stdout 由 §11 新增的那一小节单独限定，并写明它不是 `DiagEvent`。
- H7 仍在 E2 计划里：不写第二套全局 `keydown`。本计划不改那份 E2 计划。

## 计划 / 实际

计划列在开工前填。实际列只填已经发生的事。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 第一笔只提交本文件 | 本阶段提交 | 提交说明 `docs: 写下视图快捷键诊断计划` |
| 2 | 第二笔写入 §11、一条 manifest 替换、changelog、12:24 台账 | 本阶段提交 | 提交说明 `docs: 写明视图快捷键临时记录的边界` |
| 3 | Forge 审本计划。通过前不写 main 与测试 | 已审。两项必要闭合在本提交。复审未发生 | 无 |
| 4 | 通过后只改白名单里的六份代码和测试 | 未发生 | 无 |
| 5 | 按下面的命令表。构建只有一次，失败不补第二次 | 未发生 | 无 |
| 6 | 真机另由 Forge 安排。本仓库的 Cloud 不启动 Electron，不连接用户机 | 未发生 | 无 |

## 实现阶段的命令

本阶段一条都不跑。工作树里已经有 `node_modules`，`node` 是 v22.23.4，`corepack pnpm` 是 10.34.9。实现阶段沿用这份安装。不执行 `pnpm install`，不下载 Electron 可执行文件，不装新的 native。若构建时发现当前平台的 esbuild 包不存在，停下来单列那个包，不在发现之前下载。

工作目录是仓库根，除非某条写了目录。每条的 stdout 和 stderr 原样留在 `docs/evidence/<本 PR 号>/commands.md`。退出码照写。

下表是全部本地命令额度。失败补跑不能把构建加成第二次。G1 在 [docs/arch/13.md](../arch/13.md) 是 Prettier 与 ruff format。本改动没有 Python，不跑 ruff。

| 项 | 命令 | 最多次数 |
| --- | --- | --- |
| G1 限定 | `corepack pnpm exec prettier --check apps/desktop/src/main/view-shortcut-trace.ts apps/desktop/src/main/view-menu-gate.ts apps/desktop/src/main/library-wiring.ts apps/desktop/test/view-shortcut-trace.test.ts apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-wiring.test.ts` | 1。失败即停。不跑全库 Prettier，不跑 `pnpm run check` |
| 测试 | `corepack pnpm exec vitest run apps/desktop/test/view-shortcut-trace.test.ts apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-wiring.test.ts` | 这三条一起 1 次。若有文件失败，只把该文件再跑 1 次；已通过的文件不跑。不跑 `pnpm test` |
| 构建 | 在 `apps/desktop` 执行 `corepack pnpm run build` | 1。只在前两项都是退出码 0 之后。失败不补第二次。不用 `pnpm start`。这不是用户 Windows 上的 Electron 包，也不启动 Electron |

G1 全库、G2、G3、G14、以及 `pnpm run check` 的其余项，本阶段和上述限定命令都尚未运行。推送之后仓库自己的 CI 若启动，与这些本地未跑分账，不写成诊断通过。

## 真机

没有在本机打开。旧两次启动的 1/1 不重置。新的一次要由 Forge 另安排，使用新的 userdata，环境变量恰好为 `1`，用已经构建好的 Windows 包，不用会再次构建的 start。

用户操作：打开合成两页 PDF。每步前用工具栏回到对照，再点 PDF 页面，笔记写「焦点动作：点 PDF 页」以及这一步结束时看见的栏位。不点页码框。然后依次点「视图 › 原文」、按 Ctrl+1、按 Ctrl+2、按 Ctrl+3。用户正常关闭。之后只收整段 stdout。判定用「怎样读记录」。看见的栏位来自操作者，不写入 trace。本计划不执行这些步骤。

## 拆除

删掉 `view-shortcut-trace.ts` 和它的测试，去掉 gate 的可选 `trace` 与返回点上的调用，去掉 wiring 里的开关、`arm`、click 记录和关闭订阅，并删掉 §11 那一小节和 manifest 里对应的那条替换。一次提交。没有数据要迁。产品切换语义在拆除前后都不变。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「OK，按照你的建议推进就行。」范围是加两处临时记录、限定验证和构建，以及以后一次人工对照。不修切换逻辑 | 实施许可。12:05 的静态设计许可不代替本行 | 2026-11-25 12:24 | Wisdom，[docs/approvals.md](../approvals.md) 对应行，评论 7152823577 |
| 不记 postCheck 的命中个数和 checked | 避免一块会串到下一次 click 的暂存。原因 `post-check-false` 仍保留 | 2026-11-25 | 本任务对错误归因的限制，不是新的产品决定 |
| 缺 `click` 行一律不作「没进回调」。`armed`、`closed`、连续序号和 `dropped` 为 0 不证明收全。重复的 `original` 不能唯一对应时，菜单和 Ctrl+1 都是观测不足 | Forge 审查 PR #238 计划后的必要闭合。不是新的产品决定，也不增加字段 | 2026-11-25 | Forge 审查，非业主决定 |

## 证据链接

- `docs/evidence/<本 PR 号>/`：本阶段无。没有把日志写入仓库。
- 2026-11-25：PR #238 的 node 检查里，Unit tests 失败。`docs/arch/11.md` 少了这一节原来就有的末尾空行，拼接结果比基线少一个换行。补上之后只跑了 `corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts`，14 通过，退出码 0。没有重跑全库 1015 项。

## 自检

- [x] 影响 arch / prd 吗？影响 arch。同一 PR 更新 `docs/arch/11.md`、manifest 和 changelog。不改 PRD。

## 实现交接

Forge 审查通过后，接手的人先完整读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md`，以及 AGENTS.md 里本任务要读的节。然后只按本文件的白名单和 §11 实现。

```
本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

任务类型：不适用（主进程临时观测，无可见 UI，不改 core / seam 契约）。
目标：有成对的 click 与 gate 记录时，区分进入后 gate.click 返回 0，或返回 1。缺 click 行只写观测不足，不写成没进回调。不改切换，不判根因已定，不写成快捷键 PASS。
验收：本文件「不变量」八条和「怎样读记录」。行为以 docs/arch/11.md 新增小节为准。
分支：feature/view-shortcut-trace。基线是 feature/reader-view-modes-e2-174 的 75c17c773ef70fef64c63c078f1b4e97aa2b537f，tree bde902c43048919aec882414d2f18ab02fa0a47b。Draft，叠 PR #237。不 Ready，不合入，不发版。
只改本文件白名单的六份代码和测试。不改 PRD、RULES、DESIGN、design-principles、contracts、renderer、preload、core、shell.tsx。
命令只跑本文件「实现阶段的命令」那张表。构建最多一次，失败不补。测试只对失败文件再跑一次，已通过的不跑。不启动 Electron，不连接用户机，不重置旧的 1/1。
```
