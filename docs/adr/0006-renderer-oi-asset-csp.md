# 0006 渲染进程在现行 CSP 下读不到 oi-asset PDF

状态：提议。日期：2026-11-10（Asia/Shanghai）。决定人：待 Wisdom。本页不改 CSP，不改协议，不实现阅读屏。

批次 D 计划在 `68635e7a7b859c5afc293f06fd6428367c787bfc` 的「CSP 停点」要求：实现阅读屏之前，先在真实窗口里用现行 [csp.ts](../../apps/desktop/src/main/security/csp.ts)，经 `oi-app://` 让 PDF.js 读取 `oi-asset://asset/<assetId>`。读不到就停，先写 ADR，再请 Wisdom 决定。计划不写这份 ADR。Wisdom 2026-11-10 10:28 原话「OK，那就按照你的建议推进吧。」见 [Issue #174 评论 6757281635](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6757281635)。本页记录这次核对的缺口。

## 背景

现行 CSP 常量是：

`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`

`img-src` 含 `oi-asset:`。`connect-src` 只有 `'self'`。[docs/arch/09.md](../arch/09.md) 把「PDF 数据经 `oi-asset://` 加载是否需要 `supportFetchAPI` 与 `connect-src oi-asset:`」标成待实测。任何放宽都要先有 ADR。renderer 只接收 `assetId`，不接收整份 PDF 字节。

2026-11-10 的窗口核对用 Electron 45.2.1、PDF.js 6.5.438。`BrowserWindow` 的 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。方案注册与响应头走仓库里的 `registerAppScheme`、`handleAppProtocol`、`handleReadingAssetProtocol`，没有改这些文件。文档地址是 `oi-app://app/index.html`。响应头里的 CSP 与上面的常量逐字相同。页面用 `fetch("oi-asset://asset/probe")` 取字节，准备交给 `getDocument({ data, isEvalSupported: false })`。没有设置 `disableRange`。

结果：PDF.js 的脚本从 `oi-app://app/pdf.js` 返回 200。`fetch` 被 `connect-src 'self'` 挡住，`securitypolicyviolation` 的指令是 `connect-src`，被拦的是 `oi-asset`。控制台原文是 `Connecting to 'oi-asset://asset/probe' violates the following Content Security Policy directive: "connect-src 'self'". The action has been blocked.` 网络记录里没有 `oi-asset://` 请求，协议处理器没有收到这一次读取。`getDocument` 没有拿到字节。第一页没有画出来。窗口截图是空白画布。

因此还没有测到的两项：PDF.js 要不要单独的 worker 文件；要不要 `wasm-unsafe-eval` 或 `blob:`。现行静态协议只放行 `.html`、`.js`、`.css`，不放行 `.mjs`。这次为了让脚本能从 `oi-app://` 加载，把 `pdf.mjs` 与 `pdf.worker.mjs` 复制成 `.js` 再提供。worker 文件没有被请求到，因为 `fetch` 已经失败。

## 选项

1. 保持现行 CSP。阅读屏停在这一页，不画原文。
2. 另写 ADR 并获批后，只放宽读这份 PDF 所缺的那一项，再改草案与 `csp.ts`。本次窗口证明缺的是渲染进程对 `oi-asset:` 的连接，不是 Range，也不是 `disableRange`。
3. 经 IPC 把整份 PDF 字节送给渲染进程，或给方案加 `supportFetchAPI`、`bypassCSP`，或写 Range、把 `disableRange` 设成 false。

## 决定

取第 1 条，作为本笔的停点。不选第 2 条的具体放宽，也不选第 3 条。

- 不改 `csp.ts`，不改 [docs/arch/09.md](../arch/09.md) 的 CSP 草案。
- 不改 `oi-asset` 协议，不写 Range，不返回 206。
- 不设置 `disableRange`，也不写 `disableRange: false`。
- 不新增或改用把整份 PDF 字节送进渲染进程的 IPC。
- 不实现批次 D 的阅读屏，不改 `packages/features/library/src/`，不改 `packages/features/reader` 的 core。
- 第 2 条要等 Wisdom 决定缺的连接该怎么补。在那之前，实现不能靠改 CSP 或自造另一条读文件的路继续。

## 后果

- 文献库打开手势仍停在 Draft PR #196。桌面壳还不能把 `onOpen` 接成阅读。
- 批次 D 的 D-03 至 D-18 本笔没有实现。D-19、D-20、AC-11、PRC-10 仍是未满足。
- worker、`wasm-unsafe-eval`、`blob:` 与 `.mjs` 静态放行仍没有窗口证据。连接放行之后要再测一次，才能知道画第一页还缺什么。
- 本页是提议。它不批准改 CSP，也不是 Ready、合入或发版。

## 状态

提议。Wisdom 决定之前，不把本页改成采纳，也不按第 2 条或第 3 条改代码。
