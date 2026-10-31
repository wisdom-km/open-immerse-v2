# CI 与云端开发环境

## 怎么用

仓库还没有业务代码。这一节只说明怎么把 Node 与 Python worker 的工具链跑起来。项目许可证是 Apache-2.0。PDF 依赖锁定为 `pypdfium2`（Apache-2.0 OR BSD-3-Clause，当前 `5.14.0`）。禁止 PyMuPDF / `fitz`（AGPL-3.0）。CI 不调用付费 API，不读取密钥。

### 门禁

工作流是 `.github/workflows/ci.yml`。`node` job 跑 `pnpm check`、`pnpm test` 和 gitleaks。`pnpm check` 里的 pip 许可证（G10）要调用 `uv run`，所以这个 job 也安装锁定版本的 uv 和 worker Python。`python-worker` job 跑 ruff、pyright、import-linter、pytest、`tools/check-license/check-pip.mjs`，并核对 `uv.lock` 里的 PDF 依赖。pytest 收集到 0 个用例（退出码 5）时 CI 失败。两个 job 的 `setup-uv` 都把 `version` 设成 `pyproject.toml` 的 `required-version`（`0.13.6`）。

`pnpm check` 包含：ESLint（G2）、`tsc`（G3）、`tsconfig.core.json`（G14）、`tools/check-file-size`（G4）、dependency-cruiser（G5、G13、G15、G16）、core 测试里的 `@vitest-environment`（G16）、npm / pip / 模型清单许可证（G10）、一个切片（G18）、Conventional Commits、热点文件行数（G11 的具名文件）、PR 体量（G12）、`pnpm codegen && git diff --exit-code`（G7）。

还没接上，规格怎么写就怎么留着，不另造行为：

| 门禁 | 原因 |
| --- | --- |
| G1 Prettier | Wisdom 2026-10-31 14:12 明确延后（PRD §8 M1，backlog M1-DEFER-G1，仍按 E-P2）。Python 格式是 ruff format，已经在 CI |
| G3 `tsc -b` | Wisdom 2026-10-31 14:12 明确延后（backlog M1-DEFER-G3）。`composite` 会写出声明文件。第一个包使用 project references 之前保持 `tsc --noEmit`。Python 类型检查已锁定 pyright strict |
| G5 `ui-events-declared` | Wisdom 2026-10-31 14:12 明确延后（backlog M1-DEFER-G5）。怎样从代码认出发布和订阅，规格还没有写。`contracts/src/ui-events.ts` 也还没有 |
| G10 `license-checker` | 规格写的是这个工具。pnpm 工作区里它跟不上锁文件，改用 `pnpm licenses list --json`，规则仍是 §1.5。MPL-2.0「只作为独立文件」这一条没有机器检查 |
| G11 契约热点 | 装配根 `composition-root.ts` 和 `slots.ts` 的 30 行上限在跑。被两个以上切片 import 的契约文件要等有了 `packages/contracts` 再按 import 图算，不手写名单 |
| G16 规则编号覆盖 | 切片 README 怎么登记 core 规则，规格没有格式。`@vitest-environment` 和 `core-test-through-seam` 在跑 |

`minimatch` 的许可证是 BlueOak-1.0.0，不在 §1.5 白名单里。它是 ESLint 工具链的既有间接依赖。例外只写在 `tools/check-license/unlisted-permissive.json`，不是新的白名单。

G12 的非生成改动超过 600 行（只改 `packages/contracts` 时是 200 行）时，提交说明或环境变量 `PR_BODY` 里要有一行以 `G12:` 开头。这是「写明理由」的机器标记；规格没有规定标记原文。不计入行数的只有 `pnpm-lock.yaml`、`workers/parser/uv.lock` 和 `dist/`。

没有 `test:core` 脚本。core 测试文件是 `packages/features/*/test/core/**/*.ts`，和工具夹具一起由 Vitest 在 Node 环境收集。`packages/features/jobs` 是门禁样例：§4.3 里没有出边的最小切片形状，只导出 `sameJobId`，不是 §4.2 的任务状态机。G7 有一条生成器，把 `job-id.ts` 复制成 `job-id.gen.ts`。不改分支保护。

