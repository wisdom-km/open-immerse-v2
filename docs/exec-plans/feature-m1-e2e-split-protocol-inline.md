# 执行计划

跨 `app-protocol` 与 desktop e2e，所以有这份计划。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名。第一笔提交只有本文件。Forge 审查通过之前不写实现。PR 保持 Draft，不离开 Draft，不合入。

基线：main@28428ff（`28428ff1478dc77711ae457f73475a1f35cdf016`）。分支：`feature/m1-e2e-split-protocol-inline`。关闭 #71、#72。

## 现状理解

- 已有行为：`apps/desktop/e2e/smoke.spec.ts` 只有一个用例 `opens one oi-app window under the security baseline`（第 11 行），里面串了 18 条断言（见下表）。权限只断言 `Notification.requestPermission()` 为 `denied`（第 27 行，request handler）。没有 `navigator.permissions.query`。`apps/desktop/src/main/app-protocol.ts` 第 21–27 行的 `readUrl`、`readMethod` 只返回 `request.url` 与 `request.method`。`security/permissions.ts` 的 `decidePermissionRequest` 与 `decidePermissionCheck` 都返回 `false`。接线在 `index.ts` 的 `denyPermissions`（第 32–37 行），同时注册 request 与 check handler。`index.ts` 在 PR #77 的文件列表里，本计划不改它。`playwright.config.ts` 已设 `screenshot: "on"`。CI job `desktop-e2e-windows`（`windows-latest`）已用 `actions/upload-artifact` 上传 `apps/desktop/test-results/**/*.png`（`if: always()`，`if-no-files-found: error`，artifact 名 `desktop-e2e-windows-screenshots`）。main 上 run `41478055464` 的该 artifact 存在（436 字节，未过期）。
- 相关的节：PRD AC-67 ①。ARCHITECTURE §6、§9（request 与 check handler 一律拒绝；`oi-app://`；CSP）、§13、§15.2。RULES §1.4 测试命名、§4 证据与每个 tip 全量一次、§5 无 `utils`、N-01、N-02、N-05、N-08、N-12。`docs/backlog.md` 第 95–96 行是 #71、#72。
- 还没做的部分：check handler 的 e2e；把那 18 条断言拆成各自的用例；删掉两个透传函数。没有 e2e 覆盖协议 405 / 404。`static-file.test.ts` 断言 POST 的 `kind` 为 `method`，以及越界路径为 `null`，不经过 `respond` 的 HTTP 状态。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 批准并实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 提交本文件，开 Draft PR，停下等 Forge。不写实现 |  |  |
| 2 | 在 `handleAppProtocol` 的 `protocol.handle` 回调里直接传 `request.url`、`request.method`，删除 `readUrl` 与 `readMethod`。不改 `respond`、状态码、响应头 |  |  |
| 3 | 用下面的 fixture 与 spec 替换 `smoke.spec.ts`。一条断言一个 `test`。名字是 `<结果> when <条件>`。每个用例自己启动并关闭 Electron |  |  |
| 4 | 加上权限 query 用例。名字固定为 `denied when renderer queries <permission>`。权限名见下一节 |  |  |
| 5 | 不提交的负向验证，步骤见「权限 check」。Cloud Linux 不执行 |  |  |
| 6 | 实现提交里把 `docs/backlog.md` 第 95–96 行标成由本 PR 处理。不新开 Issue |  |  |
| 7 | Windows CI 绿之后写 `docs/evidence/<PR号>/commands.md`：命令、基线 SHA、tip SHA、通过 / 失败 / 跳过、用例清单、CI 摘录、截图表、与 #77 的交集为空。截图只留在 artifact |  |  |
| 8 | 每个实现 tip 全量只跑一次：`corepack pnpm run check` 与 `corepack pnpm test`。e2e 不在 Linux 上跑 |  |  |

## 文件清单与预计行数

物理行数，含空行。测试硬上限 800，普通文件硬上限 600，函数硬上限 80。不加 allowlist。

