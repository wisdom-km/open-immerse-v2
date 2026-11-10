# 0007 渲染进程的 fetch 仍不接受 oi-asset 方案

状态：提议。日期：2026-11-10（Asia/Shanghai）。决定人：待 Wisdom。本页不改协议特权，不改 CSP。

ADR 0006 已采纳的放宽只有 `connect-src` 增加 `oi-asset:`。放宽之后按原话再做窗口核对。这次仍缺，所以停。未获批的项不写进 0006。

## 背景

核对条件与 PR #197 相同：Electron 45.2.1，`BrowserWindow`，`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。文档是 `oi-app://app/index.html`。PDF.js 6.5.438。准备交给 `getDocument` 的参数只有 `{ data, isEvalSupported: false }`。没有设置 `disableRange`。方案注册仍只有 `standard: true` 与 `secure: true`，没有 `supportFetchAPI`。

生效的 CSP 头与改后的 `csp.ts` 逐字相同，其中 `connect-src` 是 `'self' oi-asset:`。没有 `connect-src` 违规。

`fetch("oi-asset://asset/probe")` 失败。控制台原文：`Fetch API cannot load oi-asset://asset/probe. URL scheme "oi-asset" is not supported.` 协议处理器收到的次数是 0。`getDocument` 没有拿到字节。第一页没有画出来。worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 都没有被请求到。

[docs/arch/09.md](../arch/09.md) 仍写注册不给 `supportFetchAPI`，并把「是否需要 `supportFetchAPI`」留在待实测。这次窗口说明：只放宽 `connect-src` 之后，渲染进程的 `fetch` 仍不会把 `oi-asset:` 交给协议处理器。

## 选项

1. 停在这里。保留 0006 的 `connect-src` 放宽，不继续改。
2. 另一次批准后，只给 `oi-asset` 的方案注册加上 `supportFetchAPI: true`，再做同等窗口核对。不连带动 `bypassCSP`、`corsEnabled`、`stream`。
3. 经 IPC 送整份 PDF 字节，或写 Range，或设置 `disableRange`。

## 决定

本页只提议第 1 条，作为这次复核的停点。不选第 2 条，也不选第 3 条。

- 不改 `registerSchemesAsPrivileged`。
- 不改 CSP 的其他指令，不追加 `wasm-unsafe-eval` 或 `blob:`。
- 不改 `.mjs` 静态放行。
- 不实现阅读屏。

## 后果

- `connect-src` 的放宽已经落地，但渲染进程仍读不到这份 PDF 的字节。
- 第 2 条要等 Wisdom 决定。在那之前不改方案特权。
- worker 与 wasm 仍没有窗口证据。方案能被 `fetch` 之后才测得到。
- 本页是提议。它不批准 `supportFetchAPI`，也不是 Ready、合入或发版。

## 状态

提议。Wisdom 决定之前，不把本页改成采纳。
