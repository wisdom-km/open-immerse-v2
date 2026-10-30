# 待办与架构评审处理状态

状态：v0.6。日期：2026-10-30（Asia/Shanghai）。
用途：逐条记录[架构评审](./reviews/2026-10-30-architecture-review.md)的每个发现由哪个规格 PR 处理、落在规格哪里，以及还没处理、留给哪个里程碑的事。决定的理由见[差异清单](./v2-gap-and-changes.md) §6.6–§6.8；本文只记状态，不重述规格。

三个规格 PR：

- **PR A**：架构评审修复 A（Wisdom 2026-10-30 19:57 批准，20:57 定下待定项；差异清单 §6.6）。
- **PR B**：架构评审修复 B 与服务商适配层（Wisdom 2026-10-30 19:45、19:46、19:57；差异清单 §6.7）。
- **PR C**：阅读顺序、M6 拆分、BabelDOC 借鉴与评审其余项（Wisdom 2026-10-30 21:12；差异清单 §6.8）。

「已处理」指规格已写明做法与验收；实现仍在对应里程碑。

## 1. P0

| 编号 | 发现 | 状态 | 落点 |
| --- | --- | --- | --- |
| P0-1 | 解析流水线没有归属切片 | 已处理（PR A） | ARCH §2.5、§4.2 `ingest`、§4.3、F-17；PRD §4 原则 3 |
| P0-2 | 不能把整个 application 搬进 utility 进程 | 已处理（PR A） | ARCH §1、§9 |
| P0-3 | 默认付费路径不受预算停机约束 | 已处理（PR A） | ARCH §7.8、§4.2 `budget`；PRD AC-06、AC-63 |
| P0-4 | `oi-md/1` 表达不了未核验公式的裁图 | 已处理（PR A） | ARCH §8.1.1；PRD AC-04、AC-48、AC-49 |
| G17 | 同一 PR 改 UI 与 core 即失败 | 已删除（PR A）；PR C 用 G18「一个 PR 一个切片」拦住「改 UI 又改另一个切片的 core」 | ARCH §13；RULES §2、§8 |

## 2. P1

| 编号 | 发现 | 状态 | 落点 |
| --- | --- | --- | --- |
| P1-1 | 外发同意的验收句子和决定正文不一致 | 已处理（PR B） | ARCH §7.0 第 6 条；PRD §3.3、AC-61 ⑦ |
| P1-2 | 外发同意没有端口 | 已处理（PR B） | ARCH §7.0 第 6 条、`EgressCheck`；PRD AC-65 |
| P1-3 | 远程 worker 不应收到用户的 Key | 已处理（PR B） | ARCH §10.1、§10.2；PRD AC-65 |
| P1-4 | 决策记录里还留着被取代的句子 | 已处理（PR B）；PR C 照同一做法删除被取代的句子 | 差异清单 §6.7、§6.8 |
| P1-5 | 阅读顺序两套实现，没有对拍夹具 | 已处理（PR C）：主顺序取版面模型，`engines/reading_order/` 校验与兜底；文字层基础档实现同一规则集的共有部分，以 `fixtures/parsing-rules/` 对拍 | ARCH §7.10；PRD AC-68–AC-71；RULES §2、§5 第 19 条 |
| P1-6 | 借用多模态翻译没有放置位置 | 已处理（PR C）：装配期复用，没有 `translation → repair` | ARCH §4.3；PRD AC-78 |
| P1-7 | Markdown 两条解析路径，与 IPC 体积冲突 | 已处理（PR C）：`pure.ts` 不导出解析器，G15 加检查，`readFile` / `readBlocks` 块窗口 | ARCH §4.5.3、§4.5.4、G15；PRD AC-79 |
| P1-8 | HTTP 错误映射写在三处 | 已处理（PR B） | ARCH §7.9.5、`ProviderFailure` |
| P1-9 | 存储与协议不能独立升级 | 已处理（PR B） | ARCH §8.4、§10.4；PRD AC-66 |
| P1-10 | Electron 安全基线缺口 | 已处理（PR B） | ARCH §9；PRD AC-67 |
| P1-11 | 门禁把「一个切片」和「一个 PR」焊反了 | 前半（G17）已处理（PR A）；后半已处理（PR C）：热点收窄为装配根、`slots.ts` 与被两个以上切片 import 的契约文件，契约 PR 上限 200 行，新增 G18，M1 违规样例改写 | ARCH §13 G11、G12、G18；RULES §2、§3；PRD AC-80、M1 |
| P1-12 | M6 承担了「公式变成已核验」的全部前提 | 已处理（PR C）：M3 加评分状态机与假评估器；M6 拆为 M6a–M6d；托管 API 核实通过前不建后端文件 | ARCH §7.1「评分分期」、§7.0、§10.3；PRD AC-84、§8 |

