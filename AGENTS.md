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
- 证据目录与 agent 工作记录见 [RULES.md](RULES.md) §2：测试日志和截图放 `docs/evidence/<PR号>/`；做了什么写在 PR 描述的一小段里。不新建 `docs/agent-logs/`，不另抄完整对话（Cursor 已保存 transcript）。

## 命令

下列命令于 2026-10-31 在本机跑过。Node 以 `.nvmrc` 的 20.19.2 为准。空跑的细节见 [docs/ci-and-environment.md](docs/ci-and-environment.md)「当前是空跑」。worker 命令的工作目录是 `workers/parser/`。

本机若 `node` 不在 nvm 那一版的目录里，先把该目录放在 PATH 前面再跑 `corepack pnpm`。2026-10-31 用 Node v20.19.2 复跑，退出码与下表相同。

| 步骤 | 命令 | 退出码 | 验证备注 |
| --- | --- | --- | --- |
| 安装 Node | `nvm install`，然后 `nvm use` | 0，0 | 已有 20.19.2，打印 Now using node v20.19.2 |
| 启用 pnpm | `corepack enable` | 0 | `packageManager` 为 pnpm@10.34.9 |
| 安装 JS 依赖 | `corepack pnpm install --frozen-lockfile` | 0 | Lockfile is up to date，Already up to date |
| lint | `corepack pnpm run lint` | 0 | `eslint . --max-warnings 0` |
| typecheck | `corepack pnpm run typecheck` | 0 | 目前空跑。打印 `typecheck: no .ts or .tsx sources; skipped.` 后成功。出现 `.ts` / `.tsx` 后改为 `tsc --noEmit`，类型错误会使命令失败 |
| test | `corepack pnpm test` | 0 | 目前空跑。`node --test` 报告 `# tests 0`。仓库里还没有测试文件 |
| core 测试 | 不执行 | 脚本尚未提供 | `package.json` 没有 `test:core`。2026-10-31 试跑 `corepack pnpm test:core`，退出码 254（Command "test:core" not found）。M1 前 PR 里此项写不适用（脚本尚未提供）；M1 起以 package.json 实际脚本为准。不要加空脚本。`docs/design/md-reader.md` 的 MD-16 仍写着这个命令名，该文件归 Loom（N-10），本表不改它；M1 前不要跑 |
| worker 安装 | `uv python install`，然后 `uv sync --frozen --extra dev` | 0，0 | Python 3.11.18 已在；uv 0.13.6；Checked 7 packages |
| worker lint | `uv run ruff check .`，以及 `uv run ruff format --check .` | 0，0 | ruff 0.17.3 |
| worker 测试 | `uv run pytest` | 5 | 目前空跑。`tests/` 只有 `.gitkeep`，collected 0 items。本机退出码是 5。CI 把 5 印成 `pytest: no tests collected; empty run allowed.` 后当作通过。本机看到 5 是空目录，不是用例失败 |
| JS 单测 | 有文件之后：`node --test <文件>`，或 `node --test --test-name-pattern '<名字>'` | 见备注 | 用例尚未提供，没有 `*.test.js` / `*.test.ts`。2026-10-31 跑 `node --test --test-name-pattern does-not-match`，退出码 0（tests 0）。这只说明过滤器能跑 |
| Python 单测 | 有文件之后：`uv run pytest tests/test_<模块>.py`，或 `uv run pytest -k <名字>` | 见备注 | 用例尚未提供。`uv run pytest -k does_not_match` 退出码 5（collected 0）。指向不存在的文件时退出码 4（2026-10-31：`uv run pytest tests/test_does_not_exist.py`） |

## 界面与核心

PR #11 审查（`docs/reviews/v2-full-review.md` §4.3）认为 seam 与 G13–G16 已经让 UI 停在接口上。Wisdom 2026-10-30 23:56 把这一点写进 ARCHITECTURE §2.1 与 RULES N-21：core、路线层、积木、存储不依赖界面；界面不直接访问 worker、存储或服务商。验收是 PRD AC-100。
