# 执行计划

超过 300 行，所以有这份计划。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名。第一笔提交只有本文件。Forge 审查通过之前不写实现。PR 保持 Draft，不离开 Draft，不合入。

## 现状理解

- 已有行为：没有 `apps/desktop`。`pnpm-workspace.yaml` 只有 `packages/contracts` 与 `packages/kernel`。Node 是 22.23.4（`.nvmrc`，`package.json` 的 `engines.node` 为 `>=22.23.4`，main@99f2f6b，PR #64）。pnpm 仍是 10.34.9。G5 的 `electron-only-in-desktop` 与 `renderer-isolation` 已在 `tools/check-deps/build-rules.mjs`。`tools/check-deps/boundaries.test.ts` 还没有这两条的拒绝样例。`tools/codegen/run.mjs` 只生成 worker 协议，不生成 preload。CI 有 Linux 的 `node` / `python-worker`，以及 Windows 与 macOS 的 worker 健康检查。没有 Electron 冒烟 job。Vitest 不收集 `apps/**`。
- 相关的节：PRD §8 M1、AC-67 ①、AC-21、AC-100；AC-35 只取「renderer 不出现 `file://`」这一条。AC-81 是 M3，本计划不实现 supervisor。ARCHITECTURE §1、§2、§3 目录树、§6、§9、§10.5（只读）、§13、§15.1、§15.2。DESIGN D1：原生菜单、原生窗口按钮。D10 标题栏合并不在本计划里。原则 P4：沿用系统控件。
- 还没做的部分：`oi-app://` 空白窗口、CSP、导航与权限拦截、空的 `window.oi`、Playwright 冒烟、只在 Windows 上的 CI job。

已定决定（Wisdom 2026-11-02，覆盖交接 §5）：

