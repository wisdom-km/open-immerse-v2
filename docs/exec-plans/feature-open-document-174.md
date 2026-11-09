# 执行计划

分支 `feature/open-document-174`。基线是远端 `main` `631859c440320328164f6b3ecc0076dd7ca7ea94`（提交说明 `fix(library): 同一篇文献的代际只增不减 (#174) (#189)`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 2026-11-09 20:06 行。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不改契约、不改 codegen、不改装配。本文件不是那个 PASS。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。

任务类型：本两笔是纯文档。交接说明写「不适用」。实现阶段是接线：把已有的 `ingest.openDocument` 挂到生产 IPC。不改它的请求、响应和用例函数体。

## 现状理解

- 已有行为：`631859c` 上 `ingest.openDocument` 的契约是 `{ id }` → `{ jobId }`，`expose: false`，`idempotent: true`。用例在进度写入成功后更新 `openedAt`，并把打开前读到的 `progressPage` 原样写回。文献库「最近」只保留 `openedAt` 非空的条目。导入用例不调用注入的 `openDocument`。生产 map 没有这条通道。`packages/features/jobs/src` 只有 `parseJobId` 与 `sameJobId`。
- 相关的节：[docs/arch/09.md](../arch/09.md) 第 10–13 行、[docs/arch/02-05.md](../arch/02-05.md) 第 10 与 30 行、[docs/arch/04-02.md](../arch/04-02.md) 第 8 行、[docs/arch/07-12.md](../arch/07-12.md) 第 26 行、[docs/prd/06-01-12.md](../prd/06-01-12.md) AC-91、[docs/prd/06-01.md](../prd/06-01.md) AC-11、[DESIGN.md](../../DESIGN.md) 第 352 与 797 行、[RULES.md](../../RULES.md) §2、§9、N-03、N-09、N-10。
- 还没做的部分：生产进程里没有人调用 `createOpenDocument`。打开一篇文献不会写入「最近」。本两笔只写计划和台账。

## (a) 核实：只打开并写最近，会不会触发解析

结论：不会。按当前契约和 `main` 上已合入的函数体，调用 `ingest.openDocument` 可以只做「按 id 打开，并写下 `openedAt`」，不提交解析作业，不写 jobs 记录，不拉 worker。为了不触发解析，不需要改请求形状、响应形状或错误码。这不是 STOP。

下面每条都对着 `631859c` 的文件。

契约 [packages/contracts/src/ipc/ingest.ts](../../packages/contracts/src/ipc/ingest.ts) 第 23–28 行写明：这是打开 PDF 的用户入口；长任务立即返回 `jobId`；无解析服务时浏览原文仍须成功（AC-11）；「这里不实现解析流水线」；同一 id 再次打开返回进行中或最近一次的 `jobId`，「不另开解析作业」。第 44–52 行：`expose` 为 false，`idempotent` 为 true，响应只有 `jobId`。第 18–21 行：`JobId` 不限制长度或字符集，schema 是贴了品牌的字符串。

用例 [packages/features/ingest/src/application/use-cases/open-document.ts](../../packages/features/ingest/src/application/use-cases/open-document.ts) 第 52–74 行的全部步骤是：解析 id、`lookup.findById`、格式化 `openedAt`、取或新建 `jobId`、调用 `updateProgress`。全文件没有 `submitParse`、`ing_route`、`ingest-policy`、worker。同目录的 ingest 源码也没有这些名字。

`jobId` 在这条已实现的命令里表示什么：

