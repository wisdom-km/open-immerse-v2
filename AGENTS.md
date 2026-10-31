# 给 coding agent 的开工说明

产品一句话：英文学术 PDF 的中文对照阅读（Windows / macOS 桌面应用）。不是公式提取后的矢量重绘，不是手机客户端，不做订阅计费。

本文只做指针，不复制规格正文。冲突时：用户（Wisdom）的明确指示 > [RULES.md](RULES.md) > [ARCHITECTURE.md](ARCHITECTURE.md) > [PRD.md](PRD.md) > `docs/architecture/` 草案。

## 开工前阅读

先读 [RULES.md](RULES.md) §6（N-01–N-22）和 §9（Definition of Done）。然后只读下表里本任务那一行的节，加上该行点名的验收编号。不要先通读 PRD 与 ARCHITECTURE。

涉及界面时，该行已经指向 [DESIGN.md](DESIGN.md) 与 [docs/design-principles.md](docs/design-principles.md)。标「待审批」的颜色、间距、字号不是定稿。DESIGN 文首若写「交付前只搭结构」，以 RULES 文首为准。`docs/architecture/` 是历史草案，不授权实现。

角色、升级与合入见 [docs/WORKFLOW.md](docs/WORKFLOW.md)。

## 按任务类型阅读

下表是要读的节，不复制那些文件的正文。任务类型的定义在 RULES §8.3（UI 改动 / seam 变更 / core 改动）。纯文档、worker、日志、环境、移植 v1 规则不是那三选一，交接说明按 RULES §9 写「不适用」。

| 任务类型 | 要读的节 |
| --- | --- |
| UI 改动 | [RULES.md](RULES.md) §8、§8.3、§8.4，以及 N-16、N-21；[ARCHITECTURE.md](ARCHITECTURE.md) §2.1–§2.6 与 §13 的 G13–G16；[DESIGN.md](DESIGN.md) 里对应的屏（§4）和 §3.7；[docs/design-principles.md](docs/design-principles.md) §1；[PRD.md](PRD.md) §6.3、AC-21、AC-100。不改 DESIGN 与 `docs/design/**` 的正文（N-10）。不改 core 目录 |
| seam 变更 | [ARCHITECTURE.md](ARCHITECTURE.md) §2.3、§2.4、§4.1；[RULES.md](RULES.md) §3 第 3 条（契约先行）、§8.2 规则 3 |
| core 改动 | [ARCHITECTURE.md](ARCHITECTURE.md) §2.1、§4.2 里该切片的那一行、§5、§6、§12；[RULES.md](RULES.md) §1.1、§5、§8；[PRD.md](PRD.md) §6 里对得上的 AC |
| worker / parser | [workers/parser/AGENTS.md](workers/parser/AGENTS.md)；[ARCHITECTURE.md](ARCHITECTURE.md) §10 与 §7.2；[RULES.md](RULES.md) §1.2；[docs/ci-and-environment.md](docs/ci-and-environment.md) 的 Python 段 |
| 纯文档 / 规格 | [RULES.md](RULES.md) §7、§9；本文；[.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)。变更再记 [docs/spec-changelog.md](docs/spec-changelog.md)。不改 N-10、N-11 的文件 |
| 公式、评分、路线 | [PRD.md](PRD.md) §3.4、§3.5；[ARCHITECTURE.md](ARCHITECTURE.md) §7.1、§7.4、§7.5、§7.12；[RULES.md](RULES.md) N-15、N-17、N-20 |
| 服务商、预算、外发 | [ARCHITECTURE.md](ARCHITECTURE.md) §7.0、§7.8、§7.9、§15.4；[RULES.md](RULES.md) §5 第 14–18 条、N-05；[PRD.md](PRD.md) §3.3、AC-94 |
| 日志与诊断 | [ARCHITECTURE.md](ARCHITECTURE.md) §11；[RULES.md](RULES.md) §4「调试模式」、§5 第 8 条；[PRD.md](PRD.md) S10、AC-09、AC-101 |
| 环境与 CI | [docs/ci-and-environment.md](docs/ci-and-environment.md)；本文「命令」；[ARCHITECTURE.md](ARCHITECTURE.md) §15。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 CI 行为与分支保护（N-02） |
| 移植 v1 规则 | [docs/v1-review.md](docs/v1-review.md) 文首钉住的旧仓库 `main@96f1dfe`（`96f1dfe263fd1138775cb84053e97dff707ae09a`）；[RULES.md](RULES.md) §1.4。只迁规则和测试意图，不迁代码（N-07） |

