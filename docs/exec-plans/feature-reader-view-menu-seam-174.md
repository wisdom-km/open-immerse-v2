# 执行计划

E2 菜单选中状态回传的最小 seam 设计。文件名按指定保留。分支仍是 `feature/reader-view-modes-e2-plan-174`。栏位与空态在 [E2 计划](feature-reader-view-modes-e2-174.md)。

本文件只写设计。2026-11-16 12:08 原话只批准写设计，不批准编码。来源 [#174 6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822)、[PR #220 6907027779](https://github.com/wisdom-km/open-immerse-v2/pull/220#issuecomment-6907027779)。Forge 对 `a5b06e5` 的第二轮审查是 FAIL。本轮仍只改文档，不请求编码批准，不自称通过。

不改产品代码、测试、生成物、CI、PRD、ARCHITECTURE、RULES、DESIGN。不开 Ready，不合入，不发版。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 源码已否定的两条

标签 v45.2.1，本轮读的是这份标签的源码，没有启动 Electron。

`Menu::MenuWillShow`（`electron_api_menu.cc` 132–145 行）注释是确保 radio 组至少有一项选中。全 false 时对组里第一项调用 `SetCheckedForRadioGroup`。`ElectronMenuModel::MenuWillShow` 会进到这里。因此「none 用三枚 radio 且构造期全 false」在第一次打开菜单时会被改成第一项勾上。重建一份尚未显示的全 false 组不能躲开下一次显示。这条不再列为实施时验证。

`SetChecked`（`electron_api_menu_item.cc` 481–487 行）对已挂 radio 忽略布尔值并选中自己。不在已挂项上写 `checked`。

`will-navigate` 只在渲染进程发起的导航上发出，`preventDefault` 会取消（`electron_navigation_throttle.cc` 55–61 行）。本应用 `decideNavigation` 恒为 prevent。取消的导航没有 commit，不会发 `did-navigate`。`DidFinishNavigation` 对 `ERR_ABORTED` 不发 `did-fail-load`（约 2932 行）。所以不能靠 `did-start-navigation` 进入退役、再等 `did-fail-load` 恢复，否则一次被取消的导航会把上报永久停住。epoch 只在已提交的主 frame 导航上变化。

`ChangeApplicationMenu` 的非 mac 分支注释写明：设置菜单可能跑应用 JS（例如 resize），这些 JS 可能开、关窗口（451–472 行）。mac 分支只调用 `SetApplicationMenu`，本轮没有读那个函数的正文。两边都按有重入来设计。mac 是否还有这份注释以外的重入，未知。

`isAppSender` 只核对 `oi-app:`、`sender.id` 和当前 `mainFrame` 引用。`RenderFrameHostChanged` 按 frame tree node 更新已有的 `WebFrameMain`，同站重载可能不换这个对象。因此它不能证明新文档，也不能代替 epoch。不改它，不削弱 `assertHandlers`。

## 产品取舍

这是本稿唯一的复审停点，不是未跑的源码问题。

已批菜单表写这三项是单选。已批 6-3 A 是文献库不置灰、点了无作用，并且不假勾成原文。Electron 不允许一组 radio 全不勾。要同时不假勾，文献库里这三项不能是 radio。

本候选：文献库用同标签、同 accelerator、保持 enabled 的普通原生项；阅读中的三模式才用原生 radio，且构造参数里恰有一项 `checked: true`。不加「无」项，不自绘，不置灰，不改成 checkbox。有栏位时的单选勾仍在。标签、快捷键、可点、事件名不变。

若复审把「单选」读成「文献库里控件类型也必须是 radio」，则与上述源码冲突。本设计不另造自绘或假勾。编码仍不开始。

## 两种菜单形状

镜像只有 `none`、`original`、`contrast`、`translation`。`none` 是没在阅读。`oi-view-bilingual` 仍只是事件名，状态值是 `contrast`。

装配只发生在 `Menu.buildFromTemplate` 的构造参数里，然后 `setApplicationMenu`。应用、编辑、窗口 role 照现有模板。历史、页码、缩放保持普通项，不设成 radio。三项模式是这一子菜单里仅有的 radio，所以它们成一组；普通项不会把组拆开，也不另加分隔线（那是视觉改动）。

| 镜像 | 三项的 type | checked | 打开菜单 |
| --- | --- | --- | --- |
| none | 普通项，不写 checked | 没有勾 | `MenuWillShow` 跳过非 radio，不会勾上第一项 |
| 三模式之一 | radio | 对应一项 true，另两项 false | 组里已有选中项，不会改去勾第一项 |

普通项不写 `checked: true`。本轮没有跑各平台，不能另外声称「写了也不显示」。

系统菜单和 accelerator 都会走 `RunBuiltInAction`。radio 会先选中被点的那一项；普通项不会改 checked。click 回调不写已挂项的 checked。它先按已提交镜像整份重建，把刚被自动勾上的那份换掉，再派发已有事件。重建抛错则不派发，并记下失败。`executeJavaScript` 的拒绝要接住并记下，不能变成未处理拒绝。不等待它。文献库镜像是 none，点了仍是普通项，事件可以派发，阅读屏不在时没有栏位可改。

重复点当前 radio：内建动作仍会选中自己，重建按已提交镜像放回同一项。

可访问性验收只读项的 type 和 checked，并调用锁定版本上的 `_menuWillShow`（它直接进入上面的 C++ 函数）。不把 `item.click` 单独算过。读屏会怎么念、菜单仍打开时替换的画面，本轮未跑，不写通过。方向键在打开的系统菜单里怎么移动，本轮未知，不另写一套按键逻辑。

## 谁有权换 epoch

main 按 `webContents.id` 保存槽。epoch 是 main 的整数，从 0 起。渲染进程不提交 bootId，也不提交一个自己生成的 UUID。载荷里的 epoch 只是回声，必须等于该槽当前已公开的 epoch。不相等就 `rejected`，不改菜单，不改地板。

槽的阶段：

- 未公开：还没有一次 `oi-app:` 的 `did-finish-load`。上报一律 `rejected`。
- 退役：已提交的主 frame、非 same-document 的 `did-navigate` 且 URL 是 `oi-app:`。立刻拒绝一切上报。地板先不动。`about:blank` 的 `did-navigate` 不退役。S2a 只记阶段，不改菜单。S2b 起，窗口还活着就按 none 形状重建；这不是一次被接受的上报。
- 公开：随后的 `did-finish-load`，且当时 URL 仍是 `oi-app:`。epoch 加一，地板归零，镜像记为 none。若加一会超过 `Number.MAX_SAFE_INTEGER`，保持退役，不回绕，不再接受上报。

same-document 的 `did-navigate-in-page` 不改变 epoch。阅读屏开关不是导航。`render-process-gone` 进入退役并尽量换成 none 形状，直到下一次合格的 `did-finish-load` 才公开新 epoch。窗口 `closed` 删掉该槽；窗口已销毁就不再 `setApplicationMenu`。

公开时 main 用已有的 `executeJavaScript` 派发一次 `CustomEvent`，detail 只是这个整数。脚本不拼接渲染进程来的字符串。这不是新的 IPC 通道，不改 CSP，不改协议。页面可以伪造这个事件，但伪造的数字对不上槽就会被拒绝，不能把地板重置。监听写在随页面加载的 shell 模块里，不写在晚加载的分包里。`did-finish-load` 没有 URL 参数，公开前读 `getURL()`。脚本失败只再试一次，不排定时器。两次都失败则槽仍公开，页面没听到；上报不发明 epoch，菜单停在上次形状，直到下一次合格的 `did-finish-load`。

`IpcCommandContext` 增加可选的 `senderWebContentsId`。router 在 `acceptsSender` 已经通过之后，从 `event.sender.id` 抄进去。载荷里没有这个字段，schema 也不接受它。缺这个字段的调用 `rejected`。不改 `acceptsSender`，不改 `assertHandlers`。这是权限开口：handler 能看见 main 已经核对过的 webContents id。

## 提交菜单

handler 在任何 await 之前，并且在任何菜单副作用之前，同步做完：

1. 未销毁窗口恰好一个，且它的 `webContents.id` 等于 context 里的 id。
2. 该槽阶段是公开，载荷 epoch 等于槽的 epoch，generation 是大于地板且不超过安全整数上限的整数。
3. 没有另一笔菜单替换正在进行。

任一不满足：`rejected`，不重建，不消耗地板。坏形状仍是 `invalid_payload`。发送方仍是 `sender_rejected`。不新造错误码。

然后记下尝试记号，调用 `setApplicationMenu`。返回之后再次核对：同一 webContents 仍是唯一未销毁窗口，槽还在，阶段和 epoch 没变，尝试记号没被清掉。都成立才把地板和镜像写成这一笔。否则 `rejected` 且不写地板。

替换抛错：不写地板和镜像。不宣称原生菜单能回滚。已安装的菜单视为未知。返回 `handler_threw`。下一次被接受的上报按最新镜像整份重建，不打补丁。

重入：`closed` 若在替换期间清掉槽，外层看到槽没了，不提交。重入的另一笔上报看到正在替换，直接 `rejected`，不再次 `setApplicationMenu`。

## 上报状态机

shell 模块里一份上报器，不放进 `ReaderScreen`。同一 JS 领域里卸载再打开，generation 不归零。新文档是新领域，generation 从 1 重新计。超过安全整数上限就不再发送，不回绕；阅读仍可切换，菜单停在上次提交的镜像。

任意时刻最多一个 `reportViewMenu` invoke。没有发出的期望可以被替换。已经发出的不撤回。

期望每次变化得到新的 revision。每个 revision 自己有两次发送额度，不和上一份共用。发送时才把额度减一，并分配新的 generation。

完成回调闭包记下 `attemptId`。对不上当前在飞的那次，就什么都不做：不改额度，不发送。这是迟到响应。它不能改 main，也碰不到新领域里的另一份上报器。main 的成功响应不带新的 epoch，不根据响应改菜单。

无响应：2 秒到点就放弃这一次，算消耗一次额度。迟到的响应仍按 `attemptId` 丢掉。放弃之后若期望还在且该 revision 仍有额度，才发送下一次。不会永久停在「在飞所以不能发新的」。

| 到达的结果 | 同一 revision 仍是期望 | 期望已经换成新 revision |
| --- | --- | --- |
| 成功 | 停。菜单已是这份 | 新 revision 额度仍是两次，发送它 |
| `handler_threw` 或超时 | 还有额度就用新 generation 再发这份 | 不把失败算进新 revision。发送新的 |
| `invalid_payload` 或 `rejected` | 这个 revision 不再发 | 若是 epoch 对不上，先等下一次公开事件再发新的；其它拒绝不重发旧的 |

两次用尽后不排定时器。下一次期望变化重新获得两次。阅读屏不因菜单失败停住。菜单停在上次成功提交的镜像。这是故障状态，不写成「重开一定已经勾上原文」。

离开：先把期望写成 none，再同步卸下，不 await。none 若还没发出就被新的 original 替换，则 none 从不发送。none 若已经在飞，它返回之后才发送 original；main 可能先接受 none，再接受 original。不存在两笔同时在飞，也就不靠「后到的 none 被拒绝」来保证顺序。

## 轨迹

| 轨迹 | 结果 |
| --- | --- |
| 启动，epoch 未公开 | none 形状。上报被拒绝 |
| `oi-app:` 的 did-finish-load | epoch 变为 1，地板 0，公开事件。之后才能接受 generation 1 |
| 打开阅读，含加载 | 期望 original。接受后才是 radio，且只勾原文 |
| 错误页 | 不把期望改成 none。空态句仍只在成功支 |
| 换文献 | 同一 epoch，generation 增加。主人直接到 original，不先发上一篇 |
| 连点 | 在飞只有一个。未发的期望被最后一次替换 |
| 离开 | 期望 none，不 await。未发就替换则不发 none |
| 离开的 none 已在飞，立刻重开 | none 先结束，再发 original。中间菜单可以短暂成为 none 形状 |
| 一次抛错 | 同一 revision 用新 generation 再发当时的期望，不重放旧 mode |
| 在飞时期望已变 | 旧失败不占用新 revision 的两次 |
| 同一 revision 两次失败或两次超时 | 停在上次提交。下次期望变化重新计数 |
| 响应迟到 | `attemptId` 不符则忽略 |
| 旧 epoch 的请求迟到 | `rejected`。不改地板，不重建 |
| 已提交的 oi-app 导航 | 退役，拒绝上报，菜单先换成 none 形状。did-finish-load 后才是新 epoch |
| 被 preventDefault 取消的导航 | 没有 did-navigate，epoch 不变 |
| generation 或 epoch 将溢出 | 不发送，不回绕 |
| 第二个窗口或替换期间窗口没了 | `rejected`，不提交地板 |
| 替换抛错 | 不写地板。下一次接受才整份重建 |
| click 重建抛错 | 不派发菜单事件 |

## 分批

硬线：非生成新增+删除 600；只改 `packages/contracts/` 时 200。346 是估算 × 1.73 ≤ 600 的门槛。生成物不在 pr-size 排除名单，下面的生成行计入 600，不重复乘进「还能用的 200」。函数软 50、硬 80。超过软线就拆函数，到硬线就停。不写 G12，不删测试。基本行为测试不能挪到合入之后。

唯一顺序：S1 → S2a → S2b → E2-0 → E2-1 → E2-2 → S3。没有循环。S2b 依赖 S2a 的槽和 context 字段。S3 依赖 S2b 的 handler 和 E2-1 的栏位主人。E2 三笔不写上报，也不等 S3。每一笔都要单独批准。批准编码不包含改 ARCHITECTURE。

| 笔 | 合入后能启动 | 菜单实际状态 | 估算 | ×1.73 |
| --- | --- | --- | --- | --- |
| S1 | 能。命令不进 registry | 仍是今天的普通项，没有勾 | 178 | 308。契约档看 200，178 用去 200 的额度，不是 308 |
| S2a | 能。仍无这条 handler | 与 S1 相同。公开事件没有监听者 | 227 | 393 |
| S2b | 能。handler 已注册 | none 形状：三项普通项，不开勾。还没有上报者，不会变成 radio | 322 | 557 |
| E2-0 | 能 | 与 S2b 相同 | 72 | 125 |
| E2-1 | 能 | 仍是 none 形状。工具栏能改栏位，勾还没跟上 | 338 | 585 |
| E2-2 | 能 | `clickMenu` 只证明事件派发 | 109 | 189 |
| S3 | 能 | 文献库是普通项。接受 original 之后才是 radio 且只勾原文 | 187 | 324 |

S1 改完行数：新建 `packages/contracts/src/ipc/shell.ts` 78，低于 400；`packages/contracts/src/index.ts` 200 增到约 210；`packages/contracts/test/ipc-shell.test.ts` 90。178 = 78+10+90。`expose: false`，三份生成物 diff 为 0。真实 diff 超过 200 就停，只压缩注释，不把测试挪走，不改成 expose true。

S2a：`ipc-router.ts` 244 增到约 262，计入 18，文件仍低于 400，`commandContext` 仍短于 50。新建 `view-menu-epoch.ts` 110，reducer 和 attach 都短于 50。`index.ts` 59 增到约 68，计入 9。行为测试 90。227 = 18+110+9+90。不改生成物，不注册 handler。

S2b 生成物按 schema 展开估算，不是实测：registry 这一条约 53 行，`oi.generated.ts` 约 25，`oi-api.d.ts` 约 23，合计约 110，都计入。再加 expose 替换 2、`view-menu-mirror.ts` 60、`view-menu-handler.ts` 55、`library-menu.ts` 94 增到约 109（计入 15）、`library-wiring.ts` 252 增到约 277（计入 25）、基本测试 55。322 = 110+2+60+55+15+25+55。两个菜单文件改完仍低于 400。重建函数和 handler 都短于 50。codegen 若把 322 推过 346，先停；只可把基本四项以外的用例拆走，不能拆掉「expose 与 handler 同一笔」，也不能先合没有这四项的通道。四项是：none 经过 `_menuWillShow` 仍无勾；活动形状恰一勾且显示后不变；epoch 不符不重建；替换抛错不写地板。

S3 计入 100+20+12+55 = 187。新建 `view-menu-report.ts` 100，入队和重试都短于 50。`shell.tsx` 147 增到约 167。`use-view-mode.ts` 由 E2 的约 36 增到约 48，仍短于 50。行为测试 55，覆盖上表。不把回调塞进 `ReaderScreen`。

## 验收

S1：契约钉住 expose false、四值、generation 与 epoch 的上下限、多余字段、没有 bootId。不启动 Electron。

S2a：reducer 覆盖未公开、退役、公开、溢出、取消的导航不退役、`render-process-gone`、closed。不把 `did-fail-load` 当成取消信号。

S2b：上列四项，外加零个或两个窗口不重建，替换期间的重入不提交，click 重建失败不派发，`executeJavaScript` 的拒绝被接住。角色菜单和缩放加速键仍各有一份。不把静态模板读数当成系统菜单仍打开时的画面。该项画面未跑。

S3：轨迹表每一行有行为测试，不断言源码文本。不写 `ReaderSession`。不发翻译。

## 将来另批才许改的文件

审查通过后才可以请 Wisdom 批某一笔。本文件不代批。ARCH 正文是独立禁区。

- S1：`packages/contracts/src/ipc/shell.ts`、`packages/contracts/src/index.ts`、`packages/contracts/test/ipc-shell.test.ts`。不含生成物，不含 handler。
- S2a：`ipc-router.ts` 只加上述 context 字段，`view-menu-epoch.ts`、`index.ts` 的一处挂接，及测试。不含菜单形状，不含 expose。
- S2b：`shell.ts` 的 expose、三份生成物、`view-menu-mirror.ts`、`view-menu-handler.ts`、`library-menu.ts`、`library-wiring.ts` 及基本测试。不含 renderer 上报。
- S3：`view-menu-report.ts`、`shell.tsx`、`use-view-mode.ts` 的回调及测试。不改 reader 的 domain、application、`index.ts`、`pure.ts`，不改 `contracts/src/ipc/reader.ts`。

不批：手改生成物、削弱 `assertHandlers` 或 `acceptsSender`、让载荷自己决定 epoch、新的 `ipcMain` 通道、CSP、协议、缩放菜单勾、置灰、持久化、ARCH 正文。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品代码 |  |  |
| 2 | Forge 复审。通过前不写 S1。文献库若被要求必须是 radio，本设计停 |  |  |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 12:08 只写设计 | 原话见文首 | 2026-11-16 | Wisdom |
| none 用普通项，活动模式才用 radio | `MenuWillShow` 会把全 false 的 radio 勾上第一项 | 2026-11-16 | 本设计按 Forge FAIL 修正，不是新批准 |
| epoch 只由 main 在已提交导航上增加 | 渲染进程自报新 id 不能重置地板。取消的导航没有 commit | 2026-11-16 | 同上 |
| S1 不暴露 | `assertHandlers` 在启动时抛 | 2026-11-16 | 同上 |

## 交接

从当时的 main 另开，Draft。先完整读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md` 和本文件。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。没有点名的笔不开工。不改 ARCH。文献库必须是 radio 的读法未接受之前，不开工。

S1 是 seam 变更。expose 保持 false。估算 178，契约档硬线 200。

S2a 是 main 的生命周期槽。估算 227。不改菜单。

S2b 是 main 接线。依赖 S2a。估算 322。先做 `_menuWillShow` 的两项形状，不把全 false radio 留作停点。

S3 是 UI 改动。依赖 S2b 和 E2-1。估算 187。R-E13 保持未验证。