- D1：Playwright Electron 冒烟只在 `windows-latest`。不加 Linux job，不加 macOS job。
- D2：任何地方都不用 xvfb。不改 `.cursor/install.sh` 与 `.cursor/environment.json`。本 Cloud Agent 是 Linux，不跑这条 e2e。
- D3：Electron 锁 **45.2.1**。2026-11-02 用 `npm view electron@45 version` 核实，45 的最新稳定版是 45.2.1（发布 2026-10-31，https://releases.electronjs.org/release/v45.2.1 ）。npm `engines.node` 是 `>= 22.12.0`，许可证 MIT。仓库 Node 22.23.4 落在这个范围内。该版本自带的运行时是 Node 24.22.1，不改 `.nvmrc`。实现时把 `"electron": "45.2.1"` 写进 `apps/desktop/package.json`，不用 `^`。
- D4：`tsc` 编译 main 与 preload。renderer 是静态 HTML。不引入打包器。
- D5：preload 生成器另立 PR。本 PR 不手写 IPC 通道。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 批准并实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 延期登记。查重已完成，见文末。批准后、写外壳之前，为下面三条各开一条 Issue，并在 `docs/backlog.md` §4 各加一行链到该 Issue。不重复 #30、#34、#62 | 已开 #66、#67、#68，backlog §4 三行。提交 `21cd2f5`，在外壳代码之前 | `docs/backlog.md` |
| 2 | 工作区加入 `apps/desktop`。包名 `desktop`，这样命令是 `pnpm --filter desktop start`。许可证 Apache-2.0。依赖只加精确的 `electron@45.2.1` 与 `@playwright/test@1.64.1`（2026-11-02 核实：Apache-2.0，`engines.node` 为 `>=20`）。不升根上的 `@types/node`（现为 22.20.5）。pnpm 若因 Electron 的 peer 失败，停下报告 | 已加。`pnpm install` 退出码 0，没有 peer 失败。根 `@types/node` 仍是 22.20.5。Electron 自带的 `@types/node` ^24 留在它自己的依赖里 | `docs/evidence/65/commands.md` |
| 3 | `src/main/index.ts` 只做装配：等 `app` ready、注册协议、建窗口。硬上限 150 行，建议 100。不写业务分支。窗口用系统框架：不设 `frame: false`，不设 `titleBarStyle`，不设 `titleBarOverlay`，不自绘菜单（不调用 `Menu.setApplicationMenu`）。标题非空，用产品名，不画界面 | `index.ts` 37 行，只做装配。标题 `Open Immerse`。没有 `frame`、`titleBarStyle`、`titleBarOverlay`、`Menu.setApplicationMenu` | 同上 |
| 4 | 一个职责一个文件：`window.ts`（`webPreferences`）、`app-protocol.ts`（`oi-app://`）、`security/csp.ts`、`security/navigation.ts`、`security/permissions.ts`。不建 `utils.ts`。不建 `ipc-router.ts`、`slots.ts`、`worker-supervisor.ts`。函数 ≤80 行，参数 ≤4，圈复杂度 ≤15。不加 allowlist | 计划中的文件都在。另有 `static-file.ts`（路径判定，单测不 import Electron）和 `scheme-response.ts`（不在源码里写 DOM 的 `Response` 名字）。没有 utils、ipc-router、slots、worker-supervisor | 同上 |
| 5 | `webPreferences`：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。不写 `webSecurity`（保持默认开）。不启用 `<webview>`。选项放在不 `import` Electron 的模块里，Vitest 在 Linux 上断言这四项，不启动 Electron | `security/window-preferences.ts`。单测断言三项，并断言没有 `webSecurity` 与 `webviewTag` | 同上 |
| 6 | `oi-app://` 在 `ready` 之前 `registerSchemesAsPrivileged`，只给 `standard: true`、`secure: true`。不给 `bypassCSP`、`supportFetchAPI`、`corsEnabled`、`allowServiceWorkers`、`stream`。`protocol.handle` 只接受 GET 与 HEAD，只读应用内的静态 renderer 文件。真实路径必须留在该目录内。页面不经 `file://` 加载，不加载远程内容。打不开时停下报告，不放宽这些标志 | `registerAppScheme` 在 `app` ready 之前调用，特权只有 `standard` 与 `secure`。GET/HEAD，`.html`，realpath 必须留在 renderer 根内。Linux 上不启动 Electron，所以页面是否打开等 Windows job | 同上 |
| 7 | CSP 常量与 ARCHITECTURE §9 草案逐字一致：`default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`。由 main 加在 `oi-app://` 响应头上。不含 `unsafe-eval`，也不加 `unsafe-inline`。单测断言常量逐字相同 | `security/csp.ts` 与草案逐字相同。响应头使用这份常量。单测断言相同，且不含 `unsafe-eval`、`unsafe-inline` | 同上 |
| 8 | `will-navigate` 一律 `preventDefault`。`setWindowOpenHandler` 一律 `{ action: 'deny' }`。`will-attach-webview` 一律阻止。`setPermissionRequestHandler` 与 `setPermissionCheckHandler` 一律拒绝。判定函数不 `import` Electron，单测覆盖；接到 `webContents` / `session` 的那一层由 Windows e2e 覆盖 | 判定在 `navigation.ts` 与 `permissions.ts`。接线在 `window.ts` 与 `index.ts`。单测不启动 Electron | 同上 |
| 9 | `src/preload/index.ts` 只 `contextBridge.exposeInMainWorld('oi', {})`。不暴露 `ipcRenderer`、通道、`fs`、`shell`。不写生成器 | 源文件只有这一次 `contextBridge`。沙箱 preload 不能用 ESM，所以 `tsconfig.preload.json` 把它编成 CommonJS，再改名为 `dist/preload/index.cjs` | 同上 |
| 10 | `src/renderer/index.html` 是空白文档：无样式、无组件、无颜色、无字号、无布局。不建 `main.tsx`，不引入 React 或 ui-kit | 空白文档，只有 `<title>Open Immerse</title>` | 同上 |
| 11 | 桌面用自己的 `tsconfig.json` 把 main 与 preload 编到 `dist/`（`tsc`，`noEmit` 关闭的是这一份）。根 `tsconfig.json` 仍是 `noEmit`、`lib` 只有 ES2023、`types` 为空，并且 `skipLibCheck: true`。外壳源码不使用 DOM 全局对象，也不把 `DOM` 加进根 `lib`。e2e 里需要页面结果时用 `executeJavaScript` 的字符串，避免根 `tsc` 去检查 DOM。若根 `tsc --noEmit` 仍因 Electron 类型失败，停下报告，不改 `tsconfig.core.json` | 发射用 `tsconfig.main.json` 与 `tsconfig.preload.json`，避免和根 `tsconfig.json` 抢同一个文件。根 `tsc --noEmit` 退出码 0。没有改 `tsconfig.core.json`，没有把 DOM 加进根 `lib`。页面断言用 `page.evaluate` 的字符串 | 同上 |
| 12 | `apps/desktop/e2e/` 用 Playwright `_electron`。不下载 Playwright 的浏览器。断言：窗口打开且标题非空；响应头里的 CSP 与 `csp.ts` 逐字相同且不含 `unsafe-eval`；`location.protocol === 'oi-app:'`；`file://` 加载 0 次；把 `location.href` 设成外链、`window.open`、附加 `<webview>`、权限请求（通知或媒体）都被拒绝；`webPreferences` 三项为真且没有把 `webSecurity` 关掉。Vitest 不收集这个目录 | `e2e/smoke.spec.ts` 写了这些断言。Vitest 只收集 `apps/desktop/test/**/*.ts`。本环境不跑这条 e2e | 同上 |
| 13 | CI 只加一个 job：`desktop-e2e-windows`，`runs-on: windows-latest`。用 `.nvmrc` 的 Node，`corepack pnpm install --frozen-lockfile`，再跑这个 e2e。不放进 `worker-health` 矩阵。不加 `ubuntu-latest` 或 `macos-latest` 的 Electron job。脚本里不出现 xvfb，不 `apt-get`。不改 `.cursor/install.sh`。不把该 job 写成分支保护的必需检查（N-02） | `.github/workflows/ci.yml` 的 `desktop-e2e-windows`。安装时 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`。没有改分支保护 | 同上 |
| 14 | 在 `tools/check-deps/boundaries.test.ts` 加拒绝样例：`apps/desktop` 以外 `import 'electron'` 必须命中 `electron-only-in-desktop`；`apps/desktop/src/renderer/` `import 'node:fs'` 必须命中 `renderer-isolation`。不改规则本身（规则已经按 ARCHITECTURE §13 写着）。这是补上规格已要求的样例，不是放宽门禁 | 两条 `it` 已加。`build-rules.mjs` 未改 | 同上 |
| 15 | 安全清单。按 Electron 45 的 [Security](https://www.electronjs.org/docs/latest/tutorial/security)（2026-11-02 读到的 20 条）逐条对照，表放在证据里。清单条目：只加载安全内容；不对远程内容开 Node；Context Isolation；沙箱；权限请求；不关 `webSecurity`；CSP；不启用 `allowRunningInsecureContent`；不启用实验特性；不用 `enableBlinkFeatures`；WebView 不用 `allowpopups`；创建前核对 WebView（本 PR 直接禁止附加）；限制导航；限制新窗口；不把不可信内容交给 `shell.openExternal`（本 PR 不调用它）；使用当前受支持的 Electron；校验 IPC 发送方（本 PR 无通道，表里写「无通道，不在本 PR」）；不用 `file://`、改用自定义协议；Fuses（表里写「M8，见延期」）；不向不可信网页暴露 Electron API | 20 行对照写在证据里。Fuses 记为 M8 / #68，不在本 PR 设置 | 同上 |
| 16 | 门禁：`pnpm check`、`pnpm test`、许可证检查。Electron 是 MIT，Playwright 是 Apache-2.0，都在 `tools/check-license/whitelist.json`。传递依赖若被 G10 拒绝，停下报告，不加白名单。core 目录改动 0 行。不改 DESIGN、`docs/design-principles.md`、`docs/design/**`。不改 worker。不打包、不签名、不设 Fuses | `GATE_BASE=origin/main pnpm check` 与 `pnpm test` 退出码都是 0。G10 接受现有白名单，没有加条目。core 目录 0 行。没有改 DESIGN、design-principles、`docs/design/**`、worker。没有打包、签名、Fuses | 同上 |

