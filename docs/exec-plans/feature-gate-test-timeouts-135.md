# 执行计划

收 [Issue #135](https://github.com/wisdom-km/open-immerse-v2/issues/135)。基线是 `origin/main` 的 `88857a54231174707e8f40efe9bfe8f24e1e5b0a`。路径按分支名 `feature/gate-test-timeouts-135`。第一笔提交只有本文件。

本任务不跨切片，也不改 worker。预计改动远小于 300 行。[docs/exec-plans/README.md](README.md) 写小任务不用本目录。交接仍要求第一笔只放这份计划，然后在同一条 Draft PR 里改测试。不等另一次 Forge 审查才写实现：Issue #135 评论已经记下 Wisdom 2026-11-04 13:47 的原话。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

## 现状理解

- 已有行为：`tools/gate-remediation/g3.test.ts` 只有一条 `it`，从第 8 行到第 52 行。它用 `spawnSync` 起两次进程：第一次是 `node tools/gate-remediation/run.mjs --id G3 -- tsc --noEmit --pretty false --project tools/gate-fixtures/g3/tsconfig.json`，第二次是 `node tools/typecheck.mjs`（里面再跑根目录 `tsc --noEmit --project tsconfig.json`）。这条 `it` 没有第三个超时参数。`vitest.config.ts` 的 `test` 也没有 `testTimeout`，Vitest 5.0.5 默认 5000ms。同目录的 `g1.test.ts` 也是两次 `spawnSync`，同样没有超时参数。`tools/check-deps/boundaries.test.ts`、`tools/check-deps/contracts-kernel.test.ts`、`tools/check-deps/real-tree*.test.ts`、`tools/check-one-slice/real-tree.test.ts` 已经把超时写在 `it` 的第三个参数上（`30_000` 或 `120_000`）。`tools/codegen/hand-edit.test.ts` 用的是选项对象 `{ timeout: 180_000 }`。
- 相关的节：[ARCHITECTURE.md](../../ARCHITECTURE.md) §12（[docs/arch/12.md](../arch/12.md)）、§13 G3 与 G8（[docs/arch/13.md](../arch/13.md)）。RULES §1.4、§2、§4、§6（N-02、N-06、N-08）、§9。`docs/arch/12.md` 里的「超时」是 Markdown 病态输入放在子线程里、超时即失败，管的是产品测试策略，不管 Vitest 的 `testTimeout`。`docs/prd/` 与 `docs/arch/` 里没有 `testTimeout` 或「给单条门禁测试设 it 超时」的句子。DESIGN 与 `docs/design-principles.md` 不约束这条测试。Issue #135。
- 还没做的部分：给点名的 `g3` 测试加上 `it` 的超时参数。按下面的实测，再给调查里超过 2s、且文件里还没有超时参数的那一条加上同样的参数。断言、`vitest.config.ts`、`.github/` 保持基线。

## 不改的文件

`vitest.config.ts` 保持基线，不写全局 `testTimeout`。`.github/` 保持基线。不删测试，不加 `it.skip` / `describe.skip` / `test.skip`。不改任何断言、夹具或门禁脚本。不改已经写在测试里的 `30_000`、`120_000`、`180_000`。不改 `docs/approvals.md`：13:47 那句不在该文件里，补行不在本次交接允许的路径中。不改 `docs/spec-changelog.md`（不改规格正文）。

不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `package.json`、`pnpm-lock.yaml`。

实现只改 `tools/gate-remediation/g3.test.ts` 与 `tools/eslint/limits.test.ts` 的 `it` 超时参数。证据只加 `docs/evidence/<PR号>/commands.md`。本文件在第一笔之后不再改；「实际」列不回填，结果写在证据里。

## 来源核对

| 来源 | 核对结果 |
| --- | --- |
| Issue #135 正文 | 对得上其中已打开的日志。run [41779821428](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41779821428) 的 attempt 1、job `node`（id `126408869581`）日志有 `tools/gate-remediation/g3.test.ts (1 test \| 1 failed) 5051ms`，以及 `Error: Test timed out in 5000ms`，堆栈指向 `g3.test.ts:8:1`。上一笔提交 `cb5ddf3e39e9264f0dd34e4b289182d77881e42e` 的 run [41779772754](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41779772754) 结论是 `cancelled`，同一条失败日志是 `5105ms`，错误同样是 `Test timed out in 5000ms`。main 上抽查 run [41777985121](https://github.com/wisdom-km/open-immerse-v2/actions/runs/41777985121)（`d2dfcb5229c08db567a32cb833bdde4c5f151d1e`）该文件通过，耗时 `3094ms`，落在正文写的 3.1–4.9s 里。正文其余成功 run 的区间没有逐条再打开。 |
| #135 评论（批准 13:47） | 对得上。评论 [issuecomment-6623647655](https://github.com/wisdom-km/open-immerse-v2/issues/135#issuecomment-6623647655)，`createdAt` `2026-11-04T05:47:22Z`（UTC+8 13:47）。作者 `wisdom-km`。原话「…我这个同意按推荐。」范围写明：另开小分支，给 g3 这类要起子进程的测试设明确超时（如 30s），只改测试文件，不改 CI，与 #131、#59 并行。 |
| Anvil 报告 `/workspace/oi-qa/v2-pr131-03b9b8c/ANVIL.md` | 本机没有这份文件，`/workspace/oi-qa` 也不存在。同一 run 的超时以 GitHub Actions attempt 1 的日志为准（上一行）。正文里的「Box 单独跑约 1.7s」没有从那份报告读到。本机在装好工作区链接之后单独跑该文件，1 passed，1677ms，与「约 1.7s」同量级。 |
| `tools/gate-remediation/g3.test.ts` L8–52 | 对得上。第 8 行是那条 `it`。第 9–24 行是第一次 `spawnSync`（违规样例上的 `tsc`）。第 47–49 行是第二次 `spawnSync`（`tools/typecheck.mjs`）。第 52 行结束。中间的 `expect` 不断言超时。 |

`docs/approvals.md` 截至 `88857a5` 没有 13:47 这一行。最近一行是 2026-11-04 11:41。按 [README.md](README.md)，没记在 `docs/approvals.md` 的不算已批准。交接写明批准记在 #135 评论，并要求计划引用这句原话。本计划照评论引用，不在本 PR 补 `docs/approvals.md`。

## 同类测试与实测

范围：`tools/**/*.test.ts` 里用 `spawnSync` / `execFileSync` 起子进程的文件。`execSync` 没有出现。没有一条测试直接把命令写成 `pnpm`。`g3` 是调查里唯一把 `tsc` 当作子进程的测试。dependency-cruiser 由 `tools/check-deps/check.mjs` 启动，调用方是 `boundaries.test.ts`、`contracts-kernel.test.ts`，以及 `real-tree*.test.ts`（经 `real-tree-cruise.ts`）。

不计入：`tools/check-deps/launch-depcruise.test.ts` 与 `tools/spawn-bin/spawn-bin.test.ts` 把假的 `spawn` 传进去，不启动子进程。

测量在 `88857a5` 上，2026-11-04 13:53（UTC+8）。Node v22.23.4，`corepack pnpm` 10.34.9，Vitest 5.0.5。命令是 `vitest run --no-file-parallelism --maxWorkers=1 --testTimeout=120000`。这个 `--testTimeout` 只用于把每条的真实耗时跑完，不写入 `vitest.config.ts`。90 条用例的耗时合计 33377ms，整次墙钟 36.93s。下面的表是这次调查的每一条。

调查开始时，根上的 `node_modules/@oi` 还不存在，`g3` 的第二次 `tsc` 报 `TS2307 Cannot find module '@oi/contracts'`，该条 1850ms 失败。随后 `corepack pnpm install --frozen-lockfile`（锁文件无改动）补上 `packages/features/jobs/node_modules/@oi/contracts`。13:55 单独重跑 `g3`：1 passed，1677ms。决定用这一笔通过的耗时，不用失败的 1850ms。

| 文件 | 用例 | ms | 结果 |
| --- | --- | --- | --- |
| `tools/compare-spec-bytes/compare.test.ts` | returns the same bytes when the file has no header | 1 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | drops the header when the end marker is present | 0 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | throws when the header end marker is missing | 1 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | joins slices to the original bytes when headers are removed | 0 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | returns the marked body when the closer follows the header | 0 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | cuts one span when both edges occur once | 0 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | throws when the span edge occurs twice | 0 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | accepts a relative path prefix and nothing else | 1 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | returns the first differing byte when a slice changes | 1 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | matches origin/main when the chapter files are joined | 92 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | writes the same prefix manifest that evidence keeps | 72 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | keeps root heading slugs identical to origin/main | 36 | pass |
| `tools/compare-spec-bytes/compare.test.ts` | reports no broken link when tracked and new markdown are checked | 68 | pass |
| `tools/gate-remediation/catalog.test.ts` | keeps the remediation table equal to catalog.json | 29 | pass |
| `tools/gate-remediation/catalog.test.ts` | does not copy remediation sentences into scripts | 49 | pass |
| `tools/gate-remediation/catalog.test.ts` | points every gate id at a script or a dependency-cruiser rule | 1 | pass |
| `tools/gate-remediation/catalog.test.ts` | finds every cited id in the file named beside it | 3 | pass |
| `tools/check-secrets/leak.test.ts` | fails when CI is true and GITLEAKS_BIN is missing (G9) | 2 | pass |
| `tools/check-secrets/leak.test.ts` | skips when GITLEAKS_BIN is unset and CI is not true (G9) | 0 | pass |
| `tools/check-secrets/leak.test.ts` | uses GITLEAKS_BIN when it is set, including under CI (G9) | 0 | pass |
| `tools/check-secrets/leak.test.ts` | fails when CI is 1 and GITLEAKS_BIN is missing (G9) | 0 | pass |
| `tools/check-secrets/leak.test.ts` | skips when CI is 0 and GITLEAKS_BIN is missing (G9) | 0 | pass |
| `tools/check-secrets/leak.test.ts` | skips when CI is false and GITLEAKS_BIN is missing (G9) | 0 | pass |
| `tools/check-secrets/leak.test.ts` | rejects a committed access key that lacks the oitest_ prefix (G9) | 0 | skip |
| `tools/check-secrets/leak.test.ts` | allows a synthetic key that uses the oitest_ prefix (G9) | 0 | skip |
| `tools/check-secrets/leak.test.ts` | rejects the same suffix when the prefix is nottest_ (G9) | 0 | skip |
| `tools/check-deps/contracts-kernel.test.ts` | allows a type-only kernel re-export and rejects a value import | 1523 | pass |
| `tools/check-deps/contracts-kernel.test.ts` | resolves @oi/kernel to the temp marker when the repo paths name index.ts | 533 | pass |
| `tools/check-docs/links.test.ts` | reports a missing file when the link target is absent | 34 | pass |
| `tools/check-docs/links.test.ts` | skips an external link when the scheme is https | 29 | pass |
| `tools/check-docs/links.test.ts` | reports a missing anchor when the slug is absent | 30 | pass |
| `tools/check-docs/links.test.ts` | accepts an anchor when the heading slug matches | 34 | pass |
| `tools/check-docs/links.test.ts` | drops a mark between spaces when the heading contains a left-right arrow | 23 | pass |
| `tools/check-docs/links.test.ts` | drops corner brackets when the heading wraps a note in lenticular brackets | 22 | pass |
| `tools/check-docs/links.test.ts` | drops the section sign when the heading cites a section | 26 | pass |
| `tools/check-docs/links.test.ts` | emits a double hyphen when a removed mark leaves adjacent spaces | 46 | pass |
| `tools/check-docs/links.test.ts` | keeps Chinese characters when the heading is Chinese | 26 | pass |
| `tools/check-docs/links.test.ts` | suffixes the later heading when the same title is repeated | 24 | pass |
| `tools/check-deps/boundaries.test.ts` | allows a matrix edge and rejects the other four M1 examples | 2736 | pass |
| `tools/check-deps/boundaries.test.ts` | rejects electron outside the desktop app and node builtins in the renderer | 1034 | pass |
| `tools/codegen/hand-edit.test.ts` | codegen leaves a diff when a generated protocol model is hand edited (G7) | 4737 | pass |
| `tools/gate-remediation/run.test.ts` | appends the catalog block only when the command exits non-zero | 115 | pass |
| `tools/gate-remediation/run.test.ts` | reports an unknown id after the command and keeps a failing exit code | 148 | pass |
| `tools/gate-remediation/run.test.ts` | keeps exit codes 0 and 7 for a catalog id | 116 | pass |
| `tools/check-deps/real-tree-pure.test.ts` | accepts jobs ui when it imports this slice pure.ts | 1365 | pass |
| `tools/check-deps/real-tree-pure.test.ts` | rejects jobs pure.ts when it imports application (G15) | 1410 | pass |
| `tools/check-deps/real-tree-pure.test.ts` | rejects jobs pure.ts when it imports node:fs (G15) | 1479 | pass |
| `tools/check-deps/real-tree-pure.test.ts` | rejects jobs ui when it imports this slice domain (G15) | 1323 | pass |
| `tools/check-license/reject.test.ts` | rejects GPL, AGPL, and LGPL npm licenses (G10) | 187 | pass |
| `tools/check-license/reject.test.ts` | rejects a lockfile that pins PyMuPDF (G10) | 55 | pass |
| `tools/eslint/limits.test.ts` | rejects complexity over 15 and functions over 80 lines (G2) | 2034 | pass |
| `tools/check-one-slice/slice.test.ts` | rejects two feature slices and allows one slice ui plus core (G18) | 172 | pass |
| `tools/check-one-slice/real-tree.test.ts` | rejects a second real feature slice and passes after that commit is removed (G18) | 307 | pass |
| `tools/check-docs/status.test.ts` | reports a missing status line when the first 40 lines have none | 32 | pass |
| `tools/check-docs/status.test.ts` | reports one missing index when the status table is absent | 33 | pass |
| `tools/check-docs/status.test.ts` | reports a status mismatch when the index token is absent from the file | 31 | pass |
| `tools/check-docs/status.test.ts` | reports a file when the index omits it | 29 | pass |
| `tools/check-docs/status.test.ts` | accepts a file when the index token appears in its status line | 31 | pass |
| `tools/check-license/package-aliases.test.ts` | maps colorama to BSD-3-Clause when pip reports BSD License | 27 | pass |
| `tools/check-license/package-aliases.test.ts` | rejects an unlisted package when pip reports BSD License | 50 | pass |
| `tools/check-license/package-aliases.test.ts` | keeps grimp on BSD-2-Clause when pip reports BSD License | 0 | pass |
| `tools/tsconfig-core/dom.test.ts` | rejects DOM and process globals in the core compile environment (G14) | 543 | pass |
| `tools/gate-remediation/ruff.test.ts` | prints G2 remediation when ruff complexity is too high | 95 | pass |
| `tools/gate-remediation/ruff.test.ts` | prints G1 remediation when ruff format finds a diff | 68 | pass |
| `tools/check-pr-size/limit.test.ts` | rejects a diff over 600 lines unless the commits include a G12 reason | 163 | pass |
| `tools/gate-remediation/g1.test.ts` | prints G1 remediation for a prettier violation that stays outside the required check | 1474 | pass |
| `tools/codegen/drift.test.ts` | codegen leaves a diff when generated output drifted (G7) | 376 | pass |
| `tools/check-license/dev-only.test.ts` | accepts typing_extensions when the license is PSF-2.0 | 31 | pass |
| `tools/check-license/dev-only.test.ts` | rejects an unlisted package with G10 when the license is PSF-2.0 | 56 | pass |
| `tools/check-docs/verbatim.test.ts` | accepts a pair when the bytes match | 32 | pass |
| `tools/check-docs/verbatim.test.ts` | reports a mismatch when the bytes differ | 30 | pass |
| `tools/check-docs/verbatim.test.ts` | accepts a marked span when the bytes outside it differ | 33 | pass |
| `tools/check-docs/verbatim.test.ts` | reports a missing marker when the end line is absent | 29 | pass |
| `tools/gate-remediation/g3.test.ts` | prints G3 remediation for a tsc violation that stays outside the required check | 1850 | fail |
| `tools/check-deps/real-tree.test.ts` | rejects the jobs domain module when it imports react (G13) | 724 | pass |
| `tools/check-hotspots/hotspot.test.ts` | rejects a composition-root diff over 30 lines (G11) | 108 | pass |
| `tools/check-deps/real-tree-ui-application.test.ts` | rejects markdown ui when it imports the jobs application (G15) | 1318 | pass |
| `tools/check-core-tests/real-tree.test.ts` | rejects a vitest environment directive in the jobs core test (G16) | 59 | pass |
| `tools/check-commits/message.test.ts` | rejects a subject outside Conventional Commits | 110 | pass |
| `tools/check-core-tests/environment.test.ts` | rejects a vitest environment directive in a core test (G16) | 100 | pass |
| `tools/gate-remediation/pytest.test.ts` | prints G8 remediation for a pytest fixture that is not collected by default | 1746 | pass |
| `tools/check-license/models.test.ts` | rejects a model manifest whose license is GPL (G10) | 55 | pass |
| `tools/check-deps/real-tree-cross-slice.test.ts` | rejects markdown when it imports a jobs internal module (G5) | 1362 | pass |
| `tools/check-file-size/limit.test.ts` | rejects a source file over 600 lines (G4) | 84 | pass |
| `tools/gate-remediation/import-linter.test.ts` | prints G6 remediation when import-linter rejects pymupdf | 242 | pass |
| `tools/check-docs/cli.test.ts` | exits zero when the fixture tree has findings | 32 | pass |
| `tools/check-docs/cli.test.ts` | ignores fixture links when scanning the repository | 70 | pass |
| `tools/check-deps/real-tree-ingest.test.ts` | rejects jobs when it imports ingest (G5) | 1308 | pass |
| `tools/gate-remediation/pyright.test.ts` | prints G3-pyright remediation for a strict violation | 621 | pass |
| `tools/vitest-collect/no-node-modules.test.ts` | collects no test path under node_modules when vitest lists the suite | 501 | pass |

`leak.test.ts` 里三条会启动 gitleaks 的用例，本机 `GITLEAKS_BIN` 未设置，Vitest 记为 skip，耗时 0ms。没有子进程耗时，不加超时。

13:57 单独重跑 `tools/eslint/limits.test.ts`：1 passed，1510ms。调查里的 2034ms 仍然是「超过 2s」的那一笔。

## 实现

`g3.test.ts` 那条 `it` 的回调和全部 `expect` 保持原样。在调用末尾加上第三个参数 `30_000`，与 `boundaries.test.ts` 已有的写法相同。

`limits.test.ts` 那条 `it` 同样只加第三个参数 `30_000`。它用 `spawnSync` 起 `node tools/gate-remediation/run.mjs --id G2 -- eslint`。回调和断言保持原样。

其余文件不改。

## 计划 / 实际

计划列在开工前填。实际列不回填本文件，写在 `docs/evidence/<PR号>/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件 |  | 本文件 |
| 2 | `g3.test.ts` 与 `limits.test.ts` 各加 `30_000` |  | `docs/evidence/<PR号>/commands.md` |
| 3 | `vitest run` 这两个文件；然后一次 `GATE_BASE=origin/main corepack pnpm run check` |  | 同上 |

不跑全量 `pnpm test`。`test:core` 不适用（`package.json` 没有这个脚本）。不跑 worker pytest。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 另开小分支，给 g3 这类起子进程的测试设明确超时（如 30s）；只改测试文件，不改 CI；与 #131、#59 并行 | Issue #135 评论记录 Wisdom 原话「…我这个同意按推荐。」该原话不在 `docs/approvals.md` | 2026-11-04 13:47 | Wisdom（记录在 [issuecomment-6623647655](https://github.com/wisdom-km/open-immerse-v2/issues/135#issuecomment-6623647655)，不是 `docs/approvals.md` 的一行） |
| `g3` 那条 `it` 加第三个参数 `30_000`，断言不动 | 点名文件。CI attempt 1 为 5051ms，在 5000ms 上超时。本机单独通过为 1677ms。批准写明如 30s。本地不到 2s 仍然加 | 2026-11-04 | 交接与 #135 |
| 调查里超过 2s、且还没有超时参数的，同样加 `30_000`。这一轮只有 `limits.test.ts` 的那一条（调查 2034ms，单独重跑 1510ms） | 交接：超过 2s 的加明确超时，只给有依据的加。单独重跑低于 2s，调查那一笔高于 2s，以调查为准。数字与 `g3` 相同，和已有的 `boundaries.test.ts` 一样写在第三个参数上 | 2026-11-04 | 交接（实现选择用调查那一笔，不是另一次业主决定） |
| 已经写了 `30_000`、`120_000` 或 `{ timeout: 180_000 }` 的测试不改数字 | 明确超时已经在。其中调查超过 2s 的是 `boundaries.test.ts` 第一条（2736ms，已有 `30_000`）和 `hand-edit.test.ts`（4737ms，已有 `180_000`）。改数字会动现有测试，超出「还没有超时」的范围 | 2026-11-04 | 交接 |
| 调查里不超过 2s、且没有超时参数的，不加。含 `g1.test.ts`（1474ms，形状与 `g3` 相同）和 `pytest.test.ts`（1746ms） | 交接只给超过 2s 的加。`g3` 是唯一的点名例外 | 2026-11-04 | 交接 |
| gitleaks 三条 skip 不加超时 | 本机没有 `GITLEAKS_BIN`，耗时 0ms，没有子进程实测 | 2026-11-04 | 交接 |
| 不改 `vitest.config.ts` 的全局 `testTimeout` | 交接写明不做。默认 5000ms 留给短测试；慢的几条用自己的参数 | 2026-11-04 | 交接 |
| 第一笔之后同一 PR 里写实现，不等另一次审查 | 交接写明计划提交之后就改，并开 Draft。模板里「审查通过之前不写实现」与这次交接冲突，以交接为准 | 2026-11-04 | 交接 |

## 证据链接

- `docs/evidence/<PR号>/commands.md`：实现提交之后写入。PR 号以开出的 Draft 为准。上表的耗时也写进该文件。
