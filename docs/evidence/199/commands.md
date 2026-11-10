# 阅读屏最小主路径

文末一节是同源 `pdf.worker.js` 之后的窗口和全量。这一节是还没设置 `workerSrc` 时的窗口。

全量的对象是 `bd08fadf7f2f5e28f726fdba4b5071ee06e8bc8c`（tree `00ffd4124b62739e4b84167cf90d3027a3aac197`）。这是阅读屏实现 tip。证据提交不重跑全量。Node v22.23.4。pnpm 10.34.9。基线 `origin/main` 是 `e7db04f69e2a705f3d4389727af6f1b1001067c5`。`GATE_BASE=origin/main`。没有手动触发 CI。提交说明里有一行 `G12:`。本机 `GITLEAKS_BIN` 未设置，Vitest 3 个 G9 检测用例跳过，不把它们写成 G9 已通过。没有跑真机 R1–R11。

分支从 #196 tip `a5c67db49708061f87ae0f0a502f629622305ab2` 开出，再 merge #198 tip `b3b72284aa6cb2285ba14ad97b04c24b6067c09a`。merge 提交是 `c921aa24adfd5d436aca72e677effece9e25de06`。没有 merge #197。

## 全量

`corepack pnpm run check` 退出码 0。`check-one-slice` 打印 2 feature slice(s)：比对里有 #196 的 library 和本批的 reader，已有 ADR 0006–0008，门禁通过。`check-pr-size` 打印 2076 non-generated lines。

`corepack pnpm test`：176 个文件，765 通过，3 跳过，0 失败。

`workers/parser/`：ruff check 通过，ruff format --check 通过，pyright 0 errors，lint-imports 7 kept，pytest 181 通过。

## 窗口

Electron 45.2.1。`xvfb-run -a`。生产壳 `apps/desktop/dist/main/index.js`。`webPreferences` 读回 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。文档是 `oi-app://app/index.html`。CSP 头是：

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self' oi-asset:; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

与 `apps/desktop/src/main/security/csp.ts` 的 `CONTENT_SECURITY_POLICY` 逐字相同。没有改 `csp.ts`、方案注册或协议头。

样本是一页 PDF：Helvetica 文字 `Reader page one`，加一个矩形。经文献库导入后，从「全部论文」双击该行。从未打开过的条目不在「最近」里，所以没有从「最近」进。`ingest.openDocument` 写过 `openedAt`，表格里能看到。

`oi-asset://asset/1` 是 fetch，状态 200。代际表的 `assetId` 是 `"1"`，不是文献 id。一次带临时日志的运行读到响应体 624 字节，开头两字节是 37 和 80，即 `%P`。控制台原文：

```text
No "GlobalWorkerOptions.workerSrc" specified.
```

这行日志不在实现 tip 里。去掉日志后再跑，屏幕相同：标题 `sample-note`，「无法打开此文件」，「现在读不到这份 PDF。」，次按钮「返回文献库」。没有画布，没有非白像素。网络类型只有 document、stylesheet、script、fetch。没有 worker、`.mjs`、`wasm`、`blob:`。没有 `securitypolicyviolation`。没有设置 `workerSrc`，没有 `disableRange`，没有把整份 PDF 经 IPC 送进渲染进程。PDF.js 仍是 `{ data, isEvalSupported: false }`。

截图是 [reader-window.png](reader-window.png)。

停在 ADR 0009。不放行 worker、`.mjs`、`wasm-unsafe-eval`、`blob:`。不改 0006、0007、0008。

## 同源 pdf.worker.js

全量的对象是 `3a0ea119bcc7462b5b029119041f55117d0aa2c7`（tree `62df424a9fb64da50c05f49a88e03663c52c0448`）。这是设置 `workerSrc` 之后的实现 tip。证据提交不重跑全量。Node v22.23.4。pnpm 10.34.9。基线 `origin/main` 仍是 `e7db04f69e2a705f3d4389727af6f1b1001067c5`。`GATE_BASE=origin/main`。没有手动触发 CI。没有跑真机 R1–R11。

