# PR #173 命令

日期：2026-11-05。工作目录是仓库根，desktop build 那一行的工作目录是 `apps/desktop/`。Node v22.23.4（`.nvmrc`），PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。基线 `origin/main` `e758cb7`。实现提交 `9ab621120588498363a382ca3a528fbd6d0e1f08`。本文件是随后的证据提交，不改被测代码。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run apps/desktop/test/ipc-router.test.ts apps/desktop/test/ipc-guard.test.ts` | 0 | 2 个文件，22 条。Type Errors 无。在 `9ab6211` 上重跑 |
| `corepack pnpm run typecheck` | 0 | `tsc --noEmit --project tsconfig.json` |
| `corepack pnpm --dir apps/desktop run build` | 0 | kernel、contracts、platform-node、main、preload |
| `corepack pnpm run check:format` | 0 | Prettier |
| `corepack pnpm run check:size` | 0 | 320 个源文件在硬上限内 |
| `node tools/check-one-slice/check.mjs` | 0 | 0 feature slice |
| `node tools/check-hotspots/check.mjs` | 0 | 具名热点 diff 不超过 30 行 |
| `node tools/check-commits/check.mjs --base origin/main` | 0 | Conventional Commits |

未跑完整的 `pnpm test` 与 `pnpm run check`。`test:core` 不适用（脚本尚未提供）。没有失败重跑，没有跳过。
