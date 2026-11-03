# PR #107 命令

日期：2026-11-03。工作目录是 `workers/parser/`，除非另注。Python 是 `workers/parser/.python-version` 的 3.11.18，`uv run`。未改日志。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。没有跑全量 pytest，也没有跑 `pnpm run check`。

代码提交是 `c9d71935b0aad2d7c51ecc413398a9f69f81857b`。下面的命令跑在该提交的工作树上（提交前内容与该提交一致）。本文件提交之后只改 `docs/evidence/107/`。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check tests/api/test_server.py` | 0 | 1 file already formatted |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check tests/api/test_server.py` | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright tests/api/test_server.py` | 0 | 0 errors, 0 warnings, 0 informations。提示 pyright 1.1.414 可用，未升级 |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest tests/api/test_server.py --tb=short -q` | 0 | 3 passed in 1.20s |
| 见下方循环 | 0 | pass=50，fail=0。每次 `1 passed, 2 deselected`。用时约 66 秒 |

循环（工作目录 `workers/parser/`）：

```bash
pass=0
fail=0
for i in $(seq 1 50); do
  if uv run pytest tests/api/test_server.py -k test_sigint_ends_the_process_outside_the_uvicorn_hold --tb=line -q; then
    pass=$((pass+1))
  else
    fail=$((fail+1))
  fi
done
echo "pass=$pass fail=$fail"
```

当时标准输出追加到本机日志。结束行是 `pass=50 fail=0`。

计数：目标用例 `test_sigint_ends_the_process_outside_the_uvicorn_hold` 在 Linux 上 50 次，失败 0 次。
