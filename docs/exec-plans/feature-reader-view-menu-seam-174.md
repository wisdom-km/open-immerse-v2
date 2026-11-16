# 执行计划

E2 菜单选中状态回传的最小 seam 设计。文件名按指定保留。分支仍是 `feature/reader-view-modes-e2-plan-174`。栏位与空态在 [E2 计划](feature-reader-view-modes-e2-174.md)。

本文件只写设计。2026-11-16 12:08 原话：「按推荐：先写 E2 菜单选中状态回传的最小 seam 设计与分批计划；本次不批准 IPC、contracts 或 main 编码，方案审查后再定实施范围，不 Ready、不合入、不发版」。来源 [#174 6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822)、[PR #220 6907027779](https://github.com/wisdom-km/open-immerse-v2/pull/220#issuecomment-6907027779)。Forge 对 `71b3cc7` 的审查是 FAIL。本轮只改文档，不请求编码批准。

不改产品代码、测试、生成物、CI、PRD、ARCHITECTURE、RULES、DESIGN。不开 Ready，不合入，不发版。`c4b3fb9` 的 CI 与 Anvil 评论只属于那个 tip。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 现状

`MenuItemSpec` 没有 type / checked。三项是普通项，事件 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`。`installFileMenu` 启动时 `setApplicationMenu` 一次。click 只 `executeJavaScript` 派发无载荷事件。`shell.tsx` 不听这三项。`IpcCommandContext` 只有 `requestId` 和可选 `droppedFilePath`，没有 senderId。`registerIpcRouter` 先 `assertHandlers`，缺 handler 就抛 `missing ipc handler`，发生在绑定之前。codegen 只把 `expose: true` 放进 `oi.generated.ts`、`oi-api.d.ts`、`registry.generated.ts`。`setZoom` 的 `expose` 是 false，所以不在这三份里。契约禁止 `reader.setViewMode`。栏位字面量是 `original`、`contrast`、`translation`。Electron 锁定 45.2.1。

已读标签 v45.2.1 的 `shell/browser/api/electron_api_menu_item.cc`。`MenuItem::SetChecked`（约 481–487 行）：radio 已经挂上菜单时调用 `SetCheckedForRadioGroup` 并 return，不用传入的布尔值。`SetCheckedForRadioGroup` 清掉同组其他项，再把自己设为 true。构造时 `checked` 写入 `checked_`，那时还没有 `radio_menu_`。`RunBuiltInAction`（约 544–549 行）对 radio 先 `SetChecked`，然后才到用户 click。`ClickThunk`（约 576–586 行）同样先走 `RunBuiltInAction`。因此对已挂 radio 赋 false，会选中自己，不能清成全不勾，也不能按三个布尔写回。直接调用 `item.click` 会走这条自动勾选，但单独用它不能证明系统菜单和 accelerator 的画面。本轮没有启动 Electron。

## 所有权

当前栏位只有一份，主人是 E2 的 `use-view-mode`，用那三个已有字面量，初值 `original`。不写 `ReaderSession`，不存储，不调用 `session.save`，不发明 `reader.setViewMode`。`oi-view-bilingual` 只是事件名，状态值是 `contrast`。

main 的镜像只有 `none` 与这三值。`none` 是没在阅读。镜像不驱动阅读屏。上报的 `mode` 只作接受结果，不拿来改 UI。

代际和 `bootId` 放在持续存在的 shell 上报器，不放进 `ReaderScreen`。同一页里卸载再打开，计数器不归零。`bootId` 在这份 JS 上下文里生成一次。webContents 重载出新上下文，就有新的 `bootId`。main 见到新 `bootId` 才把代际地板重置，然后接受这条上报。

## 菜单怎么更新

保留原生 `type: 'radio'` 和已批单选。不改成 checkbox，不自绘勾，不把 `enabled` 设为 false，文献库不假勾成原文。checkbox 能被 `SetChecked` 写成 false，但平台不保证互斥，所以不用。

更新办法只有重建菜单。按镜像做新模板：`original` / `contrast` / `translation` 在构造参数里给对应一项 `checked: true`，其余两项 false；`none` 三项都是 false。然后 `Menu.buildFromTemplate` 和 `setApplicationMenu`。不在已经挂上的 radio 上写 `checked`。应用、编辑、窗口 role 仍按现在的模板重建。缩放项保持普通项。

系统菜单点击和 accelerator 都会先把点中的 radio 设为选中。click 回调不写 `checked`。它先用最后接受的镜像重建菜单，换掉那份已经自动勾上的菜单，再派发已有事件，不等待 `executeJavaScript`。之后只有被接受的上报才再次重建。文献库的镜像是 `none`，所以点了也不会留下勾，项仍可点。

已批单选在有阅读栏位时由原生 radio 互斥表达。`none` 是一组里没有选中项，不另加「无」菜单项。读屏是否把「没有选中」说清楚，本轮未测，不写通过。

未验停点：构造期的 `checked: false` 在菜单打开后，会不会被系统强行勾上一项。本轮没跑 45.2.1。S2 要用真实 `Menu` 读三项的 checked，覆盖 original、contrast、translation、none，并且用系统菜单点击和 accelerator 看 none 不会留下假勾。只调用 `item.click` 不算通过。若全 false 守不住，停，不改自绘，不置灰。

## 通道

一条 invoke：`shell.reportViewMenu`。字段只有 `mode`、`generation`、`bootId`。`mode` 是上述四值。`generation` 是 1 到 `Number.MAX_SAFE_INTEGER`（9007199254740991）的整数，与现有代际上限同形。`bootId` 是 36 位十六进制带连字符的字符串。多余字段拒绝。没有文档 id、路径、文案。幂等 false。坏形状 `invalid_payload`。过期代际或窗口不符用已有 `rejected`。发送方 `sender_rejected`。不新造错误码。

S1 的 `expose` 是 false。codegen 不会把它写进三份生成物，运行时 registry 没有这条命令，`assertHandlers` 不会为它抛。不削弱断言，不吞启动错误。S2 才把 `expose` 改为 true，跑正常 codegen，并在同一次提交注册 handler。

handler 不改 `IpcCommandContext`。router 已经拒绝非 `oi-app:` 主 frame。handler 在任何 await 之前同步做：`BrowserWindow.getAllWindows()` 里未销毁的窗口必须正好一个；不是就 `rejected`，不改菜单。然后同步重建并 `setApplicationMenu`。成功返回之后才记下代际、`bootId` 和镜像。重建抛错则不记代际，变成 `handler_threw`。同一 `bootId` 的代际必须更大。新 `bootId` 接受这条代际并换地板。

窗口 `closed`：丢掉该槽。窗口已销毁就不再 `setApplicationMenu`。`window-all-closed` 现会退出进程；清理仍要做，避免槽留到测试或下一次窗口。

## 上报状态机

shell 只留一个期望快照，不是长队列。`ReaderScreen` 卸载不得删掉这个快照。离开不等待 invoke，回库不被卡住。更新的快照取代还没发出的旧快照。已经发出的旧上报不撤回；后到且代际更小的，main 返回 `rejected`。

同一快照遇到 `handler_threw` 最多再发一次，用新代际，内容是当时的最新快照，不是失败前的旧 mode。`invalid_payload` 和 `rejected` 不重发这一份。两次用尽后不排定时器。下一次主人变化，包括再离开或重开，重新获得两次额度。阅读屏不因菜单失败停住。代际若再加一会超过安全整数，就不发送、不回绕；阅读仍可切换，菜单停在上次接受的镜像。

| 轨迹 | 期望 mode | 序列 |
| --- | --- | --- |
| 启动 | none | 菜单按 none 重建。代际地板 0。还没有 bootId |
| 打开，含加载 | original | 主人先到 original，再发新代际。勾在上报接受后才是原文 |
| 错误页 | 已选栏位 | 不改成 none。空态句仍只在成功支 |
| 换文献 | original | 同一 bootId，代际增加。不先发上一篇的栏位 |
| 连点 | 最后一次 | 飞行中只保留最新快照 |
| 离开 | none | 先记入期望，再同步卸下。不 await |
| 离开未回就重开 | original | 新代际的 original 取代未发的 none。后到的 none 被拒绝 |
| 抛错一次 | 最新快照 | 新代际重试这一次。不重放旧 mode |
| 同一快照两次失败 | 上次成功的镜像 | 不冻结。下次主人变化重新计数 |
| 重载 | 新上下文的初值 | 新 bootId 重置地板。旧代际不能压住新的 1 |
| 代际将溢出 | 上次成功的镜像 | 不发送 |
| 第二个窗口 | 不变 | `rejected`。不重建 |

## 分批与行数

硬线：非生成新增+删除 600；只改 `packages/contracts/` 时 200。346 是估算 × 1.73 ≤ 600 的门槛。生成物不在 pr-size 排除名单。函数软 50、硬 80。超过软线就拆，到硬线就停。不写 G12，不删测试。

唯一顺序：S1 → S2 → E2-0 → E2-1 → E2-2 → S3。S3 依赖 E2 的栏位主人和 S2 的 handler。E2-0/1/2 不写上报，也不等 S3。没有循环。每一笔都要单独批准。

| 笔 | 合入后能启动 | 菜单实际状态 | 估算 | ×1.73 |
| --- | --- | --- | --- | --- |
| S1 | 能。命令不进 registry | 仍是普通项，没有勾 | 167 | 289 |
| S2 | 能。handler 已注册 | 三项 radio，镜像 none，全不勾。点击会被重建抹掉 | 299 | 517 |
| E2-0 | 能 | 与 S2 相同 | 72 | 125 |
| E2-1 | 能 | 菜单仍是 none。工具栏和事件能改栏位，勾还没跟上 | 338 | 585 |
| E2-2 | 能 | `clickMenu` 只证明命令送达 | 109 | 189 |
| S3 | 能 | 勾跟主人。离开为 none，重开为原文 | 182 | 315 |

S1 文件与改完行数：新建 `packages/contracts/src/ipc/shell.ts` 75，函数都短于 50；`packages/contracts/src/index.ts` 现有出口加约 12，文件仍低于 400；`packages/contracts/test/ipc-shell.test.ts` 80。合计 167，低于契约 200。`expose: false`，三份生成物的 diff 是 0。若 codegen 仍改出文件，停，不手改。

S2 按 codegen 展开估算，不是只算通道名。registry 这一条命令约 77 行（请求和响应都展开 `anyOf` 与代际上下限）。`oi.generated.ts` 的方法约 22 行。`oi-api.d.ts` 的错误分支和 `Window.oi.shell` 约 18 行。三份合计约 117，都计入 600。再加 expose 替换 2、`view-menu-mirror.ts` 新建 90、`library-menu.ts` 由 94 增到约 109（计入约 15）、`library-wiring.ts` 由 253 增到约 273（计入约 20）、真实 Menu 与代际测试约 55。117+2+90+15+20+55 = 299，低于估算门槛 346。重建函数低于 50。两个菜单文件改完仍低于 400。codegen 的 numstat 若把 299 推过 346，先停，只拆测试，不拆「expose 与 handler 同一笔」。不改 `ipc-router.ts`。

S3 计入 100+20+12+50 = 182：新建 `view-menu-report.ts` 100，入队和重试都低于 50；`shell.tsx` 由 147 到约 167；`use-view-mode.ts` 由约 36 到约 48，仍低于 50。不把回调塞进已经接近 80 行的 `ReaderScreen`。行为测试约 50，覆盖上表。

## 验收

S1：契约测试钉住 expose false、四值、代际上限、坏 `bootId`、多余字段。不启动 Electron。

S2：唯一未销毁窗口才重建；零个或两个窗口是 `rejected` 且菜单不变。代际和 bootId 按上面的规则。真实 Menu 读 checked。系统点击和 accelerator 在 none 下不留假勾。`item.click` 不能单独算过。本轮这项未跑。

S3：上表每一行都有行为测试。不读源码做断言。不写 `ReaderSession`。不发翻译。页码、历史、缩放不变。e2e 的 `clickMenu` 不代替 Windows 物理键。mac 无设备则未验证。R-E13 不在这三笔。

## 将来另批的范围

审查通过后才可以请 Wisdom 批某一笔。本文件不代批。ARCH 正文是独立禁区：批准编码不包含改 ARCHITECTURE。要改 §9.1 必须另有明确授权，否则停。

- S1：`packages/contracts/src/ipc/shell.ts`、`packages/contracts/src/index.ts`、`packages/contracts/test/ipc-shell.test.ts`。不含生成物，不含 handler。
- S2：上述 `shell.ts` 的 expose、三份生成物、`view-menu-mirror.ts`、`library-menu.ts`、`library-wiring.ts` 及测试。不含 renderer。
- S3：`view-menu-report.ts`、`shell.tsx`、`use-view-mode.ts` 的回调及测试。不改 reader 的 domain、application、`index.ts`、`pure.ts`，不改 `contracts/src/ipc/reader.ts`。

不批：手改生成物、给 context 加 senderId、削弱 `assertHandlers`、CSP、协议、缩放菜单、置灰、持久化、ARCH 正文。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 按 FAIL 修订本文件和 E2 顺序。不编码 |  |  |
| 2 | Forge 复审。通过前不写 S1 |  |  |
| 3 | 另批之后从当时的 main 开被点名的那一笔 |  |  |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先写设计，不编码 | 12:08 原话 | 2026-11-16 12:08 | Wisdom，[6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822) |
| 用重建菜单表达四态 | v45.2.1 的 `SetChecked` 不能把已挂 radio 写成 false | 2026-11-16 | 本设计按 Forge FAIL 修正，不是新批准 |
| S1 不暴露命令 | `assertHandlers` 会在启动时抛，不是 `handler_threw` | 2026-11-16 | 同上 |

## 自检

- [x] 影响 arch / prd 吗？不影响。未改正文。批准编码也不自动包含 ARCH。

## 交接

从当时的 main 另开，Draft。先完整读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md` 和本文件。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。没有点名的笔不开工。不改 ARCH。

S1 是 seam 变更。无 feature 切片。expose 保持 false。估算 167。

S2 是 main 接线。依赖 S1 已合入。重建菜单，不写已挂 radio 的 checked。先做真实 Menu 停点。估算 299。

S3 是 UI 改动。切片是 reader 的 `src/ui` 加 desktop renderer。依赖 S2 和 E2-1 的主人。估算 182。R-E13 保持未验证。
