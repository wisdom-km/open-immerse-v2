# 执行计划

分支 `feature/pr-c-page-handlers-174`。基线是远端 `main` `7d4b19e0a1064065de4be03adaf63f49cc27cace`（PR #182 squash 合入，唯一 parent `3ee1762d3de90cac4754af773b86e20ff93d603e`，tree `39df5413ba05396d0fc2af59186f11950132c208`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 10:38 行。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不写 handler，不写测试实现。本文件不是那个 PASS。第二句代际表、bind / revoke、F-08 都没有被这句批准。附件里「必须逐字复读才算批准」的说法不用于本批；范围以已登记的用户原句为准。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。优先使用系统行为；本批不造控件。

任务类型：实现阶段是 core 改动。切片只有 `library`。本两笔是纯文档。

## 现状理解

- 已有行为：`7d4b19e` 上 `library.getProgressPage` 与 `library.setProgressPage` 仍是 `expose=false`。`createGetProgressPage` 与 `createSetProgressPage` 已从 `packages/features/library/src/index.ts` 导出。读成功的页是 `number | null`，不声明安全整数。写只在 `Number.isSafeInteger(page) && page >= 1` 时写 `progress_page`，不改 `openedAt`，不调用 `updateProgress`。两个用例的输入都没有 generation。codegen 只把 `expose=true` 写入 preload、`Window["oi"]` 和 `ipcRegistry`。`registerIpcRouter` 只绑定 registry 里的命令。`payloadMatches` 对 integer 只看 `Number.isInteger`，生成的 `IpcJsonSchema` 没有 `minimum` / `maximum`。
- 相关的节：[docs/prd/08.md](../prd/08.md)「M2 ③ 本批归属」、[docs/arch/02-05.md](../arch/02-05.md) 页级进度段、[docs/arch/05-01.md](../arch/05-01.md) 层间图、[docs/arch/05-02.md](../arch/05-02.md) F-01、F-06、F-07、F-08、F-15、[docs/arch/06.md](../arch/06.md)、[docs/arch/09-01.md](../arch/09-01.md)、[docs/arch/12.md](../arch/12.md)、[DESIGN.md](../../DESIGN.md) §12.2、UIX-56、UIX-57、[docs/design-principles.md](../design-principles.md) P4、P7、[RULES.md](../../RULES.md) §2、§8、§9。
- 还没做的部分：把这两条命令的请求映射到已合入用例，并把结果映射成契约错误。不建代际表。不实现 `bindReadingAsset` 与 `revokeReadingAsset`。不把 `expose` 改为 true。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6730921424](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6730921424) | 对得上。Wisdom 2026-11-09 10:38 Asia/Shanghai 原话见下方决策记录。评论写明只选 handler 第一句。F-08、代际表、bind / revoke、expose、生产接线及 UI 均不获授权。GitHub `created_at` 是 `2026-11-09T02:39:04Z`。台账时间用评论正文里的 10:38。 |
| 仓库外 `next-handler-plan.md` | 第一句的技术说明 | 只作参考。第二句未批，不实施。其中「必须逐字批准」的表述不覆盖这句已经登记的范围。 |
| [docs/arch/05-01.md](../arch/05-01.md) | MAIN 的出边 | 对得上。MAIN 只到 ADP、APP、PN、PV。没有 MAIN → C。`apps/desktop/package.json` 没有 `@oi/contracts`。desktop main 不能为了 `Value.Check` 去 import 契约。 |
| [packages/features/library/package.json](../../packages/features/library/package.json) | dependencies | 对得上。已有 `@oi/contracts`。没有直接依赖 `@sinclair/typebox`。本批不加这个依赖。 |
| [packages/features/library/src/adapters/library-main.ts](../../packages/features/library/src/adapters/library-main.ts) | `createLibraryMain` | 对得上。135 行。只交出已暴露的 import / list / relocate。本批不改它。真实用例由调用方把已导出的工厂注入 command。 |
| [apps/desktop/src/main/composition-root.ts](../../apps/desktop/src/main/composition-root.ts) | 装配根 | 对得上。27 行。热点。本批 diff 为 0。 |
| [apps/desktop/src/renderer/slots.ts](../../apps/desktop/src/renderer/slots.ts) | 热点 | 对得上。3 行。本批 diff 为 0。 |
| [apps/desktop/src/main/ipc/payload-schema.ts](../../apps/desktop/src/main/ipc/payload-schema.ts) | integer | 对得上。不检查安全整数上界。本批不改它，也不靠它把超界页收成 `invalid_payload`。 |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。Forge PASS 这两笔之前不填实现证据。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `3cc73c2d77b671d86fceb7e45905bac0c0b97c57` 只有本文件，+145 | 该提交 |
| 2 | 只在 `docs/approvals.md` 追加 10:38 原话、时间、范围、来源，并改文末计数。然后停 | `66be7b4374eb39b7701ac8454bcf90af5f50c4a9` 只有 `docs/approvals.md`，+2/-1 | 该提交 |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 | 2026-11-09 10:50 Asia/Shanghai PASS，附两条绑定条件。评论 [6731055619](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6731055619) | 该评论 |
| 4 | 按「行为」实现两个 command、出口和测试。规格句子若因此过时，在同一次实现里同步。不在步骤 1、2 | `a8c0c7262bb80eca97fb17d67fe40d44e25f7270` 只在 `packages/features/library/` 增加两个 command、`index.ts` 出口和三份测试。「规格后续更新」按 10:50 绑定条件不执行。PRD、ARCHITECTURE、`docs/spec-changelog.md` 与 manifest 的 diff 为 0。文档门禁没有因此失败 | [commands.md](../evidence/183/commands.md) |

