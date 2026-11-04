# PR #125 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/m1-split-prd-arch`。工作目录是仓库根。测量基线 `origin/main` `be998cc250e95a3f54c802cab5ea7900ea6aee69`。未改日志。没有改 `.github/workflows/*`、`tools/codegen`、`tools/check-*`、license 工具、`.gitattributes`、`package.json`、lockfile。没有改 DESIGN.md、`docs/design-principles.md`、`docs/design/**`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 逐字节比对

在 `032ab1db4520c375fb5ea4f619cd28eae877b76c` 上跑。

```bash
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。

```text
compare-spec-bytes: PRD.md 36 parts match origin/main (194695 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match origin/main (360198 bytes)
```

比对基线是 `git show origin/main:PRD.md` 与 `git show origin/main:ARCHITECTURE.md`。章节文件头从 `<!-- oi-split-header -->` 剥到 `<!-- /oi-split-header -->` 及其后的一个换行。

## 测试

同一提交：

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts
```

退出码 0。8 passed。覆盖剥头、拼接、差一个字节、与 `origin/main` 逐字节相同、根索引标题 slug 与原文相同、链接与锚点。

## check-docs

同一提交：

```bash
node tools/check-docs/check.mjs
```

退出码 0。`links: 0`，`anchors: 0`，`status: 10`，`verbatim: 0`，`findings: 10`。十条与基线相同：`index-table-missing` 1 条（`docs/README.md`）和 `status-line-missing` 9 条（`docs/README.md`、`docs/WORKFLOW.md`、`docs/architecture/inputs/pdf_translation_architecture.md`、`docs/ci-and-environment.md`、`docs/design/md-reader.md`、`docs/gate-remediation.md`、`docs/incidents/TEMPLATE.md`、`docs/reviews/2026-10-30-architecture-review.md`、`docs/spec-changelog.md`）。本分支没有多出发现。`docs/evidence/**` 不在状态行范围内。

## 门禁

在 `032ab1db4520c375fb5ea4f619cd28eae877b76c` 上跑。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。`check-file-size: 198 source files within hard limits`。dependency-cruiser：`no dependency violations found (105 modules, 183 dependencies cruised)`。`check-commits` 通过。`check-pr-size: 7110 non-generated lines`（提交说明里有 `G12:`）。codegen 1 个 generator，随后的 `git diff --exit-code` 通过。日志在 `/opt/cursor/artifacts/pnpm-check-125.log`。

写入本文件的提交补上本路径，并改执行计划的实际列。该提交上再跑一次的退出码写在 PR 描述。