交接句在 RULES §8.3。分支、Draft 与完成条件在 RULES §2、§9。空的 `AccountSession` 返回 `not_in_v2`，不要加登录、订阅或计费（AC-94）。三种版本号见 README「三种版本号」。决定只从 [docs/adr/README.md](docs/adr/README.md) 指到 Q1–Q12。事故复盘用 [docs/incidents/TEMPLATE.md](docs/incidents/TEMPLATE.md)。

## 命令

下列命令于 2026-10-31 在 Cloud Agent 环境跑过。Node 以 `.nvmrc` 的 20.19.2 为准。哪些门禁在跑见 [docs/ci-and-environment.md](docs/ci-and-environment.md)「门禁」。worker 命令的工作目录是 `workers/parser/`。

Cloud Agent 的 PATH 里 `/exec-daemon/node`（v22.23.4）排在 nvm 前面。不把 nvm 的 bin 放在 PATH 前面时，`node -v` 仍是 v22.23.4。下表是把 `/home/ubuntu/.nvm/versions/node/v20.19.2/bin` 放在 PATH 前面之后的退出码。先放这个目录，再跑 `corepack pnpm`。

| 步骤 | 命令 | 退出码 | 验证备注 |
| --- | --- | --- | --- |
| 安装 Node | `nvm install`，然后 `nvm use` | 0，0 | 已有 20.19.2，打印 Now using node v20.19.2 |
| 启用 pnpm | `corepack enable` | 0 | `packageManager` 为 pnpm@10.34.9 |
| 安装 JS 依赖 | `corepack pnpm install --frozen-lockfile` | 0 | Lockfile is up to date，Already up to date |
| lint | `corepack pnpm run lint` | 0 | `eslint . --max-warnings 0` |
| typecheck | `corepack pnpm run typecheck` | 0 | 已有 `.ts`。`tsc --noEmit --project tsconfig.json`。类型错误会使命令失败 |
| typecheck:core | `corepack pnpm run typecheck:core` | 0 | G14。`tsc -p tsconfig.core.json --noEmit`。`lib` 只有 ES2023，`types` 为空 |
| test | `corepack pnpm test` | 0 | Vitest，`environment: node`。include 含 `tools/**/*.test.ts` 与 `packages/features/*/test/core/**/*.ts`。没有 `test:core` 脚本 |
| check | `corepack pnpm run check` | 0 | G2、G3、G4、G5、G7、G10、G11、G12、G13–G16、G18 与 Conventional Commits。失败时 stderr 追加 [docs/gate-remediation.md](docs/gate-remediation.md) 的说明。G12 超过 600 行时提交说明或 `PR_BODY` 里要有一行 `G12:`。对比基线默认 `main`，CI 设 `GATE_BASE=origin/main` |
| core 测试 | 不执行 | 脚本尚未提供 | `package.json` 没有 `test:core`。2026-10-31 试跑 `corepack pnpm test:core`，退出码 254（Command "test:core" not found）。M1 前 PR 里此项写不适用（脚本尚未提供）；M1 起以 package.json 实际脚本为准。不要加空脚本。`docs/design/md-reader.md` 的 MD-16 仍写着这个命令名，该文件归 Loom（N-10），本表不改它；M1 前不要跑 |
| worker 安装 | `uv python install`，然后 `uv sync --frozen --extra dev` | 0，0 | Python 3.11.18 已在；uv 0.13.6 |
| worker lint | `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check .`，以及把 `--id` 换成 `G1` 再跑 `uv run ruff format --check .` | 0，0 | 工作目录是 `workers/parser/`。ruff 0.17.3。失败时追加改正说明 |
| worker 类型 | `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright` | 0 | 工作目录是 `workers/parser/`。RULES §1.2。strict。钉在 pyright 1.1.407 |
| worker 分层 | `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports` | 0 | 工作目录是 `workers/parser/`。G6。契约在 `workers/parser/pyproject.toml` |
| worker 测试 | `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest` | 0 | 工作目录是 `workers/parser/`。收集到测试。退出码 5（0 个用例）不再被 CI 改成通过 |
| JS 单测 | `corepack pnpm exec vitest run <文件>` | 0 | 例如 `tools/check-file-size/limit.test.ts`。过滤：`corepack pnpm exec vitest run --test-name-pattern '<名字>'` |
| Python 单测 | `uv run pytest tests/test_<模块>.py`，或 `uv run pytest -k <名字>` | 0 | 例如 `tests/test_smoke.py`。指向不存在的文件时退出码 4 |

在 `workers/parser/` 里工作时，局部命令见 [workers/parser/AGENTS.md](workers/parser/AGENTS.md)。与本文冲突时以本文和 RULES 为准。
