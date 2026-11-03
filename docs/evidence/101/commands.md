# PR #101 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。`corepack pnpm --version` 为 10.34.9。未改日志。

全量 `check` 跑在 `061de58af65d297fe606c19842ee9310d196bdb5`。该提交改 `docs/backlog.md` 与 `docs/spec-changelog.md`。本文件与变更记录里的 PR 号在 check 之后补上，没有再跑 `check`。

基线是 `origin/main` 的 `d41171072b6a5c34886e48dfdf36978cc03b3e46`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。`pnpm test` 与 worker pytest 没有执行。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、check-file-size（174 source files within hard limits）、check-deps（90 modules，164 dependencies，no violations）、check-core-tests、npm/pip/models 许可证、check-one-slice（0 feature slices）、check-commits、check-hotspots、check-pr-size（3 non-generated lines）、codegen（1 generators）通过。G7 `git diff --exit-code` 无输出。这个 tip 只跑了这一次。没有 skip |
| `git diff --exit-code -- workers/parser/oi_worker/protocol/` | 0 | 无输出。生成的协议文件没有改动 |