| 文件 | 动作 | 预计行数 |
| --- | --- | --- |
| `apps/desktop/src/main/app-protocol.ts` | 删除两个透传函数 | 现 48，预计 40 |
| `apps/desktop/e2e/fixtures/electron-app.ts` | 新建。只负责解析 Electron 可执行文件、`launch`、把 `{ app, page }` 交给调用方，并在 `close` 时关掉 | 55 |
| `apps/desktop/e2e/window.spec.ts` | 新建。标题、起始 URL、`oi-app:` | 70 |
| `apps/desktop/e2e/csp.spec.ts` | 新建。CSP 两条 | 60 |
| `apps/desktop/e2e/file-url.spec.ts` | 新建。`file://` 三条 | 85 |
| `apps/desktop/e2e/navigation.spec.ts` | 新建。外链、`window.open` 两条、`<webview>` | 100 |
| `apps/desktop/e2e/permissions.spec.ts` | 新建。request 一条，query 二至四条 | 140 |
| `apps/desktop/e2e/isolation.spec.ts` | 新建。`window.oi` 与四项 `webPreferences` | 100 |
| `apps/desktop/e2e/smoke.spec.ts` | 删除。避免同一断言跑两遍 | 现 130，删除 |
| `docs/backlog.md` | 只改第 95–96 行的措辞，标成本 PR 处理 | 改两行 |
| `docs/evidence/<PR号>/commands.md` | 实现并等到 Windows CI 之后新增 | 约 80 |
| `apps/desktop/playwright.config.ts` | 不改。`screenshot: "on"` 已会在每个测试结束时写 png | 0 |
| `.github/workflows/ci.yml` | 不改。上传步骤已覆盖 `apps/desktop/test-results/**/*.png` | 0 |

`evaluate`（`page.evaluate(source as never)`，避开根 `tsc` 的 DOM 检查）和 `asRecord` 留在用到它们的 spec 底部。不建 `utils.ts`、`helpers.ts`、`common.ts`。fixture 不放断言。

不改 `security/**` 的行为。不改 `index.ts`。不加依赖，不改 `apps/desktop/package.json`、`pnpm-lock.yaml`。

## 旧断言 → 新用例

原文件 18 条断言各对应一个用例。query 用例另计，所以独立用例数 ≥ 18。

| 原断言（`smoke.spec.ts`） | 新用例 |
| --- | --- |
| 第 19 行，标题长度 > 0 | `shows a non-empty title when the window opens` |
| 第 20 行，`page.url()` 等于 `appStartUrl` | `loads the app start url when the window opens` |
| 第 22 行，`location.protocol` 为 `oi-app:` | `uses the oi-app protocol when the page location is read` |
| 第 47 行，CSP 与 `CONTENT_SECURITY_POLICY` 逐字相同 | `matches the csp constant when the oi-app document responds` |
| 第 48 行，CSP 不含 `unsafe-eval` | `omits unsafe-eval when the csp header is read` |
| 第 60 行，reload 期间 `file:` 请求为 0 | `records zero file requests when the page reloads` |
| 第 61 行，当前 URL 不以 `file:` 开头 | `stays off file urls when the page url is read` |
| 第 65 行，全部 webContents URL 不以 `file:` 开头 | `keeps web contents off file urls when all contents are listed` |
| 第 71 行，把 `location.href` 设成 `https://example.com/` 后 URL 不变 | `stays on the app url when the renderer assigns an external location` |
| 第 76 行，`window.open` 的结果为 `null` | `returns null when the renderer calls window.open` |
| 第 78 行，webContents 数量不变 | `keeps the web contents count when the renderer calls window.open` |
| 第 89 行，附加 `<webview>` 后类型列表不含 `webview` | `does not attach a webview when the renderer appends a webview element` |
| 第 27 行，`Notification.requestPermission()` 为 `denied` | `returns denied when the renderer requests notification permission` |
| 第 28 行，`JSON.stringify(window.oi)` 为 `{}` | `exposes an empty object when window.oi is read` |
| 第 104 行，`contextIsolation` 为 true | `enables context isolation when web preferences are read` |
| 第 105 行，`sandbox` 为 true | `enables the sandbox when web preferences are read` |
| 第 106 行，`nodeIntegration` 为 false | `disables node integration when web preferences are read` |
| 第 107 行，`webSecurity` 不是 false | `leaves web security enabled when web preferences are read` |

不新增 405 / 404 的 e2e。交接里那两句是拆分粒度的例子；现有 `smoke.spec.ts` 没有这两条断言，#72 只要求删透传并让已有协议单测照常通过。已有单测是 `apps/desktop/test/static-file.test.ts`。

## 权限 check

Renderer 里执行 `navigator.permissions.query({ name })`，断言 `state` 为 `denied`。

| 权限名 | 用例 | 查询失败时 |
| --- | --- | --- |
| `notifications` | `denied when renderer queries notifications` | 必须通过。失败则停，不改判定函数 |
| `geolocation` | `denied when renderer queries geolocation` | 同上 |
| `camera` | `denied when renderer queries camera` | 仅当拒绝原因是 TypeError（该 Electron 的 PermissionName 没有这个名字）时 `test.skip`，并在证据里写下这个名字。其他错误不算跳过 |
| `microphone` | `denied when renderer queries microphone` | 同 `camera` |

