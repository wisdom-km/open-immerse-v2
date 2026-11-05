# 执行计划

分支 `feature/m2-library-ui-166`。基线 `origin/main` `77371a77887ca42950dcead4b1605405e614b3b5`（#169 PR-B 已 squash 合入）。第一笔提交只有本文件。预计超过 300 行，且同时动文献库 `ui/`、契约 `expose`、preload 生成器与 `apps/desktop` 装配，所以按 [RULES.md](../../RULES.md) §2 先交计划。Forge 不在线审这份计划；计划提交之后同一分支继续实现。PR 保持 Draft，正文写 `Refs #166`，不写 Closes / Fixes。不合入，不 force push，不 rebase（N-01、N-03）。不改 `.github/`（N-02）。不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。本 PR 不改 domain / application 用例，不改 IPC schema。

任务类型：#166 拆分 C（UI + expose + 装配），不是「只改 `src/ui`」。涉及切片：`library`。`packages/contracts/src/ipc/library.ts` 只翻四条 `expose`。`tools/codegen` 补上 `dropped-file`。`apps/desktop` 做装配与最小壳。

## 现状理解

- 已有行为：`packages/contracts/src/library.ts` 与 `packages/contracts/src/ipc/library.ts` 已定义 `LibraryEntry`（无路径字段）和四条通道。四条都是 `expose: false`。`library.importDropped` 的 `transport` 是 `dropped-file`，请求体是空对象。`tools/codegen/preload-transport.mjs` 对暴露中的 `dropped-file` 抛 `dropped-file is not generated`；事件上的 `dropped-file` 抛 `event transport only allows invoke`。`apps/desktop/src/main/ipc/registry.generated.ts` 是空数组。`wire-ipc.ts` 把 `handlers` 写成空 `Map`，`ipcMain.handle` 只把一个 `payload` 交给 router。`composition-root.ts` 25 行，只建日志并调用空的 `wireIpc`。`packages/features/library` 已有导入、列表、重定位、阅读进度和 `createLibraryIpcHandlers`；`src/index.ts` 没有导出这个工厂。`src/pure.ts` 是空的 `export {}`。`apps/desktop/src/renderer/index.html` 是空的 `<body>`。没有 React，没有 `packages/ui-kit`。根 `tsconfig.json` 的 `lib` 只有 ES2023，`types` 为空。renderer 由 `oi-app://app/` 从 `apps/desktop/src/renderer` 提供。CSP 是 `script-src 'self'; style-src 'self'`，没有 `unsafe-inline`。
- 相关的节：[docs/arch/03-01.md](../arch/03-01.md) §3.1、[docs/arch/05-01.md](../arch/05-01.md) §5.1、[docs/arch/05-03.md](../arch/05-03.md) §5.3、[docs/arch/06.md](../arch/06.md) §6、[docs/arch/09.md](../arch/09.md) §9、[docs/arch/09-01.md](../arch/09-01.md) §9.1、[docs/arch/13.md](../arch/13.md) G11、[docs/prd/03-01.md](../prd/03-01.md) S6、[docs/prd/06-01.md](../prd/06-01.md) AC-01、[docs/prd/03-06.md](../prd/03-06.md) E08 / B16、[docs/prd/08.md](../prd/08.md) M2、[DESIGN.md](../../DESIGN.md) §4.5.3 与 UIX-06 / UIX-11 / UIX-12 / UIX-67 / UIX-69、R5 / R14、[docs/design-principles.md](../design-principles.md) P3 / P4 / P5 / P7 与第 87、101、111 行、[docs/exec-plans/feature-preload-codegen-67.md](feature-preload-codegen-67.md) §3.1 拖入段、[docs/exec-plans/feature-m2-library-core-166.md](feature-m2-library-core-166.md)。
- 还没做的部分：把四条通道暴露给 `window.oi`、让生成器写出 `File` 形参、把拖入路径只留在 preload→main、在 main 打开存储并挂上 handler、画出最近 / 全部论文 / 打开文件 / 拖入 / 列头排序。B16 界面、`checkSource`、`shell.revealItem`、删除、多选、ingest、PDF.js 都不做。

## 来源核对

