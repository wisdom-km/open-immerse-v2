# PR #114 命令

日期：2026-11-04。工作目录是仓库根。基线是 `origin/main` 的 `25762f11142b4f1eef9cf7f6ef08ad178679894c`。未改日志。

这一笔只有执行计划。检查器还没写，所以没有跑 `corepack pnpm test`、`corepack pnpm run check` 或 `node tools/check-docs/check.mjs`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

发现数来自计划里那套规则，在基线上统计，脚本不在仓库里。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `git rev-parse HEAD`（统计时仍在 `main`） | 0 | `25762f11142b4f1eef9cf7f6ef08ad178679894c` |
| 按 `docs/exec-plans/feature-m1-check-docs.md`「检查什么」统计链接、锚点、状态行、逐字 | 0 | 见下表 |

## 基线发现数

| 类 | 数 |
| --- | --- |
| 扫描的 Markdown | 76 |
| 仓库内链接对得上 | 272 |
| 外链跳过（未访问网络） | 168 |
| 缺文件 | 0 |
| 缺锚点 | 0 |
| `index-table-missing` | 1 |
| `status-line-missing` | 18 |
| 逐字不一致 | 0 |
| 合计 | 19 |

18 个没有状态行的路径写在执行计划里。`docs/evidence/**` 不在状态行范围内。

## 实现

日期：2026-11-04。Forge 审查通过之后。工作目录是仓库根。Node v22.23.4，pnpm 10.34.9。未改日志。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

状态行范围同时去掉 `docs/exec-plans/**` 和 `docs/evidence/**`。外链不访问。`pnpm check` 不包含这条检查。

### 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/check-docs` | 0 | 4 个文件，15 条测试 |
| `corepack pnpm exec tsc --noEmit --project tsconfig.json --pretty false` | 0 | 定向类型检查。全量 `pnpm check` 里的 `typecheck` 另记 |
| `node tools/check-docs/check.mjs` | 0 | 见下表。stdout 如下 |
| `GATE_BASE=origin/main corepack pnpm run check` |  | 本文件提交之后再跑，退出码补在下一节 |

### 实测发现数

在合入 `origin/main` 的 `da5c086`（#113）之后再跑了一次。审查前的 19 不改写。`docs/exec-plans/**` 已排除，所以执行计划本身不计入。合入没有改变这 10 条。

| 类 | 数 |
| --- | --- |
| 缺文件 | 0 |
| 缺锚点 | 0 |
| `index-table-missing` | 1 |
| `status-line-missing` | 9 |
| 逐字不一致 | 0 |
| 合计 | 10 |

9 个没有状态行的文件：

1. `docs/README.md`
2. `docs/WORKFLOW.md`
3. `docs/architecture/inputs/pdf_translation_architecture.md`
4. `docs/ci-and-environment.md`
5. `docs/design/md-reader.md`
6. `docs/gate-remediation.md`
7. `docs/incidents/TEMPLATE.md`
8. `docs/reviews/2026-10-30-architecture-review.md`
9. `docs/spec-changelog.md`

```text
check-docs: report-only
links: 0
anchors: 0
status: 10
verbatim: 0
findings: 10
index-table-missing	docs/README.md	索引表缺少路径与状态列
status-line-missing	docs/README.md	前 40 行没有状态行
status-line-missing	docs/WORKFLOW.md	前 40 行没有状态行
status-line-missing	docs/architecture/inputs/pdf_translation_architecture.md	前 40 行没有状态行
status-line-missing	docs/ci-and-environment.md	前 40 行没有状态行
status-line-missing	docs/design/md-reader.md	前 40 行没有状态行
status-line-missing	docs/gate-remediation.md	前 40 行没有状态行
status-line-missing	docs/incidents/TEMPLATE.md	前 40 行没有状态行
status-line-missing	docs/reviews/2026-10-30-architecture-review.md	前 40 行没有状态行
status-line-missing	docs/spec-changelog.md	前 40 行没有状态行
```

`ci.yml` 只在末尾追加 `docs-report`。hunk 是 `@@ -279,3 +279,19 @@ jobs:`。job 设 `continue-on-error: true`。没有改现有 job 的名字、`on` 和 `concurrency`。
