# oi-asset 按 assetId 读 source.pdf

步骤 4 的全量对象是 `1dddc5a058c8823bbedef425083966ad7bfdab32`（tree `1c119730674fe8af9b1e307707341aab16c60912`）。步骤 5 的全量对象是 `f7425f17560b616bbe4c7a934c8781c3ea653e9a`（tree `0e55e873ab933e10d53110976234fc2e46a2cfe9`）。Node v22.23.4。pnpm 10.34.9。Electron 45.2.1。CI 的 `GATE_BASE` 是 `origin/main`（`631859c440320328164f6b3ecc0076dd7ca7ea94`）。没有手动触发 CI，没有为洗绿重跑。本机 `GITLEAKS_BIN` 未设置。没有单独的 Box 机器。没有开窗口，没有跑真机。

20:48 的计划是 `90a0a41457b49a4b18dc31bc4ab459d46432337e`（tree `9e608ad18eeb5732d89fb2ed227b9c49aecfc1ee`），只改计划。台账是 `aa552341100dd69f46542e259df32cefd45d7e71`（tree `66f87e216391c214c5d4dd68c1c409e527d91a53`），只改 `docs/approvals.md`，批准数 127。实现在这两笔之后。全量跑在实现 tip，工作区干净。本文件和计划实际列是其后的回填，不重跑全量。

## 行数

相对 `origin/main`，回填之后的 `git diff --numstat` 如下。`check-pr-size` 在实现 tip 上是 1110。回填提交上再测的数字写在表后。

| 文件 | 增 | 删 |
| --- | --- | --- |
| `apps/desktop/src/main/app-protocol.ts` | 2 | 0 |
| `apps/desktop/src/main/library-wiring.ts` | 15 | 0 |
| `apps/desktop/src/main/reading-asset-path.ts` | 34 | 0 |
| `apps/desktop/src/main/reading-asset-protocol.ts` | 182 | 0 |
| `apps/desktop/test/reading-asset-protocol.test.ts` | 487 | 0 |
| `docs/approvals.md` | 3 | 1 |
| `docs/arch/09.md` | 2 | 2 |
| `docs/evidence/190/commands.md` | 103 | 0 |
| `docs/exec-plans/feature-oi-asset-protocol-174.md` | 221 | 0 |
| `docs/spec-changelog.md` | 1 | 0 |
| `packages/features/library/src/adapters/library-main.ts` | 19 | 7 |
| `packages/features/library/src/application/reading-generation-table.ts` | 21 | 0 |
| `packages/features/library/test/core/reading-generation-table.test.ts` | 16 | 0 |
| `tools/compare-spec-bytes/manifest.json` | 10 | 0 |

`check-pr-size: 1126 non-generated lines`。提交说明里有 `G12:`。`library-wiring.ts` 是 +15，没有超过 +30。

`composition-root.ts`、`slots.ts`、`ipc-router.ts`、`pass-through.ts`、`index.ts` 的 diff 是 0。`check-hotspots: named hotspot diffs are within 30 lines`。

## corepack pnpm run check

`GATE_BASE=origin/main`。对象是实现 tip `f7425f17560b616bbe4c7a934c8781c3ea653e9a`。退出码 0。

- `check-pr-size: 1110 non-generated lines`
- `check-one-slice: 1 feature slice(s)`
- `check-hotspots: named hotspot diffs are within 30 lines`
- `check-commits: subjects match Conventional Commits`
- format：All matched files use Prettier code style
- `check-file-size: 428 source files within hard limits`
- dependency-cruiser：333 modules，963 dependencies，no dependency violations
- `check-core-tests: core tests stay on the node project`
- npm、pip license accepted；no runtime model manifest
- codegen：1 generators，之后 `git diff --exit-code` 退出码 0
- typecheck 与 typecheck:core 在这条命令里退出码为 0

## corepack pnpm test

Vitest 173 个文件，745 通过，3 跳过，类型错误 0。退出码 0。其中 `apps/desktop/test/reading-asset-protocol.test.ts` 17 通过，`apps/desktop/test/library-command-map.test.ts` 1 通过。后者的 electron mock 仍然没有 `protocol`。

3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。日志只有 `phase=binary`。这不是具名 G9 通过。

## workers/parser

工作目录 `workers/parser/`。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `uv run ruff check .` | 0 | All checks passed |
| `uv run ruff format --check .` | 0 | 72 files already formatted |
| `uv run pyright` | 0 | 0 errors |
| `uv run lint-imports` | 0 | 7 kept, 0 broken |
| `uv run pytest` | 0 | 181 passed |

## node tools/compare-spec-bytes/compare.mjs

compare-spec-bytes: PRD.md 36 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (196205 bytes)
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (372708 bytes)
compare-spec-bytes: RULES.md span matches f8d5d01dc8af81b73689c7229c983192551fa6fe (2795 bytes)
compare-spec-bytes: 68 path prefixes

退出码: 0

## 主机名规范化

在本环境用项目里的 Electron 45.2.1，经 `xvfb-run -a`，不起窗口。入口只调用 `registerAppScheme`、`createLibraryMain`、导入合成 PDF、bind，再用 `net.fetch("oi-asset://1")`。`protocol.handle` 外包了一层，记下 scheme 和 `request.url`。没有改 CSP，没有 `BrowserWindow`。

stdout 的结果行：

```json
{"assetId":"1","requested":"oi-asset://1","received":"oi-asset oi-asset://0.0.0.1/","status":404}
```

`received` 前面的 `oi-asset ` 是日志把 scheme 和 URL 拼在一起。`request.url` 本身是 `oi-asset://0.0.0.1/`。状态 404。stderr 只有 dbus 连接失败，没有协议错误。

这次按停点停下。解析不接受 `0.0.0.1`。合法 assetId 在这次真实 Electron 请求里不是 200。

## 新 URL

20:48 之后用同一套 Electron 45.2.1、`xvfb-run -a`、不起窗口。重新编译 main 与 library。`registerAppScheme` 之后导入合成 PDF 并 bind，`assetId` 是 `1`。三次 `net.fetch` 的 `request.url` 按到达顺序记下，不再把 scheme 拼进 URL。

stdout 的结果行：

```json
{"assetId":"1","requested":"oi-asset://asset/1","received":["oi-asset://asset/1","oi-asset://asset/9","oi-asset://asset/1"],"revokedOk":true,"valid":{"status":200,"contentType":"application/pdf","nosniff":"nosniff","csp":null,"bytes":17,"startsPdf":true},"unregistered":{"url":"oi-asset://asset/9","status":404,"bytes":0},"revoked":{"url":"oi-asset://asset/1","status":404,"bytes":0}}
```

合法 id 的 `request.url` 是 `oi-asset://asset/1`，与请求相同，没有被改写。状态 200，`content-type` 是 `application/pdf`，`nosniff`，没有 CSP，体 17 字节且以 `%PDF` 开头。未登记的 `oi-asset://asset/9` 是 404，体为空。撤销成功后再取 `oi-asset://asset/1` 是 404，体为空。dbus 连接失败写在 stdout 的 JSON 行之前。stderr 为空。没有为这次结果改解析。

## node tools/check-docs/check.mjs

回填文件写入后、提交前再跑 `node tools/check-docs/check.mjs`。退出码 0，`findings: 0`。不重跑上面的全量。