| 来源 | 节 / 位置 | 核对结果 |
| --- | --- | --- |
| Issue #166 正文 | 决定 1 | 对得上。处理：复制、SHA-256 去重、`duplicate: true` 已在 B。本 PR 只把结果接到界面：不新增行，选中已有行，`role=status` 写「已在文献库中」。 |
| Issue #166 正文 | 决定 3 | 对得上。处理：不画 B16、不画 reveal、不调用 `checkSource`。`library.relocate` 的 `expose` 改为 `true` 并挂 handler。UI 零调用。 |
| Issue #166 正文 | 决定 4 | 对得上。处理：只做列表和列头排序。不画删除、多选、批量、行内「⋯」、右键菜单。不调用 `session.save`。 |
| Issue #166 正文 | 决定 5、10 | 对得上。处理：recent / all 的筛选和默认序留在已合入的 `list-library`。UI 只调用 `library.list({ view, sort? })`，不自己筛、不自己排。未点列头时不传 `sort`。 |
| Issue #166 正文 | 决定 6 | 对得上。处理：左栏只有「最近」「全部论文」。不画 Markdown 笔记库、术语库、设置、「打开文件夹…」。空态文案只写「把论文 PDF 拖到这里」，不写 `.md`。 |
| Issue #166 正文 | 决定 7 | 对得上。处理：不接 ingest，不接 PDF.js。单击只选中。双击和 Enter 不调用任何通道。 |
| Issue #166 正文 | 决定 8 | 对得上。处理：启动调用 `list({ view: "recent" })`。该视图为空时，空态里有到「全部论文」的链接，点击后调用 `list({ view: "all" })`。 |
| Issue #166 正文 | 拆分 C | 对得上。处理：新建 `packages/features/library/src/ui/**`、renderer 壳、`slots.ts`。组件软 250 / 硬 400。`renderer/main.tsx` 与 `composition-root.ts` 软 100 / 硬 150。源文件软 400 / 硬 600。函数 ≤ 80。 |
| Issue #166 正文 | 「不做」 | 对得上。处理：与下面「不做」一节相同。 |
| Issue #166 评论 | [6650918054](https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6650918054) | 对得上。B 已在 `main@77371a7`。本分支从这次 `origin/main` 拉出。下一步就是本 PR。 |
| Issue #166 评论 | [6650951584](https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6650951584) | 对得上。Wisdom 原话「按推荐开工 PR-C：行点击仅选中；按 Loom 放置建议」。行点击写死 A。实现提交把这一行写入 [docs/approvals.md](../approvals.md)。 |
| Issue #166 评论 | [6651125733](https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6651125733) | 对得上「DESIGN / ARCH 不在本 PR」。14:10 原话把 approvals 补行、DESIGN / ARCH 冲突和 Loom 补丁放进并行文档 PR，并且那份 PR 不改 library 实现。处理：本 PR 仍按交接 §7 补两条 approvals（#169 合入同步、开工 C）。不改 DESIGN / ARCH 正文。若文档 PR 先写了同一行，merge `origin/main` 时只留一份。 |
| LOOM-PR-C-PLACEMENT.md | §1–4 | 对得上。处理：全部写进下面的行为。主按钮、全窗拖入、左栏两项、就地反馈、列头排序、空态去掉 `.md`、不画「⋯」/ 右键 / 删除 / 多选 / B16 / reveal。菜单「文件 › 打开…」与主按钮同源。 |
| LOOM-PR-C-PLACEMENT.md | §5 行点击 | 对得上交接写死的 A，对不上该节留的 B。处理：只选中。双击和 Enter 无动作。不写「阅读器尚未接线」。 |
| LOOM-PRINCIPLE-CHECK.md | §1–5 | 对不上：本工作区没有这份文件。处理：不阻塞。冲突以 #166 与交接为准。放置以已读的 LOOM-PR-C-PLACEMENT 为准。 |
| HANDOFF-PR-B / [feature-m2-library-core-166.md](feature-m2-library-core-166.md) | IPC / 范围外 | 对得上代码，交接原文不在本仓库。处理：B 留下 `expose: false`、空 registry、未挂 `wireIpc`、`createLibraryIpcHandlers` 未从 `index.ts` 导出。本 PR 翻开 expose、跑 codegen、挂上 handler，并补上导出。不重做导入用例。不处理 #169 打磨池（落盘原子、copy+unlink、relocate 不改 title）。 |
| [docs/arch/05-03.md](../arch/05-03.md) | §5.3 | 对得上插槽，对不上「文件菜单按扩展名分流到 ingest」。处理：`ui/index.ts` 导出一条 contribution。`slots.ts` 只注册 library 这一行。菜单「打开…」只走 `library.import`，不接 ingest，不出现「打开文件夹…」。§5.3 那句与决定 7 冲突，不改正文。 |
| [docs/arch/06.md](../arch/06.md) | 行数表 | 对得上。处理：遵守软硬上限。超过 600 行的 PR 写 `G12:`，不改上限（N-08）。 |
| [docs/arch/09.md](../arch/09.md) | §9 路径 | 对得上。处理：UI 只渲染 `LibraryEntry` 的 `title`、`fileName`、`addedAt`、`openedAt`。错误文案是固定短句。拖入路径只存在于 preload 调用 `webUtils.getPathForFile` 之后到 main handler 的第二个 IPC 参数里。 |
| [docs/arch/09.md](../arch/09.md) | 第 11 行 ingest | 对不上已合入的 #168 / #169。该行写打开 PDF 只有 `ingest.openDocument`。处理：以 #166 的 `library.import` / `library.importDropped` 为准。不改 §9 正文。 |
| [docs/arch/09-01.md](../arch/09-01.md) | list / relocate / reveal | 对得上 list 与 `relocate(id)`。处理：列头把 `title`、`status`、`openedAt`、`addedAt` 交给 `list`。`relocate` 只装配。`checkSource` 与 `shell.revealItem` 不做。②没有 `status` 字段，状态格一律显示「—」，排序仍把 `status` 交给 core（core 已回落到 `addedAt`）。 |
| [docs/arch/13.md](../arch/13.md) | G11 | 对得上。处理：`composition-root.ts` 与新建的 `slots.ts` 各自改动 ≤ 30 行。打开存储、对话框、handler Map、菜单放在非热点文件。 |
| [DESIGN.md](../../DESIGN.md) | §4.5.3、UIX-06 / 11 / 12 / 67 / 69、R5 / R14 | 对得上主按钮、空态、加载、重复导入、列头、左栏不放设置。对不上左栏后两项、次按钮「打开文件夹…」、空态里的 `.md`、行「⋯」。处理：按 #166 与 Loom 只画前两项和唯一主按钮。不改 DESIGN 正文（N-10）。UIX-11 的错误页整屏不在本 PR；失败用页顶就地一行。UIX-67 的「排序被记住」不验。UIX-69 的 Ctrl+, 打开设置不在本 PR（设置场景未建），左栏无「设置」要验。 |
| [docs/design-principles.md](../design-principles.md) | P3 / P4 / P5 / P7、第 87 / 101 / 111 行 | 对得上。处理：一枚主按钮；原生对话框与拖入；成功、重复、失败都在 `role=status`，不用 toast，不弹「已存在」。排序与去重都在 core。不可用项不渲染。不改该文件（N-10）。 |
| [packages/contracts/src/ipc/library.ts](../../packages/contracts/src/ipc/library.ts) | expose:false×4 | 对得上。处理：四条都改为 `expose: true`。不改 channel、schema、错误码、`transport`。settings 的 `expose` 不动。契约测试把「四条未暴露」改成「四条已暴露」。 |
| [tools/codegen/preload-transport.mjs](../../tools/codegen/preload-transport.mjs) | dropped-file 抛错 | 对得上。处理：command 的 `dropped-file` 改为生成。event 的 `dropped-file` 仍失败。 |
| [apps/desktop/src/main/composition-root.ts](../../apps/desktop/src/main/composition-root.ts) | 25 行 | 对得上。处理：只增加 `startLibrary(...)` 和把返回的 Map 传进 `wireIpc`。其余装配不进这个文件。 |
| `apps/desktop/src/main/ipc/registry.generated.ts` | 空数组 | 对得上。处理：只经 `pnpm run codegen` 重写。生成后四条 library 命令都在，且带 `transport`。 |
| [packages/features/library/src/index.ts](../../packages/features/library/src/index.ts) | 未导出 handlers | 对得上。处理：增加对 `createLibraryIpcHandlers` 与 `createLibraryMain` 的转出。文件仍只做转出。desktop 不 import 这个桶，见下面的边界说明。 |
| `apps/desktop/src/renderer` | 空白 HTML | 对得上。处理：加上根节点、样式表和打包后的脚本。React 壳只渲染文献库。 |
| [RULES.md](../../RULES.md) | §2、§8、§9 | 对得上。处理：一个 feature 切片；第一笔只有本计划；证据在 PR 号出来后写入 `docs/evidence/<PR号>/commands.md`。UI–core 交接说明写在 PR 正文。本 PR 按拆分 C 改 `index.ts` 的导出和 `expose`，不改用例。 |
| [docs/approvals.md](../approvals.md) | 至 12:33 行 | 对得上。处理：实现提交追加 #169 合入同步（13:55，不计批准）和 13:58 开工 C。不伪造原话。 |

