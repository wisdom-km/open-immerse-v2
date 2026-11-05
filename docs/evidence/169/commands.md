# PR #169 命令

日期：2026-11-05。工作目录是仓库根。Node v22.23.4（`.nvmrc`）。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再跑 `corepack pnpm`。基线 `origin/main` `a9b44e429d9aad3ee86e394c17359b8518f6d796`。计划提交 `a74d97e`。路径辅助 `e2da38c`。文献库实现 `c1c7b2d`。依赖图修正 `f7c781c`。批准记录 `f739ab1`。下面两条全量命令跑在 `f7c781c`，当时工作树干净。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm test` | 0 | 132 个文件，511 passed、3 skipped。Type Errors 无 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | G1、G2、G3、G4、G5、G7、G10、G11、G12、G13–G16、G18 与 Conventional Commits。`check-pr-size: 2700 non-generated lines`。`check-one-slice: 1 feature slice(s)`。`codegen: 1 generators`，随后 `git diff --exit-code` 通过 |
| `node tools/check-docs/check.mjs` | 0 | `findings: 0`。links、anchors、status、verbatim、tree 都是 0 |

`f7c781c` 之前同一条 `pnpm test` 退出码 1：`tools/check-arch-graph/check.test.ts` 两条失败。适配器 import 了 `@oi/kernel`（§5.1 没有 ADP → K），`src/testing` 被标成 unmapped，planned 从 22 变成 16。修正后重跑，退出码 0。变成已实现的六条边是 APP→DOM、APP→C、APP→K、ADP→APP、ADP→DOM、ADP→PN。

`test:core` 不适用（`package.json` 没有这个脚本）。未跑 worker 的 ruff / pyright / pytest（本 PR 不改 `workers/parser`）。除上面那次依赖图失败并重跑外，没有跳过。

`G12:` 写在 `c1c7b2d` 的说明里。本文件是随后的提交，不改变那一行。
