# open-immerse-v2
Open Immerse v2 - PDF formula extraction and vector redraw project

## 规格（唯一真相源）

- [PRD.md](PRD.md)：做什么、为谁、范围、验收、里程碑。
- [ARCHITECTURE.md](ARCHITECTURE.md)：分层、功能切片、接口、协议、存储、CI 门禁、v1 教训。
- [RULES.md](RULES.md)：编码约定、分支与 PR、并行开发、测试纪律、Agent 禁止事项。
- [docs/v1-review.md](docs/v1-review.md)：v1 哪些能用、哪些不用（附原文件与行号）。
- [docs/v2-gap-and-changes.md](docs/v2-gap-and-changes.md)：模型核实、草案修改清单、待拍板问题。
- [docs/backlog.md](docs/backlog.md)：架构评审各项的处理状态与留给里程碑的事。
- 视觉与交互：DESIGN.md、docs/design-principles.md（待 Loom 产出）。

以下早期草案保留为历史输入；与上述规格冲突时以规格为准。

## 架构与需求评审（早期草案）

[完整方案与阅读导航](docs/architecture/README.md)

包含需求确认、桌面与云端架构、双引擎解析、核心数据协议、高精度规格迁移、手机与语音接口，以及分阶段实施和验收清单。

当前为可审阅设计方案；应用实现、模型精度与双平台性能仍须按方案逐项验收。

## 许可证

本项目以 [Apache License 2.0](LICENSE) 发布（版权人 wisdom-km）。新引入的依赖与模型权重必须与 Apache-2.0 兼容，禁止 AGPL / GPL 依赖（含 PyMuPDF），规则见 [RULES.md](RULES.md) §1.5。
