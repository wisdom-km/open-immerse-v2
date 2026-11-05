# PR #168 命令

日期：2026-11-05。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。未改日志。

契约与批准记录的提交是 `69f0bee13e15c070f2172d4738214cc01a1d576c`（父提交 `3f5bdabf0d412503737fe8279ea17c4426e92278` 是契约代码）。下面的 `check`、`test`、`check-docs` 跑在 `69f0bee` 上。本文件提交之后只改 `docs/evidence/168/`。

基线是 `origin/main` 的 `7d5cf924b262dfa0b1778e2ecfd23be1e008f9bd`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑 worker pytest。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | format、lint、typecheck、typecheck:core、check-file-size（290 source files within hard limits）、check:deps（189 modules，419 dependencies，no violations）、check-core-tests、npm/pip/models 许可证、check-one-slice（0 feature slices）、Conventional Commits、热点、check-pr-size（644 non-generated lines）、codegen（1 generator）。G7 `git diff --exit-code` 无输出。这个 tip 只跑了这一次。没有 skip |
| `corepack pnpm test` | 0 | Vitest 125 个文件，477 通过，3 跳过。Type Errors no errors |
| `node tools/check-docs/check.mjs` | 0 | `findings: 0`。links、anchors、status、verbatim、tree 都是 0 |
| `corepack pnpm exec vitest run packages/contracts/test/ipc-library.test.ts packages/contracts/test/ipc-settings.test.ts` | 0 | 修测试类型时先跑过。全量 `pnpm test` 在 `69f0bee` 上再跑了一次，上面那一行是这次 tip 的结果 |