## 行为

只在 `packages/features/library/`。application 只依赖本切片的 domain、本切片已导出的用例类型，以及 `@oi/contracts` 的类型。不 import desktop、reader、ingest、settings。不值导入 `@sinclair/typebox`。

每个文件一件事。不把新规则写进 `get-progress-page.ts`、`set-progress-page.ts` 或现有 `ipc-handlers.ts`：

| 路径 | 只做的事 | 行数预算 |
| --- | --- | --- |
| 新建 `application/get-progress-page-command.ts` | 校验读请求，调用注入的 `GetProgressPage`，映射结果 | 文件低于 400，硬上限 600。每个函数低于 80 |
| 新建 `application/set-progress-page-command.ts` | 校验写请求，调用注入的 `SetProgressPage`，映射结果 | 同上 |
| `src/index.ts` | 只增加这两个工厂和它们的类型出口。现在 69 行 | 增加后仍低于 150。不从 `ui/index.ts` 或 `pure.ts` 导出 |
| `test/core/get-progress-page-command.test.ts` | 注入替身，只证明调用次数和错误形状 | 低于 600，硬上限 800 |
| `test/core/set-progress-page-command.test.ts` | 同上 | 同上 |
| `test/adapters/progress-page-command.test.ts` | 真实 `createGetProgressPage` / `createSetProgressPage` 加真实 SQLite 或现有 fake 种子 | 同上 |

id 与 generation 的形状在两个文件里各写各的。不新建 `utils`。若一个函数会超过 80 行，拆到上述文件内部的具名函数，不把两个 command 并回一个文件来躲行数。

依赖方向：command → 已有用例类型与 `parseLibraryEntryId`。adapter 测试 → command 出口、两个已有工厂、`createSqliteLibraryRepository`、现有 `withLibrary`。desktop 不 import library 内部文件。MAIN 不新增到 C 的边。

### 读：`createGetProgressPageCommand`

参数是已导出的 `GetProgressPage`。返回与 `LibraryProgressCommands["getProgressPage"]` 相同的 `Promise<Result<...>>`。成功体的 `generation` 原样来自请求。这个字段不证明代际仍活着。

