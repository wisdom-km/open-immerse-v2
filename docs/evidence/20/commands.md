# PR #20 命令

工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 20.19.2，PATH 里 nvm 的 bin 在前。提交 `7a42bce0c70165b341f298b51475ec2224915cc8` 上跑过；本文件随后的文档提交不改检查行为。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `corepack pnpm install --frozen-lockfile` | 0 | Lockfile is up to date |
| `corepack pnpm run check` | 0 | lint、tsc、typecheck:core、行数、dependency-cruiser、core 测试指令、npm/pip/模型许可证、G18、Conventional Commits、热点、PR 体量、codegen 后 `git diff` 都通过。`check-pr-size` 打印 2095 行非生成改动，提交说明含 `G12:` |
| `corepack pnpm test` | 0 | Vitest 12 个文件、13 个测试通过。夹具本身会让对应检查器非 0，断言的是这个失败 |
| `/tmp/gitleaks detect --source . --config .gitleaks.toml --redact --no-banner` | 0 | gitleaks 8.30.1。123 commits scanned，no leaks found |
| `uv run pytest`（`workers/parser/`） | 0 | 2 passed |
| `uv run ruff check .`（`workers/parser/`） | 0 | All checks passed |
| `uv run ruff format --check .`（`workers/parser/`） | 0 | 3 files already formatted |

没有跑 `pnpm test:core`：package.json 没有这个脚本。core 测试文件的 include 在 `vitest.config.ts`。没有 `packages/features/**`。

没有跑 mypy / pyright、Prettier、import-linter、`tsc -b`。原因在 PR 描述的缺口表。

## Actions

`ea23a85` 的 `CI / node`（run `41174753003`）在 `pnpm check` 的 `check:license:pip` 退出 1。该 runner 没有 `uv`，`spawnSync` 没有 stderr。`CI / python-worker` 通过，因为那个 job 先装了 uv。后续提交在 `node` job 安装锁定的 uv 和 worker Python，`check-pip.mjs` 改为 `uv run --frozen --extra dev`，并在找不到 `uv` 时打印错误。本机复跑 `node tools/check-license/check-pip.mjs` 退出码 0；`vitest run tools/check-license/reject.test.ts tools/check-license/models.test.ts` 为 2 个文件、3 个测试通过。`b48755c` 的 PR check run `41175138165`：`CI / node` 与 `CI / python-worker` 都通过。

## 2026-10-31 14:12 续

合入 `origin/main` `6398fc9`。本机在续作提交前跑过：

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `node tools/check-deps/check.mjs` | 0 | 5 modules，3 dependencies，no violations |
| `uv run lint-imports`（`workers/parser/`） | 0 | 6 kept |
| `uv run pyright` | 0 | 0 errors |
| `uv run pytest` | 0 | 3 passed |
| `uv run ruff check .` 与 `ruff format --check .` | 0 | |
| Vitest 真实树夹具（core→react、core 测试环境、PSF-2.0、`oitest_` / `ghp_`） | 0 | 检查器对违规为非 0，断言通过 |
