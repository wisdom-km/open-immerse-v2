# PR #177 命令

日期：2026-11-06（Asia/Shanghai）。分支 `feature/docs-daycheck-2026-11-06-28`。工作目录是仓库根。对照的 `origin/main` 是 `d8113a1e98c41aaf37258c7f3cf00bd6c64d5a59`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。pytest、e2e、全量 `pnpm test`、全量 `pnpm check` 没有执行。未改日志。没有改 `.github/workflows/**`、`apps/`、`packages/`、`workers/`、`fixtures/`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。没有新建 `fixtures/eval/`。

下面的输出跑在 `57776dc69dbbf9d697264379857a987caf586704`（正文、manifest、approvals、changelog 初稿、执行计划的实际列都已在；还没有本文件，changelog 的 PR 列还是「本 PR」）。`git diff --check origin/main...HEAD` 也是在这一笔上跑的。

## check-docs

```bash
node tools/check-docs/check.mjs
```

退出码 0。

```text
check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0
```

## compare-spec-bytes

```bash
node tools/compare-spec-bytes/compare.mjs
```

退出码 0。

```text
compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (194695 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (365716 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes
```

不改基线 `f8d5d01`，不改 `compare.mjs`。manifest 在末尾加了 4 条唯一替换。

## diff --check

```bash
git diff --check origin/main...HEAD
```

退出码 0。没有空白错误。

## compare-spec-bytes 测试

```bash
corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts
```

退出码 0。Test Files 1 passed。Tests 14 passed。Type Errors no errors。

## check-commits

```bash
node tools/check-commits/check.mjs --base origin/main
```

退出码 0。

```text
check-commits: subjects match Conventional Commits
```

`56542b8691de68a33dd24ee8cc71b30b9f831a2f` 加上本文件，并把 changelog 的 PR 列改成 #177 之后，又跑了 `node tools/check-docs/check.mjs`、`node tools/compare-spec-bytes/compare.mjs`、`git diff --check origin/main...HEAD`、`node tools/check-commits/check.mjs --base origin/main`。退出码都是 0。check-docs 仍是 findings 0。compare 的三行字节数与上面相同。vitest 没有再跑：`tools/compare-spec-bytes/` 的测试与 `manifest.json` 在 `57776dc` 之后没有改。

## 没有重跑的项

全量 `pnpm test`、`pnpm check`、worker 的 ruff / pyright / pytest、桌面 e2e、真机。本次只改文档与 manifest 数据。
