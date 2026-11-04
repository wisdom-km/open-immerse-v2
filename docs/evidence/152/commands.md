# PR #152 命令

日期：2026-11-04。工作目录是仓库根。Node v22.23.4（`.nvmrc`），PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。基线 `origin/main` `9949f5c8e90ed47d6ab517a44c8174aa85613297`。实现提交 `6f1bc3b`。计划提交 `9754416`。

PR 体量对照 `origin/main`（CI 的 `GATE_BASE`）。本地 `main` 仍停在 `6988420`，不用它当基线。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/contracts/test/ipc-settings.test.ts packages/contracts/test/settings-egress.test.ts packages/contracts/test/provider.test.ts` | 0 | 配置含 typecheck。30 passed，Type Errors 无。关掉 typecheck 再数：3 个文件、15 条运行时测试 |
| `corepack pnpm exec tsc -p tsconfig.core.json --noEmit --pretty false` | 0 | G14。`packages/contracts` 没有 `tsconfig.json`，这条是仓库里覆盖 contracts 的类型检查 |
| `corepack pnpm exec tsc -p packages/contracts/tsconfig.build.json --noEmit --pretty false` | 0 | 只编 `packages/contracts/src` |
| `GATE_BASE=origin/main node tools/check-pr-size/check.mjs` | 0 | `729 non-generated lines`。提交说明含 `G12:`，不改上限 |
| `node tools/check-file-size/check.mjs` | 0 | `228 source files within hard limits` |
| `node tools/check-docs/check.mjs` | 0 | `check-docs: strict`。`links: 0`，`anchors: 0`，`status: 0`，`verbatim: 0`，`tree: 0`，`findings: 0` |
| `node tools/check-commits/check.mjs` | 0 | 两条提交的 subject 都是 Conventional Commits |

未跑 `pnpm test`、`pnpm run check`、worker pytest、e2e。`test:core` 不适用（脚本尚未提供）。没有 skip。没有失败项，没有重跑。

不带 `GATE_BASE` 时 `check-pr-size` 用本地 `main`（`6988420`），数到 2623 行，那是过期基线，不是本 PR 的 diff。CI 用 `origin/main`。

上表的 729 行是实现提交 `6f1bc3b`。本文件和计划里的「实际」列在随后的提交。`G12:` 写在 `6f1bc3b` 的说明里，后面的体量检查仍看得到这行。
