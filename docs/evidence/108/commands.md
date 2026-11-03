# PR #108 命令

日期：2026-11-04（Asia/Shanghai）。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。未改日志。

工作流提交是 `de3ad10cee6260a85e1c5fd7bba4ce2b7184eda0`。本文件提交之后只改 docs，不改 `.github/workflows/ci.yml`。

基线是 `origin/main` 的 `55fcba1`。全量 `corepack pnpm test` 与 `corepack pnpm run check` 没有在本机跑。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm run check:deps` | 0 | 本机 Linux。约 1 秒。90 modules，164 dependencies，no violations |
| `corepack pnpm exec vitest run tools/check-deps` | 0 | 本机 Linux。4 个文件、5 条通过，失败 0，跳过 0。Duration 4.00s。Type Errors: no errors |

## Windows CI

`de3ad10cee6260a85e1c5fd7bba4ce2b7184eda0` 只有一次 `pull_request` 运行，没有 `push` 运行。五个检查名各出现一次：`node`、`python-worker`、`worker-health-windows`、`worker-health-macos`、`desktop-e2e-windows`。

运行：https://github.com/wisdom-km/open-immerse-v2/actions/runs/41689807134

Job `worker-health-windows`：https://github.com/wisdom-km/open-immerse-v2/actions/runs/41689807134/job/126105093052

步骤 `Check deps` 结论 success。日志行：

```
check:deps exit 0
```

同一段还有 `✔ no dependency violations found (90 modules, 164 dependencies cruised)`。这一步从 18:02:42Z 到 18:02:44Z。

步骤 `Check deps tests`（`corepack pnpm exec vitest run tools/check-deps`）结论 success。4 个文件通过（4），5 条通过（5），失败 0。Type Errors: no errors。Duration 9.58s。汇总没有 skipped 行。`contracts-kernel.test.ts` 的 `allows a type-only kernel re-export and rejects a value import` 通过。

该 job 从 18:01:31Z 到 18:03:04Z（93 秒）。同一运行的 `desktop-e2e-windows` 从 18:01:31Z 到 18:02:42Z（71 秒）。新增两步大约 13 秒。

`worker-health-macos` 在排队后被取消，没有开始步骤。注解是 `The job was not acquired by Runner of type hosted even after multiple attempts`，另有 macOS arm64 容量提示。不是这两步引起的。Windows 这一条已经跑完并通过。