`oi-app` 已以 `secure: true` 注册，query 跑在安全上下文里。

负向验证（写在这里，不提交 diff，不推到 CI）：

1. 在一台能跑 Electron 的 Windows 上，只把 `decidePermissionCheck` 的返回值临时改成 `true`。不动 `decidePermissionRequest`，不动 `index.ts`。
2. 只跑 `denied when renderer queries notifications`。预期失败：`state` 不再是 `denied`。
3. `git checkout -- apps/desktop/src/main/security/permissions.ts`，确认该文件无 diff，再继续。

本 Cloud Agent 是 Linux，不加 xvfb，不跑这条负向验证，也不把「改成 true」的 diff 推上去。若未改判定函数时 query 的 `state` 已经不是 `denied`，按文末升级停下：check handler 没有真正拒绝。

## 截图

每个 `test` 一张，来自已有的 `screenshot: "on"`。Playwright 把 png 写到 `apps/desktop/test-results/<spec 名>-<用例标题>/` 下（标题里的空格和标点会变成连字符）。文件名用目录里的那张 `test-finished-*.png`。

CI 继续用现有步骤上传，artifact 名 `desktop-e2e-windows-screenshots`，run 页 `https://github.com/wisdom-km/open-immerse-v2/actions/runs/<run id>`。证据表的列：用例名、截图文件名、artifact 名、CI run id、tip SHA。png 不进 git（N-12）。

某个用例在成功的 Windows job 里没有对应 png 时，才改 `ci.yml` 里该 job 的 `path`。不改 job 名 `desktop-e2e-windows`，不把它加进必需检查，不放宽 `if-no-files-found`。

## 与 #77 的零交集

2026-11-03 核对：`gh pr view 77 --json files`。PR #77「M1: 诊断日志落盘」仍是 OPEN，未合入。文件：

`apps/desktop/package.json`、`apps/desktop/src/main/composition-root.ts`、`apps/desktop/src/main/index.ts`、`docs/evidence/77/commands.md`、`docs/exec-plans/feature-m1-logging-impl.md`、`packages/contracts/package.json`、`packages/contracts/tsconfig.build.json`、`packages/kernel/package.json`、`packages/kernel/tsconfig.build.json`、`packages/platform-node/package.json`、`packages/platform-node/src/index.ts`、`packages/platform-node/src/logging/debug-retention.ts`、`packages/platform-node/src/logging/file-logger.ts`、`packages/platform-node/src/logging/log-paths.ts`、`packages/platform-node/src/logging/value-guard.ts`、`packages/platform-node/test/debug-retention.test.ts`、`packages/platform-node/test/file-logger.test.ts`、`packages/platform-node/test/log-paths.test.ts`、`packages/platform-node/test/value-guard.test.ts`、`packages/platform-node/tsconfig.build.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`tools/check-deps/tsconfig.paths.json`、`vitest.config.ts`。

上表与本计划的文件清单交集为空。main 上还没有 `composition-root.ts`。实现前再跑一次 `gh pr view 77 --json files -q '.files[].path'`，并在证据里写 `git diff --name-only main...HEAD` 与这份列表的交集。交集非空则停，不改那些文件。

## 不做

- Linux / macOS 的 Electron 冒烟（#66）。不加 xvfb。不改 `.cursor/install.sh`、`.cursor/environment.json`。
- Content-Type 与 `nosniff`（#69）。打包后的 renderer 路径（#70）。preload 生成（#67）。Fuses（#68）。
- 不改 `security/**` 的返回值。不改 DESIGN、`docs/design-principles.md`、`docs/design/**`。不改 worker。不写密钥。不 force push。不改分支保护与必需检查。

## 延期

没有新的延期项。#66、#67、#69、#70 已有 Issue 和 backlog 行，本 PR 不做，不重复开。#71、#72 由本 PR 处理，实现时改 backlog 那两行，不开新 Issue。

## 证据链接

- 实现完成前：无。本提交不跑 lint、typecheck、单测、e2e。
- 实现之后：`docs/evidence/<PR号>/commands.md`。其中写：Electron e2e 仅在 Windows CI 运行，Cloud Linux 无法运行，本地未跑 e2e。

## 何时停

报告格式：触发、停在、已读、现状、提问。

- 必须改 #77 列表中的任一文件（含为截图或 fixture 去改 `package.json` / 锁文件）。
- 未改判定函数时，query 的 `state` 不是 `denied`。
- 需要新依赖，或要改门禁 / 必需检查。
- 规格冲突，或遇到密钥。
