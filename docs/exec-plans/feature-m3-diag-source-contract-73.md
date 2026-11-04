# 执行计划

[Issue #73](https://github.com/wisdom-km/open-immerse-v2/issues/73) 的第①步：契约 PR。分支 `feature/m3-diag-source-contract-73`。交接基线 `origin/main` `5645585`（#142）。开工时 `origin/main` 已是 `f9b34e8`，`5645585` 是它的祖先。`packages/contracts/src/diag-events.ts` 与测试从 `5645585` 到 `f9b34e8` 无 diff。本分支从 `f9b34e8` 开。

第一笔提交只有本文件。实现在其后的提交。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 CI（N-02）。

交接写明计划提交之后就改 `diag-events.ts` 与测试，并开 Draft。不等另一次 Forge 审查才写实现。

## 现状理解

- 已有行为：`packages/contracts/src/diag-events.ts` 283 行。`Envelope` 只有 `ts`、`level`、`feature`（第 33–37 行）。`readEnvelope`（第 108–116 行）只拷这三个字段。`readDiagEvent` 丢掉其余键，因此 `source` 也会被丢掉。`DIAG_EVENT_IDS` 有 6 个事件。测试在 `packages/contracts/test/diag-events.test.ts`（179 行）。`packages/contracts/src/index.ts` 第 96–106 行再导出 `readDiagEvent` 与 `DiagEvent` 等，没有单独导出 `Envelope`。
- 相关的节：[docs/arch/11.md](../arch/11.md#11-可观测性)（每条至少 `ts` / `level` / `event` / `feature`；worker 由 supervisor 加上 `source: worker`）、[docs/arch/04-01.md](../arch/04-01.md#41-公共包) 第 24 行（`diag-events.ts` 是诊断事件名与字段白名单）、[docs/prd/06-01-13.md](../prd/06-01-13.md#6113-诊断日志ac-101) AC-101、[RULES.md](../../RULES.md#2-分支提交与-pr) §2、[RULES.md](../../RULES.md#9-definition-of-done) §9、[docs/arch/13.md](../arch/13.md#13-ci-门禁) G11 / G12。[DESIGN.md](../../DESIGN.md) §4.5.6 与 [docs/design-principles.md](../design-principles.md#1-原则7-条) §1 管诊断页的放置和「规则在 core」，本 PR 不改界面。任务类型是 seam 变更，切片是 contracts。
- 还没做的部分：`Envelope` 还没有可选 `source?: "worker"`。非法 `source` 现在被静默丢掉，而不是整条拒绝。ARCH 的 worker stderr 格式、Python 发送端、`platform-node` 收集、8192 字节上限都留给实现 PR。

使用方只有 `packages/platform-node`：`src/logging/value-guard.ts`（`guardDiagRecord`；`envelope()` 第 113–122 行重建 `{ ts, level, feature }`）和 `src/logging/file-logger.ts`。`packages/features/` 与 `apps/` 没有 import。`tools/codegen` 不生成这个文件。

`node tools/check-docs/check.mjs` 在 `f9b34e8` 上是 9 条，全是既有 status。本计划不新增发现。

## 不改的文件

不改 `docs/arch/**`、`ARCHITECTURE.md`、`docs/prd/**`、`PRD.md`、`RULES.md`、`docs/approvals.md`、`docs/backlog.md`、`docs/spec-changelog.md`。不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `.github/**`、`tools/**`、`package.json`、`pnpm-lock.yaml`、manifest。不改 `workers/`、`packages/platform-node/**`、`packages/contracts/src/index.ts`。`index.ts` 已导出 `DiagEvent`，`source` 是它的字段，不需要新类型。

`platform-node` 的 `envelope()` 会丢掉 `source`。这是预期，留给实现 PR。本 PR 不能让它的现有测试失败。

## 来源核对

| # | 来源 | 核对结果 |
| --- | --- | --- |
| 1 | [issues/73#issuecomment-6626601417](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626601417) | 对得上。评论 id `6626601417`，`2026-11-04T08:46:11Z`（UTC+8 16:46）。Wisdom 原话「按推荐」。四项是：(1) 同一 PR 补 ARCH §11 worker stderr JSON 行格式，并在 `tools/compare-spec-bytes/manifest.json` 加 amendment；(2) 不接 supervisor，只做 `oi_worker/diag_log.py` 与 `platform-node/src/logging/worker-stderr.ts`；(3) 单行上限 8192 字节，超长整行丢弃；(4) `diag-events.ts` 增加可选 `source: "worker"`，随本 PR 一起改。不加依赖、不改 CI。第 4 条被下一行取代。第 1–3 条留给实现 PR。本 PR 不加依赖、不改 CI。 |
| 2 | [issues/73#issuecomment-6626612874](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626612874) | 对得上。评论 id `6626612874`，`2026-11-04T08:46:50Z`（UTC+8 16:46）。Wisdom 原话「1」。范围写明取代 `6626601417` 第 4 条的「随本 PR 一起改」。拆两步：① 契约 PR 只给 `packages/contracts/src/diag-events.ts` 加可选 `source: "worker"` 和测试，先合入；② 之后再开实现 PR。本文件就是第①步。 |
| 3 | [RULES.md](../../RULES.md) 第 64 行 | 对得上。原文是契约（`packages/contracts`）改动单独成 PR，先合入，再开实现 PR；契约 PR 的非生成代码超过 200 行时，在 PR 描述写明不拆的理由（G12）。本 PR 按此单独开。实现预计远小于 200 行。执行计划与 `docs/evidence/<PR号>/` 是交接要求的文档，不是契约代码。 |
| 4 | [docs/arch/13.md](../arch/13.md) 第 21 行 | 对得上。G12：非生成代码改动大于 600 行要拆分或写明理由；只改 `packages/contracts` 的契约 PR，非生成代码大于 200 行要写明不拆的理由。`tools/check-pr-size/check.mjs` 的 `contractsOnly` 要求每个非生成文件都在 `packages/contracts/` 下才套 200 行。本 PR 按交接还要本计划和证据目录，机器上限因此是 600。仍把契约代码加测试压在 200 行以内，整份 diff 也压在 200 行以内；超过再在 PR 描述写 `G12:`。 |
| 5 | G11 / [RULES.md](../../RULES.md) 第 196 行；[tools/check-hotspots/check.mjs](../../tools/check-hotspots/check.mjs) 第 5–6 行 | 对得上，结论是本文件不是热点。第 196 行：被两个以上切片 import 的契约文件是热点（G11）。`check.mjs` 第 5–6 行只有具名热点 `composition-root.ts`、`slots.ts`，改动上限 30 行；脚本不按 import 图加契约文件。全库检索：import `diag-events` / `readDiagEvent` / `DiagEvent` 的实现只有 `packages/platform-node` 的 `value-guard.ts` 与 `file-logger.ts`。`platform-node` 是基础设施，不是功能切片。`packages/features/` 与 `apps/` 没有 import。PR 描述热点文件写「无」。仍把 `diag-events.ts` 的 diff 控制在 30 行以内。 |
| 6 | [Issue #73](https://github.com/wisdom-km/open-immerse-v2/issues/73) 正文 | 对得上。正文「要做的事」：「落地本条时要把 `source: "worker"` 纳入允许字段，避免收集后再读入时把 `source` 丢掉。」关联 AC-101。任务类型在正文里写的是 core 改动、随 M3 supervisor。16:46 的「1」把它的契约部分拆成先合入的 seam PR。正文「不要做的事」：不在契约 PR 里改 worker。本 PR 遵守。 |
| 7 | [docs/arch/11.md](../arch/11.md) 第 8、24 行 | 对得上。第 8 行：每条至少有 `ts`、`level`、`event`、`feature`，`event` 只能来自白名单。第 24 行：Python worker 的结构化 JSON 写 stderr，supervisor 收集并加上 `source: worker`，字段服从白名单和禁止项。本 PR 只让读入保留严格等于 `"worker"` 的 `source`。不写 worker，不改 supervisor。 |

表外补记，交接表写成之后出现，行为与交接 §2 一致：[issues/73#issuecomment-6626681427](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626681427)。评论 id `6626681427`，`2026-11-04T08:50:41Z`（UTC+8 16:50）。Wisdom 原话「OK，那就按照你的建议去执行吧。」范围：可选 `source` 只允许 `"worker"`；其他取值整条拒收（`diag_event_rejected`），不静默丢字段。

[docs/approvals.md](../approvals.md) 第 64 行是 2026-11-04 15:57「按你推荐开第一项，第二项等142合入后再开。」，#73 等 #142。#142 已是 `5645585`。16:46 与 16:50 的两则还不在 `approvals.md`。本 PR 不补。

## 实现

只改 `packages/contracts/src/diag-events.ts` 与 `packages/contracts/test/diag-events.test.ts`。

`Envelope` 增加 `readonly source?: "worker"`。`DiagEvent` 各分支经交叉类型继承，不逐支再写。

`readEnvelope`：`ts` / `level` / `feature` 的现有规则不变。`source` 键不存在时返回值不带这个键。值严格等于 `"worker"` 时保留。其他任何值（其他字符串、非字符串、`null`）返回 `undefined`，由 `readDiagEvent` 变成 `diag_event_rejected`。不静默丢掉该字段。白名单外的其他键仍然丢弃。

不导出新类型，不改 `index.ts`。

测试：现有用例不改断言。补上：

- 带 `source: "worker"` 的合法事件为 ok，结果 `source === "worker"`。六个事件各至少一例。
- 不带 `source` 为 ok，结果没有 `source` 键。
- `source` 为 `"main"`、`""`、`1`、`null`、`{}` 都是 `diag_event_rejected`。
- 带 `source: "worker"` 时，白名单外的键仍被丢掉。
- `DiagEvent` 可以带 `source?: "worker"`。其他字面量用带原因的 `// @ts-expect-error`（RULES §1.1，不用 `@ts-ignore`）。

## 计划 / 实际

计划列在开工前填。实际列在实现提交之后回填。证据写在 `docs/evidence/<PR号>/commands.md`（PR 号要等 Draft 开出来）。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件，并逐条回答来源核对 |  | 本文件 |
| 2 | 改 `diag-events.ts` 与测试。不改 `index.ts`、ARCH、worker、platform-node |  | `packages/contracts/src/diag-events.ts` |
| 3 | 只跑交接列出的定向命令，另对这两个 TS 文件跑 Prettier，避免 CI 的 G1 失败。不跑 e2e，不跑全量 `pnpm test`，不跑 `pnpm run check` |  | `docs/evidence/<PR号>/commands.md` |

`test:core` 不适用（`package.json` 没有这个脚本）。

定向命令：

- `corepack pnpm exec vitest run packages/contracts/test/diag-events.test.ts packages/platform-node/test/value-guard.test.ts packages/platform-node/test/file-logger.test.ts`
- `corepack pnpm exec eslint --max-warnings 0 packages/contracts/src/diag-events.ts packages/contracts/test/diag-events.test.ts`
- `node tools/typecheck.mjs`
- `node tools/check-hotspots/check.mjs --base origin/main`
- `node tools/check-docs/check.mjs`（发现数不能高于 9）

Node 用 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 契约单独成 PR，先合入 | Wisdom 原话「1」。见[评论 6626612874](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626612874)。取代「随本 PR 一起改」 | 2026-11-04 16:46 | Wisdom |
| `source` 只允许 `"worker"`，其他值整条拒绝 | Wisdom 原话「OK，那就按照你的建议去执行吧。」见[评论 6626681427](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626681427) | 2026-11-04 16:50 | Wisdom |
| 不加依赖、不改 CI；ARCH、supervisor、8192 留给实现 PR | [评论 6626601417](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626601417) 的第 1–3 条与「不加依赖、不改 CI」。第 4 条已由「1」拆出 | 2026-11-04 16:46 | Wisdom |
| 从 `f9b34e8` 开分支，不从 `5645585` 开 | #142 已合入。其后只有文档提交 `f9b34e8`，契约文件无 diff。15:57 的批准是等 #142 之后从新 main 开 | 2026-11-04 | 本计划 |
| 第一笔之后同一 PR 里写实现 | 交接写明计划提交之后就改，并开 Draft | 2026-11-04 | 交接 |
| 不改 `approvals.md` | 16:46 与 16:50 尚未记入。交接没有把这个文件列入改动 | 2026-11-04 | 交接 |
| 热点文件写「无」 | 只有 platform-node import。具名热点脚本不含本文件 | 2026-11-04 | 本计划 |

## 证据链接

- `docs/evidence/<PR号>/commands.md`：实现提交之后补。
