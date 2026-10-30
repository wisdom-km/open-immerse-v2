# v1 审查：哪些能用上，哪些用不上

日期：2026-10-30（Asia/Shanghai）。状态：审查结论，供 v2 实施引用。
审查对象：旧仓库 [wisdom-km/open-immerse](https://github.com/wisdom-km/open-immerse) `main@96f1dfe`（父提交 `e9e00e4` = 标签 `v0.3.0`）。以只读方式 clone 到临时目录，push 地址已置为无效值；**未修改、未推送、未在旧仓库开任何 PR / Issue / 评论**。
本文所有 `路径:行号` 均指上述快照，并已逐个抽查。链接前缀：`https://github.com/wisdom-km/open-immerse/blob/96f1dfe263fd1138775cb84053e97dff707ae09a/`。
相关规格：[PRD.md](../PRD.md)、[ARCHITECTURE.md](../ARCHITECTURE.md)、[RULES.md](../RULES.md)；设计文件 [DESIGN.md](../DESIGN.md) 与 [design-principles.md](./design-principles.md) 待 Loom 产出。

---

## 0. 结论先行

**能用上的是「规则、算法、数据结构、测试用例、经验教训」，不是「代码文件」。** v1 是零构建的 Chrome MV3 扩展，业务规则大量与 `chrome.*`、DOM、IndexedDB 和一个 16,641 行的入口文件缠在一起；v2 是 Electron + TS + Python worker 的分层架构。因此：

| 结论 | 含义 | 规模（`lib/` 156 个文件） |
| --- | --- | --- |
| **复用规则** | 纯函数或近纯函数：把规则与原测试用例一起移植成 TS（或 Python），行为不变 | 约 60 个文件，集中在公式校验、占位符、块号、锚点、阅读顺序几何、脱敏、网络策略 |
| **按职责重写** | v2 需要这项能力，但 v1 实现绑定扩展宿主或混合多职责；按 v2 切片重写，保留其行为要求与测试意图 | 约 55 个文件 + `pdf/viewer.js` 全部 |
| **丢弃** | 网页翻译、扩展外壳、学习中心、文档翻译、整页多模态替换等 v2 范围外或已证伪的能力 | 约 25 个文件 + `content/`、`popup/`、`manifest.json` 等 |
| **参考** | 标注工具、实验报告、评测脚本：不进产品，但作为基准与证据保留 | 约 15 个文件 + `labels/`、`corpus/`、`scripts/` |

最值得带走的十件事（详见 §4）：

1. 公式「候选 → 校验 → 才上屏，否则原页裁图」的整套判据：字符集 Jaccard ≥ 0.9、公式编号一致、KaTeX `throwOnError` 可渲染、单家 / 两家不一致直接裁图。
2. 翻译占位符 `⟦fN⟧` 与 `blockTranslationIntegrity`：占位序列与引用编号必须一致，否则拒绝。
3. 稳定块号 `bid`（内容 + 页，而非渲染顺序）与 `resolveBlockAnchor` 的 bid → 别名 → 源文头 → TextQuote → lost 降级链。
4. 笔记锚点结构（原文 + 译文双 TextQuote、`srcHash` 漂移检测、lost 保留原页不删）。
5. 裁图几何：18px 参考字号、按墨迹裁 + 行内 4 / 行间 6 像素留边、邻行墨迹 > 5% 判废、多模态图 4 倍栅格与上下文红框。
6. 缓存键必须带「公式管线版本」（v1 因漏掉它出现过陈旧公式译文的事故）。
7. 网络策略：按用途区分超时（翻译 60 s、多模态 90 s）、多模态最多重试 1 次、账号并发 3、429 不记失败缓存。
8. 诊断包：字段白名单（正文一律丢弃）、7 天 / 2 MB、密钥与 URL token 正则脱敏。
9. 存储端口：`StorageBackend` 只用 IndexedDB 与 SQLite 都有的能力、事务回调只能 await 后端自身请求，并有共享契约测试。
10. 整页多模态替换（#189）真机 7 轮不收敛的复盘：版面先定、块号来自版面、版面一变按页作废。

最重要的「用不上」：`pdf/viewer.js` 整体、全部网页翻译与扩展外壳、整页多模态替换、OCR 层（v1 只有桩）、矢量重绘（v1 未实现）、77 个读源码字符串断言的测试、35 个依赖 Chrome 的测试的实现方式。

## 1. 范围与方法

- 统计：`git ls-files` 共 1,285 个文本文件、约 22.7 万行（含 `labels/` 标注数据 777 个文件）。产品代码：`lib/` 156 个、`pdf/` 64 个、`background/` 3 个、`content/` 4 个、`options/` 7 个、`popup/` 4 个；测试 195 个 `*.test.mjs`；文档 96 个。
- 历史：435 个提交，2026-09-08 至 2026-10-29。
- 方法：逐文件读头注释与导出；统计每个 `lib/` 文件被哪些入口引用（pdf / content / popup / options / background）；对公式链路、文献库、笔记、诊断、阅读顺序、测试资产做深入阅读；与 `pdf/high-precision/*.md`、`docs/*.md` 规格交叉核对，记录代码与文档不一致处（§7）。
- 只读核对了 v1 的规格与决策文档，引用时注明「文档」或「代码」，二者不一致时以代码为准并单独列出。

## 2. 模块盘点

表头：**文件 | 行数 | 职责 | 与 PDF 的关系 | 结论 | v2 去向**。v2 去向使用 [ARCHITECTURE.md](../ARCHITECTURE.md) §4 的切片名。「间接」= 被 PDF 阅读器使用但本身不是 PDF 逻辑。

### 2.1 入口与宿主

| 文件 | 行数 | 职责 | 与 PDF | 结论 | v2 去向 |
| --- | --- | --- | --- | --- | --- |
| `pdf/viewer.js` | 16,641 | PDF 阅读器的全部装配与大部分业务（见 §3） | 核心 | 按职责重写（拆成 ≥ 12 个切片的数十个文件） | 见 §3 |
| `pdf/viewer.html` / `viewer.css` / `reader-tokens.css` | 299 / 3,671 / 614 | 阅读器结构与样式；`reader-tokens.css:425` 定义 18px 公式参考字号 | 核心 | 丢弃实现；数值规则进 `formula/domain/crop-geometry.ts`，视觉交给 Loom | reader/ui（按 DESIGN.md 重做） |
| `pdf/notes-panel.js` / `.css` | 1,915 / 955 | 笔记面板与阅读面标记 | 核心 | 按职责重写 | notes/ui |
| `pdf/library-panel.js` / `.css` | 1,170 / 562 | 文献库侧栏 | 核心 | 按职责重写 | library/ui |
| `pdf/ask-panel.js` / `.css` | 829 / 586 | 问答面板 | 核心 | 按职责重写 | qa/ui |
| `pdf/drawer-panel.js` / `.css` | 758 / 432 | 目录 / 说明 / 最近 | 核心 | 按职责重写 | reader/ui |
| `pdf/vendor/*` | — | pdf.js 4.10.38、KaTeX 0.18.7、markdown-it 14.1.0（含补丁说明 `docs/vendor-pdfjs.md`） | 核心 | 丢弃 vendored 文件，改用 npm 锁定版本；补丁说明作参考 | reader（`pdfjs-dist`）、formula（`katex`） |
| `background/service-worker.js` | 539 | MV3 后台：22 种 `OI_*` 消息路由（翻译、设置、学习、站点规则、arXiv、公式缓存、诊断） | 间接 | 丢弃；其中能力分别归入切片用例 | translation / settings / diagnostics |
| `background/arxiv-source.js` | 510 | arXiv e-print 下载、冷却、缓存（`:8-10` 间隔 3 s、超时 20 s、冷却 24 h） | 核心 | **复用规则**（限速、冷却、原因码、缓存键）；下载与存储实现重写 | formula-source（Q4，见 §4.17） |
| `background/formula-cache.js` | 364 | IndexedDB `oi-formula` 公式决策缓存 | 核心 | 按职责重写为 SQLite 表；键规则复用 | formula/adapters |
| `content/*`（4 个） | 1,820 | 网页内容脚本、页内工具条、字幕 | 无 | **丢弃** | — |
| `popup/*`（4 个） | 571 | 工具栏弹窗 | 无 | **丢弃** | — |
| `options/options.js` / `.html` / `.css` | 2,506 / 402 / 1,105 | 设置页（8 个子页） | 间接 | 按职责重写；子页清单与验收编号参考 `docs/settings-spec.md` | settings/ui |
| `options/data-panel.js` | 919 | 数据管理（导入导出、用量） | 间接 | 按职责重写 | library/ui、settings/ui |
| `options/diag-panel.js` | 186 | 诊断导出 / 清空 | 间接 | 按职责重写 | diagnostics/ui |
| `options/route.js` | 48 | 设置页路由与旧 hash 重定向 | 间接 | 丢弃 | — |
| `documents/*`、`learning/*` | 366 / 265 | 文档翻译页、学习中心 | 无 | **丢弃**（PRD §3.2） | — |
| `manifest.json`、`_locales/`、`icons/` | — | MV3 清单与扩展资源 | 无 | **丢弃** | — |

### 2.2 公式链路（`lib/formula-*`、`lib/formula-tiers/*`）

| 文件 | 行数 | 职责 | 与 PDF | 结论 | v2 去向 |
| --- | --- | --- | --- | --- | --- |
| `formula-contract.js` | 223 | 层级 ID、结果形状、失败原因、缓存键、阈值常量 | 核心 | **复用规则** | formula/domain |
| `formula-chain.js` | 259 | 兜底链调度（纯函数，依赖注入） | 核心 | **复用规则**（顺序按 v2 调整，见 §4.1） | formula/domain/formula-policy.ts |
| `formula-verify.js` | 458 | 候选校验：去尾标点、邻词安全网、字符集 + KaTeX | 核心 | **复用规则** | formula/domain |
| `formula-charset.js` | 394 | LaTeX 与 PDF 文本的字符集与 Jaccard | 核心 | **复用规则** | formula/domain/charset-check.ts |
| `formula-arbiter.js` | 72 | 两家候选仲裁 | 核心 | **复用规则** | formula/domain |
| `formula-render-equiv.js` | 72 | KaTeX MathML 等价（评测用） | 核心 | **复用规则**（作基准指标） | formula/domain、基准脚本 |
| `formula-arxiv-gate.js` | 106 | 公式编号一致、对齐可复用判定 | 核心 | **复用规则** | formula/domain（编号）、formula-source/domain（对齐复用，Q4） |
| `formula-katex.js` | 86 | KaTeX 闸门（`throwOnError`、`trust:false`、长度上限 8000） | 核心 | **复用规则** | formula/adapters/katex-renderer.ts |
| `formula-pipeline.js` | 289 | 公式管线版本 `fp-1` 与陈旧判定 | 核心 | **复用规则**（作为缓存键组成） | translation/domain/cache-key.ts |
| `formula-schedule.js` | 241 | 单个公式块走链 | 核心 | 按职责重写 | formula/application |
| `formula-cache.js` | 618 | 决策缓存（只缓存多模态 / OCR） | 核心 | 复用键规则，存储重写 | formula/adapters |
| `formula-cache-client.js` | 76 | 阅读器侧缓存客户端（经 service worker） | 核心 | 丢弃 | — |
| `formula-mm-ledger.js` | 191 | 每页多模态计数账本（非金额） | 核心 | 复用思路；v2 账本改为金额 / 次数双口径 | repair/domain/budget-ledger.ts |
| `formula-context-crop.js` | 624 | 行内公式上下文窗与红框 | 核心 | **复用规则**（几何），渲染重写 | formula/domain/crop-geometry.ts + worker render |
| `formula-vision-crop.js` | 396 | 发给多模态的裁图（4 倍栅格、留边） | 核心 | **复用规则** | repair/domain |
| `formula-crop-png.js` | 91 | PNG data URL 校验（拒绝 http URL） | 核心 | 复用规则 | repair/adapters |
| `formula-settings.js` | 794 | 公式开关与模型设置（`chrome.storage.local`） | 核心 | 按职责重写 | settings |
| `formula-settings-ui.js` | 486 | 公式设置 DOM | 核心 | 按职责重写 | settings/ui |
| `formula-flags.js` | 15 | 第零层开关常量 | 核心 | 丢弃 | — |
| `formula-svg.js` | 697 | 从录制的页面路径生成独立公式 SVG（未接入链路） | 核心 | 参考（矢量重绘若再立项时用） | — |
| `formula-arxiv-pane.js` / `-session.js` | 293 / 269 | 第零层右栏 DOM 与会话 | 核心 | 会话规则复用（失败原因文案键、来源统计），DOM 与偏好存储丢弃 | formula-source（Q4，见 §4.17） |
| `formula-tiers/arxiv.js` | 154 | 第零层：只读已有对齐，逐公式核对 | 核心 | **复用规则** | formula/adapters/arxiv-source-candidates.ts |
| `formula-tiers/multimodal.js` | 404 | 多模态候选层 `mm-6` | 核心 | 复用规则（提示词、红框、失败分类）；调用重写 | repair |
| `formula-tiers/crop.js` | 151 | 裁图层与质检 | 核心 | **复用规则** | formula/domain |
| `formula-tiers/self.js` | 42 | 自建算法：纯文本关系白名单 | 核心 | 复用规则 | formula/domain |
| `formula-tiers/placeholder.js` | 30 | 占位决策 | 核心 | 复用规则 | formula/domain |
| `formula-tiers/ocr.js` | 23 | OCR 层**桩**（`available()` 恒 false） | 核心 | 丢弃实现；位置由引擎 A 的公式识别承担 | parsing（worker） |
| `formula-tiers/vector.js` | 20 | 矢量层**未实现**（恒 skip） | 核心 | 丢弃 | — |
| `formula-tiers/index.js` | 19 | 层注册 | 核心 | 丢弃 | — |

### 2.3 PDF 解析、块与阅读顺序

| 文件 | 行数 | 职责 | 与 PDF | 结论 | v2 去向 |
| --- | --- | --- | --- | --- | --- |
| `pdf-text-layer.js` | 4,374 | 文字层 → 块（正文句子、公式与图裁图）；强依赖 pdf.js `textContent` | 核心 | 按职责重写；其中的常量与规则逐条移植（§4.2、§4.13） | parsing/domain/text-layer/* |
| `pdf-viewer.js` | 2,765 | 页面 / 全文翻译调度、栏判定 `readingOrderLines`（`:2152`） | 核心 | 按职责重写；栏判定规则移植 | parsing/domain、translation/application |
| `pdf-blocks.js` | 746 | `blocks-1` 协议、裁图数学、占位符与完整性 | 核心 | **复用规则**（占位 / 完整性 / 标签集）；协议升级为 v2 文档模型 | translation/domain、document/domain |
| `pdf-block-id.js` | 298 | 稳定块号 `bid` 与锚点解析 | 核心 | **复用规则** | document/domain/block-id.ts、notes/domain |
| `pdf-flow-join.js` | 471 | 跨栏 / 跨页句子续接（MinerU 式规则） | 核心 | **复用规则** | parsing/domain/text-layer、worker reading_order/continuation.py |
| `pdf-late-page-join.js` | 46 | 后到页的前向续接 | 核心 | 复用规则 | parsing/domain |
| `pdf-xy-cut.js` | 282 | 递归 XY-cut（**生产未接线**，仅测试使用） | 核心 | **复用规则**（作为引擎 A 阅读顺序的起点之一） | worker reading_order/xy_cut.py |
| `pdf-flow-gate.js` | 383 | 用 LaTeX 源做阅读顺序真值对齐评分 | 核心 | 参考（基准工具） | 基准脚本 |
| `pdf-journal-chrome.js` | 144 | 期刊页眉页脚、DOI / ISSN 等装饰剔除（需位置） | 核心 | **复用规则** | parsing/domain/text-layer |
| `pdf-glyph-sanitize.js` | 538 | 不可见字符、Symbol 编码、连字洞清洗 | 核心 | **复用规则** | parsing/domain/text-layer |
| `pdf-leak-rules.js` | 104 | 文字层泄漏计数（a / b / c / r2） | 核心 | **复用规则**（作为质量指标） | quality/domain、基准 |
| `pdf-latex.js` | 163 | 从文字层公式恢复可复制 LaTeX（不 OCR、不编造） | 核心 | 复用规则（作为「文字层候选」来源） | formula/domain |
| `pdf-plaintext-formula.js` | 39 | 留在句内的简单关系白名单 | 核心 | 复用规则 | formula/domain |
| `pdf-formula-raster.js` | 705 | 公式 / 图 / 表高清重渲染 | 核心 | 复用数值规则，渲染重写 | reader/ui、worker preprocess |
| `pdf-formula-size.js` | 369 | 显示尺寸：18px 参考、0.75 下限、行内宽帽 | 核心 | **复用规则** | formula/domain/crop-geometry.ts |
| `pdf-formula-redraw.js` | 47 | 从页面栅格按字形框拼图（非矢量） | 核心 | 参考 | — |
| `svg-recorder.js` | 783 | 录制 Canvas2D 路径（未接入链路） | 核心 | 参考 | — |
| `page-elements.js` | 175 | 文本项 + 路径 + 图像的元素清单（标注用） | 核心 | 参考（基准工具） | 基准脚本 |
| `pdf-layout-client.js` | 608 | 旧本机服务 `127.0.0.1:8765` 的 `/v1/layout` 客户端 | 核心 | 丢弃（v2 用 oi-parse/1） | — |
| `pdf-layout-adapter.js` | 250 | 厂商版面信封 → `blocks-1`，丢弃公式 / 表格字母 | 核心 | 复用规则（「视觉块不带未核验文字」） | parsing/adapters |
| `pdf-layout-cache.js` / `-key.js` / `-route.js` | 151 / 21 / 16 | 版面缓存与键 | 核心 | 键规则复用，实现丢弃 | document/adapters |
| `pdf-structure-schema.js` / `-render.js` | 684 / 187 | 标题页结构包 `oi.pdf.structure.v1` | 核心 | 复用 schema 思路（标题、作者、摘要） | document/domain |
| `pdf-mirror.js` | 1,058 | 译文版面镜像 V3 | 核心 | 按职责重写（v2 版面镜像待 Loom） | reader/ui |
| `pdf-readout.js` | 311 | 右栏通读：块 → Markdown | 核心 | 复用规则 | document/domain（Markdown 投影） |
| `pdf-pairing.js` | 621 | 块配对、跟随、跳转锁、栏序数学（无 DOM） | 核心 | **复用规则** | reader/domain/pairing.ts |
| `pdf-scroll.js` | 182 | 滚动辅助 | 核心 | 复用规则 | reader/domain/scroll-sync.ts |
| `pdf-reader-flow.js` | 976 | 读者 UI：字号阶梯、页标记（**不是**阅读顺序算法） | 核心 | 按职责重写（视觉归 Loom） | reader/ui |
| `pdf-source-mode.js` | 154 | 原文栏显示模式 | 核心 | 按职责重写 | reader/ui |
| `pdf-sel-toolbar.js` | 356 | 选区工具条位置与动作注册 | 核心 | 复用「动作注册表」思路 | reader/ui/selection-toolbar.tsx |
| `pdf-body-font.js` / `pdf-paper.js` / `pdf-reader-cjk.js` | 137 / 84 / 52 | 右栏字号、纸宽、CJK 字体探测 | 核心 | 按职责重写 | reader/ui |
| `pdf-text-lane.js` / `render-deadline.js` | 27 / 37 | pdf.js 读取串行化、渲染超时 | 核心 | 复用经验（pdf.js `cancel()` 不可靠） | reader/ui |
| `pdf-default-notice.js` / `pdf-paper.js` | 51 / 84 | 升级提示 | 间接 | 丢弃 | — |

### 2.4 多模态与网络

| 文件 | 行数 | 职责 | 与 PDF | 结论 | v2 去向 |
| --- | --- | --- | --- | --- | --- |
| `mm-client.js` | 705 | 视觉请求层（公式与问答共用；密钥只在请求时读取） | 核心 | 复用规则，重写为端口实现 | repair/adapters、qa/adapters |
| `mm-caps.js` | 149 | 各模型 Chat Completions 字段差异 | 核心 | 复用（作为 provider 能力表） | repair/adapters |
| `mm-probe.js` | 219 | 连通性探测（内置 PNG） | 间接 | 复用思路 | settings/use-cases/test-connection |
| `vision-png.js` | 255 | 小图补边到厂商最小尺寸 | 核心 | 复用规则 | repair/adapters |
| `mm-page.js` / `-queue.js` / `-swap.js` / `-invalidate.js` / `-ui.js` | 446 / 171 / 235 / 146 / 168 | **整页多模态替换**（`mm-page.js:21` 默认关） | 核心 | **丢弃**（#189 未收敛；v2 多模态只处理低分区域） | — |
| `mm-reconcile.js` | 437 | 多模态页与文字层逐段核对（纯函数） | 核心 | 参考（若将来做 A/B 区域对比可借） | document/domain（候选比较） |
| `mm-dpo-ab.js` | 934 | DPO 论文多模态 A/B 实验报告 | 核心 | 参考 | 基准 |
| `net/fetch.js` | 816 | 统一出站 HTTP：按用途超时、重试、并发、脱敏、测试中拒绝未打桩请求 | 间接 | **复用规则** | platform-node/http |
| `providers.js` | 965 | 13 家翻译引擎适配、两步润色、错误脱敏 | 间接 | 复用规则（两步润色、思考字段判定、错误脱敏）；适配器重写，一家一个文件 | translation/adapters/providers/* |
| `translate-skill.js` | 119 | 厂商无关的翻译提示词契约 | 核心 | **复用规则** | translation/domain |
| `translate-borrow.js` | 128 | 未配置翻译时借用多模态引擎 | 间接 | 复用规则（Q11 已决定：保留，默认关，开启时提示会消耗多模态额度） | settings/domain/translation-fallback.ts |
| `translate-abort.js` | 45 | 在途翻译取消表 | 间接 | 重写（`AbortSignal`） | translation/application |
| `translate-limit.js` | 79 | 网页只译标题 + 首段 | 无 | **丢弃** | — |
| `provider-attention.js` / `no-engine-prompt.js` / `usage-format.js` | 40 / 24 / 39 | 引擎提示、用量格式 | 间接 | 按职责重写 | settings/ui |

### 2.5 文献库、存储与平台

| 文件 | 行数 | 职责 | 与 PDF | 结论 | v2 去向 |
| --- | --- | --- | --- | --- | --- |
| `library-store.js` | 2,327 | 文献库（论文、页、版面、分组、来源、变更流），IndexedDB `oi-annotations` v2 | 核心 | 复用数据模型与规则；存储重写为 SQLite，拆分到 library / document / translation | library、document、translation |
| `library-record.js` | 254 | 纯记录辅助：SHA-256 身份、来源 URL 脱敏、100 MB 上限 | 核心 | **复用规则** | library/domain |
| `pdf-library.js` | 2,143 | 已存译文的恢复与复用规则；旧 8765 读路径 | 核心 | 复用规则（§4.11）；8765 读路径丢弃 | translation/domain、library |
| `library-session.js` / `-writes.js` / `-auto-pause.js` | 203 / 85 / 110 | 会话、跨标签删除保护、中断续译 | 核心 | 复用规则（「删除后不被旧写入复活」） | library/application |
| `library-chip.js` / `-copy.js` / `-layout.js` / `persist-card.js` / `storage-copy.js` | 790 / 207 / 191 / 103 / 124 | 文献库界面与文案 | 核心 | 按职责重写 | library/ui |
| `import-run.js` / `legacy-folder.js` | 1,079 / 287 | 文件夹 / JSON 导入，读旧本机服务目录 | 核心 | **丢弃**（Q8 已决定：不做 v1 迁移，v2 从零开始） | — |
| `doc-translation-cache.js` | 120 | 清空单篇译文、版面、公式决策（保留笔记） | 核心 | 复用规则 | translation/application |
| `platform/index.js` | 58 | 平台骨架 `{target, kv, library, net}` | 间接 | 复用接口思路 | platform-node + 各切片 ports |
| `platform/idb-backend.js` / `idb-open.js` | 325 / 289 | IndexedDB 实现 | 间接 | 丢弃 | — |
| `platform/memory-backend.js` | 249 | 内存实现（与 IndexedDB 同接口） | 间接 | 复用思路（每个端口提供内存实现） | 各切片 `testing/` |
| `platform/record-key.js` | 92 | 纯键比较与范围 | 间接 | 复用规则 | platform-node/sqlite |
| `platform/tx-guard.js` | 133 | 事务回调只能 await 后端自身请求 | 间接 | **复用规则** | platform-node/sqlite（事务包装） |
| `platform/kv.js` / `net.js` | 105 / 20 | 小型 KV、网络传输注入 | 间接 | 重写 | settings/adapters、platform-node/http |
| `storage.js` | 397 | 设置默认值与读写（`chrome.storage.sync`） | 间接 | 复用默认值清单（如 `:68` 两步润色默认开），实现重写 | settings/domain |
| `settings-secrets.js` / `secret-field.js` | 645 / 259 | 密钥隔离（`oiSecrets` 只在 local）、空提交不擦旧值、密码框交互 | 间接 | **复用规则** | settings/domain + secret-store |
| `sha256.js` | 94 | 无依赖 SHA-256 | 间接 | 丢弃（用 Node `crypto`） | — |
| `features.js` | 47 | 功能开关（含网页字幕） | 间接 | 丢弃 | — |

### 2.6 笔记、问答、导出、诊断

| 文件 | 行数 | 职责 | 与 PDF | 结论 | v2 去向 |
| --- | --- | --- | --- | --- | --- |
| `notes-anchor.js` | 528 | 笔记锚点创建与重锚定（不做模糊匹配） | 核心 | **复用规则** | notes/domain/anchor-match.ts |
| `notes-io.js` | 385 | 笔记 schema、迁移、JSON 包导入导出、Markdown 导出 | 核心 | **复用规则** | notes/domain |
| `notes-view-model.js` | 459 | 笔记列表模型（分组、lost 置底） | 核心 | 复用规则 | notes/ui/view-models |
| `notes-store.js` | 1,027 | IndexedDB 笔记存储、回收站 | 核心 | 复用规则（回收站不按时间清），存储重写 | notes/adapters |
| `notes-pane.js` / `notes-prefs.js` / `reader-notes-local.js` | 228 / 130 / 342 | 三栏几何与面板偏好 | 核心 | 按职责重写 | notes/ui |
| `pending-notes.js` | 261 | 存储不可用时暂存笔记（`chrome.storage.session`） | 核心 | 复用规则（不丢用户输入），实现重写 | notes/application |
| `note-page-blocks.js` | 13 | 给笔记的页块去掉公式 `sourceText` | 核心 | 复用规则 | notes/domain |
| `ask-session.js` | 561 | 问答会话不变式、引用、近邻 2 块上下文 | 核心 | **复用规则** | qa/domain |
| `ask-model.js` / `ask-route.js` / `ask-transport.js` / `ask-confirm.js` / `ask-render.js` | 131 / 173 / 191 / 55 / 17 | 问答模型选择、传输、确认 | 核心 | 复用规则（路由与上下文），实现重写 | qa |
| `markdown-render.js` | 687 | 问答与笔记共用 Markdown + KaTeX 渲染与消毒 | 间接 | 复用规则（白名单消毒） | ui-kit 或 qa/ui |
| `export.js` | 436 | 学习条目多格式导出、`articleBlocksToMarkdown` | 间接 | 复用 Markdown 投影；其他格式丢弃 | document/domain |
| `drawer-toc.js` / `drawer-info.js` / `figure-label.js` | 337 / 129 / 20 | 目录、说明、图表编号 | 核心 | 复用规则 | reader/domain |
| `diag-log.js` | 784 | 本机诊断日志（7 天 / 2 MB） | 间接 | **复用规则** | diagnostics/domain/retention.ts |
| `diag-redact.js` | 193 | 诊断字段白名单与脱敏 | 间接 | **复用规则** | diagnostics/domain/redaction-rules.ts |

### 2.7 arXiv 源码

| 文件 | 行数 | 职责 | 与 PDF | 结论 | v2 去向 |
| --- | --- | --- | --- | --- | --- |
| `arxiv-id.js` | 114 | 从 URL 与第 1 页戳识别 arXiv ID | 核心 | **复用规则** | formula-source/domain/arxiv-id.ts（Q4） |
| `arxiv-src-unpack.js` | 302 | 纯解包（gzip / tar / 单 tex；挡路径穿越；文件数 2000、50 MB 上限） | 核心 | **复用规则** | formula-source/domain/archive-limits.ts、tar-reader.ts（Q4） |
| `latex-units.js` | 943 | LaTeX 源拆公式单元、跟随 `\input`、编号 | 核心 | **复用规则** | formula-source/domain/tex-units.ts、macro-table.ts（Q4） |
| `source-align.js` | 788 | LaTeX 单元与文字层块对齐 | 核心 | **复用规则**；同时可作阅读顺序基准的真值生成器 | formula-source/domain/source-align.ts（Q4）、基准 |

### 2.8 网页翻译、学习中心与标注工具

| 文件 | 行数 | 职责 | 与 PDF | 结论 |
| --- | --- | --- | --- | --- |
| `bilingual-layout.js`、`fab.js`、`page-scan.js`、`site-presets.js`、`html.js` | 1,153 / 241 / 271 / 154 / 11 | 网页双语、悬浮按钮、页面扫描、站点预设 | 无 | **丢弃** |
| `learning.js`、`learning-ui.js`、`documents-ui.js`、`languages.js` | 67 / 36 / 35 / 40 | 学习中心、文档页、语言列表 | 无 | **丢弃**（语言列表可在 settings 重建） |
| `label-schema.js`、`label-checks.js`、`prelabel.js`、`prelabel-accuracy.js`、`review-set.js`、`review-actions.js` | 168 / 128 / 663 / 46 / 140 / 1,301 | 公式单元标注、预标注、复核集与复核页逻辑 | 核心（基准） | **参考**：作为公式检测基准工具迁到 `tools/benchmark/`，不进产品 |
| `tools/label-review/*`、`tools/mm-dpo-reference.mjs`、`scripts/*` | — | 标注复核页、实验脚本、CI 夹具下载 | 核心（基准） | 参考；`scripts/ci/fetch-fixtures.sh` 的「钉死 sha256」做法复用 |

## 3. `pdf/viewer.js` 怎么拆

### 3.1 现状画像

| 指标 | 值 |
| --- | --- |
| 行数 | 16,641 |
| import 语句 | 90 条（引用 60 个模块） |
| 顶层函数 | 782 |
| 顶层可变状态（`let`） | 154 |
| `addEventListener` | 167 |
| DOM 查询（`getElementById` / `querySelector`） | 278 |
| `chrome.*` 直接调用 | `chrome.runtime.getURL`（`:746`）、`chrome.tabs.create`（`:856`、`:3609`）、`chrome.runtime.onMessage`（`:999`） |
| 直接 `fetch` | `:4002`（样例页）、`:11485`（探测本机服务）、`:15362`（按 `?src=` 打开） |
| 最长函数 | `translateWholeDocument` 611 行（`:13047`）、`onKey` 243 行（`:1023`）、`ingestVendorLayout` 223 行（`:14737`）、`forceRetranslateCurrentPage` 209 行、`adoptLibraryPages` 204 行（`:12824`）、`loadCurrentPageText` 177 行（`:16278`）、`init` 155 行（`:842`） |
| 历史 | 435 个提交中 112 个改过它（全仓第一）；其中至少 45 个提交信息含「修复 / fix」 |
| 增长 | 2026-09-12：213 行 → 09-24：2,847 → 10-05：6,143 → 10-12：9,237 → 10-18：12,319 → 10-27：15,751 → 10-29：16,641 |

### 3.2 按职责的区段地图与 v2 去向

文件内没有分节注释；下表按顶层函数的起始行聚类（行号为该区段首个函数的位置）。

| 区段（起始行） | 职责 | 代表函数 | v2 去向 | 结论 |
| --- | --- | --- | --- | --- |
| 1–541 | 90 条 import 与常量 | — | 由装配根与各切片自身 import 取代 | 丢弃 |
| 542–841 | 顶层状态起点；快速队列状态行；顶栏宽度取整 | `clearRushQueue` `:587`、`syncRushStatusLine` `:601` | 任务状态 → `jobs` 事件；顶栏 → reader/ui | 重写 |
| 842–1315 | 启动、扩展消息监听、全局键盘处理 | `init` `:842`、`onKey` `:1023` | 外壳 `renderer/main.tsx` + 各切片在插槽注册快捷键 | 重写（反面教材：巨型入口） |
| 1316–1889 | 主题、字号、CJK、Aa 面板、公式显示开关 | `detectReaderBlend` `:1316`、`openAaPanel` `:1620` | reader/ui + settings；视觉按 DESIGN.md | 重写 |
| 1890–2633 | 分栏拖拽、滚动条、缩放徽章、镜像缩放 | `bindSplitResize` `:1890`、`initZoomChip` `:2166`、`initMirrorZoomChip` `:2400` | 外壳布局 + reader/ui | 重写 |
| 2634–2805 | 版面键、页面重锚定、持久化提示卡 | `layoutKey` `:2634`、`reanchorLaidPage` | document（键）、notes（重锚定） | 规则复用 |
| 2806–3409 | 笔记 / 文献库 / 抽屉面板装配、目录 | `installNotesUi` `:2806`、`installLibraryUi` `:2930`、`installDrawerUi` `:2965` | 外壳插槽；notes / library / reader 各自 ui | 重写 |
| 3410–3918 | 问答装配、引用构造、选区 → 笔记锚点 | `installAskUi` `:3410`、`currentNoteParagraph` `:3626` | qa/ui、notes/ui；引用构造进 qa/domain | 规则复用 |
| 3919–4011 | 引擎模式选择、版面加载 | `storedEngineOverride` `:3919`、`loadPdfLayout` `:3982` | parsing/application | 重写 |
| 4012–4643 | 公式裁图、墨迹框、高清重渲染、多模态裁图 | `formulaPagePixels` `:4012`、`renderSharpFormulaCrop`、`renderVisionFormulaCrop` | 几何 → formula/domain；渲染 → reader/ui 与 worker preprocess | 规则复用 |
| 4644–5254 | arXiv 源码模式（菜单、偏好、对齐、复制 LaTeX） | `arxivPaneHooks` `:4644`、`startArxivSource`、`copyArxivLatex` `:5206` | formula-source（Q4）；界面由 reader 重写 | 规则复用 |
| 5255–6174 | 公式高度锁、模型 PNG、占位卡、图卡、块文本拼接 | `captureFormulaBoxes` `:5255`、`placeholderBoxLengths` `:5600`、`appendCropOrNotice` `:5718`、`paintSplicedPieces` `:6003` | reader/ui/formula-view.tsx、figure card | 重写 |
| 6175–6359 | 测试钩子与探针（挂到全局供 CDP 测试读取） | `viewerUnderTest` `:6175`、`publishViewerTestHooks` `:6284` | 无（v2 测试只测行为） | 丢弃 |
| 6360–6780 | 引擎选择记录、文献库 pairs → 通读、双语结构、块点击 | `noteEngineChoice` `:6360`、`stampFreshFormulaPipeline` `:6403`、`splitBilingual` `:6681`、`onReadoutBlockClick` `:6716` | translation/domain/cache-key、document 投影、reader | 规则复用 |
| 6781–7593 | 左右跳转、跟随、指针与触控、栏序交换 | `jumpTranslationToSource` `:6781`、`watchSourceAvailability` `:7211`、`stampFlowPairs` `:7367`、`applySourceSide` `:7440` | reader/domain/pairing.ts + reader/ui | 规则复用 |
| 7594–8579 | 阅读视图模式、原文栏模式、三栏布局、迷你原文窗 | `setReaderView` `:7594`、`bindSourceModeChrome` `:7654`、`paintThreeColumns` `:7951`、`paintMiniWidth` `:8408` | 外壳布局（Loom） | 重写 |
| 8580–9318 | 选区工具条、看原文、原文折叠 | `bindSelToolbar` `:8580`、`dismissSeeSource` `:9204` | reader/ui/selection-toolbar.tsx | 重写 |
| 9319–9760 | F6 区域焦点、翻译 / 重译菜单、清空本文档译文 | `cycleF6` `:9319`、`openTranslateMenu` `:9412`、`bindClearDocTranslation` `:9518` | translation/ui + use cases | 规则复用（清空保留笔记） |
| 9761–10138 | 页码标签、正文字号、纸张尺寸、公式样式 | `updateSourcePageLabel` `:9761`、`stampBodyFont` `:9828`、`applyPaperMetrics` `:10014` | reader/ui | 重写 |
| 10139–10704 | 文档 / 页面状态、通读渲染 | `notePageState` `:10139`、`renderArticle` `:10562` | jobs 状态投影 + reader/ui/readout-pane.tsx | 重写 |
| 10705–11303 | 阅读锚点保存与恢复、页胶囊、导出 | `captureReaderAnchor` `:10705`、`exportReadout` `:11162` | reader/ui；导出 → document 用例 | 重写 |
| 11304–11631 | 会话生命周期、扩展消息、本机服务探测、未配置引擎提示、翻译预检、自动翻译 | `runtimeSend` `:11304`、`beginViewerSession` `:11318`、`probeLocalService` `:11481`、`translatePreflight` `:11523` | translation/application、settings | 重写 |
| 11632–12405 | 开始翻译、文献身份、译文与版面持久化 | `startTranslate` `:11632`、`rememberLibraryIdentity` `:11690`、`rememberTranslation` `:11791`、`ensureLibraryDocument` `:12125` | library / translation 用例 | 规则复用 |
| 12406–13657 | 单页翻译、已存版面恢复、**整篇翻译调度（611 行）** | `translateCurrentPage` `:12406`、`adoptLibraryPages` `:12824`、`translateWholeDocument` `:13047` | translation/application/translate-page.ts + jobs | 重写（反面教材：巨型函数） |
| 13658–14124 | 强制重译（页 / 全文） | `snapshotForceReadout` `:13658`、`forceRetranslateDocument` `:13881` | translation/application | 重写 |
| 14125–15007 | 版面注入：翻译结果回填、多模态整页版面、厂商版面 | `ingestPageLayout` `:14179`、`ingestMmPageLayout` `:14270`、`postVendorLayout` `:14713`、`ingestVendorLayout` `:14737` | parsing + document 采用；整页多模态部分丢弃 | 重写 / 丢弃 |
| 15008–15331 | 文字层版面注入、跨页句子续接 | `ingestTextLayerLayout` `:15008`、`settlePageContinuations` `:15161` | parsing/domain/text-layer | 规则复用 |
| 15332–15632 | 打开文件、采用文档、建页 | `openFile` `:15332`、`adoptDoc` `:15411`、`buildPages` `:15557` | library/import-pdf + reader | 重写 |
| 15633–16029 | 原文滚动、翻页、缩放、公式裁图计划、迷你适配 | `onPdfScroll` `:15633`、`goPage` `:15696`、`setMirrorZoom` `:15875`、`setZoom` `:16003` | reader/ui/page-virtualizer.ts | 重写 |
| 16030–16454 | 可见页渲染调度、视觉裁图补齐、当前页文字 | `scheduleVisibleRenders` `:16030`、`hydrateMissingVisualCrops` `:16151`、`loadCurrentPageText` `:16278` | reader/ui | 重写 |
| 16455–16641 | 翻页器、状态栏、控件状态 | `updatePager` `:16455`、`setStatus` `:16583` | reader/ui | 重写 |

### 3.3 拆分原则（落到 v2）

1. **不迁移文件，迁移行为。** 每个区段先列出其可观察行为（来自 v1 测试与规格），在 v2 对应切片写成测试，再实现。
2. **状态、取数、展示分开。** v1 的根本问题是三者同处一组函数（见 `docs/parallel-work-and-merge-conflicts.md`）。v2 中：状态在 `jobs` 与各切片用例，取数在 adapters，展示在 ui。
3. **整篇翻译调度**（`translateWholeDocument`）在 v2 变成：`jobs` 状态机 + `translation/application/translate-page.ts`（单页用例）+ 有界并发调度器；每个部分单独可测。
4. **测试钩子不再存在。** v2 的 UI 测试通过 fake `window.oi` 与 Testing Library 断言，不往全局挂探针。
5. 拆分后的文件大小、依赖方向由 CI 强制（ARCHITECTURE §6、§13），防止再次长成巨型文件（ARCHITECTURE §14）。

## 4. 复用清单（规则 / 算法 / 数据结构）

格式：规则 → v1 出处 → v2 落点。数值为 v1 起点，v2 可在基准后调整，但调整必须有记录。

### 4.1 公式兜底顺序

- **声明顺序**：arXiv 源码 → 多模态 → OCR API → 自建算法 → 矢量重绘 → 原页裁图 → 占位。出处：`lib/formula-contract.js:10-20`（`TIER_IDS`）、`lib/formula-chain.js:3-5`、`lib/formula-settings.js:47-55`（UI 文案）、规格 `pdf/high-precision/REQUIREMENTS.md:37`、`:93`（§2.6）。
- **实际运行**（以 `lib/formula-chain.js:150-258` 为准）：
  1. arXiv 对齐可用且该公式通过核对 → 直接采用，不进仲裁。
  2. 多模态与 OCR 并行作为「识别候选」（`:22`、`:168-198`）。
  3. 无任何候选 → 自建 → 矢量 → 裁图 → 占位。
  4. 只有一家候选：校验通过用 KaTeX 渲染；不过 → **直接裁图，不走自建与矢量**（`:4-5`）。
  5. 两家候选：仲裁（`lib/formula-arbiter.js:41-71`）；判不出 → 直接裁图。
  6. 先发「裁图预览」，候选回来再升级（`:187-196`）。
- **实际可用层**：OCR 是桩（`lib/formula-tiers/ocr.js:9-10`）；矢量未实现（`lib/formula-tiers/vector.js:12-18`）。v1 实际路径是 arXiv →（多模态）→ 裁图 →（可选）占位。
- **v2 映射**（写入 `formula/domain/formula-policy.ts`）：

| v1 层 | v2 对应 | 说明 |
| --- | --- | --- |
| arXiv 源码 | 最高优先级的候选来源（`formula-source` 切片） | Q4 已决定：做；仍逐公式与 PDF 核对，并与其他候选一样经 Jev 评分（ARCHITECTURE §7.5、§7.6） |
| 多模态 | **不再是常规第二层**；只对质量评估低分 / 有不确定证据的公式做核验或补救 | 用户新方案：多模态仅低分兜底 |
| OCR API | 引擎 A 的公式识别（PP-FormulaNet 系列）与引擎 B 的识别结果，作为常规候选 | 由 worker 产生 |
| 自建算法 | 文字层候选（`pdf-latex.js` + 纯文本关系白名单） | 无服务时的基础档也可用 |
| 矢量重绘 | 不实现 | 丢弃 |
| 原页裁图 | 默认显示 | 所有未核验公式 |
| 占位 | 仅裁图本身失败（空白 / 模糊 / 邻行污染）时 | 保留开关 |

- **保留的硬规则**：校验不过直接裁图，不向下尝试更弱的识别；任何候选都要经过同一校验。

### 4.2 裁图与 18px

| 规则 | 值 | 出处 |
| --- | --- | --- |
| 公式裁图参考字号 | 18px（CSS 令牌）；JS 回退常量同为 18 | `pdf/reader-tokens.css:425`、`lib/pdf-formula-size.js:155-163` |
| 参考缩放 | 18 / 10pt = 1.8 px/pt | `lib/pdf-formula-size.js:149`、`:185-191` |
| 缩小下限 | 0.75（13.5px） | `lib/pdf-formula-size.js:171` |
| 行内宽帽 / 行盒帽 | 12em（216px）/ 2.2em（39.6px） | `lib/pdf-formula-size.js:178-183` |
| 裁图不跟随用户字号滑杆 | 规格与 README | `README.md` 公式节 |
| 页面栅格倍数 | `CROP_SCALE = 2`（约 144 DPI） | `lib/pdf-blocks.js:8` |
| 多模态图倍数 | `VISION_CROP_SCALE = 4` | `lib/formula-vision-crop.js:28-29` |
| 按墨迹留边 | 行间 6 / 行内 4 像素（保护档 7 / 5） | `lib/pdf-text-layer.js:96-101` |
| 字形扫描外扩（防切分数线） | x 0.003、y 0.002 | `lib/pdf-text-layer.js:110` |
| 多模态图留边 | 行内 10 / 11；行间上下至少 9pt | `lib/formula-vision-crop.js:37-50`、`:81-91` |
| 邻行墨迹上限 | 5%（超过判 `crop-neighbor-ink`） | `lib/formula-contract.js:59`、`lib/formula-tiers/crop.js:45-50` |
| 最小墨迹跨度 | 24 × 12 像素 | `lib/pdf-formula-raster.js:42-43` |
| 高清重渲染上限 | 单边 4096、总像素 4096×1024 | `lib/pdf-formula-raster.js:36-37` |
| 行内判定 | `display === false` 或有 `inlineOf` | `lib/formula-context-crop.js:59-61` |
| 行内上下文图 | 段落栏 + 上下约一行 + 红框（白边 2） | `lib/formula-context-crop.js:28-36`、`:81-100` |

v2 落点：几何与常量 → `formula/domain/crop-geometry.ts`；像素渲染 → reader/ui（显示）与 worker `preprocess`（发给模型）。

### 4.3 公式校验

| 规则 | 出处 |
| --- | --- |
| 候选校验：去尾标点 → 邻词安全网 → 字符集 Jaccard ≥ 0.9 → KaTeX 可渲染 | `lib/formula-verify.js:307-358`；阈值 `lib/formula-contract.js:57` |
| 空字符集 Jaccard = 0（防 `\quad` 之类误过） | `lib/formula-charset.js:347-388` |
| 拒绝 `UNREADABLE`、多段输出 | `lib/formula-verify.js:427` 起 |
| 纯标点公式、视觉跳过、PDF 源不可核对的判定 | `lib/formula-verify.js:125-144` |
| 公式编号去括号比数字 | `lib/formula-arxiv-gate.js:18-36` |
| KaTeX：`throwOnError`、`trust:false`、长度上限 8000 | `lib/formula-katex.js`、`:20` |
| 两家仲裁：字符集胜者 → 规范化一致 → 像素（桩） → 判不出 | `lib/formula-arbiter.js:41-71` |
| 渲染等价（评测指标） | `lib/formula-render-equiv.js:16-71` |
| 「语法可渲染不代表正确」「模型说对不算核验」 | `pdf/high-precision/REQUIREMENTS.md` §2.6 |

### 4.4 多模态（只保留「区域级」经验）

- 区域请求：单公式 PNG，行内带上下文红框、行间不带（`lib/formula-tiers/multimodal.js:36-52`）；红框曾在部分模型上回归，需按模型能力开关。
- 输入质量决定结果：v1 实测同一模型在插件内识别差、插件外整篇识别准，根因是发给模型的裁图太小（`docs/ui-phase2-plan.md:279-285`）。v2 补救输入至少 4 倍栅格并带上下文。
- 中断点：设置读取后、发送前、响应后、返回前都检查是否过期，过期结果不写缓存（`lib/formula-tiers/multimodal.js:4-9`）。
- 失败分类：429 不记入失败缓存（`:354-355`）；超时不重发（F7-PR4，`docs/ui-phase2-plan.md:271`）。
- 网络：多模态超时 90 s（`lib/net/fetch.js:58`）、最多重试 1 次（`:267-268`）、账号并发 3（`:54`）、PNG 上限 10 MB（`lib/mm-client.js:57`）、小图补边到厂商下限（`lib/vision-png.js`）。
- 账本：按页记录候选数 / 可绘数 / 已绘数 / 实际发送数（`lib/formula-mm-ledger.js`）；v2 预算账本在此基础上加金额与预留。
- 并发槽与配额按用途分开：#189 的根因之一是「写入占用飞行槽」（`docs/postmortems/pr189-multimodal-swap.md` §4），页级与区域级请求共用槽位会互相饿死。v2 的 `repair-limits` 按请求用途分别设并发与次数上限。

### 4.5 OCR API

v1 没有实现（`lib/formula-tiers/ocr.js` 为桩）。v1 规划写的是 v2 接百度托管「文档解析（Unlimited-OCR）」并加可选本机服务（`docs/ui-phase2-plan.md:257-261`、`docs/desktop-plan.md:124`）。这一规划已被用户新的双引擎方案取代：公式识别由引擎 A（PP-FormulaNet 系列）与引擎 B 承担；Unlimited-OCR 未见 bbox 输出，Q12 已决定：v2 不接入，上游支持坐标输出后再评估（差异清单 §2.6）。**没有可复用代码。**

### 4.6 自建算法

- 纯文本关系白名单（如简单不等式留在句内，不切成公式）：`lib/pdf-plaintext-formula.js`、`lib/formula-tiers/self.js:24-30`。
- 从文字层恢复可复制 LaTeX，不 OCR、不编造：`lib/pdf-latex.js`。
- v2：作为「文字层候选」，在无服务时也能给部分公式提供可复制文本，但仍需通过 §4.3 校验才显示为 LaTeX。

### 4.7 矢量重绘

- 链上的矢量层未实现（`lib/formula-tiers/vector.js:12-18`）；`VECTOR_MIN = 0.9` 只是预留（`lib/formula-contract.js:60`）。
- 相关但未接线的实验：`lib/svg-recorder.js`（录 Canvas2D 路径，不是 `getOperatorList`）、`lib/formula-svg.js`（按文字层字形挑成员出 SVG）、`lib/pdf-formula-redraw.js`（从页面栅格按字形框拼图，失败返回空串）。
- 结论：v2 不实现矢量重绘；实验代码只作参考。

### 4.8 占位

- 占位是纯决策（`render: "placeholder"`），由独立开关控制，默认关；关时仍显示裁图（`lib/formula-tiers/placeholder.js:15-28`、`lib/formula-tiers/crop.js:141-150`）。
- v2：仅当裁图本身失败时显示占位卡；占位卡点击跳回原页位置。

### 4.9 翻译占位与完整性

| 规则 | 出处 |
| --- | --- |
| 占位符 `⟦fN⟧`（`PLACEHOLDER_RE`） | `lib/pdf-blocks.js:36` |
| 提示词附加：要求原样复制占位 | `lib/pdf-blocks.js:42-47` |
| 完整性：占位序列一致、引用编号一致、不得出现空引用 `[ , ]` | `lib/pdf-blocks.js:221-234` |
| 旧格式占位重映射 | `lib/pdf-blocks.js:124-212` |
| 视觉块（公式 / 图 / 表）不携带 `latex/content/html/md/text` | `lib/pdf-blocks.js:51-52`、`:547-552` |
| 两步润色「先信后润」：默认开（`lib/storage.js:68`），自定义提示词时跳过第二步 | `lib/providers.js:137-149`、`lib/translate-skill.js:82-90` |
| 译文复用：非空、目标语种字符检测；回声译文可被真实译文替换；两份不同真实译文冲突则重译 | `lib/pdf-library.js:349-382` |
| 公式槽对齐失败则丢弃再译 | `lib/pdf-library.js:717` 起 |

v2 落点：`translation/domain/placeholder.ts`、`integrity-check.ts`；v2 加强为字节 / 哈希级比对（草案 02 §7）。

### 4.10 笔记锚点与 IndexedDB

| 规则 / 结构 | 出处 |
| --- | --- |
| 锚点字段：`docHash`、`bid`、`bidV`、`page`、`srcHead`（源文头 64 字）、`srcHash`、译文 `quote/prefix/suffix`、`offset`（提示，非权威）、`quoteSrc`（源文 TextQuote）、`memberBid`、`srcRects` | `lib/notes-anchor.js:84-100` |
| TextQuote 上下文宽度 32 | `lib/notes-anchor.js:17` |
| 锚点状态：`exact / alias / text / quote / lost / block` | `lib/notes-io.js:14` |
| 重锚定：bid → 旧别名 → 源文头 → TextQuote → lost；只搜本页 ±1；**不做模糊重挂** | `lib/pdf-block-id.js:253-297`、`lib/notes-anchor.js:111-116`、`:239-240` |
| 源文哈希变化标 `drift`；块在但定位不到标 `block` | `lib/notes-anchor.js:303-314` |
| lost 保留原页，界面提示「找不到原位置」，列表置底 | `lib/notes-view-model.js:107-112`、`:181-195` |
| 删除进回收站，只有显式清除才删除，不按时间过期 | `lib/notes-store.js:11-12` |
| IndexedDB：库 `oi-annotations`；笔记 v1、文献库升到 v2（同库）；`notes` 索引 `byDoc`、`byDocPage`、`byUpdated`；`docs`、`meta` | `lib/notes-store.js:36-55`、`lib/library-store.js:41` |
| 笔记类型：`highlight / note / question / paperNote`；作者 `me / ai` | `lib/notes-io.js:12-13` |
| JSON 包 `open-immerse-notes` schema 1；导入合并不删本地 | `lib/notes-io.js:10-11`、`:205-304` |
| Markdown 导出（标题 · 哈希前 8 → 原文第 N 页 → 引用 + 正文）；**无 Markdown 导入** | `lib/notes-io.js:360-385` |

v2：锚点结构并入 `ContentAnchor`（草案 02 §9），新增 `pageRevisionId`；保留「不模糊重挂、lost 不删」两条硬规则（PRD AC-08）。

### 4.11 文献库与存储端口

| 规则 / 结构 | 出处 |
| --- | --- |
| 文献身份 = PDF 字节 SHA-256 | `lib/library-record.js:238-254` |
| 原 PDF 上限 100 MB | `lib/library-record.js:13` |
| 来源 URL 去除敏感查询参数 | `lib/library-record.js:27-62`、`:150-166` |
| 论文记录字段（页数、已译页、标题、来源、arXiv、问答数、同步状态、修订号…） | `lib/library-store.js:733-774` |
| 页记录 `[docHash, page]`：`pairs[]`、`runState`、`layoutVersion` | `lib/library-store.js:777-802` |
| 版面键 `[docHash, page, mode, protocol]`；分组、来源、变更流 | `lib/library-store.js:116-158` |
| 存储端口：`get / getAll / put / delete / tx / estimate? / requestPersist? / close`；`BlobStore`：`put / get / delete / usage` | `lib/platform/idb-backend.js:182-297` |
| 事务规则：回调只能 await 后端自己的请求 | `lib/platform/tx-guard.js:1-29`、`:107-110` |
| 接口只用 IndexedDB 与 SQLite 都有的能力，并有共享契约测试 | `docs/desktop-plan.md:144`；`tests/backend-contract.test.mjs` |
| 另一个标签页删除后，本页的迟到写入不得复活记录 | `lib/library-writes.js` |
| 清空单篇译文时保留笔记、设置、密钥、PDF | `lib/doc-translation-cache.js` |

### 4.12 诊断包

| 规则 | 出处 |
| --- | --- |
| 字段白名单；`text / title / translation / note / answer` 等一律丢弃 | `lib/diag-redact.js:133-192` |
| 保留 7 天、上限 2 MB，先删过期再按体积删最旧 | `lib/diag-log.js:16-17`、`:74-99` |
| URL、鉴权头脱敏正则 | `lib/diag-redact.js:19-20` |
| `sk-…`、Bearer、DeepL、查询参数 token 脱敏 | `lib/net/fetch.js:86-95` |
| 已存密钥值（≥ 6 字符）在任何文本中替换为 `***` | `lib/diag-redact.js:46-88` |
| 厂商错误中的长串脱敏 | `lib/providers.js:841-854` |
| 导出不含密钥、提示词、原文全文 | `docs/ui-phase2-plan.md:382` |

### 4.13 文字层阅读顺序与「通顺试接」

- **现有生产算法**：`readingOrderLines` / `orderLinesInColumns`（`lib/pdf-viewer.js:2152-2280`）检出双栏缝且两侧像散文时按栏向下读；在 `lib/pdf-text-layer.js:4105-4110` 调用。
- **XY-cut**：`lib/pdf-xy-cut.js` 递归切分（一条竖缝两栏、两条三栏、通栏行自成一带、窄边栏作旁注），**生产未接线**，只有 `tests/pdf-flow-order.test.mjs` 使用。
- **跨栏 / 跨页续接**：`lib/pdf-flow-join.js` 的 `continuesBlock`（`:91`）、`dehyphenJoin`（`:114`）、`joinAcrossFormulas`（`:134`）、`joinFlowBlocks`（`:207`）、`joinPageBoundary`（`:264`）；后到页续接 `lib/pdf-late-page-join.js`；#200 修复了文字层乱序加载时跨页句拼不回的问题。
- **页眉页脚与装饰**：`lib/pdf-journal-chrome.js:91-118`（顶 / 底 8% 位置带 + DOI / ISSN / 期刊横幅）；**字形清洗**：`lib/pdf-glyph-sanitize.js:25-33` 起；**泄漏计数**：`lib/pdf-leak-rules.js:62-86`。
- **「通顺试接」**：决策见 `docs/architecture-redesign.md:185-198`、`docs/ui-phase2-plan.md:319`——在文字层原序上，每块只试三个候选（同栏下一块、下一栏栏顶、下一页页顶），拼短上下文留通顺的一接；短标题、公式、数字行只按几何。**v1 代码中没有实现**（`docs/architecture-redesign.md:168` 自述「还没写代码」；全仓无对应符号）。打分模型、窗口、阈值均未定。
- **v2 落点**：几何规则 → 文字层基础档（`parsing/domain/text-layer/*`）与引擎 A 的 `reading_order/*`；「通顺试接」作为续接判定的候选打分步骤**新实现**，并用基准集定标，不当作已有资产。

### 4.14 块协议与稳定块号

- `blocks-1` 标签集：title / heading / text / caption / formula / figure / table / header / footer / aside / footnote（`lib/pdf-blocks.js:10-22`）；页眉页脚在 `preparePageBlocks` 中移出主文流（`:556-567`）。
- `bid = b{版本}-p{页}-{t|m|g}{fnv36(seed)}`，seed 为规范化文本或量化 bbox，碰撞加 `-n`（`lib/pdf-block-id.js:7`、`:46-98`）；源文头 / 哈希算法 `:29-36`。
- v2：块号算法成为协议一部分（草案 02 §4），并与 `pageRevisionId` 绑定。Q8 已决定不做 v1 迁移，v2 不保存旧 `bid`。

### 4.15 问答

- 会话不变式与结构 `{id, turns[], draft, citation, generation, flight, docHash}`（`lib/ask-session.js:57-73`）；回合字段（`:239-255`）。
- 上下文 = 引用块 + 最近 2 块（`lib/ask-model.js:12`、`lib/ask-session.js:124-136`）；系统提示限定「只根据引用和附近段落」（`:183-187`）。
- 成功回答可存为笔记（`:425-447`）；会话本身只在内存，换论文清空（`:81-97`）。v2 需新增问答持久化（PRD S8）。

### 4.16 密钥隔离

- 密钥只在 `chrome.storage.local` 的 `oiSecrets`，普通设置在 sync（`lib/settings-secrets.js:1-6`）；空提交不擦已存密钥；写入串行化（`:44-68`）。
- 密码框保存真实值、由浏览器画圆点、× 立即清空、聚焦不清空（`lib/secret-field.js:12-17`、`docs/settings-spec.md:69-71`）。
- 导出设置与文献库都不含密钥（`docs/settings-spec.md:56-57`）。
- v2：改为 `safeStorage` + `secretRef`；规则原样保留（ARCHITECTURE §8.3）。

### 4.17 arXiv 源码

v1 链路：识别 ID（`lib/arxiv-id.js`）→ 限速下载（`background/arxiv-source.js:8-10`）→ 解包（`lib/arxiv-src-unpack.js:262-265`，挡路径穿越）→ 拆公式单元（`lib/latex-units.js`）→ 与文字层对齐（`lib/source-align.js`，整体词覆盖 ≥ 0.85 才使用源码）→ 逐公式核对（`lib/formula-tiers/arxiv.js:66-72`：位置、字符、编号、渲染）。二次打开复用对齐不重下（`lib/formula-arxiv-gate.js:46-105`）。

**Q4 已决定：做。** v2 新增 `formula-source` 切片（[ARCHITECTURE §7.6](../ARCHITECTURE.md#76-公式来源模块-formula-sourceq4)）。可复用部分如下；「复用规则」指把规则与原测试用例一起移植为 TS 纯函数，行为不变，不是复制文件。

| v1 位置 | 内容 | 处理 | v2 落点 |
| --- | --- | --- | --- |
| `lib/arxiv-id.js:5-8`、`:34-49`、`:52`、`:84-113` | 新旧编号正则、版本号、URL 与第 1 页戳识别、来源标记 | **复用规则**；补充 PDF 元数据与文件名来源 | `formula-source/domain/arxiv-id.ts` |
| `background/arxiv-source.js:8-10`、`:17-24` | 3 s 间隔、20 s 超时、24 h 冷却；失败原因分类 | **复用规则** | `formula-source/domain/fetch-policy.ts` |
| `background/arxiv-source.js:26-33`、`:312-339`、`:378-384` | 源码与对齐的缓存键、「只有 PDF」也缓存、清缓存保留冷却 | **复用规则** | `formula-source/application/ports/source-cache.ts` 的契约测试 |
| `background/arxiv-source.js:178`、`:181-267` | 端点 `https://arxiv.org/src/`、`fetch` 与 IndexedDB 实现 | **重写**（Node 网络与 SQLite） | `formula-source/adapters/arxiv-http-client.ts`、`sqlite-source-cache.ts` |
| `lib/arxiv-src-unpack.js:3-18`、`:20`、`:262-302` | 文本扩展名白名单、资源 MIME、30 MB 资源上限、格式嗅探、2000 文件 / 50 MB 上限、gunzip 注入的纯解包 | **复用规则**（本身就是纯函数） | `formula-source/domain/archive-limits.ts`、`tar-reader.ts` |
| `lib/latex-units.js:6-18`、`:40-75`、`:145-163` | 节级别、数学环境集合、主文件查找、`\input` 跟随、去颜色、公式预处理、纯文本化 | **复用规则** | `formula-source/domain/tex-units.ts`、`macro-table.ts` |
| `lib/source-align.js:7-17`、`:225` 起 | n-gram 锚点、DP 上限、0.85 使用门槛、分词 | **复用规则** | `formula-source/domain/source-align.ts` |
| `lib/formula-tiers/arxiv.js:35-75` | 低于门槛判定、行匹配、逐公式失败原因（`not-located`、`charset-mismatch`、`number-mismatch`、`katex-error`） | **复用规则**；结果改为进入候选集并送 Jev，不再直接上屏 | `formula-source/domain/align-policy.ts` |
| `lib/formula-arxiv-gate.js:11-45`、`:46-105` | 版本规范化、编号比较、对齐可复用判定、二次打开不重下 | **复用规则** | `formula-source/domain/align-policy.ts`、`application/use-cases/resolve-arxiv-source.ts` |
| `lib/formula-katex.js:1-30`、`:40-77` | `throwOnError`、`trust: false`、`maxSize: 20`、`maxExpand: 1000`、8000 字符上限、不把 HTML 字符串写入节点 | **复用规则** | `formula/adapters/katex-renderer.ts` 与 `reader/ui/formula-view.tsx` 共用的选项常量 |
| `lib/formula-arxiv-session.js:33-83` | 版本标签、失败原因文案键、偏好规范化、已核验判定、来源统计 | 规则复用；偏好存储与右栏 DOM（`lib/formula-arxiv-pane.js`）丢弃 | `formula-source/domain`；界面由 reader 重写 |
| `pdf/viewer.js:4644-5254` | arXiv 源码模式的菜单、偏好、复制 LaTeX | 只迁移行为（§3） | reader / settings 的 UI |
| `tests/arxiv-*.test.mjs`（8 个）、`tests/formula-arxiv-invariants.test.mjs`、`tests/helpers/arxiv-paper.mjs`、`arxiv-pack.mjs` | 识别、解包、LaTeX、字符集、下载、对齐、网络守卫、回归；测试用的源码包构造器 | **移植为 Vitest**，用例名注明 v1 出处；`tests/net/arxiv-live.test.mjs` 真网测试不进门禁 | `formula-source/test/core/` |

`source-align.js` 同时可作为阅读顺序基准的真值生成工具（§6.2）。

### 4.18 缓存键与陈旧（事故教训）

- 事故：Attention 第 4–5 页显示旧公式译文，因为版面键只有 `hash:page:mode:blocks-1:source-v3`，缺公式管线版本；只抬 `CHAIN_VERSION` 清不掉旧版面（`docs/formula-stale-cache-rca.md` §1）。
- 修复：引入 `FORMULA_PIPELINE_VERSION = "fp-1"` 与陈旧判定（`lib/formula-pipeline.js:9`、`:205-227`），测试 `tests/formula-stale-cache-fix.test.mjs`。
- 决策缓存键：`unitKey:tier:version:model:cropHash`（`lib/formula-contract.js:110-111`）。
- v2 规则：版面键、译文键、公式决策键都必须包含「公式切块 / 占位协议版本」与采用版本号（`translation/domain/cache-key.ts`）。

### 4.19 整页多模态替换的复盘（反面经验）

- #189 把每页先送多模态整页重建、返回后替换文字层结果，真机约 7 轮不收敛；根因：块号重盖与别名、结构槽去重丢摘要、写入占用飞行槽、`Promise.race` 忽略 thenable、清错栏、缓存丢 `kind`、回声译文被当成已译（`docs/postmortems/pr189-multimodal-swap.md` §4）。
- 结论：旗标默认关（`lib/mm-page.js:17-24`）；「版面先定、块号来自版面、版面一变按页作废」（同文 §5）。
- v2：多模态不做整页；页面版本切换由 `document` 切片的原子采用完成（ARCHITECTURE §8.2）。

### 4.20 网络策略

- 统一出站入口，产品代码不直接 `fetch`；测试中未打桩的真实请求失败（`lib/net/fetch.js` 头注释）。
- 按用途超时：翻译 60 s、多模态 90 s（`lib/net/fetch.js:56-58`）；arXiv 20 s。
- 厂商请求「超时不重发」以免重复计费；多模态最多重试 1 次。
- v2 落点：`platform-node/http/http-client.ts`，并与 PRD AC-07 对齐。

## 5. 不用清单（含理由）

| 不用的内容 | v1 位置 | 理由 |
| --- | --- | --- |
| 网页双语、悬浮按钮、页面扫描、站点预设、只译标题 + 首段 | `content/*`、`lib/bilingual-layout.js`、`fab.js`、`page-scan.js`、`site-presets.js`、`translate-limit.js` | v2 只做桌面 PDF（PRD §3.2） |
| YouTube / X 字幕、划词与悬浮翻译 | `content/subtitles.js`、`content/toolbar.js`、`lib/features.js` | 同上；v1 中也默认关闭 |
| 扩展外壳：MV3 清单、service worker 消息路由、popup、右键菜单、`Alt+T`、`nativeMessaging`（本机 GLM-OCR 主机） | `manifest.json`、`background/service-worker.js`、`popup/*` | 桌面无扩展运行时 |
| 学习中心、文档翻译页（TXT / MD / HTML） | `learning/*`、`documents/*`、`lib/learning*.js`、`lib/export.js` 中非 Markdown 部分 | 用户明确不进本轮范围 |
| `pdf/viewer.js` 的实现 | 全文件 | 多职责巨型文件；只迁移行为（§3） |
| 整页多模态替换 | `lib/mm-page*.js`、`viewer.js:14270` 起 | #189 真机不收敛；违背「多模态只补低分区域」 |
| OCR 层实现 | `lib/formula-tiers/ocr.js` | 只是桩 |
| 矢量重绘 | `lib/formula-tiers/vector.js`、`svg-recorder.js`、`formula-svg.js` | 未实现 / 未接线；v2 不立项 |
| 旧本机服务协议 `127.0.0.1:8765`（`/v1/layout`、`/v1/library/document`） | `lib/pdf-layout-client.js:12`、`lib/pdf-library.js:27-29` | v2 用 oi-parse/1；Q8 已决定不做 v1 迁移，不读取旧数据 |
| IndexedDB / `chrome.storage` 实现 | `lib/platform/idb-*.js`、`lib/storage.js` 实现部分 | 桌面用 SQLite + 文件 + safeStorage |
| vendored pdf.js / KaTeX / markdown-it | `pdf/vendor/*` | 改为 npm 锁定版本 |
| 阅读器全部 CSS 与视觉常量（除 18px 等内容规则） | `pdf/*.css`、`ui/tokens*.css` | 视觉由 Loom 的 DESIGN.md 重定 |
| 测试钩子与全局探针 | `viewer.js:6175-6359` | v2 测试只测行为 |
| 77 个读取源码字符串做断言的测试 | 如 `tests/pdf-viewer.test.mjs` 等 | 锁定文本而非行为（ARCHITECTURE F-08） |
| 35 个依赖真实 Chrome（CDP）的测试的实现 | 如 `tests/pdf-topbar-geometry.test.mjs` | 宿主不同；其验收意图转写为 Playwright Electron 冒烟或组件测试 |
| 7 级调度的历史默认（多模态为常规第二层） | `docs/ui-phase2-plan.md:260`、`REQUIREMENTS.md` §2.6 | 被用户新的双引擎 + 低分补救方案取代 |
| 「桌面智能版式只用 PP-DocLayoutV2、默认文字层原序」 | `docs/ui-phase2-plan.md:323`、`docs/architecture-redesign.md` §11 | 被新方案（引擎 A 为主力）取代；文字层原序降为无服务时的基础档 |
| 「从扩展搬密钥」类迁移 | — | 密钥不迁移，桌面首次启动重新输入（v1 `docs/desktop-plan.md:126` 同此决定） |

## 6. 可迁移的测试资产与数据

### 6.1 测试

| 类别 | 数量 | 处理 |
| --- | --- | --- |
| 全部测试文件 | 194 个 `tests/*.test.mjs` + 1 个 `tests/net/*` | — |
| 依赖真实 Chrome（CDP，`tests/helpers/chrome-cleanup.mjs`） | 35 | 不迁移实现；验收意图转为 v2 的 e2e / 组件测试 |
| 读取源码字符串断言（`readFileSync` 读 `viewer.js` / `options` / `popup` 等） | 77（与上类有重叠） | 不迁移 |
| 网页翻译 / 扩展外壳相关 | 约 44 | 丢弃 |
| 纯 Node、测纯函数（可迁移） | 约 60 | **移植为 Vitest / pytest，用例名注明 v1 出处** |

优先移植的纯函数测试（按 v2 切片）：

| v2 切片 | v1 测试文件 |
| --- | --- |
| formula | `formula-chain`、`formula-mm-tier`、`formula-mm-r2`、`formula-stale-cache-fix`、`formula-ref-size`、`formula-context-crop`（非 Chrome 部分）、`formula-vision-crop`、`formula-pdftext`、`pdf-plaintext-formula`、`pdf-short-formula-fallback`、`formula-arxiv-invariants`、`formula-reopen-cache` |
| formula-source（Q4） | `arxiv-src-unpack`、`arxiv-id`、`arxiv-latex`、`arxiv-charset`、`arxiv-source`、`arxiv-align`、`arxiv-net-guard`、`arxiv-regression` |
| translation | `providers-prompt`（两步润色与自定义提示词）、`translate-skill`（部分）、`clear-doc-translation` |
| document / parsing | `pdf-block-id`、`pdf-flow-order`（XY-cut）、`pdf-late-page-join`、`pdf-glyph-sanitize`、`pdf-journal-chrome`、`pdf-formula-detect`、`attention-boundaries`、`pdf-blocks` 相关（夹具 `tests/fixtures/pdf-blocks/*.json`） |
| notes | `notes-anchor`、`notes-io`、`notes-view-model` 相关 |
| library | `library-store`、`backend-contract`（端口契约测试的范本） |
| qa | `ask-session`、`ask-f6b`（非 UI 部分） |
| diagnostics | `diag-redact`、`diag-log`、`diag-export` |
| platform | `net` 相关（未打桩请求失败、脱敏） |

### 6.2 夹具与语料

| 资产 | 内容 | v2 用途 |
| --- | --- | --- |
| CI 夹具 | Attention 1706.03762（v1、v7 源码包）、DPO 2305.18290、TXL 1901.02860；下载后校验钉死的 sha256（`scripts/ci/fetch-fixtures.sh`） | 基准与回归；沿用「不入库、下载后校验 sha256」 |
| `tests/fixtures/pdf-blocks/*.json` | 真实页面块样例（跨行公式、行内公式、边界） | 协议迁移与文字层规则测试 |
| `corpus/manifest.json` | 30 篇开放获取论文、6 个领域 × 5 篇、共 639 页；只存清单与内容指纹 | 基准集的起点（PRD §7） |
| `labels/prelabel/` | 30 篇 × 639 页预标注 | 公式区域检测弱监督 |
| `labels/reviewed/` | 30 篇中 134 页人工复核 | 公式检测基准 |
| `labels/review-set.json` | 1,000 个分层抽样的公式单元 | 公式核验基准 |

**注意**：`labels/` 是「公式 / 文字单元」标注（`lib/label-schema.js:14-17`），**不是阅读顺序真值**。v2 的阅读顺序基准需要另建：v1 的建议是 8–10 篇有 LaTeX 源的 arXiv 论文（可用 `source-align.js` / `pdf-flow-gate.js` 生成真值）加手标的多栏期刊（`docs/ui-phase2-plan.md:325`）。

## 7. v1 中代码与文档不一致之处

| 事项 | 文档说法 | 代码事实 |
| --- | --- | --- |
| 公式七级 | 七级完整兜底 | OCR 为桩、矢量未实现；单家或两家判不出直接裁图 |
| 「通顺试接」 | v1 要带去试用 | 未实现 |
| v1 阅读顺序 | 15:00 决定：文字层原序、不重排 | 仍在用 `orderLinesInColumns` 按栏重排（`lib/pdf-text-layer.js:4105-4110`） |
| XY-cut | 调研与模块存在 | 生产未接线 |
| `pdf-blocks.js` 版面模式 | 注释称 `mm-page` 为默认 | `MM_PAGE_SWAP_DEFAULT = false` |
| `pdf-reader-flow.js` | 名称像阅读顺序 | 实为 UI 字号与页标记 |
| 两步润色 | `providers.js:137` 注释称默认单步 | 设置默认值为开（`lib/storage.js:68`） |
| IndexedDB 版本 | 笔记文件写 v1 | 文献库把同一库升到 v2 |
| 语音 | 架构建议稿有朗读 / ASR | 无任何代码；v2 语音为全新实现 |

## 8. v1 教训摘要

完整分析与 v2 的制度性防线见 [ARCHITECTURE.md §14](../ARCHITECTURE.md#14-v1-教训一个-16641-行的文件是怎么长出来的v2-怎么从制度上防止)。一句话：v1 没有任何机器强制的大小与边界约束，入口文件同时是装配根和业务实现，状态是模块级变量，测试锁源码文本——于是所有新功能都长进了 `pdf/viewer.js`，并行开发只能串行。v2 用行数门禁、依赖方向检查、切片矩阵、禁止模块级状态、禁止读源码测试和热点文件规则把这些变成 CI 失败，而不是文档约定。
