# 0010 JPX 与 CCITT 的图片解码

状态：已采纳。日期：2026-11-14（Asia/Shanghai）。决定人：Wisdom。

采纳依据：2026-11-10 13:59 批准实现。原话：「按推荐：JPX/CCITT 不进 #199，阿读屏收口后单独开小 Draft，只同源提供 openjpeg/jbig2 两个 nowasm 后备 .js、设 wasmUrl、关 wasm，再窗口核对；不改 CSP，不开 wasm-unsafe-eval，仍缺再停；不 Ready/合入/发版」。来源：[Issue #174 评论 6760278689](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6760278689)。2026-11-14 12:55 批准把状态改为已采纳并写结果。原话：「按推荐：PR200 先补一笔只改 docs 的提交（ADR 0010 + 索引改为已采纳并写结果），新 tip 过 CI 和 Box 后再来批合入；不 Ready/合入/发版」。来源：[Issue #174 评论 6872029468](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872029468)。

本页不改已采纳的 [0006](0006-renderer-oi-asset-csp.md)、[0007](0007-oi-asset-fetch-scheme.md)、[0008](0008-oi-asset-fetch-cors.md)、[0009](0009-pdfjs-worker-src.md)。不改 CSP，不提供 `.wasm`，不把缺图改成占位。

## 背景

0009 之后，同源 `pdf.worker.js` 能画出 Flate 和 JPEG。同一窗口用五份真实 PDF 再测含图页，记录在 `docs/evidence/199/commands.md` 文末。没有 `securitypolicyviolation`。网络里没有 `.wasm`、`blob:`、`.mjs`。

`pdfimages -list` 把 Flate 印成 `image`。Attention 第 3 页、DPO 第 2 页、Transformer-XL 第 3 页的 Flate 图都画出。DDPM 第 6 页的 JPEG 照片画出。

同一窗口后来又打开三份出版社期刊。PLOS ONE 第 4 页与 BMC 第 3 页的 JPEG 在 `pdfimages` 里带 `icc`，图仍然画出，没有 `wasmUrl` 或 `qcms` 警告。Elsevier 第 9 页没有位图，矢量图画出。这三份没有新的解码缺口。记录在 `docs/evidence/199/commands.md` 的同一张表。

同一张表再追加清单里的七份出版社版。pcbi-1005421、s41467-018-07210-0、s41598-023-31124-7、pone-0215032 的 JPEG 画出。s41467-026-69035-6 与 fms-2021-7 的 Flate 画出。qe533 没有位图，矢量图画出。没有新的解码缺口。

下面记的是当时的缺口。采纳之后的核对在「结果」。当时 liushang 的 JPX 与 CCITT 没有画出：

- 控制台：`#getWasmInstance: UnknownErrorException: Ensure that the wasmUrl API parameter is provided.`
- 接着：`#getJsInstance: TypeError: Failed to resolve module specifier 'nullopenjpeg_nowasm_fallback.js'`，以及同样形式的 `nulljbig2_nowasm_fallback.js`。
- 然后：`JpxError: OpenJPEG failed to initialize`（35 条），`Jbig2Error: JBig2 failed to initialize`，并忽略对应 XObject。
- 第 1 页的 JPEG 封面在。liushang.pdf 第 1 页的 CropBox 本来就不含条码。两张 CCITT 是同一个对象（object 4359），另一处在第 126 页。PR #200 已用 nowasm 后备在第 126 页把它显示出来，证据见本页「结果」。第 31 页的 JPEG 插图在，该页的 JPX 对象 `img_p30_3` 解码失败。

阅读屏的 `getDocument` 只传 `{ data, isEvalSupported: false }`，没有 `wasmUrl`。`pdfjs-dist` 6.5.438 legacy 的 `pdf.mjs` 里，`getFactoryUrlProp` 在参数不是字符串时返回 `null`（约第 13364 行）。`wasmUrl` 因此是 `null`（约第 22615 行）。`useWasm` 在调用方未写 `false` 时为 true（约第 22637 行）。`BaseBinaryDataFactory.fetch` 在地址为空时抛出 `Ensure that the wasmUrl API parameter is provided.`（约第 14122 行）。这次抛出发生在发出 `.wasm` 请求之前，所以窗口里看不到 CSP 违规。

