# 0010 JPX 与 CCITT 的图片解码

状态：提议。日期：2026-11-10（Asia/Shanghai）。决定人：待 Wisdom。

本页不改已采纳的 [0006](0006-renderer-oi-asset-csp.md)、[0007](0007-oi-asset-fetch-scheme.md)、[0008](0008-oi-asset-fetch-cors.md)、[0009](0009-pdfjs-worker-src.md)。不改 CSP，不提供 `.wasm`，不把缺图改成占位。

## 背景

0009 之后，同源 `pdf.worker.js` 能画出 Flate 和 JPEG。同一窗口用五份真实 PDF 再测含图页，记录在 `docs/evidence/199/commands.md` 文末。没有 `securitypolicyviolation`。网络里没有 `.wasm`、`blob:`、`.mjs`。

`pdfimages -list` 把 Flate 印成 `image`。Attention 第 3 页、DPO 第 2 页、Transformer-XL 第 3 页的 Flate 图都画出。DDPM 第 6 页的 JPEG 照片画出。

liushang 的 JPX 与 CCITT 没有画出：

- 控制台：`#getWasmInstance: UnknownErrorException: Ensure that the wasmUrl API parameter is provided.`
- 接着：`#getJsInstance: TypeError: Failed to resolve module specifier 'nullopenjpeg_nowasm_fallback.js'`，以及同样形式的 `nulljbig2_nowasm_fallback.js`。
- 然后：`JpxError: OpenJPEG failed to initialize`（35 条），`Jbig2Error: JBig2 failed to initialize`，并忽略对应 XObject。
- 第 1 页的 JPEG 封面在，左下角 CCITT 条码不在。第 31 页的 JPEG 插图在，该页的 JPX 对象 `img_p30_3` 解码失败。

阅读屏的 `getDocument` 只传 `{ data, isEvalSupported: false }`，没有 `wasmUrl`。`pdfjs-dist` 6.5.438 legacy 的 `pdf.mjs` 里，`getFactoryUrlProp` 在参数不是字符串时返回 `null`（约第 13364 行）。`wasmUrl` 因此是 `null`（约第 22615 行）。`useWasm` 在调用方未写 `false` 时为 true（约第 22637 行）。`BaseBinaryDataFactory.fetch` 在地址为空时抛出 `Ensure that the wasmUrl API parameter is provided.`（约第 14122 行）。这次抛出发生在发出 `.wasm` 请求之前，所以窗口里看不到 CSP 违规。

worker 里的 `WasmImage.#instantiateWasm`（`pdf.worker.mjs` 约第 14436 行）先走 `#getWasmInstance`（约第 14422 行），失败后再走 `#getJsInstance`（约第 14411 行）。后者是动态 `import(\`${wasmUrl}${filename}\`)`。`wasmUrl` 为 `null` 时，说明符变成 `nullopenjpeg_nowasm_fallback.js`。

纯 JS 后备文件在包里，不在 worker 打包结果里：

- `pdfjs-dist/wasm/openjpeg_nowasm_fallback.js`，338458 字节。`JpxImage`（约第 15218 行）的 `_filename` 是 `openjpeg.wasm`，`_noWasmFilename` 是 `openjpeg_nowasm_fallback.js`。对应的 `openjpeg.wasm` 是 220817 字节。
- `pdfjs-dist/wasm/jbig2_nowasm_fallback.js`，132439 字节。`JBig2CCITTFaxImage`（约第 14479 行）的 `_filename` 是 `jbig2.wasm`，`_noWasmFilename` 是 `jbig2_nowasm_fallback.js`。`CCITTFaxStream.decodeImage`（约第 14557 行）调用这个类。对应的 `jbig2.wasm` 是 103671 字节。

这两份 `.js` 这次没有被加载。Flate 的 JS 解码在 worker 的 `FlateStream` 里，不靠这两个文件。这次的 JPEG 也没有请求 `.wasm`。

## 选项

1. 打开 `wasm-unsafe-eval`，并同源提供 `.wasm`。代价：CSP 要新增特权，0006 与 0009 都没有批。至少要再提供 `openjpeg.wasm` 与 `jbig2.wasm`。`WebAssembly.instantiate` 会在渲染进程的 worker 里编译这两份二进制。这次测量没有走到那一步，不能把「尚未出现的 CSP 违规」写成已经看见。ICC 用的 `qcms_bg.wasm` 不在本页范围内。
2. 这类图先显示占位。代价：不改 CSP，不增加文件。JPX 与 CCITT 仍然解不出来。占位只是把现在的空洞标出来。条码、JPX 软掩膜和小幅 JPX 图继续不可读。JPEG 与 Flate 保持现状。本轮不实现占位。

纯 JS 后备是包内文件，不是当前配置里已经生效的路径。要启用它，仍要设置 `wasmUrl` 并让 worker 动态导入那两份 `.js`。本页不把这件事当成已经选中的做法。

## 决定

先不选。不改 CSP，不提供 `.wasm`，不改 `wasmUrl`，不把缺图改成占位。

## 后果

- Flate 与这次测到的 JPEG 可以继续画。
- JPX 与 CCITT 继续缺。缺的是解码，不是静态协议的后缀表。
- 以后若要启用 wasm 或占位，另批。不在本页放行。

## 状态

提议。范围只记录这次窗口里 JPX 与 CCITT 的缺口。
