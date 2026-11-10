# 0006 渲染进程读取 oi-asset 只放宽 connect-src

状态：采纳。日期：2026-11-10（Asia/Shanghai）。决定人：Wisdom。

批准时间：2026-11-10 10:50（Asia/Shanghai）。原话：「按推荐：只把 connect-src 增加 oi-asset:，单独开小 Draft 改草案和 csp.ts，再窗口核对；仍缺再停。不改 Range，不走整份 PDF IPC，不 Ready/合入/发版」。来源：[Issue #174 评论 6757588782](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6757588782)。

窗口证据在 Draft PR #197，tip `84bc80216972c786bb846a2b3c4cdb2ceb5e6af8`。那次核对的 ADR 提交是 `60df4bbdef8fca31ca3f9da45d2cb32c55631bb4`。记录在 [../evidence/197/commands.md](../evidence/197/commands.md)。

## 背景

#197 在 Electron 45.2.1 的真实窗口里打开 `oi-app://app/index.html`。响应头 CSP 与当时的 `csp.ts` 逐字相同，`connect-src` 只有 `'self'`。PDF.js 6.5.438 的脚本返回 200。`fetch("oi-asset://asset/probe")` 被 `connect-src 'self'` 挡住。`securitypolicyviolation` 的指令是 `connect-src`，被拦的是 `oi-asset`。网络记录里没有 `oi-asset://`，协议处理器没有收到读取。`getDocument({ data, isEvalSupported: false })` 没有拿到字节。没有设置 `disableRange`。第一页没有画出来。

当时还没有测到 worker 文件、`wasm-unsafe-eval`、`blob:`。静态协议不放行 `.mjs`。探针把 `pdf.mjs` 复制成 `.js` 后脚本才返回 200。

## 选项

1. 保持当时的 CSP。阅读屏继续停着。
2. 只把 `connect-src` 增加 `oi-asset:`，改草案和 `csp.ts`，再做一次同等条件的窗口核对。仍缺就再停。
3. 经 IPC 送整份 PDF 字节，或授予 `supportFetchAPI`、`bypassCSP`，或写 Range、把 `disableRange` 设成 false。

## 决定

取第 2 条。Wisdom 2026-11-10 10:50 已选这项最小放宽。

- `connect-src` 从 `'self'` 改为 `'self' oi-asset:`。其他指令一字不改。
- 不授予 `bypassCSP`、`supportFetchAPI`、`corsEnabled`、`stream`、`wasm-unsafe-eval`、`blob:`，也不放宽 `worker-src` 或 `script-src`。
- 不写 Range，不返回 206，不设置 `disableRange`。
- 不经 IPC 把整份 PDF 字节送给渲染进程。
- 不改 `.mjs` 的静态放行。窗口复核若因缺少 `.mjs` 失败，另写提议 ADR，不在本决定里放行。
- 不实现阅读屏，不接线 `onOpen`。
- 放宽之后用与 #197 同等的窗口再核对。仍缺则停，不把未批项写进本页。

## 后果

- 渲染进程对 `oi-asset:` 的连接不再被这条 `connect-src` 挡住。
- `supportFetchAPI`、worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 仍未获批。复核若碰到它们，本页不自动放行。
- 本决定不是 Ready、合入或发版。

## 状态

采纳。范围只有 `connect-src` 增加 `oi-asset:`。
