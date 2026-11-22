# 执行计划

单窗口生命周期 none 桥接，以及已经进门的旧 click 在派发前被拦住。本文件是本批的统一真相源。它写清目标、边界、文件职责、待审接口和验收。本轮只写文档和台账。产品代码和测试代码还没有写，下面的行为都还没有跑，不标通过。

分支 `feature/view-menu-lifecycle-none-174`。从 PR #233 合入后的官方 main `e70ec91a673cb2784491bb02924d77b96a05b147` 另开，独立 worktree `/home/ubuntu/worktrees/feature-view-menu-lifecycle-none-174`。该 commit 的唯一 parent 是 `e62e0d4207f94f93360a6ffcf9c822c965805f96`，tree 是 `3270b2bed76595084025fa7a697e23aa2caf841d`。2026-11-23 核对时 `origin/main` 仍是这个 SHA 和 tree，git author 与 committer 都是 `2026-11-23T02:33:01+08:00`。GitHub PR #233 的 `merged_at` 是 `2026-11-22T18:33:02Z`，换成 Asia/Shanghai 是 02:33:02。同一 merge commit，不把它当成 main 漂移。不沿用已合的 `feature/view-menu-lifecycle-ownership-plan-174`。不 reset、不 amend、不 rebase 已推提交，不改其他分支，不删分支。

