# 规格变更记录

状态：索引。日期：2026-10-31（Asia/Shanghai）。

这里只记规格文档的后续改动，方便对照。不代替 [PRD.md](../PRD.md)、[ARCHITECTURE.md](../ARCHITECTURE.md)、[RULES.md](../RULES.md)。给人安装的应用，变更记录从第一次安装包开始，不写在这里（README「三种版本号」）。

## 2026-10-31 版面部署、云 OCR 与过渡默认

Wisdom 批准 Forge 的四条建议，写入规格，作为这一组问题的唯一说法。

- D-D：版面「本地 / API」与引擎 A 识别「本地 / API」是两个设置。版面只读 `RouteConfig.layout`。托管版面 API 核实之前，`deployment: 'api'` 不发请求。
- D-E：没有版面作业时，引擎 A 的识别、引擎 B、云 OCR 请求都为 0，不发整页。版面关掉的路径是 `multimodal-only`：整页只走多模态。这三项只在识别列表含它且版面开着时，按版面区域裁片请求；列表含这三项之一且版面关着时校验失败，不静默跳过（2026-10-31 11:14 续定，见下节）。
- W-4：新安装与恢复默认的过渡预设是 `multimodal-layout`。正式全局默认仍等 M0 四路线对比后由 Wisdom 定。来源优先级仍用现行提议顺序，未决定。
- M0 必须在 8 GB 内存、无独显、只用 CPU 的机器上测 PP-DocLayoutV3 的冷启动时间、单页耗时、峰值内存、是否 OOM。状态保持「未核实」，不预填数字。标准档仍是 V3。plus-L 仍按 Q10、QM-13。

只改规格。未改应用代码、`.cursor/install.sh`、`.cursor/environment.json`。

## 2026-10-31 11:14 D-E 续定

Wisdom 批准把 D-E 扩到所有按版面区域识别的来源。

- 没有版面作业（含 `multimodal-only`）时，引擎 A 的识别（`parse`）、引擎 B、云 OCR 请求都为 0。整页只走多模态，再用文字层校正（AC-95）。
- 引擎 A 只消费版面裁片。引擎 B 的 SDK 内部会跑 PP-DocLayoutV3，跑它等于悄悄把版面加回来，所以也不能在版面关掉时启动。
- 识别列表含这三项之一且版面关着时，`route-config` 校验失败，原因码 `sources_require_layout`，不静默跳过。
- 四个预设不改。关掉版面后没有 OCR 兜底，只剩多模态，再按裁图、占位框降级。
- 云 OCR 是否只能挂在 `ocr-*` 预设 id 上，仍不另定。

只改规格。未改应用代码、`.cursor/*`。
