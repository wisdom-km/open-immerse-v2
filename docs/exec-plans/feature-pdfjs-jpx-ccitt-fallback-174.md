# 执行计划

分支 `feature/pdfjs-jpx-ccitt-fallback-174`。基线 `origin/main` `e5a956b3910aa994c89b478bfac26dad9a487541`（#199 已于 2026-11-10 19:12 squash 合入）。第一笔提交只有本文件。

任务类型：UI 改动。切片：`reader`。不改 `packages/features/reader/src/domain`、`application`、`index.ts`、`pure.ts`，不改 `contracts`、`library/src`、主进程、协议注册、CSP。

批准已在 [docs/approvals.md](../approvals.md)（2026-11-10 13:59，评论 [6760278689](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6760278689)）。本分支不重复加这一行。

原话：「按推荐：JPX/CCITT 不进 #199，阿读屏收口后单独开小 Draft，只同源提供 openjpeg/jbig2 两个 nowasm 后备 .js、设 wasmUrl、关 wasm，再窗口核对；不改 CSP，不开 wasm-unsafe-eval，仍缺再停；不 Ready/合入/发版」

## 现状理解

- 已有行为：阅读屏经 `packages/features/reader/src/ui/pdf-session.ts` 的 `startTask` 调用 `getDocument({ data, isEvalSupported: false })`。`apps/desktop/scripts/copy-pdf-worker.mjs` 把 `pdfjs-dist/legacy/build/pdf.worker.mjs` 字节复制成 `apps/desktop/src/renderer/pdf.worker.js`。`apps/desktop/scripts/bundle-renderer.mjs` 用 `spawnSync` 跑这个脚本。`GlobalWorkerOptions.workerSrc` 是 `oi-app://app/pdf.worker.js`。静态协议只按扩展名提供 `.html` / `.js` / `.css`，`.mjs` 是 404。CSP 没有 `wasm-unsafe-eval`，也没有 `blob:`。
- 相关的节：[docs/adr/0009-pdfjs-worker-src.md](../adr/0009-pdfjs-worker-src.md)、[docs/adr/0010-pdf-image-wasm.md](../adr/0010-pdf-image-wasm.md)、[docs/approvals.md](../approvals.md) 2026-11-10 13:59 行。
- 还没做的部分：两个 nowasm 后备 `.js` 没有进渲染目录；`getDocument` 没有 `wasmUrl`，也没有关掉 wasm。窗口里 liushang 第 1 页的 CCITT 和第 31 页的 JPX 因此缺图。

## 两个后备文件

pdfjs-dist 当前版本是 6.5.438（`packages/features/reader/package.json` 与 lockfile）。文件在包内的 `wasm/` 目录，解析方式与 worker 相同：从 `packages/features/reader/package.json` 做 `createRequire`，再 `require.resolve`。

| 包内说明符 | 文件名 | 字节 |
| --- | --- | --- |
| `pdfjs-dist/wasm/openjpeg_nowasm_fallback.js` | `openjpeg_nowasm_fallback.js` | 338458 |
| `pdfjs-dist/wasm/jbig2_nowasm_fallback.js` | `jbig2_nowasm_fallback.js` | 132439 |

同目录还有 `openjpeg.wasm`（220817 字节）和 `jbig2.wasm`（103671 字节）。这两个 `.wasm` 不复制、不入库、不提供。

worker 里的拼接名与上面两个文件名一致：`JpxImage` 的 `_noWasmFilename` 是 `openjpeg_nowasm_fallback.js`，`JBig2CCITTFaxImage` 的 `_noWasmFilename` 是 `jbig2_nowasm_fallback.js`。

## 同源复制

做法参照已有的 `pdf.worker.js`：

