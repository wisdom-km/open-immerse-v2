# 执行计划

分支 `feature/m2-pdfjs-reader-core-174`。基线 `origin/main` `d675f69587edfe487dcd604aa4bcfdaa559eabab`（#175 已 squash 合入；开工前 `git fetch origin main`，SHA 未动）。第一笔提交只有本文件。预计超过 300 行，按 [RULES.md](../../RULES.md) §2 先交计划。本环境按交接把计划与实现放在同一轮：计划是第一笔提交，实现是其后的提交。PR 保持 Draft，正文写 `Refs #174`，不写 Closes / Fixes。不合入，不 force push，不 rebase（N-01、N-03）。不在 issue 上评论。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

任务类型：core 改动。涉及切片：`reader`。没有 UI。本 PR 的 `packages/features/*/src/**` 只有 `reader`（G18）。

## 现状理解

- 已有行为：`packages/contracts/src/ipc/ingest.ts` 的 `ingest.openDocument` 是 `{ id }` → `{ jobId }`，`expose: false`，`idempotent: true`。`packages/contracts/src/reader.ts` 的 `ReaderSession` 含 `id` / `title` / `fileName` / `pageCount` / `currentPage` / `zoomPercent`（25–400）/ `viewMode`（`original` | `contrast` | `translation`），注释写明 ③ 临时默认 `original`，且没有路径字段。`packages/contracts/src/ipc/reader.ts` 只有 `reader.setZoom`（`id` + `level` = 25–400 或 `fit-width` / `fit-page`），`expose: false`，`idempotent: true`，没有 `reader.setPage` / `reader.setViewMode`。`library` 的 `updateProgress` 已有、无 IPC。`packages/features/ingest` 仍是空壳。lockfile 没有 `pdfjs-dist`。`packages/features/reader` 还不存在。`apps/desktop` 的 `composition-root` / `wire-ipc` 不挂 reader。
- 相关的节：[docs/arch/02.md](../arch/02.md) §2、[docs/arch/02-05.md](../arch/02-05.md) §2.5、[docs/arch/03-01.md](../arch/03-01.md) §3.1、[docs/arch/04-02.md](../arch/04-02.md) `reader` 行、[docs/arch/05-03.md](../arch/05-03.md) §5.3、[docs/arch/06.md](../arch/06.md) §6、[docs/arch/09.md](../arch/09.md) §9、[docs/arch/09-01.md](../arch/09-01.md) §9.1、[docs/prd/08.md](../prd/08.md) M2、[docs/prd/03-01.md](../prd/03-01.md) S1、[docs/prd/06-01.md](../prd/06-01.md) AC-11 / AC-01、[DESIGN.md](../../DESIGN.md) 第 156 行与 §11.3 / §12.1 / §12.2、[docs/design-principles.md](../design-principles.md) P4 / P7。
- 还没做的部分：`@oi/feature-reader` 的页码 / 缩放 / 视口纯函数、进程内按 id 记住缩放、`reader.setZoom` handlers、PDF.js 按字节打开并给出页数与页几何。阅读 UI、壳装配、`expose: true`、CSP、真机与截图、`ingest.openDocument` 接线、`openedAt` 写入都不在本 PR。

## 来源核对

