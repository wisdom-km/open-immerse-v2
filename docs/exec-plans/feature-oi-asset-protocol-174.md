# 执行计划

分支 `feature/oi-asset-protocol-174`。基线是远端 `main` `631859c440320328164f6b3ecc0076dd7ca7ea94`（PR #189 squash 合入，tree `b5259e5b4ba1defc681c52d89cc4612fcf431958`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写，格式沿用 [feature-reading-generation-monotonic-174.md](feature-reading-generation-monotonic-174.md)。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 2026-11-09 19:45 行。Forge 计划审查 [6739448337](https://github.com/wisdom-km/open-immerse-v2/pull/190#issuecomment-6739448337) 是有条件 PASS：把「主机名规范化」和「可测性」写进本文件的那一笔即视为 PASS，其后才进入步骤 4。那一笔之前不注册 `oi-asset`，不读 `source.pdf`，不改测试。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。[docs/design-principles.md](../design-principles.md) 的 P7 保持：这一批没有界面。

任务类型：本两笔是纯文档。交接说明写「不适用」。实现阶段改 library 的代际查找和 desktop 的协议处理，不是 UI 改动。涉及切片只有 `library`。`apps/desktop` 不是 feature 切片。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 现状理解

- 已有行为：`631859c` 上只注册了 `oi-app`。`registerSchemesAsPrivileged` 只有一次，特权只有 `standard: true` 与 `secure: true`。静态文件经纯函数 `respond` 返回 `Response`；GET 给字节，HEAD 用 `bodyForMethod` 给空体；其他方法 405；越界与缺失 404；每种响应带 `nosniff`。文献库 PDF 已落在 `<dataRoot>/library/<sha256>/source.pdf`，路径由 `librarySourcePath` 拼出，摘要不是 64 位小写 hex 就拒绝。成功的 bind 把十进制 `assetId` 和 generation 放在代际表的当前行上；revoke 删当前行；再 bind 换新的 `assetId` 和更大的 generation。表没有按 `assetId` 查找的方法。`LibraryMain` 不交出这张表。reader 的 PDF.js 6.5.438 只吃 `Uint8Array`，`isEvalSupported: false`。CSP 常量仍是 `connect-src 'self'`，`img-src` 含 `oi-asset:`，没有 `connect-src oi-asset:`。
- 相关的节：[docs/arch/09.md](../arch/09.md) 第 14–25、32 行，[docs/arch/09-01.md](../arch/09-01.md) 第 21 行，[docs/arch/08-02.md](../arch/08-02.md) 第 9、16 行，[docs/arch/02-05.md](../arch/02-05.md) 页级进度段，[docs/prd/06-01-07.md](../prd/06-01-07.md) AC-67 ②，[docs/prd/08.md](../prd/08.md)「M2 ③ 本批归属」，[DESIGN.md](../../DESIGN.md) UIX-57。
- 还没做的部分：`oi-asset://<assetId>` 读当前代际的 `source.pdf`。本两笔只写计划和台账。Loom 的批次 D 原则检查不在本分支。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6739253590](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6739253590) | 对得上。原话见决策记录。GitHub `created_at` 是 `2026-11-09T11:45:38Z`。台账时间用评论正文里的 19:45。批准范围是批次 C 的计划加台账，PASS 后才实施；Loom 为批次 D 做原则检查和设计，不写 UI 代码。明确不包括改 CSP、写 Range、做 UI、Ready、合入、发版，也不包括 CSP ADR 和 #186 |
| 任务附件里的「批次 C」 | 约第 99–109 行 | 对得上评论写的「Forge 本地 PLAN.md 的批次 C」。仓库里没有 `PLAN.md`。不把附件抄进仓库。本文件按那一节写目标、404、装配注入和未核实项 |
| [docs/approvals.md](../approvals.md) | 文末 | 对得上。133 条日期行：1 条反馈（第 10 行）、4 条决定（第 44、69、89、126 行）、3 条合入同步（第 107、110、114 行）、125 条批准。文末「共 125 条批准」与这个数一致。第二笔改成 126 |
| [docs/arch/09.md](../arch/09.md) | 第 15–25、32 行 | 对得上。第三类只读该条目的 `source.pdf`。未登记、已撤销、不可读、符号链接出目录、`../`、`%2e%2e`、头或文件名不符，都是 HTTP 404，体为空，无路径，无 IPC 错误码，带 `nosniff`。只 GET / HEAD。不写 Range。不放宽 CSP。`standard` 是否必要仍待实测 |
| [docs/arch/08-02.md](../arch/08-02.md) | 第 9、16 行 | 对得上。副本路径是 `library/<sha256>/source.pdf`。阅读走第三类 `assetId`，路径留在 main |
| [docs/arch/02-05.md](../arch/02-05.md) | 页级进度段 | 对得上。当前行会被新的 bind 替换。revoke 后再 bind，generation 不回到 1。`assetId` 不回收。本批不改这些句子 |
| [packages/features/library/src/application/reading-generation-table.ts](../../packages/features/library/src/application/reading-generation-table.ts) | `rows`、`revoke`、`adopt` | 对得上。72 行。当前行含 `assetId`（16–18 行）。revoke 删行（47–51 行）。`adopt` 用 `issued.next` 发新的 `assetId`（67–71 行）。没有按 `assetId` 查找 |
| [packages/features/library/src/adapters/library-main.ts](../../packages/features/library/src/adapters/library-main.ts) | `LibraryMain`、`readingHandlers` | 对得上。195 行。59–63 行只有 handlers、reading、close。144–156 行在闭包里建一张表，不交出来 |
| [packages/platform-node/src/storage/data-root.ts](../../packages/platform-node/src/storage/data-root.ts) | `librarySourcePath` | 对得上。70–78 行。id 必须是 64 位小写 hex，否则 `storage.invalid_path`，文案不含输入路径 |
| [apps/desktop/src/main/app-protocol.ts](../../apps/desktop/src/main/app-protocol.ts) | `registerAppScheme` | 对得上。17 行。8–10 行只登记 `oi-app`。处理函数是 `protocol.handle`，实现在别的文件 |
| [apps/desktop/src/main/index.ts](../../apps/desktop/src/main/index.ts) | 启动 | 对得上。59 行。19 行在 ready 前登记方案。34–36 行在 ready 后 `handleAppProtocol`，再 `startMainLogger` |
| [apps/desktop/src/main/protocol-response.ts](../../apps/desktop/src/main/protocol-response.ts) | `respond` | 对得上。35 行。404 与 405 用 `schemeResponse(null, …)`。响应头含 CSP 常量和 `nosniff` |
| [apps/desktop/src/main/static-file.ts](../../apps/desktop/src/main/static-file.ts) | `bodyForMethod`、`realInside` | 对得上。147 行。34–41 行 HEAD 返回 `null`。113–130 行用 `realpath` 判断仍在根内 |
| [apps/desktop/src/main/security/csp.ts](../../apps/desktop/src/main/security/csp.ts) | 常量 | 对得上。3 行。`img-src` 有 `oi-asset:`，`connect-src` 只有 `'self'`。本批不改 |
| [packages/features/library/src/adapters/fs-pdf-file-store.ts](../../packages/features/library/src/adapters/fs-pdf-file-store.ts) | `isPdf` | 对得上。213–221 行只认前 5 字节 `%PDF-`。函数未导出 |
| [packages/features/reader/src/adapters/pdfjs-document.ts](../../packages/features/reader/src/adapters/pdfjs-document.ts) | `open` | 对得上。入参是字节，不是 URL。`pdfjs-dist` 为 6.5.438。本批不改 reader，不加这个依赖 |
| 热点与收口 | 行数 | `composition-root.ts` 27 行，`slots.ts` 3 行，`ipc-router.ts` 244 行，`pass-through.ts` 33 行。本批目标 diff 都是 0 |
| [apps/desktop/src/main/library-wiring.ts](../../apps/desktop/src/main/library-wiring.ts) | `startLibrary` | 对得上。174 行。23–39 行创建唯一的 `createLibraryMain` 并返回 command map。`composition-root.ts` 只把这张 map 交给 `wireIpc` |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。Forge PASS 这两笔之前不填实现证据。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `3d6ca2ab0d14cdc0e10a46a92ec134c8a076a219`，tree `f9d7522897b361c112e991c86e31ec61cc288ead`。只新增本文件 | 无 |
| 2 | 只在 `docs/approvals.md` 追加 19:45 原话、所批范围、时间和登记链接，并把文末批准数从 125 改为 126。然后停 | `2e70df084793f57e8b3816f9b230b633f072119b`，tree `2dba7d765962fd74c315d3058b4a7f0554a1a826`。只改 `docs/approvals.md`。批准数 126 | 无 |
| 3 | Forge 亲读步骤 1 与步骤 2。有条件 PASS 要求先把主机名规范化停点和可测性写进本文件。那一笔即视为 PASS，之前没有步骤 4 | 评论 [6739448337](https://github.com/wisdom-km/open-immerse-v2/pull/190#issuecomment-6739448337)。补充 `22012818ce48525d529402623243f9e6d47b326a`，tree `cd97a8a0d1792e5557ec718032ba5493da9be460`。只改本文件。这一笔即 PASS | 无 |
| 4 | 按「行为」实现。不在步骤 1、2 | 实现 `94e5ac2f54852534d2b7f5557b52f8fd133a6a4d`，tree `fab6c6c43e192139aabfd5ae2781f6def4cb4c51`。类型修正 `1dddc5a058c8823bbedef425083966ad7bfdab32`，tree `1c119730674fe8af9b1e307707341aab16c60912`。全量在这个 tip。`protocol.handle` 注入。`library-wiring.ts` +15。四个热点和 `index.ts` 的 diff 是 0。Electron 45.2.1 的 main 进程 `net.fetch("oi-asset://1")` 时，`protocol.handle` 收到 `oi-asset://0.0.0.1/`，状态 404。没有改解析去兼容 IPv4，也没有改 URL。合法 `assetId` 在这次真实请求里不是 200。停在这里 | [docs/evidence/190/commands.md](../evidence/190/commands.md) |
| 5 | 按 20:48 把 URL 改成 `oi-asset://asset/<assetId>`。主机名必须是 `asset`，路径恰好一段。其他一律 404 且体为空。只改 [docs/arch/09.md](../arch/09.md) 第 16、22 行的 URL 形式，加 changelog 一行和 manifest 的唯一替换。Electron 里对合法、未登记、已撤销各 fetch 一次。收到的 URL 再被改写，或合法 id 不是 200，就停，不加兼容 | 计划 `90a0a41457b49a4b18dc31bc4ab459d46432337e`。台账 `aa552341100dd69f46542e259df32cefd45d7e71`，批准数 127。实现 `f7425f17560b616bbe4c7a934c8781c3ea653e9a`，tree `0e55e873ab933e10d53110976234fc2e46a2cfe9`。全量在这个实现 tip，`check-pr-size` 1110。Electron 45.2.1 main 的 `net.fetch("oi-asset://asset/1")` 收到的 `request.url` 仍是 `oi-asset://asset/1`，状态 200，`application/pdf`，`nosniff`。`oi-asset://asset/9` 与撤销后再取同一 URL 都是 404，体为空。没有改解析去兼容别的写法 | [docs/evidence/190/commands.md](../evidence/190/commands.md) |

## 目标

用 bind 成功写在当前行上的十进制 `assetId`，读该条目目录里的 `source.pdf`。步骤 4 的 URL 是 `oi-asset://<assetId>`。2026-11-09 20:48 起，步骤 5 改为 `oi-asset://asset/<assetId>`。renderer 不提交路径，也不经本协议提交字节。

查找只用这一张已有的代际表，不另建资产登记表，不把 `assetId` 当路径，也不把文献 id 放进 URL。当前行没有这个 `assetId` 时，未登记、已撤销、旧代际是同一种结果：HTTP 404。响应不写是哪一种。

新的协议处理函数放在新文件里，不写进 `app-protocol.ts`。用 `assetId` 换路径的端口由 `startLibrary` 注入，闭包同一张表和同一个 `dataRoot`。

## 行为

纯函数接收 URL、方法，以及端口。`protocol.handle` 只把请求的 URL 和方法交进去，不读 `Range`，因此没有 206。返回值经现有的 `schemeResponse`。HEAD 的空体经现有的 `bodyForMethod`。路径判断经现有的 `realpath` 与 `path.relative`，和 `static-file.ts` 的 `realInside` 同一条规则。文件路径只来自 `librarySourcePath`，不来自 URL 的拼接。

### URL

步骤 4 把主机名当成 `assetId`，路径只允许空字符串或 `/`。Electron 45.2.1 把 `oi-asset://1` 收成 `oi-asset://0.0.0.1/`，状态 404。见下面的实测。步骤 5 不再用那个形式。

步骤 5 用 `new URL`。协议必须是 `oi-asset:`。主机名必须恰好是 `asset`。路径必须恰好一段 `/<assetId>`，`assetId` 是去掉开头斜杠后的那一段，非空，里面没有斜杠。不允许用户名、密码、端口、查询或片段。末尾多一个斜杠、空 id、多一段、别的主机名、纯数字主机名、`oi-asset://0.0.0.1/`，都是 404，体为空。原始 URL 里出现 `..`，或大小写不限的 `%2e%2e`，直接 404，不调用端口。路径段不是当前行上的那个十进制字符串时也是 404。不把 `01` 收成 `1`。不接受文献 id。不把 IPv4 形式改写成 `assetId`。`assetId` 仍是表里那个十进制字符串，格式不改。

### 端口

端口是 `(assetId: string) => string | undefined`。实现放在 desktop 的新文件里：向同一个 `LibraryMain` 要当前行的文献 id，再用 `dataRootLayout` 与 `librarySourcePath` 得到 `source.pdf`。对不上、存储没打开、或 `librarySourcePath` 不成功，都返回 `undefined`。不返回 IPC 错误对象，不把 `storage.invalid_path` 写进 HTTP。

代际表增加 `locate(assetId)`：当前行的 `assetId` 全等时返回文献 id，否则 `undefined`。多于一条命中时返回 `undefined`。`LibraryMain` 增加同名窄方法；存储打不开时返回 `undefined`。不把表本身交出来。

### 读文件

端口返回路径之后，再对条目目录和 `source.pdf` 做 `realpath`。文件的真实路径必须仍在该条目目录的真实路径里，且最后一段是 `source.pdf`。符号链接指到该目录外，包括条目目录本身指到外面，都是 404。读失败是 404，不把异常文本写进响应。

前 5 字节必须是 `%PDF-`，与 `isPdf` 和 reader 的 `looksLikePdf` 相同。不够长或对不上，是 404，响应里没有这些字节。不引入 PDF 解析库。desktop 不加 `pdfjs-dist`，也不 import reader。

### 状态与头

404 与下面的 405：体为空，`Content-Type` 沿用 oi-app 的 `text/plain; charset=utf-8`，带 `nosniff`。不带 `Content-Security-Policy`。oi-app 把页面 CSP 加在自己的响应上；PDF 响应不复制那一头。

合法 GET 与 HEAD：状态 200，`Content-Type` 是 `application/pdf`，带 `nosniff`。GET 的体是文件字节。HEAD 的体为空。不写 `Accept-Ranges`。

404 与 405 的体和头都不含绝对路径，也不含这些 IPC 或存储码：`not_found`、`sender_rejected`、`rejected`、`invalid_payload`、`handler_threw`、`not_pdf`、`storage.invalid_path`。200 的体就是文件字节，路径和这些码的断言放在头上，不在字节里搜子串。状态行只有 HTTP 状态，不写这些码。

不是 GET 或 HEAD：沿用 oi-app 的 405，体为空，带 `nosniff`，不含路径，不含上面的码。不把 405 改成 404。这是本计划的选择，Forge 可以在 PASS 前改回 404。

## 404 安全矩阵

下列情况都是 HTTP 404。响应体为空，不含路径，不含上表那些码。测试靠夹具区分原因，不靠响应正文。

| 情况 | 夹具 |
| --- | --- |
| 未登记 | 没有 bind 过的 `assetId`，以及从未发出的十进制字符串 |
| 已撤销 | 当前代际 revoke 之后，再用该 `assetId` |
| 旧代际 | 同一篇再 bind 之后，用替换掉的那个 `assetId`。新的 `assetId` 仍是 200 |
| `../` | 主机名或路径里有 `..`。不调用端口 |
| `%2e%2e` | 原始 URL 含 `%2e%2e` 或 `%2E%2E`。不调用端口 |
| 符号链接指向目录外 | `source.pdf` 指到条目目录外，或条目目录本身指到外面。沿用 `protocol-response.test.ts` 的 `symlinkSync(..., "junction")` |
| 非 PDF | 文件名仍是 `source.pdf`，前 5 字节不是 `%PDF-`。含一段 SVG 字节。不把 PNG / JPEG / GIF / WebP 扩成这一类的放行类型 |
| 旧 URL 与多段路径 | 步骤 5。`oi-asset://1`、`oi-asset://0.0.0.1/`、别的主机名、`oi-asset://asset/`、`oi-asset://asset/1/extra`、查询或片段。都不调用成功路径 |

副本被删掉，同样 404。这是 [docs/arch/09.md](../arch/09.md) 第 21 行已写的「副本不可读」，用删除文件来做，不用 `chmod 000`。

## 改哪些文件

物理行数含空行和注释，按 [docs/arch/06.md](../arch/06.md)。函数低于 80 行，圈复杂度不超过 15，参数不超过 4 个。下面是实现阶段的增量，本两笔不改这些文件。不预写 `G12:`。不跑 codegen。不改契约、`expose`、通道名、schema 或错误码。

| 路径 | 只做的事 | 现在 | 目标 | 完成后上限 |
| --- | --- | --- | --- | --- |
| 新建 `apps/desktop/src/main/reading-asset-protocol.ts` | 纯函数。不 `import "electron"`。`protocol.handle` 由调用方注入。处理与 `app-protocol.ts` 分开 | 无 | +160 | 建议 400，硬上限 600 |
| 新建 `apps/desktop/src/main/reading-asset-path.ts` | 端口：当前行 id → `librarySourcePath` | 无 | +70 | 建议 400，硬上限 600 |
| `app-protocol.ts` | 同一次 `registerSchemesAsPrivileged` 加上 `oi-asset`，特权对象与 `oi-app` 相同：只有 `standard: true` 与 `secure: true`。不把处理函数放进这个文件 | 17 | +8 | 硬上限 600 |
| `reading-generation-table.ts` | `locate`。不改 bind / revoke 的数字 | 72 | +25 | 建议 400，硬上限 600 |
| `reading-generation-table.test.ts` | 未登记、撤销、再 bind 后旧 `assetId` 找不到，新的找得到 | 161 | +45 | 建议 600，硬上限 800 |
| `library-main.ts` | 把 `locate` 接到同一个闭包。失败路径返回 `undefined` | 195 | +20 | 建议 400，硬上限 600 |
| `library-wiring.ts` | `startLibrary` 在创建 main 之后调用注入的注册函数，传入端口。生产默认才是 `protocol.handle`。返回的 map 不变 | 174 | +12 | 建议 400，硬上限 600。本文件若超过 +30 行就停 |
| 新建 `apps/desktop/test/reading-asset-protocol.test.ts` | 矩阵与合法 GET / HEAD。用例名 `<结果> when <条件>`，与同目录英文用例一致 | 无 | +240 | 建议 600，硬上限 800 |
| `composition-root.ts` | 无 | 27 | 0 | 入口硬上限 150 |
| `slots.ts` | 无 | 3 | 0 | 硬上限 600 |
| `ipc-router.ts` | 无 | 244 | 0 | 硬上限 600 |
| `pass-through.ts` | 无 | 33 | 0 | 硬上限 600 |
| `index.ts` | 无 | 59 | 0 | 入口硬上限 150 |

`composition-root.ts` 保持 0 的理由：它已经调用 `startLibrary`。协议注册若写在 `index.ts`，端口就得从 `startLibrary` 再传出来，装配根会按 `assetId` 分支。出现这种改法就停，不加这支。

`ipc-router.ts` 与 `pass-through.ts` 保持 0 的理由：这一批不是 IPC。不暴露新通道，不改错误收口。若实现发现必须改其中某个文件，该文件停在 30 行以内并在 PR 描述写原因；超过 30 行就停。目标仍是 0。

`app-protocol.ts` 要改的理由：现有代码只调用一次 `registerSchemesAsPrivileged`，而且在 ready 之前。本计划不增加第二次调用。Electron 45.2.1 是否拒绝第二次调用，还没在这台机器上跑。实施时若第二次调用失败，回到这一次调用里加方案，不保留两次。

`library-main.ts` 要改的理由：表在它的闭包里。端口不自己 `createReadingGenerationTable()`，避免第二张表。

## 测试矩阵

行为测试调用纯函数，与 `protocol-response.test.ts` 调用 `respond` 相同。404 矩阵不单独起 Electron。主机名规范化那一条停点除外：它在真实 Electron 的 main 进程里请求一次，不开窗口。一条用例用 `createLibraryMain`：临时数据根、导入合成 PDF、bind，再把这个 main 的端口交给纯函数。这样断言端口看的是同一张表。不把代际判断重写进测试。不改 `reading-ipc-wiring.test.ts`。

| 账本 | 本批要覆盖的 | 不在本批 |
| --- | --- | --- |
| 单测 | 上表 404 矩阵；合法 GET / HEAD 的 `application/pdf` 与 `nosniff`；HEAD 体为空；405；响应无路径、无 IPC 码；删除副本后 404 | 不测窗口，不测 PDF.js |
| 代际表 | `locate` 的未登记、撤销、旧 `assetId`、新 `assetId` | 不把第二张表写成杀进程 |
| CI | 实现 tip 的 node 与文档门禁必须跑。本两笔不代替那次 | 不把 CI 全绿写成 G1–G18 都已有 |
| Cloud | 实现 tip 全量只跑一次。`GITLEAKS_BIN` 未设置时的 detect 跳过不是具名 G9 通过 | 不把别的 tip 的通过数写成这一批 |
| Box | 实现阶段跑 `reading-asset-protocol.test.ts` 这一个定向协议测试。本两笔不跑。跑过才写结果。不预写 PASS | 不把 Box 写成真机，也不写成窗口级加载 |
| 真机 | 不跑真机，原因是本批不做窗口级加载。404 矩阵和 GET / HEAD 在 Node 里调用纯函数就能看见。没有必须靠窗口才能验证、而又属于本批的项 | AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏仍未验收。不把 AC-67 ② 整句标成通过：图片类型那一半和 Fuses 不在本批 |

## 可测性

`startLibrary` 的 Node 测试，包括 [apps/desktop/test/library-command-map.test.ts](../../apps/desktop/test/library-command-map.test.ts)，不能因为导入 `electron` 而失败。这个测试现在导入的是 `commandMap`，并且已经 `vi.mock("electron")`。`protocol.handle` 的注册用注入：处理函数文件不 `import "electron"`；`startLibrary` 增加一个注册函数参数，缺省时才调用 `protocol.handle`。调用方不传这个参数，所以 `composition-root.ts` 保持 0。`library-wiring.ts` 的改动不超过 +30 行。做不到就停下来，说明原因，不把 `protocol` 写进测试的 mock 里硬凑。

## 停点

### 主机名规范化

在真实 Electron 的 main 进程里，用 `net.fetch` 或 `session.fetch` 请求一次 `oi-asset://<真实 assetId>`。不开窗口，不涉及 CSP。要核实两件事：`protocol.handle` 实际收到的 URL，以及合法 `assetId` 是否返回 200。

原因：Chromium 对 `standard: true` 的 scheme 可能把纯数字 host 规范化成 IPv4 形式。Node 的 `new URL` 对非特殊方案不会这样做，所以纯函数测试发现不了。

实测：Electron 45.2.1，`xvfb-run -a`，不开窗口。`registerAppScheme` 之后导入合成 PDF 并 bind，`net.fetch("oi-asset://1")`。`protocol.handle` 的 `request.url` 是 `oi-asset://0.0.0.1/`，状态 404。证据在 [docs/evidence/190/commands.md](../evidence/190/commands.md)。解析没有兼容 IPv4。

20:48 批准改 URL，不批准在解析里认 `0.0.0.1`。步骤 5 再测 `oi-asset://asset/<真实 assetId>`。收到的 URL 若再被改写，或合法 id 不是 200，停，不加兼容。

这一步可以在实施环境、Box 的 Electron 或 CI 的 desktop-e2e 里做。环境起不了真实 Electron 时，证据写「还没核实」，交给 Box，不把未跑的结果写成 200。

### 必须开窗口的三项

下面三项必须打开窗口才能验证。本批不加这些测试，也不把它们写成已通过。实施时若发现不做窗口就无法证明本批的 404 或 GET / HEAD，停，不擅自加窗口加载。

- 现行 CSP 能否让 `oi-app` 页面读到 `oi-asset://` 上的 PDF。常量见 `csp.ts`。 [docs/arch/09.md](../arch/09.md) 第 25、32 行：不够用就先写 ADR 并获批，再改草案和 `csp.ts`。本批两处都不改。
- `standard: true` 是否必要。第 15 行仍是待实测。本批只沿用 `oi-app` 已有的那两个特权。
- PDF.js 6.5.438 在 sandbox renderer 里、不经 `blob:` worker，能否打开这个 URL。那是 renderer 接入，本批禁止。

## 禁止项

不改 CSP 常量，不写 ADR。不授予 `bypassCSP`、`supportFetchAPI`、`connect-src oi-asset:`、`wasm-unsafe-eval`、`blob:`，也不授予 `corsEnabled`、`allowServiceWorkers`、`stream`。不写 Range，不返回 206。不做 UI，不在 renderer 里接 PDF.js。不实现 `session.save` / `session.restore`。不暴露新 IPC，不改四条阅读命令的 `expose`。不改 DESIGN 与原则。不含 Ready、合入或发版。

## 不改

`composition-root.ts`、`slots.ts`、`ipc-router.ts`、`pass-through.ts`、`index.ts`、`csp.ts`、contracts、codegen、四个 command 工厂、`reader`、desktop UI、settings、safeStorage、密钥、RULES、CI、门禁。不改 [docs/arch/09.md](../arch/09.md) 第 23 行。重复登记是否沿用同一个 `assetId`、重载或崩溃后是否清表，继续不写成签名。

步骤 5 只改第 16 行和第 22 行里的 URL 形式，从 `oi-asset://<assetId>` 改成 `oi-asset://asset/<assetId>`。同一次加 [docs/spec-changelog.md](../spec-changelog.md) 一行，以及 [tools/compare-spec-bytes/manifest.json](../../tools/compare-spec-bytes/manifest.json) 的唯一替换。不改基线 `f8d5d01`，不改 `compare.mjs`。这两处之外的规格句子不动。

## G12

`check-pr-size` 计算相对 `origin/main` 的增删行，本文件和台账都算。它只排除锁文件和 `workers/parser/oi_worker/protocol/`。非生成行数尽量低于 600。上表「目标」列相加是 580，本文件另计。实施时按目标写，不把新用例堆进已有的大测试文件。超过 600 就先拆文件。拆完仍超过，在那一笔实施提交的说明里写一行具体的 `G12:`，列出本文件、测试和手写代码各多少行。不改 600 的上限。本两笔不写 `G12:`。

## 还没核实

- `standard: true` 是否必要。见停点。本批没有跑 Electron 45.2.1 去核对「`registerSchemesAsPrivileged` 只能调用一次」。
- 纯数字主机名会被收成 IPv4。见「主机名规范化」的实测。步骤 5 改成 `oi-asset://asset/<assetId>` 之后，同一套 Electron main 请求收到的 URL 没有再被改写，合法 id 是 200。见证据。
- 现行 CSP 能否读到这份 PDF。见停点。本批不打开窗口，所以这项保持未核实。
- PDF.js 6.5.438 不经 `blob:` worker 能否打开 `oi-asset://`。见停点。
- 第二个 `createLibraryMain` 仍是空表。这不能代替杀掉 OS 进程再拉起。本批不把「没杀进程」写成重启已验证，也不为协议把代际表入库。
- PRC-01–26 的完整定义表还没找到。这 26 条保持未验收。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「按推荐：开批次 C（oi-asset:// 按 assetId 读 source.pdf，404 安全矩阵）计划加台账两笔的 Draft，不改 CSP、不写 Range、不做 UI；同时让 Loom 为批次 D 做原则检查和设计，不写 UI 代码；不 Ready/合入/发版」 | 本分支只写批次 C 的计划和台账。不实施。Loom 的批次 D 不在本分支写代码。链接：[6739253590](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6739253590) | 2026-11-09 19:45 | Wisdom |
| 查找只用当前代际行，不另建资产表 | 19:45 要求按 `assetId` 读 `source.pdf`。表里已经有当前 `assetId`。第二张表会和 revoke 脱节 | 2026-11-09 | 本计划的选择，Forge 可在 PASS 前退回 |
| 非 GET / HEAD 沿用 405 | oi-app 已是 405。19:45 的 404 矩阵没有这一行 | 2026-11-09 | 本计划的选择，Forge 可在 PASS 前退回 |
| 窗口级 CSP、`standard` 与 PDF.js 不纳入本批测试 | 19:45 不做 UI，也不改 CSP。这三项要开窗口。不够用是停点，不是本批的放宽 | 2026-11-09 | 本计划，依据 19:45 与 [docs/arch/09.md](../arch/09.md) 第 25、32 行 |
| 有条件 PASS：补上主机名规范化停点和 `protocol.handle` 注入之后，按 19:45 进入步骤 4。非 GET / HEAD 仍是 405。PDF 响应仍不带页面 CSP | 审查接受这两项计划选择。纯数字 host 若被收成 IPv4，不在解析里兼容，也不改 URL。链接：[6739448337](https://github.com/wisdom-km/open-immerse-v2/pull/190#issuecomment-6739448337)。GitHub `created_at` 是 `2026-11-09T11:56:22Z` | 2026-11-09 19:56 | Forge 计划审查，非业主决定 |
| 主机名被收成 IPv4 之后停住 | Electron 45.2.1 的 main 进程 `net.fetch("oi-asset://1")`，`protocol.handle` 收到 `oi-asset://0.0.0.1/`，响应 404。不在解析里兼容，也不改 URL。改 [docs/arch/09.md](../arch/09.md) 第 16、22 行必须另外请 Wisdom 批准 | 2026-11-09 | 实施时按停点停下，非业主决定 |
| 「按推荐 A：改成 oi-asset://asset/<assetId>，在 PR190 里同步改 09.md 两句规格，并在 Electron 里实测合法 id 返回 200」 | 停点已经测到纯数字主机名被收成 IPv4。新形式把 `assetId` 放在路径段，主机名固定为 `asset`。只改 09.md 第 16、22 行的 URL 形式。链接：[6740451210](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6740451210)。GitHub `created_at` 是 `2026-11-09T12:48:50Z` | 2026-11-09 20:48 | Wisdom |

批次 D 的原则检查由 Loom 做。本文件不写 UI，也不代替那份检查。Ready、合入和发版不在本文件的范围内。

## 证据链接

- [docs/evidence/190/commands.md](../evidence/190/commands.md)：步骤 4 的全量和旧 URL 的 main 进程 fetch，以及步骤 5 的新 URL 实测。步骤 1 至 3 无。

## 自检

- [x] 影响 arch / prd 吗？步骤 1、2 不影响。步骤 4 也不改 PRD、ARCHITECTURE、changelog 或 manifest。步骤 5 按 20:48 只改 [docs/arch/09.md](../arch/09.md) 第 16、22 行的 URL 形式，并加 changelog 一行与 manifest 的唯一替换。不改 PRD。404 与 `nosniff` 的其余句子不动。
