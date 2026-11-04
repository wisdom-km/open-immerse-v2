# PR #150 命令

日期：2026-11-04。工作目录是仓库根。Node v22.23.4（`.nvmrc`），PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。基线 `origin/main` `9949f5c8e90ed47d6ab517a44c8174aa85613297`。计划在 `75d82cc`。正文（approvals、backlog、PR 模板）在 `9abeb5d`。本文件与计划实际列加入后，同一工作树再跑，输出与下表相同。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node tools/check-docs/check.mjs` | 0 | `check-docs: strict`。`links: 0`，`anchors: 0`，`status: 0`，`verbatim: 0`，`tree: 0`，`findings: 0` |
| `node tools/compare-spec-bytes/compare.mjs` | 0 | `PRD.md` 36 段、`ARCHITECTURE.md` 66 段、`RULES.md` 跨度与 `f8d5d01dc8af81b73689c7229c983192551fa6fe` 一致。`68 path prefixes` |

未跑 `pnpm test`、`pnpm run check`、worker pytest、e2e。`test:core` 不适用（脚本尚未提供）。没有 skip。