### 版本

| 工具 | 锁定位置 |
| --- | --- |
| Node.js | `.nvmrc`（`20.19.2`） |
| pnpm | `package.json` 的 `packageManager`（`10.34.9`）。Node 20.19.2 自带 corepack 0.31.0：pnpm 11 起需要 Node 22.13，pnpm 12 的启动文件这个 corepack 也执行不了，所以锁在 10 的最新版 |
| JS 依赖 | `pnpm-lock.yaml`（`corepack pnpm install --frozen-lockfile`） |
| Python | `workers/parser/.python-version`（当前 `3.11.18`） |
| uv | `workers/parser/.uv-version`（当前 `0.13.6`），并与 `workers/parser/pyproject.toml` 的 `tool.uv.required-version` 相同 |
| worker 依赖 | `workers/parser/uv.lock`（`uv sync --frozen --extra dev`） |

### 本机

Node 侧在仓库根目录：

```bash
nvm install
nvm use
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm run lint
corepack pnpm run typecheck
corepack pnpm run typecheck:core
corepack pnpm test
corepack pnpm run check
```

`pnpm test` 是 Vitest。`pnpm run typecheck` 在有 `.ts` / `.tsx` 时执行 `tsc --noEmit`。`pnpm check` 会跑 `git diff`，工作区必须干净，对比基线默认是 `main`。

Python worker 在 `workers/parser/`：

```bash
uv python install
uv sync --frozen --extra dev
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

pytest 收集到 0 个用例时退出码是 5。CI 不再把 5 改成通过。本机直接跑 `uv run pytest` 时，空目录仍会看到退出码 5。

### GitHub Actions

工作流是 `.github/workflows/ci.yml`，在 `push` 和 `pull_request` 上运行。

| Job | 步骤 | 缓存 |
| --- | --- | --- |
| `node` | `corepack pnpm install --frozen-lockfile`、锁定的 uv 与 `uv python install`（G10 的 `pip-licenses`）、gitleaks 8.30.1（校验 sha256）、`GATE_BASE=origin/main` 下的 `corepack pnpm run check`、`corepack pnpm test` | `actions/cache` 缓存 pnpm store，键来自 `pnpm-lock.yaml`。`setup-uv` 缓存 `workers/parser/uv.lock` 与该 Python |
| `python-worker` | 安装 uv `0.13.6` 与 Python、`uv sync --frozen --extra dev`、`ruff check`、`ruff format --check`、pytest（退出码 5 失败）、`pyright`、`lint-imports`、`node tools/check-license/check-pip.mjs`、确认锁文件含 `pypdfium2` 且不含 PyMuPDF | `astral-sh/setup-uv` 缓存 `workers/parser/uv.lock`，并缓存该 Python 解释器 |

建议在保护分支上把这两个 check 设为必需：`CI / node`、`CI / python-worker`。是否启用由仓库管理员决定；Agent 不修改分支保护。

同一分支的一次推送会同时触发 `push` 与（如果已开 PR）`pull_request`。保护分支看的是 PR 上的那一组 check。

### 云端 Agent

`.cursor/environment.json` 的 `install` 是 `bash .cursor/install.sh`。脚本用 `.nvmrc` 安装 Node，执行 `corepack enable`，再按 `pnpm-lock.yaml` 执行 `corepack pnpm install --frozen-lockfile`；然后安装锁定版本的 uv（可执行文件链到 `/usr/local/bin`，避免非交互登录壳读不到 `~/.bashrc`），并在 `workers/parser/` 执行 `uv python install` 与 `uv sync --frozen --extra dev`。

不安装 Paddle、Torch 或模型权重。Chrome 与中文字体仍按原环境尽力安装，失败不会把 Node / Python 安装算成成功。

合入并被环境采用之后，新的 Agent 才会用这份 install。已经在跑的 Agent 不会中途重跑。开发用的 API Key 仍只经 Cursor Secrets 注入，变量名见 ARCHITECTURE §15.4，不写入仓库。
