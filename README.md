# open-immerse-v2

Open Immerse v2：把英文学术 PDF 做成可对照、可追溯、公式不走样的中文阅读。桌面应用，覆盖 Windows 与 macOS。

没有上下文时按这个顺序读，不要跳到历史草案：

1. [PRD.md](PRD.md)：做什么、不做什么、验收编号。
2. [ARCHITECTURE.md](ARCHITECTURE.md)：切片、端口、协议。
3. [RULES.md](RULES.md) §6 与 §8：禁止事项、界面与核心解耦、交接。
4. 涉及界面时再读 [DESIGN.md](DESIGN.md) 与 [docs/design-principles.md](docs/design-principles.md)。标「待审批」的视觉数值不是定稿。
5. [docs/architecture/](docs/architecture/README.md) 是历史草案，不授权实现。

与根目录三份规格冲突时，以规格为准（优先级见 RULES 文首）。不要实现矢量重绘、浏览器扩展、手机客户端、订阅计费。

给 Agent 的短指针在 [AGENTS.md](AGENTS.md)。贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 规格（唯一真相源）

- [PRD.md](PRD.md)：做什么、为谁、范围、验收、里程碑。
- [ARCHITECTURE.md](ARCHITECTURE.md)：分层、功能切片、接口、协议、存储、CI 门禁、v1 教训。
- [RULES.md](RULES.md)：编码约定、分支与 PR、并行开发、测试纪律、Agent 禁止事项。
- [docs/v1-review.md](docs/v1-review.md)：v1 哪些能用、哪些不用（附原文件与行号）。矢量重绘不立项。
- [docs/v2-gap-and-changes.md](docs/v2-gap-and-changes.md)：模型核实、草案修改清单、待拍板问题。
- [docs/backlog.md](docs/backlog.md)：架构评审各项的处理状态与留给里程碑的事。
- 视觉与交互：[DESIGN.md](DESIGN.md)、[docs/design-principles.md](docs/design-principles.md)（Loom 2026-10-30 入库）。

## 历史草案

[docs/architecture/](docs/architecture/README.md) 是早期输入。其中的需求表（含手机平台、账号式能力）不授权实现。冲突时以根目录 `PRD.md`、`ARCHITECTURE.md`、`RULES.md` 为准。

## CI 与云端环境

Node 依赖用 pnpm（`corepack pnpm`）。检查命令、GitHub Actions 与云端 Agent 的 Node / Python 安装见 [docs/ci-and-environment.md](docs/ci-and-environment.md)。

当前 CI 是空跑。仓库里没有 `.ts` / `.tsx` 时，`tools/typecheck.mjs` 打印 `typecheck: no .ts or .tsx sources; skipped.` 并以退出码 0 结束。`.github/workflows/ci.yml` 把 pytest 退出码 5（没有收集到测试）当成通过。工作流全绿不等于 ARCHITECTURE §13 的 G1–G18。真正的门禁在 M1 补上。在那之前不新建 `packages/features/**` 业务切片（RULES N-22）。这次不改 CI 行为，也不改分支保护。

## 三种版本号

仓库里有三种版本号，各管一件事：

1. 规格文档版本。`PRD.md`、`ARCHITECTURE.md`、`RULES.md` 文首的 v0.6 只表示这三份规格的修订。这次不升这个号。
2. 应用版本。给人安装的桌面应用用 semver。现在没有安装包，不要把 v0.6 当成应用版本。
3. worker 包版本。`workers/parser/pyproject.toml` 的 `version`，今天是 `0.0.0`。它只描述 Python worker 包，不描述规格，也不描述安装包。

变更记录从第一次给人安装的构建开始记，不回溯每一份规格 PR。

决定索引在 [docs/adr/README.md](docs/adr/README.md)，只指向已有的 Q1–Q12，不另写决定。事故复盘的空白模板在 [docs/incidents/TEMPLATE.md](docs/incidents/TEMPLATE.md)。

## 许可证

本项目以 [Apache License 2.0](LICENSE) 发布（版权人 wisdom-km）。新引入的依赖与模型权重必须与 Apache-2.0 兼容，禁止 AGPL / GPL 依赖（含 PyMuPDF），规则见 [RULES.md](RULES.md) §1.5。
