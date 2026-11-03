# PR #121 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/m0-acceptance-format`。工作目录是仓库根。测量基线 `origin/main` `865c2f50f1844ccd528ebc651af10902ce2def6b`。未改日志。没有改代码、`tools/**`、`package.json`、`.github/workflows/*`、lockfile。没有改 `PRD.md`、`ARCHITECTURE.md`。

只跑 `GATE_BASE=origin/main corepack pnpm run check` 与 `node tools/check-docs/check.mjs`。没有跑 `corepack pnpm test`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。

## 门禁

在 `538d14607445b5f876ad5dc1c564c5dd02d5d611` 上跑。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 184 source files within hard limits`。dependency-cruiser：`no dependency violations found (92 modules, 175 dependencies cruised)`。`check-commits` 通过。`check-pr-size: 108 non-generated lines`。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/pnpm-check-121.log`。

写入本文件的提交补上本路径，并改 changelog 的 #121 行。该提交上再跑一次的退出码写在 PR 描述。

## check-docs

同一提交 `538d14607445b5f876ad5dc1c564c5dd02d5d611`：

```bash
node tools/check-docs/check.mjs
```

退出码 0。`links: 0`，`anchors: 0`，`status: 10`，`verbatim: 0`，`findings: 10`。十条是 `index-table-missing` 1 条（`docs/README.md`）和 `status-line-missing` 9 条。

`origin/main` `865c2f50f1844ccd528ebc651af10902ce2def6b` 上，对检出的工作树跑同一命令，退出码 0，`findings: 10`，种类与路径与上一节相同。本分支没有多出发现。`docs/evidence/**` 不在状态行范围内。