- 类型是 [packages/contracts/src/ids.ts](../../packages/contracts/src/ids.ts) 第 15 行的品牌字符串。第 38 行写明运行时不限制字符集、长度、UUID 或 sha256。
- 第 109–116 行 `existingOrNew`：这份 `Openings` 里已有该 id，就返回记住的值；没有才 `jobIds.next()` 再 `remember`。
- [packages/features/ingest/src/application/ports/openings.ts](../../packages/features/ingest/src/application/ports/openings.ts) 第 3–7 行：调用方持有实例。重启或再创建一份，不保证还是同一个 `jobId`。[packages/features/ingest/src/adapters/memory-openings.ts](../../packages/features/ingest/src/adapters/memory-openings.ts) 第 6–15 行是闭包 `Map`，不写库。
- 它不是 jobs 表的一行。[packages/features/jobs/src/index.ts](../../packages/features/jobs/src/index.ts) 第 1–2 行只转出 `parseJobId` 与 `sameJobId`。没有任务存储，没有 `onJobEvent`。
- [docs/arch/09.md](../arch/09.md) 第 10 行「长任务一律返回 `jobId`」规定的是响应形状：invoke 立刻返回，不在这一次调用里等待整篇解析。第 13 行：`parsing.submitParse` 仍是 ingest 调用的内部 seam，不注册为 IPC。当前没有这个内部调用，所以返回 `jobId` 不表示解析已经开始，也不表示有进度事件可订。
- 第 27 行「不另开解析作业」在现有测试里的可观察结果是：同一实例第二次打开不再次调用 `jobIds.next()`（[open-document.test.ts](../../packages/features/ingest/test/core/open-document.test.ts) 第 81–90 行，`calls()` 为 1）。没有「第一次已经提交、第二次不再提交」的解析作业。第 73 行的用例名写的是没有接上解析器时仍返回 `jobId`。

「最近」怎么写上：[packages/features/library/src/domain/library-order.ts](../../packages/features/library/src/domain/library-order.ts) 第 13–21 行与第 35–36 行，`view: "recent"` 丢掉 `openedAt === null`，未传 sort 时按打开时间降序。打开用例经 `createUpdateProgress` 写下 `openedAt` 之后，[open-document.test.ts](../../packages/features/ingest/test/core/open-document.test.ts) 第 68–70 行用 `list` 的 recent 视图取 id，第 93–97 行断言刚打开的那篇出现在这个视图里。

[docs/arch/09.md](../arch/09.md) 第 12 行「解析与打开阅读仍走 `ingest.openDocument`（返回 `jobId`）。M2 ② 不接 ingest（#166 推后项）。」前半句是这条通道的归属：解析将来仍从这里进，不从文献库导入进。后半句是 #166 的推后项，指的是导入。导入实现在 [import-pdf.ts](../../packages/features/library/src/application/use-cases/import-pdf.ts) 第 28–30 行写明本用例不调用注入的 `openDocument`，第 45–61 行与第 77–97 行的函数体也没有这句调用。[library-main.ts](../../packages/features/library/src/adapters/library-main.ts) 第 130–134 行的注入仍是空函数。本批保持这个空函数。把生产打开接到 `createOpenDocument`，不把导入接到它。

[docs/arch/04-02.md](../arch/04-02.md) 第 8 行、[docs/arch/07-12.md](../arch/07-12.md) 第 26 行、[docs/prd/06-01-12.md](../prd/06-01-12.md) AC-91 仍写：`open-document` 读取路线并按 `multimodal-layout` 提交版面、识别或评分作业；`ing_route` 缺失或读不出路线时不提交。这些句子点名的 `ingest-policy.ts`、`route-presets.ts`、`sqlite-route-store.ts` 在 `631859c` 的 ingest 源码里不存在。AC-91 的里程碑列是 M3。当前函数体对不上这三处的「提交作业」。本批若去补上那三处，调用就会提交作业。那超出 20:06 的「先核实不触发解析」。本批不补。也不把这三处改写成「只写最近」：那是规格行为变更，20:06 没有批。规格保持原句。实现阶段只在 [docs/arch/02-05.md](../arch/02-05.md) 第 30 行把「`openDocument` 与 `setZoom` 不改」里已经失真的前半改成：生产 IPC 已挂上已有用例，`expose` 为 true，仍不提交解析作业，仍不等于 AC-11 已验收。`setZoom` 仍不改。

