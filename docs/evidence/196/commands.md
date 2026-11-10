# 文献库打开手势

全量的对象是 `1f45e51c2d474a09102a730a0aab04bfb1f18dae`（tree `3aacfd17136b94503ec2bbf014bc822ec1a209f6`）。Node v22.23.4。pnpm 10.34.9。基线 `origin/main` 是 `e7db04f69e2a705f3d4389727af6f1b1001067c5`（tree `15f7237771b020692f0ec86bf36f1db297114f79`）。`GATE_BASE=origin/main`。没有手动触发 CI。没有写 `G12:`。本机 `GITLEAKS_BIN` 未设置。没有跑真机，没有跑 `apps/desktop` 的 build 脚本。阅读屏、CSP、core 目录没有改。

`352e74c03aaef44d64ce15f4cc8cf5f33be7b012` 上的 `corepack pnpm run check` 在 typecheck 退出码 2：`exactOptionalPropertyTypes` 下不能把 `undefined` 赋给可选 `onOpen`。`1f45e51` 改正类型后，下面这一次是该 tip 的全量。证据提交不重跑全量。

更早一次 check 停在 lint：工作区包链接还没装上，`@oi/feature-ingest` 的类型解析失败。`corepack pnpm install --frozen-lockfile --force` 之后，`open-document-wiring.ts` 单独 lint 退出码 0。那次不算本 tip 的全量结果。

## corepack pnpm run check

在 `1f45e51` 上退出码 0。

format、lint、typecheck、typecheck:core 退出码 0。`check-file-size: 431 source files within hard limits`。dependency-cruiser：`no dependency violations found (336 modules, 983 dependencies cruised)`。`check-core-tests: core tests stay on the node project`。三份 license 退出码 0。`check-one-slice: 1 feature slice(s)`。`check-commits: subjects match Conventional Commits`。`check-hotspots: named hotspot diffs are within 30 lines`。`check-pr-size: 115 non-generated lines`。codegen 1 generator，随后 `git diff --exit-code` 退出码 0。

## corepack pnpm test

在 `1f45e51` 上跑了一次。Vitest 174 个文件，750 通过，3 跳过，类型错误 0。退出码 0。

3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。这不是具名 G9 通过。

文献库 UI：`packages/features/library/test/ui/library-screen.test.tsx` 13 通过，包含在上面这 750 里。

## workers/parser

工作目录 `workers/parser/`。Python 3.11.18。uv 0.13.6。pyright 1.1.407。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `uv run ruff check .` | 0 | All checks passed |
| `uv run ruff format --check .` | 0 | 72 files already formatted |
| `uv run pyright` | 0 | 0 errors, 0 warnings, 0 informations |
| `uv run lint-imports` | 0 | 7 kept, 0 broken |
| `uv run pytest` | 0 | 181 passed |
| `uv run pytest tests/api/test_server.py --tb=short -q` | 0 | 4 passed |
| `uv run pytest tests/protocol --tb=short -q` | 0 | 29 passed |

后两行是 worker-health 的命令。用例已包含在上面的 181 里，又各跑了一次，退出码 0。

## node tools/compare-spec-bytes/compare.mjs

在写入本证据文件之前跑过。退出码 0。PRD.md 36 parts match，196205 bytes。ARCHITECTURE.md 66 parts match，372952 bytes。RULES.md span 2795 bytes。对照 `f8d5d01dc8af81b73689c7229c983192551fa6fe`。

## 范围

`origin/main...HEAD` 在 `1f45e51` 上是 3 个文件，108 行插入、7 行删除：

- `packages/features/library/src/ui/library-app.tsx`
- `packages/features/library/src/ui/library-table.tsx`
- `packages/features/library/test/ui/library-screen.test.tsx`

core 目录（domain、application、`index.ts`、`pure.ts`、`contracts/src/ipc/**`）diff 是 0。`apps/desktop`、菜单、CSP、协议、`approvals.md`、计划正文 diff 是 0。没有 import reader。
