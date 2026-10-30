# 给 coding agent 的开工说明

产品一句话：英文学术 PDF 的中文对照阅读（Windows / macOS 桌面应用）。不是公式提取后的矢量重绘，不是手机客户端，不做订阅计费。

本文只做指针，不复制规格正文。冲突时：用户（Wisdom）的明确指示 > [RULES.md](RULES.md) > [ARCHITECTURE.md](ARCHITECTURE.md) > [PRD.md](PRD.md) > `docs/architecture/` 草案。

## 开工前阅读

1. [PRD.md](PRD.md)（做什么、不做什么、验收编号）
2. [ARCHITECTURE.md](ARCHITECTURE.md)（切片、端口、协议）
3. [RULES.md](RULES.md) §6（N-01–N-22）与 §8（界面与核心解耦、交接模板）
4. 涉及界面时再读 [DESIGN.md](DESIGN.md) 与 [docs/design-principles.md](docs/design-principles.md)。标「待审批」的颜色、间距、字号不是定稿。DESIGN 文首若写「交付前只搭结构」，以 RULES 文首为准。
5. `docs/architecture/` 是历史草案，不授权实现。

## 必须遵守

- 禁止事项在 RULES §6。其中 N-20：不要在 core 或某个积木里写死另一个积木。N-21：依赖方向只能是界面 → 接口 → core；只改界面的 PR 不改 core 目录。N-16 同一句。
- 交接模板在 RULES §8.4。任务说明里要有 RULES §8.3 规定的那一句，并写明任务类型（UI 改动 / seam 变更 / core 改动）和切片名。
- 分支与 PR：`feature/`、`fix/`、`chore/`；PR 先开 Draft；描述按 RULES §2 的五项；不自行合入。模板在 `.github/PULL_REQUEST_TEMPLATE.md`。
- 当前 CI 是空跑：没有 TypeScript 源文件时 typecheck 直接成功；pytest 退出码 5 在工作流里被当成通过。全绿不等于 ARCHITECTURE §13 的 G1–G18。门禁在 M1 补上，此前不新建 `packages/features/**`（N-22）。细节见 [docs/ci-and-environment.md](docs/ci-and-environment.md) 的「当前是空跑」。不改 CI 行为，不改分支保护。
- 三种版本号（规格文档 v0.6、还没有的应用 semver、worker 包 `0.0.0`）见 README「三种版本号」。决定只从 [docs/adr/README.md](docs/adr/README.md) 指到 Q1–Q12。事故复盘用 [docs/incidents/TEMPLATE.md](docs/incidents/TEMPLATE.md)。
- 空的 `AccountSession` 返回 `not_in_v2`。不要加登录页、订阅或计费（PRD AC-94）。
- 不要实现矢量重绘、浏览器扩展、手机同步。未核验的公式显示裁图或占位框，不要把 LaTeX 冒充已核验（N-15、N-17）。

## 界面与核心

PR #11 审查（`docs/reviews/v2-full-review.md` §4.3）认为 seam 与 G13–G16 已经让 UI 停在接口上。Wisdom 2026-10-30 23:56 把这一点写进 ARCHITECTURE §2.1 与 RULES N-21：core、路线层、积木、存储不依赖界面；界面不直接访问 worker、存储或服务商。验收是 PRD AC-100。
