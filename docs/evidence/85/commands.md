# PR #85 命令

日期：2026-11-03。工作目录：仓库根，worker 命令在 `workers/parser/`。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。Python 3.11.18，uv 0.13.6，pyright 1.1.407，ruff 0.17.3。

实现 tip 是 `ad7d218e803f2fb950c030859aeed25b5a8e168a`。基线 `GATE_BASE=origin/main`（`222ac93afcff25cbe5f3608c492605516560b3d4`）。没有 rebase，没有 force push，没有 amend 已推送的 `9a1e4c5`。

真实网络调用 0 次。测试用 `httpx.MockTransport`。未注入 transport 时客户端拒绝联网。未打桩的请求抛出 `AssertionError`，不落到失败结果里。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm test` | 0 | Vitest 70 个文件、153 通过、2 跳过、0 失败。类型错误 0。跳过的是未设 `GITLEAKS_BIN` 的本地密钥夹具 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 在 `ad7d218`。lint、typecheck、typecheck:core、行数（168 个源文件）、`check:deps`（84 modules，153 dependencies，无违例）、core 测试位置、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（1578 行非生成 diff，`ad7d218` 的说明里有 `G12:`）、codegen（1 个生成器）、G7。其后工作树干净。`check-license: pip licenses accepted` |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 在文档提交 `22a88b9` 再跑一次。同一组门禁。`check-pr-size` 为 1616 行非生成 diff。工作树干净 |
| `node ../../tools/gate-remediation/run.mjs --id G1 -- uv run ruff format --check .` | 0 | 工作目录 `workers/parser/` |
| `node ../../tools/gate-remediation/run.mjs --id G2 -- uv run ruff check .` | 0 | All checks passed |
| `node ../../tools/gate-remediation/run.mjs --id G3-pyright -- uv run pyright` | 0 | 0 errors, 0 warnings, 0 informations |
| `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports` | 0 | 7 kept，0 broken。含 `only select_backend imports quality backends` 与 `python core forbids io` |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest` | 0 | 153 passed，1 warning（starlette `anyio.abc.BlockingPortal` 弃用）。其中 `tests/quality/` 50 个 |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## quality 用例

```text
tests/quality/test_batching.py ......
tests/quality/test_http_errors.py ..............
tests/quality/test_jev_http.py ...................
tests/quality/test_local_engine.py .
tests/quality/test_request_body.py .
tests/quality/test_response_body.py ......
tests/quality/test_select_backend.py ...
```

假 key 只有 `oitest_jevclient`。产品代码不读 `MODELBEST_API_KEY`。

## Forge nits（审查 `92fa9a0`）

修复提交 `d31124b2effa7a10aedd85482a3b509951976169`。空白凭据视为缺失；响应体解码失败记整批 `service_failed`；只有 `NetworkDisabledError` 与 `httpx.HTTPError` 映射成上游故障，其他 `RuntimeError` 继续抛出。`docs/backlog.md` 的 `score_best` 行改为 Issue #86。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest tests/quality -q` | 0 | 工作目录 `workers/parser/`。57 passed |
| `node ../../tools/gate-remediation/run.mjs --id G6 -- uv run lint-imports` | 0 | 7 kept，0 broken |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 在 `d31124b`。`check-pr-size` 1667 行非生成 diff。工作树干净 |
