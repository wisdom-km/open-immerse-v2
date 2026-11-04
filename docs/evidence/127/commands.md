# PR #127 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/docs-exec-plans-approvals`。工作目录是仓库根。测量基线 `origin/main` `dd0630bd19f5aa1e26c068ab846e72f309edb7b2`。未改日志。没有改 `.github/workflows/**`、`tools/**`、`package.json`、lockfile。没有改 DESIGN.md、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## check-docs

在 `26bc8a54094b1c6cc10415aa5bd48f08427d9e8e` 上跑。当时还没有本文件。

```bash
node tools/check-docs/check.mjs
```

退出码 0。`links: 0`，`anchors: 5`，`status: 9`，`verbatim: 0`，`findings: 14`。5 个 `missing-anchor` 是 #125 留下的 slug（ARCHITECTURE.md 3 处，PRD.md 2 处）。本 PR 不修。9 条是基线已有的 `index-table-missing` 1 条（`docs/README.md`）和 `status-line-missing` 8 条。没有新的 `missing-file`。

## 门禁

同一提交：

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 201 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。`check-commits` 通过。`check-pr-size: 233 non-generated lines`。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/pnpm-check-exec-plans.log`。

## 含本文件的提交

`c66496606382143ac88e5e36991dff9b6a0a20ea` 已含本文件的上一版。在该提交上再跑两条命令：check-docs 退出码 0，计数与上一节相同；`GATE_BASE=origin/main corepack pnpm run check` 退出码 0，`check-pr-size: 261 non-generated lines`。日志在 `/opt/cursor/artifacts/check-docs-127.log` 与 `/opt/cursor/artifacts/pnpm-check-127.log`。

补上本段之后再跑，`check-pr-size: 000 non-generated lines`，check 与 check-docs 的退出码都是 0。这一行只改数字，不增加行数。
