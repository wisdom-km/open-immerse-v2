# 执行计划

分支 `feature/reading-generation-table-174`。基线是远端 `main` `8c7c18e8ebea1b92f00a8f07f330ef8534ae603f`（PR #183 squash 合入，唯一 parent `7d4b19e0a1064065de4be03adaf63f49cc27cace`，tree `b22660212f1cfc57c8fb1c5ceecdd213dc985821`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 12:04 行。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不写代际表，不改两个页码 command，不写测试实现，不改规格正文。本文件不是那个 PASS。F-08 是另一条 Draft，本分支不改 `apps/desktop/test/parse-capability-surface.test.ts`。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。[docs/design-principles.md](../design-principles.md) 的 P4、P7 保持：这一批没有界面。

任务类型：实现阶段是 core 改动。切片只有 `library`。本两笔是纯文档。

## 现状理解

- 已有行为：`8c7c18e` 上 `createGetProgressPageCommand` 与 `createSetProgressPageCommand` 已从 `packages/features/library/src/index.ts` 导出。它们各收一个已合入用例，没有代际参数。请求门按已合入描述符的接受范围手写。合法请求才调用用例。成功体的 generation 原样来自请求，不证明代际仍活着。读成功若页不是 `null` 且不是安全正整数，返回 `invalid_payload`，结果不含该页。四条契约仍是 `expose: false`。codegen 只把 `expose === true` 写入 preload、`Window["oi"]` 和 `ipcRegistry`。`apps/desktop/src` 没有这两条页码通道，也没有 bind / revoke 的实现。
- 相关的节：[docs/prd/08.md](../prd/08.md)「M2 ③ 本批归属」、[docs/arch/02-05.md](../arch/02-05.md) 页级进度段、[docs/arch/05-01.md](../arch/05-01.md) 层间图、[docs/arch/05-02.md](../arch/05-02.md) F-01、F-02、F-03、F-06、F-07、F-08、F-15、[docs/arch/06.md](../arch/06.md)、[docs/arch/09-01.md](../arch/09-01.md)、[docs/arch/12.md](../arch/12.md)、[DESIGN.md](../../DESIGN.md) §12.2、UIX-56、UIX-57、[docs/design-principles.md](../design-principles.md) P4、P7、[RULES.md](../../RULES.md) §1.1、§2、§8、§9、N-03、N-10。
- 还没做的部分：内存代际表，`bindReadingAsset` 与 `revokeReadingAsset` 的 handler，以及让已合入的两个页码 command 在旧代际上拒绝且不调用用例。`expose` 仍不改为 true。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6731960395](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6731960395) | 对得上。Wisdom 2026-11-09 12:04 Asia/Shanghai 原话是「按推荐：两句原句都批准，两个 Draft 并行，代际表先合」。评论登记了第 10 节原句全文。本分支只做代际表这一句。F-08 原句由另一 Draft 实施。GitHub `created_at` 是 `2026-11-09T04:05:18Z`。台账时间用评论正文里的 12:04。 |
| 仓库外 `next-generation-plan.md` | 第 4–9 节 | 本文件的行为、预算和验收按那几节写，并逐条对上第 10 节原句。第 11、12 节的风险与停点也写在下面。 |
| [docs/arch/05-01.md](../arch/05-01.md) | MAIN 的出边 | 对得上。MAIN 只到 ADP、APP、PN、PV。没有 MAIN → C。`apps/desktop/package.json` 没有 `@oi/contracts`。desktop main 不能为了 `Value.Check` 去 import 契约。 |
| [packages/features/library/package.json](../../packages/features/library/package.json) | dependencies | 对得上。已有 `@oi/contracts`。没有直接依赖 `@sinclair/typebox`。本批不加这个依赖。 |
| [apps/desktop/src/main/composition-root.ts](../../apps/desktop/src/main/composition-root.ts) | 装配根 | 对得上。27 行。热点。本批 diff 为 0。 |
| [apps/desktop/src/renderer/slots.ts](../../apps/desktop/src/renderer/slots.ts) | 热点 | 对得上。3 行。本批 diff 为 0。 |
| [apps/desktop/src/main/library-wiring.ts](../../apps/desktop/src/main/library-wiring.ts) | 装配 | 对得上。140 行。本批 diff 为 0。 |
| [packages/features/library/src/adapters/library-main.ts](../../packages/features/library/src/adapters/library-main.ts) | `createLibraryMain` | 对得上。135 行。本批 diff 为 0。生产进程不创建代际表。 |
| [packages/features/library/src/adapters/ipc-handlers.ts](../../packages/features/library/src/adapters/ipc-handlers.ts) | 已暴露命令 | 对得上。153 行。只服务 import / list / relocate。本批 diff 为 0。 |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。Forge PASS 这两笔之前不填实现证据。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 |  |  |
| 2 | 只在 `docs/approvals.md` 追加 12:04 原话、第 10 节原句全文、时间和登记链接，并改文末计数。然后停 |  |  |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 |  |  |
| 4 | 按「行为」与「原句对照」实现。规格句子按原句在同一次实现里更新。不在步骤 1、2 |  |  |