1. 在 `apps/desktop/scripts/copy-pdf-worker.mjs` 里，用同一个 `createRequire(packages/features/reader/package.json)` 解析上面两个说明符。
2. `copyFileSync` 到 `apps/desktop/src/renderer/`，目标文件名保持 `openjpeg_nowasm_fallback.js` 和 `jbig2_nowasm_fallback.js`。字节与包内文件一致。
3. 脚本作为主模块被调用时，在现有 worker 复制之后再复制这两个文件。`bundle-renderer.mjs` 已经 `spawnSync` 这个脚本，不再加第二次启动，也不改主进程。
4. 静态协议按扩展名提供 `.js`。渲染根是 `apps/desktop/src/renderer`（`apps/desktop/src/main/index.ts` 的 `rendererRoot`，本 PR 不改它）。请求地址是 `oi-app://app/openjpeg_nowasm_fallback.js` 和 `oi-app://app/jbig2_nowasm_fallback.js`。
5. 两个产物与 `pdf.worker.js` 一样写入 `.gitignore`，不提交生成物。

## getDocument 的选项名和写入位置

名字以打进阅读屏的 pdf.js 6.5.438 为准（`pdfjs-dist/legacy/build/pdf.mjs`，打包后在 `apps/desktop/src/renderer/main.js` 的 `getDocument`）：

- `wasmUrl`。`getFactoryUrlProp(src.wasmUrl)`：不是字符串时变成 `null`；是字符串但结尾不是 `/` 时抛出 `Invalid factory url`。本 PR 传入 `oi-app://app/`。worker 在 `WasmImage.#getJsInstance` 里做动态 `import(\`${wasmUrl}${_noWasmFilename}\`)`。`null` 会拼成说明符 `nullopenjpeg_nowasm_fallback.js`，这是 ADR 0010 记下的报错。
- `useWasm`。`const useWasm = src.useWasm !== false`，缺省为开。本 PR 传入 `false`。`WasmImage.#instantiateWasm` 在 `useWasm` 为假时跳过 `WebAssembly.instantiate`，只走上面的纯 JS `import`。

写入位置：`packages/features/reader/src/ui/pdf-session.ts` 的 `startTask`。现在是 `source.getDocument({ data: bytes, isEvalSupported: false })`。改成同一对象上增加 `wasmUrl: "oi-app://app/"` 与 `useWasm: false`。`isEvalSupported` 仍是 `false`。不传 `disableRange`，不改 `Range`。

类型跟着放宽：`pdf-session.ts` 的 `PdfSource.getDocument`，以及 `packages/features/reader/src/ui/asset-pdf.ts` 里交给 `getDocument` 的参数类型。不改 `packages/features/reader/src/adapters/pdfjs-document.ts`。那条适配器只取页几何，不画这张页。

常量与 `PDF_WORKER_SRC` 放在一起，写在 `packages/features/reader/src/ui/worker-src.ts`：`PDF_WASM_URL = "oi-app://app/"`。

## 不做的事

- 不改 CSP，不开 `wasm-unsafe-eval`。
- 不放 `.wasm`，不放行 `.mjs`，不用 `blob:`。
- 不改协议注册、主进程、core、contracts、`library/src`。
- 不 force-push，不标 Ready，不合入，不发版。

## 窗口核对

文件是环境里的 `/home/ubuntu/.cursor/projects/agent-repos-open-immerse-v2/uploads/liushang_61a9.pdf`。`pdfinfo`：Adobe Acrobat Pro 11.0.0，126 页，PDF 1.7。`pdfimages -list`：181 张 Flate（印成 `image`）、343 张 JPEG、39 张 JPX、2 张 CCITT。第 1 页有 CCITT（`stencil`，116×87）。第 31 页有 JPX（`index`，56×55）。计数与 [docs/evidence/199/commands.md](../evidence/199/commands.md) 里的 liushang 一致。PDF 本体不入库。

核对生产壳第 1 页和第 31 页，截图，并记下控制台有没有缺图或报错。仍缺图就停，另写一份状态为「提议」的 ADR，不再加宽。
