# 阅读屏停在 CSP 窗口核对

全量的对象是 ADR 提交 `60df4bbdef8fca31ca3f9da45d2cb32c55631bb4`（tree `beb4746d9dd9e08d21da51d603831aee23275b64`）。这不是阅读屏实现 tip。阅读屏没有写。Node v22.23.4。pnpm 10.34.9。基线 `origin/main` 是 `e7db04f69e2a705f3d4389727af6f1b1001067c5`。`GATE_BASE=origin/main`。没有手动触发 CI。没有写 `G12:`。本机 `GITLEAKS_BIN` 未设置。没有跑真机 R 项。证据提交不重跑全量。

分支从 `a5c67db49708061f87ae0f0a502f629622305ab2`（tree `61c01185e7ff3febbe7a035bb3df86b881290838`）开出。

## 窗口核对

Electron 45.2.1。`xvfb-run -a` 打开 `BrowserWindow`。`webPreferences` 是 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`。方案注册与 CSP 头使用仓库里的 `registerAppScheme`、`handleAppProtocol`、`handleReadingAssetProtocol` 和 `CONTENT_SECURITY_POLICY`。没有改 `csp.ts`。文档是 `oi-app://app/index.html`。PDF.js 6.5.438。初始化准备是 `{ data, isEvalSupported: false }`。没有设置 `disableRange`。

进程退出码 2。第一页没有画出来。截图是 [page.png](page.png)。

文档响应 200，CSP 头与常量逐字相同。`oi-app://app/pdf.js` 是 200。网络记录里没有 `oi-asset://`。

探针读回的结果：

```json
{"stage":"error","init":{"data":true,"isEvalSupported":false},"disableRangeSet":false,"message":"Failed to fetch","violations":[{"directive":"connect-src","blocked":"oi-asset"}]}
```

控制台：

```text
Connecting to 'oi-asset://asset/probe' violates the following Content Security Policy directive: "connect-src 'self'". The action has been blocked.
Fetch API cannot load oi-asset://asset/probe. Refused to connect because it violates the document's Content Security Policy.
```

worker、`wasm-unsafe-eval`、`blob:` 没有测到。现行静态放行不含 `.mjs`，探针把 `pdf.mjs` 复制成 `pdf.js` 后脚本才返回 200。

## corepack pnpm run check

在 `60df4bb` 上退出码 0。format、lint、typecheck、typecheck:core 退出码 0。`check-file-size: 431 source files within hard limits`。dependency-cruiser：`no dependency violations found (336 modules, 983 dependencies cruised)`。`check-core-tests` 退出码 0。三份 license 退出码 0。`check-one-slice: 1 feature slice(s)`。`check-commits` 退出码 0。`check-hotspots` 退出码 0。`check-pr-size: 216 non-generated lines`。codegen 之后 `git diff --exit-code` 退出码 0。

这一行数含 #196 相对 main 的文献库手势。本笔新增文件只有 `docs/adr/0006-renderer-oi-asset-csp.md` 与 `docs/adr/README.md`。

## corepack pnpm test

在 `60df4bb` 上跑了一次。Vitest 174 个文件，750 通过，3 跳过，类型错误 0。退出码 0。

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
