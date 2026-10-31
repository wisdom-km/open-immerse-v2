# CI 与云端开发环境

## 怎么用

仓库还没有业务代码。这一节只说明怎么把 Node 与 Python worker 的工具链跑起来。项目许可证是 Apache-2.0。PDF 依赖锁定为 `pypdfium2`（Apache-2.0 OR BSD-3-Clause，当前 `5.14.0`）。禁止 PyMuPDF / `fitz`（AGPL-3.0）。CI 不调用付费 API，不读取密钥。

### 当前是空跑

工作流是 `.github/workflows/ci.yml`。它今天全绿，不表示 ARCHITECTURE §13 的 G1–G18 已经在跑。

- 没有 `.ts` / `.tsx` 时，`tools/typecheck.mjs` 打印 `typecheck: no .ts or .tsx sources; skipped.` 并以退出码 0 结束，不会跑 `tsc`。
- pytest 没有收集到测试时退出码是 5。工作流里的 pytest 步骤把 5 改成退出码 0，并打印 `pytest: no tests collected; empty run allowed.`。本机直接跑 `uv run pytest` 仍会看到退出码 5。
- ruff 和锁文件里的包名检查会真的失败。它们不是 §13 的门禁。
- `package.json` 没有 `test:core`。M1 前 PR 里此项写不适用（脚本尚未提供）；M1 起以 package.json 实际脚本为准。不在这里加空脚本。

真正的门禁（G1–G18，含依赖方向、许可证扫描、会失败的测试）在 M1 的门禁 PR 补上。此前不新建 `packages/features/**` 业务切片（RULES N-22）。本文只写明现状，不改工作流，也不改分支保护。

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
corepack pnpm test
```

`pnpm test` 使用 Node 自带的 `node --test`。还没有 `.ts` / `.tsx` 时，`pnpm run typecheck` 说明一句后成功退出；一旦出现这类源文件，就执行 `tsc --noEmit`，类型错误会使命令失败。

Python worker 在 `workers/parser/`：

```bash
uv python install
uv sync --frozen --extra dev
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

还没有测试时，pytest 退出码是 5。CI 把 5 当成空跑通过；测试失败（退出码 1）或其他错误仍然失败。本机直接跑 `uv run pytest` 时，空目录仍会看到退出码 5。

### GitHub Actions

工作流是 `.github/workflows/ci.yml`，在 `push` 和 `pull_request` 上运行。

| Job | 步骤 | 缓存 |
| --- | --- | --- |
| `node` | `corepack enable`、`corepack pnpm install --frozen-lockfile`、`corepack pnpm run lint`、`corepack pnpm run typecheck`、`corepack pnpm test` | `actions/cache` 缓存 pnpm store，键来自 `pnpm-lock.yaml` |
| `python-worker` | 安装锁定的 uv 与 Python、`uv sync --frozen --extra dev`、`ruff check`、`ruff format --check`、pytest（允许退出码 5）、确认锁文件含 `pypdfium2` 且不含 PyMuPDF | `astral-sh/setup-uv` 缓存 `workers/parser/uv.lock`，并缓存该 Python 解释器 |

建议在保护分支上把这两个 check 设为必需：`CI / node`、`CI / python-worker`。是否启用由仓库管理员决定；Agent 不修改分支保护。

同一分支的一次推送会同时触发 `push` 与（如果已开 PR）`pull_request`。保护分支看的是 PR 上的那一组 check。

### 云端 Agent

`.cursor/environment.json` 的 `install` 是 `bash .cursor/install.sh`。脚本用 `.nvmrc` 安装 Node，执行 `corepack enable`，再按 `pnpm-lock.yaml` 执行 `corepack pnpm install --frozen-lockfile`；然后安装锁定版本的 uv（可执行文件链到 `/usr/local/bin`，避免非交互登录壳读不到 `~/.bashrc`），并在 `workers/parser/` 执行 `uv python install` 与 `uv sync --frozen --extra dev`。

不安装 Paddle、Torch 或模型权重。Chrome 与中文字体仍按原环境尽力安装，失败不会把 Node / Python 安装算成成功。

合入并被环境采用之后，新的 Agent 才会用这份 install。已经在跑的 Agent 不会中途重跑。开发用的 API Key 仍只经 Cursor Secrets 注入，变量名见 ARCHITECTURE §15.4，不写入仓库。
