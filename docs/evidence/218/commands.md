# PR #218 拆 fit

Node v22.23.4。工作目录是仓库根。基线 main `04fa9be8523614f43fb14a2c2767aedbefe14017`。`pnpm run check` 与 `pnpm test` 跑在 tip `3b6dbb5`，当时还没有本文件。`GATE_BASE=origin/main`。没有真机。没有 Ready、合入或发版。

## vitest run use-zoom.test.tsx zoom-controls.test.tsx page-column.test.tsx

退出码 0。3 个文件、24 个测试。`use-zoom.test.tsx` 7 条。栏宽不是有限数时百分比仍是 100，没有播报。适合宽度仍是 223 和 185，适合页面仍是 95。

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。`check-pr-size` 在 `3b6dbb5` 打印 220 non-generated lines。计划预算 ≤346。没有写 `G12:`。

## corepack pnpm test

退出码 0。191 个文件。867 通过，3 跳过，共 870。跳过在 `tools/check-secrets/leak.test.ts`，本 PR 没有新增 skip。相对 main 多出的是 n9 这一条。

## 真机

未跑。适合宽度、适合页面在 Windows 真机上与 main 一致，留到真机。

本文件落盘后，相对 `origin/main` 的 pr-size 是 241：此前 220，加上本文件 21 行。计划证据格是同一行再改，相对 main 仍是 +1/−1。仍 ≤346。