## 原句对照

下表每一行都是 12:04 所批第 10 节原句里的一个约束。实现不得少做一行，也不得多做原句没有的事。

| 原句约束 | 本文件落点 |
| --- | --- |
| 单独 Draft | 本分支只做代际表。不包含 F-08。不把 Draft 标成 Ready |
| 实现 `library.bindReadingAsset` 与 `library.revokeReadingAsset` 的 handler | 新建两个 command。见「行为」 |
| 给已合入的两个页码工厂增加代际查找参数 | 改 `createGetProgressPageCommand` 与 `createSetProgressPageCommand` 的签名。不另做一套绕过表的公开 command |
| 代际表是 library application 里 `createReadingGenerationTable` 的闭包内存 | 新文件 `application/reading-generation-table.ts`。`Map` 在工厂闭包里 |
| 不入库 | 不改迁移、CHECK、SQLite。adapter 测试证明行不变 |
| 进程新起为空 | 每次调用工厂得到空表。生产 `startLibrary` 不调用它。真 OS 进程重启未核实，用第二个工厂实例证明 |
| 不用模块级 `let` | 遵守 F-06。状态只在闭包里 |
| 每个文献 id 同时只有一条当前代际，新的 bind 替换旧的 | 表内该 id 只留新的一对。旧 generation 与旧 assetId 不再是当前 |
| 下一个 generation 不是 1 到 `Number.MAX_SAFE_INTEGER` 的整数时 bind 返回 `rejected` 且只带 id，不回绕，也不替换旧代际 | 当前已是上界时拒绝。表内旧代际还在 |
| 请求不合法时四条都返回 `invalid_payload`，不写表，不调用用例 | bind、revoke、get、set 都先过请求门 |
| 请求合法但不是当前代际时，get 与 set 返回 `rejected` 且只带请求的 id 与 generation，不调用两个用例 | 查表在调用用例之前。从未 bind 的合法 id 也是 `rejected`，不是 `not_found` |
| 表内有这对时才调用已合入用例 | 当前代际才进入今天已合入的映射 |
| 读成功若页不是 `null` 且不是安全正整数，仍返回 `invalid_payload`，成功体不含该页 | 保持 #183 的超界读映射。不断言 SQLite 超界读 |
| 成功体的 generation 仍是请求原值 | 不改成表里另存的值。当前代际下两者相同 |
| 先查表再查库 | get / set：表不匹配就不调用用例。bind：先确认文献，成功才写表 |
| revoke 只删除表内当前那一对，不读库也不写库 | revoke 没有库端口 |
| 对不在表里则 `rejected` 且只带请求的 id 与 generation，没有 `not_found` | revoke 与旧代际的 get / set 都如此 |
| bind 在写表之前用已合入的 `createGetProgressPage` 确认文献存在，响应不含页 | bind 收 `GetProgressPage`，不收页码 command。页不进入响应 |
| 没有这篇是 `not_found` 且不写表；库返回 `rejected` 时 bind 返回 `rejected` 且只带 id，不写表 | 失败的 bind 不改表，也不消耗下一个 assetId |
| 只有成功的 bind 才发出 assetId。它是该表进程内从 1 递增的十进制数字字符串，非空，不含斜杠或反斜杠，不是路径，不是文献 id，不计算 PDF 哈希 | 第一个成功的号码是 `"1"`。不读 PDF |
| `expose` 仍是 false。不写入 registry、preload 或生产 `wireIpc` | 不改契约、生成物、`wireIpc` |
| `composition-root.ts`、`slots.ts`、`library-main.ts` 与 `library-wiring.ts` 的 diff 为 0 | 见预算表 |
| 不改两个用例文件、contracts、`ipc-handlers.ts`、`payload-schema.ts` 或 `accept-result.ts` | 见「不改」 |
| 同一次实现只更新三处规格句子，加 changelog 一行和 manifest 的唯一替换，不改基线 | 见「规格后续更新」。步骤 1、2 不改这些文件 |
| 不含 desktop UI、受控协议、settings、密钥、F-08、RULES 或 CI | 见「不改」 |
| 第一笔只有执行计划，第二笔只抄录批准台账，Forge 亲读这两笔 PASS 之后才写实现 | 步骤 1–3 |
| 只开 Draft，不授权 Ready、合入或发版 | PR 保持 Draft |
| AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏保持未验收 | 见验收矩阵 |