## 计划 / 实际

计划列在开工前填。实际列在实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `c24623e`，只有本文件 | `git show --stat c24623e` |
| 2 | codegen：`dropped-file` 生成 `File` 形参与 `invokeDropped`；事件仍失败；测试翻新 | `08d1697`。命令生成 `file: File`。事件仍抛 `event transport only allows invoke` | `tools/codegen/preload-generate.test.ts` |
| 3 | 四条 `expose: true`，然后 `pnpm run codegen`，生成物入版 | `08d1697`。settings 仍是 `expose: false` | `packages/contracts/test/ipc-library.test.ts` |
| 4 | router 接受仅 preload 传来的路径第二参数；desktop 非热点接线；热点文件少改 | `08d1697`。`composition-root.ts` +2 行。`slots.ts` 2 行。`createLibraryMain` 不从 `index.ts` 转出：G14 的 `types: []` 不能跟着 Node 模块进 core | `apps/desktop/test/ipc-router.test.ts`、`library-main.test.ts` |
| 5 | `ui/**`、renderer 壳、`slots.ts` 一行；假 `window.oi` 的组件测试 | `08d1697`。单击只选中。双击和 Enter 不增加调用。UI 不调用 `relocate` | `packages/features/library/test/ui/library-screen.test.tsx` |
| 6 | approvals 两行。证据在 PR 号出来后写入 `docs/evidence/<PR号>/commands.md` | `08d1697` 追加 13:55 合入同步与 13:58 开工 C。证据等 PR 号 | `docs/approvals.md` |
| 7 | `GATE_BASE=origin/main corepack pnpm run check` 与 `corepack pnpm test`。失败则只修这次引入的失败 | 实现后跑。结果写入证据 | `docs/evidence/<PR号>/commands.md` |

