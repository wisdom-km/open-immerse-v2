# PR #104 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4。`corepack pnpm --version` 为 10.34.9。未改日志。

两条命令跑在 `f78de12c9572f69518524e7609989edd7b853873`。本文件提交之后只改 docs。

基线是 `origin/main` 的 `d41171072b6a5c34886e48dfdf36978cc03b3e46`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `pnpm check` 或 `pnpm test`。没有新增 skip。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/check-license/dev-only.test.ts` | 0 | 1 个文件，2 passed，0 skipped。Type Errors: no errors。`accepts typing_extensions when the license is PSF-2.0` 与 `rejects an unlisted package with G10 when the license is PSF-2.0` |
| `node tools/check-license/check-pip.mjs` | 0 | `check-license: pip licenses accepted`。真实 `workers/parser/uv.lock`，含运行时闭包里的 typing-extensions |

## 合入 origin/main 之后

把 `origin/main` 的 `761f22c9599d463c3e21d1cc01cbe86de0dac9fe` merge 进本分支，没有 rebase。冲突只在 `docs/spec-changelog.md`：保留 main 的 #101 行，#104 放在表格第一行。`RULES.md` 没有冲突。两条命令重跑在 merge 提交 `3d4f8758bf2a067872bffad30652826f8288ff91` 上。没有跑全量 `pnpm check` 或 `pnpm test`。没有新增 skip。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/check-license/dev-only.test.ts` | 0 | 1 个文件，2 passed，0 skipped。Type Errors: no errors |
| `node tools/check-license/check-pip.mjs` | 0 | `check-license: pip licenses accepted` |
