# PR #178 命令

日期：2026-11-08。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。`corepack pnpm --version` 为 10.34.9。未改日志。

产品命令跑在实现提交 `67aeacd72bab6e604f4fc1e61d8d485751465216`。本文件提交只增加 `docs/evidence/178/`，并把执行计划里的 PR 号写成 178。没有在证据提交上重跑 vitest、typecheck、check:deps、check:size。

基线是 `origin/main` 的 `208056585d0891ad7ab2c1309527074b34a1c0a1`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑 worker pytest。没有跑 e2e。没有跑真机。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/features/ingest/test/core packages/features/ingest/test/adapters` | 0 | 4 个文件，23 通过，失败 0。Type Errors no errors |
| `corepack pnpm run typecheck:core` | 0 | 重跑。第一次退出码 2，见下 |
| `corepack pnpm run typecheck` | 0 | 重跑。第一次退出码 2，见下 |
| `corepack pnpm run check:deps` | 0 | 297 modules，782 dependencies，no violations |
| `corepack pnpm run check:size` | 0 | 393 source files within hard limits |
| `GATE_BASE=origin/main corepack pnpm run check:one-slice` | 0 | 在 `67aeacd` 上跑。1 feature slice。提交前工作区曾报 0，因为当时改动还没进 HEAD |
| `node tools/check-docs/check.mjs` | 0 | findings 0。本文件和执行计划里的 PR 链接写好之后、提交之前再跑一次 |
| `corepack pnpm exec eslint packages/features/ingest vitest.config.ts --max-warnings 0` | 0 | 只 lint 了改过的 TypeScript。没有跑全仓库 `pnpm run lint` |
| `corepack pnpm exec prettier --write`（ingest 的 `*.ts` 与 `vitest.config.ts`） | 0 | 只格式化改过的 TypeScript。没有跑全仓库 format |

`typecheck` 与 `typecheck:core` 的第一次失败：`open-document.ts` 的 `readHit` 把 `Result<OpenDocumentValue, OpenFailure>` 返回成页码结果，退出码 2。失败值收成只有 `ok: false` 之后重跑，退出码 0。

## 没有跑

| 命令 | 原因 |
| --- | --- |
| `corepack pnpm test` | 全量 Vitest。留给 Anvil，在与本证据相同的最终 tip 上跑一次 |
| `corepack pnpm run check` | 全部门禁。留给 Anvil |
| worker pytest | 未改 worker |
| e2e | 未跑 |
| 真机与截图 | 属 PR-C。本 PR 无 UI |

没跑的命令不写成通过。
