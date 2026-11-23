# 执行计划

E2 菜单选中状态回传的最小 seam 设计。文件名按指定保留。分支仍是 `feature/reader-view-modes-e2-plan-174`。栏位与空态在 [E2 计划](feature-reader-view-modes-e2-174.md)。

本文件只写设计。2026-11-16 12:08 原话只批准写设计，不批准编码。来源 [#174 6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822)、[PR #220 6907027779](https://github.com/wisdom-km/open-immerse-v2/pull/220#issuecomment-6907027779)。Forge 对 `efbccaf` 的第六轮审查：技术方案 PASS，R1/R2 关闭，架构不换。整体计划只剩 S2c 的估算越过 600 的余量。本轮只把这一笔拆开，不请求编码批准，不自称新 tip 已通过。

不改产品代码、测试、生成物、CI、PRD、ARCHITECTURE、RULES、DESIGN。不开 Ready，不合入，不发版。

2026-11-23 13:44 起，现行依赖、接受凭证、唯一写入口和后续白名单在文末「当前精确依赖与后续分批」。上面各节保持原样。两边说法冲突时，以文末写明的现行来源为准，不把未来拟议写成已经批准的实施。

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

S2c-on：expose 计入 2。生成物约 150，不是跑过 codegen：请求的 `anyOf` 用两空格 JSON 数过，registry 约 83 行，方法加 `oi-api.d.ts` 约 67 行。`library-wiring.ts` 从 S2b 之后的约 280 行接着改，这一笔的新增+删除是 30，不是在 280 上再加 30 行；改完仍低于 400。它把 `shell.reportViewMenu` 放进 `wiredLibraryCommands`，`startLibrary` 因而带上它。装配测试 70 = 现有 `ipc-production-assembly.test.ts`（现在 46 行，手写通道表）的新增+删除 28，加上生产表含这条通道、用这张表加完整 `ipcRegistry` 调用 `registerIpcRouter` 不抛、缺通道就抛，这三项 42。252 = 2+150+30+70。原始估算252低于346重估触发值；乘1.73后的约436低于600实际门禁。生成物仍是估算。实跑 codegen 若把这一笔的估算推过 346，先重算；expose、codegen、生产表注册和这份装配测试仍在同一笔。实际超过 600 才停。不写 G12，不删测试。S2c-prep 不代替这一笔。两笔实施都未批。

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

## 本批限定例外（2026-11-23 02:42）

来源是 [Issue #174 评论 7083807265](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7083807265)。上文「`composition-root.ts` 仍只调用 `startLibrary`，它的 diff 是 0」保持为当时的句子，也仍约束 S2c-on、E2、S3、handler、`expose`、codegen 和其他未点名文件。本批只追加这一处例外，不改那些句子，不改分批顺序。

例外只覆盖 `apps/desktop/src/main/composition-root.ts` 的三件事：接收已经创建的那一个 epoch，类型导入，以及把它作为参数转交给 `startLibrary`。装配职责仍留在 `startLibrary`。不建全局查找、模块单例或第二张代次表。旧的两参数调用保持原行为。

同一批准还允许本批改 `view-menu-gate.ts`：在调用 `ports.dispatch` 之前同步比较 `currentMark` 与 `markAtStart`，比较到调用之间没有 await。公开端口不加参数。门不 import epoch。对应行为落在 `view-menu-gate.test.ts`。`view-menu-wiring.test.ts` 只更新共享 epoch 接通之后必然变化的 `noteNone` 次数和行为；未注入路径、第一次 commit 以前的 0 次断言，以及其他安全断言保留。

实施范围、订阅形状、验收和停点以 [feature-view-menu-lifecycle-none-174.md](feature-view-menu-lifecycle-none-174.md) 为准。本段不把尚未跑过的行为写成通过。

## 当前精确依赖与后续分批（2026-11-23 13:44）

来源是 Wisdom 的原话，全文在 [Issue #174 评论 7092677446](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7092677446)。本段只追加。它不批准 handler、expose、codegen、生产接线、三视图或 E2 编码。实施、Ready、合入、发版仍要另批。

2026-11-23 14:29 的 [评论 7093393948](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7093393948) 只纠正下面 B1、B2 的相关句子。`7e12983e1a63a1214f430acef500dd4be0c59000` 的 Forge 只读复审仍是 FAIL，保留，不改写成通过。非阻断的文件全路径、PR 模板勾选和未来 `postCheck` 不在这次修正里。不选函数签名，不改契约，不转实施。

开工时再核过 `origin/main`。提交 `564804f06ccb35998e592f86f808dc9060cfdca6`，tree `b11d0e999daf45bc56743e8bfa19b8b612dc0985`，唯一 parent `e70ec91a673cb2784491bb02924d77b96a05b147`。与 Forge 在 [评论 7092475121](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7092475121) 写下的合入结果一致，也与本批读取的 PR #234 API（`merged_at` `2026-11-23T05:30:07Z`，head `19529ac752d9738a01e5f234dc0a99710304a0a8`）一致。没有漂移，所以没有改起点。

Loom 原则核查与 Forge 只读依赖核查，批准评论写明已经完成。现行顺序仍是 S2c-prep → S2c-on → E2-0 → E2-1 → E2-2 → S3。本批停在文档，不跳到 E2。

PR #234 已合入的只是单窗口 none 生命周期桥接，以及旧 click 在派发前的记号比较。`commitFloor` 仍延后。这不是活动的原文 / 对照 / 译文，也不是 M2 退出。PR 正文记录的历史留在原处：`133470a` 的 Windows `EBUSY` 后后续步骤被跳过；`07c58fe` 去掉删除、库仍未关时官方六项为绿；`19529ac` 是代码侧必要 BLOCK 0 的 tip。13:19 的取舍评论保留 Node 199 个文件 986 通过、Python 181 通过、check 首轮退出码 1 与第二轮退出码 0、G9，以及两项执行偏差。合入同步写明不追认重复整链 check、canvas 条件不满足即安装、纯 Python editable 构建边界和旧越锁；canvas 绑定是否加载未知；完整依赖哈希未全部单独核验；真实 Electron、用户机、活动三视图未验。交接压缩句还写着「独立92首四suite解析失败后仓外alias通过限制保留」和「typecheck首失败后补链接」。这两句不在 7092308760 或 7092475121 的正文里。本批没有重读那份日志，不把它们展开成新的实测计数，也不从已经保留的偏差里删掉。本段不重跑，不追认，不把历史改写成首次全绿。

上文「`composition-root.ts` 的 diff 是 0」是 2026-11-16 的句子。2026-11-23 02:42 只给那一批开了参数转交例外，并写明该例外不扩到 S2c-on、E2、S3。当前 main 上，`index.ts` 创建一次 epoch，`composition-root.ts` 把它传进 `startLibrary`。S2c 继续把这两个文件的计划 diff 写成 0。做不到就停，不在本段把例外放大。

上文把 S2c-prep 估成 190、S2c-on 估成 252，是 2026-11-16 的估算。下面改记当前文件的物理行数。新增加删除还没量过，不把旧估算当成今天的 diff。RULES §1.6、§1.7 已取消「超过 600 行就失败」。本段不恢复那条硬限，也不把用户举过的几千行或一万行当成额度。

### 内部最终接受凭证

要证明的是：最终被接受的，就是这一次快照里的这一次 `submit`。失败的那一次尝试不能留下它。后来居上的 pending none 修复也不能冒充它。

本节把两个词分开。它们不是同义词，也不能互相当前置。

- 最终候选印章是写前身份。它留在门的闭包里。只有 `commitCandidate` 提交了这一次 submit 的候选，印章才指向这一次。它证明的是「这一次仍是最终候选」，不是「地板已经写下」。调用写入口时，接受记录还不存在。
- 接受记录是写后产物。唯一 floor 写入口只有在本轮复核通过并且真正写入之后，才产生它。它只描述这一次提交的 mode、epoch、generation，以及当时这扇门的阶段记号。失败、零写入、印章已失效，都不产生它。渲染端看不到它。

顺序只有这一条：最终候选印章仍指向这一次 → 唯一写入口在同一次同步调用里复核并写 floor → 只有写入成功才产生这一次的接受记录。写前不可能已经持有这次接受记录，所以不能把「先有接受记录」写成写入条件。印章失效就停在写入之前：零写入，零接受记录。

`shell.reportViewMenu` 的成功体继续只回 `{ epoch }`。这句回声沿用上文「一条命令」：它是刚接受的那一代的回声，不是新的授权，也不据此把 generation 归零。回声不是接受记录，也不是最终候选印章。13:44 决策表里的「内部凭证」，从 14:29 起只指这份写后的接受记录。

下面三样现在就能在源码里看见。它们不是接受记录，也不能代替写前的最终候选印章：

- `click` 的返回值。`dispatchRequested` 进入 `ports.dispatch` 后若抛错，或返回前窗口已销毁，自己返回 0，否则返回 1。`click` 的最终数字还要经过 `closePendingAfterDispatch`：当时仍有对得上的 pending 时，它再走修复；修复后若不是 `known`，或者 pending 还在，外层把这次返回改成 0。所以返回 1 不能证明这次 click 的形状被接受，修复成功时菜单可以已经是 none。返回 0 也不能单独证明 `ports.dispatch` 完全没被进入。`submit` 与 `noteNone` 的返回类型是 `Promise<void>`，没有接受记录。
- `known` 加上形状 `none`。`settle` 在仍有对得上的 pending 时，修复路径可以把 `committed` 写成 `none`、把 `install` 写成 `known`。那是最新 pending none 的修复结果。启动时 `installApplicationMenu` 还会用记号 `unbound` 提交一次 `none`。这两种 `known` + `none` 都不携带某一次阅读提交的 generation。
- 换代时的 floor 0。`openNext` 在成功的 `oi-app:` 导航上把阶段改成 `open`、epoch 加一，并把 floor 写成 0。这是换代复位。`retire` 保留原来的 floor。仓库源码里没有 `commitFloor`。读到 0，不能证明某一次 submit 已被接受。

只看门上现有的三个公开字段，分不开「这次 none 提交被接受」和「同阶段记号上的 pending none 修复写成了 known」。记号是 `webContentsId:phase:epoch`，里面没有 generation。修复和同代 none 提交可以留下同样的 `committed`、`install` 和 `pendingMark`。`currentMark` 没有公开 getter。所以上文点名的两个 handler 文件，按今天的公开面，既看不到写前印章，也产生不了写后的接受记录。

未来若要做，印章留在门的闭包里：只有 `commitCandidate` 提交了这一次 submit 的候选，才把印章指向这一次；修复路径、失败路径、换代、退役、关闭和更新的 pending 都清掉印章。印章被清掉之后，不得再写这一次的地板，也不得补产这一次的接受记录。不新增 getter，不放进 IPC，不加 ack。这会改 `view-menu-gate.ts`。该文件不在旧的 S2c 点名里。本段把它列为待用户批准，不在这里选定函数签名，也不把它当成已经可以编码的接口。

### 唯一 floor 条件写入口

floor 今天只活在 `createViewMenuEpoch` 的那张私有表里。写它的现有函数只有 `openNext` 和 `retire`。未来的条件写入必须是这张表上的又一个函数，这样 handler 拿不到 Map，也不能从外面直接改数字。

写入前，在同一次同步调用里重新核对，中间不插入 await。任一项失败就在写入前返回，槽保持调用前的内容：

1. 窗口仍在，且是唯一未销毁窗口。用来比较的 id 只来自 router 在 `acceptsSender` 通过后写入的 `context.senderWebContentsId`，也就是当时的 `event.sender.id`。它必须等于这扇窗的 `webContents.id`。这沿用上文「一条命令」：载荷里没有这个 id。`submit` 的闭合请求只有 `op`、`mode`、`epoch`、`generation`。不读取、不相信请求 payload 里的窗口 id，也不给契约加窗口字段。若这次核对用的是 main 内部快照，快照里的窗口 id 只能从这份可信 context 派生。
2. 槽还在，阶段是 `open`。未公开、退役、已终结和 `closed` 都不写。
3. 载荷里的 epoch 等于槽的 epoch。epoch 与 generation 仍是闭合请求里的字段。
4. generation 是 1 到 `Number.MAX_SAFE_INTEGER` 的整数，并且严格大于当前 floor。相等也拒绝。
5. 同一扇门、尚未销毁，写前的最终候选印章仍指向这一次 submit，而不是 pending none 修复。此时接受记录还不存在。印章已经不指向这一次，就在写入前返回。

这个函数不接收「请把地板设成这个数」而不核对。它自己不定义新的错误码，也不把 IPC 的 `invalid_payload` 或 `rejected` 收成自己的返回值。上文已经规定 handler 的分类：范围失败是 `invalid_payload`，窗口、阶段、epoch 或 generation 不符是 `rejected`，并且发生在菜单副作用之前。写入口失败时槽不变，也不产生接受记录。不公开 `currentMark`、终态、印章或单独的 floor getter。已有的 `read` 继续返回整份槽，形状不改。写入口在同一闭包里看私有表，不另加 getter。若要收窄 `read`，那是接口变更，停在待决定。写入成功之后，才产生这一次的接受记录。

不新增 IPC，不加 ack，不增加取消通道。成功响应仍是 `{ epoch }`。

这个写入口现在不存在。加上它要改 `view-menu-epoch.ts` 和对应测试。旧的 S2c-prep 只点名 handler 与它的单元测试。这两份 epoch 文件超出那份旧名单。本段列出待批准，不采纳为本次已可实现的接口。

### 异步轨迹的可观察验收

下面每条都要能用行为看见：地板变没变、写前印章是否仍指向这一次、有没有这一次的接受记录、菜单替换次数、`ports.dispatch` 次数。不断言源码文本。不把 `click` 的返回值、`known` + `none`、floor 0、pending none 修复或写前印章写成已经接受。未来测试归实施那一笔，本批不运行，也不把未跑写成通过。Node 纯桩、官方 CI、真实 Electron 和用户机分开记账。A 的 `_menuWillShow` 与 B 的门状态机不能代替这些断言。

| 轨迹 | 观察 | 未来测试要挡住的误判 |
| --- | --- | --- |
| 最终候选印章仍指向这次 submit | 先按印章进入写入口。复核通过后地板变成这次 generation。只有这次写入成功才产生接受记录，记录只描述这次 mode、epoch、generation 和门记号 | 用 dispatch 返回 1、只用 `known`，或把写前印章当成已经接受 |
| 替换抛错或后置核对失败 | 地板不变。印章不再指向这一次。没有这次接受记录。这次尝试不被标成 `known` | 把失败 payload 写成地板或镜像 |
| pending none 修复胜出 | 菜单可以是 none 且 `known`。被盖掉的那次 submit 印章已清，不写它的地板，也没有它的接受记录 | 把这份 `known` + `none` 当成那次 submit |
| 修复期间 pending 再更新 | 停在 `unknown`，留下最新 pending，不再进入下一轮。旧 submit 零写入，零接受记录 | 再装旧镜像，或递归修下去 |
| 换代 | `openNext` 把 floor 复位为 0。旧 generation 的写入失败，零写入，零接受记录 | 把 0 当成接受记录，或提交旧镜像 |
| 退役 | 阶段变为 `retired`。`retire` 保留原 floor。旧 submit 零写入，零接受记录 | 用退役前的镜像覆盖 |
| `closed` 或槽已终结 | `read` 得不到槽。零写入，零接受记录，不碰 Menu | 关闭后补写旧 floor |
| 零个或两个未销毁窗口，或窗口已销毁，或可信 context 的 id 对不上 | 零写入，零接受记录 | 改用 payload 里的窗口 id，或写到另一扇窗 |
| generation 相等或更小 | 副作用前拒绝，零写入，零接受记录 | 把同一次地板再写一遍当成新的接受 |

测试职责停在这些可观察结果。不要求本批测量物理键、读屏、菜单仍开着的画面或 mac。那些继续未验证。

### 未来实施白名单

行数是在 main `564804f` 上对当前文件做的 `wc -l`。这不是 diff，也不是门禁。旧估算不沿用。文件还不存在的，不把行数写成 0，也不抄 2026-11-16 的 78 或 112。

依赖方向保持：界面只经 seam 调用 core；epoch 不 import 门；门不 import epoch；`view-menu-lifecycle.ts` 只把通知翻译成 `noteNone` 或 `setDestroyed`，不写 floor。handler 若获批，可以调用二者已有的公开函数，不形成环，也不另做一张代次表。

旧 seam 计划已经点名、实施仍未批准的文件：

| 笔 | 文件 | 当前行数 | 这一笔的职责 |
| --- | --- | --- | --- |
| S2c-prep | 新建 `apps/desktop/src/main/view-menu-handler.ts` | 不存在。成本未核实 | 校验载荷里的 epoch 与 generation。窗口身份只用 `context.senderWebContentsId`。调用门的 `submit`。写前核验最终候选印章仍指向这一次；印章仍有效才进入唯一写入口。只有写入成功才产生接受记录。没有仍有效的印章就不写地板，也不产生接受记录。不改 `expose`，不进生产表 |
| S2c-prep | 新建 `apps/desktop/test/view-menu-handler.test.ts` | 不存在。成本未核实 | 只断言可观察行为：越界、相等 generation、窗口数量、阶段或 epoch 不符都发生在菜单副作用之前 |
| S2c-on | `packages/contracts/src/ipc/shell.ts` | 83 | 只把 `expose` 从 false 改为 true。请求、响应、错误码、幂等保持上文 |
| S2c-on | `apps/desktop/src/main/ipc/registry.generated.ts` | 547 | codegen 产物。增量未跑，未核实 |
| S2c-on | `apps/desktop/src/preload/oi.generated.ts` | 244 | 同上 |
| S2c-on | `apps/desktop/src/renderer/oi-api.d.ts` | 264 | 同上 |
| S2c-on | `apps/desktop/src/main/library-wiring.ts` | 382 | 今天 `installApplicationMenu` 把门留在局部变量里，`wiredLibraryCommands` 只接收 library main，拿不到门和 epoch。on 才把 `shell.reportViewMenu` 放进 `startLibrary` 返回的那张表，并让这张表看见同一扇门和同一个 epoch |
| S2c-on | `apps/desktop/test/ipc-production-assembly.test.ts` | 46 | 生产表含这条通道时 `registerIpcRouter` 不抛，缺通道就抛。与 expose、codegen、生产注册同一笔 |

prep 保持不 expose、不跑 codegen、不改生产表。on 才把这四件一起启用：`expose: true`、codegen、生产表、装配验收。缺一件就不算 on。prep 不能代替 on。

超出旧点名、本批不采纳、要改须另经用户批准的文件：

| 文件 | 当前行数 | 为什么旧的两个 handler 文件不够 | 本批决定 |
| --- | --- | --- | --- |
| `view-menu-epoch.ts` | 276 | 地板在私有表里。没有写入口，handler 无法在核对后写入，也无法保证失败时零写入 | 待用户批准。不在本段选定签名 |
| `view-menu-epoch.test.ts` | 325 | 写入口的失败零写入要有行为测试 | 待用户批准 |
| `view-menu-gate.ts` | 430 | 公开的 `committed`、`install`、`pendingMark` 分不开 submit 与 pending none 修复。印章不能做成新的 getter | 待用户批准 |
| `view-menu-gate.test.ts` | 581 | 修复胜出、失败尝试、印章被清掉，都要能观察 | 待用户批准 |
| `packages/contracts/test/ipc-shell.test.ts` | 148 | 现有断言要求 `expose` 为 false。on 若改 expose 而不改这个测试，现有用例会失败。旧 S2c-on 名单没有点它 | 待用户批准。prep 不动它 |
| `view-menu-lifecycle.ts` | 96 | 现读不写地板。印章若由门在 `noteNone` 和 `settle` 里清掉，这里可以保持 0 行 diff。这是未核实判断 | 要改才另批。本批不把它写进已采纳名单 |

明确保持计划 diff 为 0，除非实施时证明做不到并停下来的文件：`composition-root.ts`（28 行）、`index.ts`（61 行）、`ipc-router.ts`（246 行，`senderWebContentsId` 已在 `commandContext`）、`library-menu.ts`（97 行，三项加速键已在）、`view-menu-mirror.ts`（48 行）。renderer、`shell.tsx`、`use-view-mode.ts` 属于 S3，不属于 S2c。

若未来实施必须改根上的 PRD、ARCHITECTURE、RULES、DESIGN，或改 `shell.reportViewMenu` 的请求、响应、错误码，或新增 IPC / ack，先停在文档里待决定。本计划不代替那次批准。

### 后续界面只引用已定稿

不重选控件，不改顺序，本批不实现。

- 支持能力放在标题栏。栏位分段是原生 radio，放在状态 chip 右边。组的可访问名称是「栏位」。出处是 [E2 计划](feature-reader-view-modes-e2-174.md) 的 H2 与「打开是原文」那一条，以及 [DESIGN.md](../../DESIGN.md) §4.1 的标题栏分区、[docs/design-principles.md](../design-principles.md) 的 P4。
- Windows 用「视图」，macOS 用「显示」。出处是 DESIGN §4.10 的 11.1。
- Ctrl / ⌘+1、2、3 用 `library-menu.ts` 里已有的 `Ctrl+1` 与 `Cmd+1` 这一类 accelerator。E2 的 H7 规定不另写全局 `keydown`。
- 默认和再次打开都是原文，不记住栏位。这来自 2026-11-05 21:01 的 1A，台账里的评论 [6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956)。它覆盖 DESIGN 第 156 行的默认「对照」，以及 §11.4 的恢复视图。不改 DESIGN 正文（N-10）。
- 同一次 `ReaderScreen` 里的 local viewMode。不写回 `ReaderSession`，不落盘，不新增 IPC，不发明 `reader.setViewMode`。
- session、历史、缩放和那一份 `PageColumn` 继续共享。对照只把原文容器变窄。译文用 `inert` 隐藏，不卸载。
- 空态原句是「本阶段暂不提供译文，请先阅读原文。」Windows 链接是「切到原文（Ctrl+1）」，mac 是「切到原文（⌘1）」。出处是 2026-11-14 14:13 的 6-1 A，评论 [6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563)，E2 计划照录。

本批不实现 E2，不接翻译，不建配置 chip，不写降级句，不动 Aa、侧栏或菜单置灰，也不改 S2c-prep → S2c-on → E2-0/1/2 → S3 的前后顺序。

### 规格变更记录

本批不改 PRD、ARCHITECTURE、RULES、DESIGN 或 `docs/design/**` 的正文。RULES §7 与 §9 的规格变更记录，适用于规格变更。`docs/spec-changelog.md` 写明自己只记规格文档改了什么。已合的 PR #234 也把「这次不改规格，不适用」写在正文里。因此本批不改第三份文件。若审查认为仍必须改变更记录，应停；不在本批自行补上。

执行计划目录要求新计划的文件名与分支同名。本批批准只许改这份既有 seam 计划，所以分支 `feature/s2c-dependency-plan-174` 与文件名不同。不新建同名计划文件。

### 本段决策

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 只追加两份现有文档 | 原话见 7092677446。不转实施 | 2026-11-23 13:44 | Wisdom |
| 内部凭证与 IPC 回声分开 | 回声仍是 `{ epoch }`。dispatch 返回值、`known` + `none`、floor 0 都证明不了这一次 submit | 2026-11-23 | 按现行源码归纳。不是实施批准 |
| epoch 写入口和门内印章列入待批准 | 私有表和现有公开字段都写不出凭证。超出旧的 handler 点名 | 2026-11-23 | 本段列出，不采纳 |
| 不改规格变更记录 | 规格正文未改。审查若要求第三文件则停 | 2026-11-23 | 本段 |
| 写前印章与写后接受记录分开；窗口 id 只用可信 context | 7e12983 的 B1、B2。不选签名，不改契约，不扩到 postCheck | 2026-11-23 14:29 | Wisdom，[7093393948](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-7093393948) |

### 本段计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只改本文件和 `docs/approvals.md`。保留上文 | 文档已按 13:44 原话追加。产品、测试、CI、锁未改 | `7e12983` 的 diff 只有这两份文件 |
| 2 | Draft，交 Forge 只读复审。不自动实施 | `7e12983` 的只读复审是 FAIL。B1、B2 保留。N1–N3 不扩进本次 | 复审报告时间 2026-11-23 14:12:18 Asia/Shanghai |
| 3 | 14:29 只改 B1、B2 的相关句子。原 FAIL 不擦掉 | 写前印章与写后接受记录已分开。窗口 id 改为可信 context。签名未选。`7e12983` 的 FAIL 保留 | 本提交相对 `7e12983` 的 diff |
