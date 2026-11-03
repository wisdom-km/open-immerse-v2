# PR #88 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。

定向检查跑在实现与规格提交 `bf16effb3174311857d0ff9b944346893e89fd7c`。基线 `origin/main` 为 `ac9018078a5944a52ea08f0f1b3fc6909ffcba31`。本机 `main` 仍停在 `222ac93`，所以 `GATE_BASE=origin/main`，与 CI 相同。没有界面改动，没有截图。

全量 `corepack pnpm test` 按审查指示没有跑。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/platform-node/test/value-guard.test.ts packages/platform-node/test/value-guard-secrets.test.ts apps/desktop/test/run-when-ready.test.ts --reporter=verbose` | 0 | 3 个文件、27 通过。Type Errors: no errors |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（170 个源文件）、dependency-cruiser（88 modules，158 dependencies，无违例）、G18（0 个功能切片）、Conventional Commits、热点（具名热点 diff 在 30 行内）、PR 体量（359 行非生成 diff）、codegen、G7 |

九类假 key 仍在 `AC-101 replaces provider tokens and long hex when any string field carries them` 里，该用例通过。`api-key-missing`、既有 UUID、`crypto.randomUUID()`、时间戳这几条保留用例也通过。

本文件与执行计划的实际列在随后的文档提交里。那次提交不再改测试所覆盖的代码。
