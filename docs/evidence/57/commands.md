# PR #57 文档检查

日期：2026-11-02。本 PR 只改文档。没有截图。大文件：无。未改日志。

规格提交 SHA：`018d161c594f88e78e1acf9d2d9f570f516fb27b`

Node：`v20.19.2`（PATH 前置 `/home/ubuntu/.nvm/versions/node/v20.19.2/bin`）。

本地 `main` 停在 `1129da9`。检查基线用 `GATE_BASE=origin/main`（`0058e9b`），与 CI 一致。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check`（`018d161`） | 0 | lint、typecheck、typecheck:core、size、deps、core-tests、licenses、one-slice、commits、hotspots、pr-size、codegen、G7。`check-pr-size`：42 行非生成 diff |
| `GATE_BASE=origin/main corepack pnpm run check`（`8e37a1b`） | 0 | 同上。`check-pr-size`：59 行非生成 diff |

`test:core`：不适用（脚本尚未提供）。没有执行。

对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。