Wisdom 2026-11-10 12:29 批准只把 `pdf.worker.mjs` 复制成同源 `pdf.worker.js` 并设置 `workerSrc`。构建脚本用子进程调用复制，不再 `import` 同目录脚本。产物 `apps/desktop/src/renderer/pdf.worker.js` 与 `pdfjs-dist@6.5.438` legacy 的 `pdf.worker.mjs` 字节相同，2436164 字节。`GlobalWorkerOptions.workerSrc` 是 `oi-app://app/pdf.worker.js`。初始化参数仍是 `{ data, isEvalSupported: false }`。没有 `disableRange`。没有把整份 PDF 经 IPC 送进渲染进程。不改 CSP，不放行 `.mjs`，不用 `blob:`，不加 `wasm-unsafe-eval`。

### 全量

`corepack pnpm run check` 退出码 0。`check-one-slice` 打印 2 feature slice(s)。`check-pr-size` 打印 2278 non-generated lines。

`corepack pnpm test`：178 个文件，767 通过，3 跳过，0 失败。同一次 tip 上先有一次 Vitest 失败：`catalog.test.ts` 读到 `import-linter.test.ts` 临时写下又删掉的 `workers/parser/oi_worker/preprocess/_gate_pymupdf.py`。从仓库根重跑后通过。本机 `GITLEAKS_BIN` 未设置，3 个 G9 检测用例在 `binary` 阶段跳过，不把它们写成 G9 已通过。

`workers/parser/`：ruff check 通过，ruff format --check 通过，pyright 0 errors，lint-imports 7 kept，pytest 181 通过。

### 窗口

Electron 45.2.1。`xvfb-run -a`。生产壳 `apps/desktop/dist/main/index.js`。`webPreferences` 读回 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。文档是 `oi-app://app/index.html`。CSP 头是：

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self' oi-asset:; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

与 `apps/desktop/src/main/security/csp.ts` 的 `CONTENT_SECURITY_POLICY` 逐字相同。没有改 `csp.ts`、方案注册、静态协议后缀表或协议头。

样本是两页 PDF。第 1 页 Helvetica 文字 `Reader page one`，加一个红矩形。第 2 页文字 `Reader page two`，加一个蓝矩形。经文献库导入后，从「全部论文」双击该行。导入时 `openedAt` 是 null。

`oi-asset://asset/1` 是 fetch，状态 200，`Content-Type` 是 `application/pdf`，`X-Content-Type-Options` 是 `nosniff`，925 字节。`oi-app://app/pdf.worker.js` 状态 200，`Content-Type` 是 `text/javascript; charset=utf-8`，`nosniff`，响应头 CSP 与上面逐字相同，2436164 字节。画布 300×180，非白像素 3375。页码是「第 1 / 2 页」。截图是 [reader-page-drawn.png](reader-page-drawn.png)。

滚到第 2 页，页码变成「第 2 / 2 页」，非白像素仍是 3375。点「返回文献库」之后，`lib_entries.progress_page` 是 2，`opened_at` 是 `2026-11-10T04:52:11.745Z`。同一屏的文献库表格仍把打开时间画成「—」。再双击，打开的是 `oi-asset://asset/2`，状态 200，925 字节；`pdf.worker.js` 再次 200。页码是「第 2 / 2 页」。截图是 [reader-page-restored.png](reader-page-restored.png)。

没有 `securitypolicyviolation`。控制台只有探针读取像素时的 `Canvas2D: Multiple readback operations...`。记下的网络里没有 `.mjs`、`wasm`、`blob:`。ADR 0009 记为采纳。不改 0006、0007、0008。不 Ready，不合入，不发版。

## 含图页

