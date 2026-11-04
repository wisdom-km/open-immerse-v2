# 命令记录

PR #126。分支 `feature/m1-issue35-real-tree`。基线 `origin/main@f8d5d01`。

全量跑在 `b63dc88`。这个 tip 只跑了一次。没有失败项，没有重跑。

## 先红后绿

在工作区写入 `packages/features/jobs/src/domain/_gate-calls-ingest.ts`，内容是对 `packages/features/ingest/src/index.ts` 的导入。然后跑 `node tools/check-deps/check.mjs`。

| 阶段 | 退出码 | 输出要点 |
| --- | --- | --- |
| 探针还在 | 1 | `error feature-dependency-matrix: packages/features/jobs/src/domain/_gate-calls-ingest.ts → packages/features/ingest/src/index.ts`。随后是 `gate-remediation: G5` |
| 删除探针之后 | 0 | `no dependency violations found (104 modules, 186 dependencies cruised)` |

仓库里的用例把同一段写进 `finally`：`tools/check-deps/real-tree-ingest.test.ts`，以及 UI application、跨切片内部、`pure.ts`、G18。`corepack pnpm exec vitest run` 这 5 个文件：8 passed。

## 全量

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | format、lint、typecheck、typecheck:core、行数（206 个源文件）、dependency-cruiser（104 modules，186 dependencies，无违例）、core 测试位置、npm/pip/模型许可证、G18（1 个功能切片）、Conventional Commits、热点、PR 体量（588 行非生成）、codegen（0 generators）。其后 `git diff --exit-code` 通过 |
| `corepack pnpm test` | 0 | 238 passed，3 skipped，0 failed。93 个文件。跳过的 3 条是 `tools/check-secrets/leak.test.ts` 里需要本机 `GITLEAKS_BIN` 的 detect 用例。本机没设该变量。`countsAsCi` 与 `CI=1` 的用例没有跳过 |
| `corepack pnpm exec vitest run packages/features/jobs/test/core/job-id.test.ts` | 0 | 2 passed。含在上面的全量里，这里单独记一行 |
| `workers/parser/` 下 G2 `uv run ruff check .` | 0 | All checks passed |
| G1 `uv run ruff format --check .` | 0 | 65 files already formatted |
| G8 `uv run pytest` | 0 | 161 passed，1 warning |
| G3 `uv run pyright` | 0 | 0 errors |
| G6 `uv run lint-imports` | 0 | 7 kept，0 broken |

Node 是 v22.23.4。`corepack pnpm` 来自这支 Node。

## 本提交

本文件、计划的「实际」列，以及 backlog 里的 PR 号，只改文档。TS 与 Python 套件仍以 `b63dc88` 为准。包含本文件的 tip 上再跑一次 `GATE_BASE=origin/main corepack pnpm run check`，结果写在 PR #126 正文。

