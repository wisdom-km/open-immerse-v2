# connect-src 增加 oi-asset: 之后的窗口复核

全量的对象是 `2bbb52b974a3895e6fb062e878bb5293cee02a75`（tree `ae9da67e53fd3b85bc5522e0906d55b447654bea`）。这是 CSP 放宽的实现 tip，不是阅读屏实现。阅读屏没有写。Node v22.23.4。pnpm 10.34.9。基线 `origin/main` 是 `e7db04f69e2a705f3d4389727af6f1b1001067c5`。`GATE_BASE=origin/main`。没有手动触发 CI。没有写 `G12:`。本机 `GITLEAKS_BIN` 未设置。没有跑真机 R 项。证据提交不重跑全量。

分支从 main 新开，不叠 #196 / #197。

## 窗口复核

Electron 45.2.1。`xvfb-run -a` 打开 `BrowserWindow`。`webPreferences` 是 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。方案注册仍是仓库里的 `registerAppScheme`：只有 `standard: true` 与 `secure: true`。CSP 头来自改后的 `CONTENT_SECURITY_POLICY`。文档是 `oi-app://app/index.html`。PDF.js 6.5.438。初始化准备是 `{ data, isEvalSupported: false }`。没有设置 `disableRange`。没有 `supportFetchAPI`。

进程退出码 2。第一页没有画出来。截图是 [page.png](page.png)。

文档响应 200。CSP 头是：

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self' oi-asset:; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

与 `csp.ts` 逐字相同。没有 `connect-src` 违规。`oi-app://app/pdf.js` 是 200。网络记录里没有 `oi-asset://`。协议处理器收到的次数是 0。

探针读回：

```json
{"stage":"error","init":{"data":true,"isEvalSupported":false},"disableRangeSet":false,"message":"Failed to fetch","violations":[]}
```

控制台：

```text
Fetch API cannot load oi-asset://asset/probe. URL scheme "oi-asset" is not supported.
```

worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 没有被请求到。这次没有改 `.mjs` 静态放行。新缺口写在提议 ADR 0007，没有写进已采纳的 0006。

## corepack pnpm run check

在 `2bbb52b` 上退出码 0。format、lint、typecheck、typecheck:core 退出码 0。`check-file-size: 431 source files within hard limits`。dependency-cruiser：`no dependency violations found (336 modules, 983 dependencies cruised)`。`check-core-tests` 退出码 0。三份 license 退出码 0。`check-one-slice: 0 feature slice(s)`。`check-commits` 退出码 0。`check-hotspots` 退出码 0。`check-pr-size: 105 non-generated lines`。codegen 之后 `git diff --exit-code` 退出码 0。

## corepack pnpm test

在 `2bbb52b` 上跑了一次。Vitest 174 个文件，747 通过，3 跳过，类型错误 0。退出码 0。

3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。这不是具名 G9 通过。

## workers/parser

工作目录 `workers/parser/`。Python 3.11.18。uv 0.13.6。pyright 1.1.407。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `uv run ruff check .` | 0 | All checks passed |
| `uv run ruff format --check .` | 0 | 72 files already formatted |
| `uv run pyright` | 0 | 0 errors, 0 warnings, 0 informations |
| `uv run lint-imports` | 0 | 7 kept, 0 broken |
| `uv run pytest` | 0 | 181 passed |

## supportFetchAPI 之后的窗口复核

上一节保留。这一节不改那次失败记录。

全量的对象是 `2cde5938caa84dde8d1d5ae36227288dabb5dcc1`（tree `6644a8634e80231e13e4a5b01b88f9cb3f95ebf2`）。阅读屏没有写。证据提交不重跑全量。仓库里没有断言方案注册特权的单测或 e2e，所以这一项没有可改的期望值。

Electron 45.2.1。`xvfb-run -a`。`webPreferences` 仍是 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。文档是 `oi-app://app/index.html`。PDF.js 6.5.438。初始化准备是 `{ data, isEvalSupported: false }`。没有设置 `disableRange`。

实际注册只有一次。`oi-app` 是 `standard: true`、`secure: true`。`oi-asset` 是 `standard: true`、`secure: true`、`supportFetchAPI: true`。没有 `bypassCSP`、`corsEnabled`、`allowServiceWorkers`、`stream`。

进程退出码 2。第一页没有画出来。截图是 [page-support-fetch.png](page-support-fetch.png)。上一张空白页仍是 [page.png](page.png)。

CSP 头与 `csp.ts` 逐字相同：

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' oi-asset:; font-src 'self'; connect-src 'self' oi-asset:; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'
```

没有 `connect-src` 违规。也没有再报 `URL scheme "oi-asset" is not supported`。`oi-app://app/pdf.js` 是 200。网络记录里没有 `oi-asset://`。协议处理器收到的次数是 0。

探针读回：

```json
{"stage":"error","init":{"data":true,"isEvalSupported":false},"disableRangeSet":false,"message":"Failed to fetch","violations":[]}
```

控制台：

```text
Access to fetch at 'oi-asset://asset/probe' from origin 'oi-app://app' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, chrome-untrusted, data, http, https.
```

worker、`wasm-unsafe-eval`、`blob:`、`.mjs` 没有被请求到。这次没有改 `.mjs` 静态放行，也没有加 `corsEnabled`。新缺口写在提议 ADR 0008，没有写进已采纳的 0006 或 0007。

## 2cde593 上的全量

`GATE_BASE=origin/main`。`corepack pnpm run check` 退出码 0。format、lint、typecheck、typecheck:core 退出码 0。`check-file-size: 431 source files within hard limits`。dependency-cruiser：`no dependency violations found (336 modules, 983 dependencies cruised)`。`check-one-slice: 0 feature slice(s)`。`check-pr-size: 224 non-generated lines`。codegen 之后 `git diff --exit-code` 退出码 0。

Vitest 174 个文件，747 通过，3 跳过，类型错误 0。3 个跳过仍是 `GITLEAKS_BIN` 未设置时的 detect，不是具名 G9 通过。

`workers/parser`：ruff check 退出码 0，ruff format 退出码 0，pyright 0 errors，lint-imports 7 kept / 0 broken，pytest 181 通过。