因此：接线当前命令不会触发解析。返回的 `jobId` 只是本进程这份打开记忆里的字符串。不需要为了避开解析去改契约形状。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6739648033](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6739648033) | 对得上。评论里第三条原话是「按推荐 A：单开一小批，先出计划并核实不触发解析，会触发就停下来再问」。GitHub `created_at` 是 `2026-11-09T12:07:04Z`。台账时间用评论正文里的 20:06。同一条评论还有另外两句，不在本行 |
| [docs/approvals.md](../approvals.md) | 第 143 行 | 对得上。`631859c` 上是 125 条批准。本文件第二笔改为 126。Draft PR #190 也从 125 改为 126，合入顺序见该 PR 描述 |
| [packages/contracts/src/ipc/ingest.ts](../../packages/contracts/src/ipc/ingest.ts) | 第 23–28、44–52 行 | 对得上。见 (a) |
| [open-document.ts](../../packages/features/ingest/src/application/use-cases/open-document.ts) | 第 52–74、109–139 行 | 对得上。见 (a) 与调用顺序 |
| [library-main.ts](../../packages/features/library/src/adapters/library-main.ts) | 第 130–134 行 | 对得上。导入用的 `openDocument` 是空函数 |
| [library-wiring.ts](../../apps/desktop/src/main/library-wiring.ts) | 第 93–116 行 | 对得上。map 只有八条 library 通道 |
| [composition-root.ts](../../apps/desktop/src/main/composition-root.ts) | 第 18–19 行 | 对得上。热点。只把 `startLibrary` 的 map 交给 `wireIpc`。本批目标 diff 为 0 |
| [slots.ts](../../apps/desktop/src/renderer/slots.ts) | 第 1–3 行 | 对得上。热点。本批目标 diff 为 0 |

## (b) 调用顺序

打开一篇文献时，生产调用和以后的界面调用都按这一张表。表里的「落实」指该次 invoke 的 Promise 已经完成。当前 handler 在 [ipc-handlers.ts](../../packages/features/ingest/src/adapters/ipc-handlers.ts) 第 12–14 行用 `Promise.resolve(runOpen(...))`。`runOpen` 同步跑完用例。用例在 `findById` 和 `updateProgress` 之间没有 `await`（[open-document.ts](../../packages/features/ingest/src/application/use-cases/open-document.ts) 第 60–74 行与第 127–139 行）。

| 步 | 调用 | 开始条件 | 页码 | 最近 |
| --- | --- | --- | --- | --- |
| 1 | `ingest.openDocument` | 这一次打开的第一拍 | 请求没有 `page`。同一次同步调用里，`findById` 读到的 `progressPage` 和本次 `openedAt` 一起写入。`null` 写回 `null`，已有正整数原样写回。不接收调用方事先缓存的页 | `openedAt` 写成这次的时钟。`view: "recent"` 因此能列出这篇 |
| 2 | `library.bindReadingAsset` | 第 1 步的 Promise 已落实 | 不写 `progress_page`，不写 `opened_at` | 不变 |
| 3 | `library.getProgressPage` | 第 2 步已落实 | 只读 | 不变 |
| 4 | `library.setProgressPage` | 第 3 步已落实 | 只写 `progress_page`（[set-progress-page.ts](../../packages/features/library/src/application/use-cases/set-progress-page.ts) 第 44 行；SQL 只更新 `progress_page`，[sqlite-library-repository.ts](../../packages/features/library/src/adapters/sqlite-library-repository.ts) 第 149–151 行） | `openedAt` 不变 |

`openDocument` 不得用一次调用开始之前留下的旧页，盖住库里已经更新的页。当前函数每次自己读，不收页参数。第 4 步不得把第 1 步开始前读到的页再写一次。第 1 步落实之后再读、再写，后写的页留在库里。第二次 `openDocument` 会重新读取这一页并原样写回（测试第 115–127 行：再次打开改 `openedAt`，页仍是 4）。

