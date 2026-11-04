# 执行计划

超过 300 行，或跨模块，才复制本模板。跨模块指改动落到多于一个切片，或同时落到 TS 与 worker（[ARCHITECTURE.md](../../ARCHITECTURE.md) §4.2）。复制为 `docs/exec-plans/<分支名>.md`。第一笔提交只有该文件。Forge 审查通过之前不写实现。小任务不用本模板，在 PR 描述写三行现状理解。

本任务是纯文档搬运，不跨切片，也不改 TS 与 worker。行数会超过 300，因为同一份正文要再写入章节文件。Wisdom 在本条任务里要求先把计划写进 Draft PR，然后实现 Issue #27，不等另一次审查。

## 现状理解

- 已有行为：`PRD.md`（615 行）和 `ARCHITECTURE.md` 在仓库根，是规格正文。`docs/architecture/` 里已有 README、三份 `*_草案.md` 和 `inputs/`，RULES §7 把这个目录称作历史草案。`tools/check-docs` 只报告、不失败；`origin/main` 上链接与锚点发现为 0。它只认围栏外的 ATX 标题，不认 HTML id。
- 相关的节：Issue #27；RULES §7、§9；PRD 与 ARCHITECTURE 全文。不改 DESIGN、`docs/design-principles.md`、`docs/design/**`（N-10），不改工作流（N-02），不改 `tools/codegen`、check 脚本、license 工具、`.gitattributes`。
- 还没做的部分：按下面的边界把正文切到 `docs/prd/` 与 `docs/architecture/`，根目录两份改成索引，并加只做逐字节比对的脚本。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件与 Draft PR 写下文件清单、章节对应和锚点处理 | Draft PR #125，第一笔只有本文件 | [#125](https://github.com/wisdom-km/open-immerse-v2/pull/125) |
| 2 | 按标题边界做字节切片，只加可剥离的文件头 | PRD 36 个文件，ARCHITECTURE 66 个文件 | `compare.mjs` 退出码 0 |
| 3 | 根目录索引保留全部旧标题；章节内的相对链接用路径占位文件接住 | 索引标题与原文 slug 相同；25 个路径占位；两份镜像索引 | `check-docs` links 0、anchors 0 |
| 4 | `tools/compare-spec-bytes/` 对照 `origin/main`；`check-docs` 证明链接和锚点 | 8 个测试通过 | `docs/evidence/125/commands.md` |
| 5 | 指针、changelog 一行、`GATE_BASE=origin/main corepack pnpm run check` | 指针与 changelog 已写。`032ab1d` 上门禁退出码 0 | `docs/evidence/125/commands.md` |

## 切分边界

只在围栏外的 ATX 标题处切开。前一段保留标题前的换行，两段字节首尾相接。不改标题、表格、代码块和链接文字。

- PRD：每个 `##`、每个带编号的 `###`、以及 `#### 6.1.1`–`#### 6.1.15`。文首到第一个 `##` 之前是 `00-preamble.md`。
- ARCHITECTURE：每个 `##`、每个带编号的 `###`。`####`（含 §4.5.1–§4.5.8、§7.9.1–§7.9.8）留在所属的 `###` 文件里。文首到第一个 `##` 之前是 `00-preamble.md`。
- 文件名按标题开头的编号分段，每段补成两位：`7.12` → `07-12.md`，`6.1.15` → `06-01-15.md`。顺序以清单为准，不靠文件名排序。
- 不覆盖已有的 `README.md`、`*_草案.md`、`inputs/`。

## 锚点

