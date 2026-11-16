# PR #221 命令

Node v22.23.4。工作目录是仓库根。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`GATE_BASE=origin/main` 是 `95796e5f96cc8cceb78dc6389585626d03d1d486`。下面四条跑在 `ac5b488117725b8d2faa9c1e057204dfea607a51`，当时还没有本文件。没有真机。没有 Ready、合入或发版。

## corepack pnpm run codegen

退出码 0。打印 `codegen: 1 generators`。随后 `git diff --exit-code` 退出码 0。三份生成物哈希与命令前相同。`oi.generated.ts` 是 `bbc7f9c05898fd5855e56461992774d421b8a5474de2a28f8e092a4d0570c0a9`。`oi-api.d.ts` 是 `e1e24168d06125117cfe12435415e280dc6ca9ca3c2fdc776d73c0494c596a14`。`registry.generated.ts` 是 `3790bc80745ec48f85fcf786ef1fa18ef7a84565c4fcf710d13f9d252492d19d`。

## corepack pnpm exec vitest run packages/contracts/test/ipc-shell.test.ts

退出码 0。打印 2 个文件、16 通过、0 跳过。Type Errors 无。同一文件的运行时和 typecheck 各计一次，源码里是 8 个 `it`。

## corepack pnpm test

退出码 0。194 个文件。896 通过，3 跳过，共 899。Type Errors 无。定向那一条没有跳过。默认报告没有写出跳过的名字。

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。Prettier 无违例文件。`check-file-size` 打印 490 source files within hard limits。`check-one-slice` 打印 0 feature slice(s)。`check-pr-size` 打印 497 non-generated lines。codegen 后工作区干净。提交说明没有放行标记。

本文件 21 行。连同上面的 497，相对 base 的非生成合计是 518。