## 行为

只在 `packages/features/library/`，外加实现阶段按原句更新的那三处规格、changelog 与 manifest。application 只依赖本切片的 domain、本切片已导出的用例类型，以及 `@oi/contracts` 的类型。不 import desktop、reader、ingest、settings。不值导入 `@sinclair/typebox`。

每个文件一件事。不把代际规则写进 `get-progress-page.ts`、`set-progress-page.ts` 或 `ipc-handlers.ts`。

| 路径 | 只做的事 | 行数预算 |
| --- | --- | --- |
| 新建 `application/reading-generation-table.ts` | 闭包内存。替换、匹配、删除。成功时才发出 assetId | 低于 200，硬上限 600。函数低于 80 |
| 新建 `application/bind-reading-asset-command.ts` | 校验 bind 请求，用 `GetProgressPage` 确认文献，成功才替换表 | 低于 400，硬上限 600 |
| 新建 `application/revoke-reading-asset-command.ts` | 校验 revoke 请求，只删表内当前那一对 | 同上 |
| `application/get-progress-page-command.ts` | 现有请求门之后查表。现在 147 行 | 增加后仍低于 250，硬上限 600 |
| `application/set-progress-page-command.ts` | 同上。现在 153 行 | 同上 |
| `src/index.ts` | 只增加这三个工厂和类型。现在 73 行 | 仍低于 150。不从 `ui/index.ts` 或 `pure.ts` 导出 |
| `test/core/reading-generation-table.test.ts` | 空表、替换、上界、assetId 形状 | 低于 600，硬上限 800 |
| `test/core/bind-reading-asset-command.test.ts` | 注入替身，证明调用次数和错误形状 | 同上 |
| `test/core/revoke-reading-asset-command.test.ts` | 同上。证明不存在库端口 | 同上 |
| 已有的两个 command 测试 | 补旧代际不调用用例。现在 254 与 240 行 | 仍低于 600，硬上限 800 |
| 新建 `test/adapters/reading-generation-sqlite.test.ts` | 真实 SQLite 与 `findById`。bind、revoke 不改行 | 低于 600，硬上限 800 |
| `composition-root.ts` | 现在 27 行 | diff 0 |
| `slots.ts` | 现在 3 行 | diff 0 |
| `library-main.ts` | 现在 135 行 | diff 0 |
| `library-wiring.ts` | 现在 140 行 | diff 0 |
| `ipc-handlers.ts` | 现在 153 行 | diff 0 |

物理行数含空行和注释，按 [docs/arch/06.md](../arch/06.md)。函数参数不超过 4 个。页码工厂是 2 个参数。圈复杂度不超过 15。超过建议上限时，实施说明写明为什么不拆。不预写 `G12:`。非生成 diff 超过 600 行时拆分，或在那次提交说明里写具体理由，不改 600 上限。

id 与 generation 的形状在 bind、revoke 和两份页码 command 里各写各的。不新建 `utils`。不把两个 command 并回一个文件来躲行数。

依赖方向：表不依赖 adapters，也不依赖 SQLite。页码 command 依赖表的 `matches` 和已有用例。bind 依赖 `GetProgressPage` 和表。revoke 只依赖表。测试经 `index.ts` 引用。desktop 不 import library 内部文件。MAIN 不新增到 C 的边。

### 表

`createReadingGenerationTable()` 每次返回一张空表。`Map` 在闭包里。没有模块级 `let`，没有按 `webContents.id` 分表，没有新迁移。

每个文献 id 同时只有一条当前代际。第一个成功的 bind，generation 是 1，assetId 是 `"1"`。同一 id 再次成功，generation 加 1，assetId 用下一个十进制数字字符串，旧的一对不再是当前。当前 generation 已是 `Number.MAX_SAFE_INTEGER` 时，下一次 bind 返回 `rejected` 且只带 id，不回绕，表内旧代际还在，也不发出新的 assetId。失败的 bind 不消耗号码。

