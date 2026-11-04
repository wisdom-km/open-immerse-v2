# PR #144 命令

日期：2026-11-04。工作目录是仓库根。Node v22.23.4（`.nvmrc`），PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。基线 `origin/main` `f9b34e8`。命令跑在 `9f16979`。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/contracts/test/diag-events.test.ts packages/platform-node/test/value-guard.test.ts packages/platform-node/test/file-logger.test.ts` | 0 | 3 个文件。运行时 40 通过。`diag-events.test.ts` 类型测试再计 11。合计 51 通过，失败 0，跳过 0 |
| `corepack pnpm exec eslint --max-warnings 0 packages/contracts/src/diag-events.ts packages/contracts/test/diag-events.test.ts` | 0 | 无警告 |
| `corepack pnpm exec prettier --check` 上述两个文件 | 0 | 交接命令之外，避免 G1 |
| `node tools/typecheck.mjs` | 0 | |
| `tsc -p tsconfig.core.json --noEmit --pretty false` | 0 | G14。交接命令之外 |
| `node tools/check-hotspots/check.mjs --base origin/main` | 0 | 具名热点未超 30 行 |
| `node tools/check-docs/check.mjs` | 0 | findings 9，与 `f9b34e8` 相同 |

`test:core` 不适用。未跑 e2e、全量 `pnpm test`、`pnpm run check`。`diag-events.ts` 相对 `origin/main` 是 9 增 1 删。