PDF 本体不入库。页码用 poppler 24.02.0 的 `pdfimages -list`。它把 Flate 印成 `image`。前五份的计数与 Forge 给出的一致：Attention 6 张 Flate，DPO 4 张 Flate，DDPM 3 张 Flate 加 19 张 JPEG，Transformer-XL 30 张 Flate，liushang 181 张 Flate 加 343 张 JPEG 加 39 张 JPX 加 2 张 CCITT。后三份也一致：PLOS ONE 11 张 JPEG，BMC 2 张 Flate 加 8 张 JPEG，Elsevier 没有位图。清单里的七份也一致：pcbi-1005421 21 张 JPEG，s41467-018-07210-0 1 张 Flate 加 10 张 JPEG，s41598-023-31124-7 1 张 Flate 加 33 张 JPEG，s41467-026-69035-6 2 张 Flate，pone-0215032 20 张 JPEG，fms-2021-7 2 张 Flate，qe533 没有位图。Producer 也与给出的一致。来源按文件本身归类：四篇 pdfTeX 是 arXiv；liushang 是教科书（Acrobat Pro 11 生成，非期刊），正文是嵌入字体的文字层，不是扫描页；期刊与 Cambridge、Quantitative Economics 都是出版社版。

每份经文献库导入，从「全部论文」双击打开。Electron 45.2.1，`xvfb-run -a`，生产壳。`contextIsolation` 与 `sandbox` 为 true，`nodeIntegration` 为 false。文档是 `oi-app://app/index.html`。每份的 `oi-asset://asset/1` 与 `oi-app://app/pdf.worker.js` 都是 200。资源类型只有 document、stylesheet、script、fetch。没有 `.wasm`、`blob:`、`.mjs`，也没有别的文件请求。没有 `securitypolicyviolation`。

| 文件 | 来源 | 页 | 编码 | 结果 |
| --- | --- | --- | --- | --- |
| Attention | arXiv | 3 | Flate | 画出。Figure 1 的彩色框图在。控制台没有警告。截图 [img-attention-p3.png](img-attention-p3.png) |
| DPO | arXiv | 2 | Flate | 画出。Figure 1 的色带在。控制台没有警告。截图 [img-dpo-p2.png](img-dpo-p2.png) |
| DDPM | arXiv | 6 | JPEG | 画出。Figure 3 与 Figure 4 的照片在。控制台没有警告。截图 [img-ddpm-p6.png](img-ddpm-p6.png) |
| Transformer-XL | arXiv | 3 | Flate | 画出。Figure 1 的两张网络图和正文都在。控制台只有探针的 `getImageData` 警告。截图 [img-xl-p3.png](img-xl-p3.png) |
| liushang | 教科书（Acrobat Pro 11 生成，非期刊） | 1 | JPEG，另有 CCITT | 页画出。JPEG 封面在。CCITT 条码不在。截图 [img-liushang-p1.png](img-liushang-p1.png) |
| liushang | 教科书（Acrobat Pro 11 生成，非期刊） | 31 | JPEG，另有 JPX | 页画出。JPEG 插图在。`img_p30_3` 报 `JpxError: OpenJPEG failed to initialize`。截图 [img-liushang-p31.png](img-liushang-p31.png) |
| PLOS ONE | 出版社版 | 4 | JPEG | 画出。Fig 1 的发病率曲线在。页脚是 4/25。控制台没有应用警告。截图 [img-plos-p4.png](img-plos-p4.png) |
| BMC Public Health | 出版社版 | 3 | JPEG | 画出。Fig 1 的彩色地图在。控制台没有应用警告。截图 [img-bmc-p3.png](img-bmc-p3.png) |
| Elsevier | 出版社版 | 9 | 无位图，矢量图 | 画出。Figure 1 与 Figure 2 的折线和误差棒在。控制台没有应用警告。截图 [img-elsevier-p9.png](img-elsevier-p9.png) |
| pcbi-1005421 | 出版社版 | 4 | JPEG | 画出。Fig 1 的示意图和能量曲线在。页脚是 4/16。控制台没有应用警告。截图 [img-pcbi-p4.png](img-pcbi-p4.png) |
| s41467-018-07210-0 | 出版社版 | 6 | JPEG | 画出。Fig. 4 与 Fig. 5 的彩色图在。控制台没有应用警告。截图 [img-s41467-018-p6.png](img-s41467-018-p6.png) |
| s41598-023-31124-7 | 出版社版 | 5 | JPEG | 画出。Figure 1 的流程图在。控制台没有应用警告。截图 [img-s41598-p5.png](img-s41598-p5.png) |
| s41467-026-69035-6 | 出版社版 | 1 | Flate | 画出。全文只有这一页有位图：刊名条和 Check for updates 图标都在。控制台没有应用警告。截图 [img-s41467-026-p1.png](img-s41467-026-p1.png) |
| pone-0215032 | 出版社版 | 7 | JPEG | 画出。Fig 1 的色带在。页脚是 7/18。控制台没有应用警告。截图 [img-pone-p7.png](img-pone-p7.png) |
| fms-2021-7 | 出版社版 | 1 | Flate | 画出。刊名条、Cambridge 标和 CrossMark 在。另有 PostScript 退回 JS 的警告。截图 [img-fms-p1.png](img-fms-p1.png) |
| qe533 | 出版社版 | 22 | 无位图，矢量图 | 画出。Figure 1 的两条折线在。控制台没有应用警告。截图 [img-qe533-p22.png](img-qe533-p22.png) |

