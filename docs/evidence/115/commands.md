# PR #115 命令

日期：2026-11-03。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。未改日志。

代码提交是 `ddebc8f`（条目 2）与 `fa06a55f4ab487da3872462e2f65e92c0b3cd702`（条目 3）。下面的命令跑在 `fa06a55` 上，工作区干净。本文件提交之后只改 docs。

基线是 `origin/main` 的 `762cbbd88d5775fddfdce6afa3a003fdbfd901a4`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑 `pnpm test`，没有跑 worker 全量 pytest。

条目 5 已由 #96 完成。本 PR 不改 `workers/parser/oi_worker/api/health.py`。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/check-deps/contracts-kernel.test.ts tools/codegen/schema-module.test.ts tools/codegen/schema-output-name.test.ts tools/codegen/versions.test.ts` | 0 | 4 个文件，7 passed。Type Errors: no errors。含 `closed-marker.ts` 用例、同 basename、`export *`、动态 import、撞名 |
| 工作目录 `workers/parser/`：`uv run pytest tests/api/test_health.py tests/protocol/test_health.py tests/protocol/test_versions.py` | 0 | 27 passed |
| `git diff --stat -- workers/parser/oi_worker/protocol/` | 0 | 无输出。`pnpm run codegen` 与 `pnpm run check` 里的 codegen 之后各看过一次 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 含 G7：`codegen: 1 generators` 之后 `git diff --exit-code` 通过。check-pr-size 为 482 行非生成代码。未超过 600，没有 `G12:` |

## Forge 复查后的重跑

日期：2026-11-03。代码提交是 `1e806ec`（说明符只改 `moduleSpecifier`）与 `173f416`（占住输出后再写入、`relativeOutput` 拒绝 `..` 和根目录外路径）。下面的命令跑在包含本文件、且提交说明含 `G12:` 的 tip 上。工作区在跑命令前是干净的。未改日志。未改 Python。

`173f416` 上先跑过一次 `GATE_BASE=origin/main corepack pnpm run check`，退出码 1：`check-pr-size` 为 607 行，当时提交说明还没有 `G12:`。其余门禁在那次已经通过，codegen 与 G7 还没跑到。补上提交说明后重跑，结果见下表。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/check-deps/contracts-kernel.test.ts tools/codegen/schema-module.test.ts tools/codegen/schema-output-name.test.ts tools/codegen/schema-specifiers.test.ts tools/codegen/versions.test.ts` | 0 | 5 个文件，14 passed。Type Errors: no errors。在 `173f416` |
| 工作目录 `workers/parser/`：`uv run pytest tests/api/test_health.py tests/protocol/test_health.py tests/protocol/test_versions.py` | 0 | 27 passed。在 `173f416` |
| `git diff --stat -- workers/parser/oi_worker/protocol/` | 0 | 无输出。`pnpm run check` 里的 codegen 之后再看一次 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 含 G7。check-pr-size 为 620 行非生成代码。提交说明有一行 `G12:`。不调上限 |
