# 执行计划

S2b：视图菜单的 none / 活动形状、替换门与镜像。分支 `feature/view-menu-gate-s2b-174`。文件名与分支同名。

基线 main `85632b3d7f7073dbbd77b3db47142f015af272f4`。唯一 parent `405c865a48902d6406a964a155823c49f4e3bff9`。tree `8f343d3c62896e40d57c495d63257621fa9a6b5f`。2026-11-16 已 `git fetch origin main`，`origin/main` 与这个 SHA 相同。远端没有 `view-menu-gate-s2b` 分支，开着的 PR 里也没有同任务。本任务只用这一支。

行为以已合 [seam](feature-reader-view-menu-seam-174.md) 为准，尤其是「仍然成立」「替换门」和「验收」里的 S2b 段。栏位产品句在 [E2 计划](feature-reader-view-modes-e2-174.md)。本文件不重开 seam，不抄第二份门算法，不改那两份计划。

Wisdom 2026-11-16 21:52 原话：「按照项目进度推进吧」。台账在 [docs/approvals.md](../approvals.md) 的 21:52 行。Forge 的限定解释写在该行的「批了什么」，不是第二句原话。20:57 与 21:03:24 是 PR #222 的合入补记，不给 S2b 加范围。14:44 至 16:52 里当时写着的「S2 未批准」不改。21:52 不是本计划的 PASS。

Loom 对 main `85632b3d7f7073dbbd77b3db47142f015af272f4` 的只读原则复核是 PASS。Forge 读过 `/workspace/oi-qa/v2-s2b-principles/LOOM.md`。本工作区的 `/workspace` 指向仓库，没有 `oi-qa`，这里不复制那份报告。结论只有四条：栏位切换仍是支持性能力，用户仍在系统原生的「视图」或「显示」菜单里选择；`none` 是内部状态，不是第四个菜单项；S2b 还没有 handler、`expose` 和 renderer 上报，生产菜单仍是 none 的普通项；活动形状的模板或装配测试不等于生产已经联动。没有新的原则冲突，也没有新的拍板。这个 PASS 只属原则。它不代替 Forge 对本计划的精确 PASS，也不表示实现、原生菜单画面或真机已经验过。台账不因此加行。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本回合任务类型：不适用（纯文档）。以后的实施只改下面白名单里的 desktop main 菜单装配和测试，不改 `packages/features/**`，不改 `contracts/src/ipc/**`。

## Goal

把 S2b 收成一份可以和台账、以后的证据留在同一 Draft 里审查的计划。实施要等 Forge 对精确计划 PASS，并且另有实施指令。内容是：新建替换门和镜像；`library-menu.ts` 只导出已经存在的三个栏位事件；`library-wiring.ts` 只改菜单装配，启动时仍装 none；行为测试覆盖下面的矩阵。保持 `expose: false`。三份生成物零 diff。`composition-root.ts` 零 diff。

## Context

