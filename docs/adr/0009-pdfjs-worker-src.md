# 0009 PDF.js worker 使用同源 pdf.worker.js

状态：采纳。日期：2026-11-10（Asia/Shanghai）。决定人：Wisdom。

批准时间：2026-11-10 12:29（Asia/Shanghai）。原话：「按推荐：只把 pdf.worker.mjs 复制成同源 pdf.worker.js 并设 workerSrc，再窗口核对；仍缺再停。不改 CSP，不放行 .mjs，不用 blob:，不 Ready/合入/发版」。来源：[Issue #174 评论 6759014930](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6759014930)。

本页不改已采纳的 [0006](0006-renderer-oi-asset-csp.md)、[0007](0007-oi-asset-fetch-scheme.md)、[0008](0008-oi-asset-fetch-cors.md)。

## 背景

阅读屏在 tip `26c3d0557952a6ad4daebe993a603802ccaff38e` 之前没有设置 `GlobalWorkerOptions.workerSrc`。同等窗口里 `oi-asset` 已返回 PDF 字节，PDF.js 6.5.438 legacy 抛出 `No "GlobalWorkerOptions.workerSrc" specified.`，第一页没有画出来。记录在 `docs/evidence/199/commands.md` 的上一节。

pdfjs-dist 自带的 worker 只有 `pdf.worker.mjs`。静态协议只放行 `.html`、`.js`、`.css`。0006 写明缺 `.mjs` 时另写提议，不在已采纳页放行。

## 选项

1. 继续不设置 `workerSrc`。阅读屏保持打不开。
2. 构建时把 `pdfjs-dist` 6.5.438 legacy 的 `pdf.worker.mjs` 按字节复制成渲染目录里的 `pdf.worker.js`，由现有 `oi-app://app/` 静态协议按 `.js` 提供。`GlobalWorkerOptions.workerSrc` 设为 `oi-app://app/pdf.worker.js`。不改 CSP，不放行 `.mjs`，不用 `blob:`。再做窗口核对。仍缺就再停。
3. 放行 `.mjs`，或加 `wasm-unsafe-eval`、`blob:`，或改静态协议的后缀表。

## 决定

取第 2 条。Wisdom 2026-11-10 12:29 已选这项。

- 复制的是 legacy `pdf.worker.mjs`，与阅读屏加载的 `pdfjs-dist/legacy/build/pdf.mjs` 同一包、同一版本 6.5.438。产物字节与源文件一致。
- `workerSrc` 是 `oi-app://app/pdf.worker.js`。PDF.js 发现它与页面同源后，用自带的 `new Worker(url, { type: "module" })`。不手造 `blob:`。
- 初始化参数仍只有 `{ data, isEvalSupported: false }`。不设置 `disableRange`。不经 IPC 送整份 PDF。
- 不改 `csp.ts`。不改方案注册。静态协议允许的后缀表不改。`.mjs` 请求仍是 404。
- 响应仍是已有的 `text/javascript; charset=utf-8` 与 `X-Content-Type-Options: nosniff`。

窗口核对在本 PR 的 `docs/evidence/199/`。`pdf.worker.js` 返回 200。两页小 PDF 的第一页画出文字和矩形。滚到第 2 页后离开，`progress_page` 写成 2，再打开仍是第 2 页。没有 `securitypolicyviolation`。这次没有请求 `.mjs`、`wasm` 或 `blob:`。

## 后果

- 这一份小 PDF 可以在当前 CSP 下画出页面。
- `.mjs` 仍然不放行。`wasm-unsafe-eval` 与 `blob:` 仍然不授予。以后的 PDF 若再要它们，另写提议 ADR，不在本页放行。
- 本决定不是 Ready、合入或发版。

## 状态

采纳。范围只有把 legacy `pdf.worker.mjs` 复制成同源 `pdf.worker.js` 并设置 `workerSrc`。
