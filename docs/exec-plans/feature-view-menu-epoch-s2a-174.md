# 执行计划

S2a：main 文档代与 IPC context 身份字段。分支 `feature/view-menu-epoch-s2a-174`。文件名与分支同名。

基线 main `405c865a48902d6406a964a155823c49f4e3bff9`，parent `95796e5f96cc8cceb78dc6389585626d03d1d486`，tree `c918fe8e02086d4ee9a2a586534f70502f4f59ee`。阶段规则以已合 [feature-reader-view-menu-seam-174.md](feature-reader-view-menu-seam-174.md) 的「文档代」和 S2a 行为准，本文件不抄第二遍，也不改那份计划和 [E2 计划](feature-reader-view-modes-e2-174.md)。顺序仍是 S1 → S2a → S2b → S2c-prep → S2c-on → E2-0 → E2-1 → E2-2 → S3。

Wisdom 2026-11-16 16:52 原话：「你按照项目进度继续推进吧」。台账在 [docs/approvals.md](../approvals.md) 的 16:52 行。14:44、14:51、15:31、16:01 仍写着当时不批准 S2，那些行不改。16:52 不是本计划的 PASS。

Forge 对 `d9f9c96e838a91e12b3b1867df1e88bd55558fbb`、tree `8287a0337284636deb4de4aa1ce727194c66cfcc` 的精确审查是 HOLD，不放行实施。技术方案无新增 BLOCK。当时 252+355+32=639 是同一 Draft 的预计，超 600 共 39，不是当时 diff 已经越过门禁。本修订只改本文件。台账无新批准，不动。

Loom 原则复核已 PASS：基线 `405c865a48902d6406a964a155823c49f4e3bff9`，内部支持能力无新增可见落点。它不替代 Forge 对修订后精确 tip 的技术 PASS，也不替代 QA。台账不因此加行。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本修订任务类型：不适用（纯文档）。以后的实施只改 desktop main 的文档代和 router 上下文，不改 `packages/features/**`，不改 `contracts/src/ipc/**`。

## Goal

规划 S2a，使以后的实施能与本文件、台账、证据留在同一 Draft。实施内容：`ipc-router.ts` 在 `acceptsSender` 通过后把 `event.sender.id` 抄进 context；新建 `view-menu-epoch.ts`；`window.ts` 在 `loadURL` 之前挂监听；`index.ts` 把闭包里的槽表传给 `createMainWindow`；行为测试覆盖下面的矩阵。不含菜单形状、替换门、镜像、handler、生产命令表或 expose。

## Context

