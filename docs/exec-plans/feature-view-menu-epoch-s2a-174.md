# 执行计划

S2a：main 文档代与 IPC context 身份字段。分支 `feature/view-menu-epoch-s2a-174`。文件名与分支同名。

基线是已合 PR #221 的 main `405c865a48902d6406a964a155823c49f4e3bff9`。唯一 parent `95796e5f96cc8cceb78dc6389585626d03d1d486`。tree `c918fe8e02086d4ee9a2a586534f70502f4f59ee`。方案源是已合 [feature-reader-view-menu-seam-174.md](feature-reader-view-menu-seam-174.md) 的「文档代」和 S2a 行。顺序仍是 S1 → S2a → S2b → S2c-prep → S2c-on → E2-0 → E2-1 → E2-2 → S3，见该文件与 [E2 计划](feature-reader-view-modes-e2-174.md)。本文件不改那两份计划。

本回合只交本文件，下一笔只交 [docs/approvals.md](../approvals.md)。不写产品代码、测试或生成物。Forge 对本文件精确 tip 审查 PASS 之前，不执行文末交接。Loom 对本笔无可见 UI 的原则 delta 复核由 Forge 协调，未收口前不实现。没有另发的实施指令时，也不实现。

14:44、14:51、15:31、16:01 的原文都写着当时不批准 S2。那些行不改。16:52 是新的一行，只授权规划并准备 S2a，不是把旧的「未批准」改写成当时已经批准，也不是本计划的 PASS。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

本回合任务类型：不适用（纯文档）。以后的实施不是 UI 改动，也不是 core 改动：它只改 desktop main 的文档代和 router 上下文，不改 `packages/features/**`，不改 `contracts/src/ipc/**`。切片是 main 里的 shell 文档代。本笔无可见 UI。

## Goal

只设计并精确规划 S2a。实施时要做的是：`ipc-router.ts` 在 `acceptsSender` 通过后，把 `event.sender.id` 抄进 context；新建 `view-menu-epoch.ts`，按 `webContents.id` 保存 `unpublished` / `open` / `retired` 和 epoch、地板；`window.ts` 在 `loadURL` 之前挂上监听；`index.ts` 创建一份闭包里的槽表并传给 `createMainWindow`；行为测试覆盖下面的验收。不新增菜单形状、替换门、镜像、handler、生产命令表或 expose。

## Context