- 根目录 `PRD.md`、`ARCHITECTURE.md` 改成索引。每个旧标题按原顺序、原文出现一次。标题本身是指向章节文件的链接时，`check-docs` 的 slug 取链接文字，与原文标题相同。因此 `PRD.md#6-验收标准`、`ARCHITECTURE.md#63` 这类已有链接不用改 DESIGN.md，也能落到索引上的同名标题，再点进章节。
- ARCHITECTURE §14.1 的标题里已经有一个链接（`[v1 审查](./docs/v1-review.md)`）。这一行不套外层链接，标题原文照写，下一行放「本节原文」。否则嵌套的 `]` 会改变 slug。
- 章节文件正文里的相对链接一个字节都不改。从 `docs/prd/` 或 `docs/architecture/` 解析时，目标路径上如果还没有文件，就放一个只含状态行和一条跳转链接的 Markdown。无锚点的链接只要文件存在。PRD 正文指向 `./ARCHITECTURE.md#…` 的四个锚点，由 `docs/prd/ARCHITECTURE.md` 重复架构索引标题来接住，标题再链到真正的章节。
- 不改用符号链接（Windows 检出不可靠，且本任务不改 `.gitattributes`）。不用 HTML id（`check-docs` 不认）。不在正文里重写链接：重写之后，只剥离文件头就不再与 `origin/main` 逐字节相同。

文件头固定为：

```text
<!-- oi-split-header -->
状态：现行。规格版本仍是 v0.6。本文件是原文切片。
<!-- /oi-split-header -->
```

比对脚本只在文件以开始标记开头时，删掉从开始标记到结束标记及其后的一个换行。标记不在原文里。索引和路径占位文件不参与拼接。

## PRD 文件清单

| 文件 | 原文 |
| --- | --- |
| `docs/prd/00-preamble.md` | 文首，第一个二级标题之前 |
| `docs/prd/01.md` | 1. 一句话 |
| `docs/prd/02.md` | 2. 为谁 |
| `docs/prd/03.md` | 3. 范围 |
| `docs/prd/03-01.md` | 3.1 范围内（v2） |
| `docs/prd/03-02.md` | 3.2 范围外（v2 不做） |
| `docs/prd/03-03.md` | 3.3 设置：模型能力的「本地 / API」与面壁开放平台（Q9，Wisdom 2026-10-30 18:37、18:44） |
| `docs/prd/03-04.md` | 3.4 质量评分开关（Wisdom 2026-10-30 22:15、22:23） |
| `docs/prd/03-05.md` | 3.5 处理路线（Wisdom 2026-10-30 22:41、22:44、22:45） |
| `docs/prd/03-06.md` | 3.6 v2 桌面端 UI 带来的范围补充（已采纳，ADR 0001，Wisdom 2026-11-04） |
| `docs/prd/04.md` | 4. 核心原则（产品层） |
| `docs/prd/05.md` | 5. 用户故事 |
| `docs/prd/06.md` | 6. 验收标准 |
| `docs/prd/06-01.md` | 6.1 确定性标准（硬门槛） |
| `docs/prd/06-01-01.md` | 6.1.1 Markdown 阅读（AC-30–AC-56） |
| `docs/prd/06-01-02.md` | 6.1.2 译文区块（D6 补充，AC-57–AC-58） |
| `docs/prd/06-01-03.md` | 6.1.3 面壁开放平台（Q9 补充，AC-59–AC-60） |
| `docs/prd/06-01-04.md` | 6.1.4 API 优先（AC-61–AC-62） |
| `docs/prd/06-01-05.md` | 6.1.5 预算闸门（AC-63） |
| `docs/prd/06-01-06.md` | 6.1.6 服务商适配层（AC-64） |
| `docs/prd/06-01-07.md` | 6.1.7 架构评审 P1：外发检查、升级、Electron 加固（AC-65–AC-67） |
| `docs/prd/06-01-08.md` | 6.1.8 阅读顺序（AC-68–AC-71） |
| `docs/prd/06-01-09.md` | 6.1.9 借鉴 BabelDOC 的六项（AC-72–AC-77） |
| `docs/prd/06-01-10.md` | 6.1.10 架构评审其余项（AC-78–AC-83） |
| `docs/prd/06-01-11.md` | 6.1.11 评分分期（AC-84） |
| `docs/prd/06-01-12.md` | 6.1.12 质量评分开关与处理路线（AC-85–AC-100） |
| `docs/prd/06-01-13.md` | 6.1.13 诊断日志（AC-101） |
| `docs/prd/06-01-14.md` | 6.1.14 评分、路线、外发与预算的汇合（AC-102） |
| `docs/prd/06-01-15.md` | 6.1.15 Jev 的两条路线（AC-103） |
| `docs/prd/06-02.md` | 6.2 质量与性能标准（待基准定标） |
| `docs/prd/06-03.md` | 6.3 视觉与交互验收对照 |
| `docs/prd/07.md` | 7. 基准集（定标前提） |
| `docs/prd/08.md` | 8. 里程碑 |
| `docs/prd/08-01.md` | 8.1 Markdown 阅读的里程碑校正 |
| `docs/prd/09.md` | 9. 决策记录（Wisdom 2026-10-30 已全部决定） |
| `docs/prd/10.md` | 10. 术语 |

