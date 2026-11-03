# PR #77 命令

日期：2026-11-03。工作目录是仓库根。Node 是 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`node -v` 为 v22.23.4，`corepack pnpm --version` 为 10.34.9。

门禁跑在 `2f7c18e9944d9ee1a726388ac526b3309828db34`。这一笔已经把 logger 接上，并把 kernel、contracts、platform-node 编成 JS。本文件是后一笔，只补记录。

本 Cloud Agent 是 Linux，不跑 Playwright Electron：不加 xvfb，不改 `.cursor/install.sh`。窗口截图以 CI job `desktop-e2e-windows` 为准。

## 命令

基线 `GATE_BASE=origin/main`（`28428ff1478dc77711ae457f73475a1f35cdf016`）。

| 命令 | 退出码 | 备注 |
| --- | --- | --- |
| `GATE_BASE=origin/main corepack pnpm test` | 0 | Vitest 86 个文件、181 通过、2 跳过、0 失败。类型错误 0。跳过的是未设 `GITLEAKS_BIN` 的本地密钥夹具。CI 的 `node` job 设了该变量 |
| `GATE_BASE=origin/main corepack pnpm run check` | 0 | lint、typecheck、typecheck:core、行数（150 个源文件）、`check:deps`（77 modules，144 dependencies，无违例）、G18（0 个功能切片）、Conventional Commits、热点、PR 体量（988 行非生成 diff，提交说明里有 `G12:`）、codegen、G7 |
| `corepack pnpm exec vitest run packages/platform-node/test/log-paths.test.ts packages/platform-node/test/value-guard.test.ts packages/platform-node/test/debug-retention.test.ts packages/platform-node/test/file-logger.test.ts --reporter=verbose` | 0 | 4 个文件、30 通过。摘录见下 |

`test:core`：不适用（`package.json` 没有这个脚本）。没有执行。

`dist/` 不存在时，根 `tsc --noEmit --project tsconfig.json` 与 `corepack pnpm run check:deps` 退出码都是 0。类型走 `exports.types` 的 `./src/index.js`。

在 `apps/desktop` 执行 `pnpm run build` 后，用 Node 加载编译后的 `createFileLogger`，退出码 0。写入的那一行见下节。

CI `node` job 的 G9：gitleaks 8.30.1，`no leaks found`。没有放宽 `.gitleaks.toml`。

## AC-101 ②

调试目录只在开启之后出现。保留只处理 `debug/`。7 天、50 MB、清空、`deleteFiles`、构造时清理、当天文件被删后重建，都在下面这些通过的用例里。

```text
✓ AC-101 writes no debug file when debug mode was never enabled
✓ AC-101 writes a debug line when debug mode is enabled
✓ AC-101 drops debug files older than 7 days when a later line is written
✓ AC-101 recreates the daily file when retention deleted the file being written
✓ AC-101 leaves zero debug files when clearDebugLogs runs
✓ AC-101 deletes debug files when debug mode turns off with deleteFiles true
✓ AC-101 keeps recent debug files when debug mode turns off with deleteFiles false
✓ AC-101 removes expired debug files when the logger is constructed
✓ AC-101 deletes files older than 7 days when retention runs
✓ AC-101 deletes the oldest files first when the total exceeds 50 MB
✓ AC-101 deletes one file when that file alone exceeds 50 MB
✓ AC-101 keeps a file when its size is exactly 50 MB
```

## AC-101 ③

证据是只有文件 sink、依赖允许清单、以及 `check:deps` 通过。

允许清单用例 `AC-101 allows only kernel and contracts when the package manifest is read` 通过：`dependencies` 的键排序后恰好是 `@oi/contracts`、`@oi/kernel`，没有 `optionalDependencies` 与 `peerDependencies`。`AC-101 does not call fetch when a diagnostic line is written` 通过：写日志时 `fetch` 次数为 0。没有新增 G5 规则。`check:deps` 在上面的 `check` 里通过。

## AC-101 ⑤

`AC-101 joins diagnostics and debug under the injected directory when paths are requested` 通过。产品文件在注入目录的 `diagnostics/`，调试文件在注入目录的 `debug/`。断言该路径不位于仓库的 `packages/features/diagnostics/`。

## #76

`readDiagEvent` 失败则两个目录都不写。字符串先脱敏再看字符集。能通过字符集的假 Key 仍被换成 `[redacted]`。`api-key-missing` 原样保留。超长正文被替换。绝对路径被替换。查询参数只按 `key=`、`access_token=`、`client_id=`、`client_secret=`。

```text
✓ AC-101 keeps a successful pipeline run when the field values are short tokens
✓ AC-101 replaces a charset-valid fake key when the value contains sk-
✓ AC-101 replaces a charset-valid fake key when the value contains the oitest_ prefix
✓ AC-101 keeps api-key-missing when the value has no query separator
✓ AC-101 replaces bearer and authorization text when the casing varies
✓ AC-101 replaces a query value when it contains access_token= or key=
✓ AC-101 replaces an absolute path when it is stored in a string field
✓ AC-101 replaces an overlong body when it is placed in error_class
✓ drops an extra key when the record still passes the whitelist
✓ returns undefined when readDiagEvent rejects the record
✓ AC-101 writes a redacted debug line when a charset-valid key is logged
✓ AC-101 keeps api-key-missing when that error class is logged
✓ AC-101 writes nothing when the record fails readDiagEvent
```

守卫识别不了无空格、又短于长度上限、且落在字符集里的正文。正文出现 0 次，靠调用方不传，再加上长度上限。

## 脱敏 JSON 行

编译后的 logger 写入的一行。`route` 的输入是 `oitest_fixturekey`，`step` 的输入是 `sk-oitest_abc`。

```json
{"ts":"2026-11-03T00:00:00.000Z","level":"info","feature":"pipeline","event":"pipeline.run","run_id":"run-1","route":"[redacted]","step":"[redacted]","status":"done","error_class":"api-key-missing","duration_ms":12}
```

## Windows 截图

job：`desktop-e2e-windows`，`runs-on: windows-latest`。tip SHA `2f7c18e9944d9ee1a726388ac526b3309828db34`。这一笔已经接入 logger，并且 `build` 会先编译 kernel、contracts、platform-node。`push` 与 `pull_request` 都是 pass。冒烟日志是 `1 passed`。构建命令里看得到三个包的 `tsc`。

PR 那组：run [41570169318](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41570169318)。截图 artifact：[desktop-e2e-windows-screenshots](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41570169318/artifacts/13201585919)。`1 passed (12.4s)`。

同一提交的 `push` 那组：run [41570163017](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41570163017)，artifact [13201142049](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41570163017/artifacts/13201142049)。`1 passed (8.6s)`。

两组 artifact 里的 `test-finished-1.png` 都是 784×535 的 PNG，是冒烟结束后的页面。当前 renderer 只有标题、没有正文，所以页面是空白。图不入库（N-12）。

上一笔 `7855bb3` 的 [run 41568563677](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41568563677) 在 `Downloading Electron binary...` 超过 120 秒，没有 png。那个 SHA 还没有把三个包编成 JS。不把它当作本 PR 的截图。

`actions/upload-artifact` 用的是 tag `v7.0.2`。该 tag 仍指向 `cf430e030ddbb5b0abf93d22962f4752f3646cd9`。

## 对照 N-10 / N-11

diff 不含 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`。没有改 workflow，没有改 ARCHITECTURE，没有改 G5。
