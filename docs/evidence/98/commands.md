# PR #98 命令

工作目录是仓库根。Node 是 `.nvmrc` 的 22.23.4，PATH 里 nvm 的 bin 在前。`GITLEAKS_BIN=/tmp/gitleaks`（8.30.1，sha256 与 `.github/workflows/ci.yml` 的安装步相同）。`GATE_BASE=origin/main`。全量套件在提交 `c5f8a04b3f3223d6341908375ab5c5e87e0fa19e` 上跑过。本文件是随后的记录，不改检查行为。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `corepack pnpm exec vitest run tools/gate-remediation/run.test.ts` | 0 | 1 个文件、3 通过、0 跳过。未知编号：子进程退出 0 时包装器退出 2，stdout 含 `ran`；子进程退出 7 时包装器退出 7；命令不存在时退出 1。三处 stderr 都有 `unknown gate id NOT-A-GATE`，没有 `at requireGate` |
| `GITLEAKS_BIN=/tmp/gitleaks corepack pnpm test` | 0 | Vitest 70 个文件、165 通过、0 失败、0 跳过。类型错误 0 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、tsc --noEmit、typecheck:core、行数（173 个源文件）、dependency-cruiser（90 modules，164 dependencies，无违例）、core 测试指令、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量、codegen 后 `git diff` 都通过。`check-pr-size` 打印 55 行非生成改动 |

没有跑 `pnpm test:core`：package.json 没有这个脚本。没有跑 `tsc -b`。没有改 CI，没有改分支保护。
