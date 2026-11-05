# PR #176 命令

日期：2026-11-05。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。`corepack pnpm --version` 为 10.34.9。未改日志。

全量跑在 `43a168333ddf1b7b655625f2d933055bda34f286`。本文件提交之后只增加 `docs/evidence/176/` 和执行计划实际列的第 7 行。没有在证据提交上再跑一遍全量测试。

基线是 `origin/main` 的 `d675f69587edfe487dcd604aa4bcfdaa559eabab`。推送前 `git fetch origin main`，SHA 没有变。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑 worker pytest。没有跑真机。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | format、lint、typecheck、typecheck:core、check-file-size（377 source files within hard limits）、check:deps（281 modules，728 dependencies，no violations）、check-core-tests、npm/pip/models 许可证、check-one-slice（1 feature slice）、Conventional Commits、热点、check-pr-size（1891 non-generated lines）、codegen（1 generator）。G7 `git diff --exit-code` 无输出。这个 tip 的通过只记这一次 |
| `corepack pnpm test` | 0 | Vitest 147 个文件，608 通过，3 跳过，失败 0。Type Errors no errors。3 个跳过不在本 PR 新增测试里 |

`523ceea` 上曾跑过一次全量测试，退出码 1：`tools/check-arch-graph/check.test.ts` 两例失败，原因是适配器 import `@oi/contracts`（ADP→C，§5.1 没有这条边）。`43a1683` 去掉该 import 后按上表重跑。
