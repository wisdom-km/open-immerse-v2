# 命令

PR #110。分支 `feature/m1-deferred-gates`。测量基线 `origin/main` `e6f29d28f15f476ad0458cc3a3c11ddb4c0991c9`。没有改 `.github/workflows/*`。没有对 Prettier 使用 `--write`。

Node 是 v22.23.4，pnpm 是 10.34.9。Prettier 是 `pnpm dlx prettier@3.6.2`，版本打印 `3.6.2`。

## Prettier 干跑

忽略文件写在 `/tmp/prettier-measure.ignore`：`node_modules`、`dist`、`coverage`、`.venv`、`__pycache__`、`.ruff_cache`、`.git`、`test-results`、`playwright-report`、`pnpm-lock.yaml`、`workers/parser/uv.lock`。

在 `e6f29d2` 上：

```bash
prettier --no-config --ignore-unknown --ignore-path /tmp/prettier-measure.ignore --check '**/*.{ts,tsx,mjs,js,cjs,css}'
```

退出码非 0。`Code style issues found in 89 files.` 与基线 `25762f1` 相比，只多了 `packages/contracts/test/worker-version.test.ts`。对这 89 个文件做 stdout diff：+1402 / −381，合计 1783 行。

```bash
prettier --no-config --check .github/workflows/ci.yml
```

退出码 0。`All matched files use Prettier code style!`

在 `25762f1` 上（#109 没有改 json、yaml 或除 `docs/evidence/109/commands.md` 以外的 Markdown）：

```bash
prettier --no-config --ignore-unknown --ignore-path /tmp/prettier-measure.ignore --check '**/*.{json,yml,yaml}'
prettier --no-config --ignore-unknown --ignore-path /tmp/prettier-measure.ignore --check '**/*.md'
```

JSON / YAML：12 个文件，+16 / −12，合计 28 行。Markdown：67 个文件，+3981 / −3585，合计 7566 行。`e6f29d2` 上再对 `docs/evidence/109/commands.md` 执行 `--check`，退出码非 0。

## 门禁

所在提交 `086be00e013757206f7adcdf009f07a460a67643`（只有执行计划）。本地 `main` 已快进到 `origin/main`，对比基线不是落后的那一版。

```bash
corepack pnpm exec vitest run tools/gate-remediation/g3.test.ts
corepack pnpm run check
```

Vitest：1 个文件、1 条通过，失败 0，跳过 0，退出码 0。`pnpm check` 退出码 0。`check-pr-size` 打印 `60 non-generated lines`。没有跑 `pnpm test`。

同一组命令在 `eb5fc2eb94901f216e3cb692a755fa5da82da815` 上重跑。Vitest 仍是 1 个文件、1 条通过，失败 0，跳过 0，退出码 0。`pnpm check` 退出码 0。`check-pr-size` 打印 `103 non-generated lines`。没有跑 `pnpm test`。
