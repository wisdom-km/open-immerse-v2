状态：现行。规格版本仍是 v0.6。本页是章节索引。标题与拆分前相同，旧锚点落在这里。点标题到章节原文。

# [open-immerse v2 架构规格（ARCHITECTURE）](../architecture/00-preamble.md#open-immerse-v2-架构规格architecture)

## [0. 设计目标](../architecture/00.md#0-设计目标)

## [1. 进程拓扑](../architecture/01.md#1-进程拓扑)

## [2. 分层](../architecture/02.md#2-分层)

### [2.1 UI 与业务核心解耦（Q3，Wisdom 2026-10-30 原文）](../architecture/02-01.md#21-ui-与业务核心解耦q3wisdom-2026-10-30-原文)

### [2.2 调研依据](../architecture/02-02.md#22-调研依据)

### [2.3 术语落到代码](../architecture/02-03.md#23-术语落到代码)

### [2.4 seam 的形状规则](../architecture/02-04.md#24-seam-的形状规则)

### [2.5 与 5 层、18 个切片的映射](../architecture/02-05.md#25-与-5-层18-个切片的映射)

### [2.6 示例 seam](../architecture/02-06.md#26-示例-seam)

## [3. 目录结构](../architecture/03.md#3-目录结构)

### [3.1 每个功能切片的内部结构（统一模板）](../architecture/03-01.md#31-每个功能切片的内部结构统一模板)

## [4. 模块清单与单文件职责](../architecture/04.md#4-模块清单与单文件职责)

### [4.1 公共包](../architecture/04-01.md#41-公共包)

### [4.2 功能切片](../architecture/04-02.md#42-功能切片)

### [4.3 切片之间的依赖（允许的方向）](../architecture/04-03.md#43-切片之间的依赖允许的方向)

### [4.4 预留切片 `writing`（Q5）](../architecture/04-04.md#44-预留切片-writingq5)

### [4.5 Markdown 阅读（`markdown` 切片）](../architecture/04-05.md#45-markdown-阅读markdown-切片)

#### [4.5.1 已定事项与落点](../architecture/04-05.md#451-已定事项与落点)

#### [4.5.2 切片文件](../architecture/04-05.md#452-切片文件)

#### [4.5.3 seam](../architecture/04-05.md#453-seam)

#### [4.5.4 谁解析、谁渲染](../architecture/04-05.md#454-谁解析谁渲染)

#### [4.5.5 安全](../architecture/04-05.md#455-安全)

#### [4.5.6 待定标参数](../architecture/04-05.md#456-待定标参数)

#### [4.5.7 编辑接口预留（D7）](../architecture/04-05.md#457-编辑接口预留d7)

#### [4.5.8 不在 v2 内](../architecture/04-05.md#458-不在-v2-内)

## [5. 依赖方向与禁止事项](../architecture/05.md#5-依赖方向与禁止事项)

### [5.1 层间依赖图](../architecture/05-01.md#51-层间依赖图)

### [5.2 禁止事项（CI 强制或评审一票否决）](../architecture/05-02.md#52-禁止事项ci-强制或评审一票否决)

### [5.3 UI 组合：插槽而不是互相 import](../architecture/05-03.md#53-ui-组合插槽而不是互相-import)

## [6. 文件与函数大小](../architecture/06.md#6-文件与函数大小)

## [7. 引擎抽象接口](../architecture/07.md#7-引擎抽象接口)

### [7.0 模型能力的默认来源：API 优先（Wisdom 2026-10-30 18:44）](../architecture/07-00.md#70-模型能力的默认来源api-优先wisdom-2026-10-30-1844)

#### [外发同意的类型定义](../architecture/07-00.md#外发同意的类型定义)

### [7.1 总体流水线](../architecture/07-01.md#71-总体流水线)

### [7.2 Python 侧引擎接口（worker 内部）](../architecture/07-02.md#72-python-侧引擎接口worker-内部)

### [7.3 TS 侧端口（application 层）](../architecture/07-03.md#73-ts-侧端口application-层)

### [7.4 质量评估的部署（Q9）](../architecture/07-04.md#74-质量评估的部署q9)

### [7.5 公式候选优先级链（Q1、Q4）](../architecture/07-05.md#75-公式候选优先级链q1q4)

### [7.6 公式来源模块 `formula-source`（Q4）](../architecture/07-06.md#76-公式来源模块-formula-sourceq4)

### [7.7 云 OCR 识别来源（Q1）](../architecture/07-07.md#77-云-ocr-识别来源q1)

### [7.8 预算闸门：所有付费调用先预留（架构评审 P0-3）](../architecture/07-08.md#78-预算闸门所有付费调用先预留架构评审-p0-3)

### [7.9 服务商适配层（Wisdom 2026-10-30 19:45、19:46）](../architecture/07-09.md#79-服务商适配层wisdom-2026-10-30-19451946)

