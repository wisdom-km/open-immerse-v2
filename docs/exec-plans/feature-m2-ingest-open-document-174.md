# 执行计划

分支 `feature/m2-ingest-open-document-174`。基线 `origin/main` `208056585d0891ad7ab2c1309527074b34a1c0a1`（#177 文档 squash；parent `d8113a1e98c41aaf37258c7f3cf00bd6c64d5a59` = #176）。开工前 `git fetch origin main`，SHA 未动。`d8113a1...2080565` 只改 7 个文档 / manifest 文件，没有改 `packages/`、`apps/`、`tools/check-*`。第一笔提交只有本文件。预计实现超过 300 行的阅读成本，按 [RULES.md](../../RULES.md) §2 先交计划。

首笔 `028ee5ad6cbec94aa4c24f1cc699c859d785749e` 只有本文件。修订 `adf0cbc882dd226824b456586214f6c6946966a7` 仍只改本文件。Forge 最终计划审查 PASS（[#174 评论 6719786094](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719786094)，2026-11-08 17:24）。据 Wisdom 17:17 的既定实现与测试授权（[#174 评论 6719728190](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719728190)），本分支接着做步骤 2–6。不开 Ready，不合入，不在 issue 上评论。PR 只开 Draft，正文写 `Refs #174`，不写 Closes / Fixes。#174 保持 OPEN。不 force push，不 amend 已推送提交，不同步时用 merge，不用 rebase（N-01、N-03）。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

任务类型：core 改动。涉及切片：`ingest`。没有 UI。实现阶段的 `packages/features/*/src/**` 只有 `ingest`（G18）。

## 现状理解

- 已有行为：`packages/contracts/src/ipc/ingest.ts` 的 `ingest.openDocument` 已是 `{ id }` → `{ jobId }`，`expose: false`，`idempotent: true`，错误是 `not_found` 加传输码，没有 `not_pdf`，没有路径字段。`@oi/feature-library` 已从桶导出 `createUpdateProgress`、`LibraryRepository`、`formatUtc`。`updateProgress` 无 IPC。`PdfFileStore` 只有 `inspect` / `placeCopy` / `removeCopy`。`@oi/feature-reader` 的桶导出 `createOpenReaderSession`，不导出 `createPdfjsDocuments`（只在 `src/adapters/pdfjs-document.ts`）。`packages/features/ingest` 仍是空壳（`index.ts` / `pure.ts` 为 `export {}`）。`library-main.ts` 注入的 `openDocument` 是空函数。`@oi/feature-jobs` 只有 `parseJobId` / `sameJobId`。`apps/desktop` 不挂 ingest。
- 相关的节：[docs/arch/02-05.md](../arch/02-05.md) §2.5、[docs/arch/03-01.md](../arch/03-01.md) §3.1、[docs/arch/04-02.md](../arch/04-02.md) `ingest` 行、[docs/arch/04-03.md](../arch/04-03.md) 与 [docs/adr/0002-ingest-edges.md](../adr/0002-ingest-edges.md)、[docs/arch/06.md](../arch/06.md) §6、[docs/arch/09.md](../arch/09.md) §9、[docs/prd/08.md](../prd/08.md) M2、[docs/prd/03-01.md](../prd/03-01.md) S1、[docs/prd/06-01.md](../prd/06-01.md) AC-11 / AC-01、[DESIGN.md](../../DESIGN.md) 第 156 行、[docs/design-principles.md](../design-principles.md) P7。
- 还没做的部分：`ingest.openDocument` 的用例与 handlers，以及成功后经已有 `updateProgress` 写 `openedAt`。阅读 UI、壳装配、`expose: true`、PDF.js 会话、解析流水线、真机与截图都不在本 PR。

## 来源核对

2026-11-08 用 `gh` 重读了 #174 正文与全部 20 条评论、#175 / #176 正文与评论，并对照 main 上的源码。下表「处理」是本计划的做法。

| 来源 | 节 / 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 正文 | 建议纳入 7–8 | 对得上。第 7 条是接线 `ingest.openDocument`，无解析服务仍能打开并浏览原文，不实现流水线。第 8 条是经已有 library 进度 seam 更新 `openedAt`。处理：本 PR 做这两条的 core 半边。浏览原文、阅读场景属 PR-C。 |
| Issue #174 正文 | 拆分 | 对得上 A / B / C。正文的三拆里没有单独的接线 PR。处理：接线是 Forge 在 A/B 之后、C 之前加的薄 PR，见 6660829088。不并入 PR-C。 |
| Issue #174 评论 | [6658166549](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658166549) | 对得上。开题原话是「那请你继续往下推进吧，按照项目进度。」当时写明实现范围尚未批准。处理：实现以 6658666956 为准。 |
| Issue #174 评论 | [6658466174](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658466174) | 对得上双方一致项第 6 条：ingest 只接线；视觉 12 / B16 不进 ③。处理：本 PR 只接线。视觉 12 与 B16 不进。 |
| Issue #174 评论 | [6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956) | 对得上，这是整体 ③ 的范围锚。Wisdom 原话三条均为 A，并写明选 A/A/A 即同时批准双方已一致的范围。处理：1A / 2A / 3A 的界面行为属 PR-C。本 PR 无 UI，不改 DESIGN。临时默认原文已经在 reader 契约里，本 PR 不碰 `viewMode`。 |
| Issue #174 评论 | [6660190422](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6660190422) | 对得上 PR-C。原话：「ok，然后需要真机实测的都要真机实测。并且附上对应的截图。」评论自己写明真机项落在有阅读界面之后，不落在契约 PR。处理：本 PR 无窗口，不安排真机，不附截图，不因缺截图判失败。Box 不能代替 PR-C 的真机。 |
| Issue #174 评论 | [6660829088](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6660829088) | 对得上，这是本 PR 的形状锚。Forge 选定 G18 (a)：接线另开极薄 `feature/m2-ingest-open-document-174`，不并入 PR-C，不双切片。处理：按 (a) 写本计划。 |
| Issue #174 评论 | [6663212147](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6663212147) | 对得上。#176 已合入 main@`d8113a1`，下一步就是本接线 PR，然后才是 PR-C。处理：基线已前进到 `2080565`，代码相对 `d8113a1` 未变，顺序不变。 |
| Issue #174 评论 | [6719581822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719581822) | 对得上本次授权。Wisdom 原话：「请你按照项目进度继续推进吧」。评论写明不新增功能、不改 A/A/A；下一 Cloud 先交 exec-plan 并暂停等 Forge；只做 ingest；`expose: false`；不引入 reader / PDF.js；不改 reader / library src 与 desktop 装配；会话语义若冲突就停在计划阶段；Cloud / Forge 只做针对性验证，全量由 Anvil 在同一 tip 跑一次；无合入、无发版授权。处理：首笔只含本文件。本修订仍停在计划。 |
| Issue #174 评论 | [6719728190](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719728190) | 对得上。Wisdom 17:17 原话：「对，因为之前我说暂停了嘛，然后现在咱重新开始，就是说PR该跑完的时候该测试测试，然后该有对应的bot你就找对应的bot。」这是恢复既定实现、测试和按职责找 bot，不含合入或发版，也不新增功能。同一条里 Forge 对 `028ee5a` 的技术决定是有条件通过、先改计划：页码写回已读到的 `progressPage`；进度 `not_found` 保持 `not_found`；同实例复用已分配 `jobId`；README 写明重启不保证同一个 `jobId`。处理：本修订按这四条改计划。approvals 没有 17:17 这一行，不补。 |
| Issue #174 其余评论 | 6659026476、6659299137、6660379377、6660661577、6660689764、6660721331、6661642334、6662316295、6662458654、6662648557、6663158830、6663262060、6663371485 | 对得上进度，不另扩范围。6661642334 是 #174 上的 #176 状态短评，不是 N4 正文。6663371485 已写明默认实现是查库 + 幂等 `jobId` + 写 `openedAt`，并写明若认为没有 reader 会话就不算打开成功，要停在计划里。处理：见下文「三处张力」。N4 正文在 PR #176 评论 6661641239。 |
| PR #177 | main@`2080565` | 对得上。`git diff --stat d8113a1 origin/main` 只有 `docs/approvals.md`、`docs/arch/03.md`、`docs/arch/12-01.md`、`docs/evidence/177/`、本目录的日检计划、`docs/spec-changelog.md`、`tools/compare-spec-bytes/manifest.json`。[docs/arch/03.md](../arch/03.md) 写 `library/`、`reader/` 已建，reader 没有阅读界面。处理：不改这些行。 |
| Issue #166 正文 | 决定 7 | 对得上。正文第 7 条是「ingest 等③ PDF.js 再接」。不做清单里也有「ingest 接入」。`import-pdf.ts` 注释写明本用例不调用注入的 `openDocument`。处理：本 PR 执行「只接线」，不改 `library` 的导入用例，也不把导入成功改成自动打开。 |
| PR #175 正文 | openDocument 契约 / openedAt | 对得上。请求 `{ id }`（64 位小写 hex 的 `LibraryEntryId`），响应 `{ jobId }`（`ids.ts` 的 `JobId` 无长度与字符集），`expose: false`，`idempotent: true`，错误是共用传输码加 `not_found`。正文写 openedAt 走已有 core seam，不新造进度 IPC。处理：实现该描述符，不改契约文件。 |
| PR #176 正文 | openedAt 留给接线 PR | 对得上。正文写成功打开后的 `openedAt` 不在 reader 包写入，由本分支调用已有 `updateProgress`，reader 不依赖 `@oi/feature-library`。处理：本 PR 调用 `updateProgress`。不改 reader `src/`。 |
| PR #176 评论 | [6661641239](https://github.com/wisdom-km/open-immerse-v2/pull/176#issuecomment-6661641239) N4 | 对得上源码。N4 原文：`createPdfjsDocuments` 不从 `index.ts` 转出；接线 PR / C 需要注入该工厂时，走 adapters 深路径或再加一条不含 UI 的导出，不要从 `pure.ts` 转出。main 上该函数只在 `adapters/pdfjs-document.ts`，`index.ts` 与 `pure.ts` 都没有它。处理：本 PR 不消费它。深路径仍然是对 `@oi/feature-reader` 的依赖，矩阵没有这条边，所以不把 N4 读成可以加边。 |
| PR #176 评论 | 6661641239 N3 | 对得上。N3：`pdfjs-dist` 把 optional `@napi-rs/canvas` 锁进 lockfile，源码没有 import，接线 / PR-C 不要主动 import。处理：本 PR 不加 `pdfjs-dist`，不 import `@napi-rs/canvas`。 |
| [docs/approvals.md](../approvals.md) | 第 94 行（11-04 23:40） | 对得上。原文含「最后做PDF.js阅读」，M2 顺序是 ①→②→③。处理：不编辑该文件。 |
| [docs/approvals.md](../approvals.md) | 第 23 行（11-04 03:21） | 对得上数值批准（「快捷键和数值全部按提议批准」）。处理：缩放与历史不在本接线里，不改 approvals。 |
| [docs/approvals.md](../approvals.md) | 文末 | 对不上「21:01 / 22:13 / 11-08 17:02 / 11-08 17:17 已入库」。文末是「共 107 条批准」，最新一行是 2026-11-06 18:30。这几句只在 #174 评论里。处理：不补行。范围以那些评论为准。6719728190 里的页码写回是 Forge 技术修正，不是新的用户批准。 |
| [docs/arch/02-05.md](../arch/02-05.md) | `ingest` / `library` 行 | 对得上。`openDocument` 是打开 PDF 的唯一用户入口。`updateProgress` 无 IPC。ingest 的 UI 列是「无（进度由 reader 经 `jobs` 事件显示）」。处理：本 PR 返回 `jobId`，不发 jobs 事件，不建阅读进度 UI。 |
| [docs/arch/04-02.md](../arch/04-02.md) | `ingest` / `open-document.ts` | 对得上终局职责，对不上「本 PR 就要做完三件事」。该行写 `open-document.ts` 只做三件事：取当前路线、循环 `ingest-policy`、调对应切片的 `index.ts`；`ing_route` 缺失时不提交作业。处理：本 PR 的同名文件只做接线子集。不建 `ingest-policy`、`route-store`、`resume-ingest`。返回的 `jobId` 不向 worker 提交解析，因此不读 `ing_route`。 |
| [docs/arch/04-03.md](../arch/04-03.md) + ADR 0002 | ingest 九条出边 | 对得上。允许 `library`、`parsing`、`document`、`quality`、`formula`、`formula-source`、`repair`、`translation`、`jobs`。`reader` 不在图中。新增边要 ADR。处理：只依赖 `library`。不改矩阵，不写 ADR。 |
| [tools/check-deps/feature-edges.mjs](../../tools/check-deps/feature-edges.mjs) | `ingest` 数组 | 对得上 ADR 0002，数组里没有 `reader`。处理：不改这个文件。 |
| [docs/arch/09.md](../arch/09.md) | §9 | 对得上。长任务返回 `jobId`；返回给 renderer 的数据不含绝对路径；打开阅读走 `ingest.openDocument`。同节「M2 ② 不接 ingest」指的是文献库导入不经 ingest，已由 #166 决定 7 落地。处理：③ 的这条通道现在接线，`expose` 仍为 false。错误与返回值不带绝对路径，也不转发 library 失败对象上的 `message`。 |
| [docs/prd/08.md](../prd/08.md) | M2 行 | 对得上里程碑全文：PDF.js 阅读，以及真机打开 / 滚动 / 重开录屏。处理：那些退出条件是整段 M2 / ③ 的，本 PR 不证明。真机留给 PR-C。 |
| [docs/prd/03-01.md](../prd/03-01.md) | S1 | 对得上「本地打开 PDF」这一句的入口归属。右栏中文通读在同一格，不在 ③。处理：本 PR 不打开字节，不浏览页面。 |
| [docs/prd/06-01.md](../prd/06-01.md) | AC-11 | 对得上「未配置任何解析服务时，可打开 PDF、浏览原文……」。契约注释把「浏览原文仍须成功」写成形状约束，并写明这里不实现解析流水线。处理：本步不调用解析服务，也不因缺少解析服务失败。浏览原文、文字层、笔记、任务摘要 chip 属 PR-C 与已有 reader 包。 |
| [docs/prd/06-01.md](../prd/06-01.md) | AC-01 | 对得上。同一 SHA-256 第二次导入不创建新文献、不触发新解析。处理：本通道不是 `library.import`。重复打开返回同一个 `jobId`，不另开解析作业。 |
| [DESIGN.md](../../DESIGN.md) | 第 156 行 | 对得上。关键路径第 2 条仍是默认「对照」栏位。处理：不改正文。本 PR 不设置栏位。 |
| [docs/design-principles.md](../design-principles.md) | P7 | 对得上。规则在 core，UI 不写库。处理：`openedAt` 由 ingest 用例调用 library seam。不改该文件（N-10）。 |
| [RULES.md](../../RULES.md) | §2 | 对得上。超过 300 行或需要先对齐来源时，第一笔是执行计划；一个 PR 一个切片；G12 超限写理由、不改上限。处理：本文件是第一笔。实现若超过 600 行非生成代码，提交说明与 PR 正文写 `G12:`。 |
| [tools/check-one-slice/check.mjs](../../tools/check-one-slice/check.mjs) | `slicesIn` | 对得上。只统计 `packages/features/<切片>/src/`。处理：实现 diff 里这条前缀只有 `ingest`。测试、README、`package.json`、lockfile、本计划、证据不计成第二个切片。 |
| [packages/contracts/src/ipc/ingest.ts](../../packages/contracts/src/ipc/ingest.ts) | 全文件 @`2080565` | 对得上。`channel` 是 `ingest.openDocument`，请求只有 `id`，响应只有 `jobId`，`idempotent: true`，`expose: false`，`errors` 以 `not_found` 开头再加 `ipcTransportErrors`。处理：handlers 返回这个形状。不改文件。 |
| [packages/features/library/src/application/use-cases/update-progress.ts](../../packages/features/library/src/application/use-cases/update-progress.ts) | 全文件 | 对得上输入形状，对不上原交接「传 `page: null` 等于不更新页码」。`UpdateProgressInput.page` 会原样进 `repository.updateProgress` 的 `progressPage`。[sqlite-library-repository.ts](../../packages/features/library/src/adapters/sqlite-library-repository.ts) 的 `UPDATE` 同时写 `opened_at` 与 `progress_page`。传入 `null` 会把已存页码覆盖成 NULL。`parseProgressPage(null)` 返回 `null`，所以这不是拒绝，而是清空。`LibraryEntry` 不含 `progressPage`。处理：ingest 把本次 `findById` 得到的 `record.progressPage` 传回去。`null` 仍是 `null`，非空整数原样保留。不改 library 接口。不新增恢复页码 UI。 |
| [packages/features/library/src/application/ports/pdf-file-store.ts](../../packages/features/library/src/application/ports/pdf-file-store.ts) | 端口 | 对得上。没有按 id 读出已入库字节的方法。处理：本 PR 不改这个端口，也不在 ingest 里读 PDF 字节。 |
| [packages/features/reader/src/index.ts](../../packages/features/reader/src/index.ts) | 导出列表 | 对得上。有 `createOpenReaderSession`。没有 `createPdfjsDocuments`。处理：不 import 这个包。 |
| [packages/features/reader/src/pure.ts](../../packages/features/reader/src/pure.ts) | 导出列表 | 对得上 N4。没有 PDF.js 工厂。处理：不从这里转出，也不从这里消费。 |
| [packages/features/reader/README.md](../../packages/features/reader/README.md) | openedAt / 接线 PR | 对得上。写明接线 PR 在打开成功后调用 `updateProgress`，本包不调用 `ingest.openDocument`。处理：由本 PR 履行那句。 |
| [packages/features/ingest/README.md](../../packages/features/ingest/README.md) | 空壳 | 对得上。现在写的是 M1 空切片，§4.2 编排不在这里。处理：改成「本步只接线 openDocument 与 openedAt；完整编排属后续里程碑」。 |
| [packages/features/library/src/adapters/library-main.ts](../../packages/features/library/src/adapters/library-main.ts) | openDocument stub | 对得上。第 96–98 行是空的 `openDocument()`。处理：不改。导入仍然不会调用本 PR 的用例。装配留给以后的壳 PR。 |
| 仓库外 SPEC-DRAFT | §2 第 7–8 条、§4、G18 句 | 对得上「只接线」和「成功打开后更新 openedAt，走已有 library seam」。§2 第 8 条写「以及若规格要求则更新 progress_page」。本步没有新的页码可写，但 seam 的每次成功调用都会写 `progress_page`。§4 写接线「单独成 PR 或并入不碰 UI 的那一个」。处理：`page` 用已读到的 `progressPage`，避免把规格里的「若要求则更新」做成清空。G18 以 Forge (a) 为准，单独成 PR，不并入 PR-C。 |
| 仓库外 LOOM-PRINCIPLE-CHECK | §1 写 openedAt、§5 第 12 条 | 对得上。分类表把写 `openedAt` 放在 core，经 library seam，UI 不写库。§5 第 12 条是写入后「最近」出现该篇。§5 第 5 条的滚动与 chip 是阅读界面。处理：core 测试用已有 `createListLibrary({ view: "recent" })` 看见该 id。chip 与滚动不在本 PR。 |
| 仓库外 HANDOFF-PR-B | §7 锁定 (a) 与第 4 条 | 对得上。22:40 选定接线另开；reader PR 不调用 `updateProgress`，openedAt 由接线 PR 写。处理：本计划就是那个接线 PR 的计划。 |
| 仓库外 HANDOFF-PR-A | 契约形状 | 对得上，且已经落在 main 的 `ipc/ingest.ts`。交接当时还把 `idempotent` 写成待选。处理：以已合契约为准，`idempotent: true`。不重定义 IPC。 |

## 三处张力

这三处都核对过。它们不构成必须改 reader、library、contracts 或依赖矩阵的硬冲突。本计划把行为钉死在下面，不选 (ii) / (iii)。Forge 若否决，用同一组选项另指示，实现阶段再改。

### 会话语义

契约成功值只有 `{ jobId }`。ADR 0002 与 `feature-edges.mjs` 没有 `ingest → reader`。`PdfFileStore` 不能按 id 读字节。`createOpenReaderSession` 要的是字节、标题和文件名。因此本 PR 里「打开成功」是：id 能解析，查库命中，并且这次 `updateProgress` 返回 ok。查库命中不代替写成功。不创建 `ReaderSession`，不调用 PDF.js。

AC-11 的「浏览原文」和 DESIGN 的「进入阅读场景」由 PR-C 用已有 reader 包完成。本 PR 不把它们算进自己的完成条件。

否决时的选项（本计划不选后两个）：

1. 保持本计划：查库 + 幂等 `jobId` + `updateProgress`。
2. ingest 定义一个不点名 reader 包的端口，本 PR 用 fake 测；真实的 `createOpenReaderSession` 与 `createPdfjsDocuments` 留到 PR-C 在装配根注入。仍不改 reader `src/`，不加 ADR 边。要读字节仍须另有端口，本选项单独不够打开 PDF。
3. 申请 `ingest → reader` ADR，并可能给 library 加按 id 读字节。超出本交接授权，不在本分支做。

### openedAt 与页码

成功返回之前调用已有 `createUpdateProgress`。`openedAt` 来自注入的 `Clock.nowMs()`，经 library 桶上的 `formatUtc`，形状与 `"2026-02-02T00:00:00.000Z"` 相同。`page` 用这次查库已经拿到的 `progressPage`：原来是 `null` 就仍传 `null`，原来是正整数就原样传回。

出处：交接初稿写「传 `page: null`」，把那理解成不更新页码。Forge 审查 `028ee5a` 后改为写回已读页码（[#174 评论 6719728190](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719728190)）。这是纠正交接假设，不是 Wisdom 新加的要求，也不记进 `docs/approvals.md`。

查库未命中、查库失败、时间戳不被 `formatUtc` 接受时，不调用 `updateProgress`。查库命中只说明写之前有这条记录，不保证写的时候还在。`updateProgress` 再返回 `not_found` 时，用例就是 `not_found`。同一 id 再次成功打开时再写一次 `openedAt`，页码仍用当时查到的 `progressPage`；`jobId` 不变。不改 library 接口，不做恢复页码的界面。

否决时才改：若必须等 PDF 会话成功才写 `openedAt`，本 PR 没有字节也没有 reader 边，写不到那个时点。那会变成选项 2 或推到 PR-C，并与「本 PR 必须写 openedAt」相反。本计划不这么做。

### 幂等、并发与失败

契约注释：同一 id 再次打开，返回进行中或最近一次的 `jobId`，不另开解析作业。jobs 状态机还没有，没有「进行中 / 已完成」可查。本计划钉死「最近一次」：同一记忆实例里，一个 id 只有一个 `jobId`。

记忆放在注入对象里，用工厂创建。不写顶层 `let`，不做模块级单例（F-06）。library 的 `findById` 与 `updateProgress` 都是同步 `Result`。用例保持同步，同一次调用栈里不会交错出两个 `jobId`。不把用例改成 async 去等 PDF。

顺序：

1. id 不是 64 位小写 hex：`not_found`。不记 `jobId`，不写进度。与 `updateProgress` 对坏 id 的归类一致。
2. 查库失败或没有记录：不记 `jobId`，不写进度。没有记录是 `not_found`。查库的其他失败是用例的 `rejected`。
3. `formatUtc` 不接受这次时钟：用例 `rejected`。不写进度。还没有 `jobId` 的不新分配；已经记下的留着。
4. 该 id 已有 `jobId`：不调用 id 工厂。再写进度，`page` 用这次查到的 `progressPage`。写成功才返回 `{ jobId }`。
5. 该 id 还没有 `jobId`：先记住新 id，再写进度。第一次写失败也留下这个 `jobId`。下次仍用它，不另开第二个。

写进度的返回这样进用例：`not_found` 就是用例的 `not_found`；其余失败是用例的 `rejected`。handler 把用例 `not_found` 映射为 `{ code: "not_found", retryable: false }`，把用例 `rejected` 映射为 `{ code: "handler_threw", retryable: true }`。错误体没有 `message`，也没有绝对路径。不新增契约错误码。查库命中之后进度仍可能 `not_found`，测试要覆盖这条，不能只测写之前缺记录。

两个工厂实例互不共享记忆。重启进程或再 `create` 一份记忆，不保证还是同一个 `jobId`。README 写明幂等只在同一实例上，并且本步没有持久化的 jobs 状态机。这与 reader 的 `ReaderState` 相同。

## 第 7 节（按交接锁定，不另选）

1. 切片只有 `ingest`。不改 `reader`、`library`、`contracts`、`apps/desktop` 的 `src/`。
2. 成功打开后调用已有 `createUpdateProgress`。`page` 是本次 `findById` 的 `progressPage`（`null` 仍 `null`，非空原样保留）。不新造进度 IPC，不改 library 接口。
3. 不 import `@oi/feature-reader`，不 import `pdfjs-dist`，不调用 `createOpenReaderSession` / `createPdfjsDocuments`。
4. 不并入 PR-C，不写双切片 ADR。
5. `expose` 保持 `false`。不挂 `wire-ipc` / `composition-root`。
6. 不改 `docs/approvals.md`、`DESIGN.md`、`docs/design-principles.md`。
7. 真机与截图属 PR-C。以后的 PR 描述写明本 PR 无窗口、不附截图。
8. 超过 600 行非生成代码时写 `G12:`，不改 CI 上限。按本计划的文件拆分，预期不会越过 600。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 最终审查 PASS 之后填写。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它。推送后暂停 | `028ee5a` 计划，`adf0cbc` 修订。Forge 最终审查 PASS：[6719786094](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719786094)（2026-11-08 17:24） | 本文件 |
| 2 | 更新 `packages/features/ingest/package.json`：加上 `@oi/contracts`、`@oi/kernel`、`@oi/feature-library`，都是 `workspace:*`。不加 `pdfjs-dist`、`@oi/feature-reader`、`@oi/feature-jobs`。用包管理器生成 lockfile，不手改 | 三个 workspace 依赖已加。lockfile 由 pnpm 生成。Vitest 与 `tools/check-deps/tsconfig.paths.json` 把 `@oi/feature-library` 指到 `src/index.ts`，与 kernel、contracts 的源码别名相同。没有改依赖矩阵，也没有改门禁阈值 | `packages/features/ingest/package.json`、`pnpm-lock.yaml` |
| 3 | 端口、`open-document` 用例、`src/testing` 假件、`test/core`。覆盖 openedAt、幂等、写前 not_found、写回 `progressPage` 为 null 与非空、进度写返回 not_found / rejected 时复用已分配 `jobId` | 已做。另覆盖 `formatUtc(9e15)` 的 RangeError：用例 `rejected`，不写进度，不泄漏路径。没有改 library | `packages/features/ingest/test/core/open-document.test.ts` |
| 4 | `adapters/ipc-handlers.ts`、进程内记忆适配器、adapter 测试。`expose` 仍为 false。进度 `not_found` 与 `rejected` 的映射按上文。返回值与错误无绝对路径、无 `message` | 已做。写时 `not_found` 后重试仍用第一次的 `jobId` | `packages/features/ingest/test/adapters/` |
| 5 | 更新 README：同实例幂等，重启或新建实例不保证同一个 `jobId`，没有持久化 jobs。跑下面「测试分工」里的针对性命令。写 `docs/evidence/<PR号>/commands.md`。全量留给 Anvil | README 已写。针对性命令的退出码在证据里。全量 `pnpm test` / `pnpm run check` / pytest / e2e 未跑 | [docs/evidence/178/commands.md](../evidence/178/commands.md) |
| 6 | Draft PR：`Refs #174`。来源核对、第 7 节选择、真机与截图属 PR-C。不评论 issue，不标 Ready，不合入 | Draft PR：https://github.com/wisdom-km/open-immerse-v2/pull/178 。正文 `Refs #174`。不评论 issue，不标 Ready，不合入 | [docs/evidence/178/commands.md](../evidence/178/commands.md) |

## 行为

### 包

`@oi/feature-ingest`。`src/index.ts` 转出 `createOpenDocument`、失败类型、端口类型、`createIngestIpcHandlers`。`src/pure.ts` 继续 `export {}`。不导出 React。不建 `src/ui/`、`migrations/`。进程内记忆工厂放在 `adapters/`，不从桶转出，与 reader 不从桶转出 `createMemoryReaderState` 相同。

依赖只有三个 workspace 包。`formatUtc`、`createUpdateProgress`、`createListLibrary`、`LibraryRepository` 的类型从 `@oi/feature-library` 的桶导入。不深导入 `src/testing` 或 adapters。ingest 自己的假仓库放在 `src/testing/`，实现查库端口；core 测试把真实的 `createUpdateProgress` 接上去，再用真实的 `createListLibrary({ view: "recent" })` 看 id。

### 文件

按 §3.1 放，一个端口一个文件，一个用例一个文件。不建 `utils.ts`。不建空的 `ingest-policy.ts` 来冒充 §4.2 的终局文件。

| 路径 | 职责 |
| --- | --- |
| `src/domain/open-failure.ts` | 用例错误，只有 `not_found` 与 `rejected`，不带 `message` |
| `src/application/ports/library-lookup.ts` | 按 id 查记录。命中时交出 `progressPage`，不交出 `originalPath` |
| `src/application/ports/openings.ts` | 记住 id 到 `jobId` |
| `src/application/ports/job-ids.ts` | 分配 `JobId` |
| `src/application/use-cases/open-document.ts` | 上面钉死的顺序 |
| `src/application/ingest-ipc.ts` | handler 依赖与 `IngestCommands["openDocument"]` |
| `src/adapters/memory-openings.ts` | 进程内记忆 |
| `src/adapters/ipc-handlers.ts` | 只做映射 |
| `src/testing/` | core 用的假查库、假记忆、固定 `jobId`、可控时钟 |
| `test/core/open-document.test.ts` | 经 `index.ts` / `pure.ts` / `testing` |
| `test/adapters/ipc-handlers.test.ts` | handler 与 `expose` |
| `test/adapters/memory-openings.test.ts` | 同一实例记住第一次 |

现有 `test/core/index.test.ts` 改为：`pure.ts` 仍然没有导出；`index.ts` 导出本步的工厂。不再断言 seam 为空。

源文件软 400、硬 600。函数不超过 80，圈复杂度不超过 15，参数不超过 4（依赖与输入用对象）。domain 纯函数用 §6 的例外；本步几乎没有纯规则。禁止顶层 `let`。

### 用例

`createOpenDocument` 的依赖是：查库端口、`UpdateProgress`、`Clock`、`jobId` 工厂、记忆端口。调用 `(input: { id: string })`，返回 `Result<{ jobId }, OpenFailure>`。seam 上的值只有普通数据。不传 `AbortSignal`（§2.4）。不读路径，不返回路径，不返回文献记录。查库端口的命中值只有 `progressPage`，避免 `LibraryRecord.originalPath` 进入用例结果。

`openedAt` 只用 `formatUtc(clock.nowMs())`。它返回 `undefined` 时，用例返回 `rejected`，并且不调用进度、不分配新 `jobId`。调用进度时的 `page` 就是这次命中的 `progressPage`。页码断言看假仓库里留下的 `progressPage`。`createListLibrary` 的 `LibraryEntry` 没有这个字段，不能用列表结果证明页码。

### handlers

`createIngestIpcHandlers` 照 reader / library：返回 `Promise.resolve` 后的结果，可单测，不挂桌面装配。成功是 `{ ok: true, value: { jobId } }`。描述符断言 `openDocument.expose === false` 且 `idempotent === true`。不修改描述符。用例 `not_found`（含进度写入时的 `not_found`）变成 `{ code: "not_found", retryable: false }`。用例 `rejected` 变成 `{ code: "handler_threw", retryable: true }`。两份错误体都没有 `message`。

### README

写明：本步只接线 `openDocument` 并在成功后写 `openedAt`，页码写回打开前已存的 `progressPage`；不调用 PDF.js；不等待真机截图；完整编排、阅读界面、`expose: true` 都不在本步。幂等只在同一记忆实例内。重启或新建实例不保证同一个 `jobId`。不要写成已经有持久化任务状态机。公开 API 列出桶导出。所有者仍是 `@wisdom-km`。热点文件：无（不改 `composition-root.ts` / `slots.ts`）。`pnpm-lock.yaml` 会因 workspace 依赖出现在 diff 里，PR 描述要声明；G11 脚本当前只卡 `composition-root.ts` 与 `slots.ts`。

## 测试映射

用例名用 `<结果> when <条件>`。对得上 AC 的名称以编号开头。core 测试不写 `@vitest-environment`，不 import `src/adapters`、`src/ui`、`src/domain`、`src/application`。

| 观察 | 条件 |
| --- | --- |
| AC-11 的接线半边 | 依赖里没有解析服务；库中有 id 时仍返回 `jobId` |
| AC-01 | 用例不调用 `library.import`；同一实例、同一 id 两次只有一个 `jobId` |
| openedAt | 成功后 `recent` 含该 id；记录上的 `openedAt` 等于注入时钟 |
| 页码为 null | 打开前 `progressPage` 为 `null`；成功后仍为 `null` |
| 页码非空 | 打开前 `progressPage` 为正整数；成功后仍是同一个整数 |
| 再次打开 | 工厂只调用一次；`jobId` 相同；`openedAt` 变成第二次的时钟；页码仍是当时查到的值 |
| 写前 not_found | 缺记录或坏 id；进度调用次数为 0；记忆里没有这个 id |
| 写时 not_found | 查库命中后进度返回 `not_found`；用例与 handler 都是 `not_found`、`retryable: false`；已分配的 `jobId` 留着；错误体没有 `message` |
| 进度 rejected | 第一次进度返回 `rejected` 时 handler 是 `handler_threw`、`retryable: true`，没有 `message`；第二次写成功时 `jobId` 仍是第一次记下的那个 |
| §9 | 成功值与错误值上没有路径键，字符串里没有绝对路径 |
| expose | `openDocument.expose` 为 false |
| 空 pure | `pure.ts` 的导出键为空 |

不测 PDF 页数，不测缩放，不测栏位，不测桌面窗口。

## 测试分工

2026-11-08 对照根 `package.json` 的 `scripts` 与对应文件。没有名为 `check:docs` 的 script。实现阶段 Cloud / Forge 只用下表「实现阶段」为「跑」的命令，工作目录是仓库根，Node 用 `.nvmrc` 的 22.23.4。没有更窄的「只查 ingest」类型检查 script，不另造。

| 命令 | `package.json` 里的脚本正文 | 实际范围 | 实现阶段 |
| --- | --- | --- | --- |
| `corepack pnpm exec vitest run packages/features/ingest/test/core packages/features/ingest/test/adapters` | `test` 是 `vitest run`，那是全量收集 | 这条把路径交给 Vitest，只跑 ingest 的 core 与 adapters | 跑 |
| `GATE_BASE=origin/main corepack pnpm run check:one-slice` | `node tools/check-one-slice/check.mjs` | `git diff base...HEAD` 里 `packages/features/*/src/` 的切片个数 | 跑 |
| `corepack pnpm run check:deps` | `node tools/check-deps/check.mjs` | dependency-cruiser 扫 `packages/` 与 `apps/` | 跑 |
| `corepack pnpm run check:size` | `node tools/check-file-size/check.mjs` | 仓库源文件行数，硬上限 600 / 测试 800 | 跑 |
| `corepack pnpm run typecheck:core` | `node tools/gate-remediation/run.mjs --id G14 -- tsc -p tsconfig.core.json --noEmit --pretty false` | `contracts`、`kernel`、各切片 `domain/`、`application/`、`index.ts`、`pure.ts`。不含 adapters，不含测试 | 跑 |
| `corepack pnpm run typecheck` | `node tools/typecheck.mjs` | `tsc -p tsconfig.json`（`**/*.ts`，排除 ui、renderer、preload 等），再加 `tsconfig.ui.json` 与 `apps/desktop/tsconfig.preload.json`。adapters 在这里 | 跑 |
| `node tools/check-docs/check.mjs` | 无 npm script | 文档链接、状态行、verbatim、`docs/arch/03.md` 树 | 跑 |

不跑 `corepack pnpm test`（全量 Vitest）、`corepack pnpm run check`（format、lint、两套 typecheck、size、deps、core-tests、三套 license、one-slice、commits、hotspots、pr-size、codegen、`git diff --exit-code`）、pytest、e2e。全量只由 Anvil 在与证据相同的 tip 上跑一次。命令、退出码与留给 Anvil 的项写入 [docs/evidence/178/commands.md](../evidence/178/commands.md)。没跑的命令不写成通过。

本计划修订只跑 `node tools/check-docs/check.mjs`。不跑上表里的产品命令，也不跑 `pnpm test` / `pnpm run check`。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| M2 顺序 ①→②→③，最后做 PDF.js 阅读 | 原文：「那就按照你的这个建议吧，先做SQL Lite的加文件存储，再做导入和文献库，最后做PDF.js阅读」。approvals 第 94 行。来源：https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6634955416 | 2026-11-04 23:40 | Wisdom |
| 1A / 2A / 3A 与双方一致的 ③ 范围 | 原文三条均为 A。来源：https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956 。approvals 还没有这一行。本计划不补 | 2026-11-05 21:01 | Wisdom |
| 真机实测并附截图 | 原文：「ok，然后需要真机实测的都要真机实测。并且附上对应的截图。」③ 的真机项在 PR-C。来源：https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6660190422 | 2026-11-05 22:13 | Wisdom |
| G18 选项 (a) | 接线是独立极薄 PR，不并入 PR-C，不写双切片 ADR。来源：https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6660829088 | 2026-11-05 22:40 | Forge 排序，非业主决定 |
| 按项目进度继续，先交计划再停 | 原文：「请你按照项目进度继续推进吧」。来源：https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719581822 。approvals 还没有这一行。本计划不补 | 2026-11-08 17:02 | Wisdom |
| 恢复既定实现、测试，并按职责找 bot | 原文：「对，因为之前我说暂停了嘛，然后现在咱重新开始，就是说PR该跑完的时候该测试测试，然后该有对应的bot你就找对应的bot。」来源：https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719728190 。不含合入或发版。approvals 还没有这一行。本计划不补。本修订仍先改计划 | 2026-11-08 17:17 | Wisdom |
| 页码写回已读到的 `progressPage` | 原交接写 `page: null`。SQLite `UPDATE` 会把 `progress_page` 写成传入值，`null` 就是清空。改为写回 `findById` 的 `progressPage`。只动 ingest。不是用户新要求。来源同上评论 | 2026-11-08 17:18 | Forge 排序，非业主决定 |
| 进度 `not_found` 保持 `not_found`；其余失败走 `handler_threw` | 写之前查到记录，不保证写的时候还在。来源同上评论 | 2026-11-08 17:18 | Forge 排序，非业主决定 |
| 打开成功 = 查库命中且进度写成功；不建 reader 会话 | 契约响应只有 `jobId`。没有 `ingest → reader` 边，也没有按 id 读字节的端口。AC-11 的浏览原文留给 PR-C | 2026-11-08 | 本计划，按交接默认 (i) |
| 幂等取「最近一次」；进度写失败不换新 jobId；只在同实例内 | jobs 状态机未就绪。契约要求不另开第二个解析作业。用例保持同步。README 写明重启不保证同一个 `jobId`。来源含 6719728190 | 2026-11-08 | 本计划；Forge 接受首次写失败仍复用 |
| 放行步骤 2–6，不是合入或发版 | Forge 已亲读 `adf0cbc` 全文并逐项复核前次四项，最终计划审查 PASS。来源：https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6719786094 。实施时另覆盖 `formatUtc` 的 RangeError、结果不带 `originalPath`、写时 `not_found` 后重试复用 `jobId`。approvals 没有 17:24 这一行。本计划不补 | 2026-11-08 17:24 | Forge 排序，非业主决定 |

## 证据链接

- [docs/evidence/178/commands.md](../evidence/178/commands.md)：只记录实际跑过的针对性命令和退出码。没跑的不写成通过。全量留给 Anvil。Draft PR：https://github.com/wisdom-km/open-immerse-v2/pull/178

## 自检

- [x] 影响 arch / prd 吗？本计划不改 arch / prd / DESIGN / approvals / design-principles / CI / 依赖矩阵。实现阶段同样不改这些正文。规格变更记录不适用。
- [x] 打开 PR 时的 UI–core 交接：任务类型是 core 改动；切片是 `ingest`；UI 文件无；core 有改动（ingest 的 domain / application / `index.ts`；`pure.ts` 维持空导出）；seam 是已有的 `ingest.openDocument` 与已有的 `updateProgress`；seam 够用；核心测试在实现阶段按「测试分工」填写；未验证项是 AC-11 的浏览原文、真机与截图、导入后自动进入阅读器。
