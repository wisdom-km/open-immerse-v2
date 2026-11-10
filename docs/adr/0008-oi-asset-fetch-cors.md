# 0008 只给 oi-asset 加 corsEnabled，响应头只回 oi-app://app

状态：采纳。日期：2026-11-10（Asia/Shanghai）。决定人：Wisdom。

批准时间：2026-11-10 11:32（Asia/Shanghai）。原话：「按推荐：只给 oi-asset 加 corsEnabled，响应头只回 oi-app://app，再窗口核对；仍缺再停。不改 Range，不走整份 PDF IPC，不 Ready/合入/发版」。来源：[Issue #174 评论 6758200444](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6758200444)。

## 背景

ADR 0007 只给 `oi-asset` 加上 `supportFetchAPI: true`。同等窗口核对记在 `docs/evidence/198/commands.md` 第二节。CSP 头与 `csp.ts` 逐字相同。没有 `connect-src` 违规，也没有再报方案不受支持。

`fetch("oi-asset://asset/probe")` 仍失败。控制台原文：`Access to fetch at 'oi-asset://asset/probe' from origin 'oi-app://app' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, chrome-untrusted, data, http, https.` 协议处理器收到的次数是 0。`getDocument` 没有拿到字节。第一页没有画出来。worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 都没有被请求到。当时没有 `corsEnabled`。

## 选项

1. 停在那里。保留 0007，不继续改。
2. 只给 `oi-asset` 加上 `corsEnabled: true`。响应头只回 `Access-Control-Allow-Origin: oi-app://app`。再做同等窗口核对。不给 `oi-app` 加，不写 `*`，不连带动 `bypassCSP`、`stream`、`allowServiceWorkers`。
3. 经 IPC 送整份 PDF 字节，或写 Range，或设置 `disableRange`。

## 决定

取第 2 条。Wisdom 2026-11-10 11:32 已选这项。

- `oi-asset` 的特权是 `standard: true`、`secure: true`、`supportFetchAPI: true`、`corsEnabled: true`。
- `oi-app` 仍只有 `standard: true` 与 `secure: true`。窗口若证明 `oi-app` 也必须加，另写提议 ADR，不在本决定里加。
- `oi-asset` 按现有规则返回的响应，包括成功与拒绝，都带 `Access-Control-Allow-Origin: oi-app://app`。不写 `*`，不按请求来源改写。
- 不授予 `bypassCSP`、`allowServiceWorkers`、`stream`。
- 不改 CSP。不写 Range，不返回 206，不设置 `disableRange`。
- 不经 IPC 把整份 PDF 字节送给渲染进程。
- 不改 `.mjs` 的静态放行。窗口复核若因 worker、`wasm-unsafe-eval`、`blob:` 或 `.mjs` 失败，另写提议 ADR，不写进 0006、0007 或本页。
- 不实现阅读屏。
- 本决定不是 Ready、合入或发版。

## 后果

- `oi-app://app` 页面里对 `oi-asset:` 的跨源 `fetch` 不再因方案不在 CORS 名单里、于进入协议处理器之前被拒。
- 其他来源仍然对不上这个固定响应头。
- 核对若仍缺，停在新的提议 ADR。本页不自动放行下一项。

## 状态

采纳。范围只有 `oi-asset` 的 `corsEnabled: true`，以及响应头 `Access-Control-Allow-Origin: oi-app://app`。
