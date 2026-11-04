# PR #158 命令

日期：2026-11-04。工作目录是仓库根，e2e 那一行的工作目录是 `apps/desktop/`。Node v22.23.4（`.nvmrc`），PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。基线 `origin/main` `51243c9bb35073057d333409b1de874e3e36d133`。计划提交 `63d22cc`。实现提交 `bd47855`。沙箱内联 `c5f7b08`。

PR 体量对照 `origin/main`（CI 的 `GATE_BASE`）。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm codegen && git diff --exit-code` | 0 | G7。`codegen: 1 generators`。工作树干净，生成物没有漂移 |
| `corepack pnpm exec vitest run tools/codegen apps/desktop/test packages/contracts/test/ipc-settings.test.ts` | 0 | 24 个文件，94 条。Type Errors 无 |
| `corepack pnpm exec tsc --noEmit --pretty false --project tsconfig.json` | 0 | |
| `corepack pnpm exec tsc --noEmit --pretty false --project tsconfig.core.json` | 0 | G14 |
| `corepack pnpm exec tsc --noEmit --pretty false --project apps/desktop/tsconfig.preload.json` | 0 | |
| `corepack pnpm exec tsc --noEmit --pretty false --project apps/desktop/tsconfig.main.json` | 0 | |
| `node tools/check-arch-graph/check.mjs --strict` | 0 | 实现前与实现后都是 undocumented 0、unmapped 0、planned 22。main 没有新增到 contracts 的边 |
| `node tools/check-file-size/check.mjs` | 0 | `244 source files within hard limits` |
| `GATE_BASE=origin/main node tools/check-pr-size/check.mjs` | 0 | `2261 non-generated lines`。`bd47855` 的说明含 `G12:`，不改上限，preload 路径不加入 `generatedPrefixes` |
| `node tools/check-hotspots/check.mjs` | 0 | `composition-root.ts` 11 行插入、1 行删除 |
| `node tools/check-one-slice/check.mjs` | 0 | `0 feature slice(s)` |
| `node tools/check-docs/check.mjs` | 0 | `findings: 0`。links、anchors、status、verbatim、tree 都是 0 |
| `node tools/check-commits/check.mjs` | 0 | 三条提交的 subject 都是 Conventional Commits |
| 在 `apps/desktop/`：`corepack pnpm run e2e` | 0 | 25 passed。含 `JSON.stringify(window.oi) === "{}"`，以及 contextIsolation、sandbox、nodeIntegration |

`c5f7b08` 之前同一条 e2e 里 `window.oi` 是 `undefined`（退出码 1，24 passed / 1 failed）。沙箱 preload 不能 `require` 旁边的 `oi.generated.js`。内联进 `index.cjs` 之后重跑，25 passed。

未跑完整的 `pnpm test` 与 `pnpm run check`。`test:core` 不适用（脚本尚未提供）。除上面那次 e2e 失败并重跑外，没有跳过。

上表的 2261 行是到 `c5f7b08`。本文件和计划里的「实际」列在随后的提交。`G12:` 写在 `bd47855` 的说明里，后面的体量检查仍看得到这行。