| 条件 | 结果 | 是否调用用例 |
| --- | --- | --- |
| 请求不是只含 `id` 字符串与安全正整数 `generation` 的对象 | `invalid_payload`，`retryable: false`，无 detail | 否 |
| 用例返回 `not_found` | `not_found`，无 detail | 是 |
| 用例返回 `rejected` | `rejected`，detail 只有请求的 `id` 与 `generation` | 是 |
| 用例成功且页为 `null` 或安全正整数 | 成功。页用用例的值，generation 用请求的值 | 是 |
| 用例成功且页不是 `null`、也不是安全正整数 | `invalid_payload`，无 detail。结果里不出现这个页 | 是 |

### 写：`createSetProgressPageCommand`

参数是已导出的 `SetProgressPage`。不调用 `createUpdateProgress`，也不调用 `updateProgress`。

| 条件 | 结果 | 是否调用用例 |
| --- | --- | --- |
| 请求不是只含 `id`、安全正整数 `generation`、安全正整数 `progressPage` 的对象 | `invalid_payload`，无 detail | 否 |
| 用例返回 `not_found` | `not_found`，无 detail | 是 |
| 用例返回 `rejected` | `rejected`，detail 只有 `id` 与 `generation`，不含页 | 是 |
| 用例成功 | 成功。页等于用例返回的那个安全整数。generation 用请求的值 | 是 |

请求门使用 `parseLibraryEntryId` 与 `Number.isSafeInteger(n) && n >= 1`，并拒绝多余字段。这与已合入描述符的接受范围对齐。不把 `Value.Check` 放进 desktop main，也不给 library 增加 `@sinclair/typebox` 依赖。若审查要求必须直接调用 `Value.Check`，因而要改依赖清单或让 MAIN 依赖 contracts，那是阻塞：停，不擅自改。

### 真实装配

生产 `createLibraryMain`、`library-wiring.ts`、`composition-root.ts` 都不改。两个 command 不进入 `wireIpc` 的 handler map。这是批准句「不写入 registry、preload 或生产 wireIpc」，不是漏接线。

装配证据在 library 的 adapter 测试里完成：`withLibrary` 打开真实 SQLite，`createSqliteLibraryRepository` 加真实 `createSetProgressPage` 注入写 command，写入一个安全整数后，用同一个 repository 的 `findById` 断言 `openedAt` 仍是写入前的值、`progressPage` 是写入的页。计 `updateProgress` 次数的无关替身不能充当这条证据。

超界读：真实 `createGetProgressPage` 加现有 fake 的 `seedLibrary`。`parseProgressPage` 会放行大于安全整数的整数。command 必须返回 `invalid_payload`，并且序列化结果里没有该页。SQLite 驱动把大整数返回成 number 还是 bigint 仍未核实，这条不断言 SQLite 超界读。

### 不改

`get-progress-page.ts`、`set-progress-page.ts`、`parseProgressPage`、`findById`、`list`、`updateProgress`、`library-main.ts`、`ipc-handlers.ts`、`0001_lib_entries.sql`、CHECK、contracts、`expose`、`ipc-router.ts`、`payload-schema.ts`、生成物、`library-wiring.ts`、`composition-root.ts`、`slots.ts`、desktop UI、协议、settings、密钥、`parse-capability-surface.test.ts`、RULES、CI、DESIGN、原则。

`composition-root.ts` 与 `slots.ts` 的 diff 都是 0 行。不把业务分支写进这两个热点来换行数。

## 规格后续更新

步骤 1 和步骤 2 不改 PRD、ARCHITECTURE 正文，也不改 `tools/compare-spec-bytes/manifest.json`。

实现阶段，[docs/arch/02-05.md](../arch/02-05.md)、[docs/arch/09-01.md](../arch/09-01.md)、[docs/prd/08.md](../prd/08.md) 里「handler 还没挂上」的句子会过时。那一次只补「页码两条 command 能按请求调用已有用例；generation 是回显；expose 仍是 false；bind / revoke 与代际表仍没有」。不写成重开、`expose=true` 或生产 IPC 已经开通。同时在 [docs/spec-changelog.md](../spec-changelog.md) 加一行，并只追加 manifest 的唯一替换。不改基线 `f8d5d01`，不改 `compare.mjs`。若这三句在实现时并没有过时，就不改它们。

