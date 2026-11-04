# PR #137 命令

日期：2026-11-04（Asia/Shanghai）。分支 `feature/gate-test-timeouts-135`。工作目录是仓库根。基线 `origin/main` `88857a54231174707e8f40efe9bfe8f24e1e5b0a`。未改日志。没有改 `.github/`、`vitest.config.ts`、`package.json`、lockfile。没有改 DESIGN.md、`docs/design-principles.md`、`docs/design/**`。

Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`，再用 `corepack pnpm`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。Vitest 5.0.5。

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 `pnpm test`。没有跑 worker pytest。

同类测试的逐条耗时在 [docs/exec-plans/feature-gate-test-timeouts-135.md](../../exec-plans/feature-gate-test-timeouts-135.md)。下面只记实现提交上的复核。

## 针对性测试

在 `994773d551c4d5e24d09b581f24ad5f54513587e` 上跑。

```bash
corepack pnpm exec vitest run --reporter=verbose tools/gate-remediation/g3.test.ts tools/eslint/limits.test.ts
```

退出码 0。2 passed，0 failed，0 skipped。Type Errors: no errors。

```text
✓ tools/eslint/limits.test.ts > rejects complexity over 15 and functions over 80 lines (G2) 1813ms
✓ tools/gate-remediation/g3.test.ts > prints G3 remediation for a tsc violation that stays outside the required check 1911ms
Test Files  2 passed (2)
Tests  2 passed (2)
Duration  2.02s
```

## 门禁

同一提交 `994773d551c4d5e24d09b581f24ad5f54513587e`。当时还没有本文件。

```bash
GATE_BASE=origin/main corepack pnpm run check
```

退出码 0。`check:format` 打印 `All matched files use Prettier code style!`。ESLint（`--max-warnings 0`）、`typecheck`、`typecheck:core` 没有报错，后续步骤继续执行。`check-file-size: 208 source files within hard limits`。dependency-cruiser：`no dependency violations found (104 modules, 186 dependencies cruised)`。`check-core-tests: core tests stay on the node project`。npm / pip 许可证通过。`check-license: no runtime model manifest`。`check-one-slice: 0 feature slice(s)`。`check-commits: subjects match Conventional Commits`。`check-hotspots: named hotspot diffs are within 30 lines`。`check-pr-size: 178 non-generated lines`。`codegen: 0 generators`。随后的 `git diff --exit-code` 通过（无输出）。

写入本文件的提交只加这条记录，没有再跑 `pnpm check`。
