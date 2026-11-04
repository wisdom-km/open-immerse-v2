# 执行计划

[Issue #73](https://github.com/wisdom-km/open-immerse-v2/issues/73) 的第②步：实现 PR。分支 `feature/m3-worker-stderr-logs-73`。从 `origin/main` `3942b78`（契约 PR #144）开。第一笔提交只有本文件。实现在其后的提交。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 CI（N-02）。不加依赖。

交接第 4 节的 A1、D1、D2 已由 Wisdom 批准。本计划不在计划提交后再停一次。16:46 的「随本 PR 改契约」已由评论 `6626612874` 拆出，契约已在 #144 合入。本 PR 不改 `packages/contracts`。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。任务类型是 core 改动。切片是 worker 与 platform-node logging。契约 seam 已在 #144 合入，本 PR 不再改它。

## 现状理解

- 已有行为：`docs/arch/11.md` 第 24 行只有一句：Python worker 把结构化 JSON 写到 stderr，supervisor 收集并加上 `source: worker`，字段服从白名单和禁止项。没有行格式。`packages/contracts/src/diag-events.ts` 在 `3942b78` 已有可选 `source?: "worker"`。键缺失则结果不带 `source`；值严格等于 `"worker"` 则保留；其他值整条 `diag_event_rejected`，不静默丢字段。`packages/platform-node/src/logging/value-guard.ts` 的 `envelope()` 只回写 `ts`、`level`、`feature`，因此即使契约留下了 `source`，守卫仍会丢掉它。`guardDiagRecord` 仍是 `readDiagEvent` 加按字段脱敏，占位是 `REDACTED`（`"[redacted]"`）。Python worker 没有日志模块。`packages/worker-client/` 与 `worker-supervisor.ts` 都不存在。stdout 仍只写端口行和退出行（`docs/arch/10-01.md` 第 28 行）。
- 相关的节：[docs/arch/11.md](../arch/11.md#11-可观测性)、[docs/arch/10-01.md](../arch/10-01.md#101-传输)、[docs/arch/10-05.md](../arch/10-05.md#105-本机-worker-的监管状态机架构评审-p2-6)、[docs/arch/02.md](../arch/02.md#2-分层)（workers 不依赖 TS）、[docs/arch/02-01.md](../arch/02-01.md#21-ui-与业务核心解耦q3wisdom-2026-10-30-原文)、[docs/arch/04-01.md](../arch/04-01.md#41-公共包)、[docs/arch/04-03.md](../arch/04-03.md#43-切片之间的依赖允许的方向)、[docs/arch/05-01.md](../arch/05-01.md)（`platform-node` 可以值导入 `contracts`）、[docs/prd/06-01-13.md](../prd/06-01-13.md#6113-诊断日志ac-101) AC-101、[docs/prd/05.md](../prd/05.md) US-14、[docs/prd/03-01.md](../prd/03-01.md) S10。[DESIGN.md](../../DESIGN.md) §4.5.6 与 [docs/design-principles.md](../design-principles.md#1-原则7-条) 管诊断页的放置和「规则在 core」。本 PR 不改界面，不改这两份正文（N-10）。
- 还没做的部分：ARCH §11 的 stderr 行格式、`tools/compare-spec-bytes/manifest.json` 里对应的 amendment、`value-guard` 保留 `source`、收集纯函数、Python 发送端，以及两侧测试。supervisor 接线不做。

## 不改的文件

不改 `packages/contracts/**`（#144 已合入）。不改 `.github/**`、`package.json`、`pnpm-lock.yaml`、`workers/parser/pyproject.toml`、`workers/parser/uv.lock`。不改 `tools/check-docs/**`、`RULES.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`docs/approvals.md`、`docs/WORKFLOW.md`、`docs/backlog.md`（其他并行 PR 在改这些文件）。不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `apps/desktop/**`，不新建 `worker-supervisor.ts`，不新建 `packages/worker-client/`。不改 `ARCHITECTURE.md` 基线（compare-spec-bytes 的基线仍是 `f8d5d01`）。不加 npm 或 Python 依赖，不改 CI。

`docs/backlog.md` 第 91 行仍写「M3（与 supervisor 一起）」。本 PR 不改这一行。supervisor 接线仍留在以后的 M3 supervisor PR。

## 来源核对

| # | 来源 | 核对结果 |
| --- | --- | --- |
| 1 | 开工批准：[issues/73#issuecomment-6625729128](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6625729128)；[docs/approvals.md](../approvals.md) 第 64 行 | 对得上。评论 id `6625729128`，`2026-11-04T07:58:40Z`。approvals 第 64 行链的是 [issues/28#issuecomment-6625727777](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6625727777)，同一句原话：「按你推荐开第一项，第二项等142合入后再开。」#142 已是 `5645585`，并且是 `3942b78` 的祖先。第②步现在可以从新 main 开。 |
| 2 | [Issue #73](https://github.com/wisdom-km/open-immerse-v2/issues/73) 正文 | 对得上。关联 AC-101。要做的事：Python 结构化 JSON 写 stderr；supervisor 收集并加上 `source: worker`；不写正文、译文、提示词、密钥、绝对路径；`readDiagEvent` 须纳入 `source: "worker"`，避免读入时丢掉。不要做的事：不接 LangSmith，不默认上报，不把文档全文写入日志。正文把任务类型写成 core 改动，并写「随 M3 的 supervisor 一起做」。16:46 已把契约拆到 #144；本 PR 按 D1 不接 supervisor。`source` 纳入允许字段已由 #144 完成，本 PR 不再改契约。 |
| 3 | [docs/arch/11.md](../arch/11.md) 第 8、10–16、22–24 行 | 对得上。第 8 行：每条至少 `ts`、`level`、`event`、`feature`；`event` 只能来自白名单；不记录正文、译文、提示词、密钥、绝对路径。第 10–16 行：6 个事件 `egress.ask`、`budget.refused`、`upstream.server_error`、`scoring.unavailable`、`pipeline.run`、`ipc.oversize`。第 22–24 行：IPC 超限、`requestId` 与 `run_id` 是两个字段、Python worker 写 stderr。行格式仍未定义。本 PR 只补第 24 行，不改第 8–23 行的禁止项和事件名。 |
| 4 | Issue #76（已关闭）与 `packages/platform-node/src/logging/value-guard.ts` | 对得上。`guardDiagRecord` 先 `readDiagEvent`，再按字段脱敏。`REDACTED` 是 `"[redacted]"`。token 类长度不超过 64 且匹配 `^[a-z0-9_.:-]*$`；id 类不超过 128 且匹配 `^[A-Za-z0-9_.:-]+$`。另有 `sk-`、`oitest_`、`authorization`、`bearer`、GitHub 前缀、AWS、长 hex、绝对路径、查询参数和熵检测。本 PR 沿用这些规则，不另写一套。`envelope()` 目前丢掉 `source`，这一处要改。 |
| 5 | [docs/backlog.md](../backlog.md) 第 91 行 | 对得上。原文是 worker 把结构化 JSON 写到 stderr，supervisor 加上 `source: worker`，落地时把 `source: "worker"` 纳入允许字段，时机「M3（与 supervisor 一起）」。允许字段已由 #144 纳入。本 PR 不改这一行。 |
| 6 | [docs/arch/10-01.md](../arch/10-01.md) 第 10 行、[docs/arch/10-05.md](../arch/10-05.md) 第 6 行 | 对得上。第 10 行：本机 worker 由 main 的 `worker-supervisor.ts` 拉起。第 6 行：状态转移在 `worker-client/src/supervisor-state.ts`，拉起进程在 main 的 `worker-supervisor.ts`。仓库里没有这两个文件，也没有 `packages/worker-client/`。本 PR 不建它们。 |
| 7 | [docs/arch/10-01.md](../arch/10-01.md) stdout 约定 | 内容对得上，行号与交接写的 24–26 不一致。第 24 行是 stdin 令牌，并写明不把令牌写入 stdout、stderr 或日志。第 28 行才是 stdout：开始听之后写 `{"port": <整数>}`，停止后再写 `{"event":"exited"}`，两行都不含令牌。诊断 JSON 不写 stdout。 |
| 8 | [tools/compare-spec-bytes/manifest.json](../../tools/compare-spec-bytes/manifest.json) 第 127 行起；[docs/approvals.md](../approvals.md) 第 52 行 | 对得上。`amendments` 从第 127 行开始。每条有 `source`、`old`、`new`；`old` 必须在基线（或前面的替换结果）里唯一出现。approvals 第 52 行是 2026-11-04 14:20「按推荐」，范围是 #136 的 amendments 机制。改 `docs/arch/11.md` 必须加一条 `source` 为 `ARCHITECTURE.md` 的替换。不改 `compare.mjs`，不改基线 `f8d5d01`。 |
| 9 | Forge 建议（Box，Cloud 不可读） | 交接已内联：先把 stderr 行格式写进 ARCH §11，再实现，同一 PR。与评论 `6626601417` 第 1 条一致。本机没有那份 Box 文件，不编造原文。 |
| 10 | `/workspace/oi-v2/openai-review/REPORT.md`（Box） | 本机没有这个路径，仓库里也没有 `REPORT.md` 里关于 #73 的条目。不编造审查结论。规格以 `docs/arch/11.md` 与已合入的 `diag-events.ts` 为准。 |

表外，交接写成之后已经合入或已经批准：

- [issues/73#issuecomment-6626601417](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626601417)。`2026-11-04T08:46:11Z`（UTC+8 16:46）。Wisdom 原话「按推荐」。四项：(1) 同一 PR 补 ARCH §11 行格式，并在 manifest 加 amendment；(2) 不接 supervisor，只做 `oi_worker/diag_log.py` 与 `platform-node/src/logging/worker-stderr.ts`；(3) 单行上限 8192 字节，超长整行丢弃；(4) 契约随当时那个 PR 一起改。第 4 条已被下一条取代。第 1–3 条是本 PR。
- [issues/73#issuecomment-6626612874](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626612874)。Wisdom 原话「1」。契约单独成 PR，先合入。该 PR 已是 #144 `3942b78`。
- [issues/73#issuecomment-6626681427](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626681427)。`2026-11-04T08:50:41Z`（UTC+8 16:50）。Wisdom 原话「OK，那就按照你的建议去执行吧。」范围：可选 `source` 只允许 `"worker"`；其他取值整条拒收（`diag_event_rejected`），不静默丢字段。这是契约规则，#144 已实现。收集端不得把其他 `source` 改写成 `"worker"` 再送进 `readDiagEvent`，否则会绕过这条拒收。

16:46 与 16:50 还不在 `docs/approvals.md`。本 PR 不补。

## 行格式（写入 ARCH §11 第 24 行）

保留原句，后面加上这些子条。这是实现规格。

- 一行一个 JSON 对象，UTF-8，以 `\n` 结尾。写 stderr，不写 stdout。stdout 只留 `{"port": <整数>}` 与 `{"event":"exited"}`（§10.1）。
- 单行上限 8192 字节，按去掉行尾一个 `\n` 或 `\r\n` 之后的 UTF-8 字节计。超过上限整行丢弃，不截断后解析。恰好 8192 字节仍解析。
- 非 JSON、不是对象、缺信封字段，或 `event` 不在白名单：整行丢弃，不落盘原文。丢弃行数的计数留给 supervisor。收集纯函数不设模块级计数器（ARCHITECTURE F-06）。
- 信封是 `ts`（必填、非空）、`level`、`feature`、`event`。worker 不得自己写 `source`。收集端在 `guardDiagRecord` 成功且结果没有 `source` 时补上 `source: "worker"`。已是 `"worker"` 则保留。其他值整行丢弃，不改写成 `"worker"`，也不只删掉该字段。
- `pipeline.run`：`run_id`、`route`、`step`、`status`、`error_class`（string）、`duration_ms`（number），可选 `requestId`。
- `upstream.server_error`：`requestId`（必填）。
- `ipc.oversize`：`channel`、`bytes`（number，非负整数），可选 `requestId`。
- `egress.ask`、`budget.refused`、`scoring.unavailable`：可选 `requestId`。
- 其余键丢弃。字段值的长度和形式沿用 `guardDiagRecord`。不合形式、超长、像密钥或绝对路径，换成 `[redacted]`。
- Python 发送端只发这 6 个事件和上面的字段。未知事件或未知字段在发送端丢掉，不抛异常，不挡住请求。发送端不写 `source`。发出前若 JSON 对象的 UTF-8 字节数超过 8192，整行不写。

交接第 3 节写过「worker 自带则覆盖为 `"worker"`」。16:50 的批准更窄：其他取值整条拒收，不静默丢字段。ARCH 与代码按 16:50 写，不按「覆盖」写。成功结果都带 `source: "worker"`。其他 `source` 值不出现，因为整行被丢掉。

## 实现

1. `docs/arch/11.md` 第 24 行换成上一节。`tools/compare-spec-bytes/manifest.json` 的 `amendments` 追加一条：`source` 是 `ARCHITECTURE.md`，`old` 是第 24 行原句，`new` 是原句加行格式。`old` 在基线 `f8d5d01` 的 `ARCHITECTURE.md` 第 2013 行只出现一次。
2. `docs/spec-changelog.md` 加一行。改了规格，RULES §7 与 §9 要求同一 PR 记下。不改 `docs/approvals.md`。
3. `packages/platform-node/src/logging/value-guard.ts` 的 `envelope()` 在 `event.source === "worker"` 时保留该字段，缺省时不写这个键（`exactOptionalPropertyTypes`，沿用 `requestIdField` 的空对象写法）。不改脱敏规则。
4. 新文件 `packages/platform-node/src/logging/worker-stderr.ts`。导出 `WORKER_STDERR_MAX_BYTES = 8192` 与 `readWorkerStderrLine(line: string): (DiagEvent & { readonly source: "worker" }) | undefined`。步骤：去掉一个行尾 `\n` 或 `\r\n`；UTF-8 字节数大于 8192 则返回 `undefined`，不解析；`JSON.parse` 失败或结果不是普通对象则返回 `undefined`；调用 `guardDiagRecord`；失败则返回 `undefined`；成功则保证 `source` 为 `"worker"`。不改输入对象里已有的非 `"worker"` 的 `source`。从 `packages/platform-node/src/index.ts` 导出函数、常量和类型。
5. 新文件 `workers/parser/oi_worker/diag_log.py`。只用标准库 `json`、`sys`、`datetime`。公开函数 `emit_diag(event, fields, *, level, feature, ts=None, stderr=None)`。`ts` 缺省时用 `datetime.now(timezone.utc).isoformat()`。`stderr` 缺省时写 `sys.stderr`。不写 `sys.stdout`。未知事件、缺必填字段、类型不对、或序列化后超过 8192 字节：返回，不写，不抛。字段里的 `source` 与其他未知键丢掉。`bool` 不是合法的 `duration_ms` 或 `bytes`。
6. 测试：`packages/platform-node/test/worker-stderr.test.ts`、`packages/platform-node/test/value-guard.test.ts` 补 `source` 保留与非法 `source` 整条拒绝、`workers/parser/tests/test_diag_log.py`。用例名 `<结果> when <条件>`。对得上 AC-101 的加编号。只断言返回值和捕获的流。不读源码文本（F-08）。假密钥沿用 #76 已入库的 `oitest_` 样本，不新造密钥形态。不写绝对路径的真实用户目录；路径样本用已有测试里的 `/tmp/fixture/paper.pdf` 这类短字面量，并断言输出里出现 0 次。

## 计划 / 实际

计划列在开工前填。实际列在实现提交之后回填。证据写在 `docs/evidence/<PR号>/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件，并逐条回答来源核对 |  | 本文件 |
| 2 | ARCH §11 第 24 行加行格式；manifest 加一条唯一替换；spec-changelog 加一行 |  | `docs/arch/11.md` |
| 3 | `envelope()` 保留 `source: "worker"` |  | `packages/platform-node/src/logging/value-guard.ts` |
| 4 | `readWorkerStderrLine` 与测试；从 `index.ts` 导出 |  | `packages/platform-node/src/logging/worker-stderr.ts` |
| 5 | `emit_diag` 与 pytest |  | `workers/parser/oi_worker/diag_log.py` |
| 6 | 只跑下面的定向命令。不跑全量 `pnpm test`、全量 pytest、`pnpm run check`、e2e |  | `docs/evidence/<PR号>/commands.md` |

`test:core` 不适用（`package.json` 没有这个脚本）。

定向命令（工作目录除注明外是仓库根）。Node 用 `.nvmrc` 的 v22.23.4，PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。

- `corepack pnpm exec vitest run packages/platform-node/test/worker-stderr.test.ts packages/platform-node/test/value-guard.test.ts packages/contracts/test/diag-events.test.ts`
- `corepack pnpm exec eslint --max-warnings 0` 改动的 `.ts` 文件
- `corepack pnpm exec prettier --check` 同一批 `.ts` 文件（交接命令之外，避免 G1）
- `node tools/typecheck.mjs`
- 在 `workers/parser/`：`uv run pytest tests/test_diag_log.py -q`，以及 `uv run ruff check oi_worker/diag_log.py tests/test_diag_log.py`，以及 `uv run ruff format --check` 这两个文件
- `node tools/compare-spec-bytes/compare.mjs`
- `node tools/check-docs/check.mjs`（发现数不能高于开工时的基线；本计划不改 `tools/check-docs`）

非生成 diff 若超过 600 行，提交说明或 PR 描述写一行 `G12:`，说明 worker 发送端、收集纯函数和 §11 行格式必须在同一个 PR 里对照验收。不调上限（N-08）。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 同一 PR 补 ARCH §11 stderr 行格式，并加 compare-spec-bytes amendment | Wisdom 原话「按推荐」。见 [评论 6626601417](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626601417) 第 1 条。`docs/approvals.md` 还没有这一行。本 PR 不补 | 2026-11-04 16:46 | Wisdom |
| 不接 supervisor，只做 Python 发送端与 TS 收集纯函数 | 同上，第 2 条。`worker-supervisor.ts` 与 `packages/worker-client/` 都不存在 | 2026-11-04 16:46 | Wisdom |
| 单行上限 8192 字节，超长整行丢弃，不截断 | 同上，第 3 条 | 2026-11-04 16:46 | Wisdom |
| `source` 只允许 `"worker"`；其他值整条拒收，不静默丢字段，收集端不改写 | Wisdom 原话「OK，那就按照你的建议去执行吧。」见 [评论 6626681427](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626681427)。契约已在 #144 落地。交接第 3 节的「覆盖」不采用 | 2026-11-04 16:50 | Wisdom |
| 本 PR 不改 `diag-events.ts` | [评论 6626612874](https://github.com/wisdom-km/open-immerse-v2/issues/73#issuecomment-6626612874) 把契约拆出。#144 已合入 `3942b78` | 2026-11-04 16:46 | Wisdom |
| 不改 `docs/backlog.md`、`docs/approvals.md`、`docs/WORKFLOW.md`、`RULES.md`、PR 模板、`tools/check-docs`、CI | 本轮开工指示：这些文件由其他并行 PR 在改。不加依赖，不改 CI | 2026-11-04 | Wisdom |
| 第一笔之后同一 PR 里写实现 | 开工指示把第 4 节视为已批，不必再停。PR 仍是 Draft | 2026-11-04 | Wisdom |

## 证据链接

- `docs/evidence/<PR号>/`：实现提交之后写入命令与退出码。