liushang 的控制台还有：`Ensure that the wasmUrl API parameter is provided.`，`Failed to resolve module specifier 'nullopenjpeg_nowasm_fallback.js'`，`nulljbig2_nowasm_fallback.js`，35 条 `JpxError`，一条 `Jbig2Error: JBig2 failed to initialize` 并忽略 XObject。另有 `Failed to compile PostScript function to wasm, falling back to JS`，以及一条 `cMapUrl` 未提供。中文正文仍然画出。这些警告不是 CSP 违规。

Transformer-XL 第一次在绘制未完成时滚动，第二次 `render` 把画布清掉，截图是空白。等该页像素稳定后再导出，图和正文都在。表里用的是这一张。

PLOS 第 4 页与 BMC 第 3 页的 JPEG 在 `pdfimages` 里带 `icc`。这两页没有 `qcms` 或 `wasmUrl` 警告，图仍然画出。Elsevier 没有位图，矢量图也画出。这三份没有新的解码缺口。

清单七份同样没有新的解码缺口。s41467-026-69035-6 的两张 Flate 都在第 1 页，是刊名条和 46×40 的图标。fms-2021-7 的两张 Flate 都在第 1 页，其中一张是软掩膜；刊名条画出。它的控制台有一条 `Failed to compile PostScript function to wasm, falling back to JS`，正文和公式仍在，没有 `.wasm` 请求。qe533 第 22 页没有位图，矢量折线画出。

ADR 0010 仍是提议，范围仍是 JPX 与 CCITT。文件里没有「扫描」这个词。不改 CSP，不提供 `.wasm`，不把缺图改成占位。不 Ready，不合入，不发版。

## Windows 阅读 IPC 超时

`reading-ipc-wiring.test.ts` 的「routes the current generation and rejects the others」在 run 42763194855 的 desktop-e2e-windows 上 5000ms 超时。750eab3→091f7d1 没有改这个文件，也没有改它调用的 library 与 desktop 实现。上一笔 750eab3 的 run 42762754361 里，这个文件 948ms 通过，其中这条用例 450ms。同一失败轮里别的 SQLite 用例也变慢：`open-document-wiring.test.ts` 从 362ms 到 4721ms，`reading-asset-protocol.test.ts` 从 1687ms 到 11198ms。三条都是各自的临时库，没有共用文件。超时和这次文档提交无关，原因是 runner I/O 变慢。没有加超时，没有 skip。

## PDF 释放（Cloud-local）

Anvil 的 worker 与内存数字来自真机和 Box。下面是这台 Cloud Agent 上的对照，不是那两处。

环境：Linux，Electron 45.2.1，Playwright 启动 `apps/desktop/dist/main/index.js`。样本是单页 `sample-note.pdf`。8 轮：文献库双击进入，等到「第 1 / 1 页」，再点「返回文献库」。worker 数是页面里包住 `window.Worker` 后数 `terminate`。内存是 `app.getAppMetrics()` 里 Tab 的 `workingSetSize`，单位 KB。修复前用当时已构建的阅读屏。修复后重新 bundle 再测。这轮没有在绘制中途滚动，所以没有复现「同一 canvas 多次 render」的 pageerror；那个路径在 `pdf-session.test.ts` 和 `page-column.test.tsx`。