## 行为

### 写死的选择

| 项 | 选择 |
| --- | --- |
| 行点击 | A。单击只改选中行。双击与 Enter 不调用 `import`、`importDropped`、`list`、`relocate`，也不写提示。 |
| relocate | `expose: true`，main 挂已有 handler。UI 与菜单都不调用。 |
| 传路径 | 见下一节。不进契约 schema，不进 `window.oi` 的返回值，不进 UI state。 |
| UI 栈 | `react` 与 `react-dom`（MIT）。组件在 `packages/features/library/src/ui/**`。不建 `packages/ui-kit`。不加 `react-router`。 |
| 打包 | 只对 renderer 用 `esbuild`（MIT）打出一个脚本。main 与 preload 仍用现有 `tsc`。 |
| dataRoot | `app.getPath("userData")`。不做数据目录指针迁移。 |
| 菜单 | 要做。应用菜单只有「文件 › 打开…」，快捷键 `CmdOrCtrl+O`。没有「打开文件夹…」「删除」「在访达中显示」「在资源管理器中显示」。 |
| 样式 | 独立 CSS 文件，由 `index.html` 链接。组件不用 `style` 属性，避免违反 `style-src 'self'`。TypeScript 不 import 这个 CSS，避免依赖图出现无法归层的边。 |
| 导入后的视图 | 成功或重复之后再 `list` 当前视图。返回的数组里没有这条 id 时（新导入的 `openedAt` 为 null，不在「最近」），改为 `list({ view: "all", sort })` 并选中它。这是为了让选中行看得见，不是 UI 自己排序。 |

### dropped-file 路径

