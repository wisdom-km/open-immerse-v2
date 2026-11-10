# 0007 只给 oi-asset 的方案注册加上 supportFetchAPI

状态：采纳。日期：2026-11-10（Asia/Shanghai）。决定人：Wisdom。

批准时间：2026-11-10 11:05（Asia/Shanghai）。原话：「按推荐：只给 oi-asset 的方案注册加上 supportFetchAPI: true，再同等窗口核对；仍缺再停。不连带 bypassCSP/corsEnabled/stream，不改 Range，不走整份 PDF IPC，不 Ready/合入/发版」。来源：[Issue #174 评论 6757816685](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6757816685)。

## 背景

ADR 0006 只把 `connect-src` 增加 `oi-asset:`。同等窗口核对记在 `docs/evidence/198/commands.md`。CSP 头与当时的 `csp.ts` 逐字相同，没有 `connect-src` 违规。`fetch("oi-asset://asset/probe")` 失败。控制台原文：`Fetch API cannot load oi-asset://asset/probe. URL scheme "oi-asset" is not supported.` 协议处理器收到的次数是 0。`getDocument` 没有拿到字节。第一页没有画出来。worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 都没有被请求到。方案注册当时只有 `standard: true` 与 `secure: true`。

## 选项

1. 停在那里。保留 0006 的 `connect-src` 放宽，不继续改。
2. 只给 `oi-asset` 的方案注册加上 `supportFetchAPI: true`，再做同等窗口核对。不连带动 `bypassCSP`、`corsEnabled`、`stream`。
3. 经 IPC 送整份 PDF 字节，或写 Range，或设置 `disableRange`。

## 决定

取第 2 条。Wisdom 2026-11-10 11:05 已选这项。

- `oi-asset` 的特权是 `standard: true`、`secure: true`、`supportFetchAPI: true`。
- `oi-app` 仍只有 `standard: true` 与 `secure: true`。窗口若证明 `oi-app` 也必须加，另写提议 ADR，不在本决定里加。
- 不授予 `bypassCSP`、`corsEnabled`、`allowServiceWorkers`、`stream`。
- 不改 CSP。不追加 `wasm-unsafe-eval` 或 `blob:`。
- 不写 Range，不返回 206，不设置 `disableRange`。
- 不经 IPC 把整份 PDF 字节送给渲染进程。
- 不改 `.mjs` 的静态放行。窗口复核若因 worker、`wasm-unsafe-eval`、`blob:` 或 `.mjs` 失败，另写提议 ADR，不写进 0006 或本页。
- 不实现阅读屏。
- 本决定不是 Ready、合入或发版。

## 后果

- 渲染进程对 `oi-asset:` 的 `fetch` 不再因方案未登记而在发出前被拒。`oi-app` 的 `fetch` 仍不因此放行。
- 核对若仍缺，停在新的提议 ADR。本页不自动放行下一项。

## 状态

采纳。范围只有 `oi-asset` 的 `supportFetchAPI: true`。
