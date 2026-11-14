# PR #211 证据

本笔是 E1b。Refs #174、#202。8 GB 读数是 Windows 任务管理器里渲染进程的专用工作集，测法同 `docs/evidence/210/commands.md`。本环境不跑。不含缩放、菜单、Ready、合入、发版。

## 本环境跑过的命令（Node 22.23.4，仓库根）

- 全量 `corepack pnpm exec vitest run`：退出码 0。189 个文件，842 通过，3 跳过（`leak.test.ts` 的 G9，本地没有 `GITLEAKS_BIN`）。`GATE_BASE=origin/main corepack pnpm run check` 的退出码在这条提交之后补上。
