# 执行计划

E2 菜单选中状态回传的最小 seam 设计。文件名按指定保留。分支仍是 `feature/reader-view-modes-e2-plan-174`。栏位与空态在 [E2 计划](feature-reader-view-modes-e2-174.md)。

本文件只写设计。2026-11-16 12:08 原话只批准写设计，不批准编码。来源 [#174 6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822)、[PR #220 6907027779](https://github.com/wisdom-km/open-immerse-v2/pull/220#issuecomment-6907027779)。Forge 对 `4652c9c` 的第三轮审查是 FAIL。本轮只改文档，不请求编码批准，不自称通过。

不改产品代码、测试、生成物、CI、PRD、ARCHITECTURE、RULES、DESIGN。不开 Ready，不合入，不发版。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 仍然成立

`MenuWillShow`（`electron_api_menu.cc` 132–145 行）会把全 false 的 radio 勾上第一项。none 用普通原生项，不写 checked。活动三模式用 radio，构造参数里恰一项 `checked: true`。不在已挂 radio 上写 checked。不加「无」项，不自绘，不置灰，不改 checkbox。标签、accelerator、enabled、事件名不变。这和已批「文献库不置灰、点了无作用」以及「有栏位时单选」相容，不是待用户选择的产品项。

S1 的 `expose` 保持 false。S2c 才同一笔改为 true、跑 codegen、注册 handler。不削弱 `assertHandlers` 或 `acceptsSender`。

阅读屏里的 PDF 错误页不是浏览器错误文档，不退役 epoch。空态句仍只在成功支。

## 证据和未知

本轮没有启动 Electron。结论只来自 v45.2.1 已读源码和本仓库入口。

| 声明 | 证据 | 未知 |
| --- | --- | --- |
| `executeJavaScript` 先 await，再在当时的 webContents 上跑 | `lib/browser/api/web-contents.ts` 44–58 行。有 URL 且主 frame 不在加载才立即跑，否则等一次 `did-stop-loading` | 没跑过重载把旧脚本送进新文档的时序。脚本正文仍是调用时写死的整数 |
| 正常首屏脚本先于 load | `index.html` 在 body 末尾同步引用 `main.js`。`main.tsx` 静态引用 shell。监听放在 shell 模块求值，不放 effect | 没跑过 `did-finish-load` 与这次求值的先后。不据此声称监听一定丢失 |
| 已提交错误页不发 `did-navigate` | `DidFinishNavigation`：未 commit 直接返回（2872 行）。非错误页才发 `did-navigate`（2885–2907 行）。错误页发 `did-fail-provisional-load`（2925–2930 行） | 该字符串在已读的 `electron_api_web_contents.cc` 里只出现一次。没搜完全部编译单元 |
| `did-finish-load` 不证明成功的应用文档 | `DidFinishLoad` 没有错误页判断（2541–2557 行）。`getURL` 是 `GetLastCommittedURL`（3267–3268 行） | 错误页提交后这个 URL 的具体字符串未跑 |
| `did-fail-load` 不是换文档信号 | 同文件还有非法 URL、加载失败、`beforeunload` 的 `ERR_ABORTED`（约 3280、3329、5003 行）。2932 行只让错误页分支不发 aborted | 不把「永远不会在别的路径发 aborted」写成结论 |
| 设置菜单可能重入 | `ChangeApplicationMenu` 非 mac 注释（451–472 行） | mac 的 `SetApplicationMenu` 正文本轮没读。门两边都用 |
| invoke 不会因定时器消失 | 计划不再把逻辑放弃叫成取消 | 未完成 Promise 的进程内上限未测 |

`createMainWindow` 现在在返回前就 `loadURL`（`window.ts` 23 行）。挂接必须改成：先创建窗口并注册 epoch 监听，再 `loadURL`。不改导航决定，不加通道。

## 菜单形状

镜像是 `none`、`original`、`contrast`、`translation`。`oi-view-bilingual` 只是事件名。历史、页码、缩放保持普通项。三项模式是该子菜单里仅有的 radio，不加分隔线。应用、编辑、窗口 role 照旧。

系统菜单和 accelerator 先走 `RunBuiltInAction`。click 不写已挂项。它请求替换门按已提交镜像重建；门成功才派发，失败不派发。`executeJavaScript` 的拒绝要接住。验收读 type、checked，并调用 `_menuWillShow`。只点 `item.click` 不算过。读屏、菜单仍开着时的画面、物理键，本轮未跑。

## epoch

main 按 `webContents.id` 存槽。载荷里的 epoch 只是回声。渲染进程不提交 bootId。`senderWebContentsId` 由 router 在 `acceptsSender` 通过后从 `event.sender.id` 抄入，可选。载荷里没有它。这是权限开口：handler 能看见已经核对过的 id。

阶段：`unpublished`、`awaiting-finish`、`open`、`retired`。same-document 忽略。非主 frame 忽略。

| 事件 | 条件 | 结果 |
| --- | --- | --- |
| `did-navigate` | 主 frame，URL 是 `oi-app:` | `awaiting-finish`。作废未完成的公开。拒绝上报。不在这里加 epoch |
| `did-navigate` | 主 frame，URL 不是 `oi-app:`，槽还没公开过 | 保持 `unpublished`。初始 blank 不退役 |
| `did-navigate` | 主 frame，URL 不是 `oi-app:`，已经公开或正在等 finish | `retired`。作废公开。拒绝上报 |
| `did-fail-provisional-load` | 主 frame | `retired`。作废公开。随后的 `did-finish-load` 不公开 |
| `did-finish-load` | 阶段是 `awaiting-finish`，且当时 `getURL()` 仍是 `oi-app:` | epoch 加一，地板归零，镜像记为 none，进入 `open`，安排公开。加一会超过安全整数上限则改为 `retired`，不回绕，不公开 |
| `did-finish-load` | 其它 | 不公开。`retired` 维持 `retired` |
| `render-process-gone` | 该 webContents | `retired`。作废公开 |
| `closed` | 窗口销毁 | 删槽。不再碰 Menu |
| 未 commit 的取消 | 没有 `did-navigate` | 阶段不变。不用 `did-fail-load` 解冻 |

`awaiting-finish` 和 `retired` 时，上报在菜单副作用之前 `rejected`，不改地板。同站重载会先 `did-navigate`，所以旧请求在新 epoch 公开前就已经被阶段挡住。已读源码里 `DidFinishNavigation` 先于 `DidFinishLoad`。本设计依赖这个顺序：成功提交先进入 `awaiting-finish`，错误提交先进入 `retired`，然后才看到 `did-finish-load`。若实现时看到 finish 先到，停，不凭 `getURL()` 把这次 finish 公开。

## 公开事件

每次进入 `open` 安排一次公开。槽记下 `{ epoch, attempt }`。脚本用现有 `executeJavaScript` 派发 `CustomEvent`，detail 只是这个整数，不拼接渲染进程的字符串。没有第二条 IPC，没有确认回执，没有轮询。

脚本的 Promise 失败时，只再试一次。重试前必须仍是同一次 attempt、同一 epoch、阶段仍是 `open`、窗口未关。`retired`、`closed` 或 epoch 已经前进，就丢掉这次失败，不补发旧整数。成功只表示脚本没抛，不表示监听方收到。

shell 模块求值时就监听。同一 JS 领域里：

- detail 不是 1 到 `Number.MAX_SAFE_INTEGER` 的整数：忽略。
- 还没有 epoch：收下。
- 相等：忽略。
- 更小：忽略。不改当前 epoch，不清逻辑尝试，不重置额度。
- 更大：改记这个 epoch。旧逻辑尝试立刻失效，不等它的响应。若有期望，按新 epoch 发当前期望。

两次脚本都失败：main 的槽可以仍是 `open`，渲染端没有 epoch，就不发送，也不自己造一个。菜单停在上次替换结果。同一文档不再公开。下一次合格的 `did-finish-load` 才重新安排。不改成无限重试。

## 替换门

上报、click、生命周期要的 none，都进同一个门。替换进行中只记下最新的待恢复镜像，不再次调用 `setApplicationMenu`。click 若撞上正在替换：不派发，也不用旧镜像盖掉已经记下的更新镜像。

调用原生替换之前失败：不调用 `setApplicationMenu`，不改地板，已安装状态不变。这是副作用前的 `rejected`。

调用之后抛错，或返回后的窗口、槽、epoch、记号核对失败：不写地板，已安装状态标为 `unknown`。不说屏幕仍是上次提交的镜像。窗口还在，就用当时最新的有效镜像再替换一次。这次再失败就保持 `unknown`，不再连环替换，也不排定时器。下一次上报、click 或生命周期事件才再试。窗口已销毁则不碰 Menu。

不新造错误码。不宣称原生回滚。

## 上报

shell 持有上报器，不放进 `ReaderScreen`。同一领域里卸载再打开，generation 不归零。新文档是新领域，从 1 计。超过安全整数上限就不发送，不回绕。

每个上报器同时只有一个逻辑尝试。2 秒无响应、响应已处理，或收到更大的 epoch，都只放弃这个逻辑尝试。Electron 的 invoke 仍在。`attemptId` 只丢掉对不上的响应，不能当成取消。

每个 revision 两次额度，发送时才扣，旧 revision 的失败不扣新的。连续 revision 留下的未完成 Promise 没有总上限。这是取舍：不新增取消通道，也不把超时后的发送说成物理上仍只有一个 invoke。若要物理上只有一个，就必须等原调用结束，不能再承诺超时后继续发。本设计不选那条。

离开先把期望写成 none，再同步卸下，不 await。还没发送的 none 可以被 original 替换，于是从不发送。已经发送的 none 不撤回。

## 轨迹

| 轨迹 | 结果 |
| --- | --- |
| 启动，尚未 `open` | 不上报。S2b 起菜单是 none 形状 |
| 首次 `oi-app:` navigate 再 finish | epoch 为 1。监听已在模块求值时装上 |
| 打开阅读 | 接受后才是 radio，且只勾原文 |
| 阅读屏错误页 | 不退役，不改成 none |
| 换文献 | 同一 epoch。直接到 original |
| 连点 | 未发送的期望被最后一次替换。逻辑尝试仍只有一个 |
| 离开 | 不 await。未发送的 none 可被替换掉 |
| none 超时后再发 original | 两笔 Promise 都可以还在。后到的 none 请求若 generation 已旧或 epoch 不符：副作用前拒绝，不改地板。若 main 先接受了 none，菜单可以先变成 none 形状，再接受 original |
| none 的响应迟到 | `attemptId` 不符则忽略。不释放新的逻辑尝试 |
| 旧公开整数晚于新 epoch 到达 | 渲染端不回退。不重发旧整数 |
| 新文档先收到旧整数 | 可以先记下。main 已是更大的 epoch 就拒绝该请求。更大的事件再到时向前更新并发送当前期望 |
| 两次公开脚本失败 | 不发第三次。渲染端不发明 epoch |
| 无效或溢出的事件 | 忽略 |
| 已提交错误文档 | `did-fail-provisional-load` 退役。后面的 finish 不公开 |
| 公开之后提交 blank 或其它 URL | 退役 |
| 初始 blank | 保持未公开 |
| 取消的导航 | 没有 commit，epoch 不变 |
| 重载后新 epoch 已接受，旧请求才到 | 副作用前拒绝。不改地板，不重建 |
| 调用原生菜单之前拒绝 | 不调用替换 |
| 调用之后核对失败或抛错 | 状态 `unknown`。有界再换一次。再不成就保持 `unknown` |
| click 撞上正在替换 | 不嵌套替换，不派发 |
| 窗口销毁 | 不碰 Menu |

## 分批

硬线 600。只改 `packages/contracts/` 时 200。346 是估算 × 1.73 ≤ 600 的门槛。生成物计入，不排除。下面的「计入」是预计的新增+删除，不是净增。函数软 50、硬 80。超过 346 先重算再拆整批。超过适用的 600 或 200 就停。不写 G12，不删测试，不靠删断言来凑数。

顺序：S1 → S2a → S2b → S2c → E2-0 → E2-1 → E2-2 → S3。没有循环。E2 三笔不写上报。S3 依赖 S2c 和 E2-1 的栏位主人。每一笔另批。批准编码不包含改 ARCHITECTURE。

| 笔 | 合入后能启动 | 菜单 | 计入 | ×1.73 |
| --- | --- | --- | --- | --- |
| S1 | 能。不进 registry | 今天的普通项 | 178 | 308。200 档只用 178 |
| S2a | 能。无这条 handler | 与 S1 相同 | 324 | 561 |
| S2b | 能。仍不暴露 | none 形状的普通项。没有上报者，不会变成 radio | 290 | 502 |
| S2c | 能。handler 已注册 | 仍是 none 形状，直到有被接受的活动上报 | 242 | 419 |
| E2-0 | 能 | 与 S2c 相同 | 72 | 125 |
| E2-1 | 能 | 仍无勾。工具栏能改栏位 | 338 | 585 |
| E2-2 | 能 | `clickMenu` 只证明事件 | 109 | 189 |
| S3 | 能 | 文献库是普通项。接受原文后才是恰一勾的 radio | 246 | 426 |

S1：`shell.ts` 新建 78；`packages/contracts/src/index.ts` 200 到约 210，计入 10；契约测试 90。178 = 78+10+90。生成物 diff 为 0。超过 200 就停。

S2a：`ipc-router.ts` 244 行，计入 18，改完约 262，`commandContext` 短于 50。`view-menu-epoch.ts` 新建 140，reducer、公开、挂接都短于 50。`window.ts` 把 `loadURL` 移到挂接之后，计入 4。`index.ts` 59 行，计入 12。测试 150，包含下面 S2a 验收的每一项。324 = 18+140+4+12+150。

S2b：`view-menu-gate.ts` 80，`view-menu-mirror.ts` 50，两者的替换函数短于 50。`library-menu.ts` 94 行，计入 20，改完约 110。`library-wiring.ts` 252 行，计入 40，改完约 280。测试 100，包含下面 S2b 验收的每一项，没有另写「外加」。290 = 80+50+20+40+100。文件改完仍低于 400。

S2c：expose 计入 2。生成物约 110，是 schema 展开估算，不是跑过 codegen：registry 约 53，`oi.generated.ts` 约 25，`oi-api.d.ts` 约 23。`view-menu-handler.ts` 50，短于 50。测试 80。242 = 2+110+50+80。codegen 若把 242 推过 346，先停。不能把 expose 和 handler 拆开，也不能把 S2c 验收移出这一笔。

S3：`view-menu-report.ts` 120，入队和放弃都短于 50。`shell.tsx` 147 行，计入 30，改完约 170。`use-view-mode.ts` 由 E2 的约 36 增到约 48，计入 16，函数仍短于 50。测试 80。246 = 120+30+16+80。不把回调塞进 `ReaderScreen`。

## 验收

S1：expose false、四值、两个整数的上下限、多余字段、没有 bootId。不启动 Electron。

S2a：挂接先于 `loadURL`。未公开、初始 blank、`oi-app:` 的 navigate 加 finish、错误文档后的 finish 不公开、公开后的 blank、取消不变、溢出不回绕、`render-process-gone`、closed。公开：同代才重试一次、旧 attempt 不补发、更小事件不回退、无效事件忽略、两次失败不发第三次。

S2b：none 经过 `_menuWillShow` 仍无勾；活动形状恰一勾且显示后不变；门在替换中不嵌套；click 撞上时不派发；抛错和后置失败都是 `unknown`，并且只再修一次；再失败保持 `unknown`；窗口销毁不碰 Menu；角色和缩放加速键仍各一份。不把模板读数当成菜单仍开着的画面。

S2c：副作用前拒绝不调用替换；epoch 或窗口不符不改地板；后置失败不写地板且状态是 `unknown`；零个或两个窗口不替换。

S3：轨迹表里上报、超时、迟到请求、迟到响应、迟到公开事件各有行为测试。不断言源码文本。不写 `ReaderSession`。不发翻译。`clickMenu` 只算事件。物理键、读屏、菜单仍开着的画面、mac，继续未验证。

## 将来另批才许改的文件

技术复审通过前不开工。通过后一次只请求点名的一笔。ARCH 正文不在其内。

- S1：`packages/contracts/src/ipc/shell.ts`、`packages/contracts/src/index.ts`、`packages/contracts/test/ipc-shell.test.ts`。
- S2a：`ipc-router.ts` 的 context 字段，`view-menu-epoch.ts`，`window.ts` 的加载顺序，`index.ts` 的挂接，及测试。不含菜单形状，不含 expose。
- S2b：`view-menu-gate.ts`、`view-menu-mirror.ts`、`library-menu.ts`、`library-wiring.ts` 及测试。不含 handler。
- S2c：`shell.ts` 的 expose、三份生成物、`view-menu-handler.ts` 及测试。不含 renderer 上报。
- S3：`view-menu-report.ts`、`shell.tsx`、`use-view-mode.ts` 的回调及测试。不改 reader 的 domain、application、`index.ts`、`pure.ts`，不改 `contracts/src/ipc/reader.ts`。

不批：手改生成物、削弱断言或 `acceptsSender`、载荷自定 epoch、新的 `ipcMain` 或取消通道、CSP、协议、缩放菜单勾、置灰、持久化、ARCH 正文。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品代码 |  |  |
| 2 | Forge 复审。通过前不写 S1 |  |  |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 12:08 只写设计 | 原话见文首 | 2026-11-16 | Wisdom |
| none 用普通项，活动模式才用 radio | `MenuWillShow` 会补选。与已批语义相容，不是新的产品选项 | 2026-11-16 | 按审查修正，不是新批准 |
| 公开事件只向前接收 | `executeJavaScript` 的 await 可以把旧整数送进新文档 | 2026-11-16 | 同上 |
| 错误文档用 `did-fail-provisional-load` 退役 | 已提交错误页不发 `did-navigate` | 2026-11-16 | 同上 |
| 超时只放弃逻辑尝试 | invoke 不会因此取消 | 2026-11-16 | 同上 |
| 三个入口共用替换门 | 后置失败不能证明屏幕仍是旧镜像 | 2026-11-16 | 同上 |
| S1 不暴露 | 启动时 `assertHandlers` 会抛 | 2026-11-16 | 同上 |

## 交接

从当时的 main 另开，Draft。先完整读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md` 和本文件。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。没有点名的笔不开工。不改 ARCH。技术复审通过前不开工。通过后一次只请求点名的一笔，并且不包含 ARCH 正文。

S1 是 seam 变更。估算 178，契约档 200。S2a 估算 324。S2b 估算 290。S2c 估算 242。S3 是 UI 改动，估算 246。R-E13 保持未验证。
