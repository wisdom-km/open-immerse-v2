# 规格变更记录

状态：索引。日期：2026-10-31（Asia/Shanghai）。

这里只记规格文档的后续改动，方便对照。不代替 [PRD.md](../PRD.md)、[ARCHITECTURE.md](../ARCHITECTURE.md)、[RULES.md](../RULES.md)。给人安装的应用，变更记录从第一次安装包开始，不写在这里（README「三种版本号」）。

## 2026-10-31 版面部署、云 OCR 与过渡默认

Wisdom 批准 Forge 的四条建议，写入规格，作为这一组问题的唯一说法。

- D-D：版面「本地 / API」与引擎 A 识别「本地 / API」是两个设置。版面只读 `RouteConfig.layout`。托管版面 API 核实之前，`deployment: 'api'` 不发请求。
- D-E：没有版面作业时云 OCR 请求为 0，不发整页。版面关掉的路径是 `multimodal-only`。云 OCR 只在识别列表含它且版面开着时，按版面区域裁片请求。
- W-4：新安装与恢复默认的过渡预设是 `multimodal-layout`。正式全局默认仍等 M0 四路线对比后由 Wisdom 定。来源优先级仍用现行提议顺序，未决定。
- M0 必须在 8 GB 内存、无独显、只用 CPU 的机器上测 PP-DocLayoutV3 的冷启动时间、单页耗时、峰值内存、是否 OOM。状态保持「未核实」，不预填数字。标准档仍是 V3。plus-L 仍按 Q10、QM-13。

只改规格。未改应用代码、`.cursor/install.sh`、`.cursor/environment.json`。
