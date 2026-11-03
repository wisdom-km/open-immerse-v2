# PR #120 命令

日期：2026-11-03。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。未改日志。

代码提交是 `68bbd9b393ea47f57cbf153b0dbbf0dbfef03f0a`。下面的命令跑在这个提交上，工作区干净。本文件是随后的记录，不改检查行为。

基线是 `origin/main` 的 `865c2f50f1844ccd528ebc651af10902ce2def6b`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑 `pnpm test`。worker 全量 pytest 跑过。

条目 1、6 已在 #109。条目 2、3 已在 #115。条目 5 已由 #96 完成。本 PR 不改 `packages/contracts/src/ids.ts`、`workers/parser/oi_worker/api/health.py`、`packages/contracts/src/worker/worker-version.ts`。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/codegen/schema-output-name.test.ts tools/codegen/schema-module.test.ts` | 0 | 2 个文件，12 passed。Type Errors: no errors。含盘符大小写、只共享盘符、不同盘符、POSIX 只共享 `/`、共享目录深于根，以及原有的同名 schema / `export *` / 动态 import |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（184 个源文件）、dependency-cruiser（92 modules，175 dependencies，无违例）、core 测试位置、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量、codegen、G7。`check-pr-size`：130 行非生成 diff。`codegen: 1 generators`。其后 `git diff --exit-code` 通过 |
| 工作目录 `workers/parser/`：`node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest` | 0 | 161 passed，1 warning（starlette `BlockingPortal` 弃用）。未改 Python |
