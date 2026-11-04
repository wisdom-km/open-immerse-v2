# 执行计划

收 [Issue #35](https://github.com/wisdom-km/open-immerse-v2/issues/35) 的条目 2 与条目 3。基线 `origin/main@f8d5d01dc8af81b73689c7229c983192551fa6fe`。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-issue35-real-tree`。第一笔提交只有本文件。

Wisdom 2026-11-04 11:41 (UTC+8) 批准并行开工 #35 剩余项（条目 2、3），条件是与 PR #125 无文件重叠（https://github.com/wisdom-km/open-immerse-v2/issues/35#issuecomment-6621928509）。本计划已对照 #125 的文件列表：它在改 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`AGENTS.md`、`docs/prd/**`、`docs/arch/**`、`docs/gate-remediation.md`。本分支不碰那些路径。

交接与本次任务都写明：计划提交之后在本分支继续实现，PR 保持 Draft。RULES §2 与 WORKFLOW 写的是 Forge 审查通过之前不写实现。这里按交接执行，见 Decision Log D1。不 force push，不合入，不改 CI。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

任务类型：core 改动（`jobs` 的 JobId）。门禁用例只在测试里临时写入，不进提交。涉及切片：`jobs`。

## 现状理解

- 已有行为：`packages/features/` 有五个切片（`budget`、`formula-source`、`ingest`、`jobs`、`markdown`），都是 `index.ts` 与 `pure.ts`。`jobs` 另有 `src/domain/job-id.ts`，`sameJobId` 比较两个字符串。`job-id.gen.ts` 与它逐字相同，由 `tools/codegen/manifest.json` 的唯一一条 `generators` 从 `job-id.ts` 复制。`tools/check-file-size/allowlist.json` 忽略这个生成文件。`docs/ci-and-environment.md` 第 31 行仍写着这条复制生成器。`packages/contracts/src/ids.ts` 已有品牌类型 `JobId` 与 `parseJobId`（#109）。五个切片都不在 `pnpm-workspace.yaml` 里。从 `packages/features/jobs` 解析 `@oi/contracts` 得到 `MODULE_NOT_FOUND`。根 `tsconfig.json` 是 `nodenext`，没有 paths。巡航用的 `tools/check-deps/tsconfig.paths.json` 才把 `@oi/contracts` 指到 `packages/contracts/src/index.ts`。
- 相关的节：Issue #35 正文条目 1–4。PRD §8 M1 的故意违规样例。ARCHITECTURE §4.1（`ids.ts`）、§4.3（`jobs` 无出边，任何切片不依赖 `ingest`）、§5.1（domain → contracts）、§5.2 F-03、F-04、F-14、§13 G5、G7、G13–G16、G18。RULES §1.1、§1.4、§2、§3、§4、§6 N-01、N-02、N-03、N-08、N-09、N-10、§8、§9。DESIGN 与 `docs/design-principles.md` §1 P7：这次不改界面规格。`tools/check-deps/build-rules.mjs` 的 `ui-through-seam`、`pure-seam-stays-pure`、`feature-dependency-matrix`、`no-cross-feature-internals`。`tools/check-one-slice/check.mjs` 只看 `git diff --name-only base...HEAD` 里已提交的 `packages/features/*/src/**`。
- 还没做的部分：条目 2 点名的四类样例在真实仓库树上还没有证明。现有 `tools/check-deps/real-tree.test.ts` 只把 `jobs` 拷到临时目录做 G13。`boundaries.test.ts` 与 `tools/check-one-slice/slice.test.ts` 用合成目录。条目 3 的占位复制还在。`docs/backlog.md` 没有 #35 的状态行。

## 来源核对

| 来源 | 对应条目 | 结论 |
| --- | --- | --- |
| Issue #35 正文 | 条目 1–4 | 条目 1、4 已收口，本 PR 不改。条目 2、3 本 PR 做。两件都做完则 PR 正文写 `Fixes #35` |
| `/workspace/oi-v2/pr20-review/REPORT.md` | 条目 1–4 的原始出处 | 云端读不到该路径。以 Issue #35 正文为准，不另造条目 |
| issuecomment-6607963658 | 条目 1 核实；当时条目 2、3 未触发 | 已核对。评论写于 main 还没有第二个切片、contracts 的 `JobId` 也还没作为替换来源落地的时候。现在五个切片已在，`parseJobId` 已在。触发条件成立，不再推迟 |
| issuecomment-6607993150 | 条目 1 改规则 | 已收口。Wisdom 2026-11-03 23:33 决定改 RULES §1.5。PR #104 已合入。`docs/spec-changelog.md` 第 22 行是这次记录。`tools/check-license/dev-only.json` 点名 `typing_extensions`。本 PR 不改 RULES，不改该名单 |
| PR #104、`docs/spec-changelog.md` 第 22 行、`dev-only.json` | 条目 1 | 已收口，证据即这三处。本 PR 不改 |
| issuecomment-6608163566 | `GITLEAKS_BIN` 缺失时 CI 应失败 | 已收口。`tools/check-secrets/leak.test.ts` 的 `fails when CI is true and GITLEAKS_BIN is missing` 在 `CI=true` 且变量缺失时抛错。本 PR 只复核，不改该文件 |
| issuecomment-6613345378 | `CI=1` 也算 CI | 已收口。`countsAsCi` 把非空且不是 `"false"` / `"0"` 的值都算 CI。同文件有 `fails when CI is 1 and GITLEAKS_BIN is missing`。本 PR 不改 |
| issuecomment-6621928509 | 本次并行批准 | 按该条开工。与 #125 的文件列表无重叠才改下面「要改的文件」 |
| `leak.test.ts` 的 `oitest_` / `nottest_` | 条目 4 | 已收口。`rejects the same suffix when the prefix is nottest_` 在该文件。本 PR 不改 |
| `real-tree.test.ts`、`boundaries.test.ts`、`feature-edges.mjs`、PRD §8 | 条目 2 | 本 PR 做。见下节「真实树用例」。不改 `feature-edges.mjs`，不改 `build-rules.mjs`，不改门禁语义 |
| `job-id.gen.ts`、`job-id.ts`、`manifest.json`、`allowlist.json`、`docs/ci-and-environment.md` 第 31 行 | 条目 3 | 本 PR 做。删占位文件与 manifest 条目、allowlist 忽略项，并改第 31 行那一句 |
| `packages/contracts/src/ids.ts`（#109） | 条目 3 的替换来源 | 只导入，不修改。`packages/contracts/**` 在禁碰清单里 |
| `docs/exec-plans/feature-m1-check-docs.md` 第 15 行 | 历史并行约束 | 只作参考。那一行禁的是当时另一支正在改的文件。本 PR 的禁碰以交接和 #125 的文件列表为准 |

PRD §8 里本 issue 没有点名、本 PR 也不新做的样例，现有证明留在原处：超行数在 `tools/check-file-size`；core import React 在 `real-tree.test.ts`（G13，拷贝 `jobs`）与 `boundaries.test.ts`；core 测试渲染在 `boundaries.test.ts`（G16）；PyMuPDF 在 `tools/check-license/reject.test.ts` 与 `tools/gate-remediation/import-linter.test.ts`。F-18 不在条目 2 的清单里。

## Decision Log

- D1（2026-11-04）：计划提交后在本分支继续实现。交接写的是先提交计划再实现。PR 保持 Draft，作者不标 Ready，不合入。
- D2（2026-11-04）：`jobs` → `contracts` 的方向按 ARCHITECTURE §5.1 允许（domain → contracts）。做得到，不改规则，不改 `packages/contracts/**`。导入用相对路径 `packages/contracts/src/ids.ts`。`jobs` 不在 workspace，根 `tsc` 的 `nodenext` 解析不到 `@oi/contracts`。不把 `jobs` 加进 workspace，也不改 `pnpm-lock.yaml`。五个切片保持同一种包声明。
- D3（2026-11-04）：`sameJobId` 的参数改为 `JobId`。`JobId` 与 `parseJobId` 从 `ids.ts` 再导出。不另写解析器，不留 `job-id.gen.ts`。`manifest.json` 的 `generators` 改为空数组。`tools/codegen/copy.mjs` 保留，协议生成仍由 `run.mjs` 在 schema 存在时执行。allowlist 删掉已不存在的生成文件忽略项。这是删豁免，不是加豁免（N-08）。
- D4（2026-11-04）：dependency-cruiser 的新用例写进当前工作区的真实切片目录，跑 `tools/check-deps/check.mjs`，断言失败且输出含 remediation，然后删除，再断言通过。用例之间用锁串行，避免 Vitest 并行文件互相看见探针。现有拷到临时目录的 G13 用例保留，不改写成另一套。
- D5（2026-11-04）：G18 只读已提交的 `base...HEAD`。未提交的写入不会让它失败。证明放在本仓库的临时 worktree（完整树，含现有五个切片），在临时分支上提交探针，跑 `tools/check-one-slice/check.mjs`，再删分支与 worktree。不在功能分支上 `reset`，不改写已推送历史（N-01）。测试文件放在 `tools/check-one-slice/real-tree.test.ts`，与 G18 脚本放在一起。`tools/check-deps/real-tree-*.test.ts` 只放巡航用例。
- D6（2026-11-04）：`pure.ts` 的边界用现行规则证明，不改 `build-rules.mjs`。能：本切片 `src/ui` 导入本切片 `pure.ts`（`ui-through-seam` 不禁 `pure.ts`）。不能：`pure.ts` 导入 `application`；`pure.ts` 导入 `node:fs`（`pure-seam-stays-pure` 的 `reachable` 与 shell IO）；本切片 `src/ui` 导入本切片 `domain`。`markdown-parser-not-in-renderer` 已在规则里，本 PR 不另造解析器探针。
- D7（2026-11-04）：禁碰清单整份遵守。需要新的 remediation 目录条目或 `docs/spec-changelog.md` 行时只写进 PR 正文。`docs/ci-and-environment.md` 与 `docs/backlog.md` 不在 #125 的文件列表里，本 PR 改这两份。不改 `docs/approvals.md`。

## 不改的文件

`PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`AGENTS.md`、`docs/spec-changelog.md`、`tools/gate-remediation/catalog.json`、`docs/gate-remediation.md`、`docs/prd/**`、`docs/arch/**`、`tools/compare-spec-bytes/**`、`docs/approvals.md`、`packages/contracts/**`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`.cursor/environment.json`、`.cursor/install.sh`、`.github/workflows/**`、`dependency-cruiser.config.mjs`、`tools/check-deps/build-rules.mjs`、`tools/check-deps/feature-edges.mjs`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、根 `package.json`。

不新增运行时依赖。不写密钥。不改门禁上限，不往 allowlist 加豁免。

## 要改的文件与热点声明

切片：`jobs`。G18 只应看见这一个切片的 `src/`。探针文件不提交。

| 文件 | 做什么 | 热点 |
| --- | --- | --- |
| `tools/check-deps/real-tree-ui-application.test.ts` | 本切片之外的 `src/ui` 导入另一切片的 `application`。期望 `ui-through-seam` 与 G15 remediation。删除后巡航通过 | 否 |
| `tools/check-deps/real-tree-ingest.test.ts` | `jobs` 导入 `ingest` 的 `index.ts`。期望 `feature-dependency-matrix` 与 G5 remediation。删除后通过 | 否 |
| `tools/check-deps/real-tree-cross-slice.test.ts` | `markdown` 导入 `jobs` 的 `domain/job-id.ts`。期望 `no-cross-feature-internals` 与 G5 remediation。删除后通过 | 否 |
| `tools/check-deps/real-tree-pure.test.ts` | D6 的四条：能导入本切片 `pure.ts`；不能从 `pure.ts` 到 `application`；不能从 `pure.ts` 到 `node:fs`；不能从 `src/ui` 到本切片 `domain` | 否 |
| `tools/check-deps/real-tree-lock.ts` | 探针期间的互斥。巡航与写文件在 `real-tree-cruise.ts`，避免每条用例各写一份 spawn | 否 |
| `tools/check-one-slice/real-tree.test.ts` | 临时 worktree。同一切片的 ui 与 domain 一次提交通过。再提交第二个切片的 `src` 则 G18 remediation。删掉后通过 | 否 |
| `packages/features/jobs/src/domain/job-id.ts` | `JobId` 与 `parseJobId` 来自 contracts。`sameJobId` 比较两个 `JobId` | 否 |
| `packages/features/jobs/src/index.ts`、`pure.ts` | 再导出 `sameJobId`、`parseJobId`、`JobId` | 否。二者是 seam，不是 G11 点名的装配根 |
| `packages/features/jobs/test/core/job-id.test.ts` | 经 `index.ts` 取 `parseJobId` 与 `sameJobId`。相等为 true，不等为 false | 否 |
| `packages/features/jobs/README.md` | 公开 API 写上再导出的 `JobId` | 否 |
| 删除 `packages/features/jobs/src/domain/job-id.gen.ts` | 占位副本 | 否 |
| `tools/codegen/manifest.json` | `generators` 改为 `[]` | 否 |
| `tools/check-file-size/allowlist.json` | 删掉 `job-id.gen.ts` 的忽略项 | RULES §3 把它列为热点。G11 脚本只数 `composition-root.ts` 与 `slots.ts`。本文件改动控制在 30 行以内，PR 正文声明 |
| `docs/ci-and-environment.md` | 改第 31 行附近：去掉复制生成器那句，写上 `JobId` 来自 contracts | 否 |
| `docs/backlog.md` | 补 #35 状态行 | 否 |
| `docs/evidence/126/commands.md` | 先红后绿的命令记录，以及该 tip 上的 `pnpm check` | 否 |
| 本文件 | 做完后填「实际」列 | 否 |

`tools/codegen` 的现有测试用临时 manifest，不依赖仓库里那条 jobs 复制。协议目录在 codegen 之后应无 diff。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。随后按交接实现，PR 保持 Draft | `53c095e` 只有本文件。随后实现。PR #126 保持 Draft | 本文件 |
| 2 | 先写真实树用例并跑红：探针在树上时门禁非 0 且含 remediation。删探针后再跑，退出码 0。记录进 evidence | ingest 探针退出码 1，含 `feature-dependency-matrix` 与 G5。删除后退出码 0 | [commands.md](../evidence/126/commands.md) |
| 3 | 用例收进仓库后再跑，期望通过。现有 G13 拷贝用例保持通过 | `7b72767`。真实树 8 passed。全量 238 passed，含原 G13 用例 | 同上 |
| 4 | 删 `job-id.gen.ts`，manifest 的 `generators` 为空，allowlist 去掉该忽略项。`job-id.ts` 改用 contracts 的 `JobId`。jobs 的 core 测试通过。`pnpm codegen` 后 `git diff` 为空 | `b63dc88`。jobs core 2 passed。`codegen: 0 generators`，其后工作区干净 | 同上 |
| 5 | 改 `docs/ci-and-environment.md` 与 `docs/backlog.md`。填本表的实际列 | 与步骤 4 同一提交。backlog §4 加了 #35 行 | 同上 |
| 6 | `GATE_BASE=origin/main corepack pnpm run check` 在 `b63dc88` 上跑一次。失败则只重跑失败项 | 退出码 0。`check-pr-size: 588 non-generated lines`。没有失败项 | 同上 |

函数不超过 80 行。不建 `utils`。预计对 `main` 的非生成 diff 低于 600 行。若超过，提交说明或 `PR_BODY` 加一行 `G12:`。

## 真实树用例

每条都在 `finally` 里删除探针。断言两段：写入时失败并含 `gate-remediation:` 块；删除后 `tools/check-deps/check.mjs` 或 `tools/check-one-slice/check.mjs` 退出码 0，且输出不含 `gate-remediation:`。

探针文件名以 `_gate-` 开头，只在测试进程内存在。

1. UI 导入另一切片的 application：在 `markdown/src/ui/` 写入导入 `jobs/src/application/` 下探针的文件。规则名 `ui-through-seam`，remediation 为 G15。
2. 导入 ingest：在 `jobs/src/domain/` 写入对 `ingest/src/index.ts` 的导入。`jobs` 的出边是空的。规则名 `feature-dependency-matrix`，remediation 为 G5。
3. 跨切片内部：在 `markdown/src/domain/` 写入对 `jobs/src/domain/job-id.ts` 的导入。`markdown` → `jobs` 的 `index.ts` 是矩阵允许的，内部文件不是。规则名 `no-cross-feature-internals`，remediation 为 G5。
4. `pure.ts`：按 D6。改 `pure.ts` 的用例先读出原文，`finally` 写回。
5. G18：worktree 里先提交 `jobs` 的 ui 与 domain，对提交前的 SHA 跑检查，期望通过。再提交 `markdown` 的 `src`，期望 `more than one feature slice` 与 G18 remediation。`git reset --hard` 只发生在该 worktree。然后检查再次通过。

## 条目 3 的形状

`packages/features/jobs/src/domain/job-id.ts`：

- `export { parseJobId, type JobId } from "../../../../contracts/src/ids.js"`
- `sameJobId(left: JobId, right: JobId): boolean` 仍是 `left === right`
- `src/index.ts` 与 `src/pure.ts` 再导出这三项
- core 测试只导入 `src/index.ts`。字符串经 `parseJobId` 变成 `JobId` 再比较

`docs/ci-and-environment.md` 第 31 行改为：`jobs` 仍是没有出边的门禁样例，不是 §4.2 的任务状态机；`JobId` 来自 `packages/contracts/src/ids.ts`；复制生成器已删除；`generators` 为空时 `run.mjs` 仍生成协议。G6 那几句不动。

`docs/backlog.md` §4 加一行 #35：条目 1、4 已收口；条目 2、3 由本分支收口。

`docs/spec-changelog.md` 本 PR 不加行。PR 正文留下建议行，等 #125 合入后再补：日期、本 PR、`docs/ci-and-environment.md` 与 `docs/backlog.md`、摘要为删掉 job-id 复制生成器并记 #35 状态。这次不改 PRD / ARCHITECTURE / RULES 的正文。

## 证据链接

- [docs/evidence/126/commands.md](../evidence/126/commands.md)：`b63dc88` 上的命令与退出码。Draft PR 是 #126。
