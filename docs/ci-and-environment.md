# CI 与云端开发环境

## 怎么用

这一节说明怎么把 Node 与 Python worker 的工具链跑起来。项目许可证是 Apache-2.0。PDF 依赖锁定为 `pypdfium2`（Apache-2.0 OR BSD-3-Clause，当前 `5.14.0`）。禁止 PyMuPDF / `fitz`（AGPL-3.0）。CI 不调用付费 API，不读取密钥。

### 门禁

工作流是 `.github/workflows/ci.yml`。`node` job 跑 `pnpm check`、`pnpm test` 和 gitleaks。`pnpm check` 里的 pip 许可证（G10）要调用 `uv run`，所以这个 job 也安装锁定版本的 uv 和 worker Python。`python-worker` job 跑 ruff、pyright、import-linter、pytest、`tools/check-license/check-pip.mjs`，并核对 `uv.lock` 里的 PDF 依赖。pytest 收集到 0 个用例（退出码 5）时 CI 失败。`worker-health-windows` 与 `worker-health-macos` 共用同一组步骤：从 stdin 传入一次性令牌、启动 `python -m oi_worker`、读 `{"port": n}`、带 `Authorization: Bearer` 与 `OI-Protocol` 请求 `GET /v1/health`（200）、优雅停止后 stdout 有 `{"event":"exited"}` 且退出码为 0，并跑 `fixtures/protocol/` 的两侧测试。`fixtures/parsing-rules/` 目录还不在仓库里，目录出现而这一步没有跑它时该步失败。安装 uv 的 job 都把 `version` 设成 `pyproject.toml` 的 `required-version`（`0.13.6`）。

`pnpm check` 包含：ESLint（G2）、`tsc`（G3）、`tsconfig.core.json`（G14）、`tools/check-file-size`（G4）、dependency-cruiser（G5、G13、G15、G16）、core 测试里的 `@vitest-environment`（G16）、npm / pip / 模型清单许可证（G10）、一个切片（G18）、Conventional Commits、热点文件行数（G11 的具名文件）、PR 体量（G12）、`pnpm codegen && git diff --exit-code`（G7）。

失败时在原输出后面追加改正说明。文案只在 `tools/gate-remediation/catalog.json`，对照表在 [gate-remediation.md](gate-remediation.md)。`tsc -b` 仍不是必需检查（M1-DEFER-G3）。G3 的违例样例在 `tools/gate-fixtures/g3/`，不在主 `tsconfig` 的编译范围内。

业务切片的 M1 门禁前提（RULES N-22，Wisdom 2026-11-02）由已经在 CI 运行的 G6（import-linter）、pyright 与 gitleaks 满足。G1、G3 `tsc -b`、G5 仍是 M1 交付（Issue #34），不挡住业务切片。工作流全绿仍不等于 G1–G18 全部已有。本段不改 CI 行为。

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

没有 `test:core` 脚本。core 测试文件是 `packages/features/*/test/core/**/*.ts`，和工具夹具一起由 Vitest 在 Node 环境收集。`packages/features/jobs` 是门禁样例：§4.3 里没有出边的最小切片形状，只导出 `sameJobId`，不是 §4.2 的任务状态机。G7 有一条生成器，把 `job-id.ts` 复制成 `job-id.gen.ts`。G6 的 Python core forbidden 先覆盖 `mapping.py`、`batching.py`、`http_errors.py`。`reading_order/`、`preprocess/scan_detect.py`、`modular_a/paragraphs.py` 不在这棵树上：RULES §2 把这些路径当成解析规则 PR，必须同时带上 TS 文字层和夹具，且不能再带别的文件。不改分支保护。

### 版本

| 工具 | 锁定位置 |
| --- | --- |
| Node.js | `.nvmrc`（`22.23.4`）。`package.json` 的 `engines.node` 是 `>=22.23.4`。GitHub Actions 的 `actions/setup-node` 用 `node-version-file: .nvmrc`，工作流里没有另写 `node-version` |
| pnpm | `package.json` 的 `packageManager`（`10.34.9`）。Wisdom 2026-11-02 21:44 批准这次只升 Node，pnpm 保持 10。Node 22.23.4 自带 corepack 0.36.0，能启动这个版本 |
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

`tools/vitest-collect/no-node-modules.test.ts` 必须在仓库根目录跑（PR #90）。它用 `path.resolve(".")` 作为子进程 cwd，并从该 cwd 解析 `node_modules/vitest/vitest.mjs`。

Python worker 在 `workers/parser/`：

```bash
uv python install
uv sync --frozen --extra dev
node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check .
node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check .
node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest
node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright
node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports
```

pytest 收集到 0 个用例时退出码是 5。CI 不再把 5 改成通过。本机直接跑 `uv run pytest` 时，空目录仍会看到退出码 5。

### GitHub Actions

工作流是 `.github/workflows/ci.yml`。`push` 只在分支 `main` 上触发。拉取请求由 `pull_request` 触发（GitHub 默认事件：`opened`、`synchronize`、`reopened`）。已经开了 PR 的分支再推送时，这一次推送只产生 `pull_request` 运行：`node`、`python-worker`、`worker-health-windows`、`worker-health-macos` 与 `desktop-e2e-windows` 在该 tip 上各出现一次。还没有 PR 的分支推送不会跑这个工作流。本仓库的流程是推上去立刻开 Draft PR，所以正常开发仍会跑。`node`、`python-worker` 与 `worker-health` 矩阵里的 `actions/setup-node` 都读 `.nvmrc`（`22.23.4`），没有另写版本号。