1. 生成的 `window.oi.library.importDropped` 只接收 `File`。`oi-api.d.ts` 与 preload 生成物都写 `file: File`。请求体在契约里仍是空对象。
2. 生成方法调用 `bridge.invokeDropped(channel, file, {})`。它不调用 `webUtils`，也不返回路径。
3. `apps/desktop/src/preload/index.ts` 实现 `invokeDropped`：`webUtils.getPathForFile(file)` 之后 `ipcRenderer.invoke(channel, payload, absolutePath)`。路径是局部变量。
4. `wire-ipc.ts` 把 Electron 的第三个参数交给 router。router 只在该登记项的 `transport === "dropped-file"` 时收下非空字符串，放进 handler 上下文的 `droppedFilePath`。其它通道丢掉这个参数，不写入上下文，不写日志。路径缺失、不是字符串或含 NUL 时返回 `invalid_payload`，响应里没有这段字符串。
5. 登记表现在带 `transport`，否则 router 无法分辨。该字段由 codegen 写出，不手改生成文件。
6. desktop 的适配函数把 `droppedFilePath` 交给已有的 `importDropped(absolutePath)`。校验 schema 的仍是空对象 payload。payload 里若多出路径字段，现有 `additionalProperties: false` 会拒绝。
7. 测试：生成物含 `File` 与 `invokeDropped`，不含返回路径的语句；事件 `dropped-file` 仍抛错；router 把路径交给 handler 且响应 JSON 不含该路径；invoke 通道的第二参数不会出现在上下文里。

### 装配

`packages/features/library/src/adapters/library-main.ts` 新增 `createLibraryMain({ dataRoot, pickPdf, clock })`。它用 `readSliceMigrations("library", <包内 migrations>)` 和 `openAppStorage` 打开库，再建 repository、file store 和四个用例，最后调用 `createLibraryIpcHandlers`。`ingest.openDocument` 注入空函数。打开失败时四条 handler 都返回 `handler_threw`，消息里没有 dataRoot。

desktop 不从 `@oi/feature-library` 桶导入。那个桶转出 domain，而 [docs/arch/05-01.md](../arch/05-01.md) 没有 MAIN → DOM。`no-cross-feature-internals` 只约束切片之间。desktop 改从公开子路径 `@oi/feature-library/main` 导入，包导出指向 `src/adapters/library-main.ts`。dependency-cruiser 因此记成 MAIN → ADP，这是图上已有的边。`index.ts` 仍然转出工厂，给测试和以后的装配用。`tools/check-deps/tsconfig.paths.json` 加上这条子路径，避免它被收成无法归层的 seam。

`apps/desktop/src/main/library-wiring.ts`（非热点）做三件事：用 `dialog.showOpenDialogSync` 实现 `PdfPicker`（只此文件出现 Electron 对话框；features 不 `import "electron"`）；调用 `createLibraryMain`；把四条 handler 放进 `Map<string, IpcCommandHandler>`。`library.import` 与 `library.relocate` 走各自的已有函数。`library.importDropped` 读上下文里的路径。同一文件注册菜单。菜单项的 click 在页面里派发 `oi-open-file`。快捷键只放在菜单加速键上，页面不再监听一份 Mod+O，避免对话框开两次。

`composition-root.ts` 只把 `startLibrary(app.getPath("userData"))` 的 Map 传进 `wireIpc`。`wireIpc` 增加 `handlers` 参数，并多传一个 IPC 参数。storage 在退出前 `close`。

`@oi/feature-library` 增加 `tsconfig.build.json`，desktop 的 `build` 在编译 main 之前编译它。`dist/` 已在 `.gitignore`。migrations 目录相对 `src/adapters` 与 `dist/adapters` 都是 `../../migrations`，SQL 不用复制。

### 界面

`LibraryApp` 挂在 `ui/index.ts` 的 contribution 上。`apps/desktop/src/renderer/slots.ts` 只有这一条注册。`main.tsx` 把 `slots[0]` 渲染进 `#root`。

