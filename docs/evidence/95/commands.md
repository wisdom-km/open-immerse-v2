# PR #95 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。未改日志。

代码提交是 `7da3acf`（目录 junction）和 `8f3e271`（Windows CI 步骤与 `docs/ci-and-environment.md`）。下面的 vitest 跑在这两笔所含的工作树上，命令发出时尚未提交；提交后测试文件与 workflow 没有再改。本文件提交之后只改 docs。

基线是 `origin/main` 的 `425a315`。全量 `corepack pnpm test` 与 `corepack pnpm run check` 没有在本机跑。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run apps/desktop/test` | 0 | 8 个文件、16 条通过，0 失败，0 跳过。Type Errors: no errors。Duration 369ms |

输出：

```
Testing types with tsc and vue-tsc is an experimental feature.
Breaking changes might not follow SemVer, please pin Vitest's version when using it.

 RUN  v5.0.5 /agent/repos/open-immerse-v2

 Test Files  8 passed (8)
      Tests  16 passed (16)
Type Errors  no errors
   Start at  14:02:34
   Duration  369ms (transform 55%, import 19%, tests 18%, worker 8%)
```

## Windows CI

`ad3cab1` 的 pull_request 运行：https://github.com/wisdom-km/open-immerse-v2/actions/runs/41650061759

Job `desktop-e2e-windows`：https://github.com/wisdom-km/open-immerse-v2/actions/runs/41650061759/job/125965529997

步骤 `Desktop unit tests`（`corepack pnpm exec vitest run apps/desktop/test`）结论 success。8 个文件通过（8），16 条通过（16），0 跳过。Type Errors: no errors。Duration 661ms。`static-file.test.ts` 为 2 tests 通过。Vitest 汇总没有 skipped 行。
