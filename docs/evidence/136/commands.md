# PR #136 命令

日期：2026-11-04。分支 `feature/m3-worker-stop-signals-59`。代码与规格提交是 `07b9eb2bdf65dd87adc1132d406a1cf210751129`（rebase 到 `origin/main` 的 `88857a5` 之后）。下面的检查跑在该提交上，除了文末注明的证据提交。工作目录是仓库根，除非另注。Node 放在 PATH 前面的是 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 是 v22.23.4，`corepack pnpm --version` 是 10.34.9。worker 用 `workers/parser` 里的 uv，Python 3.11。未改日志。`test:core` 不适用（`package.json` 没有这个脚本）。没有跑全量 `pnpm test`，没有跑全量 pytest。没有改 `.github/`。Windows 的 SIGBREAK 没有在这台 Linux 上跑。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check`（四个改过的 Python 文件） | 0 | 4 files already formatted。工作目录 `workers/parser/` |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check`（同上四个文件） | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright`（同上四个文件） | 0 | 0 errors, 0 warnings, 0 informations。提示 pyright 1.1.414 可用，未升级 |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest tests/api/test_server.py tests/api/test_entry_signals.py tests/api/test_launch_token.py --tb=line -q` | 0 | 15 passed in 1.78s。含真实入口的接管前停止、窗口期、`{"event": "exited"}`、缺令牌仍非 0、SIGTERM |
| 见下方循环 | 0 | pass=20，fail=0。每次 3 passed。工作目录 `workers/parser/` |
| `corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts` | 0 | 14 passed。含两条 amendment 之后章节仍对准 `f8d5d01` |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 见下方。日志 `/opt/cursor/artifacts/pnpm-check-59.log` |

循环（`07b9eb2`，工作目录 `workers/parser/`）：

```bash
pass=0
fail=0
for i in $(seq 1 20); do
  if uv run pytest \
    tests/api/test_server.py::test_sigint_ends_the_process_outside_the_uvicorn_hold \
    tests/api/test_server.py::test_hold_window_exits_zero_and_marks_exited \
    tests/api/test_entry_signals.py::test_real_entry_sigterm_exits_zero_before_the_token_is_read \
    --tb=line -q
  then
    pass=$((pass+1))
  else
    fail=$((fail+1))
  fi
done
echo "pass=$pass fail=$fail"
```

结束行是 `pass=20 fail=0`。

`pnpm check` 在 `07b9eb2` 的结果：Prettier 通过。eslint 与两次 tsc 无报错。`check-file-size: 209 source files within hard limits`。dependency-cruiser：`no dependency violations found (104 modules, 186 dependencies cruised)`。`check-core-tests` 通过。npm / pip 许可证通过。模型清单为空。`check-one-slice: 0 feature slice(s)`。`check-commits` 通过。`check-hotspots` 通过。`check-pr-size: 444 non-generated lines`。codegen `0 generators`。随后的 `git diff --exit-code` 通过（该步没有输出）。

在 `corepack pnpm install --frozen-lockfile` 之前，另一次 `pnpm check` 退出码 1。失败点是未改过的 `packages/features/jobs/test/core/job-id.test.ts` 的 eslint（类型没解析）。安装后单独跑该文件的 eslint，退出码 0。上表那次 check 是安装之后的。没有重跑失败项来换绿灯，也没有改这个测试。

rebase 到 `88857a5` 时 `tools/compare-spec-bytes/compare.test.ts` 自动合上。合上之后又跑了上面的 vitest 与 pytest，都是退出码 0。

写入本文件、changelog 与执行计划的「实际」列之后，又跑了一次 `corepack pnpm exec vitest run tools/compare-spec-bytes/compare.test.ts`，退出码 0，14 passed。这次还覆盖新的 Markdown 链接。

## 审查修订（Windows ReadFile）

`worker-health-windows` run 41782174824 / job 126416156028 在 `8be3dea` 上失败：`test_sigint_ends_the_process_outside_the_uvicorn_hold` 的 `proc.wait(timeout=15)` 超时。修订在本提交的工作树上测过，还没推送时的记录如下。工作目录是 `workers/parser/`。没有改 `.github/`、`api/auth.py`、`app.py`。没有重跑 `pnpm check`（这次只动 worker 与执行计划、本证据）。Windows 的 SIGBREAK 仍不在这台 Linux 上跑。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check`（七个改过的 Python 文件） | 0 | 7 files already formatted |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check`（同上） | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright` | 0 | 0 errors, 0 warnings, 0 informations。提示 1.1.414 可用，未升级 |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest tests/api/test_server.py tests/api/test_entry_signals.py tests/api/test_stop_signals.py tests/api/test_launch_token.py` | 0 | 17 passed in 1.85s |
| 见下方循环 | 0 | pass=10，fail=0 |

循环：

```bash
pass=0
fail=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if uv run pytest -q \
    tests/api/test_server.py::test_sigint_ends_the_process_outside_the_uvicorn_hold \
    tests/api/test_server.py::test_hold_window_exits_zero_and_marks_exited \
    tests/api/test_server.py::test_exits_nonzero_when_stdin_has_no_token \
    tests/api/test_entry_signals.py::test_real_entry_sigterm_exits_zero_before_the_token_is_read \
    >/tmp/oi-repeat-$i.log 2>&1
  then
    pass=$((pass+1))
  else
    fail=$((fail+1))
  fi
done
echo "pass=$pass fail=$fail"
```

结束行是 `pass=10 fail=0`。
