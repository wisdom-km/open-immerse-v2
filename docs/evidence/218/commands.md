# PR #218 拆 fit

Node v22.23.4。工作目录是仓库根。基线 main `04fa9be8523614f43fb14a2c2767aedbefe14017`。`pnpm run check` 与 `pnpm test` 跑在 `3b6dbb5`，当时还没有本文件。`GATE_BASE=origin/main`。没有真机。没有 Ready、合入或发版。

## vitest run use-zoom.test.tsx zoom-controls.test.tsx page-column.test.tsx

退出码 0。3 个文件、24 个测试。适合宽度仍是 223 和 185，适合页面仍是 95。

## n9

S1 之后，`use-zoom.test.tsx` 仍是 7 条。同一条里先把栏宽设成 `Number.POSITIVE_INFINITY`，只调 `zoomFitWidth`，百分比仍是 100，没有播报；再对 `Number.NaN` 做同样的断言。不把 `zoomFitPage` 放进 Infinity 这项：栏宽是 Infinity 时，适合页面会按高度得到有限百分比。NaN 单独守不住 `clampFloor` 的 `isFinite`，因为 `NaN` 还会被 `parseZoomPercent` 拦下。

临时删掉 `zoom-fit.ts` 里 `!Number.isFinite(budget + pageWidth) ||`，没有提交。这条失败：期望 100，实际 400。已还原。还原后 `git diff` 不含 `zoom-fit.ts`，7 条通过，退出码 0。

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。`check-pr-size` 在 `3b6dbb5` 打印 220 non-generated lines。计划预算 ≤346。没有写 `G12:`。

## corepack pnpm test

退出码 0。191 个文件。867 通过，3 跳过，共 870。跳过在 `tools/check-secrets/leak.test.ts`，本 PR 没有新增 skip。相对 main 多出的是 n9 这一条。CI run 43707232436 的 node job 是 870 通过、0 跳过。

## 真机

未跑。适合宽度、适合页面在 Windows 真机上与 main 一致，留到真机。

S1 之后相对 `origin/main` 的 pr-size 是 249。仍 ≤346。
