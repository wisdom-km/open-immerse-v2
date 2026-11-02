# PR #63 命令

日期：2026-11-02。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v20.19.2，PATH 前置 `/home/ubuntu/.nvm/versions/node/v20.19.2/bin`。Python 3.11.18，uv 0.13.6。没有截图。大文件：无。未改日志。

基线 `GATE_BASE=origin/main`（`ea42fac`）。

## `5293fab62e5d83917923d3b5fae6ae299cdff9d3`

全量 `pnpm check` 跑在这一笔。其后的证据文件不改产品代码，也不重跑 worker 进程测试。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（116 个源文件）、dependency-cruiser、core 测试位置、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（33 行非生成 diff）、codegen、G7。其后工作树干净 |
| `node ../../tools/gate-remediation/run.mjs --id G8 -- uv run pytest tests/api/test_server.py --tb=short -q`（`workers/parser/`） | 0 | 3 passed in 1.38s。Linux。stdin 令牌、`{"port": n}`、Bearer + `OI-Protocol` 的 `GET /v1/health` 为 200、`{"event":"exited"}`、退出码 0。macOS / Windows runner 不在本环境 |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。

## `373bf53648696d2ec73a42e418d6035dbdc58790`

这一笔只加本文件和规格变更记录里的 PR 链接。`pnpm check` 在这一笔的干净树上再跑一次。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 53 行非生成 diff。codegen 之后工作树干净 |

macOS 与 Windows 的 job 结果记在 PR 描述，以 GitHub Actions 为准。