## 3. P2

| 编号 | 发现 | 状态 | 落点 |
| --- | --- | --- | --- |
| P2-1 | 函数 80 行和「深模块」互相拉 | 已处理（PR C）：domain 纯函数只受文件上限，一个不变量一个文件 | ARCH §6；RULES §1.3；PRD AC-80 ④ |
| P2-2 | UI 事件总线能绕过依赖矩阵 | 已处理（PR C）：登记发布方与订阅方，载荷只能是普通数据，新增事件要 ADR | ARCH §4.3、§5.3、G5；PRD AC-82 |
| P2-3 | 历史草案的表格仍像现行需求 | 已处理（PR C）：表格上方加一句说明 | `docs/architecture/README.md` |
| P2-4 | 诊断包体积沿用 v1 | 已处理（PR C）：保留天数与体积可设置，默认值 M2 实测后定标 | ARCH §11；PRD AC-83 |
| P2-5 | CI 没有操作系统矩阵 | 已处理（PR C）：Linux 全部门禁 + Windows 无模型的 worker 健康检查与两侧夹具 | ARCH §13；PRD AC-80 ⑤ |
| P2-6 | 本机 worker 的监管状态机 | 已处理（PR C） | ARCH §10.5；PRD AC-81 |
| P2-7 | OpenAI 兼容子集可以先定 | 已处理（PR C）：`fixtures/providers/openai-chat-baseline/`，M4 之前建 | ARCH §7.9.7 |
| P2-8 | 录制样例不要带上真实论文页 | 已处理（PR B 的 §7.9.7 与 PR C 的 §12 统一规则） | ARCH §7.9.7、§12 |
| P2-9 | 仓库现状与 M1 目标的落差 | 不需要改规格（评审结论是预期的落差）；M1 当天引入 pnpm、Vitest、uv | PRD §8 M1 |
| P2-10 | 规格写法在制造漂移 | 作为写法执行（PR B、PR C）：删除被取代的句子，不追加「后来改为」；拆分规格文件等 M1 的 ADR 目录建立后再议 | 差异清单 §6.7、§6.8 |

## 4. 留给实现里程碑的事

| 事项 | 里程碑 | 出处 |
| --- | --- | --- |
| 阅读顺序实测：PP-DocLayoutV2、V3 开源输出与 AI Studio 托管 API 是否带阅读顺序 | M0（待执行，M3 开工前完成） | PRD §8 M0；差异清单 §7 |
| V3 不带顺序时标准档的顺序来源；高质量档是否改用 V2 | 实测后由 Wisdom 定 | ARCH §7.10「未决」 |
| 阅读顺序校验、题注绑定、扫描页判定、段落切分的阈值 | 基准定标（M3） | ARCH §7.10、§7.11；PRD QM-01、QM-02 |
| 百度 AI Studio PaddleOCR 托管 API 能否作为引擎 A 的来源 | M3 开工前 | ARCH §7.0；差异清单 §2.4.1 |
| worker 监管的重启上限与超时默认值 | M3（supervisor 实现 PR） | ARCH §10.5 |
| 诊断保留天数与体积的默认值 | M2 实测后 | ARCH §11 |
| Markdown 块窗口预算的默认值 | M2 实测后 | ARCH §4.5.3 |
| 首批 ADR：G18、`ui-events-declared`、`supervisor-state`、解析规则集 `oi-rules/1` | M1 建立 `docs/adr/` 时 | ARCH §16 |
| 高质量档是否开放 | M6d，QM-13 由用户拍板 | PRD §8 M6d |
