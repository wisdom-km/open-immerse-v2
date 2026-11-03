# PR #116 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/docs-m4-desktop-ui`。工作目录是仓库根。测量基线 `origin/main` `da5c086`。未改日志。没有改代码、`tools/**`、`package.json`、`.github/workflows/*`、lockfile。

只跑 `GATE_BASE=origin/main corepack pnpm run check`。没有跑 `corepack pnpm test`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。工作区干净。

## 门禁

在 `8474da8d7edab4186031f00ae1152f2dcfbbf95f` 上跑。当时还没有本文件，也还没有 changelog 的 #116 行。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 178 source files within hard limits`。dependency-cruiser：`no dependency violations found (92 modules, 175 dependencies cruised)`。`check-commits` 通过。`check-pr-size: 726 non-generated lines`（`8474da8` 的说明含 `G12:`）。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。

写入本文件和 changelog 行的提交只追加记录。该提交上再跑一次的退出码写在 PR 描述。

## 链接

对 `637f9af` 改过的 `PRD.md`、`ARCHITECTURE.md`、`DESIGN.md`、`docs/design-principles.md` 抽出仓库内 Markdown 链接，标题锚点按 GitHub 的算法（小写，去掉标点，空格改成 `-`）核对。73 条能打开。唯一对不上文件的是 AC-38 表格里的例句 `[x](x.md)`，那是验收条文里的链接写法，不是仓库链接，未改。这四份文件在 `637f9af` 的新增行里没有新的 Markdown 链接。没有断链要修。
