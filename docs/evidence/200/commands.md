# 200 窗口核对

Refs #174。Wisdom 2026-11-10 13:59。分支 `feature/pdfjs-jpx-ccitt-fallback-174`。

PDF 是环境里的 `liushang_61a9.pdf`，不入库。`pdfinfo`：Adobe Acrobat Pro 11.0.0，126 页，PDF 1.7。页尺寸 521.577 × 737.008 pt，这是 CropBox。MediaBox 是 0 0 1133.86 810.71。`pdfimages -list`：181 张 Flate（印成 `image`）、343 张 JPEG、39 张 JPX、2 张 CCITT。第 1 页有一张 CCITT（`stencil`，116×87，是封底 ISBN 条码）。第 31 页有一张 JPX（`index`，56×55）。计数与 [../199/commands.md](../199/commands.md) 里的 liushang 一致。

Electron 45.2.1。生产壳 `apps/desktop/dist/main/index.js`。`webPreferences` 读回 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。文档是 `oi-app://app/index.html`。

`oi-asset://asset/1` 是 200。`oi-app://app/pdf.worker.js` 是 200。`oi-app://app/openjpeg_nowasm_fallback.js` 是 script，200。`oi-app://app/jbig2_nowasm_fallback.js` 是 script，200。没有 `.wasm`、`.mjs`、`blob:`。没有 `securitypolicyviolation`。

控制台没有 `JpxError`，没有 `Jbig2Error`，没有 `Ensure that the wasmUrl API parameter is provided`。有 10 条 `Failed to compile PostScript function to wasm, falling back to JS`。有 `cMapUrl` 未提供，与 #199 记下的那类警告相同。本 PR 不处理这两条。

第 1 页画布是 522×738。CropBox 是封面正面。JPEG 封面画出，含书桌、两个孩子和出版社名。截图 [img-liushang-p1.png](img-liushang-p1.png)，窗口 [window-p1.png](window-p1.png)。CCITT 条码在 MediaBox 的封底，坐标在 CropBox 之外，阅读视口不显示它。解码器没有报 `Jbig2Error`。

第 31 页画布是 522×738。四个小动物图标都在。截图 [img-liushang-p31.png](img-liushang-p31.png)，窗口 [window-p31.png](window-p31.png)。没有 `JpxError`。

显示出来的页没有缺图。不另写提议 ADR。ADR 0010 仍是提议。