assetId 非空，只含十进制数字，因此不含 `/` 或 `\`。它不是路径，不是文献 id，不读 PDF，不算哈希。

第二个工厂实例是空的。这是「进程新起为空」的证明。真的杀掉 OS 进程再拉起，未核实。

### 读与写

两个已导出工厂的第二个参数是表的 `matches(id, generation)`。

| 条件 | 结果 | 表 | 用例 |
| --- | --- | --- | --- |
| 请求不是描述符接受的形状 | `invalid_payload`，`retryable: false`，无附加字段 | 不查、不写 | 不调用 |
| 形状合法，但这对不是当前代际 | `rejected`。只有 `code`、`retryable`、请求的 `id` 与 `generation` | 已查 | 不调用 |
| 这对是当前代际，并且走已合入的成功或错误映射 | 与 #183 相同。读到非 `null` 且非安全正整数的页时 `invalid_payload`，结果不含该页。成功体的 generation 是请求原值 | 已查 | 调用 |

`not_found` 只发生在代际仍是当前、并且用例说没有这篇的时候。错误对象按 `IpcCommandResult` 把字段放在对象上，不嵌套 `detail`。本批不改 `accept-result.ts`。这两种形状在 expose 仍为 false 时不会走到生产 router。

现有测试改成传入一张含有该 generation 的表。不保留一个不查表的公开工厂。

### bind

参数是已导出的 `GetProgressPage` 和这张表。不调用页码 command。用例成功只说明文献在，页不进入响应，超界页也不使 bind 失败。

| 条件 | 结果 | 表 | 库 |
| --- | --- | --- | --- |
| 请求不是只含合法 id 的对象 | `invalid_payload`，无附加字段 | 不写 | 不调用 |
| 用例 `not_found` | `not_found`，无附加字段 | 不写 | 已调用 |
| 用例 `rejected` | `rejected`，只有该 id | 不写 | 已调用 |
| 下一个 generation 不是安全正整数 | `rejected`，只有该 id。不回绕 | 不替换 | 已调用 |
| 成功 | `{ id, assetId, generation }` | 该 id 只留下这一对 | 已调用，不写页 |

### revoke

只有表，没有库端口。

| 条件 | 结果 | 表 | 库 |
| --- | --- | --- | --- |
| 请求不是合法 id 加安全正整数 generation | `invalid_payload` | 不写 | 不调用 |
| 这对不是当前代际 | `rejected`，只有请求的 id 与 generation。没有 `not_found` | 不写 | 不调用 |
| 这对是当前代际 | 成功，返回请求的同一对 | 删掉该 id 的当前一对 | 不调用 |

删掉之后，同一对的 get、set、revoke 都是 `rejected`。get 和 set 不调用用例。别的 id 不受影响。

### 真实装配

生产 `createLibraryMain`、`library-wiring.ts`、`composition-root.ts` 都不改。四条命令不进入 `wireIpc`。这是原句「不写入 registry、preload 或生产 wireIpc」，不是漏接线。

装配证据在 library 的 adapter 测试里完成：真实 SQLite，`findById` 证明 bind 与 revoke 前后 `openedAt` 和 `progressPage` 不变。计 `updateProgress` 次数的无关替身不能充当这条证据。

超界读继续用真实 `createGetProgressPage` 加现有 fake 种子。SQLite 驱动把大整数返回成 number 还是 bigint 仍未核实，这条不断言 SQLite 超界读。

## 不改

`get-progress-page.ts`、`set-progress-page.ts`、`parseProgressPage`、`findById`、`list`、`updateProgress`、CHECK、迁移、contracts、`expose`、`ipc-router.ts`、`payload-schema.ts`、`accept-result.ts`、生成物、`library-main.ts`、`ipc-handlers.ts`、`library-wiring.ts`、`composition-root.ts`、`slots.ts`、desktop UI、转到页码、受控协议、`oi-asset://`、Range、CSP、`openDocument`、`setZoom`、`getZoom`、`reader.setPage`、`session.save`、`session.restore`、settings、safeStorage、密钥、`parse-capability-surface.test.ts`、RULES、CI、门禁、基线 `f8d5d01`、`compare.mjs`、DESIGN、原则。

## 规格后续更新