|  | worker 创建 | 仍存活 | 已 terminate | Tab working set |
| --- | --- | --- | --- | --- |
| 修复前，回到文献库时 | 8 | 8 | 0 | 124940 → 282960 KB |
| 修复后，回到文献库时 | 8 | 1 | 7 | 125028 → 166648 KB |
| 修复后，destroy 结束后 | 8 | 0 | 8 | 154432 KB |

修复前回到文献库时 8 个 worker 都还在。修复后同一时刻还剩 1 个，因为 `close()` 在写页和 revoke 之后异步销毁，采样时最后一轮的 `loadingTask.destroy()` 还没结束。等它结束后 8 个都已 terminate。两次 pageerror 都是 0。修复后 Tab working set 仍高于进入前（154432 KB，相对基线 125028 KB 多 29404 KB），但不再随着未关闭的 worker 累加。

3517fad 的提交说明写了「destroy 文档」。pdf.js 6.5.438 的 `PDFDocumentProxy` 没有 `destroy`。释放只调用 `loadingTask.destroy()`，它会拆掉 transport 和 worker。已推送的提交说明不改写。

## 标签页工作集（Cloud-local，20 轮）

这一节是 ADR 0011 的测量。环境与上面的 8 轮不同：Linux，`DISPLAY=:1`，Electron 45.2.1，Chrome 156.0.8078.75，Playwright 启动 `apps/desktop/dist/main/index.js`。样本是 PLOS ONE 的 25 页 letter PDF（612×792，2730627 字节）。一次打开画出 25 个 canvas，像素 48470400 字节。这不是 Anvil 的真机，也不是 Box。产品代码离开时只调用 `loadingTask.destroy()`。

Tab working set 来自 `app.getAppMetrics()`，单位 KB。`RssAnon` 与 `RssShmem` 来自该 Tab 的 `/proc/<pid>/status`。JS 堆是 `performance.memory.usedJSHeapSize`，单位字节。worker 数是页面里包住 `window.Worker` 后数 `terminate`。`after` 在 `HeapProfiler.collectGarbage` 之后。`pressure` 是 `Memory.simulatePressureNotification` 的 critical。

| 点 | Tab working set | RssAnon | RssShmem | worker 创建 / 存活 / terminate |
| --- | --- | --- | --- | --- |
| 进入前 | 123204 | 29260 | 2448 | 0 / 0 / 0 |
| 第 1 轮 | 200092 | 85688 | 6848 | 1 / 1 / 0 |
| 第 2 轮 | 225340 | 108888 | 10640 | 2 / 1 / 1 |
| 第 3 轮 | 292616 | 163516 | 20120 | 3 / 1 / 2 |
| 第 4 轮 | 364716 | 207604 | 50712 | 4 / 1 / 3 |
| 第 5 轮 | 477324 | 214080 | 146200 | 5 / 1 / 4 |
| 第 6 轮 | 518604 | 259420 | 151888 | 6 / 1 / 5 |
| 第 7 轮 | 522716 | 269032 | 146200 | 7 / 1 / 6 |
| 第 8 轮 | 536556 | 279192 | 149992 | 8 / 1 / 7 |
| 第 9 轮 | 547604 | 280568 | 149992 | 9 / 1 / 8 |
| 第 10 轮 | 626252 | 334628 | 184120 | 10 / 1 / 9 |
| 第 11 轮 | 708528 | 390296 | 210724 | 11 / 1 / 10 |
| 第 12 轮 | 567884 | 264472 | 195904 | 12 / 0 / 12 |
| 第 13 轮 | 611936 | 301312 | 201592 | 13 / 1 / 12 |
| 第 14 轮 | 577468 | 272160 | 197800 | 14 / 0 / 14 |
| 第 15 轮 | 614652 | 305956 | 201336 | 15 / 1 / 14 |
| 第 16 轮 | 617548 | 308828 | 201336 | 16 / 1 / 15 |
| 第 17 轮 | 586444 | 279496 | 199440 | 17 / 0 / 17 |
| 第 18 轮 | 626752 | 319500 | 201336 | 18 / 1 / 17 |
| 第 19 轮 | 631584 | 329252 | 195648 | 19 / 1 / 18 |
| 第 20 轮 | 626396 | 324596 | 195648 | 20 / 1 / 19 |
| 回收后 | 509428 | 206272 | 195648 | 20 / 0 / 20 |
| 静置 60 秒 | 403404 | 130556 | 165276 | 20 / 0 / 20 |
| critical 压力 | 239688 | 130332 | 1784 | 20 / 0 / 20 |

