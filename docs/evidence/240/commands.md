# PR #240 命令记录

测试提交是 `817f41fea65faa92db553c43ca4c7d928930f201`，tree `58c556866d4c27f0b427b01d27852cbc21c558a1`。基线 `75c17c773ef70fef64c63c078f1b4e97aa2b537f`（PR #237 tip）。本文件是其后的证据提交，没有再跑这些命令。

Node `/home/ubuntu/.nvm/versions/node/v22.23.4/bin/node`，版本 v22.23.4。启动前这三笔提交已在，工作树干净。没有跑 `pnpm run check`，没有手动重跑整库 CI，没有启动 Electron，没有重编 Windows 桌面。

## 817f41f 上的命令

| 命令 | 退出码 | stdout SHA | stderr SHA |
| --- | --- | --- | --- |
| `corepack pnpm exec vitest run apps/desktop/test/view-menu-wiring.test.ts apps/desktop/test/shell.test.ts packages/features/reader/test/ui/view-mode-panes.test.tsx` | 0 | `a746766f6d72a9dd157a4a7ec065bc8ed2e0ea04af92050dba1d1427d9b88f88` | `e1d2faed36ebf5b6c9031a45d83738183949a4436713a9f9e919952375018c53` |
| `corepack pnpm exec eslint --max-warnings 0` 六个改动过的 ts/tsx | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `corepack pnpm exec tsc --noEmit --pretty false --project tsconfig.json` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `corepack pnpm exec tsc --noEmit --pretty false --project tsconfig.ui.json` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

空文件 SHA 是 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。vitest 打印 3 个文件、18 个测试通过。stderr 是 Vitest 的实验类型检查提示和 Node 的 SQLite 实验警告。

同一提交上，`GATE_BASE=75c17c773ef70fef64c63c078f1b4e97aa2b537f`：

| 命令 | 退出码 | 打印 |
| --- | --- | --- |
| `node tools/check-one-slice/check.mjs` | 0 | 1 feature slice |
| `node tools/check-commits/check.mjs` | 0 | subjects match Conventional Commits |
| `node tools/check-hotspots/check.mjs` | 0 | line count only |
| `node tools/check-pr-size/check.mjs` | 0 | 222 non-generated lines |

`GATE_BASE=origin/main`（`6f23e38da65d10f0a54d144c7cdff06e769f355d`）的 `check-pr-size` 打印 1569 行，并提示原上限 600。这包含 PR #237。脚本退出码 0。

`node tools/check-file-size/check.mjs` 退出码 0。它仍打印既有的 `view-menu-gate.ts` 603 行，本次 diff 不含该文件。

真机菜单、加速键和真实 Electron GUI 未验。