[update-progress.ts](../../packages/features/library/src/application/use-cases/update-progress.ts) 第 40–47 行要求页和 `openedAt` 一起写。[docs/arch/02-05.md](../arch/02-05.md) 第 30 行：`null` 不是「跳过」，写回去会清空 `progress_page`。所以第 1 步必须写回刚刚读到的那一页，不能改成不写页。这一写发生在第 1 步的 Promise 落实之前，早于第 4 步。

## (c) 改哪些文件

物理行数含空行和注释，按 [docs/arch/06.md](../arch/06.md)。函数低于 80 行，圈复杂度不超过 15，参数不超过 4 个。下表是实现阶段的增量目标。本两笔不改这些文件。

`index.ts` 的 diff 都是 0：`packages/contracts/src/index.ts`、`packages/features/ingest/src/index.ts`、`packages/features/library/src/index.ts`、`packages/features/jobs/src/index.ts`。

热点：`composition-root.ts`、`slots.ts` 的 diff 是 0。[tools/check-hotspots/check.mjs](../../tools/check-hotspots/check.mjs) 第 5 行只按这两个文件名卡 30 行。`ids.ts`、`errors.ts`、根 `package.json`、`dependency-cruiser.config.mjs`、`tools/check-file-size/allowlist.json` 的 diff 也是 0。`pnpm-lock.yaml` 只在实现阶段因 workspace 依赖由包管理器重写；[tools/check-pr-size/check.mjs](../../tools/check-pr-size/check.mjs) 第 8 行不把它计入 600 行。不手改锁文件。

| 路径 | 只做的事 | 现在 | 预算 |
| --- | --- | --- | --- |
| `packages/contracts/src/ipc/ingest.ts` | `expose` 改为 true。通道、schema、错误码、幂等不动 | 78 | 改 1 处，行数 +0 |
| `packages/contracts/test/ipc-ingest.test.ts` | `expose` 断言改为 true | 160 | +10 以内 |
| `packages/features/ingest/src/**` | 无。含 `open-document.ts` 与 `index.ts` | 见各文件 | diff 0 |
| `library-main.ts` | 同一次打开的仓库可供打开用例使用。存储打不开时打开命令走现有的 `handler_threw`。第 130–134 行的空函数保留 | 195 | +40 以内 |
| `library-wiring.ts` | `startLibrary` 返回的 map 加上 `ingest.openDocument`。用已导出的 `createOpenDocument` 与 `createUpdateProgress`。`Openings` 与 `JobIdSource` 由这一处的闭包实现：十进制字符串经 `parseJobId`，不写 jobs。查找端口只交出 `progressPage`，不交出 `originalPath`，错误体不带 `message` | 174 | +70 以内 |
| `apps/desktop/package.json` | 依赖 `@oi/feature-ingest`。若 nodenext 解析需要，构建脚本在 library 之后编译 ingest | 23 | +6 以内 |
| `packages/features/ingest/package.json` | 照 library 为包根增加 exports，指向已有的 `src/index.ts`。不新出口 `createMemoryOpenings` | 11 | +12 以内 |
| `tools/check-deps/tsconfig.paths.json` | 增加 `@oi/feature-ingest` → `src/index.ts` | 25 | +4 以内 |
| 新建 `apps/desktop/test/open-document-wiring.test.ts` | 见测试 | 无 | +160 以内 |
| `reading-command-surface.test.ts`、`oi-keys.test.ts` | 公开面出现 `ingest.openDocument` | 76、42 | 各 +15 以内 |
| `composition-root.ts`、`slots.ts`、四个 `index.ts` | 无 | 27、3、200、20、82、2 | diff 0 |
| `docs/arch/02-05.md`、`docs/spec-changelog.md`、`tools/compare-spec-bytes/manifest.json` | 只改第 30 行里 `openDocument` 那半句。changelog 一行。manifest 一条唯一替换。不改基线 `f8d5d01`，不改 `compare.mjs` | 见各文件 | 合计 +20 以内 |
| codegen 三文件 | 正式 `pnpm codegen`。不手改（N-09） | 生成物 | 约 +70。超了以实测为准 |