## ARCHITECTURE 文件清单

| 文件 | 原文 |
| --- | --- |
| `docs/architecture/00-preamble.md` | 文首，第一个二级标题之前 |
| `docs/architecture/00.md` | 0. 设计目标 |
| `docs/architecture/01.md` | 1. 进程拓扑 |
| `docs/architecture/02.md` | 2. 分层 |
| `docs/architecture/02-01.md` | 2.1 UI 与业务核心解耦（Q3，Wisdom 2026-10-30 原文） |
| `docs/architecture/02-02.md` | 2.2 调研依据 |
| `docs/architecture/02-03.md` | 2.3 术语落到代码 |
| `docs/architecture/02-04.md` | 2.4 seam 的形状规则 |
| `docs/architecture/02-05.md` | 2.5 与 5 层、18 个切片的映射 |
| `docs/architecture/02-06.md` | 2.6 示例 seam |
| `docs/architecture/03.md` | 3. 目录结构 |
| `docs/architecture/03-01.md` | 3.1 每个功能切片的内部结构（统一模板） |
| `docs/architecture/04.md` | 4. 模块清单与单文件职责 |
| `docs/architecture/04-01.md` | 4.1 公共包 |
| `docs/architecture/04-02.md` | 4.2 功能切片 |
| `docs/architecture/04-03.md` | 4.3 切片之间的依赖（允许的方向） |
| `docs/architecture/04-04.md` | 4.4 预留切片 writing（Q5） |
| `docs/architecture/04-05.md` | 4.5 Markdown 阅读（markdown 切片，含 #### 4.5.1–4.5.8） |
| `docs/architecture/05.md` | 5. 依赖方向与禁止事项 |
| `docs/architecture/05-01.md` | 5.1 层间依赖图 |
| `docs/architecture/05-02.md` | 5.2 禁止事项（CI 强制或评审一票否决） |
| `docs/architecture/05-03.md` | 5.3 UI 组合：插槽而不是互相 import |
| `docs/architecture/06.md` | 6. 文件与函数大小 |
| `docs/architecture/07.md` | 7. 引擎抽象接口 |
| `docs/architecture/07-00.md` | 7.0 模型能力的默认来源：API 优先（Wisdom 2026-10-30 18:44） |
| `docs/architecture/07-01.md` | 7.1 总体流水线 |
| `docs/architecture/07-02.md` | 7.2 Python 侧引擎接口（worker 内部） |
| `docs/architecture/07-03.md` | 7.3 TS 侧端口（application 层） |
| `docs/architecture/07-04.md` | 7.4 质量评估的部署（Q9） |
| `docs/architecture/07-05.md` | 7.5 公式候选优先级链（Q1、Q4） |
| `docs/architecture/07-06.md` | 7.6 公式来源模块 formula-source（Q4） |
| `docs/architecture/07-07.md` | 7.7 云 OCR 识别来源（Q1） |
| `docs/architecture/07-08.md` | 7.8 预算闸门：所有付费调用先预留（架构评审 P0-3） |
| `docs/architecture/07-09.md` | 7.9 服务商适配层（Wisdom 2026-10-30 19:45、19:46，含 #### 7.9.1–7.9.8） |
| `docs/architecture/07-10.md` | 7.10 阅读顺序（Wisdom 2026-10-30 21:12） |
| `docs/architecture/07-11.md` | 7.11 BabelDOC 借鉴与防御（Wisdom 2026-10-30 21:12） |
| `docs/architecture/07-12.md` | 7.12 处理路线：独立积木与声明式组合（Wisdom 2026-10-30 22:41、22:44、22:45） |
| `docs/architecture/07-13.md` | 7.13 评分、路线、外发与预算的汇合（Wisdom 2026-10-31 13:14） |
| `docs/architecture/08.md` | 8. 数据模型与存储 |
| `docs/architecture/08-01.md` | 8.1 权威数据 |
| `docs/architecture/08-02.md` | 8.2 桌面存储布局 |
| `docs/architecture/08-03.md` | 8.3 配置与密钥隔离 |
| `docs/architecture/08-04.md` | 8.4 版本与升级（架构评审 P1-9） |
| `docs/architecture/09.md` | 9. IPC 协议（renderer ↔ main） |
| `docs/architecture/09-01.md` | 9.1 v2 桌面端 UI 新增 seam（已采纳，ADR 0001，Wisdom 2026-11-04） |
| `docs/architecture/10.md` | 10. Python worker 协议（oi-parse/1） |
| `docs/architecture/10-01.md` | 10.1 传输 |
| `docs/architecture/10-02.md` | 10.2 端点 |
| `docs/architecture/10-03.md` | 10.3 worker 内部结构 |
| `docs/architecture/10-04.md` | 10.4 协议版本与升级（架构评审 P1-9） |
| `docs/architecture/10-05.md` | 10.5 本机 worker 的监管状态机（架构评审 P2-6） |
| `docs/architecture/11.md` | 11. 可观测性 |
| `docs/architecture/12.md` | 12. 测试策略 |
| `docs/architecture/12-01.md` | 12.1 评测记录 |
| `docs/architecture/13.md` | 13. CI 门禁 |
| `docs/architecture/14.md` | 14. v1 教训：一个 16,641 行的文件是怎么长出来的，v2 怎么从制度上防止 |
| `docs/architecture/14-01.md` | 14.1 发生了什么（标题内已有 v1 审查链接） |
| `docs/architecture/14-02.md` | 14.2 造成的问题 |
| `docs/architecture/14-03.md` | 14.3 根因 |
| `docs/architecture/14-04.md` | 14.4 v2 的制度性防线 |
| `docs/architecture/15.md` | 15. 开发环境 |
| `docs/architecture/15-01.md` | 15.1 版本 |
| `docs/architecture/15-02.md` | 15.2 云端 Agent 的 environment.json |
| `docs/architecture/15-03.md` | 15.3 常用命令（M1 落地后） |
| `docs/architecture/15-04.md` | 15.4 开发机与密钥（API 优先，Wisdom 2026-10-30 18:44） |
| `docs/architecture/16.md` | 16. 决策记录与变更 |

## 比对脚本与指针

- `tools/compare-spec-bytes/compare.mjs` 只做一件事：按 `manifest.json` 的顺序读章节文件，剥离文件头，与 `git show origin/main:<文件>` 逐字节比较。
- `tools/compare-spec-bytes/compare.test.ts` 覆盖剥头、拼接相等、差一个字节，以及仓库里的两份原文。
- 根目录索引、章节文件和路径占位之外，只改指针，不改条文：`RULES.md` §7、`AGENTS.md`、`README.md`、`docs/architecture/README.md` 说明章节正文与「草案」文件的区别。`docs/spec-changelog.md` 加一行。规格版本仍是 v0.6。
- 搬运提交的说明里写 `G12:`，因为同一正文迁出再写入会超过 600 行，不是新规格。

若切片无法在剥离文件头后与 `origin/main` 逐字节相同，停在本 PR，列出方案，不再改正文。

## 证据链接

- `docs/evidence/125/commands.md`：命令、退出码和 `check-docs` 计数。
