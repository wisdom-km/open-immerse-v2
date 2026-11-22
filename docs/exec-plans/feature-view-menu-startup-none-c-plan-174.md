# 执行计划

C「生产启动 none 装配」的精确计划。本文件只准备下一笔实施，不写生产代码，也不写测试代码。

分支 `feature/view-menu-startup-none-c-plan-174`。从官方 main `a1c91d76401919eae593f3e8a10a605aa0de0970` 另开，独立 worktree。该 commit 的唯一 parent 是 `f9725cac9eec23f08d08506ae592116c5dc876b2`，tree 是 `2759ba975098643f420a404eaa5fb291abb57bdf`。`git fetch origin main` 之后，这个 SHA、parent 和 tree 与官方 main 一致。不改已经合入的分支，不 force，不 rebase。

PR #231 已由 Jone 按 [评论 7080646410](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7080646410) 标为 Ready 并 squash 合入。合入同步记在 [评论 7081408063](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7081408063) 的合入同步节，时刻是 2026-11-22 22:38:27 Asia/Shanghai。合入的是纯替换门和 B3–B10 的 fake 证明。不是本计划的实施批准，也不是 Ready 或发版。

2026-11-22 23:34 的原话是「请你按照项目进度继续推进」。同一条评论把它限定为：按已合 A→B→C 路线准备本计划并送审。这不是 C 的编码批准。计划经过 Forge 审查，并且用户另行给出具体实施范围之后，才写代码。

本任务受 UI 与业务核心解耦约束：[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1 与 [RULES.md](../../RULES.md) §8。本轮任务类型是不适用（纯文档）。五份规格的正文不改：[PRD.md](../../PRD.md)、[ARCHITECTURE.md](../../ARCHITECTURE.md)、[RULES.md](../../RULES.md)、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)。Loom 的原则前置已经完成：mirror、gate 和内部装配不增加控件或弹窗，沿系统原生菜单。本计划不新增 UI 决策。

## 现状理解

行号取自上面的 main tree。实施时以当时的 base 为准，行号移动先重读，不按旧行号硬改。

- 已有菜单安装。`startLibrary` 打开文献库、注册阅读资源协议、在 `will-quit` 上调用 `main.close()`，然后调用 `installFileMenu()`，返回命令表。参数仍是 `dataRoot` 和可选 registrar，不接收 epoch（`apps/desktop/src/main/library-wiring.ts` 第 39–49 行）。`installFileMenu` 用 `applicationMenuTemplate` 建成应用菜单（第 128–132 行）。每个栏目的 click 都是 `void dispatchMenu(item.event)`（第 144–154 行）。`dispatchMenu` 只取 `BrowserWindow.getAllWindows()[0]`；没有窗口或事件没有脚本时直接 resolve；否则返回 `executeJavaScript` 的 Promise，调用点没有 `.catch`（第 156–168 行）。`void` 不接住拒绝。
- 已有形状。`viewSlotDescriptions("none")` 只返回原文、对照、译文的 `label` 与 `event`，没有 `type` 或 `checked`。三种活动值是 radio，且恰有一项 `checked: true`（`apps/desktop/src/main/view-menu-mirror.ts` 第 23–42 行）。对照的事件是 `oi-view-bilingual`。三个事件定义在 `library-menu.ts` 第 3–5 行。文件菜单是打开和返回文献库（第 13–22 行）。视图菜单里还有历史和缩放（第 24–35 行）。
- 已有门。`createViewMenuGate` 接收 `replace`、`postCheck`、`dispatch`（`apps/desktop/src/main/view-menu-gate.ts` 第 11–17、62 行）。公开状态是只读的 `committed`、`install`、`pendingMark`。入口是 `submit(shape, mark)`、`noteNone(mark)`、`click(requestedEvent)`、`setDestroyed`（第 19–27 行）。`click` 在已提交形状的栏位里找不到请求事件时返回 0，不替换（第 157–158 行）。找到时按已提交镜像重建，再派发请求的那个事件，不是当前勾选栏位（第 160–172 行）。`replace` 和 `postCheck` 的抛错或拒绝由门接住（第 316–327 行）。门不导入 Electron，也不导入 wiring。
- 生产入口还没有这扇门。`startMainLogger` 调用一次 `startLibrary(app.getPath("userData"))`（`apps/desktop/src/main/composition-root.ts` 第 13–19 行）。`startDesktop` 另建一个主窗口，并把 `createViewMenuEpoch()` 只传给窗口（`apps/desktop/src/main/index.ts` 第 34–38 行）。epoch 的公开面只有 `attach` 和 `read`（`apps/desktop/src/main/view-menu-epoch.ts` 第 11–14 行）。窗口加载前挂上 epoch（`apps/desktop/src/main/window.ts` 第 16–25 行）。应用菜单是整个应用一份，不是每个窗口一份。
- 渲染端局部 mode 仍是唯一显示状态，不落盘。`shell.tsx` 第 55–64 行监听返回文献库、历史、页码和缩放，不监听三个视图事件。main 只镜像已经接受的状态。本 C 不调用 `submit("original" | "contrast" | "translation")`，所以不激活产品三视图。
- 已有测试替身。`open-document-wiring.test.ts` 第 27–30 行和 `reading-asset-protocol.test.ts` 第 37–43 行的 Electron 假对象只有 `setApplicationMenu` 与 `buildFromTemplate`，没有 `getApplicationMenu`。它们会调用 `startLibrary`。C 不能让这些调用抛出。