G18 只数 `packages/features/<切片>/src/`（[check.mjs](../../tools/check-one-slice/check.mjs) 第 35–40 行）。本批 ingest 的 `src/` 是 0，library 的 `src/` 只有 `library-main.ts`。一个切片。

G12 估计：上表手写增量约 280 行，codegen 约 70 行，本计划文件另计。`check-pr-size` 用 `base...HEAD`，实现提交上去之后会把本文件一并计入。合计可能超过 600。超过就停，报告数字，不预写 `G12:`，不手改生成物，也不把 `expose` 拆到另一次合入。先例是 [docs/approvals.md](../approvals.md) 第 130 行：`expose` 为 true 与 handler 同一次合入。

## (d) 测试

依据：

- AC-11 的「没有解析服务也能拿到打开结果」已经由 [open-document.test.ts](../../packages/features/ingest/test/core/open-document.test.ts) 第 73 行锁住。本批不把 AC-11 整句标成通过。整句还包括浏览原文、文字层、笔记和界面降级（[docs/prd/06-01.md](../prd/06-01.md) AC-11）。
- 「最近」依据 `library-order.ts` 第 19–20 行与现有第 93–97 行。新的装配测试走生产 `startLibrary` 与真实 SQLite：打开成功后 `library.list({ view: "recent" })` 含该 id；打开前 recent 不含刚导入、`openedAt` 仍为 null 的条目。
- 调用顺序依据本节 (b)。同一条 SQLite：打开落实后页与打开前相同；然后 bind；然后读到这一页；然后 `setProgressPage` 写成另一安全正整数；再读是新页；再打开一次，`jobId` 与第一次相同，页仍是新页，`openedAt` 变新。这样证明第二次打开没有把第一次看见的旧页写回去。
- 导入仍不打开：现有 import 测试保持 `openDocument` 次数为 0。本批不改那个用例文件。
- 公开面：`reading-command-surface.test.ts` 与 `oi-keys.test.ts` 把 `ingest.openDocument` 算进出现名单。断言走 registry、`createOi` 与 `Window["oi"]`，不读源码文本。[parse-capability-surface.test.ts](../../apps/desktop/test/parse-capability-surface.test.ts) 第 13–24 行的禁止名单不删。`ingest.openDocument` 不在这份名单里；若跑出来撞上某个禁止名，停。
- 响应与错误体没有绝对路径，没有 `originalPath`，没有 library 失败对象上的 `message`。

Box 与真机：

- Box（Node 上的 Vitest，含真实 SQLite 的临时目录）覆盖上面几条。这些断言不打开窗口、不跑 PDF.js、不画文献库。
- 真机不跑。本批没有界面。[DESIGN.md](../../DESIGN.md) 第 352 行：行点击仅选中不打开。第 797 行的「最近打开」排序要等有界面的批次 D 才有人能点。Wisdom 2026-11-05 22:13 要求规格写明要真机的项必须真机实跑。本批的验收没有窗口项。8 GB Windows 的打开 / 滚动 / 重开录屏仍未验证，不用这批的 Box 代替，也不把 AC-11、3A、PRC-01–26、UIX-57 标成通过。

实现 tip 的全量只跑一次。本两笔不跑全量，也不把以前的通过数写成这一批。

## (e) 停点

