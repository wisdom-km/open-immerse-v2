# 架构决定索引

状态：索引。日期：2026-11-08（Asia/Shanghai）。

这里只指向已经写在规格里的决定，不重写决定，也不另写一份规格。Q1–Q12 的问题、取舍和结论在 [差异清单](../v2-gap-and-changes.md) §6，落点在 [ARCHITECTURE.md](../../ARCHITECTURE.md) §16。

M1 要登记的第一批独立 ADR 仍未建页：`formula-source`、Markdown 的依赖边、`budget`、`packages/providers` 与外发检查、G18、`ui-events-declared`、`supervisor-state`、解析规则集 `oi-rules/1`（ARCHITECTURE §16 末段）。`ingest` 的九条边、删除的 `repair → quality`，以及存储与协议的升级规则已成页，见下表。其余页建成之前，新增依赖边的 PR 仍按该段更新架构图。本索引不代替那条规则。0001 是 2026-11-04 另记的一页，不在这一批里。

## 新决定用的模板

以后单独成页时用下面五节（Michael Nygard，*Documenting Architecture Decisions*，2011）。现在不要为了填模板去改规格正文。

- **背景**：要解决的问题，以及当时的约束。
- **选项**：考虑过的做法，各一条。
- **决定**：选了哪一个。
- **后果**：因此更容易和更难的事。
- **状态**：提议 / 采纳 / 被取代。被取代时改状态并指向新页，不在正文里追加「后来改为」。

## 索引

| 编号 | 问的是什么 | 记录在 |
| --- | --- | --- |
| Q1 | MiniCPM-OCR 与 Jev 是否照用，评分怎么算 | 差异清单 §6 的 Q1 行；ARCHITECTURE §16 的 Q1 行 |
| Q2 | 无服务时是否回落文字层 | 差异清单 §6 的 Q2 行；ARCHITECTURE §16 的 Q2 行 |
| Q3 | 是否只做桌面并支持远程 worker；界面与核心是否解耦 | 差异清单 §6 的 Q3 行；ARCHITECTURE §16 的 Q3 行 |
| Q4 | arXiv 源码校准是否进入 v2 | 差异清单 §6 的 Q4 行；ARCHITECTURE §16 的 Q4 行 |
| Q5 | 写作辅助是否移出 v2 | 差异清单 §6 的 Q5 行；ARCHITECTURE §16 的 Q5 行 |
| Q6 | PDF 库与项目许可证 | 差异清单 §6 的 Q6 行；ARCHITECTURE §16 的 Q6 行 |
| Q7 | 本机 worker 用什么传输 | 差异清单 §6 的 Q7 行；ARCHITECTURE §16 的 Q7 行 |
| Q8 | 是否做 v1 数据迁移器 | 差异清单 §6 的 Q8 行；ARCHITECTURE §16 的 Q8 行 |
| Q9 | Jev 部署在本地还是 API | 差异清单 §6 的 Q9 行；ARCHITECTURE §16 的 Q9 行。2026-11-02 16:38 起非 Jev 的本地是第二路线；同日 17:03 起 Jev 的两条路线在契约里都是一等；同日 17:21 起最小 Jev 托管 API 客户端在 M1，M6a 接入完整流程。见差异清单 §6.15 与 ARCHITECTURE §16。本索引不抄原文 |
| Q10 | 引擎 A 的版面模型从哪一档起步 | 差异清单 §6 的 Q10 行；ARCHITECTURE §16 的 Q10 行 |
| Q11 | 未配置翻译时能否借用多模态 | 差异清单 §6 的 Q11 行；ARCHITECTURE §16 的 Q11 行 |
| Q12 | Unlimited-OCR 是否接入 | 差异清单 §6 的 Q12 行；ARCHITECTURE §16 的 Q12 行 |

## 已成页