Wisdom 2026-11-23 02:42 Asia/Shanghai 原话：「批准按刚列明的十份源码/测试文件及限定文档范围，从PR233合后main推进单窗口生命周期none桥接与旧点击防护：允许候选甲仅composition-root参数转交例外、gate派发前同步代次校验和对应接通测试更新；commitFloor延后，不自动复活、不开放handler/三视图/翻译。允许建隔离feature分支/worktree，先更新计划、精确例外与台账，经Forge审查后编码、范围内修正、必要测试及Anvil独立QA；普通依赖仅按锁装入隔离环境，现有GitHub CI可在官方隔离runner执行已有安装和测试步骤。Cloud/Box不下载或启动真实Electron/native，不操作用户机，不改CI/依赖清单/锁或其他架构约束；范围需扩大或必要验证越界就停止并保留未验及全部历史记录。最终保持Draft，不Ready、不合入、不发版，等我醒来决定。」来源是 [Issue #174 评论 7083807265](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7083807265)。这是本批实施的授权。计划与台账先写。Forge 对 `91770f83d16503b8508fa7fa0544ac9eeab6298f` 给出 PASS with nits、必要 BLOCK 0 之后，同一分支按这十个文件写了实现。Node 纯桩见 `docs/evidence/234`。真实 Electron、真机和完整门禁仍未跑。Draft 不离开。

附件里的「待批准」已经被这句原话取代。原话与附件冲突时以原话为准。官方 CI 的既有安装和测试步骤可以在 GitHub 隔离 runner 上照常执行。这个许可不到 Cloud 或 Box，也不到用户机。附件不授权白名单以外的文件或环境操作。

本任务受 UI 与业务核心解耦约束：[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1 与 [RULES.md](../../RULES.md) §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本轮任务类型：不适用（纯文档）。Forge 审查通过之后的编码任务落在 desktop main 的菜单装配，不改 core，不改 renderer。五份规格正文不改：[PRD.md](../../PRD.md)、[ARCHITECTURE.md](../../ARCHITECTURE.md)、[RULES.md](../../RULES.md)、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)。不改 [C 计划](feature-view-menu-startup-none-c-plan-174.md)。[所有权计划](feature-view-menu-lifecycle-ownership-plan-174.md) 只加决定状态指针，保留当时的待决定原文。[seam](feature-reader-view-menu-seam-174.md) 只在文末追加本批例外，不改上文原句。

## Goal

生产启动路径上只有一个 epoch 对象。窗口和菜单门共用它。已经有效 commit 之后的换代、退役和 renderer gone 变成这扇门上的生命周期 none。从未有效 commit 的 retired epoch 0 不调用 `noteNone`。每次 attach 有终态栅栏：`closed` 无论有没有槽都通知，发布之前就拒绝同一来源重建槽或进入 Menu；已绑定 owner 的 `closed` 始终 `setDestroyed(true)` 并退订，不因 `read` 又看到槽而取消。已经停在异步等待上的旧 click，在进入 `ports.dispatch` 之前发现代次变了，就返回 0 且不调用 dispatch。最新 pending 的修复仍可成为 `known`。失败尝试仍是 `unknown`。

本批不声称完整生命周期已经实现。`commitFloor` 延后。关闭后不自动复活。不开放 handler、三视图或翻译提交。

## Context

行号取自 tree `3270b2bed76595084025fa7a697e23aa2caf841d`。以后实施按当时的 base 重读，不按旧行号硬改。

已经在代码里的行为：

- `startDesktop` 先 `startMainLogger()`，再 `createMainWindow(createViewMenuEpoch())`（`apps/desktop/src/main/index.ts` 第 34–38 行）。这两次用的不是同一个对象。`window-all-closed` 仍调用 `app.quit()`（第 22–24 行）。
- `startMainLogger` 用 `startLibrary(app.getPath("userData"))` 装配命令表（`apps/desktop/src/main/composition-root.ts` 第 13–26 行）。这次调用没有 epoch。
- `createMainWindow` 先 `epoch.attach(win)`，再 `loadURL`（`apps/desktop/src/main/window.ts` 第 16–26 行）。attach 已经在 `loadURL` 之前。本批不重做这个顺序，`window.ts` 的 diff 保持 0。
- epoch 的公开面只有 `attach` 与 `read`（`apps/desktop/src/main/view-menu-epoch.ts` 第 11–14 行）。唯一槽表在 `createViewMenuEpoch` 的闭包里。成功的 `oi-app:` `did-navigate` 经 `openNext` 变成 `open`、epoch 加一、floor 归零（第 108–116 行）。非 `oi-app:` 且已经 `open`、主 frame 的 provisional failure、`render-process-gone` 都退役，退役保留原来的 epoch 和 floor（第 118–120 行）。`closed` 只 `slots.delete(id)`（第 77–79 行）。没有订阅。没有 floor 提交入口。`openNext` 写的 floor 0 是换代归零，不是接受凭证。
- `store` 在 Map 里没有该 id 时，用 `blankViewMenuSlot()` 再 reduce（第 82–88 行）。删槽之后同一 id 若再收到 `oi-app:` 导航，会从 unpublished epoch 0 变成 `open` epoch 1。这就是关闭前那个 epoch 数字被重用的现有路径。本批在同一个闭包里用终态栅栏拦住它，不改 `window.ts`。
- `startLibrary` 同步返回命令表。安装是 `void installApplicationMenu().catch(() => undefined)`（`apps/desktop/src/main/library-wiring.ts` 第 45–55 行）。门在这次安装的闭包里创建（第 136–160 行）。生产记号是 `unbound`。生产路径调用 `noteNone` 的次数是 0。三个视图 click 进门并接住拒绝。其他栏目仍是 `void dispatchMenu`。
- 门的公开入口是 `submit`、`noteNone`、`click`、`setDestroyed`（`apps/desktop/src/main/view-menu-gate.ts` 第 19–27 行）。端口是 `replace`、`postCheck`、`dispatch`（第 11–17 行），都不接收 click 开始时的记号。`noteNone` 在第 104–108 行同步改 `currentMark` 和 pending；忙时直接返回。`click` 在第 155–156 行记下 `shapeAtStart` 与 `markAtStart`。`clickCandidate` 在第 224 行会因记号变化拒绝 click 自己的形状。`settle` 在第 256–274 行可以把最新 pending 收成 `none` 且 `known`；修复期间 pending 再变则 `keepUnknown`。`dispatchRequested` 在第 331–345 行调用 `ports.dispatch` 之前不比较 `markAtStart`。`dispatchAllowed` 在第 368–378 行只看销毁、形状、`known`、pending 和事件是否属于该形状。`setDestroyed` 只写布尔值（第 91–93 行），没有把它改回 false 的路径。
- `viewSlotDescriptions("none")` 只返回原文、对照、译文的 label 与 event，没有 type 或 checked（`apps/desktop/src/main/view-menu-mirror.ts` 第 32–34 行）。三种活动形状是 radio，且恰有一项 `checked: true`（第 35–41 行）。
- `packages/contracts/src/ipc/shell.ts` 的 `expose` 仍是 false。仓库里没有 `view-menu-handler.ts`。生产没有人做 floor 的条件提交。
- 装配测试从 `startLibrary(dataRoot)` 进入，并期望安装完成前 `noteNone` 为 0（`apps/desktop/test/view-menu-wiring.test.ts` 第 179–198、314–319 行）。`open-document-wiring.test.ts` 与 `reading-asset-protocol.test.ts` 也调用 `startLibrary`。这两个文件不在本批白名单，必须继续能用现在的参数调用。

因此当前 C 只是启动 none、记号 `unbound`、生产 `noteNone` 为 0、`expose` 为 false。不能把它写成产品三视图已经激活，也不能写成 epoch 与门已经接通。应用菜单仍是整个应用一份。

[所有权计划](feature-view-menu-lifecycle-ownership-plan-174.md) 合入文本的第 75 行把「旧 click 不派发」写成 L3。同文件验收表里，L3 是还没进门的旧代，L10 才是同为 none、已经停在 await 上的旧 click。本文件的交叉引用用 L10。不改那一行原文。

Loom 已做的原则核查沿用所有权计划里的记录：none 是三个普通项且无勾；活动模式是三个 radio 且恰一勾。本批不新增页面或控件。栏位切换仍放在系统原生菜单里。[DESIGN.md](../../DESIGN.md) §4.10 的 11.1：mac 是「显示」里的原文 / 对照 / 译文，Windows 是「视图」。[docs/design-principles.md](../design-principles.md) P3、P4 把栏位切换放在「视图」菜单，P4 要求优先原生控件，P7 要求条件来自 seam 返回的数据。本批不改这些句子。

[PRD.md](../../PRD.md) 指向的 [docs/prd/08.md](../prd/08.md) 仍按可观察证据退出里程碑。本计划不把文档 Draft、CI 成功或 C 的合入写成 M2 完成。8 GB Windows 与 M1 录屏仍是 M2 的退出条件，本批不跑，也不豁免。

## Constraints

五件已经由 7083807265 回答。所有权计划里的「待决定」原文保留，实施以本节为准。

1. 候选甲。`index.ts` 只创建一次 epoch，把它交给 logger 装配，也交给窗口。`composition-root.ts` 只做参数、类型导入，以及把这个对象转交 `startLibrary`。不把装配职责迁走。不建全局 singleton，不建第二张代次表。`startLibrary` 的旧两参数路径保持今天的行为。seam 文末已追加这一处例外。seam 上文的零 diff 原句不改，继续约束 S2c-on、E2、S3 和其他未点名文件。
2. `commitFloor` 本批延后。不加提交入口，不加公开 `currentMark` getter，不加接受回执或凭证接口。不新增生产上的条件 floor 提交调用。`openNext` 的换代 floor 归零和 `retire` 的 floor 保留都保持。没有新的写者，不等于禁止这次原有的归零。
3. 不实现关闭后的自动复活，也不做同进程重开路径。不调用 `setDestroyed(false)`。`window-all-closed` 仍是 `app.quit()`。`will-quit` 仍只 `main.close()`。终态栅栏和「`closed` 始终销毁」写在下面的接口节。只删掉「`read` 又有槽则不销毁」并不够：嵌套的 `slot` 仍会先 `noteNone`，记号可以再变成同一个 `id:open:1`。
4. `view-menu-wiring.test.ts` 可以更新「传入共享 epoch，并且有效生命周期已经接通」之后必然变化的 `noteNone` 次数和行为。未注入 epoch 的现有调用、第一次 commit 以前的 0 次断言，以及其他安全断言保留。不放宽测试来换绿灯。
5. 门在调用 `ports.dispatch` 之前同步比较 `currentMark === markAtStart`。比较到这次调用之间没有 await。不相等就不调用 dispatch。保留最新 pending 的修复和 `known`，不丢这份状态，不增加第三次替换。已经进入 `ports.dispatch` 之后的换代不撤回那一次端口调用。返回值不是新代的接受凭证。门不 import epoch。公开端口不加参数。

未来源码和测试只允许这 10 份：

- `apps/desktop/src/main/view-menu-epoch.ts`
- `apps/desktop/src/main/view-menu-lifecycle.ts`（新增）
- `apps/desktop/src/main/index.ts`
- `apps/desktop/src/main/composition-root.ts`
- `apps/desktop/src/main/library-wiring.ts`
- `apps/desktop/src/main/view-menu-gate.ts`
- `apps/desktop/test/view-menu-epoch.test.ts`
- `apps/desktop/test/view-menu-lifecycle.test.ts`（新增）
- `apps/desktop/test/view-menu-wiring.test.ts`
- `apps/desktop/test/view-menu-gate.test.ts`

其他产品文件和测试文件的 diff 是 0。文档只允许本文件、所有权计划的决定状态、seam 的本批例外、[docs/approvals.md](../approvals.md)，以及本 Draft 实际编号下的 `docs/evidence/<PR号>/commands.md`。需要任何额外文件、公开端口或所有权范围，就停下来报告。

根上的架构约束不泛化解除。[RULES.md](../../RULES.md) §1.6、§1.7 与 [ARCHITECTURE.md](../../ARCHITECTURE.md) §6 把行数当统计。下表的数字是点估计，不是实测 numstat，也不是新的硬上限。不恢复 600 停工线，不写 `G12:` 换通过，不压格式，不删测试，不关 PLR0915、圈复杂度 15 或 C901。估计超出而职责没变，不停工，只在当次说明里写实际数。要停的是：接口、所有权或文件范围变了；依赖或工具越界；失败路径没有可观察断言。

一个文件一种职责。参数 4 个仍是评审口径。eslint 没有 `max-params`。不写顶层 `let`（[docs/arch/05-02.md](../arch/05-02.md) F-06）。测试只断言行为，不做源码字符串断言（F-08）。

同时最多三个代码互不影响的 feature。开工时打开的 PR 是 0 个。本批只开这一个 Draft。

## 文件职责与增删点预算

| 文件 | 现在 | 只做 | 点估计新增+删除 | 未知，不记 0 |
| --- | --- | ---: | ---: | --- |
| `view-menu-epoch.ts` | 128 | 同一闭包增加普通不可变快照通知、订阅，以及每次 attach 的终态。不调用 Menu，不加 floor 入口，不加公开 getter | 90 | 终态若必须变成公开读取或第二张代次表，就停，不另计成偷偷加接口 |
| `view-menu-lifecycle.ts` | 无 | 把同一对象的快照译成 `noteNone` 或 `setDestroyed`。先验证再绑定。从未有效 commit 的 retired epoch 0 不进 `noteNone`。`closed` 始终销毁 | 130 | 信任来源若必须改 `window.ts` 或新增 owner 读取端口，就停 |
| `index.ts` | 60 | 提前创建一次，分给 logger 装配和窗口 | 12 | 出现别的启动或窗口策略就停 |
| `composition-root.ts` | 27 | 参数、类型导入、一次转交 | 8 | 除这三件事以外的职责变化就停 |
| `library-wiring.ts` | 375 | 可选第三参数。有 epoch 时在现有安装闭包里绑定生命周期。同步返回不变 | 40 | 必须改其他公开调用签名或 handler 注册就停 |
| `view-menu-gate.ts` | 427 | 内部把 `markAtStart` 传到最终派发前比较 | 30 | 需要公开 getter、接受凭证或改端口参数就停 |
| `view-menu-gate.test.ts` | 526 | 跨 await 同为 none，以及已经进入 dispatch 后的换代 | 70 | 夹具和异步控制的长度 |
| `view-menu-lifecycle.test.ts` | 无 | 同一对象、快照顺序、过期、退役、关闭、无槽 closed、重入、迟到、epoch 重用、两类初始失败、未绑定与已绑定 | 240 | 真实装配链用纯桩覆盖 index 到 `startLibrary`。要改其他测试文件就停 |
| `view-menu-epoch.test.ts` | 206 | 通知、首 commit、退役、无槽 closed、终态拒绝重建。不做 `commitFloor` | 100 | 保留旧 reducer 用例 |
| `view-menu-wiring.test.ts` | 468 | 可选注入后的同步返回、异步安装和 click。只改接通后必然变化的次数 | 50 | 未注入路径仍是 0 |

上表合计 770。这是统计，比上一稿多出的部分是终态栅栏、`attached` 通知和两类初始失败验收。未知项在合计之外。不恢复 600 停工线。`window.ts`、mirror、菜单模板、renderer、contracts、handler、expose、codegen、CI、依赖、锁文件和五份规格的计划 diff 是 0。实施时若出现，停下来报告。

`open-document-wiring.test.ts` 与 `reading-asset-protocol.test.ts` 继续调用现在的 `startLibrary`。第三参数必须可选，缺省时行为与今天相同。本批不改这两个文件。若可选参数做不到这一点，停。

## 待审接口

下面的形状是 epoch 职责内的最小通知。它不是 floor 凭证，也不是门的接受回执。2026-11-23 Forge 首轮 BLOCK 之后，本节取代原先的三处写法：有槽才发 `closed`、`read` 又有槽则不销毁、第一份通知先绑定 owner。决策表里的旧行保留。规范以本节为准。审查通过前不按它开工。

```ts
export type ViewMenuNotice =
  | {
      readonly kind: "attached";
      readonly webContentsId: number;
    }
  | {
      readonly kind: "slot";
      readonly webContentsId: number;
      readonly phase: ViewMenuPhase;
      readonly epoch: number;
    }
  | {
      readonly kind: "closed";
      readonly webContentsId: number;
    };

export type ViewMenuEpoch = {
  readonly attach: (win: BrowserWindow) => void;
  readonly read: (webContentsId: number) => ViewMenuSlot | undefined;
  readonly subscribe: (
    listener: (notice: ViewMenuNotice) => void,
  ) => () => void;
};
```

`read` 仍返回带 floor 的槽，供以后的唯一写者使用。终态不是槽，`read` 对已终结的 id 返回 `undefined`。没有 `isSealed`、`ownerId` 或其他公开 getter。通知里没有 floor、generation、`known` 或「已接受」。`attached` 只携带这次 `attach` 拿到的 `webContentsId`，用来建立信任，不是 owner 读取端口。`subscribe` 返回退订函数。监听列表放在 `createViewMenuEpoch` 的同一个闭包里，跟那一张槽 Map 在一起。它不是第二张代次表，不是模块级 singleton，也不保存接受结果。

`attached` 不改 `window.ts`。订阅发生在 `createMainWindow` 之前，窗口 id 要等 `attach` 才存在。`window.ts` 的 diff 必须保持 0，所以 id 不能从窗口模块回传。`attach` 在第一次登记监听之后同步发出 `attached`，但要等下面的握手做完才返回。

### 谁拥有什么

- epoch 拥有唯一槽表和这份通知。它不 import 门，不调用 Menu。
- 门拥有已提交镜像、`known` / `unknown`、至多一个 pending、销毁标志和 click 的 `markAtStart`。它不读槽表，不 import epoch。
- `view-menu-lifecycle.ts` 只做翻译。`bindViewMenuLifecycle(epoch, gate)` 返回退订函数。它记住本扇门的 owner id，不保存第二份代次，不写 floor，不建菜单，不派发视图事件。
- `library-wiring.ts` 在已有安装闭包里，当第三个参数存在时调用这一次绑定。门仍是这次安装的局部对象。
- `composition-root.ts` 不创建 epoch，不订阅，不碰门。

记号由生命周期拼出来，形如 `${webContentsId}:${phase}:${epoch}`。阶段只有 `unpublished`、`open`、`retired`。epoch 数字不同，字符串就不同。同一个 id、同为 `open`、epoch 同为 1 时，字符串相同。关闭后若从 blank 再 `openNext`，就会重用关闭前的记号。终态栅栏拒绝这条重建，避免旧 click 把重用当成新代接受。记号不等于启动记号 `unbound`。payload 里的数字不参与。`attached` 与 `closed` 不拼这串记号，也不调用 `noteNone`。

### 每次 attach 的终态栅栏

栅栏在 `createViewMenuEpoch` 的同一个闭包里，和那一张槽 Map 放在一起。一个 id 只有三种内部情况：没有条目、有槽、已终结。已终结不存 epoch，不存 floor，不是 `ViewMenuSlot`。它不是第二张代次表，也没有公开读取函数。Map 的值是带标签的普通对象，标签只有「槽」和「已终结」。`read` 只在标签是槽时返回槽，否则返回 `undefined`。不用 `any`，也不做两次断言。

`closed` 在调用任何监听之前做完这些事，中间没有 await：

1. 该 id 的哨兵已经在：直接返回。不删哨兵，不重建槽，窗口事件本身不再发通知。握手那一次补投不算在这句里，见下一节。
2. 先把该 id 写成私有哨兵。禁止 `Map.delete` 把这个 id 删掉。删掉之后 `store` 会把它当成没有条目。
3. 槽的内容去掉。本来没有槽也一样。哨兵留下。
4. 然后发 `kind: "closed"`。没有槽也发这一份。若当时正在发 `attached`，还要记下握手欠着一次补投。

`store` 在取出当前槽、使用 blank、reduce、写回和发 `slot` 之前先看终态。已终结就返回。因此下面这些事不会发生：blank 重建、`openNext` 再得到 epoch 1、发 `slot`、生命周期调用 `noteNone`、进入 Menu。

这覆盖三类同一来源的事件：`closed` 通知里排在生命周期前面的监听同步重入导航；`closed` 返回之后才到达的导航、主 frame 失败或 renderer gone；attach 之后 Map 里从来没有槽就收到的 `closed`。只删掉生命周期里的 `read` 判断不够，因为重入的 `slot` 会在外层 `closed` 之前先 `noteNone`。

不调用 `webContents.removeListener` 当作栅栏。窗口已经 `closed` 时拆除监听可能碰到已销毁对象。拒绝发生在 `store` 入口。现有 epoch 测试双已经能在同一个假窗口上发出 `closed` 和 `did-navigate`。重入验收由通知里的监听再发这些事件，不新增公开入口。

### attached 与 closed 的握手

`read` 对「还没有槽」和「已终结」都是 `undefined`。桥接分不开这两件事，所以不用 `read` 判断终态，也不假设有 `isSealed`。终态只由 epoch 闭包里的私有哨兵表示。「尚未终结」也只由 epoch 在发出 `attached` 之前检查。

同一 id 再调用 `attach`：

- 哨兵已经在：拒绝。不解封，不删哨兵，不再 `on`，不发 `attached`。
- 监听已经登记过、哨兵还不在：幂等返回。不再 `on`，不发第二份可绑定的 `attached`。
- 第一次：每个事件只登记一次，然后进入下面的握手。这些回调里不再调用 `attach`，避免反复登记。

握手在同一次 `attach` 里做完，中间没有 await。`attach` 返回前，欠下的 `closed` 已经交给当时的桥接。

1. 发布侧确认这个 id 还没有哨兵，也还没有登记过监听。
2. 登记导航和 `closed`。
3. 复制当前监听列表，同步发 `attached`。这时还没有哨兵。
4. 这一轮按副本顺序调用，允许重入。先行监听可以在自己的 `attached` 里同步触发同一个窗口的 `closed`。
5. 那个 `closed` 先写哨兵、去掉槽，再嵌套发一轮 `closed`。`read` 变成 `undefined`。这一轮里桥接往往还没执行到自己的 `attached`，owner 仍是空，所以这轮不销毁、不退订。epoch 同时记下：这份正在发布的 `attached` 已经遇上真实 `closed`。嵌套那一轮不销毁，不等于把这次 `closed` 当成无关过期通知丢掉。
6. 副本继续。桥接到自己的 `attached` 时只验证两件事：id 是安全整数，当前还没有 owner。通过就绑定。不用 `read() === undefined` 拒绝这份 `attached`，因为那和正常未建槽相同，也和已经嵌套终结相同。`attached` 不调用 `noteNone`。
7. 这轮 `attached` 全部返回之后、`attach` 返回之前，若第 5 步记下了真实 `closed`，epoch 再开一轮新的 `closed`。新一轮使用返回当时的监听副本。桥接此时已经是 owner，所以 `setDestroyed(true)` 并退订。这发生在后续任何 Menu 调用之前。哨兵只挡住 `store`。门的 `destroyed` 要靠这轮补投才写上。只封印不等于门已经销毁。
8. 补投只做一次。通知仍是原来的 `kind: "closed"`，不增加字段，也不是 owner 回执。欠投只记在这一次 `attach` 调用的私有状态里，调用结束就不保留。这不是第二张代次表。补投不解封。其后窗口 `closed` 再进已有哨兵的回调，走终态节的第 1 步，不再发第三份。

与这次握手无关的 `slot` 或 `closed`（另一个 id，或这次 `attach` 开始之前就到的通知）仍然不抢 owner，不销毁。

生产上的轨迹是：epoch 上可以已有先行监听 L，桥接 B 后订。`attach` 的 `attached` 副本是 [L, B]。L 在 `attached` 里同步关掉窗口。嵌套 `closed` 时 B 还不是 owner。B 随后在外层 `attached` 里绑定。`attach` 返回前的补投让 B 销毁并退订。若接受外层 `attached` 却没有这轮补投，唯一的 `closed` 已经错过，门不会销毁。若因为 `read` 是 `undefined` 而拒绝外层 `attached`，门同样不会销毁。两头都要靠第 7 步合上。

### 何时发通知

槽的菜单通知在槽更新之后同步发出。中间没有 await。只有阶段或 epoch 数字发生变化，并且这次变化算菜单上的一次生命周期，才发 `kind: "slot"`。

有效 commit 指槽第一次变成 `phase: "open"` 且 epoch 大于等于 1。只有成功的 `oi-app:` 导航会这样。

- `attach` 返回前发 `kind: "attached"`。不写槽，不发 `slot`。
- same-document、非主 frame 的失败：reducer 不改变阶段和 epoch，不发。
- 尚未 `open` 时的非 `oi-app:` 导航：结果仍是未公开、epoch 0。即使这是第一次把槽放进 Map，也不发菜单通知。
- 主 frame provisional failure 或 renderer gone 作用在「还没有槽」或 unpublished epoch 0 上：reducer 仍得到 retired epoch 0，并写入槽。这不是有效 commit。不发 `kind: "slot"`。
- 已经 `retired` 再退役：阶段和 epoch 都没变，不发。
- 新的 `open`，包括第一次成功的 `oi-app:` commit：发 `kind: "slot"`。epoch 变为 1 时 floor 仍由 `openNext` 在槽内归零，通知不携带 floor。
- 已经有效 commit 之后离开 `oi-app:`、主 frame provisional failure、renderer gone：阶段变成 `retired` 且 epoch 仍是那次 open 的数字时，发 `kind: "slot"`。
- `closed`：见终态节。无槽也发。握手期间嵌套的那一次之外，`attach` 返回前可以再补投一轮，见握手节。哨兵留下之后，窗口事件不再发第三份。

`subscribe` 不重放已经存在的槽。生命周期在 `loadURL` 之前订上。`attached` 在 `attach` 返回前同步到达，仍早于 `loadURL`。第一次有效 commit 是更后面的 `slot`，不是补放。

### 订阅异常、顺序和清理

一次通知开始前，复制当时的监听数组。这一轮只按这份副本、按订阅顺序同步调用。

- 这一轮里新 `subscribe` 的监听不参加本轮，下一轮才参加。
- 这一轮里的退订从闭包列表移除。副本里还没调用到的监听，本轮仍调用一次。下一轮不再包含它。
- 每个监听放在自己的 `try/catch` 里。抛出不回滚已经写入的槽，不撤销已经写下的终态，不跳过副本里后面的监听，也不变成 `noteNone`、`known` 或一次派发。
- 接住是为了让同一次 `closed` 里的生命周期仍然执行。不是把失败报成菜单已经恢复。epoch 不记录、不上报、不重试，也不新增诊断通道。测试要看见的是：抛出的监听自己留下的记录、后面的监听仍运行、Menu 与 dispatch 没有因此变成成功。

生产上的生命周期回调本身保持同步，直到调用 `noteNone` 或 `setDestroyed`。只处理 `noteNone` 返回的那个 Promise：在它上面用成功和拒绝两个回调。拒绝回调不把安装改成 `known`，也不把同一次通知再放进队列。不在 `catch` 里再 `throw`，因为那会得到一个没人接的派生拒绝。也不把拒绝吞成空完成来假装恢复。不新造日志框架，不加 getter。测试断言的是这个原始 Promise 拒绝，以及 `known` 没有变成成功。

退订函数从那一个闭包的监听列表里移除自己。已绑定 owner 的 `closed` 处理完 `setDestroyed(true)` 之后退订，放在该处理的 `finally` 里。当轮副本里还没调用到的位置仍可能再进来一次，所以销毁和退订都要幂等：第二次 `setDestroyed(true)` 保持销毁，第二次退订不做任何事，两次都不调用 `noteNone`，也不再装菜单。下一轮不再包含已退订的监听。测试可以用退订函数被调用，以及之后的新一轮通知不再进入这扇门，证明清理发生了。

### owner：先验证，再绑定

生产正常路径只 `attach` 一次，应用菜单也只有一份。这只说明正常路径上的 id 来自那一次调用。它不能写成「第一份任意通知一定属于那个窗口」，也不能写成因此能拒绝一切错误的首次 owner。若 `attach` 本身被叫到错误的窗口上，这份 `attached` 会绑定那个窗口。本批不另造识别，也不新增 owner 读取端口。

`ownerId` 从空开始。只有 `kind: "attached"` 可以绑定。桥接先验证再写的只有这两件事：

- `webContentsId` 是安全整数，口径与 epoch 现有的整数检查相同，不另造正数范围。
- 当前还没有 owner。

「还没有进入终态」不在桥接这里查。`read` 看不出来，也没有 `isSealed`。它由 epoch 在发出这份 `attached` 之前用私有哨兵保证。握手里嵌套的 `closed` 发生在发出之后，桥接仍然绑定，随后的补投负责销毁。

验证失败就不写 owner，不调用 `noteNone`，不调用 `setDestroyed`。验证通过才记下 owner。`attached` 本身不调用 `noteNone`。同一个 id 再来一份 `attached`，不重复绑定，也不调用 `noteNone`。epoch 对重复 `attach` 也不再发这份通知。

尚未绑定时，与这次握手无关的 `slot` 和 `closed` 都不抢 owner：`noteNone` 为 0，`setDestroyed` 为 0。retired epoch 0 即使被收成一份 `slot`，也不绑定，也不调用 `noteNone`。握手欠下的那次 `closed` 不是这种无关通知，规则在握手节。

已经绑定之后，id 不同的 `slot`、`closed` 和再次 `attached`：`noteNone` 为 0，`setDestroyed` 为 0。未公开导航因为不发通知，不会抢先占掉 owner。

### noteNone 前的复核

对 `kind: "slot"`，先看是否已绑定。未绑定按上一节返回。已绑定后，在调用 `noteNone` 之前同步做完这些比较，中间没有 await：

- id 仍是 owner。
- 通知不是「`retired` 且 epoch 为 0」。这是从未有效 commit 的退役，不进 `noteNone`。
- `epoch.read(id)` 仍有槽。
- 槽的阶段和 epoch 数字仍等于这份通知。

任一不符合就返回。这次返回不调用 `noteNone`，不写 floor，不派发。符合才调用 `noteNone(记号)`。`noteNone` 开头会同步改写 `currentMark`，所以过期快照不能进入这次调用。这只挡住还没进门的通知。已经停在 await 上的 click 由门在派发前比较。

### closed

epoch 侧的顺序见「每次 attach 的终态栅栏」：先终结并去掉槽，再发 `closed`。无槽也发。

生命周期收到 `closed`：

- 还没有 owner，并且这次 `closed` 不是当前 `attached` 握手欠下的补投：不绑定，不销毁，不退订。这是无关的过期通知，不能污染未绑定状态。嵌套在 `attached` 里、发生在桥接绑定之前的那一轮也走这里；欠下的销毁由 `attach` 返回前的补投完成，不靠这轮嵌套。
- id 不是 owner：不销毁，不退订。
- id 是 owner，包括握手补投到达时已经绑定的情况：始终 `setDestroyed(true)`，然后在 `finally` 里退订。不读槽来决定是否销毁。`read` 后来又有值也不取消，不调用 `setDestroyed(false)`。补投到达时若已经销毁过，保持销毁，退订保持幂等。

这条路径不调用 `noteNone`，不调用 `Menu.setApplicationMenu`，不调用 `ports.dispatch`。销毁之后，门里已有的 `destroyed` 判断挡住还没进入端口的 `replace` 和 `dispatch`。已经进入 `ports.dispatch` 的那一次不撤回。

验收观察的是这些真实调用次数，不是源码里有没有某个字符串：`Menu.setApplicationMenu`、`ports.dispatch`、`noteNone`、`setDestroyed(true)`，以及退订函数。

### 失败的 unknown 和最新 pending 修成的 known

这两件事沿用已合的门，本批不改它们的含义。

- 失败的那次尝试不把自己写成成功。没有一份仍然有效的修复时，安装是 `unknown`。
- 忙着的门收到新的生命周期 none，只把 `currentMark` 和 pending 改成最新记号，不另起一轮替换。
- 额外替换至多一次。这一次的 `postCheck` 通过，并且期间 pending 没有再变，最终可以是 `none` 且 `known`。这份 `known` 只属于那个最新记号。
- 这一次替换期间又来了更新的 pending，就停在 `unknown`，并留下最新 pending。不为此增加第三次替换。
- 桥接不把 Promise 拒绝改成成功。真实平台上的 Menu 失败和 Node 假端口的失败分账。

### 派发前的代次比较

`rebuildAndDispatch` 已经持有 `markAtStart`。把它传进 `dispatchRequested`。`dispatchAllowed` 仍先看形状、安装、pending 和事件。通过之后、调用 `ports.dispatch` 之前，同步要求 `state.currentMark === markAtStart`。这两步之间没有 await。

不相等：返回 0，不调用 dispatch，不清除 pending，不再替换。相等：进入 `ports.dispatch`。进入之后代次再变，不撤回这次调用。返回 1 只表示端口被进入。它不表示新文档接受了旧 click，也不写 floor。返回 0 也不单独证明端口完全没被进入；测试要分别断言调用次数、返回值、当前镜像和 pending。

公开的 `click`、`noteNone`、`submit`、`setDestroyed` 和三个端口的参数都不改。不加 `currentMark` getter。现有的 `pendingMark` 仍只是观察用的最新 pending，不是接受凭证。

## 装配顺序

`index.ts` 在两次使用之前创建一次：

```ts
const epoch = createViewMenuEpoch();
startMainLogger(epoch);
createMainWindow(epoch);
```

`startMainLogger` 增加可选参数，缺省时仍调用今天的 `startLibrary(userData)`。传入时把同一对象转给 `startLibrary`。`startLibrary` 的第三个参数可选，缺省 registrar 保持默认。显式传入 `undefined` 作为第二个参数时，默认 registrar 仍生效，然后第三个参数才是 epoch。

`installApplicationMenu` 在第一次 await 之前同步订阅。`startLibrary` 因此在返回命令表之前已经订上。随后 `createMainWindow` 才 attach，再 `loadURL`。订阅早于 `loadURL`。attach 的现有位置不动。`attach` 返回前做完握手：先发 `attached`，若期间发生真实 `closed`，再补投 `closed`。生命周期在 `attached` 上绑定 owner，`noteNone` 仍是 0。补投时才 `setDestroyed`。第一次有效 commit 在 `loadURL` 之后的 `oi-app:` 导航。

没有传入 epoch 时，不订阅，不调用 `noteNone`，不调用 `setDestroyed`。这就是现有装配测试和另外两个 wiring 测试要继续看到的路径。

## 验收计划

载体是行为：假端口或受控的 epoch 事件进入生产函数，看随后的菜单替换、调用次数和派发。不断言源码字符串。Node 纯桩、官方 CI、真实 Electron 和用户真机分开记账。下表「未跑」是起草时的格子。Forge PASS 之后，Node 纯桩已跑，退出码在证据里。那一次通过不改写成真实 Electron 或真机通过。

| 编号 | 通过时能看见 | 不能拿来冒充 | 本轮 |
| --- | --- | --- | --- |
| N1 同一实例 | 从 `index` 的那一次 `createViewMenuEpoch` 传到窗口和 `startLibrary`。窗口 attach 产生的槽，能被菜单安装时绑上的那个对象 `read` 到 | 两个分别 `createViewMenuEpoch()` 的对象，或另造的 fake 工厂 | 未跑 |
| N2 订阅先于 load | 订阅发生在 `loadURL` 之前。第一次成功的 `oi-app:` 导航得到 epoch 1，并发生一次生命周期 none。`window.ts` 的 attach 仍在 `loadURL` 之前，且该文件 diff 为 0 | 只重测已经存在的 attach 顺序，却没有这次 none | 未跑 |
| N3 换代、退役、renderer gone | 已经有效 commit 之后，这三种都变成生命周期 none。记号含当时的窗口 id、阶段和 epoch。从未有效 commit 的 retired epoch 0 不属于这条，见 N12、N13 | 用全未勾的 radio 表示 none。本批不提交活动三模式。把初始失败也记成一次 `noteNone` | 未跑 |
| N4 旧 id、owner、epoch | 分两种。与这次握手无关、当时未绑定的 `slot` 和 `closed` 不写 owner，`noteNone` 与 `setDestroyed` 都是 0，后来另一次真正的 `attached` 仍能绑定。已绑定：id 不同则这两次调用仍是 0；id 相同才进入复核。复核失败时不写 floor，不派发。先行监听在 `attached` 里同步 `closed` 时，嵌套那一轮不抢 owner；`attach` 返回前的补投才销毁属于这次 attach 的门 | 用「生产只有一个窗口」代替验证。用 `read() === undefined` 拒绝这份 `attached`。用这一条代替已经停在 await 上的 click。新增 owner 读取端口 | 未跑 |
| N5 closed | 无槽的 `closed` 也通知，并 `setDestroyed(true)`、调用退订。先行监听在 `closed` 里同步重入导航：没有新槽，`noteNone` 不增加，Menu 与 `ports.dispatch` 不增加，销毁和退订仍然发生。先行监听在 `attached` 里同步 `closed`：原有菜单安装或已有等待结束之后，`setDestroyed(true)` 和退订已经发生，其后 Menu 与 `ports.dispatch` 是 0。`closed` 返回后的迟到导航或失败同样不重建、不进 Menu。关闭前是 `open` epoch 1 时，重入不能把记号重用成 `id:open:1` 来派发旧 click：`read` 仍是 `undefined`，该 click 的 dispatch 是 0。`read` 又出现槽也不能取消销毁。同一 id 再 `attach` 不解封，也不再发可绑定的 `attached` | 只删掉 `read` 判断。只封印而不销毁门。`setDestroyed(false)`，或同进程重开后又装菜单。用源码字符串代替这些调用次数 | 未跑 |
| N6 A/B | A 的 none click 停在 `postCheck`。B 的 none 到达并被已有的一次额外替换收成 `known`。A 的 `ports.dispatch` 次数是 0，返回 0。B 的 `known` 不回滚。pending 不被丢掉。没有第三次替换 | 只读当前槽，或只看返回 0 | 未跑 |
| N7 修复中的 C | B 的额外替换还没结束时 C 到达。留下最新 pending。安装是 `unknown`。仍没有第三次替换 | 为了留下 C 而清掉最新 pending，或把失败写成 `known` | 未跑 |
| N8 已进入 dispatch | 比较已经通过并进入 `ports.dispatch` 之后才换代。那一次端口调用不撤回。返回 1 不当作新代接受。调用次数和返回值分开断言 | 把返回 0 写成「端口从未进入」的通用证明 | 未跑 |
| N9 原边界 | reject、同步 throw、销毁、早到 click 都是 0 且不重放。`startLibrary` 同步返回命令表。`postCheck` 在 await 之后。普通 none 的三项是严格 `type === "normal"` 且 `checked === false`，每个视图 id 恰一项，核对的是当前安装对象 | 放宽这些断言让接通测试变绿。未勾选的 checkbox 不算 none | 未跑 |
| N10 分账 | 未注入 epoch 的路径，以及注入之后、第一次有效 commit 以前，`noteNone` 仍是 0。`attached`、无槽 `closed`、以及从未有效 commit 的 retired epoch 0 都算在这 0 次里面，不把它们改成一次菜单提交。纯桩、官方 CI、真实 Electron、真机各记各的 | 删掉或放宽这 0 次。源码里有 `setApplicationMenu` 就写成画面已验。用 F-08 的源码字符串断言代替行为 | 未跑 |
| N11 延后项 | 生产上新增的条件 floor 提交调用是 0。`expose` 仍是 false。没有 handler、codegen、renderer 上报，也没有 `submit("original" \| "contrast" \| "translation")` | 把换代时原有的 floor 归零记成新的条件提交，或把本桥接写成完整生命周期 | 未跑 |
| N12 初始 provisional failure | 还没有任何有效 commit。主 frame provisional failure 之后，`read` 是 retired epoch 0，`noteNone` 是 0，Menu 调用是 0。随后的 `closed` 仍 `setDestroyed(true)` 并退订，且不新增 Menu 或 dispatch | 为了让初始失败「有通知」而调用 `noteNone`。引入 floor、handler 或 renderer 模块 | 未跑 |
| N13 初始 renderer gone | 还没有任何有效 commit。renderer gone 之后，`read` 是 retired epoch 0，`noteNone` 是 0，Menu 调用是 0。随后的 `closed` 仍 `setDestroyed(true)` 并退订，且不新增 Menu 或 dispatch | 把这条并进 N3 的「都会 noteNone」，或删掉 N10 的 0 次 | 未跑 |

none 的可观察结果仍是三个普通项、没有勾。活动三模式仍是三个 radio 且恰一勾。本桥接不提交活动模式。

## 环境

本轮文档不需要安装依赖。只使用已经存在的 Node 跑文档和提交说明检查。不安装、不启动真实 Electron 或 native。不改共享环境、系统环境、依赖清单或锁。

Forge 明确允许继续之后，普通必要依赖可以按锁装进隔离环境。安装前先读 postinstall 和下载路径。`ELECTRON_SKIP_BINARY_DOWNLOAD` 不是充分保证。脚本不能穷尽直接加载时就停，不先试一次再解释。不使用 `--approve-builds`、改包名或挪缓存来绕过。Cloud 和 Box 不下载、不启动真实 Electron 或 native。用户机和真机一律不碰。

用户允许现有 GitHub CI 在官方隔离 runner 上执行已有的安装和测试步骤。不改 CI。这个许可不扩到 Cloud 或 Box 的 native。推送可以触发这份既有 CI。CI 绿灯不等于本批行为已经实现，也不等于真实平台通过。

本地若必须跑完整门禁，而那一步会下载或启动真实 Electron 或 native，就留下 HOLD 和未验，不 skip 来换绿灯，也不把未跑写成通过，并向 Forge 报告。

历史记录全部保留，不清理，不追认：PR #232 的 8 条启动失败；意外 Electron zip 123777540 字节；纯桩 7 通过 / 1 定位失败；其后六条负向 6 通过；旧 lint 失败、单测跳过和环境 HOLD。macOS 健康检查里已有的两个依赖步骤 skipped 也不改记成首次全绿。

## 本轮停点

Forge 对这份计划和台账给出明确继续之前：

- 不写上面 10 份里的产品或测试代码。
- 不安装依赖，不跑产品测试，不启动 Electron。
- 不把本 PR 标成 Ready，不合入，不发版。
- 不联系其他 agent，不自行扩大下一笔的范围。

计划里的接口若被审查否决，先改本文件再写代码。相同根因两轮仍不能闭合，或白名单、接口、owner 必须扩大，就停并交出当时的真实状态。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 核对官方 main 的 SHA、parent、tree | `origin/main` 仍是文首的 SHA 和 tree。parent 是 `e62e0d4`。GitHub `merged_at` 02:33:02 与 git 时间 02:33:01 是同一 commit | 本文件 |
| 2 | 写本计划，追加 seam 例外，给所有权计划加决定状态指针 | 本 PR 文档提交。行为未跑，不标通过 | 本文件、seam 文末、所有权计划「决定状态」 |
| 3 | 台账追加四条。合入同步不计批准。旧页脚前缀不改 | 另笔提交。追加前数过 311 行：267 / 1 / 8 / 35。新页脚是 267+3 / 1 / 8 / 35+1 | `docs/approvals.md` |
| 4 | 产品与测试、依赖、Electron | 十个文件已按计划写入。Node 纯桩 6 个文件、92 个用例，退出码 0。没有新装依赖，没有跑 electron 的 install.js，二进制目录仍不存在。完整门禁与真实 Electron 仍是 HOLD | `docs/evidence/234/commands.md` |
| 5 | 文档检查 | 命令和退出码写入 `docs/evidence/234/commands.md` | 已写入。`check-docs` 与 `check-commits` 退出码 0。产品门禁未跑，不标通过 |
| 6 | 按 Forge 首轮 BLOCK 改计划：终态栅栏、retired epoch 0、先验证后绑定、通知快照 | 只改本计划和证据。台账不重复追加。行为未跑，不标通过。编码前置仍未满足 | 本文件对应各节。证据文件补本轮命令 |
| 7 | 按 `cca5ac3` 复审补上 attached 与 closed 的握手 | 只改本计划和证据。R2 保持。台账不重复追加。N1–N13 仍未跑，不标通过。编码前置仍未满足 | 本文件「attached 与 closed 的握手」。证据文件补本轮命令 |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 候选甲，只放开 composition-root 的参数转交 | 原话允许这一个例外。装配仍在 `startLibrary` | 2026-11-23 02:42 | Wisdom，[7083807265](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7083807265) |
| `commitFloor` 延后 | 原话。不造接受凭证。原有换代归零保留 | 2026-11-23 02:42 | Wisdom，同一评论 |
| 关闭后不复活 | 原话。不 `setDestroyed(false)` | 2026-11-23 02:42 | Wisdom，同一评论 |
| wiring 测试只改接通后必然变化的断言 | 原话。未注入路径的 0 次保留 | 2026-11-23 02:42 | Wisdom，同一评论 |
| 派发前同步比较两个记号 | 原话。公开端口不改。进入后再换代不撤回 | 2026-11-23 02:42 | Wisdom，同一评论 |
| 通知不带 floor | 订阅只翻译阶段和代次。floor 凭证留到以后的唯一写者 | 2026-11-23 | 本计划，待 Forge 审这组签名 |
| 每个监听单独接住异常 | 一个监听的抛出不回滚槽，也不变成菜单成功 | 2026-11-23 | 本计划。Forge 首轮非阻断 N2 已把快照和可观察结果写死，见下 |
| 第一份通知记下 owner | 生产只 attach 一次。后到的另一个 id 不改这扇门 | 2026-11-23 | 本计划旧行。Forge 首轮 N1 否决了「先绑定再验证」。规范改到下一行，本行不删 |
| 本轮先文档 | 原话要求 Forge 审查通过才写产品或测试代码 | 2026-11-23 02:42 | Wisdom，同一评论 |
| 不改 seam 分批顺序 | 本批例外不放开 S2c-on、E2、S3 | 2026-11-23 | 本计划。Forge 仍可要求把例外写回原句；当前按「只追加」执行 |
| 每次 attach 先终结再发 `closed`，无槽也发，owner 始终销毁 | Forge 首轮 R1。同一张 Map 的终态，不是第二张代次表，也不是公开 getter。只删 `read` 判断不够 | 2026-11-23 | Forge 审查。本计划修订，复审前不开工 |
| 从未有效 commit 的 retired epoch 0 不发菜单 `slot`，桥接也不 `noteNone` | Forge 首轮 R2。N10 的 0 次保持。随后 `closed` 仍终结。不引入 floor、handler 或 renderer | 2026-11-23 | Forge 审查。本计划修订，复审前不开工 |
| owner 只由 `attached` 在验证通过后绑定 | Forge 首轮 N1。生产单窗不写成能拒绝一切错误的首次 owner。不新增 owner 读取端口，不改 `window.ts` | 2026-11-23 | Forge 审查。本计划修订，复审前不开工 |
| 通知遍历用当次副本；抛出和 `noteNone` 拒绝保持可观察 | Forge 首轮非阻断 N2。不新增诊断框架，不把接住写成已恢复 | 2026-11-23 | Forge 审查。本计划修订，复审前不开工 |
| `attached` 握手期间的真实 `closed` 在 `attach` 返回前补投 | `cca5ac3` 复审仍 BLOCK 的 R1。桥接不用 `read` 判断终态。补投后再销毁。重复 attach 不解封。哨兵不被 `delete` 清掉 | 2026-11-23 | Forge 复审。本计划修订，复审前不开工 |

## 风险与未知

- 把本文件或未跑的验收写成已经通过。
- 用模块 singleton 或第二张表绕过候选甲。
- 重做 `window.ts` 里已经完成的 attach 顺序。
- 接通后仍让注入路径永远断言 `noteNone === 0`，或反过来放宽未注入路径的 0 次。
- 为了拦住旧 click 丢掉最新 pending，或增加第三次替换。
- 把 `ports.dispatch` 的返回值当成新代接受凭证。
- 把监听列表或终态说成第二张代次表。两者都在同一个闭包里。终态不存 epoch 或 floor，没有公开 getter。若复审仍认定必须另开表或公开读取，停，不偷偷改成全局查找。
- 把 `attached` 收成 owner 读取端口，或为了拿到窗口 id 去改 `window.ts`。当前不改。若复审认为这份通知越出十个文件或公开端口，停。
- 把生产只有一个窗口写成已经能拒绝一切错误的首次 owner。
- 初始 retired epoch 0 为了「有一次通知」去调用 `noteNone`，或删掉 N10 的 0 次。
- 接住监听抛出或 `noteNone` 拒绝之后，把菜单记成已经恢复。`catch` 后再抛出会留下没人接的派生拒绝。
- 把握手嵌套的 `closed` 当成无关过期通知丢掉，或只写哨兵却不补投，门就一直不销毁。
- `Map.delete` 把哨兵删掉，终态栅栏消失。
- `library-wiring.ts` 或 `view-menu-gate.ts` 的语句数或圈复杂度越过现有门禁。不停用规则，不把两份职责并回一个文件。停下来把实际诊断交给 Forge。
- 可选第三参数若迫使白名单外的测试改签名，停。
- 本地完整门禁若会下载或启动真实 Electron，留下 HOLD。官方 runner 上的既有 CI 与 Cloud/Box 分账。
- 历史失败、意外 zip、纯桩 7 通过 / 1 定位失败、六条负向 6 通过、旧 lint、skip 和环境 HOLD 被写成首次全绿。

## 自检

- [x] 影响 arch / prd 吗？不影响。五份规格、C 计划和根上的其他架构约束都不改。
- [x] 实现只落在批准的十个文件。Node 纯桩已跑。真实 Electron 未跑，不标成平台通过。

## 给 Forge 的交接

先读本文件。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

`cca5ac3` 复审仍是 BLOCK，只剩 R1 的握手重入。R2 保持闭合。编码前置仍未满足。请复审：

- R1 握手：先行监听在 `attached` 副本里同步 `closed` 时，嵌套那一轮桥接还不是 owner，不在那里销毁。epoch 记下这是真实 `closed`，在 `attached` 副本结束、`attach` 返回之前再补投一轮。补投时桥接已经绑定，于是 `setDestroyed(true)` 并退订，且在后续 Menu 之前。`read() === undefined` 不能用来拒绝 `attached`，也不能用来判断哨兵。没有 `isSealed`。哨兵留在同一张 Map，禁止 `delete` 清掉。同一 id 再 `attach`：已终结则拒绝并不解封；尚未终结则幂等，不再登记监听，不再发可绑定的 `attached`。N4 保留无关未绑定通知不抢 owner。N5 要求原安装或已有等待结束之后销毁、退订已发生，其后 Menu 与 dispatch 是 0。
- R2：保持。从未有效 commit 的 retired epoch 0 不发菜单 `slot`，桥接也不 `noteNone`。
- 非阻断：当轮退订后桥接仍可能再被调用一次，销毁和退订幂等。`noteNone` 只处理它返回的那个 Promise，不 `catch` 再抛，也不空 `catch`。

候选甲、`commitFloor` 延后、派发前同步比较、wiring 只改接通后必然变化的断言，审查没有把这几处列为阻断。行为仍未跑。台账不重复追加。

Forge 对 `91770f8` 的 PASS with nits 满足「经审查后编码」。实现已在同一 Draft。四个非阻断点落在代码里：登记标志在 `attached` 前写入且不复制代次；补投欠账在进入监听前清掉，抛出也走 `finally`；`noteNone` 只观察它返回的那个 Promise；`loadURL` 的同步抛出仍交给现有的 `reportReadyFailure`。没有改 `window.ts`。

保持 Draft。不 Ready，不合入，不发版。等 Forge 做代码复审，并等已批的 Anvil 独立 QA。
