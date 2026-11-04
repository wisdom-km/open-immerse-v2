# PR #145 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/rules-ui-acceptance-24`。工作目录是仓库根。基线 `origin/main` `f9b34e8f60497a6c6c8bd59e7e9ff17ec01fec8f`（PR #143）。未改日志。没有改 `.github/workflows/**`、`apps/`、`packages/`、`workers/`、`tools/**`。没有改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。没有改 `docs/WORKFLOW.md`、`docs/backlog.md`、`packages/contracts/src/diag-events.ts`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。lint、typecheck、Vitest、pytest、prettier、`pnpm check`、e2e 没有执行。

## compare-spec-bytes

RULES.md §9 加上「UI 上手验收」一行之后立刻跑，当时还没有改模板、changelog、approvals。退出码 0。

正文提交 `26edf8f7dc3b9a9e2f85ca910b36ca27d4e36e9c` 上再跑一次，退出码 0。本文件加入之后又跑一次，退出码 0。三次输出相同：

```bash
node tools/compare-spec-bytes/compare.mjs
```

```text
compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (194695 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (361463 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes
```

退出码 0。`tools/compare-spec-bytes/manifest.json` 没有改。span 仍只比对 changelog 里从「Q1–Q12 已由 Wisdom…」到「日期：2026-11-03（Asia/Shanghai）。」的那一段。

## check-docs

基线 `f9b34e8` 上退出码 0，`findings: 9`。正文提交 `26edf8f` 上相同。本文件加入之后再跑：

```bash
node tools/check-docs/check.mjs
```

退出码 0。

```text
check-docs: report-only
links: 0
anchors: 0
status: 9
verbatim: 0
findings: 9
index-table-missing	docs/README.md	索引表缺少路径与状态列
status-line-missing	docs/README.md	前 40 行没有状态行
status-line-missing	docs/WORKFLOW.md	前 40 行没有状态行
status-line-missing	docs/architecture/inputs/pdf_translation_architecture.md	前 40 行没有状态行
status-line-missing	docs/ci-and-environment.md	前 40 行没有状态行
status-line-missing	docs/design/md-reader.md	前 40 行没有状态行
status-line-missing	docs/gate-remediation.md	前 40 行没有状态行
status-line-missing	docs/incidents/TEMPLATE.md	前 40 行没有状态行
status-line-missing	docs/reviews/2026-10-30-architecture-review.md	前 40 行没有状态行
```

9 条与基线相同。没有新增发现。

## grep

在 `26edf8f` 上：

```bash
grep -n "上手验收" RULES.md .github/PULL_REQUEST_TEMPLATE.md
```

```text
RULES.md:239:| UI 上手验收 | 任务类型为「UI 改动」的 PR，合入前由 Loom 或 Wisdom 实际上手体验，并在 PR 里留下结论（通过 / 不通过 + 一句理由）。没有 UI 改动的写「不适用」 | 本节；[.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md)「UI 上手验收」 |
.github/PULL_REQUEST_TEMPLATE.md:77:## UI 上手验收（RULES §9）
.github/PULL_REQUEST_TEMPLATE.md:79:条件在 [RULES.md](../RULES.md) §9「UI 上手验收」。
.github/PULL_REQUEST_TEMPLATE.md:81:- [ ] 任务类型为「UI 改动」：Loom 或 Wisdom 已上手验收，结论：____（验收人、时间）。非 UI 改动写「不适用」
```

RULES 第 239 行链接模板并点名「UI 上手验收」。模板第 77 行标题写「RULES §9」，第 79 行链回 RULES.md §9。
