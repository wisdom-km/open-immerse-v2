# PR #143 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/docs-arch-sync-28`。工作目录是仓库根。基线 `origin/main` `7a23dde47ef66aa1a2b3cbaddbb64194e7f0511c`（PR #141）。未改日志。没有改 `.github/workflows/**`、`apps/`、`packages/`、`workers/`、`tools/` 的源码，也没有改 `tools/compare-spec-bytes/`。没有改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。没有改 PR #142 的文件。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。lint、typecheck、Vitest、pytest、prettier、`pnpm check` 没有执行。

## check-docs

在正文提交 `49114de1259efe5f7559395935dcdebf7b623379` 上跑。当时还没有本文件。

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
```

9 条与基线 `7a23dde` 相同：`index-table-missing` 1 条（`docs/README.md`），`status-line-missing` 8 条（`docs/README.md`、`docs/WORKFLOW.md`、`docs/architecture/inputs/pdf_translation_architecture.md`、`docs/ci-and-environment.md`、`docs/design/md-reader.md`、`docs/gate-remediation.md`、`docs/incidents/TEMPLATE.md`、`docs/reviews/2026-10-30-architecture-review.md`）。没有新增发现。

## 规格字节

同一提交：

```bash
node tools/compare-spec-bytes/compare.mjs
```

退出码 1。

```text
compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (194695 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: ARCHITECTURE.md differs at byte 37817
```

基线 `f8d5d01` 上拼回的 ARCHITECTURE.md 是 360814 字节，本分支是 361595 字节。第一处差异是 `docs/arch/03.md` 的 renderer 注释，从「应用外壳：路由、布局插槽、全局 Provider」改成「当前只有 index.html；路由、布局插槽、全局 Provider 为计划中」。没有改比对工具，没有加 amendment。`pnpm test` 会收集 `tools/compare-spec-bytes/compare.test.ts`，CI 里这条预期失败。
