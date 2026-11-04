# PR #138 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/docs-rules-approvals`。工作目录是仓库根。基线 `origin/main` `45241c4960842640a84722d615821a03b762098f`。未改日志。没有改 `.github/**`、代码、`package.json`、lockfile。没有改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。lint、typecheck、Vitest、pytest、codegen 没有执行。

## check-docs

在 `7d4b24f7541106c1f8956976f8d4afc227306ec7` 上跑。当时还没有本文件。

```bash
corepack pnpm run check:docs
```

退出码 1。`package.json` 没有 `check:docs` 脚本。输出：`Missing script: check:docs`。没有新增这个脚本。

```bash
node tools/check-docs/check.mjs
```

退出码 0。`links: 0`，`anchors: 0`，`status: 9`，`verbatim: 0`，`findings: 9`。9 条是基线已有的 `index-table-missing` 1 条（`docs/README.md`）和 `status-line-missing` 8 条。没有新的 `missing-file` 或 `missing-anchor`。

## 规格字节

```bash
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。PRD.md 36 段、ARCHITECTURE.md 66 段、RULES.md 的版本历史片段都对准 `f8d5d01`。路径前缀 68 条。

## diff 门禁

同一提交，`GATE_BASE=origin/main`：

```bash
corepack pnpm run check:commits
corepack pnpm run check:pr-size
corepack pnpm run check:hotspots
```

退出码都是 0。`check-commits: subjects match Conventional Commits`。`check-pr-size: 146 non-generated lines`。`check-hotspots: named hotspot diffs are within 30 lines`。

日志在 `/opt/cursor/artifacts/docs-rules-approvals-checks.log`。

## 含本文件

`a3f9996cf1f66914b43547edaf6a68a5756416c1` 已含本文件的上一版。在该提交上再跑 `node tools/check-docs/check.mjs`、`compare-spec-bytes`，以及 `GATE_BASE=origin/main` 下的 `check:commits`、`check:pr-size`、`check:hotspots`。退出码都是 0。check-docs 计数与上一节相同。`check-pr-size: 191 non-generated lines`。

## 14:54 批准之后

删掉 `AGENTS.md` 第 11 行那句条件提醒，并补上批准行之后再跑：

```bash
node tools/check-docs/check.mjs
node tools/compare-spec-bytes/compare.mjs
```

退出码都是 0。check-docs 仍是 links 0、anchors 0、status 9、verbatim 0、findings 9。字节对比仍对准 `f8d5d01`。