| 来源 | 节 / 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 正文 | 目标 / 建议纳入 / 拆分 B | 对得上。处理：本 PR 只做 reader core + PDF.js 适配，无 UI。契约已在 #175。 |
| Issue #174 评论 | [6658166549](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658166549) | 对得上。处理：开题当时范围未批。实现以 6658666956 为准。 |
| Issue #174 评论 | [6658466174](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658466174) | 对得上双方一致项。处理：打开路径、缩放跳页、ingest 只接线、视觉 12 / B16 不进、不渲染侧栏 / Aa / 大纲 / ⋯。UI 项留给 PR-C。本 PR 只备 core 与适配。 |
| Issue #174 评论 | [6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956) | 对得上，这是范围锚。处理：1A 临时默认原文，只写在契约已有注释和本切片实现注释里，不改 DESIGN。2A / 3A 与栏位、chip、回库是 UI，属 PR-C。位置历史的 50 条上限做成纯函数，不新 IPC、不落库。 |
| Issue #174 评论 | [6660190422](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6660190422) | 对得上 PR-C。处理：本 PR 不跑真机、不附截图，PR 描述写明留给 PR-C。 |
| Issue #174 评论 | [6660689764](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6660689764) | 对得上。处理：基线就是 main@`d675f69`。本分支从这里拉出。 |
| Issue #166 正文 | 决定 7 | 对得上「ingest 等 ③ 再接」。处理：接线不在本 PR。另开 `feature/m2-ingest-open-document-174`，仍无 UI，仍 `Refs #174`。本 PR 不改 `packages/features/ingest/src/**`。 |
| Issue #28 评论 | [6634955416](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6634955416) | 对得上。处理：①→②→③，本 PR 是 ③ 的 B。 |
| [docs/approvals.md](../approvals.md) | 第 94 行（11-04 23:40） | 对得上。M2 顺序已入库。 |
| [docs/approvals.md](../approvals.md) | 第 23 行（11-04 03:21） | 对得上数值。处理：25–400、fit、历史 50 进 core 边界测试。 |
| [docs/approvals.md](../approvals.md) | （#174 21:01 行） | 对不上「必须已入库」的字面。21:01 的 1A/2A/3A 在评论 6658666956，approvals 还没有这一行。[docs/exec-plans/README.md](README.md) 写没有记在 approvals 的不算已批准。交接第 7 节第 7 条与本次任务指示禁止改 `docs/approvals.md`。处理：不补行。范围以 6658666956 为准，并在决策记录标明这条还没入库。 |
| [packages/contracts/src/ipc/ingest.ts](../../packages/contracts/src/ipc/ingest.ts) | 全文件 @`d675f69` | 对得上。处理：不改。形状保持 `{id}`→`{jobId}`，`expose: false`，`idempotent: true`。本 PR 不实现这条通道。 |
| [packages/contracts/src/reader.ts](../../packages/contracts/src/reader.ts) | 全文件 | 对得上。处理：`buildReaderSession` 只抄出这七个字段。`currentPage` 超出 `pageCount` 时夹取。没有 `path` / `originalPath` / `filePath`。 |
| [packages/contracts/src/ipc/reader.ts](../../packages/contracts/src/ipc/reader.ts) | 全文件 | 对得上。处理：只实现 `setZoom`。不新增 `setPage` / `setViewMode` 通道或 handler。 |
| [docs/arch/02.md](../arch/02.md) | 分层表 | 对得上 domain 禁止 PDF.js。对不上「适配器依赖表未列 PDF.js、只写了 ui」。处理：domain 不 import PDF.js。包装放在 `adapters/pdfjs-document.ts`（Forge 第 7 节第 2 条，优先 adapters）。G13 的 `core-no-ui` 禁止 domain / application / `index.ts` / `pure.ts` 依赖 `pdfjs-dist`，不禁止 adapters。本 PR 零阅读场景 React 组件，不建 `src/ui/**`。 |
| [docs/arch/02-05.md](../arch/02-05.md) | `reader` / `ingest` / `library` 行 | 对得上。处理：reader 的 seam 是 `pure.ts`。不建 shell SQLite 适配器，不建 `migrations/`。`openDocument` 仍归 ingest，本 PR 不接。`updateProgress` 仍无 IPC，本 PR 不调用。 |
| [docs/arch/03-01.md](../arch/03-01.md) | §3.1 | 对得上目录模板。处理：有 `package.json`、`README.md`、`src/index.ts`、`src/pure.ts`、`domain/`、`application/ports/`、`application/use-cases/`、`adapters/`、`src/testing/`、`test/core/`、`test/adapters/`。不建 `src/ui/`，不建 `migrations/`。 |
| [docs/arch/04-02.md](../arch/04-02.md) | `reader` 行 | 对得上 domain 几何，对不上本 PR 不交付的 ui 文件。处理：做 `viewport-mapping`。`pairing` / `scroll-sync` 推迟到有译文的 M4，本 PR 不建空文件。`pdf-page-canvas` / `page-virtualizer` 是画布挂载，属 PR-C。 |
| [docs/arch/04-02.md](../arch/04-02.md) | `ingest` / `open-document.ts` | 对得上「完整编排不在 ③」。处理：选第 7 节 (a)，接线另开极薄 PR。 |
| [docs/arch/05-03.md](../arch/05-03.md) | 外壳插槽 | 对得上插槽名。处理：不改 `slots.ts`，不注册 `reader.main` / `toolbar.document`。装配属 PR-C。 |
| [docs/arch/06.md](../arch/06.md) | 行数表 | 对得上。处理：源文件不超过 600，测试不超过 800，函数不超过 80（domain 纯函数按 §6 例外）。整 PR 超过 600 行时提交说明和 PR 正文写 `G12:`，不改上限。 |
| [docs/arch/09.md](../arch/09.md) | §9 | 对得上。处理：返回值与错误不含绝对路径，也不拼接 PDF.js 异常文本。`isEvalSupported: false`。不改 CSP，不写 ADR。 |
| [docs/arch/09-01.md](../arch/09-01.md) | `reader.setZoom` 行 | 对得上职责，字段名用契约的 `id`。处理：25–400 与 fit 字面量；进程内按 id 记住；只记录 PDF 原文栏的缩放，不调用 Electron zoom role。不发明 `session.save`。 |
| [docs/prd/08.md](../prd/08.md) | M2 行 | 对得上「交付含 PDF.js 阅读」。处理：真机打开 / 滚动 / 重开留给 PR-C。本 PR 用 Node 里的最小 PDF 证明页数。 |
| [docs/prd/03-01.md](../prd/03-01.md) | S1 | 对得上前半。处理：本地字节打开、PDF.js 原文页数与页几何。右栏通读不在本 PR。 |
| [docs/prd/06-01.md](../prd/06-01.md) | AC-11 | 对得上「无解析服务仍可打开」的 core 半边。处理：打开会话不调用 ingest，也不因缺少解析服务失败。降级 chip 属 PR-C。 |
| [docs/prd/06-01.md](../prd/06-01.md) | AC-01 | 对得上「打开已有 ≠ 新导入」。处理：本包不依赖 `@oi/feature-library`，没有导入入口。接线 PR 负责不走 `library.import`。 |
| [DESIGN.md](../../DESIGN.md) | 第 156 行 | 对得上默认「对照」。处理：不改正文。打开会话的 `viewMode` 取 `original`，注释指向 1A。 |
| [DESIGN.md](../../DESIGN.md) | §11.3 | 对得上 25–400 与只缩 PDF 栏。处理：core 记住缩放并写明只作用于 PDF 原文栏。菜单 role 改挂属 PR-C。 |
| [DESIGN.md](../../DESIGN.md) | §12.1 / §12.2 / UIX-16 / UIX-64 | 对得上历史 50、转到页码、‹ 与 ←→ 分开。处理：历史栈是纯函数，最多 50，重复当前页不入栈，不持久化，不新 IPC。跳页 UI、‹、菜单属 PR-C。不实现 `setPage`。 |
| [RULES.md](../../RULES.md) | §2 | 对得上。处理：一个 feature 切片；第一笔只有本计划；证据在 PR 号出来后写入 `docs/evidence/<PR号>/commands.md`。 |
| [tools/check-one-slice/check.mjs](../../tools/check-one-slice/check.mjs) | `slicesIn` | 对得上。处理：diff 里 `packages/features/*/src/**` 只有 `reader`。不带 ADR，不双切片。 |
| [packages/features/library/src/adapters/ipc-handlers.ts](../../packages/features/library/src/adapters/ipc-handlers.ts) | #169 模式 | 对得上。处理：`createReaderIpcHandlers` 可单测；`expose` 仍为 false；不挂 `wire-ipc` / `composition-root`。错误体只有 `code` 与 `retryable`，不带 `message`。 |
| [packages/features/library/src/application/use-cases/update-progress.ts](../../packages/features/library/src/application/use-cases/update-progress.ts) | 全文件 | 对得上已有 seam。处理：本 PR 不调用。README 写明成功打开后由接线 PR 调用它写 `openedAt`。不新造进度 IPC。 |
| [packages/features/ingest/README.md](../../packages/features/ingest/README.md) | 空壳说明 | 对得上。处理：不改这个目录。完整编排不在本步。 |
| 交接附件 SPEC-DRAFT.md | §2、§4 PR-B 行 | 对得上 B = reader core + PDF.js、无 UI。G18 与 ingest 接线按第 7 节 (a)，不在本 PR 双切片。 |
| 交接附件 LOOM-PRINCIPLE-CHECK.md | §1 / §5 / §6 | 对得上打开路径、不造滑块、chip、键位。处理：这些是 UI，推到 PR-C。core 支撑缩放、页码夹取和历史 50。不自造控件。 |
| 仓库外 HANDOFF-PR-A.md | 全文 | 仓库里没有这份文件。处理：契约以 main@`d675f69` 的 `packages/contracts` 为准，与交接第 0 节第 5 条一致，不重定义 IPC。 |
| 仓库外文献库 HANDOFF-PR-B.md | IPC handlers / expose / G18 | 仓库里没有这份文件。处理：对照已合入的 #169：handlers 可测、不装配、单切片。 |
| PR #169 | 正文 / ipc-handlers | 对得上。处理：同一句话：IPC handlers 可单测，契约 `expose` 仍为 false，不装配进 `wire-ipc`。 |