| 区域 | 行为 |
| --- | --- |
| 左栏 | 两个按钮：「最近」「全部论文」。当前项 `aria-current="page"`。没有其它导航项。 |
| 启动 | 第一次 `list({ view: "recent" })`。 |
| 主按钮 | 文案「打开文件…」，全屏只有这一枚。点击与 `oi-open-file` 都调用 `window.oi.library.import()`。 |
| 拖入 | `dragover` 在 window 上 `preventDefault`。松手取第一个 `File`，调用 `importDropped(file)`。没有文件则忽略。 |
| 列表 | 列头「标题 / 状态 / 打开时间 / 加入时间」对应 `title` / `status` / `openedAt` / `addedAt`。第一次点击 `asc`，再点 `desc`。`aria-sort` 为 `ascending`、`descending` 或 `none`。未点过的列是 `none`。 |
| 状态格 | 每行都是「—」。不写解析中、失败或进度。 |
| 时间 | 只显示 seam 的时间戳，空的 `openedAt` 显示「—」。 |
| 选中 | 单击设置 `aria-selected`。 |
| 反馈 | 一个 `role=status`。新导入：「已加入文献库」。重复：「已在文献库中」。取消：清空，不弹框。`not_pdf`：「只支持 PDF」。`hash_mismatch`：「这份文件没有通过校验」。其余码：「操作没有完成」。这些句子都不含 `.md`、`markdown`、绝对路径。 |
| 空态 | 「把论文 PDF 拖到这里」加主按钮。「最近」为空时另有链接「全部论文」。 |
| 加载 | 列表区三行骨架，`aria-busy`。 |
| 失败 | 列表失败时页顶就地一行，左栏仍可切换并重新 `list`。 |

不渲染：Markdown 笔记库、术语库、设置、打开文件夹、行「⋯」、右键菜单、删除、多选、复选框、B16、重新定位、reveal、解析进度列、toast、`window.alert`。

### 依赖（G10）

| 包 | 许可 | 放在 | 用途 | 不用它时 |
| --- | --- | --- | --- | --- |
| `react`、`react-dom` | MIT | `@oi/feature-library` 的 dependencies | 文献库壳 | 手写 DOM，行数更多，表格和 `aria-sort` 更容易错 |
| `esbuild` | MIT | `apps/desktop` 的 devDependencies | 只打包 renderer | 把 Vite 整条工具链引进来 |
| `happy-dom`、`@testing-library/react`、`@testing-library/dom` | MIT | 根 devDependencies | 组件测试。仅 `test/ui` 用 `@vitest-environment happy-dom` | 不测点击、双击和 `aria-sort` |
| `@types/react`、`@types/react-dom` | MIT | 根 devDependencies | UI 的 `tsc` | 没有 JSX 类型 |

根 `tsconfig.json` 继续不带 DOM，并排除 `packages/features/**/src/ui/**`、`packages/features/**/test/ui/**`、`apps/desktop/src/renderer/**`、`apps/desktop/src/preload/**`。新增 `tsconfig.ui.json`（`jsx: react-jsx`，`lib` 含 DOM）覆盖 UI 与 renderer。`tools/typecheck.mjs` 在根 `tsc` 之后再跑 `tsconfig.ui.json` 和 `apps/desktop/tsconfig.preload.json`（给 preload 加上 DOM，这样生成物里的 `File` 能通过）。`tsconfig.core.json` 不收 UI。`vitest.config.ts` 的 include 加上 `packages/features/*/test/ui/**/*.ts` 与 `*.tsx`。core 测试仍在 Node，不 import React。

打包脚本把 `apps/desktop/src/renderer/main.tsx` 打成 `apps/desktop/src/renderer/main.js`，并 gitignore 这个文件。`pnpm start` / `pnpm e2e` 已先跑 desktop `build`。CSS 与 `index.html` 是源文件。

### 行数与门禁

`G12: expose、dropped-file 生成、装配与文献库 UI 是同一次证明，不拆、不改 600 行上限。`

热点声明：`apps/desktop/src/main/composition-root.ts`、`apps/desktop/src/renderer/slots.ts`。各 ≤ 30 行 diff。

## 测试映射

