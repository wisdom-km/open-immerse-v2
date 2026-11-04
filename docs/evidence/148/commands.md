# PR #148 命令

日期：2026-11-04。工作目录是仓库根。Node v22.23.4（`.nvmrc`），PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。基线 `origin/main` `6988420cc9fb68f461d151c069ac4b5965570caf`。计划在 `00faf99`。含本文件的提交 `8532884` 上复查，两条命令退出码仍是 0，输出与下表相同。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `node tools/check-docs/check.mjs` | 0 | `check-docs: strict`。`links: 0`，`anchors: 0`，`status: 0`，`verbatim: 0`，`tree: 0`，`findings: 0` |
| `node tools/compare-spec-bytes/compare.mjs` | 0 | `PRD.md` 36 段、`ARCHITECTURE.md` 66 段、`RULES.md` 跨度与 `f8d5d01dc8af81b73689c7229c983192551fa6fe` 一致。`68 path prefixes` |

未跑 `pnpm test`、`pnpm run check`、worker pytest、e2e。`test:core` 不适用（脚本尚未提供）。没有 skip。
