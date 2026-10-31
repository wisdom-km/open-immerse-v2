# PR #17 文档检查

日期：2026-10-31。本 PR 只改文档，不跑全量（没有跑 typecheck、`pnpm test`、ruff、pytest）。没有截图。大文件：无。未改日志。

检查跑在写入本文件与规格变更记录里的 #17 行之后。所在提交见本文件入库的那次提交。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| 相对链接检查（一次性 Python，不入库）：本 PR 改动的 Markdown 里，相对路径链接是否指向现存文件 | 0 | 97 条相对链接，0 条缺失。不含 `http` 链接。本文件没有相对链接，所以计数不含它 |
| 标题核对：阅读索引点到的节标题是否还在对应文件里 | 0 | 抽查 RULES §9、ARCHITECTURE §2.1 / §10.3 / §11 / §15、PRD §3.3–§3.5 / §6 / §6.3、DESIGN §3.7 / §4、design-principles §1、ci「当前是空跑」、AGENTS「按任务类型阅读」 |
| `git diff --check` | 0 | 无空白错误 |
| `git diff --name-only main...HEAD` 加上未入库的 `docs/evidence/17/checks.md`、`docs/spec-changelog.md` 改动，对照 N-10 / N-11 路径 | 0 | 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/install.sh`、`.cursor/environment.json`。本文件在 `docs/evidence/17/` |

`test:core`：不适用（脚本尚未提供）。没有执行。
