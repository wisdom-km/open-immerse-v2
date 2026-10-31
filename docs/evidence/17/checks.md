# PR #17 文档检查

日期：2026-10-31。本 PR 只改文档，不跑全量（没有跑 typecheck、`pnpm test`、ruff、pytest）。没有截图。大文件：无。未改日志。

tip SHA：`5378e6721662705b7dd5231ac1d036d488b53eaf`

N-11 等修改的提交：`2d9dd26fb5b9c761c94349d576f659b8c2fb00cb`

`5378e67` 是首次文档检查时的分支 tip，本文件把这个 SHA 写死。`2d9dd26` 写入 N-11、把「契约先行」改到 RULES §3 第 3 条、让纯文档的任务类型可以写「不适用」，并第一次把 `5378e67` 写入本文件。下表是 `5378e67` 的结果。`2d9dd26` 提交前的工作区复跑，退出码仍是 0。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| 相对链接检查（一次性 Python，不入库）：本 PR 改动的 Markdown 里，相对路径链接是否指向现存文件 | 0 | 97 条相对链接，0 条缺失。不含 `http` 链接。`5378e6721662705b7dd5231ac1d036d488b53eaf` 与复跑都是这个数 |
| 标题核对：阅读索引点到的节标题是否还在对应文件里 | 0 | 抽查 RULES §9、ARCHITECTURE §2.1 / §10.3 / §11 / §15、PRD §3.3–§3.5 / §6 / §6.3、DESIGN §3.7 / §4、design-principles §1、ci「当前是空跑」、AGENTS「按任务类型阅读」。复跑另确认 N-11 写明两份环境文件、AGENTS 为 §3 第 3 条（契约先行）、模板允许纯文档写「不适用」 |
| `git diff --check` | 0 | 无空白错误。`5378e6721662705b7dd5231ac1d036d488b53eaf` 与复跑都是 0 |
| 对照 N-10 / N-11 路径 | 0 | diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/install.sh`、`.cursor/environment.json` |

`test:core`：不适用（脚本尚未提供）。没有执行。