| 验收 | 观察 |
| --- | --- |
| expose + codegen | 四条 `expose === true`；settings 仍是 false；`window.oi` 类型含 `library.import`、`importDropped(file: File)`、`list`、`relocate`；registry 四条且 transport 正确 |
| dropped-file | 命令生成成功；事件仍抛 `event transport only allows invoke`；假 bridge 收到 `File` 与 `{}`，返回值不含路径 |
| router | dropped 通道把路径交给 handler，响应不含该路径；路径塞进 payload 得到 `invalid_payload`；invoke 通道不接收第二参数 |
| UIX-06 | 名为「打开文件…」的按钮恰有一个；没有「打开文件夹…」 |
| UIX-69 / 决定 6 | 左栏只有「最近」「全部论文」 |
| 决定 8 | 首次 `list` 是 `{ view: "recent" }`；空态链接会再 `list({ view: "all" })` |
| UIX-12 / AC-01 | `duplicate: true` 时行数不由 UI 增加；选中该 id；status 为「已在文献库中」；没有 `dialog` |
| 拖入 | PDF `File` 调用 `importDropped`；非 PDF 的失败文案是「只支持 PDF」，且不含 `.md` |
| UIX-67 部分 | 点列头调用 `list({ sort })`；`aria-sort` 跟着变；重新挂载后第一次调用又不带 `sort` |
| 行点击 A | 单击只改 `aria-selected`；双击和 Enter 不增加 `oi` 调用 |
| §9 | 渲染文本与 status 文本不匹配绝对路径；组件不读 `originalPath` |
| 不调用 | 全程 `relocate` 调用次数为 0；没有「⋯」 |
| library-main | 假 `PdfPicker` 与临时 dataRoot：导入后 `list` 能看见条目；失败路径的结果里没有 dataRoot |
| 菜单数据 | 只有「打开…」和 `CmdOrCtrl+O`；没有禁止的菜单项 |

用例名用 `<结果> when <条件>`。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 行点击仅选中 | 原文：「按推荐开工 PR-C：行点击仅选中；按 Loom 放置建议」。实现提交写入 approvals。来源：https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6650951584 | 2026-11-05 13:58 | Wisdom |
| 按 Loom 放置 | 同一句原话。左栏两项、唯一主按钮、全窗拖入、就地反馈、列头走 core | 2026-11-05 13:58 | Wisdom |
| relocate 暴露但 UI 不调用 | Loom §1 与交接 §7.2 的推荐。B16 界面仍不做 | 2026-11-05 | 交接建议，本计划采纳 |
| 路径走 IPC 第二参数 | 交接要求在计划里写死。schema 保持空对象 | 2026-11-05 | 本计划 |
| React + esbuild，不建 ui-kit | 交接 §1.5。CSP 不允许内联脚本，静态 HTML 挂不上 JSX | 2026-11-05 | 交接建议，本计划采纳 |
| dataRoot 用 userData | 交接 §7.5。指针迁移另议 | 2026-11-05 | 交接建议，本计划采纳 |
| 菜单只留「打开…」 | 用户要求文件菜单；DP:54 不放还不能用的项 | 2026-11-05 | 交接与 Loom，本计划采纳 |
| 不改 DESIGN / ARCH 正文 | N-10。14:10 原话把这些冲突放进并行文档 PR。来源：https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6651125733 | 2026-11-05 14:10 | Wisdom |
| desktop 走 `@oi/feature-library/main` | 桶会带上 domain，MAIN → DOM 不在 §5.1。子路径落在 adapters，是已画出的 MAIN → ADP | 2026-11-05 | 本计划 |
| 超过 600 行不拆 C | expose、生成器、装配和 UI 要一起证明窗口能导入。不改 G12 上限 | 2026-11-05 | 交接，本计划采纳 |

## 不做

- B16 检测、`library.checkSource`、UI 调用 `relocate`、`shell.revealItem`
- 删除、多选、批量、行「⋯」、右键菜单、记住排序
- Markdown 笔记库、术语库、「打开文件夹…」、空态或拒绝文案里的 `.md`
- ingest、PDF.js、点行打开文档
- `packages/ui-kit`、设置场景、路由库
- 修改 DESIGN、design-principles、ARCH、PRD 正文
- #169 打磨池
- 改 CI 上限、`.github/`、`.cursor/`

## 证据链接

- `docs/evidence/<PR号>/commands.md`：实现并开 PR 后填写

## 自检

- [x] 影响 arch / prd 吗？§9 第 11 行、§5.3 的 ingest 分流、DESIGN §4.5.3 与 #166 对不上。本 PR 不改这些正文。approvals 补两行。规格变更记录不适用。
