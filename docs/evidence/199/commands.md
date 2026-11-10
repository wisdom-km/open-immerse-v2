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

`reading-ipc-wiring.test.ts` 的「routes the current generation and rejects the others」在 run 42763194855 的 desktop-e2e-windows 上 5000ms 超时。750eab3→091f7d1 没有改这个文件，也没有改它调用的 library 与 desktop 实现。上一笔 750eab3 的 run 42762754361 里，这个文件 948ms 通过，其中这条用例 450ms。同一失败轮里别的 SQLite 用例也变慢：`open-document-wiring.test.ts` 从 362ms 到 4721ms，`reading-asset-protocol.test.ts` 从 1687ms 到 11198ms。三条都是各自的临时库，没有共用文件。超时和这次文档提交无关，是那台 Windows runner 上 SQLite 变慢。没有加超时，没有 skip。