## 不做

- 不拉起 Python worker，不写 `supervisor-state` 的实现。AC-81 是 M3。
- 不做 `oi-asset://`（AC-67 ②，M2）。
- 不打包，不设 Fuses（AC-67 ③，M8）。证据表只记录打包时要设的项：`RunAsNode` 关、`EnableNodeOptionsEnvironmentVariable` 关、`EnableNodeCliInspectArguments` 关、`EnableCookieEncryption` 开、`OnlyLoadAppFromAsar` 开、`EnableEmbeddedAsarIntegrityValidation` 开（各平台是否支持仍标未核实）、`GrantFileProtocolExtraPrivileges` 关。
- 不写 IPC 通道，不写 `ipc-router.ts`，不写 preload 生成器。
- 不做布局插槽、UI 事件、React、ui-kit、诊断日志、Jev 客户端。
- 不合并标题栏。一旦需要 `hiddenInset` 或 `titleBarOverlay`，先停，走 Loom。
- 不改 `.cursor/install.sh` 与 `.cursor/environment.json`。不改分支保护。不写密钥。

## 延期

2026-11-02 用 `gh issue list` 查过开放 Issue。没有「Linux / macOS 的 Electron 冒烟」「preload 生成器」「Fuses」这三件的既有 Issue。下面三件不并进已有编号：

- #30 是 M2 为无头环境改 `.cursor/*`，要 Wisdom 的一次性 N-11 例外。本计划不改那些文件，也不做这件事。
- #34 是 G1、G3 `tsc -b`、G5 `ui-events-declared`。本计划不提前做这三项。
- #62 是 worker 健康检查的 macOS job 与 `runtime/` 搬家。Electron job 不放进那个矩阵。

批准后按 [WORKFLOW.md](../WORKFLOW.md)「延期」各开一条 Issue，并在 `docs/backlog.md` §4 加行。拟用的标题：

1. Linux 与 macOS 的 Playwright Electron 冒烟（本 PR 只有 Windows）。
2. 由契约生成 preload，不手写 IPC（D5）。
3. M8 打包时按 ARCHITECTURE §9 设置 Electron Fuses（AC-67 ③）。

Issue 与 backlog 行在外壳代码之前的提交 `21cd2f5`。外壳在其后的提交。

## 证据链接

- `docs/evidence/65/commands.md`：命令、退出码、CSP、安全清单。其中有这一句：本 Cloud Agent 是 Linux，不能跑 Playwright Electron 冒烟：不加 xvfb，不改 `.cursor/install.sh`。结果以 CI job `desktop-e2e-windows`（windows-latest）为准。
