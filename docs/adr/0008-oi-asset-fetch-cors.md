# 0008 渲染进程跨源 fetch oi-asset 仍被 CORS 挡住

状态：提议。日期：2026-11-10（Asia/Shanghai）。决定人：待 Wisdom。本页不改协议特权，不改 CSP。

ADR 0007 已采纳的放宽只有 `oi-asset` 的 `supportFetchAPI: true`。放宽之后按原话再做窗口核对。这次仍缺，所以停。未获批的项不写进 0006 或 0007。

## 背景

核对条件与上一笔相同：Electron 45.2.1，`BrowserWindow`，`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。文档是 `oi-app://app/index.html`。PDF.js 6.5.438。准备交给 `getDocument` 的参数只有 `{ data, isEvalSupported: false }`。没有设置 `disableRange`。

这次实际注册是一次调用。`oi-app` 只有 `standard: true` 与 `secure: true`。`oi-asset` 是 `standard: true`、`secure: true`、`supportFetchAPI: true`。没有 `bypassCSP`、`corsEnabled`、`allowServiceWorkers`、`stream`。

CSP 头与 `csp.ts` 逐字相同。没有 `connect-src` 违规，也没有再报 `URL scheme "oi-asset" is not supported`。

`fetch("oi-asset://asset/probe")` 仍失败。控制台原文：`Access to fetch at 'oi-asset://asset/probe' from origin 'oi-app://app' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, chrome-untrusted, data, http, https.` 协议处理器收到的次数是 0。网络记录里没有 `oi-asset://`。`getDocument` 没有拿到字节。第一页没有画出来。worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 都没有被请求到。

请求在进入协议处理器之前被挡住。响应头补 `Access-Control-Allow-Origin` 也到不了这一步。

## 选项

1. 停在这里。保留 0007 的 `supportFetchAPI`，不继续改。
2. 另一次批准后，只给 `oi-asset` 的方案注册加上 `corsEnabled: true`，再做同等窗口核对。不给 `oi-app` 加，不连带动 `bypassCSP`、`stream`、`allowServiceWorkers`。
3. 经 IPC 送整份 PDF 字节，或写 Range，或设置 `disableRange`。

## 决定

本页只提议第 1 条，作为这次复核的停点。推荐若要继续，是第 2 条，但本页不选它，也不选第 3 条。

- 不改 `registerSchemesAsPrivileged`。
- 不改 CSP，不追加 `wasm-unsafe-eval` 或 `blob:`。
- 不改 `.mjs` 静态放行。
- 不实现阅读屏。

## 后果

- `supportFetchAPI` 已经落地，但 `oi-app` 页面里的 `fetch` 仍读不到 `oi-asset` 的字节。
- 第 2 条要等 Wisdom 决定。在那之前不改 `corsEnabled`。
- worker 与 wasm 仍没有窗口证据。请求能进协议处理器之后才测得到。
- 本页是提议。它不批准 `corsEnabled`，也不是 Ready、合入或发版。

## 状态

提议。Wisdom 决定之前，不把本页改成采纳。