压力之后 JS 堆 8872512 字节，DOM canvas 0，pageerror 0。同一轮 `usedJSHeapSize`：进入前 7290634 字节，回收后 9630688，压力后 8872512。文件映射 RSS（`RssFile`）：进入前 91496 KB，回收后 107508 KB，压力后 107572 KB。堆快照：`HTMLCanvasElement` 11 个节点、`self_size` 合计 248 字节；`ArrayBuffer` 12 个节点、`self_size` 合计 396 字节。最大节点是脚本文本，单节点 328728 字节。主进程 `process.getProcessMemoryInfo()` 的 `private`：进入前 48584 KB，回收后 55996 KB，压力后 38252 KB。`residentSet` 压力后 178968 KB，低于进入前的 184344 KB。

`smaps` 把可清掉的一块记在 `/memfd:shared-memory-region (deleted)`，把留住的一块记在 `[anon]` 的 private dirty。四轮对照（同一 PDF，只在测量脚本里做，没有进产品代码）：

| 离开方式 | `[anon]` private dirty，进入前 | 四轮后 | 压力后 |
| --- | --- | --- | --- |
| 当前路径，只 `loadingTask.destroy()` | 22536 | 86472 | 86256 |
| 离开前把每个 canvas 的宽高设为 0 | 22660 | 84148 | 84072 |
| `destroy` 前再调用 `PDFDocumentProxy.cleanup()` | 22636 | 92464 | 88292 |

两组改法都没有把匿名页降下来。`cleanup` 那次的 memfd 从四轮后的 121600 KB 降到压力后的 3332 KB。画布清零那次 memfd 一直停在大约 3 MB。没有「修复后」的二十轮曲线，因为产品代码没有改。ADR 0011 提议停下。

## 只画视口附近的页（Cloud-local，同机对照）

Wisdom 2026-11-10 17:51：先测「只画视口附近的页」，不改产品代码。环境与上一节相同：Linux，`DISPLAY=:1`，Electron 45.2.1，Chrome 156.0.8078.75，同一份 PLOS ONE 25 页 PDF。测量方法相同：`app.getAppMetrics()` 的 Tab working set，`/proc/<pid>/status` 的 `RssAnon`、`RssFile`、`RssShmem`，`smaps` 里 `[anon]` 的 private dirty，页面 `performance.memory.usedJSHeapSize`。`after` 在 `HeapProfiler.collectGarbage` 之后。`pressure` 是 critical。这一轮没有再采堆快照和 `memory-infra`。

当前路径一次打开 25 个 canvas，像素 48470400 字节。另一条路径只在测量脚本里做：当前页前后 2 页保留 canvas，其余页把宽高设为 0 并移出 DOM。打开后停在第 1 页，留下第 1–3 页，3 个 canvas，像素 5816448 字节，移出 22 页。pageerror 都是 0。`packages/` 没有改动。

单位都是 KB，JS 堆是字节。worker 是创建 / 存活 / terminate。

四轮：