## 第 7 节（Forge 2026-11-05 22:40 Asia/Shanghai，按此执行，不另选）

1. 本 PR 只改 `packages/features/reader/**`，外加本计划、证据和 lockfile 里因此新增的 `pdfjs-dist`。不改 ingest 的 `src/`。不双切片。不自写 ADR。`ingest.openDocument` 接线留给 `feature/m2-ingest-open-document-174`。
2. PDF.js 不进 `domain/**`。包装在 `adapters/pdfjs-document.ts`。不建 `src/ui/**`。零阅读场景 React 组件。
3. `setZoom` 用进程内按 id 记住，记在注入的 `ReaderState` 里，不使用模块级可变状态。不发明 `session.save`。持久化推迟到已有 session seam 的后续，本 PR 不新增那条 IPC。
4. 本 PR 不调用 `updateProgress`。README 写明：成功打开后由接线 PR 调用已有 library `updateProgress`。
5. `pdfjs-dist` 钉 `6.5.438`（2026-11-05 在 npm 核实：Apache-2.0，无 runtime dependencies，optional `@napi-rs/canvas` 不 import、不渲染）。`isEvalSupported: false`。本 PR 不改 CSP。Node 测试直接对字节调用 `getDocument`，避开 `blob:` worker。若 worker 在 Node 里仍要求 `blob:` 或 wasm，记在本计划的实际列，不放宽 CSP。
6. 超 600 行写 `G12: reader 切片骨架、viewport / 页码与缩放边界、位置历史 50、PDF.js 适配、reader.setZoom handlers 与测试是同一次证明，不拆、不改 600 行上限。` 不改 CI 上限。
7. 不改 `docs/approvals.md`，不改 `DESIGN.md`。

