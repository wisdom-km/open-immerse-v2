# 工作流

角色、升级、离开 Draft。产品规则在 [RULES.md](../RULES.md)、[ARCHITECTURE.md](../ARCHITECTURE.md)、[PRD.md](../PRD.md)。本文不另写产品规则。不列下面五人以外的 bot。

Wisdom 是合入、发版、花钱和 `.cursor/*` 的唯一决定人。

## 角色

- 总监（Forge）：规格、任务拆分、PR 审查、测试队列。
- 实现（Cursor Cloud agent）：在 `feature/*`、`fix/*`、`chore/*` 开 Draft PR。不自行合入。不改 UI 规格（`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`，N-10）。
- QA（Anvil）：每个 tip 跑一次全量（RULES §4）。每次 FAIL 附上日志和 `docs/evidence/<PR号>/`。
- UI 设计（Loom）：`DESIGN.md` 与走查。
- 仓库操作（Jone copy）：只在收到「合入」之后，合入那个锁定的 SHA。不 force push（N-01）。

## 离开 Draft

PR 可以离开 Draft，仅在 Forge 审查通过之后（RULES §2）。自检做完不够。作者不自行标成 Ready。合入仍只由 Wisdom 决定（N-03）。

## 执行计划

超过 300 行，或跨模块，用 [exec-plans/TEMPLATE.md](exec-plans/TEMPLATE.md)。跨模块指多于一个切片，或同时改 TS 与 worker。第一笔提交只有计划。Forge 审查通过之前不写实现。解析规则集仍可在同一个 PR（RULES §2），但要先有这份计划。小任务不建计划，在 PR 描述写三行现状理解。

## 升级

要判断时才停。只这些情况：规格冲突、范围变化、缺 seam、门禁规则要改、密钥、花钱、`.cursor/*`。其余按已写明的规则做。

| 何时停 | 找谁 | 报告 |
| --- | --- | --- |
| 规格冲突 | Forge | 同一格式 |
| 范围变化 | Forge | 同一格式 |
| 缺 seam | Forge | 同一格式 |
| 门禁规则要改 | Wisdom | 同一格式。Forge 不批准放宽门禁（N-08） |
| 密钥 | Wisdom | 同一格式。不写密钥的值 |
| 花钱 | Wisdom | 同一格式 |
| `.cursor/*` | Wisdom | 同一格式（N-11） |

报告一行一项：`触发`、`停在`（文件:行或命令）、`已读`（节）、`现状`（三行以内）、`提问`（要决定的一句）。