| Job | 步骤 | 缓存 |
| --- | --- | --- |
| `node` | `corepack pnpm install --frozen-lockfile`（`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`，不下载 Playwright 浏览器）、锁定的 uv 与 `uv python install`（G10 的 `pip-licenses`）、gitleaks 8.30.1（校验 sha256；失败时追加 G9 说明）、`GATE_BASE=origin/main` 下的 `corepack pnpm run check`、`corepack pnpm test` | `actions/cache` 缓存 pnpm store，键来自 `pnpm-lock.yaml`。`setup-uv` 缓存 `workers/parser/uv.lock` 与该 Python |
| `python-worker` | 安装 uv `0.13.6` 与 Python、`uv sync --frozen --extra dev`、`ruff check`（G2）、`ruff format --check`（G1）、pytest（G8，退出码 5 失败）、`pyright`（G3-pyright）、`lint-imports`（G6）、`node tools/check-license/check-pip.mjs`、确认锁文件含 `pypdfium2` 且不含 PyMuPDF（失败时追加 G10 说明） | `astral-sh/setup-uv` 缓存 `workers/parser/uv.lock`，并缓存该 Python 解释器 |
| `worker-health-windows`、`worker-health-macos` | 同一矩阵，步骤相同。Windows 跑 `windows-latest`，macOS 跑 `macos-latest`。安装 uv `0.13.6` 与 Python、`uv sync --frozen --extra dev`（不装引擎 extra，不下载模型）。`pytest tests/api/test_server.py` 从 stdin 传入一次性令牌并启动 `python -m oi_worker`，带 `Authorization: Bearer` 与 `OI-Protocol` 请求 `GET /v1/health`，断言 200，响应体没有路径或 `key`，退出码为 0，且 stdout 有 `{"event":"exited"}`。Python 跑 `tests/protocol`。安装 Node 依赖时 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`。Node 跑 `fixtures/protocol/` 的 Vitest。`fixtures/parsing-rules/` 还不在仓库里；目录一旦出现而这一步没有跑它，该步失败 | `astral-sh/setup-uv` 缓存 `workers/parser/uv.lock`，并缓存该 Python。pnpm store 按 `pnpm-lock.yaml` 缓存 |
| `desktop-e2e-windows` | 只跑 `windows-latest`。不放进 `worker-health` 矩阵，也不加 Linux 或 macOS 的 Electron job。`corepack pnpm install --frozen-lockfile` 时设 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`，然后 `corepack pnpm exec vitest run apps/desktop/test`，再 `corepack pnpm --filter desktop e2e`（`tsc` 编译 main 与 preload，再跑 Playwright `_electron`）。Playwright `use.screenshot` 为 `on`。`apps/desktop/test-results/**/*.png` 用 `actions/upload-artifact` 上传（`if: always()`），没有文件则该步失败。截图不入库。脚本里没有 xvfb，也不 `apt-get`。不改 `.cursor/install.sh`。该 job 不是分支保护的必需检查（N-02） | pnpm store 按 `pnpm-lock.yaml` 缓存 |

Wisdom 2026-11-02 20:07 批准把 `CI / worker-health-windows` 设为保护分支的必需检查，并批准 macOS 健康检查加上后同样设为必需。原文：「都按你的建议：400、--port/OI_WORKER_PORT、Windows 设必需；另开小 PR 加 macOS 健康检查并设必需」。这两项的启用由仓库管理员做（Issue #33，RULES N-02）。Agent 不修改分支保护。`CI / node` 与 `CI / python-worker` 仍是建议中的必需检查。

`push` 只覆盖 `main`。开着 PR 的功能分支再推送时，检查只来自 `pull_request`。保护分支看的是 PR 上的那一组 check，每个检查名在该 tip 上只出现一次。还没有 PR 就推送的分支不会跑 CI。本仓库的流程是立刻开 Draft PR。

工作流在 `jobs` 之前保留 #102 的 `concurrency`，本文件对应的改动不改这一块。组是 `${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}`。`pull_request` 与非 `refs/heads/main` 的运行 `cancel-in-progress` 为真：同一 PR 上，新的运行取消还在排队或进行中的旧运行。推到 `main` 时 `cancel-in-progress` 为假，进行中的 main 运行不被取消，同组里后到的 main 运行排队。`push` 与 `pull_request` 的组不同，互不取消。触发器收成「`push` 只在 `main`」之后，功能分支不再另开一组 `push` 运行，所以这一块保持原样：`pull_request` 仍会取消同 PR 的旧运行，`main` 上的 `push` 仍不取消。job 名、步骤、runner 与分支保护都不改（N-02）。

### 云端 Agent

`.cursor/environment.json` 的 `install` 是 `bash .cursor/install.sh`。脚本用 `.nvmrc` 安装 Node，执行 `corepack enable`，再按 `pnpm-lock.yaml` 执行 `corepack pnpm install --frozen-lockfile`；然后安装锁定版本的 uv（可执行文件链到 `/usr/local/bin`，避免非交互登录壳读不到 `~/.bashrc`），并在 `workers/parser/` 执行 `uv python install` 与 `uv sync --frozen --extra dev`。

不安装 Paddle、Torch 或模型权重。Chrome 与中文字体仍按原环境尽力安装，失败不会把 Node / Python 安装算成成功。

合入并被环境采用之后，新的 Agent 才会用这份 install。已经在跑的 Agent 不会中途重跑。开发用的 API Key 仍只经 Cursor Secrets 注入，变量名见 ARCHITECTURE §15.4，不写入仓库。