还没有做的部分：生产启动时没有 `submit("none", 常量记号)`，三个视图 click 没有进入 `gate.click`，文件菜单和其他栏目仍与视图走同一条未接住拒绝的 `dispatchMenu`。完整的 commit、退役、关闭通知和 floor 的唯一写者都还没有接线。那些不在本 C。

## 目标与验收

C 在 B 合入之后只做生产启动 none 装配。

启动之后，应用菜单里的原文、对照、译文来自 `viewSlotDescriptions("none")`：普通 native 项，没有 `checked`，也没有 radio。记号是 wiring 里的常量 `startupViewMark = "unbound"`。生产代码调用 `noteNone` 的次数是 0，不读取、不传入 epoch。三个视图 click 进入这一扇门的 `click(requestedEvent)`，并接住拒绝。文件菜单、历史和缩放仍走原来的 `void dispatchMenu`。`dispatchMenu` 的函数体不改。

可观察的装配验收，不断言源码文本：

| 验收 | 观察 | 不拿来冒充的层 |
| --- | --- | --- |
| 启动 none | 等待安装完成之后，交给 `setApplicationMenu` 的三个视图项没有 `type`、没有 `checked`，标签和事件与 `viewSlotDescriptions("none")` 一致 | A 的真实 `_menuWillShow`。这里只证明生产装配交进去的是 none |
| `noteNone` 为 0 | 安装完成到第一次 click 之前，替换只发生一次，而且载荷是 none。空闲时再调 `noteNone("unbound")` 会多一次 none 替换；生产路径没有这第二次 | 不导出 `pendingMark` 来数调用 |
| 三个视图进入门 | 点原文、对照或译文，都会先按 none 重建，再派发被点的那个事件。对照派发 `oi-view-bilingual` | 不把派发说成产品三视图已经激活 |
| 其他栏目不进门 | 打开、返回文献库、历史和缩放只派发，前面没有视图替换 | 不改这些栏目的 `void dispatchMenu` |
| 视图拒绝被接住 | 视图 click 的 `executeJavaScript` 返回拒绝时，这条 handler 的 Promise 仍然 resolve | B 已经证明门的六条退出。这里只证明生产视图 click 走到门，而且拒绝不冒出 |
| 销毁不推进门 | 跑过现有 `will-quit` 监听之后，门仍接受下一次视图 click 并替换。生产不注册窗口 `closed`，也不调用 `setDestroyed` | B9 证明 `destroyed` 为真时门不碰替换。这里证明生产路径没有把销毁送进门 |
| 没有窗口 | `getAllWindows()` 为空时，视图 click 仍先重建 none，派发按现有函数 resolve，handler 不拒绝 | 不改成按窗口各装一份菜单 |
| 替换抛错 | `setApplicationMenu` 抛错时，安装 Promise resolve，随后的视图 click 不再派发 | 不重做 B 的全部抛错分支 |

