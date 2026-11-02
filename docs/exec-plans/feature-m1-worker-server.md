# 执行计划

超过 300 行，所以有这份计划。任务说明要求本轮把本机 worker 做成可运行的 HTTP 服务并开 Draft。第一笔提交只有本文件。实现在其后的提交。PR 保持 Draft，等 Forge 审查。不离开 Draft，不合入。

## 现状理解

- 已有行为：`oi_worker.api.health.exchange_health` 在协议主版本受支持时返回 200 和 `protocol` / `workerVersion` / `mode`，主版本不支持时返回 426 和 `{"supported":["1.0"]}`。缺头或坏头抛出 `ValueError("protocol.version")`。没有套接字，没有 `python -m oi_worker`。
- 相关的节：ARCHITECTURE §10.1、§10.2、§10.3、§10.4；PRD AC-66 ②、AC-80 ⑤、AC-09；RULES §1.2、§1.5、N-09。
- 还没做的部分：FastAPI 适配、只绑定 `127.0.0.1` 的入口、缺头或坏头的 HTTP 状态、Windows 健康检查作业。规格没有写缺头或坏头的状态码。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 交换函数保持不动。`api/` 里用生成的协议模型做薄适配，不手写协议模型 | `health.py` 未改语义。路由在 `health_route.py`，装配在 `app.py` | `tests/api/test_health.py` 仍通过 |
| 2 | `python -m oi_worker` 只绑定 `127.0.0.1`。端口来自 `--port`，否则 `OI_WORKER_PORT`，否则 `0`。stdout 一行 `{"port": n}`。停止时走 uvicorn 的信号处理 | `__main__.py` 只做装配。`loopback.py` 绑定，`server.py` 调用 uvicorn | `tests/api/test_server.py`、`tests/api/test_loopback.py` |
| 3 | 缺头或坏头映射为 400，响应体 `{"error":"protocol.version"}`。写入 ARCH §10.4，标为 Forge 提议，待业主确认 | 已映射，规格写明待确认 | `tests/api/test_app.py`；ARCHITECTURE §10.4 |
| 4 | 测试覆盖 HTTP 200 / 426 / 400、未知字段、AC-09 响应体扫描，以及进程启动后的健康检查 | pytest 90 passed，含上述用例 | `docs/evidence/58/commands.md` |
| 5 | Windows CI：启动 worker，请求健康检查，断言 200 且响应体没有路径或 key；并跑已有的 `fixtures/protocol/` 两侧测试 | job 已写入 `.github/workflows/ci.yml`。本环境不是 Windows，没有在这里跑这个 job | 同上 |
| 6 | 依赖只经 `pyproject.toml` 与 `uv.lock`。许可证门禁通过。不改 `.cursor/environment.json`、`.cursor/install.sh`、DESIGN | pip 许可证检查退出码 0。这三处无 diff | `docs/evidence/58/commands.md` |

## 证据链接

- `docs/evidence/58/`：全量命令在 `c475c88cb79c1d00fd2b4b3adc66fcc033aaa015`
