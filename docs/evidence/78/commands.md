# PR #78 命令

日期：2026-11-03。工作目录是仓库根，除非另行写出。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。未改日志。

本文件对应的提交没有在本地跑 Electron e2e。CI 仍只跑 `desktop-e2e-windows`（`windows-latest`），工作流里没有 xvfb，也不改 `.cursor/install.sh`（N-11）。Anvil 在 PR #78 用 `xvfb-run` 于 Linux 跑 desktop e2e：24 passed，10.6s（Issue #82、#83）。Anvil 在 PR #90 验收时 Linux Box 上 desktop e2e 24 passed（Anvil 验收报告，未入库）；是否经 `xvfb-run`：未核实。同一份报告记录 Windows 真机 DESKTOP-0GI64S8 上 desktop e2e 24/24。`docs/evidence/90/commands.md` 另记本机 xvfb 的 `e2e/permissions.spec.ts` 6 passed，以及 Windows CI run `41610915781` 的 `24 passed (23.3s)`。

证据对应 `f7aebc5ab1504b23ab05be288d2c49b2faea114e`。本文件提交之后仅改 docs。

renderer 是空页面（`apps/desktop/src/renderer/index.html` 只有标题 `Open Immerse`）。每张截图为白屏。M1 可接受。

## 命令

基线 `GATE_BASE=origin/main`（`91760ba28c773e63e084fc5c7d2c0251ffe515dc`）。tip `f7aebc5ab1504b23ab05be288d2c49b2faea114e`。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm test` | 0 | Vitest 65 个文件。114 通过，2 跳过，0 失败。跳过的是 `tools/check-secrets/leak.test.ts`：未设 `GITLEAKS_BIN` |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | 含 lint、typecheck、typecheck:core、行数、dependency-cruiser、许可证、Conventional Commits、热点、PR 体量、codegen、G7。非生成 diff 554 行 |
| Playwright Electron e2e | 未在本地跑 | 见 Windows CI。通过 24，失败 0，跳过 0 |

`test:core`：不适用（`package.json` 没有这个脚本）。

`git diff --name-only origin/main...f7aebc5` 与 `gh pr view 77 --json files` 的文件列表交集为空。没有改 PR #77 的文件。

对照 N-10 / N-11：diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。core 目录（`packages/kernel`、`packages/contracts`、`packages/features`）改动 0 行。

## 用例清单

24 个用例，每个一个 `test`：

1. `returns a response when the oi-app document reloads`
2. `matches the csp constant when the oi-app document responds`
3. `omits unsafe-eval when the csp header is read`
4. `records zero file requests when the page reloads`
5. `stays off file urls when the page url is read`
6. `keeps web contents off file urls when all contents are listed`
7. `exposes an empty object when window.oi is read`
8. `enables context isolation when web preferences are read`
9. `enables the sandbox when web preferences are read`
10. `disables node integration when web preferences are read`
11. `leaves web security enabled when web preferences are read`
12. `stays on the app url when the renderer assigns an external location`
13. `returns null when the renderer calls window.open`
14. `keeps the web contents count when the renderer calls window.open`
15. `does not attach a webview when the renderer appends a webview element`
16. `returns denied when the renderer requests notification permission`
17. `returns denied when the renderer queries notifications`
18. `returns denied when the renderer queries geolocation`
19. `returns denied when the renderer queries camera`
20. `returns denied when the renderer queries microphone`
21. `grants notifications when the check handler is overridden to allow`
22. `shows a non-empty title when the window opens`
23. `loads the app start url when the window opens`
24. `uses the oi-app protocol when the page location is read`

## Windows CI

job：`desktop-e2e-windows`，`runs-on: windows-latest`。tip `f7aebc5ab1504b23ab05be288d2c49b2faea114e`。

PR run `41573831784` 是上一笔 `10fcd97`，不作为本表。本表用 PR run `41575859404`，job `125719079044`。同一 tip 的 push run `41575854809` 也是 success。

Playwright 步骤摘录：

```
Running 24 tests using 1 worker
  24 passed (20.1s)
```

通过 24，失败 0，跳过 0。

## 截图

artifact `desktop-e2e-windows-screenshots`，id `13202629209`。链接：<https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209>

run id：`41575859404`。tip SHA：`f7aebc5ab1504b23ab05be288d2c49b2faea114e`。

路径照抄该 artifact 压缩包里的目录名。png 不进 git。24 张，与 24 个用例一一对应。renderer 空页，截图为白屏，M1 可接受。

| 用例名 | 截图路径 | artifact 链接 | run id | tip SHA |
| --- | --- | --- | --- | --- |
| `returns a response when the oi-app document reloads` | `csp-returns-a-response-when-the-oi-app-document-reloads/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `matches the csp constant when the oi-app document responds` | `csp-matches-the-csp-consta-0c147-he-oi-app-document-responds/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `omits unsafe-eval when the csp header is read` | `csp-omits-unsafe-eval-when-the-csp-header-is-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `records zero file requests when the page reloads` | `file-url-records-zero-file-requests-when-the-page-reloads/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `stays off file urls when the page url is read` | `file-url-stays-off-file-urls-when-the-page-url-is-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `keeps web contents off file urls when all contents are listed` | `file-url-keeps-web-content-7ee6b-hen-all-contents-are-listed/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `exposes an empty object when window.oi is read` | `isolation-exposes-an-empty-object-when-window-oi-is-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `enables context isolation when web preferences are read` | `isolation-enables-context--33cf0-en-web-preferences-are-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `enables the sandbox when web preferences are read` | `isolation-enables-the-sandbox-when-web-preferences-are-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `disables node integration when web preferences are read` | `isolation-disables-node-in-b6f4d-en-web-preferences-are-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `leaves web security enabled when web preferences are read` | `isolation-leaves-web-secur-ec085-en-web-preferences-are-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `stays on the app url when the renderer assigns an external location` | `navigation-stays-on-the-ap-1a510-ssigns-an-external-location/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `returns null when the renderer calls window.open` | `navigation-returns-null-when-the-renderer-calls-window-open/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `keeps the web contents count when the renderer calls window.open` | `navigation-keeps-the-web-c-14c91--renderer-calls-window-open/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `does not attach a webview when the renderer appends a webview element` | `navigation-does-not-attach-50546-r-appends-a-webview-element/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `returns denied when the renderer requests notification permission` | `permissions-returns-denied-45479-sts-notification-permission/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `returns denied when the renderer queries notifications` | `permissions-returns-denied-2bdc9-derer-queries-notifications/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `returns denied when the renderer queries geolocation` | `permissions-returns-denied-6cce1-enderer-queries-geolocation/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `returns denied when the renderer queries camera` | `permissions-returns-denied-when-the-renderer-queries-camera/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `returns denied when the renderer queries microphone` | `permissions-returns-denied-52e07-renderer-queries-microphone/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `grants notifications when the check handler is overridden to allow` | `permissions-grants-notific-a7916-dler-is-overridden-to-allow/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `shows a non-empty title when the window opens` | `window-shows-a-non-empty-title-when-the-window-opens/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `loads the app start url when the window opens` | `window-loads-the-app-start-url-when-the-window-opens/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
| `uses the oi-app protocol when the page location is read` | `window-uses-the-oi-app-pro-8baf3-n-the-page-location-is-read/test-finished-1.png` | <https://github.com/wisdom-km/open-immerse-v2/actions/runs/41575859404/artifacts/13202629209> | `41575859404` | `f7aebc5ab1504b23ab05be288d2c49b2faea114e` |