worker 里的 `WasmImage.#instantiateWasm`（`pdf.worker.mjs` 约第 14436 行）先走 `#getWasmInstance`（约第 14422 行），失败后再走 `#getJsInstance`（约第 14411 行）。后者是动态 `import(\`${wasmUrl}${filename}\`)`。`wasmUrl` 为 `null` 时，说明符变成 `nullopenjpeg_nowasm_fallback.js`。

纯 JS 后备文件在包里，不在 worker 打包结果里：

- `pdfjs-dist/wasm/openjpeg_nowasm_fallback.js`，338458 字节。`JpxImage`（约第 15218 行）的 `_filename` 是 `openjpeg.wasm`，`_noWasmFilename` 是 `openjpeg_nowasm_fallback.js`。对应的 `openjpeg.wasm` 是 220817 字节。
- `pdfjs-dist/wasm/jbig2_nowasm_fallback.js`，132439 字节。`JBig2CCITTFaxImage`（约第 14479 行）的 `_filename` 是 `jbig2.wasm`，`_noWasmFilename` 是 `jbig2_nowasm_fallback.js`。`CCITTFaxStream.decodeImage`（约第 14557 行）调用这个类。对应的 `jbig2.wasm` 是 103671 字节。

这两份 `.js` 这次没有被加载。Flate 的 JS 解码在 worker 的 `FlateStream` 里，不靠这两个文件。这次的 JPEG 也没有请求 `.wasm`。

## 选项

1. 打开 `wasm-unsafe-eval`，并同源提供 `.wasm`。代价：CSP 要新增特权，0006 与 0009 都没有批。至少要再提供 `openjpeg.wasm` 与 `jbig2.wasm`。`WebAssembly.instantiate` 会在渲染进程的 worker 里编译这两份二进制。这次测量没有走到那一步，不能把「尚未出现的 CSP 违规」写成已经看见。ICC 用的 `qcms_bg.wasm` 不在本页范围内。
2. 这类图先显示占位。代价：不改 CSP，不增加文件。JPX 与 CCITT 仍然解不出来。占位只是把现在的空洞标出来。条码、JPX 软掩膜和小幅 JPX 图继续不可读。JPEG 与 Flate 保持现状。本轮不实现占位。

纯 JS 后备是包内文件。写提议时它还不是已经选中的做法，要启用仍要设置 `wasmUrl` 并让 worker 动态导入那两份 `.js`。2026-11-10 13:59 选中这件事。

## 决定

取纯 JS 后备。Wisdom 2026-11-10 13:59 批准实现。Wisdom 2026-11-14 12:55 批准把本页改为已采纳。

- 同源提供 `openjpeg_nowasm_fallback.js` 与 `jbig2_nowasm_fallback.js`，设置 `wasmUrl`，关闭 wasm。
- 不改 CSP，不开 `wasm-unsafe-eval`，不提供 `.wasm`，不把缺图改成占位。
- 本决定不是 Ready、合入或发版。

## 结果

Anvil QA 在 `a7abcff` 上用 liushang.pdf（SHA256 `645d4519…3345`，pdfimages 共 39 JPX + 2 CCITT）核对。第 1、31、126 页在 Box 和真机 DESKTOP-0GI64S8 上都显示。第 126 页的 CCITT 条码可见。

JpxError / Jbig2Error 在本 PR 上是 0/0，main `e5a956b` 对照是 39/2。`.wasm` 请求 0，CSP 违规 0。

已知遗留：10 条「Failed to compile PostScript function to wasm, falling back to JS」warning。main 上同样存在，与本 ADR 无关。推断与现行 CSP 不允许 wasm 编译有关，未实测；无论是否如此，不开 `wasm-unsafe-eval`，不处理。

不覆盖：其他含 JPX/CCITT 的 PDF、8GB 机器。

## 后果

- Flate 与这次测到的 JPEG 可以继续画。
- 这一份 liushang.pdf 上已核对的 JPX 与 CCITT 见「结果」。不把这次结果写成覆盖其他 PDF。
- 不改 CSP，不开 `wasm-unsafe-eval`，不提供 `.wasm`。以后若要启用 wasm 或占位，另批。不在本页放行。
- 本决定不是 Ready、合入或发版。

## 状态

已采纳。范围是同源提供两个 nowasm 后备 `.js`，设置 `wasmUrl`，关闭 wasm。不改 CSP，不开 `wasm-unsafe-eval`，不提供 `.wasm`。
