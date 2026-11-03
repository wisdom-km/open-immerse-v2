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
