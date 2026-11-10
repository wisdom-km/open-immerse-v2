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

## 五份真实 PDF 的含图页

PDF 本体不入库。页码用 poppler 24.02.0 的 `pdfimages -list`。它把 Flate 印成 `image`。计数与 Forge 给出的一致：Attention 6 张 Flate，DPO 4 张 Flate，DDPM 3 张 Flate 加 19 张 JPEG，Transformer-XL 30 张 Flate，liushang 181 张 Flate 加 343 张 JPEG 加 39 张 JPX 加 2 张 CCITT。Producer 也与给出的一致。

每份经文献库导入，从「全部论文」双击打开。Electron 45.2.1，`xvfb-run -a`，生产壳。`contextIsolation` 与 `sandbox` 为 true，`nodeIntegration` 为 false。文档是 `oi-app://app/index.html`。每份的 `oi-asset://asset/1` 与 `oi-app://app/pdf.worker.js` 都是 200。资源类型只有 document、stylesheet、script、fetch。没有 `.wasm`、`blob:`、`.mjs`，也没有别的文件请求。没有 `securitypolicyviolation`。

| 文件 | 页 | 编码 | 结果 |
| --- | --- | --- | --- |
| Attention | 3 | Flate | 画出。Figure 1 的彩色框图在。控制台没有警告。截图 [img-attention-p3.png](img-attention-p3.png) |
| DPO | 2 | Flate | 画出。Figure 1 的色带在。控制台没有警告。截图 [img-dpo-p2.png](img-dpo-p2.png) |
| DDPM | 6 | JPEG | 画出。Figure 3 与 Figure 4 的照片在。控制台没有警告。截图 [img-ddpm-p6.png](img-ddpm-p6.png) |
| Transformer-XL | 3 | Flate | 画出。Figure 1 的两张网络图和正文都在。控制台只有探针的 `getImageData` 警告。截图 [img-xl-p3.png](img-xl-p3.png) |
| liushang | 1 | JPEG，另有 CCITT | 页画出。JPEG 封面在。CCITT 条码不在。截图 [img-liushang-p1.png](img-liushang-p1.png) |
| liushang | 31 | JPEG，另有 JPX | 页画出。JPEG 插图在。`img_p30_3` 报 `JpxError: OpenJPEG failed to initialize`。截图 [img-liushang-p31.png](img-liushang-p31.png) |

liushang 的控制台还有：`Ensure that the wasmUrl API parameter is provided.`，`Failed to resolve module specifier 'nullopenjpeg_nowasm_fallback.js'`，`nulljbig2_nowasm_fallback.js`，35 条 `JpxError`，一条 `Jbig2Error: JBig2 failed to initialize` 并忽略 XObject。另有 `Failed to compile PostScript function to wasm, falling back to JS`，以及一条 `cMapUrl` 未提供。中文正文仍然画出。这些警告不是 CSP 违规。

Transformer-XL 第一次在绘制未完成时滚动，第二次 `render` 把画布清掉，截图是空白。等该页像素稳定后再导出，图和正文都在。表里用的是这一张。

ADR 0010 提议停下。不改 CSP，不提供 `.wasm`，不把缺图改成占位。不 Ready，不合入，不发版。