- 现在已有的行为：`library-menu.ts` 94 行。`MenuItemSpec` 只有 label、event、可选 accelerator。`viewActions` 第 21–32 行已有「原文 / 对照 / 译文」和 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`，加速键按平台分开。mac 子菜单标签是「显示」，其他平台是「视图(&V)」。`library-menu.test.ts` 100 行，锁的是标签、加速键和事件名。`library-wiring.ts` 252 行。`installFileMenu`、`toMenuItem`、`menuEntry` 在第 128–154 行，只写 label、accelerator、click，然后 `Menu.setApplicationMenu`。`dispatchMenu` 第 156–168 行仍把事件交给 `executeJavaScript`。`wiredLibraryCommands` 不包含 `shell.reportViewMenu`。`shell.ts` 第 59 行 `expose: false`。`view-menu-epoch.ts` 128 行，只提供 `attach` 和 `read`，没有门回调。`composition-root.ts` 27 行，只调用 `startLibrary`。S2a 的测试用 `vi.mock("electron")`，那个假 `Menu` 没有 `_menuWillShow`。
- 相关的节：seam「仍然成立」「替换门」「验收」；[E2 计划](feature-reader-view-modes-e2-174.md) 的菜单单选；[DESIGN.md](../../DESIGN.md) §4.10 的 11.1（mac「显示」，Windows「视图」）；[docs/design-principles.md](../design-principles.md) P3、P4；[docs/arch/06.md](../arch/06.md)；[RULES.md](../../RULES.md) §2、§8、§9。模式值已是 `none | original | contrast | translation`。`contrast` 对应现有「对照」和 `oi-view-bilingual`。
- 还没做的部分：none 与活动 radio 的构造差别、替换门、镜像、以及把真实 `_menuWillShow` 和 fake 门状态分开的测试。生产进程还不会因上报或换代去改菜单。

## Constraints

优先系统原生菜单。不造菜单控件，不自绘，不把三项置灰，不改成 checkbox。不新增「无」项。不改标签、accelerator、enabled、事件名。

`none` 用普通项，构造参数里不写 `checked`。`original`、`contrast`、`translation` 把这三项建成 radio，构造参数里恰有一项 `checked: true`。不在已经挂上的 radio 上改 `checked`；要换形状就新建菜单再 `setApplicationMenu`。Electron 45.2.1 的 `Menu::MenuWillShow` 只遍历这一层菜单自己的项：radio 组里一个都没勾时，勾上该组第一项。普通项会跳过。所以 none 不能建成全 false 的 radio。

替换门的状态是已提交镜像、`known` 或 `unknown`、至多一个 pending。pending 只收生命周期的 none，并记下当时的阶段记号。被拒绝的上报不能变成 pending。新的合法快照开始前，先清掉同一阶段留下的 pending none，再做这次替换。这次替换期间新写下的 none 留下。成功、抛错、后置核对失败三种退出都看 pending：记号仍对应当前槽，才再替换一次。这次额外替换期间 pending 又被更新，就留下最新值，安装状态改为 `unknown`，不再进入下一轮。窗口已销毁时不调用 Menu。click 在门正忙时不派发，也不用旧镜像覆盖 pending；空闲时按已提交镜像重建，再派发已有事件。

`library-wiring.ts` 的生产装配只装 none。活动形状由同一套纯函数生成，测试可以直接调用。这不表示 `startLibrary` 已经会把菜单改成对照或译文。`view-menu-epoch.ts` 没有回调。本笔不改它，也不改 `index.ts`。真实 `did-navigate` 或 `closed` 因此还不会调用这扇门。矩阵里的换代和销毁用门的入参驱动。

函数软 50、硬 80。文件软 400、硬 600；测试软 600、硬 800。不写模块级 `let`。`max-params` 为 4。S1 的 233 行和 S2a 的预算不沿用。已合 seam 里的 344 是当时的估计，不是本笔额度。346 只表示要重估。1.73 只披露风险，不是开工门槛。硬停点是同一 Draft 相对 `origin/main` 的新增+删除不超过 600。不写 `G12:`，不删测试凑数，不改门禁。

## 验收矩阵

生产结果和测试调用分开。B1、B2 读的是 `_menuWillShow` 返回之后的 `MenuItem`。读构造参数不算菜单已经打开，也不算真机。

| 编号 | 来源 | 载体 | 通过时能看见 |
| --- | --- | --- | --- |
| B1 | seam 验收 S2b | 真实 Electron | 视图子菜单上，原文、对照、译文是 `normal`，`checked` 仍为 false。没有第四项 |
| B2 | 同上 | 真实 Electron | `original`、`contrast`、`translation` 各自恰有一项 radio 为勾，分别是原文、对照、译文。另外两项是未勾的 radio |
| B3 | 同上，成功退出 | fake port | 成功替换期间写下的仍有效 pending，退出后只再替换一次 |
| B4 | 同上，抛错退出 | fake port | 抛错后同样只再替换一次，最终镜像不是抛错的那一形状 |
| B5 | 同上，后置失败 | fake port | 后置核对失败后同样只再替换一次 |
| B6 | 同上，修复中更新 | fake port | 额外那一次替换期间 pending 再更新：`unknown`，没有第三次 `replace` |
| B7 | 同上，同代旧 none | fake port | 合法 `contrast` 开始前清掉同记号的旧 pending。原生替换只有 contrast。最终菜单和镜像都是 contrast |
| B8 | 同上，换代 | fake port | 替换期间换代写下的 none 留下。旧 submit 后置失败，不把旧形状提交为镜像。新 none 再替换一次 |
| B9 | 同上，销毁 | fake port | `destroyed` 为真时 `replace` 次数是 0 |
| B10 | seam「替换门」的 click | fake port | 忙碌时不派发，也不覆盖 pending。空闲时按已提交镜像重建，然后派发一次 |

B10 在已合替换门里，不在验收段的那一句里。留下它，是因为门的 click 不测的话，忙碌时仍会派发。不把 B2 的通过写成生产菜单已经跟着栏位走。

## 测试载体

fake 与真实 Electron 分成两个文件。

`apps/desktop/test/view-menu-gate.test.ts` 在 Vitest 的 Node 环境里跑。port 只记录 `replace` 的形状，并可以在回调里写 pending 或抛错。它不导入 Electron，不能证明 `_menuWillShow`。

`apps/desktop/test/view-menu-native.test.ts` 用仓库里的 `electron` 45.2.1 启动 `apps/desktop/test/view-menu-native-electron.mjs`。子进程里 `Menu.buildFromTemplate` 使用镜像函数产出的那份模板，再对标签为「视图(&V)」或「显示」的子菜单调用 `_menuWillShow()`，把该项的 `type`、`checked`、`label` 打到 stdout。断言在父进程。Electron 45.2.1 把这个方法绑在 `Menu` 上，实现是 `MenuWillShowForTesting`，它直接调用上面的 C++ 函数，不打开窗口。这不是菜单仍开着的画面，不是 mac，不是物理键，也不是读屏。

现有 `library-menu.test.ts` 继续锁标签和加速键。再加一条：静态模板和 none 形状都不带 `checked`，项数不变。

`pnpm test` 会收集这两个 `*.test.ts`。若 Electron 进程起不来，停。不改成 skip，不用模板读数代替，不改 CI，不装系统库。

## 文件白名单

本回合只许新增本文件，下一笔只许改台账。

实施要等 Forge 对精确计划 PASS，以及另发的实施指令。届时只许改：

| 文件 | 现在 | 这一笔 |
| --- | --- | --- |
| `apps/desktop/src/main/view-menu-gate.ts` | 无 | 新建。只有替换门 |
| `apps/desktop/src/main/view-menu-mirror.ts` | 无 | 新建。只有形状到菜单项 |
| `apps/desktop/src/main/library-menu.ts` | 94 | 导出三个已有事件名，数组改用它们 |
| `apps/desktop/src/main/library-wiring.ts` | 252 | 只改第 128–154 行这一带的装配。启动装 none。三个栏位的 click 走门。改完约 272，低于 400 |
| `apps/desktop/test/view-menu-gate.test.ts` | 无 | B3–B10 |
| `apps/desktop/test/view-menu-native.test.ts` | 无 | B1、B2 的父进程 |
| `apps/desktop/test/view-menu-native-electron.mjs` | 无 | 只跑原生 `_menuWillShow` |
| `apps/desktop/test/library-menu.test.ts` | 100 | 无勾、无第四项 |
| `docs/evidence/<PR号>/commands.md` | 无 | 只记实际跑过的命令和退出码 |
| 本文件 |  | 只补「实际」列 |

不改：`composition-root.ts`、`view-menu-epoch.ts`、`window.ts`、`index.ts`、`wiredLibraryCommands`、`ipc-production-assembly.test.ts`、`packages/contracts/**`、三份生成物、renderer、UI、存储、CSP、协议、DESIGN、设计原则、`docs/design/**`、环境安装文件、CI、规格正文、seam 与 E2 计划。不启用 handler。codegen 后生成物零 diff。

## 预算

口径是相对 `origin/main` 的 `git diff --numstat` 新增+删除。产品与测试的行数来自按矩阵写过的底稿，底稿不入库。镜像底稿 48 行会在可选 `accelerator` 上写出 `undefined`，补成不写该字段后按 58 行计。门的底稿 131 行，六个函数都短于 50。

| 文件 | 新增 | 删除 | 合计 |
| --- | --- | --- | --- |
| `view-menu-gate.ts` | 131 | 0 | 131 |
| `view-menu-mirror.ts` | 58 | 0 | 58 |
| `library-menu.ts` | 10 | 3 | 13 |
| `library-wiring.ts` | 32 | 12 | 44 |
| `view-menu-gate.test.ts` | 158 | 0 | 158 |
| `view-menu-native.test.ts` | 50 | 0 | 50 |
| `view-menu-native-electron.mjs` | 15 | 0 | 15 |
| `library-menu.test.ts` | 12 | 0 | 12 |
| 产品与测试 | 466 | 15 | 481 |
| 证据 `commands.md` | 36 | 0 | 36 |
| `docs/approvals.md` | 4 | 1 | 5 |
| 本文件 | 172 | 0 | 172 |
| 同一 Draft 预计 |  |  | 694 |

481+36+5+172=694，超过 600 共 94。修复余量为负。这里先停。不把测试删短，不把表格压成一行，不写 `G12:`，不把计划拆去另一个未批准的 PR 来凑数。

1.73×481=827.13，只说明风险。346 已经触发了这次重估。两个数都不是停点。停点是上面这个超过 600 的和。

## 命令

本回合只跑 `node tools/check-docs/check.mjs`。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。不跑 codegen、Vitest、`pnpm test`、`pnpm run check`，不启动 Electron。

实施回合才跑，并且只把实际退出码写入证据。预算缺口未处理时不跑：

```text
corepack pnpm run codegen
git diff --exit-code
corepack pnpm exec vitest run apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-native.test.ts apps/desktop/test/library-menu.test.ts
corepack pnpm test
GATE_BASE=origin/main corepack pnpm run check
node tools/check-docs/check.mjs
GATE_BASE=origin/main node tools/check-pr-size/check.mjs
```

`codegen` 后工作区必须干净。每个 tip 的全量 `pnpm test` 只跑一次。

## Done when

本回合：两笔提交，第一笔只有本文件，第二笔只有台账；`check-docs` 的退出码写在 PR 说明里；PR 保持 Draft。不合入，不 Ready，不发版。

实施还要：白名单外零 diff；矩阵每一行有行为断言；B1 和 B2 来自真实 `_menuWillShow`；`expose` 仍是 false；生成物零 diff；`composition-root.ts` 零 diff；证据记下命令和退出码；同一 Draft 的新增+删除不超过 600，并且还留有修复余量。这些条件现在没有满足。Forge 对本文件的 PASS 和另发的实施指令都未到。预算超过 600 时，即使计划文字被接受，也不开始写产品代码。

## 失败停点

- 同一 Draft 的预计或实测新增+删除超过 600：停。不删测试，不写 `G12:`。
- 要把真实 `did-navigate` 或 `closed` 接到门上：停。那要改 `view-menu-epoch.ts` 或 `index.ts`，不在已合名单里。
- Electron 45.2.1 的子菜单没有 `_menuWillShow`，或进程起不来：停。不用模板读数代替。
- 类型或测试失败落到白名单外：停报。
- 要改 handler、`expose`、生成物、`wiredLibraryCommands`、renderer、UI、存储、CSP、协议、CI 或规格正文：停。
- 没有 Forge 对精确计划的 PASS，或没有另发的实施指令：不写产品代码。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品代码 |  |  |
| 2 | 台账三行与页脚。旧行不改 |  |  |
| 3 | Forge 审预算缺口。通过前不实施 |  |  |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 21:52 只推进 S2b 的计划与台账 | 原话「按照项目进度推进吧」。执行范围是 Forge 的解释，记在台账 21:52 行 | 2026-11-16 | Wisdom 原话；范围是 Forge 解释 |
| 沿用已合 seam | 不重开架构。验收矩阵仍留在本文件 | 2026-11-16 | 计划核对，非新批准 |
| 原则复核只引用四条 | Loom PASS 的基线是 `85632b3`。无新拍板。不代替技术 PASS | 2026-11-16 | Loom 复核，非新 Wisdom 批准 |
| 预算超过 600 就停 | 完整测试、证据和本文件加在一起放不进 600，也没有修复余量 | 2026-11-16 | 按 21:52 的硬停点核对，非新批准 |

## 交接

从 main `85632b3d7f7073dbbd77b3db47142f015af272f4` 另开，Draft。先读本文件、已合 seam 和台账 21:52 行。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

下一笔不是实施。先由 Forge 处理「同一 Draft 超过 600」这个缺口。处理之前不写 `view-menu-gate.ts`，不改菜单，不开 Ready。

## 自检

- [x] 影响 arch / prd 吗？不影响。
- [x] 本回合第一笔只有本文件。
