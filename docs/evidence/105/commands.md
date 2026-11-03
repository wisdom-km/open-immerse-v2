# PR #105 命令

日期：2026-11-04。工作目录是仓库根。基线是 `origin/main` 的 `82b1942`（#102 已合入，含 `concurrency`）。未改日志。

触发器改动在 `ccbaa6a8e5911407d85af4a7c342aff2a8edee32`。本文件与 `docs/spec-changelog.md` 在其后的提交。全量 `corepack pnpm test` 与 `corepack pnpm run check` 没有在本机跑：diff 只有工作流触发与 CI 文档。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `python3 -c 'import yaml; yaml.safe_load(open(".github/workflows/ci.yml"))'` | 0 | 打印 `yaml ok` |
| `git diff origin/main -- .github/workflows/ci.yml` | 0 | 只改 `on:`。`concurrency` 的 `group` 与 `cancel-in-progress` 不在 diff 里 |

`git diff` 里工作流的变化是：

```diff
-on: [push, pull_request]
+on:
+  push:
+    branches:
+      - main
+  pull_request:
```

## CI：`ccbaa6a` 每个检查出现一次

采集时该 run 仍在进行（`python-worker` 已成功，其余还在排队或进行）。同一提交没有第二组 run。事件只有 `pull_request`，没有 `push`。

`gh run list --commit ccbaa6a8e5911407d85af4a7c342aff2a8edee32 --limit 20`：

```
queued		ci: 每个 PR tip 只跑一轮检查	CI	feature/m1-ci-single-run	pull_request	41684675979	28s	2026-11-03T17:29:06Z
```

`gh run view 41684675979 --json event,headSha,status,url,jobs`：

```json
{"event":"pull_request","headSha":"ccbaa6a8e5911407d85af4a7c342aff2a8edee32","status":"queued","url":"https://github.com/wisdom-km/open-immerse-v2/actions/runs/41684675979","jobs":[{"name":"desktop-e2e-windows","status":"in_progress"},{"name":"node","status":"in_progress"},{"name":"worker-health-macos","status":"queued"},{"name":"python-worker","status":"completed","conclusion":"success"},{"name":"worker-health-windows","status":"in_progress"}]}
```

`gh pr view 105 --json statusCheckRollup` 里检查名各出现 1 次：

```json
[{"count":1,"name":"desktop-e2e-windows"},{"count":1,"name":"node"},{"count":1,"name":"python-worker"},{"count":1,"name":"worker-health-macos"},{"count":1,"name":"worker-health-windows"}]
```

`gh pr checks 105`（同一时刻）：

```
python-worker	pass	20s	https://github.com/wisdom-km/open-immerse-v2/actions/runs/41684675979/job/126087186218
desktop-e2e-windows	pending	0	https://github.com/wisdom-km/open-immerse-v2/actions/runs/41684675979/job/126087185538
node	pending	0	https://github.com/wisdom-km/open-immerse-v2/actions/runs/41684675979/job/126087185891
worker-health-macos	pending	0	https://github.com/wisdom-km/open-immerse-v2/actions/runs/41684675979/job/126087186040
worker-health-windows	pending	0	https://github.com/wisdom-km/open-immerse-v2/actions/runs/41684675979/job/126087186241
```

五条检查各一行。没有重复的 `node`、`python-worker`、`worker-health-windows`、`worker-health-macos` 或 `desktop-e2e-windows`。

推送本文件会再触发一次 `pull_request`，并取消上面这一轮还在跑的 run。含本文件的 tip 另有一节，在该 tip 的 run 列出检查之后补上。