## 验收与未验证

实现阶段的测试至少覆盖：

| 证据 | 用什么 | 不用什么 |
| --- | --- | --- |
| 请求不合法 | 注入的用例，断言调用次数为 0，结果是 `invalid_payload` | 不把这次注入说成 SQLite 行为 |
| `null` 与安全整数成功 | 注入或真实用例均可。generation 等于请求 | 不断言代际仍活着 |
| 超界读 | 真实 `createGetProgressPage` 与 fake 种子。`invalid_payload`，结果不含该页 | 不断言 SQLite 超界读 |
| `not_found` / `rejected` | 注入用例。前者无 detail，后者 detail 只有 `id` 与 `generation` | 不把 detail 里加上页 |
| `openedAt` 与 `updateProgress` | 真实 `createSetProgressPage` 加真实 SQLite，`findById` 读回 | 无关替身的调用计数 |
| 公开面 | 现有 `reading-command-surface.test.ts` 不改仍通过。两条通道不在 registry 与 `createOi` | 不读生成源码文本。不改 F-08 那份测试 |
| 热点 | `git diff` 里 `composition-root.ts` 与 `slots.ts` 为 0 | 不靠改热点来接线 |

| 账本 | 本批 | 不在本批 |
| --- | --- | --- |
| CI | 实现 tip 的 node 与文档门禁。本两笔不跑全量 | 不把 CI 全绿写成 G1–G18 都已有 |
| Cloud 本机 | 实现 tip 全量只跑一次。`GITLEAKS_BIN` 未设置时的 detect 跳过不是具名 G9 通过。没有 Electron 二进制就不得称为 Electron 实跑 | 不把 `7d4b19e` 之前的 683 通过写成这一批 |
| Box | 生产 IPC 不登记这两条。建议 Forge 不单建 Box。不跑就写「未跑」和理由，不写 PASS，不援引 2026-11-09 03:06 | 有协议或 UI 时另定 |
| Windows 真机 | 不跑，也不替代 8 GB 录屏 | AC-11、3A、PRC-01–26、UIX-57、打开 / 滚动 / 重开录屏仍未验收 |

具名 G9 若失败，按 ADR 0005 停止放行并保留原件。

G12：本批不改 contracts。非生成 diff 超过 600 行时拆分或写具体 `G12:` 理由。不预写理由，不改 600 上限。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「批准单独 Draft 接 library.getProgressPage 与 library.setProgressPage 的 handler。调用已合入的 createGetProgressPage 与 createSetProgressPage。成功体的 generation 原样来自请求，不证明代际仍活着。读成功若页不是 null 且不是安全正整数，返回 invalid_payload，成功体不含该页。不建代际表，不实现 bindReadingAsset 与 revokeReadingAsset。不把 expose 改为 true，不写入 registry、preload 或生产 wireIpc。composition-root.ts 与 slots.ts 的 diff 为 0。不含 desktop UI、受控协议、settings、密钥、F-08、RULES 或 CI。第一笔只有执行计划，第二笔只抄录批准台账，Forge 亲读这两笔 PASS 之后才写实现。只开 Draft，不授权 Ready、合入或发版。AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏保持未验收。」 | 只批准页码两条 handler。台账行在第二笔。链接：[6730921424](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6730921424) | 2026-11-09 10:38 | Wisdom |

第二句代际表与 F-08 不在这张表里。没有它们的批准行。

## 证据链接

- `docs/evidence/<PR号>/`：本两笔无。实现阶段再写。

## 自检

- [x] 影响 arch / prd 吗？页码 handler 的句子可能过时。10:50 绑定条件不允许改规格正文，本批这些文件的 diff 为 0。文档门禁在实现 tip 上通过，没有停下。
- [x] Forge 已亲读计划 `3cc73c2d77b671d86fceb7e45905bac0c0b97c57` 与台账 `66be7b4374eb39b7701ac8454bcf90af5f50c4a9` 并 PASS（附条件）。评论 [6731055619](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6731055619)。