| 编号 | 问的是什么 | 记录在 |
| --- | --- | --- |
| 0001 | M4 桌面端：术语抽取与外发同意、术语库的领域来源、数据目录迁移、路径只显示名称。§9.1 已采纳；接口签名各自实现时走接口 PR | [0001-m4-desktop-ui.md](0001-m4-desktop-ui.md) |
| 0002 | `ingest` 的九条出边。任何切片都不依赖 `ingest` | [0002-ingest-edges.md](0002-ingest-edges.md) |
| 0003 | 删除 `repair → quality`。补救只产出候选，重新评分由 `ingest` 调 `quality` | [0003-repair-quality-removed.md](0003-repair-quality-removed.md) |
| 0004 | 存储版本与协议版本合为一页。`app_schema`、迁移备份、更高版本只读、JSON `schemaVersion`，以及 `OI-Protocol` 的兼容规则。驱动用 `node:sqlite` | [0004-storage-and-protocol-versions.md](0004-storage-and-protocol-versions.md) |
| 0005 | 只暂缓 `allows a synthetic key that uses the oitest_ prefix (G9)` 的隔离，到 PR-C 合入前。不改 §4 的通用规则 | [0005-g9-oitest-quarantine-exception.md](0005-g9-oitest-quarantine-exception.md) |
| 0006 | 渲染进程读取 `oi-asset` 时，只把 `connect-src` 增加 `oi-asset:`。状态是采纳 | [0006-renderer-oi-asset-csp.md](0006-renderer-oi-asset-csp.md) |
| 0007 | 渲染进程 `fetch` `oi-asset` 时，只给该方案注册加上 `supportFetchAPI: true`。状态是采纳 | [0007-oi-asset-fetch-scheme.md](0007-oi-asset-fetch-scheme.md) |
| 0008 | 只给 `oi-asset` 加 `corsEnabled: true`，响应头只回 `oi-app://app`。状态是采纳 | [0008-oi-asset-fetch-cors.md](0008-oi-asset-fetch-cors.md) |
| 0009 | PDF.js worker 使用构建时复制的同源 `pdf.worker.js`。状态是采纳。不改 CSP，不放行 `.mjs`，不用 `blob:` | [0009-pdfjs-worker-src.md](0009-pdfjs-worker-src.md) |
| 0010 | JPX 与 CCITT 的图片解码。状态是提议。不改 CSP，不提供 `.wasm`，不把缺图改成占位 | [0010-pdf-image-wasm.md](0010-pdf-image-wasm.md) |
| 0011 | 阅读屏进出后标签页工作集不回落。状态是已采纳。#199 不改运行时。视口绘制记作之后的单独候选，暂不开工 | [0011-tab-working-set.md](0011-tab-working-set.md) |

Q1–Q12 之后的其余决定（处理路线、API 优先、外发同意、Markdown、架构评审修复、PR C，2026-10-31 的 D-D、D-E、W-4，以及 2026-11-02 的面壁 API 主路线、同日 Jev 契约与 Jev API 客户端里程碑）仍只记在 ARCHITECTURE §16 与差异清单 §6.1–§6.15。本索引不抄那些段落。0001、0002、0003、0004、0005、0006、0007 的正文在各自的页上，这里不重抄。0006 已采纳，范围只有 `connect-src` 增加 `oi-asset:`。0007 已采纳，范围只有 `oi-asset` 的 `supportFetchAPI: true`。`oi-app` 不加。0008 已采纳，范围只有 `oi-asset` 的 `corsEnabled: true`，响应头只回 `oi-app://app`。0009 已采纳，范围只有把 `pdfjs-dist` 6.5.438 legacy 的 `pdf.worker.mjs` 复制成同源 `pdf.worker.js` 并设置 `workerSrc`。不改 CSP，不放行 `.mjs`，不用 `blob:`，不加 `wasm-unsafe-eval`。不改 0006、0007、0008。0010 是提议：JPX 与 CCITT 因没有 `wasmUrl` 解不开。不改 CSP，不提供 `.wasm`，不把缺图改成占位。0011 已采纳（Wisdom 2026-11-10 18:25）：进出阅读屏后留下的是标签页 `[anon]` 私有脏页；memfd 共享内存能被压力通知清掉。#199 不为这个问题改运行时。视口绘制（只改 `page-column.tsx`）记作 #199 之后的单独候选，暂不开工。不实现画布清零，不调用 `cleanup`。不改 CSP、协议注册、主进程、core、contracts、`library/src`。
