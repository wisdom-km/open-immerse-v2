# PR #109 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。`corepack pnpm --version` 为 10.34.9。未改日志。

代码提交是 `ef166d337e249f211da932e8dd68b758a70ea4e9`。下面的命令跑在该提交上。本文件提交之后只改 `docs/evidence/109/`。

基线是 `origin/main` 的 `25762f1`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `pnpm test`，也没有跑 worker pytest。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/contracts/test/ids.test.ts packages/contracts/test/worker-version.test.ts packages/contracts/test/worker-protocol.test.ts tools/codegen/versions.test.ts` | 0 | 13 passed。Type Errors no errors。Test Files 7 passed（含 typecheck） |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、check-file-size（177 source files within hard limits）、check:deps（92 modules，175 dependencies，no violations）、check-core-tests、npm/pip/models 许可证、check-one-slice（0 feature slices）、Conventional Commits、热点、check-pr-size（192 non-generated lines）、codegen（1 generator）。G7 `git diff --exit-code` 无输出。这个 tip 只跑了这一次。没有 skip |