步骤 1 和步骤 2 不改 PRD、ARCHITECTURE 正文，也不改 [docs/spec-changelog.md](../spec-changelog.md) 或 `tools/compare-spec-bytes/manifest.json`。

实现阶段只更新这三处里「代际策略尚未实现」和「handler 还没挂上」的句子：

- [docs/arch/02-05.md](../arch/02-05.md)：先核代际还是先查库、到上界不回绕、重载后清表，改成已按本句实现。
- [docs/arch/09-01.md](../arch/09-01.md)：library command 能按表拒绝旧代际。
- [docs/prd/08.md](../prd/08.md)：handler 的那一句改成同样的范围。

三处都写成 expose 仍为 false、生产 IPC 仍未开通。不写成重开、`expose=true` 或用户路径已经验收。同时在 changelog 加一行，并只追加 manifest 的唯一替换。不改基线 `f8d5d01`，不改 `compare.mjs`。若文档门禁因此失败，停，不自行扩大规格范围。

## 验收与未验证

实现阶段的测试至少覆盖：

| 证据 | 用什么 | 不用什么 |
| --- | --- | --- |
| 请求不合法 | 注入替身。调用次数为 0。结果是 `invalid_payload`。不写表 | 不把注入说成 SQLite 行为 |
| 旧代际、从未 bind、revoke 之后 | get 与 set 是 `rejected`，只有请求的 id 与 generation。用例次数为 0 | 不用 `not_found` |
| 当前代际的 `null` 与安全整数 | generation 等于请求 | 不断言 SQLite 超界读 |
| 超界读 | 真实 `createGetProgressPage` 加 fake 种子。`invalid_payload`，结果不含该页 | 不断言 SQLite 驱动的大整数类型 |
| 当前代际下用例 `not_found` / `rejected` | 前者无附加字段。后者只有 id 与 generation，不含页 | 不把页放进错误 |
| 新 bind 替换旧代际 | 旧 generation 的 get、set、revoke 都是 `rejected` | 不让两条代际并存 |
| 上界 | 当前已是 `Number.MAX_SAFE_INTEGER`。bind 只带 id。旧代际还在 | 不从 1 再计 |
| revoke 再次撤销 | 仍是 `rejected`，没有 `not_found` | 不读库 |
| assetId | 匹配 `^[^/\\]+$`，是从 1 起的十进制数字，不等于文献 id。响应没有路径 | 不计算 PDF 哈希 |
| 空表与不写库 | 第二个工厂为空。真实 SQLite 的 `findById` 在 bind 与 revoke 前后不变 | 无关替身的调用计数 |
| 公开面 | 现有 `reading-command-surface.test.ts` 不改仍通过。四条通道不在 registry 与 `createOi` | 不读生成源码文本。不改 F-08 那份测试 |
| 热点与装配 | `git diff` 里四份文件为 0 | 不靠改热点来接线 |

| 账本 | 本批 | 不在本批 |
| --- | --- | --- |
| CI | 实现 tip 的 node 与文档门禁。本两笔不跑全量 | 不把 CI 全绿写成 G1–G18 都已有 |
| Cloud 本机 | 实现 tip 全量只跑一次。`GITLEAKS_BIN` 未设置时的 detect 跳过不是具名 G9 通过。没有 Electron 二进制就不得称为 Electron 实跑 | 不把 `a8c0c72` 的 698 通过写成这一批 |
| Box | 生产 IPC 仍不登记这四条。建议 Forge 不单建 Box。不跑就写「未跑」和理由，不写 PASS，不援引 2026-11-09 03:06 | 有协议或 UI 时另定 |
| Windows 真机 | 不跑，也不替代 8 GB 录屏 | AC-11、3A、PRC-01–26、UIX-57、打开 / 滚动 / 重开录屏仍未验收 |

具名 G9 若失败，按 ADR 0005 停止放行并保留原件。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「按推荐：两句原句都批准，两个 Draft 并行，代际表先合」 | 本分支只实施其中代际表这一句。第 10 节原句全文见台账第二笔。链接：[6731960395](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6731960395) | 2026-11-09 12:04 | Wisdom |

F-08 的原句不在本文件的实施范围内。它的登记不能用来改本分支的测试或 runtime。

## 证据链接

- `docs/evidence/<PR号>/`：本两笔无。实现阶段再写。

## 自检

- [ ] 影响 arch / prd 吗？影响。步骤 1 和步骤 2 不改。步骤 4 按原句只更新三处句子、changelog 一行和 manifest 的唯一替换。
