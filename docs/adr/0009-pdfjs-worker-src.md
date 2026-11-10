# 0009 PDF.js 打开文档需要 workerSrc，本批不放行

状态：提议。日期：2026-11-10（Asia/Shanghai）。决定人：尚未批准。

本页记录阅读屏实现后的窗口停点。不改已采纳的 [0006](0006-renderer-oi-asset-csp.md)、[0007](0007-oi-asset-fetch-scheme.md)、[0008](0008-oi-asset-fetch-cors.md)。

## 背景

阅读屏按已批的最小主路径打开文献。调用顺序是 `ingest.openDocument` 完成，然后 `library.bindReadingAsset`，然后 `library.getProgressPage` 与 `fetch(oi-asset://asset/<assetId>)`。PDF.js 6.5.438 legacy 的初始化参数只有 `{ data, isEvalSupported: false }`。没有设置 `GlobalWorkerOptions.workerSrc`，没有 `disableRange`，没有把整份 PDF 经 IPC 送进渲染进程。

窗口是 Electron 45.2.1，`xvfb`，`contextIsolation: true`，`sandbox: true`，`nodeIntegration: false`。地址是 `oi-app://app/index.html`。CSP 响应头与 `apps/desktop/src/main/security/csp.ts` 的 `CONTENT_SECURITY_POLICY` 逐字相同。用的是一页带 Helvetica 文字和矩形的小 PDF，经文献库双击进入阅读屏，不是探针红方块。

`oi-asset://asset/1` 返回 200。响应体 624 字节，开头是 `%P`。阅读屏标题是文件名。随后 PDF.js 抛出 `No "GlobalWorkerOptions.workerSrc" specified.` 画布没有出现。界面是「无法打开此文件」和「现在读不到这份 PDF。」这次抛出发生在创建 `Worker` 之前，所以网络记录里没有 worker、`.mjs`、`wasm` 或 `blob:`。控制台没有 `securitypolicyviolation`。

pdfjs-dist 自带的 worker 只有 `pdf.worker.mjs`。静态协议只放行 `.html`、`.js`、`.css`，不放行 `.mjs`。0006 已写明：窗口若因缺少 `.mjs` 失败，另写提议 ADR，不在已采纳页放行。把 `workerSrc` 指到那个 `.mjs` 就会发出未批请求，所以这次没有设置它。

## 选项

1. 停在这里。不设置 `workerSrc`，不放行 `.mjs`，不加 `wasm-unsafe-eval`，不加 `blob:`，不把 worker 复制成 `.js`。阅读屏继续显示打不开的那句。
2. 另批一种不新增 CSP 指令、不请求 `.mjs`、不用 `blob:` 的接法，例如把 worker 打进现有渲染脚本并在主线程运行。这条还没测，不知道会不会再要 `wasm-unsafe-eval`。本页不选。
3. 放行 `.mjs`，或把 `pdf.worker.mjs` 复制成 `.js` 再请求。0006 不授权这条。本页不选。

## 决定

取第 1 条，作为提议。等 Wisdom 选择之前，不改 CSP、方案注册、协议头、Range，也不改 0006、0007、0008。

## 后果

- 阅读屏的打开、回页、离开和文案可以评审。真实小 PDF 的第一页这一次没有画出来。
- worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 仍未获批。
- 本决定不是 Ready、合入或发版。

## 状态

提议。尚未取代任何已采纳的决定。