#### [7.9.1 格式与服务商分开](../architecture/07-09.md#791-格式与服务商分开)

#### [7.9.2 包与目录](../architecture/07-09.md#792-包与目录)

#### [7.9.3 能力标记](../architecture/07-09.md#793-能力标记)

#### [7.9.4 新增服务商](../architecture/07-09.md#794-新增服务商)

#### [7.9.5 规则](../architecture/07-09.md#795-规则)

#### [7.9.6 格式与服务商](../architecture/07-09.md#796-格式与服务商)

#### [7.9.7 契约测试](../architecture/07-09.md#797-契约测试)

#### [7.9.8 默认值（Wisdom 2026-10-30 20:57）](../architecture/07-09.md#798-默认值wisdom-2026-10-30-2057)

### [7.10 阅读顺序（Wisdom 2026-10-30 21:12）](../architecture/07-10.md#710-阅读顺序wisdom-2026-10-30-2112)

### [7.11 BabelDOC 借鉴与防御（Wisdom 2026-10-30 21:12）](../architecture/07-11.md#711-babeldoc-借鉴与防御wisdom-2026-10-30-2112)

### [7.12 处理路线：独立积木与声明式组合（Wisdom 2026-10-30 22:41、22:44、22:45）](../architecture/07-12.md#712-处理路线独立积木与声明式组合wisdom-2026-10-30-224122442245)

### [7.13 评分、路线、外发与预算的汇合（Wisdom 2026-10-31 13:14）](../architecture/07-13.md#713-评分路线外发与预算的汇合wisdom-2026-10-31-1314)

## [8. 数据模型与存储](../architecture/08.md#8-数据模型与存储)

### [8.1 权威数据](../architecture/08-01.md#81-权威数据)

#### [8.1.1 译文区块记录（D6）](../architecture/08-01.md#811-译文区块记录d6)

### [8.2 桌面存储布局](../architecture/08-02.md#82-桌面存储布局)

### [8.3 配置与密钥隔离](../architecture/08-03.md#83-配置与密钥隔离)

### [8.4 版本与升级（架构评审 P1-9）](../architecture/08-04.md#84-版本与升级架构评审-p1-9)

## [9. IPC 协议（renderer ↔ main）](../architecture/09.md#9-ipc-协议renderer-↔-main)

### [9.1 v2 桌面端 UI 新增 seam**【已采纳，ADR 0001，Wisdom 2026-11-04】**](../architecture/09-01.md#91-v2-桌面端-ui-新增-seam【已采纳adr-0001wisdom-2026-11-04】)

## [10. Python worker 协议（oi-parse/1）](../architecture/10.md#10-python-worker-协议oi-parse1)

### [10.1 传输](../architecture/10-01.md#101-传输)

### [10.2 端点](../architecture/10-02.md#102-端点)

### [10.3 worker 内部结构](../architecture/10-03.md#103-worker-内部结构)

### [10.4 协议版本与升级（架构评审 P1-9）](../architecture/10-04.md#104-协议版本与升级架构评审-p1-9)

### [10.5 本机 worker 的监管状态机（架构评审 P2-6）](../architecture/10-05.md#105-本机-worker-的监管状态机架构评审-p2-6)

## [11. 可观测性](../architecture/11.md#11-可观测性)

## [12. 测试策略](../architecture/12.md#12-测试策略)

### [12.1 评测记录](../architecture/12-01.md#121-评测记录)

## [13. CI 门禁](../architecture/13.md#13-ci-门禁)

## [14. v1 教训：一个 16,641 行的文件是怎么长出来的，v2 怎么从制度上防止](../architecture/14.md#14-v1-教训一个-16641-行的文件是怎么长出来的v2-怎么从制度上防止)

### 14.1 发生了什么（数据来自旧仓库只读审查，见 [v1 审查](./docs/v1-review.md) §3）

[本节原文](../architecture/14-01.md#141-发生了什么数据来自旧仓库只读审查见-v1-审查-§3)

### [14.2 造成的问题](../architecture/14-02.md#142-造成的问题)

### [14.3 根因](../architecture/14-03.md#143-根因)

### [14.4 v2 的制度性防线](../architecture/14-04.md#144-v2-的制度性防线)

## [15. 开发环境](../architecture/15.md#15-开发环境)

### [15.1 版本](../architecture/15-01.md#151-版本)

### [15.2 云端 Agent 的 `.cursor/environment.json`](../architecture/15-02.md#152-云端-agent-的-cursorenvironmentjson)

### [15.3 常用命令（M1 落地后）](../architecture/15-03.md#153-常用命令m1-落地后)

### [15.4 开发机与密钥（API 优先，Wisdom 2026-10-30 18:44）](../architecture/15-04.md#154-开发机与密钥api-优先wisdom-2026-10-30-1844)

## [16. 决策记录与变更](../architecture/16.md#16-决策记录与变更)

