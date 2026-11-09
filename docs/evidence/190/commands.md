# oi-asset 按 assetId 读 source.pdf

校验对象是实现 tip `1dddc5a058c8823bbedef425083966ad7bfdab32`（tree `1c119730674fe8af9b1e307707341aab16c60912`）。前一笔实现是 `94e5ac2f54852534d2b7f5557b52f8fd133a6a4d`（tree `fab6c6c43e192139aabfd5ae2781f6def4cb4c51`）。Node v22.23.4。pnpm 10.34.9。Electron 45.2.1。CI 的 `GATE_BASE` 是 `origin/main`（`631859c440320328164f6b3ecc0076dd7ca7ea94`）。没有手动触发 CI，没有为洗绿重跑。本机 `GITLEAKS_BIN` 未设置。没有单独的 Box 机器。没有开窗口，没有跑真机。

计划补充 `22012818ce48525d529402623243f9e6d47b326a`（tree `cd97a8a0d1792e5557ec718032ba5493da9be460`）只改计划文件，提交时间 `2026-11-09T12:00:13Z`，早于实现。Forge 有条件 PASS：[6739448337](https://github.com/wisdom-km/open-immerse-v2/pull/190#issuecomment-6739448337)。

## 行数

相对 `origin/main`，实现 tip 的 `git diff --numstat` 如下。不含本证据文件，也不含回填之后计划文件多出来的行：

| 文件 | 增 | 删 |
| --- | --- | --- |
| `apps/desktop/src/main/app-protocol.ts` | 2 | 0 |
| `apps/desktop/src/main/library-wiring.ts` | 15 | 0 |
| `apps/desktop/src/main/reading-asset-path.ts` | 34 | 0 |
| `apps/desktop/src/main/reading-asset-protocol.ts` | 172 | 0 |
| `apps/desktop/test/reading-asset-protocol.test.ts` | 466 | 0 |
| `docs/approvals.md` | 2 | 1 |
| `docs/exec-plans/feature-oi-asset-protocol-174.md` | 213 | 0 |
| `packages/features/library/src/adapters/library-main.ts` | 19 | 7 |
| `packages/features/library/src/application/reading-generation-table.ts` | 21 | 0 |
| `packages/features/library/test/core/reading-generation-table.test.ts` | 16 | 0 |

`check-pr-size: 968 non-generated lines`，退出码 0。提交说明里有 `G12:`。`library-wiring.ts` 是 +15，没有超过 +30。

`composition-root.ts`、`slots.ts`、`ipc-router.ts`、`pass-through.ts`、`index.ts` 的 diff 是 0。`check-hotspots: named hotspot diffs are within 30 lines`。

## corepack pnpm run check

`GATE_BASE=origin/main`。退出码 0。

- `check-pr-size: 968 non-generated lines`
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

Vitest 173 个文件，745 通过，3 跳过，类型错误 0。退出码 0。其中 `apps/desktop/test/reading-asset-protocol.test.ts` 17 通过，`apps/desktop/test/library-command-map.test.ts` 通过。后者的 electron mock 仍然没有 `protocol`。

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
compare-spec-bytes: ARCHITECTURE.md 66 parts match f8d5d01dc8af81b73689c7229c983192551fa6fe (372696 bytes)
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

按停点：解析不接受 `0.0.0.1` 这种写法，URL 仍是 `oi-asset://<assetId>`。没有改 [docs/arch/09.md](../../arch/09.md)。纯函数测试断言 `oi-asset://0.0.0.1/` 在 assetId 为 `1` 时是 404。合法 assetId 在这次真实 Electron 请求里不是 200。

## node tools/check-docs/check.mjs

回填文件写入后、提交前再跑 `node tools/check-docs/check.mjs`。退出码 0，`findings: 0`。不重跑上面的全量。
