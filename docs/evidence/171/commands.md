# PR #171 命令

日期：2026-11-05。工作目录是仓库根。Node v22.23.4（`.nvmrc`）。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再跑 `corepack pnpm`。基线 `origin/main` `77371a77887ca42950dcead4b1605405e614b3b5`。计划 `c24623e`。实现 `08d1697`。计划回填 `5e5b700`。生成物格式 `8e17d61`。desktop 直接依赖 React `547db98`。下面三条全量命令跑在 `547db98`，当时工作树干净。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm test` | 0 | 135 个文件，529 passed、3 skipped。Type Errors 无 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | G1、G2、G3、G4、G5、G7、G10、G11、G12、G13–G16、G18 与 Conventional Commits。`check-pr-size: 2767 non-generated lines`。`check-one-slice: 1 feature slice(s)`。`check-hotspots` 通过。`codegen: 1 generators`，随后 `git diff --exit-code` 通过 |
| `node tools/check-docs/check.mjs` | 0 | `findings: 0`。links、anchors、status、verbatim、tree 都是 0 |
| `node apps/desktop/scripts/bundle-renderer.mjs` | 0 | 工作目录 `apps/desktop`。产物 `src/renderer/main.js` 1256423 字节，已 gitignore。React 只打进一份 |

`547db98` 之前同一条 `pnpm run check` 退出码 1，停在 G1：生成物里 `Readonly<{}>` 的函数签名第一遍 Prettier 与 `--check` 不一致。`8e17d61` 让生成再格式化一遍，并把架构计划边从 16 改为 15（desktop 装配实现了 `MAIN→ADP`）。同一条 `pnpm test` 当时 2 失败（`tools/check-arch-graph/check.test.ts` 的计划边计数、`tools/gate-remediation/g1.test.ts` 的格式检查），修正后重跑退出码 0。

esbuild 第一次解析不到 `react-dom/client`。pnpm 不提升 `@oi/feature-library` 的依赖。`547db98` 把 `react` 与 `react-dom` 加为 desktop 的直接依赖后，打包退出码 0。

`test:core` 不适用（`package.json` 没有这个脚本）。未跑 worker 的 ruff / pyright / pytest（本 PR 不改 `workers/parser`）。没有在 Electron 窗口里点过。除上面那次格式与计划边失败并重跑外，没有跳过。

`G12:` 写在 `08d1697` 的说明里。本文件是随后的提交，不改变那一行。

## 2026-11-05 修正 desktop 构建与菜单

代码 `0f29561c300bff3e1ccc64bffc01e7f035d3c9b6`。`corepack pnpm --filter desktop build` 与 `corepack pnpm test` 跑在提交前的同一棵源码树上，提交没有再改这些文件。`GATE_BASE=origin/main corepack pnpm run check` 跑在该提交上，工作树干净。

CI `desktop-e2e-windows`（run `41983502119`，tip `e2cbbbb`）红在 `tsc -p packages/features/library/tsconfig.build.json`，不是 `tsconfig.main.json`。`include` 为 `src/**/*.ts`，把 `src/ui/*.ts` 编进没有 `jsx`、`lib` 只有 ES2023 的构建。报错是 `src/ui/index.ts` TS6142，以及 `window` / `DragEvent.dataTransfer` 缺失。`slots.ts` 不在 main 的 include（`src/main/**/*.ts`）里。修正仍按要求把 slots 改到公开子路径 `@oi/feature-library/ui`，并把 `src/ui/**` 排除出这次 emit。UI 继续由 `tsconfig.ui.json` 做类型检查，由 esbuild 打包。`packages/features/library/dist/ui` 不存在。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm --filter desktop build` | 0 | 含 library、main、preload 的 tsc，以及 `bundle-renderer.mjs`。产物 `apps/desktop/src/renderer/main.js` 含 `library-app.tsx`，已 gitignore |
| `corepack pnpm test` | 0 | 135 个文件，530 passed、3 skipped。Type Errors 无。新增菜单 role 一条 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | `check-pr-size: 2850 non-generated lines`。`check-deps` 245 modules、605 dependencies。codegen 后 `git diff --exit-code` 通过 |

菜单模板：darwin 为 `appMenu`、「文件 › 打开…」、`editMenu`、`windowMenu`。win32 与 linux 没有 `appMenu`。没有打开文件夹、删除、访达或资源管理器。
