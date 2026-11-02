# PR #74 命令

日期：2026-11-02。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。

门禁跑在实现提交 `bae7c7b7f766b049c15a283ea78c062c3d9182a9`。本文件是后一笔，只补记录。

本 Cloud Agent 是 Linux，不跑 Playwright Electron：不加 xvfb，不改 `.cursor/install.sh`。窗口截图以 CI job `desktop-e2e-windows` 为准。

## 命令

基线 `GATE_BASE=origin/main`（`bd6c22020d4a8103868b72d231d728af516caa99`）。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm exec vitest run packages/contracts/test/diag-events.test.ts packages/kernel/test/logger.test.ts packages/kernel/test/clock.test.ts` | 0 | 3 个文件、10 通过。这是写契约时的过滤运行，不是全量 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 含 lint、typecheck、typecheck:core、行数（140 个源文件）、dependency-cruiser（67 modules，无违例）、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（610 行非生成 diff，`bae7c7b` 的说明里有 `G12:`）、codegen、G7 |
| `corepack pnpm test` | 0 | Vitest 65 个文件、114 通过、2 跳过。跳过的是 `tools/check-secrets/leak.test.ts`：未设 `GITLEAKS_BIN`。G9 看 CI 的 `node` job |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

AC-101 ① 由 `readDiagEvent` 的单测覆盖：`pipeline.run` 只留下六个流水线字段加上 `ts`、`level`、`event`、`feature`，成功时 `error_class` 为 `""`，夹具里的正文、译文、提示词、`oitest_` 假密钥、绝对路径、`Authorization` 和 `access_token` 在回拷结果里出现 0 次。② 的文件数、7 天和 50 MB 删除、清空，③ 离开本机，④ 云端追踪依赖，⑤ 落盘目录，都要等 file-logger 的实现 PR。本 PR 只锁住 `DEBUG_MODE_DEFAULT = false`、7 天与 50 MB 的常量，以及 `diagnostics` / `debug` 这两个目录名。

## 合成日志行

`pipeline-run.json` 是一条成功的 `pipeline.run`。`error_class` 为空字符串。没有正文、译文、提示词、密钥或绝对路径。

## Windows 截图

job：`desktop-e2e-windows`，`runs-on: windows-latest`。提交 `bae7c7b7f766b049c15a283ea78c062c3d9182a9` 的 `push` 与 `pull_request` 都是 pass。

PR 那组：run [41474597703](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41474597703)。截图 artifact：[desktop-e2e-windows-screenshots](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41474597703/artifacts/13157316058)。

同一提交的 `push` 那组：run [41474586779](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41474586779)，artifact [13157680366](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41474586779/artifacts/13157680366)。

两组 artifact 里的 `test-finished-1.png` 都是 784×535 的 PNG，是冒烟结束后的页面。当前 renderer 只有标题、没有正文，所以页面是空白。图不入库（N-12）。

`actions/upload-artifact` 用的是 tag `v7.0.2`。2026-11-02 核对，该 tag 仍指向 `cf430e030ddbb5b0abf93d22962f4752f3646cd9`。

## 对照 N-10 / N-11

diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。没有改 worker。没有建 `packages/platform-node`。
