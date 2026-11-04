# PR #129 命令

日期：2026-11-04。分支 `feature/fix-compare-spec-baseline`。工作目录是仓库根。Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。对比基线常量是 `f8d5d01dc8af81b73689c7229c983192551fa6fe`（#125 合入提交 `dd0630bd` 的父提交）。未改日志。没有改 `.github/workflows/**`。没有改依赖版本，没有改许可证白名单。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `corepack pnpm test`。没有跑 worker pytest。

实现提交是 `f38059a216448e2562dfedf1d0ac525dd377b4d8`。下面的命令跑在该提交的内容上，工作区干净。本文件是随后的记录，不回改计划。

## 单测

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts
```

退出码 0。1 个文件，13 passed，失败 0，跳过 0。Type Errors: no errors。Vitest 5.0.5，开始于 04:41:46，耗时 446ms。

修之前在 `dd0630bd` 上跑 `node tools/compare-spec-bytes/compare.mjs`，stderr 是 `compare-spec-bytes: span start missing`，退出码 1。`--base be998cc250e95a3f54c802cab5ea7900ea6aee69` 与 `--base f8d5d01dc8af81b73689c7229c983192551fa6fe` 都退出码 0，68 条路径前缀与 `docs/evidence/125/link-rewrites.txt` 一致。三份规格在这两笔上的 diff 为空。常量用的是 #125 的父提交 `f8d5d01`。

浅克隆：空仓库 `git fetch --depth=1 origin f8d5d01dc8af81b73689c7229c983192551fa6fe` 退出码 0，随后 `git cat-file -e` 找到该 commit。测试里的 fetch 失败句不附 stderr。

## 门禁

在 `f38059a216448e2562dfedf1d0ac525dd377b4d8` 上跑。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。eslint 与两次 tsc 无输出、退出码 0。`check-file-size: 201 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。`check-core-tests: core tests stay on the node project`。npm / pip / 模型许可证通过。`check-one-slice: 0 feature slice(s)`。`check-commits` 通过。`check-hotspots` 通过。`check-pr-size: 115 non-generated lines`。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/check-f38059a.log`。

`compare.mjs` 552 行，硬上限 600。本文件会让非生成行数高于 115，仍低于 600。规格变更记录：不加行。这次不改 PRD、ARCHITECTURE、RULES、DESIGN。
