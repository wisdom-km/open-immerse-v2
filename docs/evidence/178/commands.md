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

## 修复两条失败与模块解析

Anvil 在 `af48113a5925c79288163f0995f4868343940482` 上的唯一全量 `corepack pnpm test` 是 628 通过、2 失败、3 跳过，退出码 1。两条失败都在 `tools/check-arch-graph/check.test.ts`：`undocumented 2`，`--strict` 退出码 1。边是 `memory-openings.ts:1` 的 ADP → C，以及 `open-document.ts:6` 的 APP → ADP。同一 tip 上用 Vitest 5.0.5 / Vite 8.3.5 的 `pluginContainer.resolveId` 解析：`@oi/feature-library` 到 `library/src/index.ts`（存在）；`@oi/feature-library/ui` 到 `index.ts/ui`（不存在）；`@oi/feature-library/main` 到 `index.ts/main`（不存在）。别名是前缀，没有 `$`，也没有 customResolver。

这次没有重跑全量 `pnpm test` 或 `pnpm run check`。gitleaks 下载在那次全量之前是 HTTP 504，`CI` 与 `GITLEAKS_BIN` 都未设置，3 个跳过是秘密扫描夹具。这 3 个跳过不是 G9 通过。秘密扫描仍未执行。没有改 CI，没有设置 `GITLEAKS_BIN`。

下面的命令跑在修复后的工作区，Node 与 pnpm 同上。日期 2026-11-08。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/features/ingest/test/core packages/features/ingest/test/adapters` | 0 | 4 个文件，23 通过。`development` 条件改完之后重跑 |
| `corepack pnpm exec vitest run tools/check-arch-graph/check.test.ts --test-name-pattern 'exits 0 (against the repository graph and prints the four counts\|in strict mode against the repository graph)'` | 0 | 2 通过，6 跳过。这 6 个跳过是文件里没被 pattern 选中的用例，不是 G9 |
| `node tools/check-arch-graph/check.mjs --strict` | 0 | undocumented 0，planned 15，unmapped 0，index 0 |
| `corepack pnpm run typecheck:core` | 0 | |
| `corepack pnpm run typecheck` | 0 | |
| `corepack pnpm run check:deps` | 0 | 297 modules，780 dependencies，no violations |
| `corepack pnpm run check:size` | 0 | 393 source files within hard limits |
| `GATE_BASE=origin/main corepack pnpm run check:one-slice` | 0 | 1 feature slice。library 的 `package.json` 不在 `packages/features/*/src/` |
| `corepack pnpm exec eslint packages/features/ingest vitest.config.ts --max-warnings 0` | 0 | 没有把 `package.json` 传给 eslint |
| Vite 8.3.5 / Vitest 5.0.5 `pluginContainer.resolveId` | 0 | 见下。加载的配置是仓库根的 `vitest.config.ts` |

解析结果（文件都存在，没有 `index.ts/ui` 或 `index.ts/main`，别名表里没有 `@oi/feature-library`，没有 customResolver）：

| importer | specifier | resolved |
| --- | --- | --- |
| `packages/features/ingest/src/application/use-cases/open-document.ts` | `@oi/feature-library` | `packages/features/library/src/index.ts` |
| `packages/features/ingest/test/core/open-document.test.ts` | `@oi/feature-library` | `packages/features/library/src/index.ts` |
| `apps/desktop/src/renderer/slots.ts` | `@oi/feature-library/ui` | `packages/features/library/src/ui/index.ts` |
| `apps/desktop/src/main/library-wiring.ts` | `@oi/feature-library/main` | `packages/features/library/src/adapters/library-main.ts` |

同一工作区里，从 `apps/desktop` 用 Node 默认条件 `import.meta.resolve`：`@oi/feature-library` 与 `@oi/feature-library/main` 仍是 `dist` 下的 js；`@oi/feature-library/ui` 仍是 `src/ui/index.ts`。加上 `--conditions=development` 后，前两个改到上面的源码路径。Electron 的默认条件不选 `development`。

上表跑在进入提交之前的同一份源码。提交 `84ef0daf548b3d05c74bd9bd0ec24aa60f841d95` 之后再跑：ingest 的 core 与 adapters vitest 退出码 0（4 个文件，23 通过）；arch-graph 两条用例退出码 0；`node tools/check-arch-graph/check.mjs --strict` 退出码 0（undocumented 0，planned 15，unmapped 0，index 0）；Vite resolve 退出码 0，上表四个路径的 `exists` 仍为 true；`GATE_BASE=origin/main corepack pnpm run check:one-slice` 退出码 0（1 feature slice）；`node tools/check-docs/check.mjs` 退出码 0。`typecheck`、`typecheck:core`、`check:deps`、`check:size`、eslint 没有在这个提交上重跑，它们跑在进入该提交的同一份源码上，退出码都是 0。