## 计划 / 实际

计划列在开工前填。实际列在实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `f6dbc4c` 只有本文件 | 本文件 |
| 2 | `@oi/feature-reader` 骨架：`package.json`、`README.md`、`src/index.ts`、`src/pure.ts`。依赖 `@oi/contracts`、`@oi/kernel`、`pdfjs-dist@6.5.438` | `523ceea` 加上上述文件。lockfile 钉 `pdfjs-dist@6.5.438`，optional `@napi-rs/canvas@1.1.0` 被锁进 lockfile，源码不 import | `packages/features/reader/package.json` |
| 3 | domain + `pure.ts`：页码夹取、缩放 25–400、fit 视口、会话构造、位置历史 50。core 测试只 import `index.ts` / `pure.ts` / `src/testing` | `523ceea`。core 测试只走这三处 | `test/core/` |
| 4 | `PdfDocuments` 端口与 `adapters/pdfjs-document.ts`。最小 PDF 得到 `pageCount >= 1`，页几何宽度高度为正。`isEvalSupported: false` 由初始化参数函数钉死并被 open 使用 | `523ceea` 与本提交。端口的取消令牌是 `ReaderCancel`（`{ aborted: boolean }`），不写 `AbortSignal` 这个名字，因为 G14 的 lib 只有 ES2023。适配器不 import `@oi/contracts`：§5.1 没有 ADP→C。Node 的 legacy 构建把 worker 关掉（`PDFWorker.#isWorkerDisabled = true`），走 fake worker，不创建 `blob:` Worker。`6.5.438` 的 legacy 构建里没有 `isEvalSupported` 字段，也没有 `eval(` / `new Function(`。初始化参数仍带 `isEvalSupported: false`，库会忽略未知字段。最小 PDF 在 Node 里打开成功，没有为 wasm 改参数，也没有改 CSP | `test/adapters/pdfjs-document.test.ts` |
| 5 | `ReaderState` + `setZoom` 用例 + `adapters/ipc-handlers.ts`。合法 level 成功；24 / 401 为 `invalid_payload`；未打开的 id 为 `not_found`。同一 id+level 再写一次结果不变。`expose` 仍为 false | `523ceea`。`createMemoryReaderState` 在本提交去掉对 `@oi/contracts` 的 import，id 类型取自 `OpenReader["id"]` | `test/core/open-session.test.ts`、`test/adapters/ipc-handlers.test.ts` |
| 6 | `openReaderSession`：字节进、`ReaderSession` 出。默认 `viewMode: original`、`zoomPercent: 100`、`currentPage: 1`。不调用 library / ingest。不把绝对路径放进会话 | `523ceea`。不依赖 `@oi/feature-library`，不调用 `updateProgress` | `test/core/open-session.test.ts` |
| 7 | `docs/evidence/<PR号>/commands.md`。`GATE_BASE=origin/main corepack pnpm run check` 与 `corepack pnpm test` | 全量跑在 `43a1683`，check 与 test 退出码都是 0。证据是 `docs/evidence/176/commands.md` | `docs/evidence/176/commands.md` |