活动三视图的 radio 恰一勾仍由已合 mirror 和 A 的原生读取证明。本 C 不提交那三种形状，验收里不出现勾选。

## 架构硬约束

依赖方向保持：`library-wiring.ts` → `view-menu-gate.ts` → `view-menu-mirror.ts` → `library-menu.ts`。门继续不导入 Electron、wiring、epoch、handler 或 core。wiring 已经导入 Electron，由它提供三个端口。不把 Electron 类型下沉进门。

单实例所有权：每一次菜单安装在函数内部 `const gate = createViewMenuGate(...)`。click 闭包抓住这一次的门。不使用模块级 `let`，也不把门放进 epoch。eslint 禁止顶层 `let`；模块级变量即使写成 `const` 也不是这一笔要的所有权。生产启动只经由 `startMainLogger` 的那一次 `startLibrary`。第二次 `startLibrary` 会再注册一个 `will-quit` 并再装一份菜单、再造一扇门；后一次的 click 只抓住后一扇门。C 不用单例把这两次收成一个。这不是第二份代次表。

`startLibrary` 保持同步。`composition-root.ts` 第 19 行的调用不改。菜单安装函数返回 `gate.submit("none", startupViewMark)` 的 Promise。`startLibrary` 调用它并且不 await，同时接住拒绝：`void installApplicationMenu().catch(() => undefined)`。今天的 `submit` 在替换失败时也会 resolve；这层 catch 是生产入口自己的边界，不依赖这个细节永远不变。装配测试直接 await 这个函数，不用固定次数的微任务去猜门内部的 await。

`replace` 端口：用现有 `applicationMenuTemplate` 重建整份菜单。三个视图事件的项改用这次传入的 `ViewSlotDescription`：none 不写 `type` 和 `checked`；描述里若有 radio 与 `checked`，原样写上。加速键仍来自模板。文件菜单、历史、缩放和 role 菜单不动。视图项的 `id` 写成该栏位的 event，供后置核对找到这三项。这不是第二份形状表，形状仍只由 `viewSlotDescriptions` 产生。

`postCheck` 端口：读取 `Menu.getApplicationMenu()`。三个视图 `id` 都在，且都没有 radio、没有 `checked === true` 时返回 true。读不到菜单、假对象没有这个方法、或读取抛错时返回 false，不向外抛。现有假 Menu 因此让安装停在 `unknown`，`startLibrary` 仍返回命令表。装配测试的假菜单保存刚建成的模板，并让 `getApplicationMenu` 把它交回来，启动 none 才能成为 `known`。不另造安装状态。

`dispatch` 端口：调用现有 `dispatchMenu`。函数体保持第 156–168 行。没有窗口、未知事件、脚本执行成功或拒绝，都沿这个函数。视图 handler 是 `gate.click(item.event).catch(() => undefined)`。文件、历史和缩放保持 `void dispatchMenu`。判断哪三个事件进门，用 `viewSlotDescriptions("none")` 的 event，不在 wiring 里再写一份事件名单。

异常、销毁、重复创建和多窗口：

- 替换或后置核对失败由门接住。安装 Promise 不拒绝。失败后已提交形状仍是 null，下一次视图 click 返回 0，不派发。
- `will-quit` 仍只 `main.close()`。`window-all-closed` 仍只 `app.quit()`（`index.ts` 第 22–24 行）。两者都不调用 `setDestroyed`。
- 应用菜单仍是一份。`createMainWindow` 仍创建一个窗口。`setWindowOpenHandler` 仍拒绝额外窗口（`window.ts` 第 23 行）。C 不给每个窗口装菜单。
- 派发目标仍是 `getAllWindows()[0]`。已经存在第二个窗口时，脚本仍只进第一个。C 不改变这条旧边界，也不为它新增测试产品。