1. 本两笔之后停。Forge PASS 这两笔之前没有实现提交。
2. 实现时若调用链出现 `submitParse`、`ing_route`、`ingest-policy`、jobs 写入、worker 或 PDF.js，停下来问。不改用例把这些调用藏掉。
3. dependency-cruiser 若拒绝 `apps/desktop/src/main` 依赖 `@oi/feature-ingest`，停。不改依赖矩阵，不写 ADR。
4. `composition-root.ts`、`slots.ts` 或任一 `index.ts` 必须改才能接上，停。
5. 请求、响应或错误码必须改才能「只写最近」，停。那是契约形状变更。
6. `parse-capability-surface.test.ts` 因公开面变宽而失败，停。不删禁止名单。
7. 非锁文件的 `check-pr-size` 超过 600，停。不预写 `G12:`。
8. 不改 CSP、不写 Range、不做 UI、不标 Ready、不合入、不发版、不写密钥。
9. 不把 [library-main.ts](../../packages/features/library/src/adapters/library-main.ts) 第 130–134 行换成真正的打开用例。
10. 不把 `open-document.ts` 改成在读页和写页之间让出。那会让第 1 步有机会盖住第 4 步已经写下的页。

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 |  |  |
| 2 | 只在 `docs/approvals.md` 追加 20:06 原话，并把 125 改为 126。然后停 |  |  |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 |  |  |
| 4 | 按「改哪些文件」接线。不在步骤 1、2 |  |  |

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「按推荐 A：单开一小批，先出计划并核实不触发解析，会触发就停下来再问」 | 本分支只写这一小批的计划与台账。链接：[6739648033](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6739648033) | 2026-11-09 20:06 | Wisdom |
| 接线当前用例，不实现 §4.2 的提交作业 | (a) 已核实当前函数不提交解析。补上 §4.2 会触发。20:06 没有批改那句规格 | 2026-11-09 | 本计划，Forge 可在 PASS 前退回 |
| 调用顺序按 (b) | 第 1 步写回的是它刚刚读到的页，并且在它的 Promise 落实前写完。第 4 步在这之后 | 2026-11-09 | 本计划，依据 20:06 要求的顺序 |

批次 D 的界面、配置存储与降级 chip 不在本文件的实施范围内。同一条评论的另外两句也不在本文件。

## 不改

`open-document.ts`、ingest 的 `index.ts` 与其余 `src/**`、library 的 `index.ts`、jobs 的 `index.ts`、contracts 的 `index.ts`、`import-pdf.ts`、两个页码用例、`reading-generation-table.ts`、`composition-root.ts`、`slots.ts`、`ipc-router.ts`、`pass-through.ts`、`accept-result.ts`、CSP、Range、`oi-asset://`、`setZoom`、`getZoom`、`reader.setPage`、`session.save`、`session.restore`、settings、safeStorage、密钥、RULES、CI、门禁、DESIGN、原则、`docs/arch/04-02.md`、`docs/arch/07-12.md`、`docs/arch/09.md` 第 12 行、`parse-capability-surface.test.ts` 的禁止名单。

## 还没核实

- `apps/desktop` 的 `tsconfig.main.json` 用 `moduleResolution: nodenext`。ingest 的 `package.json` 目前没有 exports。照 library 的 exports 加上之后，Vitest 与 desktop 的 `tsc` 是否都解析到 `src/index.ts`，还没跑。解析失败就停，不改 Vitest 配置来迁就。
- 同一进程里第二次 `better-sqlite3` 连接能否在第 1 步的事务中途写入，还没核实。本批不另开第二份存储。打开与写页共用 `createLibraryMain` 里的那一次打开。
- 生产 `jobId` 用进程内递增的十进制字符串。重启后是否还要同一个值，规格没有要求。端口已经写明不保证。

## 证据链接

- `docs/evidence/<PR号>/`：本两笔无。

## 自检

- [x] 影响 arch / prd 吗？本两笔不影响。实现阶段只改 `docs/arch/02-05.md` 第 30 行里 `openDocument` 那半句，并加 changelog 一行和 manifest 的唯一替换。
