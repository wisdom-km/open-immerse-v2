# 执行计划

#67 的契约 PR。只定义 IPC 描述符，并把 settings 现有四条外发命令和一个事件改成由描述符推导。不写生成器，不改 preload，不写 router。

范围只来自已合入的 [feature-preload-codegen-67.md](feature-preload-codegen-67.md) §3.2。基线 `origin/main@9949f5c8e90ed47d6ab517a44c8174aa85613297`（PR #148）。分支 `feature/preload-contract-67`。路径按 [TEMPLATE.md](TEMPLATE.md)。第一笔提交只有本文件。

关联：[Issue #67](https://github.com/wisdom-km/open-immerse-v2/issues/67)。相关验收是 AC-53、AC-67、AC-79、AC-80、AC-100。本 PR 不实现这些验收的运行时行为，只让以后的生成器有输入。

任务类型是 seam 变更。涉及切片是 settings 的契约文件 `packages/contracts/src/ipc/settings.ts`（[docs/arch/13.md](../arch/13.md) 写明 `contracts/src/ipc/<切片>.ts` 算该切片的文件，不是热点）。共享描述符类型本 PR 只有 settings 使用。不改 `packages/features/**`，G18 的切片数是 0。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

交接写明计划提交之后就写描述符和测试，并开 Draft。不等另一次 Forge 审查才写实现。Wisdom 2026-11-04 19:29 原话「都按照你的建议开。」见 [评论 6629443868](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6629443868)。这行还不在 [docs/approvals.md](../approvals.md)。本 PR 不补批准表。

## 现状理解

下面三行是开工时的状态。做完的部分在下表「实际」列。

- 已有行为：`packages/contracts/src/ipc/settings.ts` 手写 `SettingsEgressCommands`（四条 `Promise<Result<...>>`）、五条 `SettingsEgressChannel` 字面量、`SettingsEgressEventPayload = EgressConsentRequired`，以及 `JevRoute`。没有请求 schema，没有幂等，没有 `expose`。错误类型来自 `egress.ts`：`unknown_request` 与 `consent_not_granted` 只有 `code`，后两条命令的错误是 `never`。`packages/contracts/src/index.ts` 第 70–77 行再导出这些名字。`vitest.config.ts` 的 `include` 已有 `packages/contracts/**/*.test.ts`。`@sinclair/typebox` 0.34.52 已在 `@oi/contracts` 的依赖里。仓库没有 `contracts/src/errors.ts`。
- 相关的节：[feature-preload-codegen-67.md](feature-preload-codegen-67.md) §3.1、§3.2、§3.6 与「以后改规格的行」；[docs/arch/09.md](../arch/09.md)；[docs/arch/09-01.md](../arch/09-01.md)；[docs/arch/02-02.md](../arch/02-02.md)；[docs/arch/02-04.md](../arch/02-04.md)；[docs/arch/02-05.md](../arch/02-05.md)；[docs/arch/07-00.md](../arch/07-00.md) 外发同意类型块里的幂等注释；[docs/arch/06.md](../arch/06.md)；[docs/arch/11.md](../arch/11.md)；[docs/arch/13.md](../arch/13.md)。[RULES.md](../../RULES.md) §2 契约先行、§3 第 3 条、N-09、N-18、§8.4。[DESIGN.md](../../DESIGN.md) §4.9 与 [docs/design-principles.md](../design-principles.md) 的 P7。验收原文在 [docs/prd/06-01-01.md](../prd/06-01-01.md)、[docs/prd/06-01-07.md](../prd/06-01-07.md)、[docs/prd/06-01-10.md](../prd/06-01-10.md)、[docs/prd/06-01-12.md](../prd/06-01-12.md)。
- 还没做的部分：没有描述符类型。`SettingsEgressCommands` 还不是从描述符推导的。生成器、`oi-api.d.ts`、`ipc-router` 都不在本 PR。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 第一笔只有本文件 | `9754416` | 本文件 |
| 2 | 新增 `ipc/descriptor.ts`（描述符类型）与 `ipc/error-codes.ts`（本 PR 用到的共用码字符串）。`settings.ts` 用描述符写出四条命令和 `settings.onEgressConsentRequired`，`SettingsEgressCommands` 由描述符推导，导出名不变。`index.ts` 的再导出段不动 | `6f1bc3b` | `packages/contracts/src/ipc/` |
| 3 | 新增 `packages/contracts/test/ipc-settings.test.ts`。现有 `settings-egress.test.ts` 若因错误形状带上 `retryable` 与传输码而不再精确相等，只改断言，不改 `egress.ts` | `6f1bc3b`。断言已改，`egress.ts` 未改 | `packages/contracts/test/ipc-settings.test.ts` |
| 4 | 定向检查：vitest 这一份新测试和被改的 contracts 测试；`tsc -p tsconfig.core.json --noEmit`；`node tools/check-pr-size/check.mjs`；`node tools/check-file-size/check.mjs`；`node tools/check-docs/check.mjs` | 在 `6f1bc3b` 上退出码都是 0。对照 `origin/main` 非生成 729 行，提交说明含 `G12:` | [docs/evidence/152/commands.md](../evidence/152/commands.md) |
| 5 | Draft PR。正文第一行 `Refs #67`。不 force push，不 rebase，不改 CI | Draft [PR #152](https://github.com/wisdom-km/open-immerse-v2/pull/152) | 同左 |

## 本 PR 怎么落 C1–C8

| # | 做法 |
| --- | --- |
| C1 | 代码只动 `packages/contracts/src/ipc/**` 与 `packages/contracts/test/**`。文档只加本文件和 `docs/evidence/<PR号>/`。不改 preload、`run.mjs`、`manifest.json` |
| C2 | `settings.ts` 里每条命令是一份描述符。`SettingsEgressCommands` 用映射类型从这些描述符得出。`index.ts` 不改 |
| C3 | 描述符字段：`channel`、`kind`、命令的 `request?` / `response` 或事件的 `payload`（TypeBox）、`errors`、命令的 `idempotent`、`expose`、可选 `transport`、可选 `snapshotOf`。`transport` 的联合是 `"invoke"` 与 `"dropped-file"`。省略 `transport` 时类型上视为 `"invoke"` |
| C4 | 本 PR 的通道字面量是 `settings.answerEgressConsent`、`settings.withdrawEgressConsent`、`settings.setEgressPromptEnabled`、`settings.listEgressDestinations`、`settings.onEgressConsentRequired`。类型允许 `<切片>.<可选子域>.<操作>`，但不导出 dataDir 或 jobs 描述符 |
| C5 | 错误码来自 `error-codes.ts` 的字符串常量，snake_case。每条命令的 `errors` 含业务码（若有）和三个传输码。`retryable` 是字面量布尔。传输码不写 `detail`。错误对象类型没有 `message`。`unknown_request` 与 `consent_not_granted` 也不写 `detail` |
| C6 | 幂等：`answerEgressConsent` 否、`withdrawEgressConsent` 否、`setEgressPromptEnabled` 是、`listEgressDestinations` 是。五条全部 `expose: false` |
| C7 | 测试断言通道字面量、错误码、幂等与 [docs/arch/07-00.md](../arch/07-00.md) 的注释一致，`expose` 全为 false，并用 TypeBox 检查一份合法样本和一份非法样本。测试不读 `apps/desktop/src` |
| C8 | 不新建 `packages/contracts/src/errors.ts`。共用码只是 `ipc/error-codes.ts` 里的字符串 |

`listEgressDestinations` 不写 `request`，推导出的方法没有参数。另外三条命令的 `request` 对上现有输入字段。Q6 要求传输失败进入每条命令的错误联合，因此 `setEgressPromptEnabled` 与 `listEgressDestinations` 的错误不再是 `never`，而是三个传输码。这是相对今天手写接口的有意变化。`egress.ts` 里的领域错误类型保持只有 `code`，IPC 错误另由描述符推导。

格式要能表达、但本 PR 不导出的形状，只在测试里用 `satisfies` 放一份局部值：进度载荷 `{jobId, done, total, unit}`、`snapshotOf`、`transport: "dropped-file"`。不放进 `settingsIpc`，不新增 jobs 描述符。

## 明确不做

- 不写 `apps/desktop/src/renderer/oi-api.d.ts`，不定义 `OiError<Channel>`。那是方案 §3.3 的生成器输出。描述符让 `errors[].code` 保持字面量，供以后推导。
- 不新增 `jobs.cancel`、`jobs.get`、`jobs.list`、`settings.getPendingEgressConsent`、`edit.getUndoState`，也不新增 dataDir 命令。方案 §3.2 只排了 settings 四条命令加一个事件。
- 不新增 `dropped-file` 的 markdown 描述符。
- 不改 `docs/arch/**`、`RULES.md`、`tools/compare-spec-bytes/manifest.json`、`docs/approvals.md`、`docs/backlog.md`、`docs/spec-changelog.md`。
- 不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。不改 `.github/workflows/**`（N-02）。
- 不加依赖。不手改生成文件（N-09）。不暴露 `markdown.writeFile`（N-18）。contracts 源码不出现 `File`、`window`（G14）。

## 决策记录（Decision Log）

原话在 [docs/approvals.md](../approvals.md) 里同一时间的那一行。19:29 的批准还不在该表。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 顺序是方案 → 契约 PR → 生成器与 `ipc-router` 同一个 PR | 原话「这67的也都按照你的建议去做吧。」[approvals.md](../approvals.md) 第 72 行 | 2026-11-04 18:29 | Wisdom |
| 契约 PR 只改 `packages/contracts/src/ipc/**` 与其测试，先合 | [Forge 18:05](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628045811)。Forge 排序，非业主决定。18:29 的原话把这个顺序一并说了 | 2026-11-04 | Forge 排序；Wisdom 18:29 复述了顺序 |
| 命名带可选子域；取消走 `jobs.cancel`；状态型事件配 `get<State>`；进度载荷 `{jobId, done, total, unit}`；`handler_threw` 的 message 只进日志；错误码 snake_case | 原话「按推荐」。[approvals.md](../approvals.md) 第 74 行。该行单元格写的是 PR #148，不是 `#67`，所以 `grep "#67"` 不会命中 | 2026-11-04 18:50 | Wisdom |
| 开本契约 PR，按交接只做方案 §3.2 | 原话「都按照你的建议开。」[评论 6629443868](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6629443868)。approvals 还没有这一行，本 PR 不补 | 2026-11-04 19:29 | Wisdom |

## 来源核对

开工时跑了 `gh issue view 67 --json comments` 与 `grep -n "#67" docs/approvals.md`。`#67` 命中 approvals 第 71、72 行。第 74 行是 18:50「按推荐」，正文不带 `#67` 这四个字符。

| # | 来源 | 映射到 |
| --- | --- | --- |
| S1 | [feature-preload-codegen-67.md](feature-preload-codegen-67.md) §3.2 | C1–C3、C6–C8 |
| S2 | 同上 §3.1、Q1、Q6 | C4、C5。jobs、快照命令、dropped-file 的 markdown 描述符不进本 PR。类型留 `snapshotOf`、事件 `payload`、`transport` 联合 |
| S3 | 同上 §3.3 | `oi-api.d.ts` 与 `OiError<Channel>` 归生成器 PR |
| S4 | 同上「以后改规格的行」 | 不改 `docs/arch/**`、`RULES.md`、manifest |
| S5 | 同上 Decision Log | 契约 PR 只改 ipc 与测试，先合 |
| S6 | Issue #67 评论 [6628045811](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628045811) | C1。Forge 排序，非业主决定 |
| S7 | Issue #67 评论 [6628452608](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628452608) | 三步顺序。与 approvals 第 72 行原话一致 |
| S8 | Issue #67 评论 [6628807091](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628807091) | C4、C5。18:50「按推荐」 |
| S9 | PR #148 评论 [6628805042](https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6628805042)、[6628967539](https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6628967539)、[6629043525](https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6629043525) | C5。`detail` 无路径、传输码无 detail、无 `message`。第三轮 PASS 确认固定字段是 `code` 与 `retryable` |
| S10 | PR #148 评论 [6629248653](https://github.com/wisdom-km/open-immerse-v2/pull/148#issuecomment-6629248653)；Issue #67 评论 [6629357419](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6629357419) | 基线 `9949f5c`。本 PR 是剩余两步里的契约 PR |
| S11 | [docs/approvals.md](../approvals.md) 第 71、72、74 行 | 与 S6 的后续批准、S7、S8 原话一致。第 71 行是 18:28「67那个按推荐。」，管的是方案 PR，不是本 PR 的范围 |
| S12 | [docs/backlog.md](../backlog.md) 外壳三条里的 #67 行 | 背景。状态更新不在本 PR |
| S13 | [docs/arch/07-00.md](../arch/07-00.md) 外发命令注释 | C6 幂等初值 |
| S14 | [docs/arch/06.md](../arch/06.md) 行数表 | 普通源文件建议 400 / 硬 600；测试 600 / 800；函数 50 / 80 |
| S15 | Issue #67 评论 [6629443868](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6629443868) | 19:29 批准开本 PR。表外补记：交接写完之后才出现的批准。`oi-api.d.ts`、jobs 快照、规格文字不在本 PR |

已检索、本仓库没有、也不另寻仓库外结论：交接点名的 `openai-review/REPORT.md`、`openai-review2/REPORT.md`、`pr147-review`、`pr149-review`。

## 证据链接

- [docs/evidence/152/commands.md](../evidence/152/commands.md)：定向检查的命令与退出码。PR #152。

## 自检

- [x] 影响 arch / prd 吗？不改 arch / prd 正文。不一致的规格行仍留在方案的「以后改规格的行」，本 PR 不改那些句子。
