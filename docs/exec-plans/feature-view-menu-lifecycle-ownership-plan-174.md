# 执行计划

单一 epoch 与菜单门的生命周期所有权。本文件只写计划。它让下一笔实施在另一次明确批准之后，可以把同一个 epoch 实例和已有菜单门的生命周期接通。本笔不写产品代码，不写测试代码，不改旧约束。

分支 `feature/view-menu-lifecycle-ownership-plan-174`。从官方 main `e62e0d4207f94f93360a6ffcf9c822c965805f96` 另开，不沿用已合 PR #232 的分支。该 commit 的唯一 parent 是 `a1c91d76401919eae593f3e8a10a605aa0de0970`，tree 是 `48f5bc0e1fcabe6643448332028b9378f16b019f`。本工作区 `git rev-parse` 与这三项一致。不 reset、不 amend、不 rebase 已推提交，不改其他分支，不删分支。

Wisdom 2026-11-23 01:36 原话：「批准仅新增生命周期所有权与菜单桥接计划，并补记已批准事项和PR232合入同步；先审计划，不写产品或测试代码，不改旧架构约束、CI、依赖或环境，不操作真机，不Ready、合入或发版。」来源是 [Issue #174 评论 7082976061](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7082976061)。这是本文件唯一的新授权。它批准先审这份计划，不批准下面任一候选的实施。

本任务受 UI 与业务核心解耦约束：[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1 与 [RULES.md](../../RULES.md) §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本回合任务类型：不适用（纯文档）。五份规格正文不改：[PRD.md](../../PRD.md)、[ARCHITECTURE.md](../../ARCHITECTURE.md)、[RULES.md](../../RULES.md)、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)。

## 本笔边界

只新增本文件，并在下一提交追加 [docs/approvals.md](../approvals.md)。不改已合的 [seam](feature-reader-view-menu-seam-174.md)、[S2b 实施计划](feature-view-menu-gate-s2b-implementation-plan-174.md)、[C 计划](feature-view-menu-startup-none-c-plan-174.md)、产品、测试、生成物、CI、依赖、锁文件或环境。`docs/spec-changelog.md` 不适用，因为不改规格。

seam 的分批顺序仍是 S2c-prep → S2c-on → E2 → S3，每一笔另批。seam 只要求下面四件事在 S2c-on 之前写明，没有要求它们先于 S2c-prep。本文件回答这四件事，不改顺序。Forge 把「先写这份计划」放在前面，是排序，不是业主改序。

已合 seam 仍要求 `composition-root.ts` 的 diff 为 0，并且它只调用 `startLibrary`。这个约束继续有效。下面若要穿过它传递同一个实例，只列候选和代价，并标成待决定。本笔不改那句，也不把它写成已经放开。

## 现状理解

行号取自上面的 tree。以后实施时按当时的 base 重读，不按旧行号硬改。

已经在代码里的行为：

- 进程入口先 `startMainLogger()`，再 `createMainWindow(createViewMenuEpoch())`（`apps/desktop/src/main/index.ts` 第 34–38 行）。epoch 只交给窗口。
- `startMainLogger` 用 `startLibrary(app.getPath("userData"))` 装配命令表（`apps/desktop/src/main/composition-root.ts` 第 13–27 行）。这次调用没有 epoch。
- `createMainWindow` 先 `epoch.attach(win)`，再 `loadURL`（`apps/desktop/src/main/window.ts` 第 16–26 行）。第一次 `did-navigate` 因此进得了槽。把 attach 挪到 `loadURL` 之前已经完成，下一笔不要把它再写成未做的任务。起始地址是 `oi-app://app/index.html`。
- epoch 的公开面只有 `attach` 与 `read`（`apps/desktop/src/main/view-menu-epoch.ts` 第 11–33 行）。唯一槽表在 `createViewMenuEpoch` 的闭包里。成功的 `oi-app:` `did-navigate` 把阶段改成 `open`、epoch 加一、floor 归零。非 `oi-app:` 且已经 `open`、主 frame 的 `did-fail-provisional-load`、`render-process-gone` 都退役。`closed` 删槽。same-document 不换代。没有订阅端口，没有 floor 的提交入口。`openNext` 写的 floor 0 是换代归零，不是后来那次接受提交的地板。
- 菜单门在 `installApplicationMenu` 的闭包里创建（`apps/desktop/src/main/library-wiring.ts` 第 136–160 行）。生产记号是 `unbound`（第 58 行）。生产调用 `submit("none", startupViewMark)`，生产路径调用 `noteNone` 的次数是 0。`startLibrary` 同步返回命令表，安装是 `void installApplicationMenu().catch(() => undefined)`（第 45–55 行）。三个视图 click 进门，其他栏目仍是 `void dispatchMenu`。
- 门的公开入口是 `submit`、`noteNone`、`click`、`setDestroyed`（`apps/desktop/src/main/view-menu-gate.ts` 第 19–27 行）。pending 只由 `noteNone` 写下。`noteNone` 会把 `currentMark` 改成这次传入的记号；过期记号若进了门，会把当前记号写回去。销毁之后 `replace` 不再执行。这些是门自己的状态机，不是文档代。
- `packages/contracts/src/ipc/shell.ts` 的 `expose` 仍是 `false`。仓库里没有 `view-menu-handler.ts`。生产没有人调用 floor 提交。
- 装配测试从 `startLibrary` 进入，并期望安装完成前 `noteNone` 为 0（`apps/desktop/test/view-menu-wiring.test.ts`）。`open-document-wiring.test.ts` 与 `reading-asset-protocol.test.ts` 也调用 `startLibrary`，假 Menu 没有 getter。

因此当前 C 只是启动 none、记号 `unbound`、生产 `noteNone` 为 0、`expose` 为 false。不能把它写成产品三视图已经激活，也不能写成 epoch 与门的生命周期已经接通。应用菜单仍是整个应用一份。`window-all-closed` 仍调用 `app.quit()`。

还没有的部分：同一个对象到达门的路径；换代、退役、关闭、renderer gone 对这扇门的通知；进门前丢掉旧代和旧窗口；floor 的唯一条件提交入口；关闭之后怎样保证不再碰 Menu；窗口若在同一进程重开时，已销毁的门是否恢复。

## 已有与未来候选

| 事项 | 当前代码 | 未来候选（未批准实施） |
| --- | --- | --- |
| attach 先于 `loadURL` | 已有。`window.ts` 第 24–25 行 | 保持。不单列成新任务 |
| 槽表 | epoch 闭包里一张 Map | 继续这一张。不建第二张 |
| 谁创建实例 | `index.ts` 创建，只传给窗口 | 仍由 `index.ts` 创建一次 |
| 门的主人 | `installApplicationMenu` 闭包 | 仍在这个闭包。不升成模块单例 |
| 生产 `noteNone` | 0 次 | 接通之后，换代和退役才会调用。这会改变 C 的「次数为 0」 |
| 生产三视图 | 不提交 `original` / `contrast` / `translation` | 本桥接仍只请求 none。三视图留在更后的笔 |
| `expose` 与 handler | false，无 handler | 本桥接不加。S2c 另批 |
| floor 写入 | 只有 `openNext` 归零 | 增加一个条件入口。生产 handler 仍不调用 |
| `composition-root.ts` | 零 diff 约束仍在 | 候选甲要改它。待决定，本笔不改 |

## 推荐方案与候选代价

推荐候选甲，供审查。它还不是实施批准。

候选甲：显式注入同一个实例。`startDesktop` 先 `createViewMenuEpoch()`，把这个对象传给 `startMainLogger`，再传给 `createMainWindow`。`startMainLogger` 只把它传进 `startLibrary`。菜单安装闭包拿这个对象绑定桥接，然后窗口才 `attach` 与 `loadURL`。依赖方向是装配根注入，epoch 不 import 门，门不 import epoch。

代价：`composition-root.ts` 出现 diff。这和已合 seam「它的 diff 是 0」冲突。放开的范围若被接受，只应是把已创建的那一个对象作为参数传入 `startLibrary`，以及 `index.ts` 把创建提前到两次使用之前。不含 handler、expose、codegen、菜单形状或第二张表。`startLibrary` 增加可选的第三个参数，现有两个参数的调用保持今天的行为。

候选乙：把 `startLibrary` 从 `composition-root.ts` 挪到 `index.ts`，装配根只留 logger 与 `wireIpc`。生产上也能共用一个对象。代价更高：文献库装配离开现在的位置，`composition-root.ts` 仍然有 diff，零 diff 同样不成立。只有甲被拒绝、同时又要生产接通时才考虑。

候选丙：维持 `composition-root.ts` 与 `index.ts` 的生产调用零 diff。两份对象继续分开。可以另批一个不进生产的端口和测试，但那不是「生产上已经接通」。不能把未传入的参数写成生产已经共用实例。

否决，不作为候选去实施：模块级 `let` 或可变单例把 epoch 或门挂到模块上（[ARCHITECTURE.md](../../ARCHITECTURE.md) F-06，[RULES.md](../../RULES.md) §1.1）；第二张 epoch 表；handler 或桥接直接改槽 Map；用 IPC payload 里的 epoch 或 generation 当作槽上的代次；为了避开 `composition-root.ts` 再包一层全局查找。

## 待 Wisdom 决定

下面各项没有被 7082976061 批准。计划里写出来，是为了让审查能决定，不是已经可以开工。

1. 是否放开 seam 对 `composition-root.ts` 的零 diff，只允许候选甲的那一次参数传递。不放开就不能做生产接通，应停在候选丙，并明确生产仍是 `unbound`。
2. 下一笔代码是否包含 epoch 上的 `commitFloor` 入口。推荐包含：入口和测试一起落地，生产调用次数保持 0，避免 S2c 以后直接改 Map。若要留到 S2c，本桥接就不提供写入函数，并在 S2c 计划里再次写明唯一入口。两种都尚未批准。
3. 同一进程里窗口关闭后再开时，已经 `setDestroyed(true)` 的那扇门是否允许绑回。当前 `window-all-closed` 调用 `app.quit()`，进程内重开不是现行路径。未决定之前，关闭不自动复活门，避免关闭之后又碰 Menu。
4. 实施批准必须点名 `view-menu-wiring.test.ts`。接通后第一次 `oi-app:` commit 会调用 `noteNone`，现有「生产 `noteNone` 为 0」不再描述接通后的行为。未点名就停，不悄悄改这条断言。
5. 若审查认为过期代次必须由门自己拒绝，而不是由桥接在调用 `noteNone` 之前丢掉，那就要改 `view-menu-gate.ts`。这是范围扩大。未另批就不改门。

没有可执行验收的路径不写成已批准。生产同一实例的验收依赖第 1 项。窗口重开的验收依赖第 3 项。

## 所有权与时序

三份职责，各在自己的闭包或文件里：

- epoch 拥有唯一槽表，以及将来的快照通知和 `commitFloor`。它不调用 Menu，不 import 门。
- 菜单门拥有已提交镜像、`known` / `unknown`、至多一个 pending、销毁标志。它不读槽表。
- 新的桥接只做翻译：把 epoch 发出的普通快照变成对这一扇门的 `noteNone` 或 `setDestroyed`。它不保存第二份代次，不写 floor，不建菜单，不派发视图事件。

通知顺序：

1. `webContents` 事件进入已经存在的 `reduceViewMenuSlot`。监听仍在 `loadURL` 之前挂上。
2. 更新唯一槽，或在 `closed` 时删槽。
3. 只有阶段、epoch 或槽的有无发生变化，才同步发出不可变快照。same-document、非主 frame 的失败、尚未公开时的非 `oi-app:` 导航不发菜单通知。
4. 桥接立刻再 `read` 同一个 id。与快照不一致就返回。这次返回不调用 `noteNone`，不写 floor，不派发。
5. `closed`：先 `setDestroyed(true)`，不调用 `noteNone`。删槽已经在第 2 步完成。之后这扇门的替换、生命周期 none 和 click 都不再碰 Menu。
6. 新的 `open`（含第一次成功的 `oi-app:` commit，epoch 变为 1，floor 由换代归零）以及退役（离开 `oi-app:`、主 frame provisional failure、renderer gone）：调用 `noteNone`。记号由这份快照的窗口 id、阶段和 epoch 组成，不从 payload 读取。
7. 门按已合语义处理 busy、至多一次额外替换、最新 pending 和 `unknown`。桥接不再包一层成功标志。
8. floor 不在第 1–7 步写入。

第一次 commit 不丢，靠的是：订阅发生在 `loadURL` 之前，而 attach 已经在 `loadURL` 之前。订阅加在 epoch 对象上，窗口尚未创建时也可以先订上；第一次 `store` 发生时监听已经在。不要把订阅放到 `loadURL` 之后。

旧代和旧窗口：桥接在进门前丢掉。不能依赖门来挽回，因为 `noteNone` 会覆盖 `currentMark`。已经进门的那一次仍由门的记号和 pending 收口；更晚的旧快照不再发起第二次调用。

`commitFloor` 若被放进下一笔，是 epoch 上的唯一写入函数。调用前用当时的槽重新核对：窗口 id、阶段 `open`、epoch 相等、generation 是 1 到 `Number.MAX_SAFE_INTEGER` 的整数且严格大于地板。任一失败在写入前返回，槽不变。它不接收「请把地板设成这个数」而不核对。handler 将来只能调用这个函数，不能拿到 Map。生产上的调用者仍不存在；S2c 另批之后，才在门返回且最终结果仍是同一份快照时调用一次。结果不是那份快照，就不调用。

失败与恢复沿用已合的门：替换或后置核对抛错，记失败而不是 `known`；busy 时新的生命周期 none 留下最新 pending；额外替换至多一次；那一次期间 pending 再变就停在 `unknown`。桥接不把 Promise 拒绝改成成功，也不吞掉后自己标成已同步。真实平台上的 Menu 失败和 Node 假端口的失败分账。

`startLibrary` 继续同步返回原来的命令表。`postCheck` 仍在 `replace` 的 await 之后。安装完成前的 click 仍返回 0，不排队，不重放。文件、历史和缩放仍走原来的 `void dispatchMenu`。`expose` 保持 false。本桥接不调用 `submit("original" | "contrast" | "translation")`。

## 未来文件边界与估算

下表是候选实施的职责和点估计，不是本 PR 的白名单，也不是已经批准的改动。行数只统计。现行 [RULES.md](../../RULES.md) §1.6、§1.7 与 [ARCHITECTURE.md](../../ARCHITECTURE.md) §6 不把 600 当作机械停工线，也不把这里的估计当作新的硬上限。估计超出而职责和范围没变，不停工，只在当次说明里写实际数。要停的是：接口、所有权或文件范围变了；依赖或工具缺失；失败路径没有可执行验收。PLR0915 的语句数 80、圈复杂度 15、C901、依赖方向、密钥、许可证、格式、类型和测试都不放松。不把多个职责堆进一个文件，不为每个小函数建文件，也不把共享同一块可变状态的拆分叫作解耦。

一个文件一种职责。参数 4 个仍是评审口径。eslint 没有 `max-params`。不写顶层 `let`。

| 文件 | 现在 | 只做 | 点估计新增+删除 | 未知 |
| --- | --- | --- | --- | --- |
| `view-menu-epoch.ts` | 128 | 同一闭包里的快照通知与 `commitFloor`。不调用 Menu | 110 | 格式化后的空行和分支展开。不记 0 |
| `view-menu-lifecycle.ts` | 无 | 快照到 `noteNone` / `setDestroyed`。进门前丢旧代 | 100 | 第 3 项决定若要求复活门，增量不记 0 |
| `index.ts` | 60 | 创建一次，分给装配与窗口。仅候选甲 | 12 | 候选丙则生产接通不改它 |
| `composition-root.ts` | 27 | 只传递收到的实例。待决定 1 | 8 | 未批准时本文件保持 0 |
| `library-wiring.ts` | 375 | 可选接收同一实例，在现有闭包里绑定。同步返回不变 | 40 | 调用点若必须改签名，测试 diff 另计，不记 0 |
| `window.ts` | 27 | 保持 attach 然后 `loadURL` | 0 | 已完成的顺序不估成新工作 |
| `view-menu-gate.ts` | 427 | 候选实施不改 | 0 | 待决定 5 若成立，另估，不记进本列 |
| `view-menu-lifecycle.test.ts` | 无 | 同一实例、首 commit、旧代、关闭、renderer gone、floor 入口的行为 | 220 | 重开用例随第 3 项，不记 0 |
| `view-menu-epoch.test.ts` | 206 | 补通知与 `commitFloor` 的拒绝。保留原用例 | 90 | 不记 0 |
| `view-menu-wiring.test.ts` | 468 | 生产路径的同一实例。会改掉现在的 `noteNone === 0`。待决定 4 | 50 | 未点名则不改，实际是 0 |

候选甲且五项决定都按推荐落地时，上表点估计合计 630。这是统计，不是门禁。未知项在合计之外，不写成 0，也不先加成「已经超过所以停」。生成物、CI、锁文件和规格的计划 diff 是 0；若实施时出现，停下来报告。

零 diff 的候选清单，在对应决定作出之前：`view-menu-gate.ts`、`view-menu-mirror.ts`、`library-menu.ts`、`window.ts`、renderer、`shell.tsx`、`use-view-mode.ts`、handler、`expose`、三份生成物、`packages/contracts/**`、CI、依赖、环境、DESIGN 与设计原则、已合 seam 与 C 计划。`composition-root.ts` 在决定 1 之前也是零 diff。

## 未来验收

只写设计，本笔不跑。载体是行为：假端口或受控的 epoch 事件进生产函数，看随后的菜单替换、floor 和派发。不断言源码字符串。Node 纯桩、官方 CI、真实 Electron 和用户真机分开记账。A 的 `_menuWillShow` 与 B 的门状态机不能代替这条生产接通。

| 编号 | 通过时能看见 | 不能拿来冒充 |
| --- | --- | --- |
| L1 同一实例 | 窗口 attach 产生的槽，能被菜单安装时绑上的那个对象 `read` 到。生产路径在决定 1 之后才成立 | 两个分别 `createViewMenuEpoch()` 的对象 |
| L2 首 commit 不丢 | 订阅早于 `loadURL`。第一次成功的 `oi-app:` 导航得到 epoch 1，并发生一次生命周期 none。attach 仍在 `loadURL` 之前 | 只证明 attach 顺序，却没有这次 none |
| L3 旧代旧窗口 | 迟到的旧快照不调用替换，不写 floor，不派发 | 进门之后再靠覆盖记号「修回来」 |
| L4 生命周期 none | pending 只来自这次仍有效的生命周期快照。`closed` 之后替换次数不再增加 | 用全未勾的 radio 表示 none |
| L5 floor | 唯一入口在核对通过且调用者看到的最终结果仍是同一快照时写一次。失败在写入前返回。生产 handler 调用次数是 0 | 入口单测写成生产提交已经写了地板 |
| L6 门的收口 | busy、至多一次额外替换、最新 pending、`unknown` 仍由已合的门完成。桥接不增加第三轮替换 | 重跑整份 B 来代替桥接用例 |
| L7 真实拒绝 | 端口拒绝或后置核对失败后，安装不是 `known`，也不报告同步成功 | `catch` 之后自己标成功 |
| L8 原入口 | `startLibrary` 同步返回命令表；`postCheck` 在 await 之后；早到 click 为 0 且不重放；其他栏目不进门 | 为了绑定 epoch 改掉这些观察 |
| L9 分账 | 纯桩与 CI 只证明自己跑到的层。真实菜单、真机、Alt、F10、访问键、读屏仍未验 | 源码里有 `setApplicationMenu` 就写成画面已验 |

none 的可观察结果仍是三个普通项、没有勾。活动三模式仍是三个 radio 且恰一勾。本桥接不提交活动模式。换代和退役请求 none。`closed` 删槽并且不再碰 Menu。旧提交不写入新镜像。

C 已经证明的启动 none、早到 click 和负向 fail-closed 可以沿用为回归，不为这份计划重跑。接通之后「生产 `noteNone` 为 0」这条预期要按决定 4 改写，不能同时要求接通和永远 0 次。

## 失败验收与暂停

下一笔实施出现下面任一情况就停，报告，不自行扩大：

- 决定 1 尚未作出，却要改 `composition-root.ts`，或用单例、第二张表绕过它。
- 决定 3 尚未作出，却要在关闭之后清除 `destroyed`。
- 决定 4 尚未点名，却要改 `view-menu-wiring.test.ts` 的 `noteNone` 预期，或接通后测试仍要求生产次数为 0 而导致无法验收。
- 决定 5 尚未作出，却要改门的公开入口或内部 Map。
- 需要 handler、`expose: true`、codegen、renderer 上报、E2 或 S3 才能把本桥接说成完成。
- 失败路径只能靠阅读源码证明，没有菜单次数、floor 或派发次数可断言。
- 工具或依赖缺失。不安装、不改环境、不下载 Electron。
- 把纯桩通过写成真实平台菜单或产品三视图通过。

估计数字本身不触发暂停。

## 设计来源

栏位切换是支持阅读的能力，放在系统原生菜单里，不新增控件、页面或弹窗。[docs/design-principles.md](../design-principles.md) P3、P4 与功能放置表把「栏位切换」放在「视图」菜单；P7 要求条件来自 seam 返回的数据。菜单形态沿 [DESIGN.md](../../DESIGN.md) §4.10 的 11.1：mac 是「显示」里的原文 / 对照 / 译文，Windows 是「视图(&V)」。本计划不改这些句子，也不新做 UI。

已合 seam 的「仍然成立」和「文档代」仍是行为来源：none 用普通项且不写 checked；活动模式用 radio 且恰一项 checked；全未勾的 radio 会在 `MenuWillShow` 时勾上第一项，所以不能用它表示 none；换代或退役请求 none；`closed` 删槽并且不再碰 Menu。

Loom 2026-11-23 01:39 的最小只读原则核查，随本任务作为设计输入：生命周期所有权和菜单桥接是支持阅读主路径的内部能力，让原生菜单反映当前有效文档；不新增控件、页面或弹窗；none 是三个普通原生项且无勾；活动模式是三个 radio 且恰一勾；不用全未勾的 radio 冒充 none；换代和退役请求 none；closed 删槽且不再碰 Menu；旧提交不污染新镜像；失败不冒充同步成功。Issue #174 在 7082976061 之后没有另一条评论，本计划不编造 Loom 的评论号。该结论不授权新 UI，也不授权实施。

[PRD.md](../../PRD.md) §8 仍按可观察证据退出里程碑。本计划不把 C 的合入或 CI 成功写成 M2 完成。8 GB Windows 与 M1 录屏仍是 M2 的退出条件，本笔不跑，也不豁免。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 核对 main 的 SHA、parent、tree，并重读 epoch、窗口、装配和门 | 与文首一致。attach 已在 `loadURL` 之前。生产门与 epoch 不是同一对象 | 本文件 |
| 2 | 只新增本计划 | 本提交 | 本文件 |
| 3 | 只追加尚未入仓的四笔批准、PR #232 合入同步、本笔授权，并重算页脚 | 下一提交 | `docs/approvals.md` |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 本轮只写计划和台账 | 原话只批准新增计划和补记，先审计划 | 2026-11-23 01:36 | Wisdom，[7082976061](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7082976061) |
| 推荐候选甲，零 diff 仍待决定 | 同一个实例要穿过现有装配边界。seam 的零 diff 未被本句放开 | 2026-11-23 | 本计划。待 Wisdom 决定 1 |
| 过期快照在进门前丢掉 | `noteNone` 会改写当前记号。门不增加识代接口 | 2026-11-23 | 本计划。待决定 5 可以推翻 |
| `commitFloor` 默认放在下一笔但生产不调用 | 避免以后 handler 改 Map。S2c 仍另批 | 2026-11-23 | 本计划。待决定 2 |
| 关闭不自动复活门 | 现行路径是 `app.quit()`。未决定的重开不碰 Menu | 2026-11-23 | 本计划。待决定 3 |
| 不改 seam 分批顺序 | seam 没有要求本桥接先于 S2c-prep | 2026-11-23 | 本计划。Forge 排序，非业主决定 |

## 风险

- 把候选甲写成 7082976061 已经批准改 `composition-root.ts`。
- 用模块单例或第二张表避开待决定 1。
- 把已经完成的 attach 顺序再实现一遍，或把 C 的启动 none 写成完整生命周期。
- 接通后仍保留「生产 `noteNone` 永远为 0」，使第一条真实导航无法验收。
- 让 payload 自报代次，或让 handler 改槽 Map。
- 用源码字符串、B 的 fake 或 A 的 native 冒充生产接通和真实菜单。
- 把 PR #232 的 head CI 与合入后的 main push CI 记成同一次，或把历史失败改写成首次全绿。
- 为了行数删用例、压格式，或关掉 PLR0915 与圈复杂度。

## 自检

- [x] 影响 arch / prd 吗？不影响。五份规格、已合 seam 和已合 C 计划都不改。
- [x] 本提交没有产品代码和测试代码。

## 给下一笔的交接

先读本文件。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

Forge 审过这份计划，并且 Wisdom 另写实施范围、同时回答上面的待决定项之后，才从当时的官方 main 开新的 `feature/` 分支。本文件的存在不是实施批准。未点名的文件不改。决定 1 未放开时不改 `composition-root.ts`。不改门，除非决定 5 另批。不写 handler，不改 `expose`，不跑 codegen，不做 E2 或 S3，不激活产品三视图。

保持 attach 先于 `loadURL`。保持 `startLibrary` 同步返回、异步 `postCheck`、早到 click 为 0 且不重放。none 仍是三个普通项且无勾。关闭删槽且不再碰 Menu。floor 只从唯一入口、在最终仍有效的同一快照上写。旧代旧窗口不提交镜像、不写 floor、不派发。

纯行数只统计。不写 `G12:` 换通过。不压格式，不删测试。PLR0915、圈复杂度、C901、依赖和安全门禁不关闭。缺工具就停，不补环境。不操作真机，不标 Ready，不合入，不发版。
