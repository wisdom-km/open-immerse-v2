# PR #79 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。gitleaks 8.30.1，与 CI 的 v8.30.1 相同。

门禁跑在规格提交 `f9897d1fb0c27193a36d23448117afdede578ffd`。本文件所在提交 `52c36adbc604ab3cd71ecc1f5ad8e351d2bd54c9` 上又跑了一次 `GATE_BASE=origin/main corepack pnpm run check`，退出码 0（PR 体量 293 行）。基线 `origin/main` 为 `28428ff1478dc77711ae457f73475a1f35cdf016`。

纯文档，不碰 `apps/desktop`。没有界面可点，所以没有截图。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（140 个源文件）、dependency-cruiser（67 modules，无违例）、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（13 行非生成 diff）、codegen、G7 |
| `corepack pnpm test` | 0 | Vitest 65 个文件、114 通过、2 跳过。跳过的是 `tools/check-secrets/leak.test.ts`：当时未设 `GITLEAKS_BIN` |
| `GITLEAKS_BIN=/tmp/gitleaks corepack pnpm exec vitest run tools/check-secrets/leak.test.ts` | 0 | 2 通过。补上上面跳过的文件 |
| `node tools/gate-remediation/run.mjs --id G9 -- /tmp/gitleaks detect --source . --config .gitleaks.toml --redact --no-banner` | 0 | `no leaks found`。210 commits scanned |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

仓库没有单独的 markdown lint 或链接检查脚本。文档门禁就是 `node` job 里的 `pnpm check` 与 gitleaks。

## 方向检索

```bash
rg -n "platform-node|contracts ←|← kernel|-->" *.md docs/
```

完整输出在同目录 `direction-search.txt`（190 行）。其中 `ARCHITECTURE.md:682` 是本 PR 加上的 `PN --> C`。

写反候选：

```bash
rg -n "只依赖 kernel|platform-node 只|contracts 依赖|依赖下游|← contracts|contracts → platform|contracts → features|contracts → providers|kernel → contracts|platform-node ←" *.md docs/
```

无命中。未发现把依赖方向写反或与 §5.1 冲突的句子，不硬改。

## 与 PR #77 的文件交集

`gh pr view 77 --json files` 的路径：

- `apps/desktop/package.json`
- `apps/desktop/src/main/composition-root.ts`
- `apps/desktop/src/main/index.ts`
- `docs/evidence/77/commands.md`
- `docs/exec-plans/feature-m1-logging-impl.md`
- `packages/contracts/package.json`
- `packages/contracts/tsconfig.build.json`
- `packages/kernel/package.json`
- `packages/kernel/tsconfig.build.json`
- `packages/platform-node/package.json`
- `packages/platform-node/src/index.ts`
- `packages/platform-node/src/logging/debug-retention.ts`
- `packages/platform-node/src/logging/file-logger.ts`
- `packages/platform-node/src/logging/log-paths.ts`
- `packages/platform-node/src/logging/value-guard.ts`
- `packages/platform-node/test/debug-retention.test.ts`
- `packages/platform-node/test/file-logger.test.ts`
- `packages/platform-node/test/log-paths.test.ts`
- `packages/platform-node/test/value-guard.test.ts`
- `packages/platform-node/tsconfig.build.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tools/check-deps/tsconfig.paths.json`
- `vitest.config.ts`

`git diff --name-only main...HEAD` 在规格提交上是 `ARCHITECTURE.md`、`docs/backlog.md`。与上面列表的交集为空。本记录提交再增加 `docs/spec-changelog.md` 与 `docs/evidence/79/`，仍不在 #77 的列表里。

## backlog §4 与 Issue

`gh issue view` 于 2026-11-03。#74 是已合入的 PR，不入表；§4 只在 #76 那行把它写作来源。

| Issue | 状态 | backlog 行号 |
| --- | --- | --- |
| #66 | OPEN | 88 |
| #67 | OPEN | 89 |
| #68 | OPEN | 90 |
| #69 | OPEN | 94 |
| #70 | OPEN | 95 |
| #71 | OPEN | 96 |
| #72 | OPEN | 97 |
| #73 | OPEN | 91 |
| #74 | MERGED（PR，不入表） | 无独立行 |
| #75 | OPEN | 92 |
| #76 | OPEN | 93 |

## 对照 N-10 / N-11

diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。没有改代码、CI 或 lockfile。
