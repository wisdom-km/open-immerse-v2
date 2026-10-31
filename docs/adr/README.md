# 架构决定索引

状态：索引。日期：2026-10-31（Asia/Shanghai）。

这里只指向已经写在规格里的决定，不重写决定，也不另写一份规格。Q1–Q12 的问题、取舍和结论在 [差异清单](../v2-gap-and-changes.md) §6，落点在 [ARCHITECTURE.md](../../ARCHITECTURE.md) §16。

独立的 ADR 文件仍留到 M1。届时登记的第一批包括：`formula-source`、Markdown 的依赖边、`ingest` 的九条边、`budget`、`packages/providers` 与外发检查、存储升级规则、G18、`ui-events-declared`、`supervisor-state`、解析规则集 `oi-rules/1`（ARCHITECTURE §16 末段）。在那之前，新增依赖边的 PR 仍按该段更新架构图。本索引不代替那条规则，也不表示这些文件已经存在。

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
| Q9 | Jev 部署在本地还是 API | 差异清单 §6 的 Q9 行；ARCHITECTURE §16 的 Q9 行 |
| Q10 | 引擎 A 的版面模型从哪一档起步 | 差异清单 §6 的 Q10 行；ARCHITECTURE §16 的 Q10 行 |
| Q11 | 未配置翻译时能否借用多模态 | 差异清单 §6 的 Q11 行；ARCHITECTURE §16 的 Q11 行 |
| Q12 | Unlimited-OCR 是否接入 | 差异清单 §6 的 Q12 行；ARCHITECTURE §16 的 Q12 行 |

Q1–Q12 之后的决定（处理路线、API 优先、外发同意、Markdown、架构评审修复、PR C）仍只记在 ARCHITECTURE §16 与差异清单 §6.1–§6.12。本索引不抄那些段落。
