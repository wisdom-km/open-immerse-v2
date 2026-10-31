# 规格变更记录

本文只记规格文档改了什么。每一行是日期（Asia/Shanghai）、PR、文件、摘要。不复制规格正文。

应用安装包的变更记录从第一次给人安装的构建开始，不写在这里（README「三种版本号」）。规格版本号仍是 v0.6，本文件不升这个号。

PR #12 之前的规格 PR 不在这里重述。处理状态见 [backlog.md](backlog.md)。已决定的事项见 [v2-gap-and-changes.md](v2-gap-and-changes.md) §6 与 [adr/README.md](adr/README.md)。

| 日期 | PR | 文件 | 摘要 |
| --- | --- | --- | --- |
| 2026-10-31 | [#18](https://github.com/wisdom-km/open-immerse-v2/pull/18) | `ARCHITECTURE.md`、`PRD.md`、`docs/backlog.md`、`docs/v2-gap-and-changes.md`、`docs/adr/README.md`、`docs/spec-changelog.md` | D-D：版面「本地 / API」与引擎 A 识别「本地 / API」是两个设置，版面只读 `RouteConfig.layout`；托管版面 API 核实之前 `deployment: 'api'` 不发请求。D-E（含引擎 A / 引擎 B / 云 OCR 续定）：没有版面作业时这三项请求都为 0，不发整页；整页只走多模态。识别列表含这三项之一且版面关着时，`route-config` 校验失败，原因码 `sources_require_layout`，不静默跳过。W-4：新安装与恢复默认的过渡预设是 `multimodal-layout`；正式全局默认仍等 M0 后由 Wisdom 定。M0 须在 8 GB 内存、无独显、只用 CPU 的机器上测 PP-DocLayoutV3 的冷启动时间、单页耗时、峰值内存、是否 OOM，测完前「未核实」，不预填数字。Q10 不重开：标准档仍是 V3，plus-L 仍按 Q10、QM-13 |
| 2026-10-31 | [#17](https://github.com/wisdom-km/open-immerse-v2/pull/17) | `RULES.md`、`AGENTS.md`、`README.md`、`CONTRIBUTING.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`docs/spec-changelog.md`、`workers/parser/AGENTS.md`、`docs/evidence/17/checks.md` | 文档 P1：RULES §9 Definition of Done，完成条件只指向已有规则，并与 PR 模板互引。AGENTS.md 按任务类型给阅读索引（只放链接）。`workers/parser/AGENTS.md` 只写该目录的 Python / uv、ruff、pytest；目录原本就在。规格变更从 #12 记起。RULES 文首日期改为 2026-10-31。N-11 写明 Agent 不得改 `.cursor/environment.json` 与 `.cursor/install.sh`，改须 Wisdom 批准；#15 为一次性例外 |
| 2026-10-31 | [#16](https://github.com/wisdom-km/open-immerse-v2/pull/16) | `AGENTS.md`、`ARCHITECTURE.md`、`PRD.md`、`RULES.md`、`docs/backlog.md`、`docs/ci-and-environment.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`docs/evidence/16/commands.md` | P0：agent 命令与退出码；`test:core` 在 M1 前写不适用（脚本尚未提供）；调试日志最多 7 天且总量上限 50 MB，只存本机；证据目录与 PR 描述里的工作记录。验收 AC-101 |
| 2026-10-31 | [#15](https://github.com/wisdom-km/open-immerse-v2/pull/15) | `.cursor/install.sh`、`workers/parser/.uv-install.sha256`、`docs/backlog.md` | 安装 uv 前用 sha256 校验安装脚本，通过后才执行。Wisdom 2026-10-31 08:21 批准的 N-11 一次性例外。未改 `.cursor/environment.json`，未改 N-11 条文 |
| 2026-10-31 | [#14](https://github.com/wisdom-km/open-immerse-v2/pull/14) | `DESIGN.md`、`docs/design-principles.md`、`PRD.md`、`docs/adr/README.md` | 公式状态徽标 DS-28–DS-31（视觉值待审批）。ADR 索引的范围收到差异清单 §6.12。PRD §6.3 增加对照。设计正文归 Loom |
| 2026-10-31 | [#13](https://github.com/wisdom-km/open-immerse-v2/pull/13) | `docs/backlog.md` | 记下 PR #12 终审的 R12-P2-1、R12-P2-2、R12-P2-3。当时不改规格正文 |
| 2026-10-31 | [#12](https://github.com/wisdom-km/open-immerse-v2/pull/12) | `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`docs/v2-gap-and-changes.md`、`docs/backlog.md`、`docs/reviews/v2-post-merge-review.md`、`docs/design-principles.md`、`docs/design/md-reader.md` | 合入后复审报告入库。路线不含 Jev 时，程序核对通过改为 `format-checked-latex`（徽标暂定「格式已核对」），不算已核验（Wisdom 2026-10-31 01:14）。设计文件在该 PR 有改动，正文仍归 Loom |