当前 API 和规范能支持这个边界。不发明第二份 epoch 表、新的模块单例或兼容层。seam 里「栏位主人的命令函数写入最新槽」属于后面的产品路径，不在本 C 实现。

## 未来实施白名单

本计划 PR 不改下表里的代码。下一次实施批准只点名这些路径。文件数不先锁死：默认一个装配测试文件，因为这些断言测的是同一次生产安装。若实施时发现假菜单装配和 `startLibrary` 的进入证明不能放在同一个测试文件里，先停下来报告，不按行数拆开，也不把用例塞进门的 fake 或 A 的 native。

| 文件 | 职责 | 这一笔 |
| --- | --- | --- |
| `apps/desktop/src/main/library-wiring.ts` | 唯一生产菜单安装。创建本闭包里的门，提交 none，把三个视图 click 接进门 | 允许改 |
| `apps/desktop/test/view-menu-wiring.test.ts` | 候选新文件。假 Menu、假窗口列表，驱动上面的生产函数 | 允许新增。内聚核实后若必须改用另一个现有 wiring 测试文件，先停报 |
| 本计划、`docs/approvals.md`、`docs/evidence/<PR号>/commands.md` | 实施时的计划状态、当次批准、命令和退出码 | 允许按当次批准更新 |

零 diff：`view-menu-gate.ts`、`view-menu-gate.test.ts`、`view-menu-mirror.ts`、`library-menu.ts`、`view-menu-epoch.ts`、`index.ts`、`window.ts`、`composition-root.ts`、renderer、handler、`expose`、三份生成物、CI、依赖、锁文件、环境。`wiredLibraryCommands` 不加入新通道。

[feature-view-menu-gate-s2b-implementation-plan-174.md](feature-view-menu-gate-s2b-implementation-plan-174.md) 第 208–230 行的 62、26、94 行是当时的轮廓，不是额度，也不是上限。该段里的 600 停工是旧句。现行 [RULES.md](../../RULES.md) §1.6、§1.7 只打印行数。不压格式，不删测试，不写 `G12:` 换通过。PLR0915 仍是语句数量，`max-statements` 为 80，不关。圈复杂度 15 和 C901 仍失败。

[feature-reader-view-menu-seam-174.md](feature-reader-view-menu-seam-174.md) 的「替换门」「分批」仍是已合边界。它正文里的「实际硬线 600」与后来合入的 RULES 不一致。本计划按现行 RULES 执行，不先改 seam。若审查认为这句会误导实施，另批改 seam。

## 测试分层与命令

三层分开，不能互相代替：

- B 的 `view-menu-gate.test.ts` 是 Node fake，证明门的状态机。它不调用 `startLibrary`，不能证明生产入口。
- A 的 Windows native 读取真实 Electron 的 `_menuWillShow`。它不是 C 的生产装配，也不能证明产品画面。
- C 的装配测试使用假 Menu 和假 `BrowserWindow.getAllWindows`，调用生产的安装函数和 click。这是必要的生产入口集成测试，仍然不是真机，也不是产品 UI。

将来实施时记录真实命令和退出码，至少包括：

- `corepack pnpm exec vitest run apps/desktop/test/view-menu-wiring.test.ts`
- 现有会调用 `startLibrary` 的回归：`open-document-wiring.test.ts`、`reading-asset-protocol.test.ts`、`parse-capabilities-wiring.test.ts`
- `corepack pnpm exec eslint apps/desktop/src/main/library-wiring.ts apps/desktop/test/view-menu-wiring.test.ts --max-warnings 0`
- `corepack pnpm run typecheck`