## 行为

### 包

`@oi/feature-reader`。`src/index.ts` 只转出用例工厂、handlers 工厂、失败类型和端口类型。`src/pure.ts` 只转出 domain 纯函数。不导出 React。不建 `migrations/`。README 写明 `openedAt` 由接线 PR 调用已有 `updateProgress`。

`feature-edges` 里 `reader: []`。本包不依赖其他 feature，因此不能 import `@oi/feature-library`。跨切片编排留在接线 PR（ingest / main），不在 reader 里调用 library 或 ingest。

### 页码与缩放

- `clampPage(page, pageCount)`：结果落在 `[1, pageCount]`。`pageCount < 1` 时没有合法页。
- `parseZoomPercent`：只有 25–400 的整数通过。24、401、非整数失败。
- `fit-width`：`containerWidth / pageWidth`。`fit-page`：宽高比里更小的那个。百分数 `Math.round(scale * 100)` 后再夹到 25–400。100 表示 scale 1（PDF 点与 CSS 像素 1:1，对齐 PDF.js `getViewport({ scale: 1 })`）。
- 只描述 PDF 原文栏。本模块不调用 `webFrame` 或 Electron 的 zoom role。

### 会话

`buildReaderSession` 逐字段拷贝，不展开入参。输出键只有契约那七个。`currentPage` 先夹取。`pageCount < 1` 或缩放不在 25–400 时返回失败。打开用例把 `viewMode` 设为 `original`（③ 临时默认；DESIGN 第 156 行仍是「对照」）。已记住的数值缩放在同一进程再次打开时保留；fit 字面量保留在状态里，会话上的 `zoomPercent` 仍是上次的数值，直到调用方用容器尺寸做 `resolveZoomPercent`。

### 位置历史

纯函数，最多 50 条后退。`recordJump` 到与当前相同的页时栈不变（普通滚动不入栈）。后退为空时 `goBack` 不变。不持久化，不进 SQLite，不新 IPC。不实现 `reader.setPage`。

### 打开与 PDF.js

端口接受字节和 `ReaderCancel`（`{ aborted: boolean }`），不接受路径，也不返回路径。不写 `AbortSignal` 这个名字：G14 的 lib 只有 ES2023，这个名字会让 `typecheck:core` 失败。真实的 `AbortSignal` 结构上满足该类型。它不出现在 `index.ts` 的用例入参上；用例内部传一个未取消的令牌。字节不是 `%PDF-` 开头则 `not_pdf`，不把解析库的异常文本传出。成功给出 `pageCount` 与首页宽高。`readPage` 按页返回几何（宽高），不返回画布。画布挂载属 PR-C。

初始化参数由 `pdfjsInitParameters` 集中构造，`isEvalSupported` 恒为 `false`。Node 侧加载，不改 `apps/desktop` 的 CSP。