| 路径 | 点 | working set | RssAnon | RssFile | RssShmem | `[anon]` private dirty | JS 堆 | worker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 当前路径 | 进入前 | 123500 | 29468 | 91592 | 2440 | 19424 | 7293953 | 0 / 0 / 0 |
| 当前路径 | 第 4 轮 | 593972 | 234136 | 102788 | 257048 | 224088 | 14050003 | 4 / 0 / 4 |
| 当前路径 | 回收后 | 434984 | 99796 | 102788 | 232400 | 89748 | 8469393 | 4 / 0 / 4 |
| 当前路径 | 静置 60 秒 | 396712 | 67284 | 102788 | 226640 | 57236 | 8469393 | 4 / 0 / 4 |
| 当前路径 | critical 压力 | 171700 | 67296 | 102788 | 1616 | 57248 | 8469465 | 4 / 0 / 4 |
| 只留 ±2 页 | 进入前 | 123136 | 29440 | 91332 | 2364 | 19396 | 7297537 | 0 / 0 / 0 |
| 只留 ±2 页 | 第 4 轮 | 318832 | 196492 | 102400 | 19940 | 186444 | 21246464 | 4 / 1 / 3 |
| 只留 ±2 页 | 回收后 | 203724 | 98448 | 102400 | 2876 | 88400 | 8497589 | 4 / 0 / 4 |
| 只留 ±2 页 | 静置 60 秒 | 174308 | 70568 | 102400 | 1340 | 60520 | 8497685 | 4 / 0 / 4 |
| 只留 ±2 页 | critical 压力 | 174300 | 70560 | 102400 | 1340 | 60512 | 8497433 | 4 / 0 / 4 |

二十轮：

| 路径 | 点 | working set | RssAnon | RssFile | RssShmem | `[anon]` private dirty | JS 堆 | worker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 当前路径 | 进入前 | 123632 | 29588 | 91624 | 2420 | 19056 | 7293953 | 0 / 0 / 0 |
| 当前路径 | 第 5 轮 | 356360 | 222488 | 102500 | 31372 | 211240 | 13976669 | 5 / 0 / 5 |
| 当前路径 | 第 10 轮 | 488440 | 235776 | 102820 | 149844 | 224340 | 17631999 | 10 / 0 / 10 |
| 当前路径 | 第 15 轮 | 657652 | 260248 | 102820 | 294584 | 248732 | 12398788 | 15 / 0 / 15 |
| 当前路径 | 第 20 轮 | 846744 | 351024 | 102820 | 392872 | 325312 | 11628791 | 20 / 1 / 19 |
| 当前路径 | 回收后 | 634880 | 161940 | 102820 | 370120 | 150452 | 8878109 | 20 / 0 / 20 |
| 当前路径 | 静置 60 秒 | 594256 | 127076 | 102820 | 364360 | 115588 | 8878109 | 20 / 0 / 20 |
| 当前路径 | critical 压力 | 231584 | 127088 | 102820 | 1676 | 115600 | 8878181 | 20 / 0 / 20 |
| 只留 ±2 页 | 进入前 | 123176 | 29556 | 91172 | 2448 | 19504 | 7297537 | 0 / 0 / 0 |
| 只留 ±2 页 | 第 5 轮 | 293476 | 168632 | 101984 | 22176 | 157564 | 16906459 | 5 / 1 / 4 |
| 只留 ±2 页 | 第 10 轮 | 367580 | 245608 | 102048 | 20024 | 235812 | 21978306 | 10 / 1 / 9 |
| 只留 ±2 页 | 第 15 轮 | 407168 | 285108 | 102048 | 20024 | 275284 | 19195053 | 15 / 1 / 14 |
| 只留 ±2 页 | 第 20 轮 | 458368 | 341984 | 102048 | 14336 | 331928 | 22372428 | 20 / 1 / 19 |
| 只留 ±2 页 | 回收后 | 316144 | 211136 | 102048 | 2960 | 201080 | 9061501 | 20 / 0 / 20 |
| 只留 ±2 页 | 静置 60 秒 | 286384 | 182912 | 102048 | 1424 | 172856 | 9061557 | 20 / 0 / 20 |
| 只留 ±2 页 | critical 压力 | 287440 | 183968 | 102048 | 1424 | 173912 | 9061305 | 20 / 0 / 20 |

二十轮压力后，只留附近页的 `[anon]` private dirty 比当前路径高 58312 KB，working set 高 55856 KB。第 20 轮的 `RssShmem` 从 392872 KB 降到 14336 KB。压力后两边的共享内存都在 2 MB 以下。文件映射 RSS 两条路径都停在大约 102 MB。没有改产品代码。滚到中间页再离开没有测。ADR 0011 仍是提议。
