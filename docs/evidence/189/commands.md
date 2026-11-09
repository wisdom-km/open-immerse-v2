# 代际只增不减

校验对象是实现提交 `083407dcfe3cd816353ea6c27808997a1b2159d8`（tree `0805c5961098237d9478cf9ea5c6adb4a5668a47`）。Node v22.23.4。pnpm 10.34.9。CI 的 `GATE_BASE` 是 `origin/main`（`79959adfe26a91c3771a04dc6e3f9fcc5154442d`）。没有手动触发 CI，没有为洗绿重跑。本机 `GITLEAKS_BIN` 未设置。本批没有跑 Box，没有跑真机。

18:42 台账 `f461eac564ea267014785ef9f4f993983ac6359b` 先于实现提交。Forge 计划审查 PASS：[6736646809](https://github.com/wisdom-km/open-immerse-v2/pull/189#issuecomment-6736646809)。

## corepack pnpm run check

退出码 0。本机 `main` 停在 `633610f`，这次 `check` 里的 `check-pr-size` 因此打印 `1806 non-generated lines`，并且那段历史提交说明里有 `G12:`，所以退出码仍是 0。这不是本 PR 相对 `origin/main` 的行数。

随即用 `GATE_BASE=origin/main` 重跑：

- `check-pr-size: 350 non-generated lines`，退出码 0。`origin/main..HEAD` 的提交说明里没有 `G12:`。
- `check-one-slice: 1 feature slice(s)`
- `check-hotspots: named hotspot diffs are within 30 lines`
- `check-commits: subjects match Conventional Commits`

`check` 其余项：format、lint、typecheck、typecheck:core、`check-file-size: 425 source files within hard limits`、dependency-cruiser 330 modules / 946 dependencies、core-tests、三份 license、codegen 之后 `git diff --exit-code`，退出码都是 0。

## corepack pnpm test

Vitest 172 个文件，727 通过，3 跳过，类型错误 0。退出码 0。

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

## node tools/check-docs/check.mjs

回填文件写入后、提交前再跑 `node tools/check-docs/check.mjs`。退出码 0，`findings: 0`。不重跑上面的全量。

## 热点

相对 `origin/main`，`composition-root.ts`、`slots.ts`、`ipc-router.ts`、`pass-through.ts` 的 diff 是 0。`library-wiring.ts` 只加了 `commandMap` 的测试导出（+2/−1）。