Node 先把 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin` 放在 PATH 前面。缺环境就停，不安装，不改依赖。全仓 `pnpm test` 若跑了，超时和跳过按真实输出分账，定向通过不写成全仓通过。

真机、物理键、Alt、F10、访问键、读屏、菜单仍开着的画面：列在队列，本计划和下一笔 C 都不执行。不能用 A 的 native 或 B 的 fake 填上这些项。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 核对 main 的 SHA、parent、tree | 与本文件文首一致 | 本 PR 的命令记录 |
| 2 | 只新增本计划 | 本提交 | 本文件 |
| 3 | 只追加台账 | 下一提交 | `docs/approvals.md` |
| 4 | Draft，停等 Forge 审查和具体实施批准 | 未写代码 | PR |
| 5 | 实施 C | 未开始 | 无 |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 本轮只写计划和台账 | 23:34 原话是继续推进；评论限定为准备 C 计划，不是编码、Ready 或合入 | 2026-11-22 23:34 | Wisdom，[评论 7081408063](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7081408063) |
| 不改五份规格 | 已合门的端口能接上启动 none。600 硬线已由现行 RULES 覆盖 | 2026-11-22 | 本计划。Forge 可要求另批改 seam 的旧句 |
| 门放在菜单安装闭包里 | 生产只有一次 `startLibrary`。模块级单例会变成第二套所有权 | 2026-11-22 | 本计划 |
| `postCheck` 读刚装上的菜单 | 门的端口已经要求后置核对。读不到则返回 false，不新造状态 | 2026-11-22 | 本计划 |
| 生命周期所有权另批 | commit、退役、关闭和 floor 唯一写者要接同一 epoch。A、B、C 的白名单都不含 `index.ts` 和 `view-menu-epoch.ts` | 已合路线 | Wisdom 的既有边界，本计划不扩大 |

## 风险

- 把这一次 none 装配写成产品三视图已经可用。
- 为了让 click 改渲染端 mode，顺手改 `shell.tsx` 或 `use-view-mode.ts`。
- 用模块级门或第二份代次表避免第二次 `startLibrary`。
- 用 A 的 native 或 B 的 fake 当作生产入口已经证明。
- 把旧计划的行数轮廓或 seam 里的 600 硬线重新当成停工条件。
- 现有假 Menu 没有 `getApplicationMenu`。实施时必须让读不到菜单返回 false，不能让 `startLibrary` 抛错。

## 规格

本轮不改规格，`docs/spec-changelog.md` 不适用。供审的一点：seam「分批」仍写「实际硬线 600」。实施以 RULES §1.6、§1.7 为准。不在本 PR 改正文。

## 自检

- [x] 影响 arch / prd 吗？不影响。五份规格正文保持不变。
- [x] 本轮没有生产代码和测试代码。

## 给下一笔 Cloud 的交接

先完整读 [PRD.md](../../PRD.md)、[ARCHITECTURE.md](../../ARCHITECTURE.md)、[RULES.md](../../RULES.md)、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)、本计划和 [feature-reader-view-menu-seam-174.md](feature-reader-view-menu-seam-174.md)。系统原生菜单优先。没有新的控件或弹窗。

目标是生产启动 none 装配：常量记号 `unbound`，生产 `noteNone` 次数是 0，不接 epoch。三个视图 click 进入已合的门并接住拒绝。其他栏目仍是 `void dispatchMenu`。`dispatchMenu` 函数体不改。渲染端局部 mode 仍是唯一显示状态。本 C 不激活产品三视图。

从当时的官方 main 另开 `feature/` 分支和独立 worktree。Draft。先经 Forge 审查本计划，再等用户写出具体实施范围，然后才改代码。白名单只有 `library-wiring.ts`、一个内聚的装配测试，以及当次的计划、台账、证据。不改门、mirror、`library-menu.ts`、epoch、`index.ts`、`window.ts`、`composition-root.ts`、renderer、handler、生成物、CI、依赖和环境。不把 commit、退役、关闭或 floor 写者夹进 C。不发明第二份代次表、模块单例或兼容层。

纯行数只统计，不因 600 停工，不写 `G12:`。不压格式，不删测试。PLR0915、圈复杂度、C901、依赖和安全门禁不关闭。不做实验安装，不碰用户真机，不写本交接之外的生产或测试代码，不标 Ready，不合入，不发版。缺环境停报。A 的 native 和 B 的 fake 都不是 C 的生产入口证明。真机仍列队列，不执行。只做这一条 C 链，不为凑满三个 PR 另开任务。
