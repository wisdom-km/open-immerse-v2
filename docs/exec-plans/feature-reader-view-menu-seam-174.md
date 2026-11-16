# 执行计划

E2 菜单选中状态回传的最小 seam 设计。文件名按指定保留。分支仍是 `feature/reader-view-modes-e2-plan-174`。栏位与空态在 [E2 计划](feature-reader-view-modes-e2-174.md)。

本文件只写设计。2026-11-16 12:08 原话只批准写设计，不批准编码。来源 [#174 6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822)、[PR #220 6907027779](https://github.com/wisdom-km/open-immerse-v2/pull/220#issuecomment-6907027779)。Forge 对 `efbccaf` 的第六轮审查：技术方案 PASS，R1/R2 关闭，架构不换。整体计划只剩 S2c 的估算越过 600 的余量。本轮只把这一笔拆开，不请求编码批准，不自称新 tip 已通过。

不改产品代码、测试、生成物、CI、PRD、ARCHITECTURE、RULES、DESIGN。不开 Ready，不合入，不发版。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 为什么不留两套

上一稿的公开事件可以补上真实一飞、pending 和注册文件，那三项并不非要删掉公开。删掉它是因为更小：同一条命令按需读取文档代，就不再需要 `CustomEvent`、公开 attempt、`executeJavaScript` 重试和渲染端单调接收器。旧请求仍由 main 的文档代挡住。`isAppSender` 只比较 `oi-app:`、webContents id 和 `mainFrame` 引用；`RenderFrameHostChanged` 会按 frame tree node 更新已有 `WebFrameMain`。这个引用不是文档身份，所以不删文档代。本文件只保留这一套。

没有 ack、两次脚本失败，不再是阻塞。本设计不再发布那种脚本。不承诺零故障：底层 invoke 一直不返回时，菜单同步暂停，阅读和切模式继续。不为此加 toast 或新产品控件。

## 仍然成立

`MenuWillShow`（`electron_api_menu.cc` 132–145 行）会把全 false 的 radio 勾上第一项。none 用普通原生项，不写 checked。活动三模式用 radio，构造参数里恰一项 `checked: true`。不在已挂 radio 上写 checked。不加「无」项，不自绘，不置灰，不改 checkbox。标签、accelerator、enabled、事件名不变。这和已批语义相容。

S1 的 `expose` 保持 false。S2c-prep 只写未暴露的 handler 和它的单元行为测试，不进 registry，也不改生产表。S2c-on 同一笔才把 `expose` 改为 true、跑 codegen，并把 handler 放进 `startLibrary` 返回的那张生产表，同时改装配测试。expose 和生产注册不拆开。不削弱 `assertHandlers` 或 `acceptsSender`。`composition-root.ts` 仍只调用 `startLibrary`，它的 diff 是 0。这两笔的实施都还没批。

阅读屏里的 PDF 错误页不是浏览器错误文档，不退役。空态句仍只在成功支。

## 文档代

main 按 `webContents.id` 存槽。阶段只有 `unpublished`、`open`、`retired`。成功的 `oi-app:` 主 frame `did-navigate` 就把 epoch 加一、地板归零、阶段改为 `open`。不等 `did-finish-load`。该事件只在已提交且非错误页的导航上出现，URL 在事件参数里，不用 `getURL()` 证明成功。

| 事件 | 结果 |
| --- | --- |
| 主 frame `did-navigate`，URL 是 `oi-app:` | `open`。epoch 加一。超过安全整数上限则 `retired`，不回绕 |
| 主 frame `did-navigate`，URL 不是 `oi-app:`，还没公开过 | 保持 `unpublished`。初始 blank 不退役 |
| 主 frame `did-navigate`，URL 不是 `oi-app:`，已经 `open` | `retired` |
| 主 frame `did-fail-provisional-load` | `retired`。之后的 finish 不重新公开 |
| same-document | 不换代 |
| 未 commit 的取消 | 阶段不变。不用 `did-fail-load` |
| `render-process-gone` | `retired` |
| `closed` | 删槽。不再碰 Menu |

`createMainWindow` 现在返回前就 `loadURL`。监听改到 `loadURL` 之前，避免漏掉第一次 `did-navigate`。不改导航决定。若某次成功的 `oi-app:` 加载没有 `did-navigate`，停，不改用 `getURL()`。这个缺口本轮没在已读源码里看见。

换代或退役时，经替换门请求 none 形状。这不是从产品模式推导，只表示当前没有已接受的阅读栏位。上报 payload 不写入 pending。

## 一条命令

`shell.reportViewMenu`。一条命令，两个闭合分支，不再开第二条 IPC。`payload-schema.ts` 已按 `anyOf` 匹配，codegen 会复制整份 schema，不另写解析器。`read` 只有 `op`；`mode`、`epoch`、`generation` 都是多余字段。`submit` 必须有 `op`、四值之一的 `mode`、`epoch`、`generation`。多余字段拒绝。没有 bootId。成功体都是 `{ epoch }`。读返回槽上的当前代，不改镜像，不归零地板，也不把 generation 归零。提交成功时回声的是刚接受的那一代，不是新的授权，不据此重置 generation。幂等 false。router 不自动重试。

`payload-schema.ts` 的 integer 分支只判断 `Number.isInteger`，不执行 minimum / maximum。契约测试不能代替这条分类。handler 先检查 epoch 和 generation 都在 1 到 `Number.MAX_SAFE_INTEGER`；超出回已有 `invalid_payload`。其后窗口、阶段或 epoch 不符，以及 generation 小于或等于地板，回已有 `rejected`，并且发生在菜单副作用之前。发送方 `sender_rejected`。不新造错误码，不扩大通用 router。

`senderWebContentsId` 由 router 在 `acceptsSender` 通过后，从 `event.sender.id` 抄入。载荷里没有它。

提交进入替换门之前，同步确认。范围失败是 `invalid_payload`，下面各项是 `rejected`：

1. epoch 与 generation 都在 1 到 `Number.MAX_SAFE_INTEGER`。
2. context 里的 id 是数字。
3. 未销毁窗口恰好一个，且 `webContents.id` 等于这个 id。
4. 该槽阶段是 `open`。
5. 载荷 epoch 等于槽的 epoch。
6. generation 严格大于地板。相等也拒绝。

读请求只做 2 到 4。然后返回 epoch。不进替换门。

任一提交检查失败：不调用 `setApplicationMenu`，不改地板，不把这份 payload 留进 pending。

通过之后才进门。返回后再次核对：同一窗口仍是唯一未销毁窗口，槽还在，阶段仍是 `open`，epoch 没变，尝试记号没被清掉。核对失败不写地板，安装状态标为 `unknown`。核对通过只让这一笔成为候选。退出并处理 pending 之后，只有最终结果仍是这一份快照，才写它的地板和镜像并标为已知。

## 真实一飞

每个 JS 领域同时最多一个未完成 invoke，外加一个可覆盖的最新快照。读和提交共用这一个 busy。`electron_api_ipc_renderer.cc` 的 `Invoke`（92–115 行）每次调用都新建 Promise，并交给原生回调。渲染端定时器取消不了它。

发送前 busy 必须为空。只有发 `submit` 才取走并清空快照。发 `read` 时快照留在槽里，期间 `original` 再变成 `contrast`，槽里留下 `contrast`。generation 只在 `submit` 发出时分配。

正常接续和失败补发分开。正常接续：为同一最新快照先 `read`，成功后存下 epoch、释放 busy，再取走当前快照发一次 `submit`。revision 没变也发。这不是失败重试，也不需要用户再改一次栏位。失败补发仍然禁止：同一次 `submit` 失败、被拒绝或超时后，不把同一份放回槽，也不在完成回调里自己再发。超时只把菜单同步标成暂停，不清除 busy，不发出第二个请求。`submit` settle 之后，只有槽里已经有后来写入的快照才发那一份；槽空就不补。一直不返回时不新发 invoke，菜单停在上次结果，阅读和切模式继续。新文档的脚本上下文释放时，`WillReleaseScriptContext` 会 `reset` 该 frame 的 remote（245–250 行）。这释放的是旧领域，不是同一领域里的第二条调用。旧 IPC 响应不向新文档注入脚本。

读失败不自旋，也不把同一次意图补回去。还没有 epoch 时，菜单命令或栏位变化可以再给一次读取机会；多次只合成一个标记，不建每次操作的队列。失败回调自己不置这个标记。已经有 epoch 时，这些操作只更新快照：不忙就直接发 `submit`，忙就等 settle 后只发后来写入的那一份，不置重读标记。若第一次读发生在槽还没 `open`，`rejected`，不带可用 epoch。这不放宽 main。

页面 `load` 时若已经有 epoch，清掉这个标记，不再读。若没有 epoch 且不忙，直接再读一次。若没有 epoch 但 busy，只把标记置上，不新发 invoke。旧调用真正 settle 之后：已经有 epoch 就清掉标记，不再读，然后按正常接续提交槽里的快照；仍没有 epoch 且标记还在，就发一次 `read` 并清掉标记。旧调用永不结束时，标记留着也不新发。没有间隔定时器。

## 替换门

上报、click、生命周期共用一个门。状态是已提交镜像、安装状态已知或 `unknown`、至多一个 pending。pending 只接收生命周期的 none，并记下当时的阶段记号。被拒绝的上报不能变成 pending。

一份新的合法完整快照开始之前，先清掉同一当前阶段留下的 pending none，再做这次原生替换。不能先装上新快照，退出时再装旧 none。这次替换期间由更新生命周期写下的 none 仍保留。文档或阶段已经换代时，旧 submit 后置核对失败，不提交旧镜像。门只交出一个最终结果。handler 只按这个结果写地板、镜像和已知；结果不是这份 payload 时，不把这份 payload 标成已知。仍然至多一个 pending。

无论成功、抛错还是后置核对失败，退出时都看 pending。记号仍对应当前槽，才再替换一次。这次替换期间 pending 又被更新：留下最新值，安装状态标为 `unknown`，不再进入下一轮。下一次上报、click 或生命周期事件才再试。窗口已销毁不碰 Menu。不宣称原生回滚。

click 按已提交镜像重建，用来抵消 radio 的自动勾。门正在替换时，click 不派发，也不用旧镜像覆盖 pending。门成功才派发已有事件，并接住 `executeJavaScript` 的拒绝。栏位主人的同一命令函数给出这次的目标值，同值也回调完整快照。shell 把这个目标写入最新槽，不在 `setState` 之后去读尚未提交的 React render。不另造第二份 viewMode。新文档代上的读取、离开时的 none、换文献后的 original，都进同一个槽。已有事件不加来源字段。若这次提交仍失败，保持故障，不假装已经对齐。

## 轨迹

| 轨迹 | 结果 |
| --- | --- |
| 首次 `oi-app:` commit | epoch 为 1。不依赖 finish 公开 |
| 读在 commit 前到达 | 副作用前拒绝。不带可用 epoch |
| 唯一 original，read 成功 | 存 epoch 后提交这一份。不需要用户再改一次 |
| read 期间再变成 contrast | 快照留在槽里。成功后只提交 contrast |
| 早读失败在 load 前返回 | 失败不置标记。load 时不忙且无 epoch，再读一次 |
| load 时 read 仍 busy | 置一次标记，不新发。settle 后仍无 epoch 才用掉这一次 |
| 早读失败在 load 后返回 | 用掉 load 时置上的那一次。失败回调不把标记再置上 |
| read 成功之后又 load | 已有 epoch，清掉标记，不再读 |
| 无新快照时 submit 失败 | 不放回，不自旋 |
| 打开阅读 | 接受后才是 radio，且只勾原文 |
| 阅读屏错误页 | 不退役 |
| 已提交浏览器错误页 | 退役。finish 不公开 |
| 连点 | 未发送的快照被最后一次覆盖。未完成 invoke 仍是一个 |
| 超时 | 不发第二个。settle 后只发当时的最新快照；没有新快照就不补发 |
| 离开 | 不 await。未取走的 none 可被 original 覆盖 |
| 旧 epoch 的请求迟到 | 副作用前拒绝。不改地板，不重建 |
| 正常退出时，这次替换期间留下 pending | 按阶段记号最多再替换一次。开始前已清掉的旧 none 不在其中 |
| 修复期间 pending 又变 | `unknown`。不递归 |
| 旧 pending none 还在，随后同代 contrast | 先清掉这份 none。最终菜单和镜像都是 contrast |
| 这次替换期间换代并写下 none | 旧 submit 不提交旧镜像。新 none 留下 |
| 上次同步失败或暂停后，UI 已是 contrast，再点对照 | 命令函数回调同值目标。接受后菜单才是 contrast |
| 调用之前拒绝 | 不调用替换 |
| 调用之后核对失败 | `unknown`。不写地板 |
| 窗口销毁 | 不碰 Menu |

## 分批

实际硬线 600。只改 `packages/contracts/` 时实际硬线 200。346 只是估算 × 1.73 ≤ 600 的重估触发点，不是门禁。生成物计入。计入的是新增+删除。函数软 50、硬 80。估算超过 346 先重算，必要时拆整批。实际 diff 超过 346 不写成失败，不请 G12。超过适用的 600 或 200 才停。不删测试，不靠删断言凑数。上一稿里渲染端事件接收器的测试随公开机制删除，不是删掉已有测试。上一稿的 310、332、246 不含本轮补的转移和断言，下面按补齐后的行重算。

顺序：S1 → S2a → S2b → S2c-prep → S2c-on → E2-0 → E2-1 → E2-2 → S3。没有循环。E2 三笔不写上报。S3 依赖 S2c-on 和 E2-1。每一笔另批。S2c-prep 与 S2c-on 的实施都未批。批准编码不包含改 ARCHITECTURE。

| 笔 | 合入后能启动 | 菜单 | 计入 | ×1.73 |
| --- | --- | --- | --- | --- |
| S1 | 能。不进 registry | 今天的普通项 | 198 | 343。200 档只用 198 |
| S2a | 能。无这条 handler | 与 S1 相同 | 234 | 405 |
| S2b | 能。仍不暴露 | none 形状的普通项 | 344 | 595 |
| S2c-prep | 能。命令仍不进 registry | 与 S2b 相同，none 形状 | 190 | 329 |
| S2c-on | 能。生产表里已有 handler | 仍是 none 形状，直到提交被接受 | 252 | 436。生成物约 150 未实测 |
| E2-0 | 能 | 与 S2c-on 相同 | 72 | 125 |
| E2-1 | 能 | 仍无勾。工具栏能改栏位 | 338 | 585 |
| E2-2 | 能 | `clickMenu` 只证明事件 | 109 | 189 |
| S3 | 能 | 文献库是普通项。接受原文后才是恰一勾的 radio | 340 | 588 |

S1：`shell.ts` 新建 90，低于 400。`packages/contracts/src/index.ts` 200 行，计入 10。契约测试 98。198 = 90+10+98。生成物 diff 为 0。真实 diff 超过 200 就停，不改成 expose true。

S2a：`ipc-router.ts` 244 行，计入 18，改完约 262，`commandContext` 短于 50。`view-menu-epoch.ts` 新建 100，阶段函数短于 50。`window.ts` 计入 4。`index.ts` 59 行，计入 12。测试 100，只覆盖文档代表，不覆盖已经删除的渲染端事件。234 = 18+100+4+12+100。

S2b：`view-menu-gate.ts` 104。上一稿 90 行不含「新快照先清同阶段旧 none」和「只按最终结果写已知」。这两段各成短函数，短于 50。`view-menu-mirror.ts` 50，替换函数短于 50。`library-menu.ts` 94 行，计入 20，改完约 110。`library-wiring.ts` 这一笔只改菜单装配，252 行，计入 40，改完约 280，仍低于 400。测试 130。上一稿 110 行不含最终 contrast 不被旧 none 盖掉，以及替换期间换代后旧 submit 不提交。344 = 104+50+20+40+130。

上一稿把 S2c 估成 360，360 × 1.73 = 622.8，超过 600 的估算余量。346 只是重估或拆分的触发点，不是 CI 失败，也不请 G12。本轮不把用例删到 138 或 222 那种示意拆法里。示意数没有把准备笔的测试接线和启用笔对现有装配测试的增删算进去。用例都留着，按下面两笔重算。不跑 codegen。

S2c-prep：`view-menu-handler.ts` 78。范围检查单独成函数，短于 50。不改 `shell.ts` 的 expose，不改三份生成物，不改 `wiredLibraryCommands`。单元测试 112 = 28 的夹具接线 + 22 的越界 `invalid_payload` + 16 的 generation 不大于地板 + 18 的零个或两个窗口 + 28 的阶段、epoch 或窗口不符且发生在菜单副作用之前。190 = 78+112。190 × 1.73 = 329。合入后能启动，因为这条命令还不在 registry，`assertHandlers` 不会找它。

S2c-on：expose 计入 2。生成物约 150，不是跑过 codegen：请求的 `anyOf` 用两空格 JSON 数过，registry 约 83 行，方法加 `oi-api.d.ts` 约 67 行。`library-wiring.ts` 从 S2b 之后的约 280 行接着改，这一笔的新增+删除是 30，不是在 280 上再加 30 行；改完仍低于 400。它把 `shell.reportViewMenu` 放进 `wiredLibraryCommands`，`startLibrary` 因而带上它。装配测试 70 = 现有 `ipc-production-assembly.test.ts`（现在 46 行，手写通道表）的新增+删除 28，加上生产表含这条通道、用这张表加完整 `ipcRegistry` 调用 `registerIpcRouter` 不抛、缺通道就抛，这三项 42。252 = 2+150+30+70。252 × 1.73 = 436，低于 346 这个触发点，也低于 600。生成物仍是估算。实跑 codegen 若把这一笔的估算推过 346，先重算；expose、codegen、生产表注册和这份装配测试仍在同一笔。实际超过 600 才停。不写 G12，不删测试。S2c-prep 不代替这一笔。两笔实施都未批。

S3 的 `shell.tsx` 基线是 E2-1 的约 161 行，不是 main 上的 147。E2-2 的 20 行是事件测试，不把 shell 的基线再改掉；若那一笔实际改了文件，S3 开工前按当时行数重算。`view-menu-report.ts` 新建 128。上一稿 100 行不含「read 保留快照」「read 成功后续 submit」和那一个重读标记。这三段各短于 50。`shell.tsx` 计入 40，改完约 190。`use-view-mode.ts` 由约 36 到约 56，计入 24。上一稿 16 行不含同值也回调目标值。函数短于 50。测试 148。上一稿 90 行不含下面验收里 read 接续和 load 交错的用例。340 = 128+40+24+148。不把回调塞进 `ReaderScreen`。

## 验收

S1：expose false、两种 op、四值、整数上下限、多余字段、读请求不接受 mode、没有 bootId。不启动 Electron。

S2a：监听先于 `loadURL`。初始 blank、成功 `oi-app:` commit 即 `open`、错误提交后的 finish 不公开、公开后的 blank、取消不变、溢出不回绕、`render-process-gone`、closed。不测渲染端事件。

S2b：none 经过 `_menuWillShow` 仍无勾；活动形状恰一勾。成功、抛错、后置失败三种退出都会消费仍有效的 pending，并且最多再替换一次。修复期间 pending 更新后保持 `unknown` 且不递归。恢复中留下的同代 pending none，被下一份合法 contrast 先清掉；最终原生菜单和镜像都是 contrast，不先装 contrast 再被旧 none 盖掉。这次替换期间换代写下的 none 优先，旧 submit 不提交旧镜像。窗口销毁不碰 Menu。不把模板读数当成菜单仍开着的画面。

S2c-prep：handler 检查逐条有单元测试。越界整数在副作用前是 `invalid_payload`。generation 相等或更小在副作用前是 `rejected`。零个或两个窗口不替换。阶段、epoch 或窗口不符也在副作用前拒绝。不把只含 `Number.isInteger` 的 schema 测试写成 transport 已拒绝越界。本笔不注册生产表。

S2c-on：`wiredLibraryCommands` 含这条通道。用这张表加完整 `ipcRegistry` 调用 `registerIpcRouter` 不抛。生产表缺这条通道时抛出。现有手写通道表的装配测试同一笔改掉，否则新暴露的命令会让它失败。expose、生成物、生产注册和这些断言在同一笔。

S3：未完成 invoke 始终不超过一个，最新槽始终不超过一个。唯一 original 在 read 成功后被 submit，中间不要求再改栏位。read 期间多次变化只提交最后一份。早读失败在 load 前、load 后两种到达都只再读一次。load 撞上 busy 不丢掉那一次。read 成功后不再消耗它。无新快照时 submit 失败不自旋。超时不增加 invoke，也不清除 busy。同值命令仍回调目标快照。正常接续和失败补发分成两组断言。不断言源码文本。`clickMenu` 只算事件。物理键、读屏、菜单仍开着的画面、mac，继续未验证。R-E13 不再等真 8GB：13:41 起在 DESKTOP-0GI64S8（32GB）上测，标明硬件，不称 8GB 验证。本文件不跑这项测量，也没有测量数。这些用例本轮没有跑。

## 将来另批才许改的文件

技术复审通过前不开工。通过后一次只请求点名的一笔。ARCH 正文不在其内。

- S1：`packages/contracts/src/ipc/shell.ts`、`packages/contracts/src/index.ts`、`packages/contracts/test/ipc-shell.test.ts`。
- S2a：`ipc-router.ts` 的 context 字段，`view-menu-epoch.ts`，`window.ts` 的加载顺序，`index.ts` 的挂接，及测试。不含菜单形状，不含 expose。
- S2b：`view-menu-gate.ts`、`view-menu-mirror.ts`、`library-menu.ts`、`library-wiring.ts` 的菜单装配，及测试。不含 handler。
- S2c-prep：`view-menu-handler.ts` 和它的单元测试。不含 expose，不含生成物，不含 `wiredLibraryCommands`。
- S2c-on：`shell.ts` 的 expose、三份生成物、`library-wiring.ts` 的 `wiredLibraryCommands`、`ipc-production-assembly.test.ts`。不含 renderer 上报。不把 handler 再挪到另一笔。
- S3：`view-menu-report.ts`、`shell.tsx`、`use-view-mode.ts` 的回调及测试。不改 reader 的 domain、application、`index.ts`、`pure.ts`，不改 `contracts/src/ipc/reader.ts`。

不批：手改生成物、削弱断言或 `acceptsSender`、载荷自定 epoch、新的 `ipcMain` 或取消通道、公开用的 `executeJavaScript`、CSP、协议、缩放菜单勾、置灰、持久化、ARCH 正文。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品代码 |  |  |
| 2 | Forge 复审。通过前不写 S1 |  |  |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 12:08 只写设计 | 原话见文首 | 2026-11-16 | Wisdom |
| none 用普通项，活动模式才用 radio | `MenuWillShow` 会补选。与已批语义相容 | 2026-11-16 | 按审查修正，不是新批准 |
| 按需读取文档代，不发布脚本 | 公开层可以留下，但和真实一飞叠在一起更大。frame 引用不能代替文档代 | 2026-11-16 | 同上 |
| 真实一飞，超时不释放 busy | `Invoke` 每次都新建 Promise。定时器取消不了它 | 2026-11-16 | 同上 |
| 三种退出都消费 pending | 只在失败时 drain，正常返回会把 none 留在槽里 | 2026-11-16 | 同上 |
| 同值菜单命令也提交快照 | React 同值更新不会再上报，菜单会停在旧镜像 | 2026-11-16 | 同上 |
| S2c 改 `wiredLibraryCommands` | 新建 handler 文件不会进入 `startLibrary` 的表。`assertHandlers` 会在启动时抛 | 2026-11-16 | 同上 |
| S2c 拆成准备笔和原子启用笔 | `efbccaf` 的 360 × 1.73 超过 600 的估算余量。handler 可先不暴露。expose 与生产注册仍同一笔。两笔实施都未批 | 2026-11-16 | 按第六轮审查修正，不是新批准 |
| read 成功后续 submit；load 忙时保留一次重读 | 只发 submit 才取走快照。失败不把同一份补回。重读机会合成一个标记 | 2026-11-16 | 按第五轮审查修正，不是新批准 |
| 新合法快照先清同阶段旧 pending none | 否则 contrast 装上之后，退出时又被更早的 none 盖掉 | 2026-11-16 | 同上 |
| R-E13 改在当前 32GB 真机测 | 13:41 原话只改等待真 8GB 的排期。不取消上面的设计修正。不称 8GB 验证 | 2026-11-16 | Wisdom，[6908396514](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6908396514) |

## 交接

从当时的 main 另开，Draft。先完整读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md` 和本文件。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。没有点名的笔不开工。不改 ARCH。技术复审通过前不开工。通过后一次只请求点名的一笔，并且不包含 ARCH 正文。

S1 是 seam 变更。估算 198，契约档实际 200。S2a 估算 234。S2b 估算 344。S2c-prep 估算 190，未暴露。S2c-on 估算 252，生成物约 150 未实测；expose 与生产注册同一笔。S3 是 UI 改动，估算 340，`shell.tsx` 从约 161 行续。346 不是门禁，600 才是。R-E13 按 13:41 在 DESKTOP-0GI64S8（32GB）上测，标明硬件，不称 8GB 验证。这不是 PRD §8 里 M2 仍写的 8 GB 真机录屏的豁免，本轮不改 PRD。本文件不跑这项测量。
