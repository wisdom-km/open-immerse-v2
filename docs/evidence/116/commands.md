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

写入本文件和 changelog 行的提交是 `bca8ad00ed46c5fc94c20a40c130a2df94f106fb`。在该提交上再跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 750 non-generated lines`。其余步骤与上一节相同。日志在 `/opt/cursor/artifacts/pnpm-check-116.log`。追加本段的提交只改这一节；该提交上再跑一次的退出码写在 PR 描述。

Forge 审过 `853b284` 之后，采纳标记与四条必需检查写在 `facbdd2e727e57570f80ef29851ce20b1db15f8b`。在该提交上再跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 761 non-generated lines`。`check:format`、`check-file-size`（178）、dependency-cruiser（92 modules, 175 dependencies）、`check-commits`、codegen 与 `git diff --exit-code` 与上一节相同。日志在 `/opt/cursor/artifacts/pnpm-check-116-adopt.log`。追加本段的提交只改这一节；该提交上再跑一次的退出码写在 PR 描述。tip `9a6a04e912f8e79f2f3ee5e6f5f830b7defc4c40` 再跑退出码 0，`check-pr-size: 769 non-generated lines`。

Loom 的 DESIGN 跟进补丁在 `3335afe20225da20f3040749e5677576dd166482`。DESIGN.md 相对上一提交是 +12/−8。在该提交上再跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 776 non-generated lines`。其余步骤与上一节相同。日志在 `/opt/cursor/artifacts/pnpm-check-116-design.log`。追加本段的提交只改这一节；该提交上再跑一次的退出码写在 PR 描述。tip `508ee3da2d5680ccb9bdae267a68ac305bd87f25` 再跑退出码 0，`check-pr-size: 784 non-generated lines`。

Anvil 审过 `508ee3d` 之后，ADR 0001 的选项与决定对齐写在 `651fcc7ef162ea332b8fa06b1bac5b0026c91f68`。在该提交上再跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 783 non-generated lines`。其余步骤与上一节相同。日志在 `/opt/cursor/artifacts/pnpm-check-116-adr.log`。追加本段的提交只改这一节；该提交上再跑一次的退出码写在 PR 描述。

DESIGN 的 R14、UIX-69 与决策日志顺序在 `ad299d51734de425f6eb0aed18c138787cf5c482`。ADR 0001 正文批准范围改成 02:04–03:54 在 `f29e1f5f6da6f1928a69e320b2e4e1abc13214f3`。changelog 同一范围在 `5b3d40ba037d70ff5cd4d4904b71a0c3b8ed7ae3`。在该提交上再跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 793 non-generated lines`。其余步骤与上一节相同。日志在 `/opt/cursor/artifacts/pnpm-check-116-range.log`。追加本段的提交只改这一节；该提交上再跑一次的退出码写在 PR 描述。tip `cbb13926c4d218620f90eebe15760d9c7faf19ee` 再跑退出码 0，`check-pr-size: 801 non-generated lines`。

§3.8.2 改为已批、决策日志补 04:17，写在 `4d48b7d0894c04f2031a7db46cad221b1c63a415`。在该提交上再跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 802 non-generated lines`。其余步骤与上一节相同。日志在 `/opt/cursor/artifacts/pnpm-check-116-0417.log`。追加本段的提交只改这一节；该提交上再跑一次的退出码写在 PR 描述。

术语抽取的 M4 顺序与 `docs/approvals.md` 写在 `d0b37e172194a2fb02bb213cb865bb6c36e8d551`。在该提交上跑：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check-pr-size: 843 non-generated lines`。仓库没有 `check-docs` 脚本，这次没有跑。`check-pr-size` 通过，没有为它改提交说明。日志在 `/opt/cursor/artifacts/pnpm-check-116-m4-order.log`。追加本段的提交只改这一节；该提交上再跑一次的退出码写在 PR 描述。

## 链接

对 `637f9af` 改过的 `PRD.md`、`ARCHITECTURE.md`、`DESIGN.md`、`docs/design-principles.md` 抽出仓库内 Markdown 链接，标题锚点按 GitHub 的算法（小写，去掉标点，空格改成 `-`）核对。73 条能打开。唯一对不上文件的是 AC-38 表格里的例句 `[x](x.md)`，那是验收条文里的链接写法，不是仓库链接，未改。这四份文件在 `637f9af` 的新增行里没有新的 Markdown 链接。没有断链要修。
