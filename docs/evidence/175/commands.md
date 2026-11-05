# PR #175 命令

日期：2026-11-05。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。`corepack pnpm --version` 为 10.34.9。未改日志。

全量跑在 `f688478d9b18bd1416ec4e2903100d96e07e889b`。本文件提交之后只增加 `docs/evidence/175/`。没有在证据提交上再跑一遍全量。

基线是 `origin/main` 的 `51014315492a689eae394ecb13fc496df0087667`。`git fetch origin main` 时 SHA 没有变。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑 worker pytest。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | format、lint、typecheck、typecheck:core、check-file-size（348 source files within hard limits）、check:deps（251 modules，648 dependencies，no violations）、check-core-tests、npm/pip/models 许可证、check-one-slice（0 feature slices）、Conventional Commits、热点、check-pr-size（612 non-generated lines）、codegen（1 generator）。G7 `git diff --exit-code` 无输出。这个 tip 只跑了这一次。没有 skip |
| `corepack pnpm test` | 0 | Vitest 139 个文件，564 通过，3 跳过，失败 0。Type Errors no errors。3 个跳过不在本 PR 新增测试里 |