### setZoom

进程内 `ReaderState` 按 `LibraryEntryId` 记住。未打开或不合法的 id 是 `not_found`。24 与 401 在 handler 映射为 `invalid_payload`。同一 id 与 level 再写一次，记住的值不变，返回同一 `level`（含 `fit-width` / `fit-page` 字面量）。handler 的失败体没有 `message`。不挂 `wire-ipc`。

### 依赖

`pdfjs-dist@6.5.438`，Apache-2.0。用途是读页数和页几何。体积：npm `dist.unpackedSize` 37616588（约 36 MiB，2026-11-05）。替代方案是自写 PDF 解析，不采用，规格指定 PDF.js。不复制 PDF.js 源码进仓库。不引入 GPL / AGPL。代码不 import `@napi-rs/canvas`。

## 测试映射

| 验收 | 观察 |
| --- | --- |
| AC-11 的打开半边 | 假 PDF 端口返回页数时会话成功；用例依赖里没有 ingest |
| AC-01 | 包依赖不含 `@oi/feature-library`；打开入参是字节与 id，不是导入 |
| §9 / 会话 | 成功与失败结果上没有 `path` / `originalPath` / `filePath`；错误字符串不含绝对路径 |
| §11.3 / 03:21 | 24 与 401 失败；25 与 400 成功；fit 计算夹在 25–400 |
| 历史 50 | 第 51 次跳转丢掉最旧的一条；重复当前页不入栈 |
| PDF.js | 最小 PDF 的 `pageCount >= 1`；首页宽高为正；`pdfjsInitParameters` 的 `isEvalSupported` 为 false |
| setZoom | 未打开 id → `not_found`；24 / 401 → `invalid_payload`；同一 level 两次结果相等；`setZoom.expose` 仍为 false；handlers 只有 `setZoom` |
| 1A | 打开后的 `viewMode` 是 `original` |

用例名用 `<结果> when <条件>`。对得上 AC 的用例名以编号开头。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| M2 顺序 ①→②→③，最后做 PDF.js 阅读 | 原文：「那就按照你的这个建议吧，先做SQL Lite的加文件存储，再做导入和文献库，最后做PDF.js阅读」。已在 approvals 第 94 行。来源：https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6634955416 | 2026-11-04 23:40 | Wisdom |
| 缩放 25–400%、fit、历史 50 不持久化 | 原文：「快捷键和数值全部按提议批准」。已在 approvals 第 23 行 | 2026-11-04 03:21 | Wisdom |
| 1A / 2A / 3A 与双方一致的 ③ 范围 | 原文三条均为 A。1A：「1A ³默认原文（临时）。…」来源：https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956 。approvals.md 还没有这一行。交接第 7 节第 7 条禁止本 PR 补记 | 2026-11-05 21:01 | Wisdom |
| 第 7 节七条 | 接线另开薄 PR；PDF.js 放 adapters；进程内记缩放；不调用 updateProgress；pdfjs-dist 走 G10 且不改 CSP；G12 不改上限；不改 approvals 与 DESIGN。交接写明不要另选 | 2026-11-05 22:40 | Forge 排序，非业主决定 |
| 打开会话放在 reader，接线不放 | 会话构造是 reader 的纯数据。`ingest.openDocument` 与 `updateProgress` 会碰第二个切片，违反 G18。`reader` 的依赖矩阵是空，不能 import library | 2026-11-05 | 本计划，按第 7 节 (a) |
| `pairing` / `scroll-sync` 推迟 | ③ 没有译文。不建空文件冒充 §4.2 的文件名 | 2026-11-05 | 本计划 |
| 位置历史只做纯函数 | 03:21 的 50 要有 core 测试。不持久化、不新 IPC，对齐 DESIGN §12.1 与契约注释 | 2026-11-05 | 本计划 |
| 不改 CSP，不写 ADR | 第 7 节第 5 条。Node 测试不走浏览器 worker | 2026-11-05 | Forge 排序，非业主决定 |

## 证据链接

- `docs/evidence/176/commands.md`

## 自检

- [x] 影响 arch / prd 吗？不改 arch / prd / DESIGN / approvals。规格变更记录不适用。适配器曾直接 import `@oi/contracts`，§5.1 没有 ADP→C，已改成只依赖 application 端口。