- 现在已有的行为：`apps/desktop/src/main/ipc/ipc-router.ts` 244 行。`IpcCommandContext`（14–17 行）只有 `requestId` 和可选的 `droppedFilePath`。`runCommand`（122–125 行）先调用 `acceptsSender`，失败就 `sender_rejected`。`callHandler` 在那之后才调用 `commandContext`（168 行调用，181–189 行定义）。165 行写明 idempotent 不重试。`apps/desktop/src/main/ipc/sender-frame.ts` 的 `isAppSender` 要求 frame 非空、`oi-app:`、并且 `windows` 里有同一 `sender.id` 和同一个 `mainFrame` 引用。`isOiAppUrl` 是该文件的私有函数。`wire-ipc.ts` 的生产 `acceptsSender` 调用 `isAppSender`。`apps/desktop/src/main/window.ts` 25 行：`createMainWindow()` 无参数，先建窗，再登记 `will-navigate` 和 `setWindowOpenHandler`，然后 `void win.loadURL(appStartUrl)`。唯一调用点是 `apps/desktop/src/main/index.ts` 37 行，该文件 59 行。`appStartUrl` 是 `oi-app://app/index.html`。`composition-root.ts` 不调用 `createMainWindow`。`shell.reportViewMenu` 已在 `packages/contracts/src/ipc/shell.ts`，`expose: false`。代表测试：`apps/desktop/test/ipc-router.test.ts`（504 行）里的 `returns sender_rejected when the frame is not this app` 与 `passes a dropped file path to the handler and leaves it out of the result`。文件头的 `invokeEvent` 使用 sender id 1。必须补上 `senderWebContentsId` 才能通过类型检查的对象字面量只有两处：`apps/desktop/test/library-command-map.test.ts` 20 行 `{ requestId: "map" }`，`apps/desktop/test/open-document-wiring.test.ts` 34 行 `{ requestId: "open" }`。`apps/desktop/test/ipc-production-assembly.test.ts` 不构造 `IpcCommandContext`。
- 相关的节：[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.3、§2.4、§11、§13 的 G12；[RULES.md](../../RULES.md) §1.1、§2、§5、§8、§9；[docs/arch/06.md](../arch/06.md) 的文件与函数上限；[docs/ci-and-environment.md](../ci-and-environment.md) 的门禁；已合 seam 的「文档代」「一条命令」和 S2a 文件名单；[PRD.md](../../PRD.md) 与 [DESIGN.md](../../DESIGN.md) 只作边界，本笔不改它们。[docs/design-principles.md](../design-principles.md) P4：优先系统原生行为。本笔没有可见控件。
- 还没做的部分：context 里的发送方 id、文档代槽、`loadURL` 之前的监听、挂接、行为测试。菜单形状、替换门、镜像、handler、expose、renderer 上报、栏位 UI、存储都还没批。

已读 PRD、ARCHITECTURE、RULES、DESIGN、设计原则、AGENTS、已合 seam、E2 计划里与顺序和菜单 seam 相关的约束。没有发现必须改规格才能做 S2a 的冲突。DESIGN 与原则正文保持原样。

## Constraints

阶段只有 `unpublished`、`open`、`retired`。槽的键是 `webContents.id`。成功的 `oi-app:` 主 frame `did-navigate` 把 epoch 加一、地板归零、阶段改为 `open`。不等 `did-finish-load`。URL 只用该事件的参数，不用 `getURL()`。没有槽时按 `{ phase: "unpublished", epoch: 0, floor: 0 }` 参加这一次转移；第一次成功因此得到 epoch 1。

`senderWebContentsId` 是必填 `number`。router 只从 `event.sender.id` 抄，不从载荷抄。`commandContext` 的参数是 `requestId`、`senderWebContentsId`、`dropped`，三个，不超过 [docs/arch/06.md](../arch/06.md) 的硬上限 4。调用仍在 `acceptsSender` 通过之后。不把检查后移，不改 `isAppSender`，不改 `wire-ipc.ts`。

`oi-app:` 的判断复制进本模块：`new URL(url).protocol === "oi-app:"`，抛错则不是。不增加 host 白名单。不改 `sender-frame.ts`，不把那边的私有函数改成导出。若必须共享导出才能做完，停。

槽表放在 `createViewMenuEpoch()` 的闭包里。不写模块级 `let`（F-06）。`index.ts` 的 `startDesktop` 创建一份并传给 `createMainWindow`。不把这份对象放进 `composition-root.ts`。`composition-root.ts` 零 diff。

监听挂在这个窗口的 `webContents` 和 `closed` 上，不挂 `app.on("render-process-gone")`。`did-navigate` 的类型签名没有 `isMainFrame`，因为它只在主 frame 上出现。`did-fail-provisional-load` 的 `isMainFrame` 是第 5 个参数；监听用剩余参数数组读下标 4，先判断是 boolean，不是 boolean 就不动槽。这样回调参数不超过 4。已用 Electron 45.2.1 的 `electron.d.ts` 和 `apps/desktop/tsconfig.main.json` 的 strict 标志对这种剩余参数做过 `tsc --noEmit`，退出码 0。若实施时赋不上重载，停，不改成五个以上具名参数，不加 eslint-disable。

本模块不导入 `Menu`，不调用 `setApplicationMenu`。不订阅 `did-fail-load` 和 `did-finish-load`。不改导航决定。函数软 50、硬 80；普通源文件硬 400/600，入口 `index.ts` 硬 100/150，测试硬 600/800。一个文件只做文档代，或只做 router 的 context 抄写，不把菜单和文档代堆在一起。

S1 的 233 行和 1.73 只属于 S1。本批不沿用。346 只是重估触发点，本文件就是这次重估。600 仍是全 PR 实际新增+删除的硬停点。1.73 的乘积不是 CI 算法。不写 `G12:`，不删测试来凑数，不改 `tools/check-pr-size/check.mjs`。

## 现状证据：Electron 45.2.1

`apps/desktop/package.json` 的 `electron` 是 `45.2.1`。对照副本是该版本的 `electron_api_web_contents.cc`。`DidFinishNavigation`：`HasCommitted()` 为假时直接返回，不发事件（2872–2873 行）。已提交、非错误页、非 same-document、且是主 frame 时，才 `Emit("did-navigate", url, http_response_code, http_status_text)`（2903–2908 行）。same-document 发的是 `did-navigate-in-page`（2888–2891 行）。已提交错误页发 `did-fail-provisional-load`（2929–2930 行）；`code == net::ERR_ABORTED` 时这条路径不再发 `did-fail-load`（2932–2939 行）。`DidFailLoad`（2560–2578 行）仍会另发 `did-fail-load`。已安装的 `electron.d.ts` 17651–17652 行把 `did-fail-provisional-load` 注释成取消（例如 `window.stop()`）。那句和上述 emit 点不一致。实现跟已合 seam 和这段 emit 点。未 commit 的取消不发 `did-navigate`，也不发 `did-fail-provisional-load`；阶段保持不动。不用 `did-fail-load` 来判断取消。

若某次成功的 `oi-app:` 加载没有 `did-navigate`，停，不改用 `getURL()`。这个缺口在上述函数里没有看到：主 frame、已提交、非错误、非 same-document 就会发 `did-navigate`。

## 事件矩阵

没有事件时 `read(id)` 是 `undefined`，表示还没有槽，不算 `retired`。下表的「当前」在没有槽时按 unpublished、epoch 0、floor 0 计算。

| 事件 | 当前 | 结果 |
| --- | --- | --- |
| 主 frame `did-navigate`，URL 是 `oi-app:`，加一后仍是安全整数 | 任意阶段 | `open`。epoch 加一。floor 0。已 `retired` 后再来一次成功提交也重新 `open`，不是等 finish |
| 同上，但当前 epoch 已是 `Number.MAX_SAFE_INTEGER`，或不是非负安全整数 | 任意阶段 | `retired`。epoch 与 floor 保持原值。不存 `MAX_SAFE_INTEGER + 1`，不回绕成 0 或 1 |
| 主 frame `did-navigate`，URL 不是 `oi-app:` | 还没有 `open` 过，或仍是 `unpublished` | `unpublished`。epoch 0，floor 0。初始 `about:blank` 不退役 |
| 主 frame `did-navigate`，URL 不是 `oi-app:` | `open` | `retired`。epoch 与 floor 不变 |
| 主 frame `did-navigate`，URL 不是 `oi-app:` | `retired` | 保持 `retired`。不退回 `unpublished` |
| 主 frame `did-fail-provisional-load` | 任意 | `retired`。随后的 `did-finish-load` 不重新公开，也不把 epoch 再加一 |
| `did-fail-provisional-load` 且 `isMainFrame` 不是 true | 任意 | 不变 |
| `did-navigate-in-page`（same-document，含主 frame 的 `oi-app:`） | 任意 | 不换代 |
| 未 commit 的取消 | 任意 | 不变。不订阅 `did-fail-load`。测试若对假宿主发出 `did-fail-load`，槽不变 |
| 该 `webContents` 的 `render-process-gone` | 任意 | `retired`。听窗口的 `webContents`，不听 `app` |
| `closed` | 任意 | 删掉这个 id 的槽。不调用 Menu |

`did-finish-load` 永远不是公开信号。无效 URL 按非 `oi-app:` 处理。

## 挂接顺序

`createMainWindow(epoch)` 的顺序：

1. `new BrowserWindow(...)`。
2. 现有的 `will-navigate`。不改 `decideNavigation`。
3. 现有的 `setWindowOpenHandler`。不改 `decideWindowOpen`。
4. `epoch.attach(win)`。
5. `void win.loadURL(appStartUrl)`。
6. `return win`。

`attach` 只登记监听：`did-navigate`、`did-navigate-in-page`、`did-fail-provisional-load`、`render-process-gone`、`closed`。键在登记时从 `webContents.id` 抄下。`index.ts` 不另挂 app 级监听。`startDesktop` 不导出；不为了单测它而新增导出。监听早于 `loadURL` 的行为由 `createMainWindow` 的测试钉住。

测试里的假 `loadURL` 只有在 `did-navigate` 已经登记时才同步发出 `oi-app://app/index.html`。断言槽变为 `open`。这不是读源码文本（F-08）。

## 模块形状

`view-menu-epoch.ts` 导出 `createViewMenuEpoch`、`reduceViewMenuSlot`、`blankViewMenuSlot`，以及槽和阶段的类型。`reduceViewMenuSlot` 是监听和溢出测试共用的纯函数。导出它不是第二条 IPC，不进 preload，不进 contracts。若审查认为这是超出已合方案的新 seam，停；不改成循环到 `MAX_SAFE_INTEGER`，也不加只给测试写的 setter。

草稿里的函数都短于 50 行：`attachWindow` 23 行，其余更短。两处超过 printWidth 80 的签名折行后，文件按 128 行估。硬上限 600，建议 400。不拆成第二个产品文件。

`ipc-router.ts` 只加 context 字段和抄写。`window.ts` 只加参数、类型导入和 `attach` 调用。`index.ts` 只加导入，并把 `createMainWindow()` 换成 `createMainWindow(createViewMenuEpoch())`。

## 验收与测试

行为测试放在新文件 `apps/desktop/test/view-menu-epoch.test.ts`。假宿主记录登记的事件名和发出的顺序。断言槽的值、登记名和 `Menu.setApplicationMenu` 的调用次数。不读源码文本。不测已经删掉的 renderer 事件，也不为 `oi-view-original` 一类名字写断言。

必须覆盖：

- 初始没有槽。
- 第一次 `about:blank` 的 `did-navigate` 保持 `unpublished`，不退役。
- 只有 `oi-app:` 主 frame `did-navigate` 时就是 `open`、epoch 1、floor 0，不等 finish。
- 从未 `open` 的非 `oi-app:` 与已经 `open` 之后的非 `oi-app:` 分开：后者 `retired`。
- 主 frame `did-fail-provisional-load` 之后的 finish 不重新公开。
- `isMainFrame` 不是 true 的 provisional failure 不改变已 `open` 的槽。
- 发出 `did-fail-load` 时槽不变，且登记名里没有它。
- `did-navigate-in-page` 不换代。
- `reduceViewMenuSlot` 从 `Number.MAX_SAFE_INTEGER` 出发，下一次成功 `oi-app:` 变为 `retired`，epoch 仍是该值，floor 不变。
- `render-process-gone` 退役；之后另一次成功 `oi-app:` `did-navigate` 可以再 `open` 并把 epoch 加一。
- `closed` 删槽，Menu 调用次数仍是 0。
- `createMainWindow` 在同步 `loadURL` 发出 `did-navigate` 时，槽已经是 `open`。

`ipc-router.test.ts` 增加一条：`acceptsSender` 为真时，handler 看到的 `senderWebContentsId` 是 7，载荷仍是 `{ id: "doc-1" }`。现有的 `sender_rejected` 测试保持 handler 调用次数 0。不改 `invokeEvent` 的 id 1。两个既有字面量只为必填字段补上 `senderWebContentsId: 0`。这两个测试不断言菜单身份。装配测试预计零 diff；若它因本笔失败，停报，不扩大白名单。

按草稿计，行为测试 188 行，12 个 `it`，每个短于 50 行，没有超过 80 列的行。router 测试增加 17 行。504 + 17 = 521，低于测试建议上限 600。

## 文件白名单

本回合：

| 笔 | 只许改 |
| --- | --- |
| 1 | `docs/exec-plans/feature-view-menu-epoch-s2a-174.md` |
| 2 | `docs/approvals.md` |

实施回合才许改，而且要等 Forge PASS、原则复核收口、以及另发的实施指令：

| 文件 | 许改的范围 |
| --- | --- |
| `apps/desktop/src/main/ipc/ipc-router.ts` | context 字段与 `commandContext` 抄写 |
| `apps/desktop/src/main/view-menu-epoch.ts` | 新建。只有文档代 |
| `apps/desktop/src/main/window.ts` | 参数与 `loadURL` 之前的 `attach` |
| `apps/desktop/src/main/index.ts` | 创建一份 epoch 并传入 |
| `apps/desktop/test/view-menu-epoch.test.ts` | 新建。行为测试 |
| `apps/desktop/test/ipc-router.test.ts` | 一条身份字段测试 |
| `apps/desktop/test/library-command-map.test.ts` | 只改 context 字面量 |
| `apps/desktop/test/open-document-wiring.test.ts` | 只改 context 字面量 |
| `docs/evidence/<PR号>/commands.md` | 只记录实际跑过的命令 |
| 本文件 | 只补「实际」列。不改本回合已经写明的范围 |

## 不改

`composition-root.ts`、`sender-frame.ts`、`wire-ipc.ts`、`library-wiring.ts`、`library-menu.ts`、`security/navigation.ts`、`security/window-preferences.ts`、`ipc-production-assembly.test.ts`。`packages/contracts/**`。`oi.generated.ts`、`oi-api.d.ts`、`registry.generated.ts`。renderer、UI、存储、CSP、协议。`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`。`.cursor/environment.json`、`.cursor/install.sh`。CI 与门禁脚本。PRD、ARCHITECTURE、RULES、seam 计划、E2 计划、规格变更记录。菜单形状、替换门、镜像、handler、生产命令表、expose。S1 保持 `expose: false`。正常 codegen 之后生成物零 diff，不手改生成物。

已合 seam 把「换代或退役时经替换门请求 none」写在文档代一节，但 S2b 的文件名单是 `view-menu-gate.ts`、`view-menu-mirror.ts`、`library-menu.ts`、`library-wiring.ts`，不含 `view-menu-epoch.ts`、`index.ts`、`composition-root.ts`。本笔不预留门回调。地板仍存在本模块里，因为「成功时地板归零」写在文档代节，而 S2b 的名单不含本文件。到 S2b 或 S2c-on 时，若不能在它们已经点名的文件里接上，停报，不在本笔先改架构。

## 预算

口径是 `git diff --numstat` 的新增+删除。文档计入。生成物若有 diff 就失败，不靠排除项放过。下表是实施前的逐文件估算，依据是当前 244 / 25 / 59 / 504 行的排版、printWidth 80，以及两份未入库草稿的行数。实施时用真实 numstat 替换「计划」列；超过下表合计或超过 600，停。

| 文件 | 新增 | 删除 | 合计 | 依据 |
| --- | --- | --- | --- | --- |
| `ipc-router.ts` | 5 | 3 | 8 | 类型字段 +1；参数 +1；调用点与两处 return 各 +1/−1 |
| `view-menu-epoch.ts` | 128 | 0 | 128 | 草稿 123 行；两处超 80 列折行后 +5 |
| `window.ts` | 3 | 1 | 4 | 类型导入、签名、`attach` |
| `index.ts` | 2 | 1 | 3 | 导入，以及把调用改成传入 epoch |
| `view-menu-epoch.test.ts` | 188 | 0 | 188 | 草稿 188 行，12 个 `it` |
| `ipc-router.test.ts` | 17 | 0 | 17 | 一条 sender id 7 的测试 |
| `library-command-map.test.ts` | 1 | 1 | 2 | 替换后的一行是 80 列 |
| `open-document-wiring.test.ts` | 4 | 1 | 5 | `requestId: "open"` 那一行是 81 列，会折成四行 |
| `ipc-production-assembly.test.ts` | 0 | 0 | 0 | 不构造 context。若失败则停 |
| 证据 `commands.md` | 32 | 0 | 32 | 实施跑完才写。抬头、codegen、定向、全量、check、check-docs、行数门禁 |
| 本文件 | 247 | 0 | 247 | 本回合实测行数，写在提交前 |
| `docs/approvals.md` | 4 | 1 | 5 | 三行新记录，页脚一行替换 |
| 产品与测试小计 | 348 | 7 | 355 | 不含文档 |
| 实施若另起 diff | 380 | 7 | 387 | 355 + 证据 32。不含已经合入的计划和台账 |
| 同一 PR 全量 |  |  | 639 | 387 + 本文件 + 台账 5 |

原估 234 = 18+100+4+12+100，没有把计划、台账、证据和两处类型字面量算进去，也不是按当前行宽重排的。1.73 × 234 = 404.82，只作历史披露，不是本表的算法，也不是开工门槛。346 是重估点；387 已经超过 346，所以写在这里，不另设停点。

同一 PR 把本文件和台账也算进实施 diff 时，合计是 639。这个数超过 600。因此实施不得追加进本 Draft。不把 600 改高，不写 `G12:`，不删测试。实施是否在本文件合入之后另开 PR，由 Forge 在精确计划 PASS 时决定；本文件不把另开 PR 写成已经批准。另开时的预计是 387。若那一笔还要回填本文件的「实际」列，按改动行再计新增+删除；现在另估 10 行替换，即 +10/−10，合计约 407，仍低于 600。实施前用 numstat 重算，超过 600 就停。

`index.ts` 现在 59 行，净增 1 行后约 60，仍低于入口建议上限 100。`ipc-router.ts` 现在 244 行，净增 2 行后约 246，仍低于 400。行为测试 188 行，router 测试 504+17=521，都低于 600。

## 命令

本回合只跑文档检查。工作目录是本 worktree 的仓库根。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。

```text
node tools/check-docs/check.mjs
```

不跑 Prettier 来格式化 Markdown。不跑 codegen，不跑 Vitest，不跑 `pnpm test`，不跑 `pnpm run check`，不启动 Electron。

实施回合才跑下面这些，并且只把实际退出码写进 `docs/evidence/<PR号>/commands.md`。没跑的不写成通过。全量 `pnpm test` 每个 tip 只跑一次。

```text
corepack pnpm run codegen
git diff --exit-code
corepack pnpm exec vitest run apps/desktop/test/view-menu-epoch.test.ts apps/desktop/test/ipc-router.test.ts apps/desktop/test/library-command-map.test.ts apps/desktop/test/open-document-wiring.test.ts
corepack pnpm test
GATE_BASE=origin/main corepack pnpm run check
node tools/check-docs/check.mjs
GATE_BASE=origin/main node tools/check-pr-size/check.mjs
```

`codegen` 之后 `git diff --exit-code` 必须为 0。三份生成物哈希与命令前相同。`check` 覆盖 G1 的 Prettier（只检查 ts/js）以及 G2、G3、G4、G5、G7、G10、G11、G12、G13–G16、G18。G1 的验收证据是 `check` 的退出码和「无违例文件」，不是 Markdown 排版。

## G1、Box 与真机

本回合的 G1 不适用产品源码：没有 ts/js diff。文档门禁是 `check-docs`。实施回合的 G1 是 `pnpm run check` 里的 Prettier，证据写进该 PR 的 `commands.md`。

Box：实施 tip 上由 Anvil 独立跑完整套。本笔没有 UI，这不构成豁免。本回合不跑 Box，不把 S1 的 899 通过写成 S2a 的结果。

真机：不启动 Electron。读屏、物理键、mac 菜单、R-E13 仍未验证。13:41 与 13:55 的真机决定不是本批。

## Done when

本回合：两笔提交分别只含计划和台账；Draft PR 的 head 就是第二笔；没有产品代码、测试或生成物；`check-docs` 的退出码写在 PR 说明里；保持 Draft。不合入，不 Ready，不发版。

实施回合还要同时满足：白名单之外零 diff；上表验收都有行为断言；`expose` 仍是 false；codegen 零 diff；`check`、定向测试和一次全量 `pnpm test` 的退出码写进证据；相对 `origin/main` 的新增+删除不超过 600；文件与函数不超过硬上限；Box 的独立结果已经记下；仍是 Draft。Forge PASS 和原则复核未收口时，这些都不算可以开始。

## 失败停点

- 成功的 `oi-app:` 加载没有 `did-navigate`：停，不改用 `getURL()`。
- 剩余参数监听赋不上 Electron 45.2.1 的重载：停。
- 必须导出 `sender-frame.ts` 的私有函数，或必须改 `acceptsSender`：停。
- 类型错误落到白名单外：停报，不顺手改。
- 装配测试失败：停报。
- 实测新增+删除超过 600，或某个文件、函数超过硬上限：停。不删测试，不写 `G12:`，不沿用 S1 的 233 或 1.73。
- 要加菜单、门、镜像、handler、expose、renderer、UI、存储、CSP、协议、CI 或规格正文：停。
- 要预留 S2b 的门回调，或把槽表放进 `composition-root.ts`：停。
- Loom 原则 delta 未收口，或没有 Forge 对精确计划的 PASS，或没有另发的实施指令：不写产品代码。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写产品代码 |  |  |
| 2 | 只补 `docs/approvals.md` 的三行和页脚 |  |  |
| 3 | Forge 审查本文件。PASS 前不实施 |  |  |
| 4 | 原则复核收口，并且另有实施指令 |  |  |
| 5 | 按白名单实施并用 numstat 回填 |  |  |

## 决策记录

| 决定 | 理由 | 日期 | 谁定的 |
| --- | --- | --- | --- |
| 16:52 只规划 S2a | 原话「你按照项目进度继续推进吧」。见批准记录 16:52 行。不改更早的「S2 未批准」 | 2026-11-16 | Wisdom |
| 跟已合文档代和 `DidFinishNavigation`，不跟 d.ts 的取消注释 | 未提交不发事件；已提交错误页才发 `did-fail-provisional-load` | 2026-11-16 | 计划核对，非新批准 |
| 不预留替换门回调 | S2b 的文件名单不含本模块。预留是新 seam | 2026-11-16 | 计划核对，非新批准 |
| 地板存在本模块并在成功时归零 | 这句话在已合「文档代」节。S2b 名单不含本文件 | 2026-11-16 | 计划核对，非新批准 |
| `senderWebContentsId` 必填 | 通过 `acceptsSender` 后总会抄入。可选字段让缺身份的调用也能编译 | 2026-11-16 | 计划核对，非新批准 |
| 实施不追加进本 Draft | 同一 PR 的预计新增+删除超过 600。不改停点 | 2026-11-16 | 计划核对，非新批准 |

## 自检

- [x] 影响 arch / prd 吗？不影响。不改规格正文。
- [x] 本回合第一笔只有本文件。