- 现在已有的行为：`apps/desktop/src/main/ipc/ipc-router.ts` 244 行。`IpcCommandContext`（14–17 行）只有 `requestId` 和可选 `droppedFilePath`。`runCommand`（122–125 行）先 `acceptsSender`。`commandContext` 在 181–189 行，由 `callHandler` 168 行调用。`sender-frame.ts` 的 `isOiAppUrl` 是私有函数。`window.ts` 25 行，`createMainWindow()` 无参数，唯一调用点是 `index.ts` 37 行（该文件 59 行），`loadURL` 在监听导航拦截之后。`composition-root.ts` 不调用 `createMainWindow`。`shell.reportViewMenu` 的 `expose` 仍是 false。代表测试是 `ipc-router.test.ts`（504 行）的 `returns sender_rejected when the frame is not this app` 与 `passes a dropped file path to the handler and leaves it out of the result`；`invokeEvent` 的 sender id 是 1。必须补字段才能类型检查的字面量只有 `library-command-map.test.ts` 20 行和 `open-document-wiring.test.ts` 34 行。装配测试不构造 `IpcCommandContext`。
- 相关的节：已合 seam「文档代」；[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.3、§2.4、§13 的 G12；[RULES.md](../../RULES.md) §2、§8、§9；[docs/arch/06.md](../arch/06.md)。[DESIGN.md](../../DESIGN.md) 与 [docs/design-principles.md](../design-principles.md) 本笔不改。
- 还没做的部分：context 身份字段、文档代槽、`loadURL` 之前的监听、挂接、行为测试。

## Constraints

阶段、成功 `oi-app:` 主 frame `did-navigate`、地板归零、初始 blank、错误提交后的 finish、same-document、未 commit 取消、`render-process-gone`、`closed` 不碰 Menu，都按已合 seam。URL 只用事件参数。成功加载若没有 `did-navigate`，停，不改用 `getURL()`。

本文件只补 seam 没有写成函数的部分。`senderWebContentsId` 必填，只从 `event.sender.id` 抄，不从载荷抄，调用仍在 `acceptsSender` 之后。`commandContext` 三个参数。`oi-app:` 判断复制进本模块，不导出 `sender-frame.ts` 的私有函数；必须共享导出才能做完则停。槽表在 `createViewMenuEpoch()` 闭包里，不写模块级 `let`。`composition-root.ts` 零 diff。

监听在该窗口的 `webContents` 与 `closed` 上。`did-fail-provisional-load` 的 `isMainFrame` 用剩余参数下标 4，先判断 boolean。Electron 45.2.1 上这种写法 `tsc --noEmit` 退出码 0；赋不上重载则停，不加 eslint-disable。`electron.d.ts` 17651–17652 行把该事件注释成取消。`DidFinishNavigation` 里未 `HasCommitted()` 不发事件（2872–2873），已提交错误页才发这个事件（2929–2930）。实现跟 seam 和这段 emit 点。

不导入 `Menu`。不订阅 `did-fail-load` 与 `did-finish-load`。不改导航决定。函数软 50、硬 80。S1 的 233 行和 1.73 不沿用。600 仍是全 PR 实际新增+删除的硬停点。不写 `G12:`，不删测试凑数，不改门禁脚本。

Forge 可以推荐载体。Ready 与合入仍须 Wisdom 的精确批准。本修订不把另开 PR 或先合文档写成已批准。

## 验收矩阵

没有事件时 `read(id)` 是 `undefined`。下表在没有槽时按 unpublished、epoch 0、floor 0 计算。`did-finish-load` 不是公开信号。无效 URL 按非 `oi-app:`。

| 事件 | 当前 | 结果 |
| --- | --- | --- |
| 主 frame `did-navigate`，URL 是 `oi-app:`，加一后仍是安全整数 | 任意，含已 `retired` | `open`。epoch 加一。floor 0。不等 finish |
| 同上，epoch 已是 `Number.MAX_SAFE_INTEGER`，或不是非负安全整数 | 任意 | `retired`。epoch 与 floor 保持。不存 +1，不回绕成 0 或 1 |
| 主 frame `did-navigate`，URL 不是 `oi-app:` | 尚未 `open` | `unpublished`。初始 `about:blank` 不退役 |
| 主 frame `did-navigate`，URL 不是 `oi-app:` | `open` | `retired`。epoch 与 floor 不变 |
| 主 frame `did-navigate`，URL 不是 `oi-app:` | `retired` | 保持 `retired` |
| 主 frame `did-fail-provisional-load` | 任意 | `retired`。之后的 finish 不重新公开 |
| `did-fail-provisional-load` 且 `isMainFrame` 不是 true | 任意 | 不变 |
| `did-navigate-in-page` | 任意 | 不换代 |
| 未 commit 的取消，或发出 `did-fail-load` | 任意 | 不变。不订阅 `did-fail-load` |
| 该 `webContents` 的 `render-process-gone` | 任意 | `retired`。不听 `app` |
| `closed` | 任意 | 删槽。不调用 Menu |

## 挂接与测试

`createMainWindow(epoch)`：建窗，现有 `will-navigate`，现有 `setWindowOpenHandler`，`epoch.attach(win)`，然后 `loadURL`。`attach` 登记 `did-navigate`、`did-navigate-in-page`、`did-fail-provisional-load`、`render-process-gone`、`closed`。键在登记时从 `webContents.id` 抄下。`startDesktop` 不导出。

`view-menu-epoch.ts` 导出 `createViewMenuEpoch`、`reduceViewMenuSlot`、`blankViewMenuSlot`。纯函数给溢出测试用，不进 preload 或 contracts。若这被审成超出已合方案的新 seam，停；不改成 9e15 次循环，也不加测试专用 setter。

`apps/desktop/test/view-menu-epoch.test.ts` 用假宿主记录登记名和发出顺序，断言槽值、登记名和 `Menu.setApplicationMenu` 次数。上表每一行都有断言。另加：假 `loadURL` 仅在 `did-navigate` 已登记时同步发出 `oi-app://app/index.html`，返回后槽已是 `open`。不读源码文本。不测已删的 renderer 事件。草稿 188 行、12 个 `it`。

`ipc-router.test.ts` 增加一条：`acceptsSender` 为真时 `senderWebContentsId` 是 7，载荷仍是 `{ id: "doc-1" }`。现有 `sender_rejected` 保持调用次数 0。不改 `invokeEvent` 的 id 1。两处字面量只补 `senderWebContentsId: 0`。装配测试预计零 diff；失败则停报。

## 文件白名单

本修订只许改本文件。`docs/approvals.md` 已在 `d9f9c96e` 提交，本修订不动。

实施要等 Forge 对修订后精确 tip 的 PASS，以及另发的实施指令。Loom 的 PASS 不代替这两项。届时只许改：

| 文件 | 范围 |
| --- | --- |
| `apps/desktop/src/main/ipc/ipc-router.ts` | context 字段与抄写 |
| `apps/desktop/src/main/view-menu-epoch.ts` | 新建。只有文档代 |
| `apps/desktop/src/main/window.ts` | 参数，以及 `loadURL` 之前的 `attach` |
| `apps/desktop/src/main/index.ts` | 创建一份 epoch 并传入 |
| `apps/desktop/test/view-menu-epoch.test.ts` | 新建。行为测试 |
| `apps/desktop/test/ipc-router.test.ts` | 一条身份字段测试 |
| `apps/desktop/test/library-command-map.test.ts` | 只改 context 字面量 |
| `apps/desktop/test/open-document-wiring.test.ts` | 只改 context 字面量 |
| `docs/evidence/<PR号>/commands.md` | 只记录实际跑过的命令 |
| 本文件 | 只补「实际」列 |

不改：`composition-root.ts`、`sender-frame.ts`、`wire-ipc.ts`、`library-wiring.ts`、`library-menu.ts`、`security/navigation.ts`、`security/window-preferences.ts`、`ipc-production-assembly.test.ts`、`packages/contracts/**`、三份生成物、renderer、UI、存储、CSP、协议、DESIGN、设计原则、`docs/design/**`、环境安装文件、CI、规格正文、seam 与 E2 计划。S1 保持 `expose: false`。codegen 后生成物零 diff。

已合 seam 的「换代或退役时经替换门请求 none」属于 S2b 的文件名单，本笔不预留门回调。地板在成功 `open` 时归零，因为这句话在「文档代」节，而 S2b 名单不含本文件。以后若点名文件接不上，停报。

## 预算

口径是相对 `origin/main` 的 `git diff --numstat` 新增+删除。产品与测试仍是上一版逐文件草稿，不压行数：

| 文件 | 新增 | 删除 | 合计 |
| --- | --- | --- | --- |
| `ipc-router.ts` | 5 | 3 | 8 |
| `view-menu-epoch.ts` | 128 | 0 | 128 |
| `window.ts` | 3 | 1 | 4 |
| `index.ts` | 2 | 1 | 3 |
| `view-menu-epoch.test.ts` | 188 | 0 | 188 |
| `ipc-router.test.ts` | 17 | 0 | 17 |
| `library-command-map.test.ts` | 1 | 1 | 2 |
| `open-document-wiring.test.ts` | 4 | 1 | 5 |
| 装配测试 | 0 | 0 | 0 |
| 产品与测试 | 348 | 7 | 355 |
| 证据 `commands.md` | 32 | 0 | 32 |
| `docs/approvals.md` | 4 | 1 | 5 |
| 本文件 | 179 | 0 | 179 |
| 同一 Draft 预计 |  |  | 571 |

355 与 32 不因本修订改变。同一 Draft 预计 571 = 355+32+5+179。600 不改。余量 29，不是卡在 600。实施前用真实 numstat 重算，超过 600 或超过本表就停，不删测试，不自行拆批。

`index.ts` 净增约 1 行，约 60，低于入口建议 100。`ipc-router.ts` 净增约 2 行，约 246，低于 400。router 测试 521，低于 600。

原估 234 不含计划、台账、证据和两处字面量。1.73×234=404.82 只作历史披露。346 是重估点，不是新停点。

## 命令

本修订只跑 `node tools/check-docs/check.mjs`。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。不格式化 Markdown，不跑 codegen、Vitest、`pnpm test`、`pnpm run check`，不启动 Electron。

实施回合才跑，并且只把实际退出码写入 `docs/evidence/<PR号>/commands.md`：

```text
corepack pnpm run codegen
git diff --exit-code
corepack pnpm exec vitest run apps/desktop/test/view-menu-epoch.test.ts apps/desktop/test/ipc-router.test.ts apps/desktop/test/library-command-map.test.ts apps/desktop/test/open-document-wiring.test.ts
corepack pnpm test
GATE_BASE=origin/main corepack pnpm run check
node tools/check-docs/check.mjs
GATE_BASE=origin/main node tools/check-pr-size/check.mjs
```

`codegen` 后工作区必须干净，三份生成物哈希不变。G1 证据是 `check` 的退出码。每个 tip 的全量 `pnpm test` 只跑一次。

## G1、Box 与真机

本修订无 ts/js diff，G1 不适用；文档门禁是 `check-docs`。实施回合的 G1 在 `commands.md`。Box 由 Anvil 在实施 tip 上独立跑完整套；没有 UI 不构成豁免。本修订不跑 Box。真机、读屏、物理键、mac 菜单、R-E13 仍未验证。

## Done when

本修订：只改本文件；`check-docs` 退出码写在 PR 说明；Draft 保持。不合入，不 Ready，不发版。

实施还要：白名单外零 diff；矩阵每行有行为断言；`expose` 仍 false；codegen 零 diff；证据记下 `check`、定向和一次全量测试；相对 `origin/main` 的新增+删除不超过 600；文件与函数不超过硬上限；Box 独立结果已记下；仍是 Draft。Forge 对这个 tip 的 PASS 和另发的实施指令未到时，不开始。

## 失败停点

- 成功的 `oi-app:` 加载没有 `did-navigate`：停，不改用 `getURL()`。
- 剩余参数监听赋不上 Electron 45.2.1 的重载：停。
- 必须导出 `sender-frame.ts` 的私有函数，或必须改 `acceptsSender`：停。
- 类型错误落到白名单外，或装配测试失败：停报。
- 实测新增+删除超过 600，或文件、函数超过硬上限：停。不删测试，不写 `G12:`，不沿用 S1 的 233 或 1.73。
- 要加菜单、门、镜像、handler、expose、renderer、UI、存储、CSP、协议、CI 或规格正文：停。
- 要预留 S2b 门回调，或把槽表放进 `composition-root.ts`：停。
- 没有 Forge 对修订后精确 tip 的 PASS，或没有另发的实施指令：不写产品代码。
- 修订后同一 Draft 预计仍放不下完整产品与行为测试：停报真实预算和选项。不自行拆批，不把另开 PR 或先合文档写成已批准。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件首稿 | `f9087a04`，+247/−0 |  |
| 2 | 台账三行与页脚 | `d9f9c96e`，+4/−1。本修订不动 |  |
| 3 | Forge 审 `d9f9c96e` | HOLD。无新 BLOCK。639 是预计 |  |
| 4 | 删重复叙述并重算同一 Draft | `bfc7dd97`，相对 main 本文件 +179/−0。先于实现 |  |
| 5 | Forge 复审。PASS 前不实施 | `bfc7dd97` / tree `3bfedc0a` PASS。先于实现 |  |
| 6 | 另有实施指令后按白名单实施 | `04d11267`，白名单 8 文件 +348/−7 |  |
| 7 | 补非法 epoch 的行为断言 | Forge 重估复核。`2095b343`，测试 +18/−0。不是新的 Wisdom 批准 |  |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 16:52 继续推进，本修订只改计划 | 原话「你按照项目进度继续推进吧」。台账 16:52 行。不改更早的「S2 未批准」 | 2026-11-16 | Wisdom |
| 阶段规则引用已合 seam | 避免第二份正文。验收矩阵仍留在本文件 | 2026-11-16 | 计划核对，非新批准 |
| `senderWebContentsId` 必填 | 通过 `acceptsSender` 后总会抄入 | 2026-11-16 | 计划核对，非新批准 |
| HOLD 后仍计划同一 Draft | 639 是预计超 39，不是当前门禁失败。Forge 可推荐载体；Ready 与合入仍须 Wisdom 精确批准 | 2026-11-16 | 计划核对，非新批准 |
| Loom 原则复核 PASS | 基线 `405c865`。无新增可见落点。不替代技术 PASS 或 QA。台账不加行 | 2026-11-16 | Loom 复核，非新 Wisdom 批准 |

## 自检

- [x] 影响 arch / prd 吗？不影响。
- [x] 本修订只改本文件。台账未改。
