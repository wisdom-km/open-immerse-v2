# PR #114 命令

日期：2026-11-04。工作目录是仓库根。基线是 `origin/main` 的 `25762f11142b4f1eef9cf7f6ef08ad178679894c`。未改日志。

这一笔只有执行计划。检查器还没写，所以没有跑 `corepack pnpm test`、`corepack pnpm run check` 或 `node tools/check-docs/check.mjs`。`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

发现数来自计划里那套规则，在基线上统计，脚本不在仓库里。

## 命令

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `git rev-parse HEAD`（统计时仍在 `main`） | 0 | `25762f11142b4f1eef9cf7f6ef08ad178679894c` |
| 按 `docs/exec-plans/feature-m1-check-docs.md`「检查什么」统计链接、锚点、状态行、逐字 | 0 | 见下表 |

## 基线发现数

| 类 | 数 |
| --- | --- |
| 扫描的 Markdown | 76 |
| 仓库内链接对得上 | 272 |
| 外链跳过（未访问网络） | 168 |
| 缺文件 | 0 |
| 缺锚点 | 0 |
| `index-table-missing` | 1 |
| `status-line-missing` | 18 |
| 逐字不一致 | 0 |
| 合计 | 19 |

18 个没有状态行的路径写在执行计划里。`docs/evidence/**` 不在状态行范围内。
