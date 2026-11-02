# PR #65 命令

日期：2026-11-02。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。没有截图。大文件：无。未改日志。

实现提交 `cca0dbaa23ed1796cdd4eb4c1e985b951d0de7f2`。下表在这一笔的工作树上执行。本文件与执行计划的实际列是后一笔，只补记录。

本 Cloud Agent 是 Linux，不能跑 Playwright Electron 冒烟：不加 xvfb，不改 `.cursor/install.sh`。结果以 CI job `desktop-e2e-windows`（windows-latest）为准。

## 命令

基线 `GATE_BASE=origin/main`（`99f2f6b79c2420d980c2532571a52bfcc735d758`）。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `corepack pnpm install`（环境变量 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`） | 0 | 锁文件更新后入库。没有 peer 失败。根 `@types/node` 仍是 22.20.5。Electron 45.2.1 自带 `@types/node` ^24，留在它自己的依赖里。首次 `require('electron')` 把二进制下到 `node_modules`（约 224 MB），不入库 |
| `corepack pnpm exec tsc --noEmit --pretty false --project tsconfig.json` | 0 | 根 `tsc`。`lib` 仍只有 ES2023，`types` 仍为空。没有改 `tsconfig.core.json` |
| 在 `apps/desktop/`：`corepack pnpm exec tsc -p tsconfig.main.json` | 0 | main 编成 ESM |
| 在 `apps/desktop/`：`corepack pnpm exec tsc -p tsconfig.preload.json && node scripts/use-cjs-preload.mjs` | 0 | preload 编成 CommonJS，再改名为 `dist/preload/index.cjs` |
| `corepack pnpm run lint` | 0 | `eslint . --max-warnings 0` |
| `corepack pnpm test` | 0 | Vitest 57 个文件、91 通过、2 跳过。跳过的是 `tools/check-secrets/leak.test.ts`：当时未设 `GITLEAKS_BIN`。本机没有 gitleaks，G9 看 CI 的 `node` job |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 含 lint、typecheck、typecheck:core、行数（134 个源文件）、dependency-cruiser（61 modules，无违例）、core 测试位置、npm/pip/模型许可证、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（836 行非生成 diff，提交说明里有 `G12:`）、codegen、G7。其后工作树干净 |
| Playwright `_electron` 冒烟 | 未跑 | 见文首那句。不在 Linux 上启动 Electron |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

`pnpm --filter desktop start` 会启动 Electron，本环境没有跑。

对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。core 目录（`packages/kernel`、`packages/contracts`、`packages/features`）改动 0 行。没有改 worker。没有打包、签名或设置 Fuses。

## CSP

`apps/desktop/src/main/security/csp.ts` 的常量，与 ARCHITECTURE §9 草案逐字相同：

```
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

不含 `unsafe-eval`，不含 `unsafe-inline`。窗口响应头是否逐字相同，由 `desktop-e2e-windows` 读出。本环境没有读到运行中的响应头。

## Windows e2e

job：`desktop-e2e-windows`，`runs-on: windows-latest`。提交 `02e18e2fb15d5d8c8d0432de8b9fa73dbb30f9ec` 的 `push` 与 `pull_request` 两组都是 pass。下面是 PR 那组（run `41464136233`，job `125340455936`，49s）里 Playwright 步骤的结果：

```
Running 1 test using 1 worker
[1/1] e2e\smoke.spec.ts:11:1 › opens one oi-app window under the security baseline
Downloading Electron binary...
  1 passed (8.1s)
```

同一提交的 `push` 那组（run `41464125596`，job `125340421360`）也是 pass。冒烟断言因此在 Windows 上读到了响应头里的 CSP，并确认标题非空、`location.protocol` 为 `oi-app:`、`file://` 为 0、外链 / `window.open` / `<webview>` / 通知权限被拒绝、`webPreferences` 三项为真且 `webSecurity` 不是 false。

## Electron 安全清单

对照 Electron 45 的 Security 教程（2026-11-02 读到的 20 条）。代码在 `cca0dba`。

| 条目 | 本 PR |
| --- | --- |
| 只加载安全内容 | `oi-app://app/` 只读 `apps/desktop/src/renderer` 里的 `.html`。不加载远程页面 |
| 不对远程内容开 Node | 没有远程内容。`nodeIntegration` 为 false |
| Context Isolation | `contextIsolation: true` |
| 沙箱 | `sandbox: true`。因此 preload 编成 CommonJS：沙箱 preload 不能使用 ESM `import` |
| 权限请求 | `setPermissionRequestHandler` 与 `setPermissionCheckHandler` 都拒绝 |
| 不关 `webSecurity` | 源码不写 `webSecurity` |
| CSP | 上节常量写在 `oi-app://` 响应头 |
| 不启用 `allowRunningInsecureContent` | 未设置 |
| 不启用实验特性 | 未设置 |
| 不用 `enableBlinkFeatures` | 未设置 |
| WebView 不用 `allowpopups` | 不启用 `<webview>`（不写 `webviewTag`） |
| 创建前核对 WebView | `will-attach-webview` 一律 `preventDefault` |
| 限制导航 | `will-navigate` 一律 `preventDefault`。`loadURL` 不走这个事件 |
| 限制新窗口 | `setWindowOpenHandler` 返回 `{ action: 'deny' }` |
| 不把不可信内容交给 `shell.openExternal` | 本 PR 不调用它 |
| 使用当前受支持的 Electron | `electron@45.2.1`（MIT，`engines.node` 为 `>= 22.12.0`）。仓库 Node 22.23.4 落在这个范围内。该版本自带的运行时是 Node 24.22.1，不改 `.nvmrc` |
| 校验 IPC 发送方 | 无通道，不在本 PR |
| 不用 `file://`、改用自定义协议 | 页面地址是 `oi-app://app/index.html` |
| Fuses | M8，见延期 |
| 不向不可信网页暴露 Electron API | preload 只 `contextBridge.exposeInMainWorld('oi', {})` |

打包时要设、本 PR 不设的 Fuses（#68，AC-67 ③）：`RunAsNode` 关、`EnableNodeOptionsEnvironmentVariable` 关、`EnableNodeCliInspectArguments` 关、`EnableCookieEncryption` 开、`OnlyLoadAppFromAsar` 开、`EnableEmbeddedAsarIntegrityValidation` 开（各平台是否支持仍未核实）、`GrantFileProtocolExtraPrivileges` 关。

## 协议特权

`registerSchemesAsPrivileged` 只给 `oi-app` 设置 `standard: true` 与 `secure: true`。没有 `bypassCSP`、`supportFetchAPI`、`corsEnabled`、`allowServiceWorkers`、`stream`。若 Windows 上页面因此打不开，不在这个 PR 里放宽这些标志。
