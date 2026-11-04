# 命令记录

PR #126。分支 `feature/m1-issue35-real-tree`。基线已 rebase 到 `origin/main@dd0630bd19f5aa1e26c068ab846e72f309edb7b2`。

实现 tip：`70d7410`。下面的 check 与 `pnpm test` 只在这个 tip 上跑了一次。本文件是之后的文档提交，没有再跑第二遍套件。

## CI 上一次失败

推送 `e2f4cff` 之后，node job（run 41771091507）失败，4 条：

| 失败 | 原因 |
| --- | --- |
| `tools/check-one-slice/real-tree.test.ts` | `git commit` 没有作者身份，`Author identity unknown`，退出码 128 |
| `tools/gate-remediation/g3.test.ts` | 并行的 `tools/typecheck.mjs` 退出码 2。探针当时写在真实切片目录，并改过 `jobs/src/pure.ts` |
| `tools/compare-spec-bytes/compare.test.ts` 两条 | main 上 #125 的 CI（run 41769938441）已经是这两条失败。本 PR 不改 `tools/compare-spec-bytes/**` |

## 这次怎么改

探针只写临时 worktree。`git worktree remove --force <path>` 用创建时的路径，对不上再用 realpath。临时提交带 `-c user.name=oi-gate`、`-c user.email=oi-gate@example.com`、`-c commit.gpgsign=false`。不改全局 config。

`jobs` 改为 `import { parseJobId, type JobId } from "@oi/contracts"`。五个切片在 `pnpm-workspace.yaml` 的 `packages/features/*` 里。只有 `jobs` 声明 `"@oi/contracts": "workspace:*"`。没有加「禁止深层相对导入」的规则。

## 作者身份

临时目录里 `GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_SYSTEM=/dev/null`：

| 命令 | 退出码 |
| --- | --- |
| 只有 `-c commit.gpgsign=false` 的 `git commit --allow-empty` | 128，`Author identity unknown` |
| 再加上 `-c user.name=oi-gate` 与 `-c user.email=oi-gate@example.com` | 0 |

## 针对性测试

`70d7410` 上 `vitest run` 这 7 个文件：11 passed。含四条巡航、`pure.ts` 四条、G18、`g3.test.ts`、jobs core 两条。跑完 `git worktree list` 只剩本仓库。`git status` 干净。

## 全量（node job 里的 check 与 test）

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | format、lint、typecheck、typecheck:core、行数（208 个源文件）、dependency-cruiser（104 modules，186 dependencies，无违例）、许可证、G18（1 个功能切片）、Conventional Commits、热点、PR 体量（749 行非生成，历史里有 `G12:`）、codegen（0 generators）。其后 `git diff --exit-code` 通过 |
| `corepack pnpm test` | 1 | 249 passed，3 skipped，2 failed。94 个文件。失败的两条是 `compare.test.ts` 的 `matches origin/main when the chapter files are joined` 与 `writes the same prefix manifest that evidence keeps`。与 main 的 CI 相同。日志摘要没有列出 3 条 skip 的名字。本机没有 `GITLEAKS_BIN`。上一轮同样是 3 条 skip，来自 `leak.test.ts` 的 detect 用例 |

没有重跑失败项。`compare-spec-bytes` 不在本 PR 的修改范围里。本机没有跑 gitleaks，也没有跑 Python 门禁。Windows 上的路径匹配（正斜杠、8.3）没有在这台 Linux 机器上执行。

Node 是 v22.23.4。`corepack pnpm` 来自这支 Node。
