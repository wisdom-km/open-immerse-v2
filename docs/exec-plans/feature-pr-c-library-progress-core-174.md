# 执行计划

分支 `feature/pr-c-library-progress-core-174`。基线是远端 `main` `3ee1762d3de90cac4754af773b86e20ff93d603e`（PR #181 squash 合入，唯一 parent `8259f5d0eaba0442493e86461f4d755cef6f4deb`，tree `eac94be0eed5f327495ebfec188db59a05fea461`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 03:39 行。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不写 `packages/features/library` 的任何实现行。方案审查 PASS、03:26 对 `3ff71e8` 的一次性豁免、以及「继续推进」，都不代替这个停点。03:39 的范围批准也不是执行计划 PASS。只开 Draft。不标 Ready，不合入，不发版。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。优先使用系统行为；本批不造控件。

任务类型：core 改动。切片只有 `library`。G18 只数这一个 `packages/features/*/src/**`。

## 现状理解

- 已有行为：`library.getProgressPage` 与 `library.setProgressPage` 已在 `3ee1762` 定义为 `expose=false` 的内部命令。请求都带 `id` 与 generation。读成功可以是 `progressPage: null`。写请求不接受 `null`。generation 与非空页码是 1 到 `Number.MAX_SAFE_INTEGER` 的整数。这不是篇内页数，也不改 SQLite CHECK。代际不入库。library core 还没有这对用例。现有 `createUpdateProgress` 同时写 `openedAt` 和页，并接受 `null`。`openDocument` 成功后把已经读到的 `progressPage` 写回去。
- 相关的节：[docs/arch/02-01.md](../arch/02-01.md) §2.1、[docs/arch/02-05.md](../arch/02-05.md) 页级进度段、[docs/arch/03-01.md](../arch/03-01.md) §3.1、[docs/arch/04-02.md](../arch/04-02.md) `library` 行、[docs/arch/05-02.md](../arch/05-02.md) F-01、F-03、F-08、F-15、[docs/arch/06.md](../arch/06.md)、[docs/arch/08-03.md](../arch/08-03.md) §8.3、[docs/arch/09.md](../arch/09.md)、[docs/arch/09-01.md](../arch/09-01.md)、[docs/arch/12.md](../arch/12.md) §12、[docs/prd/05.md](../prd/05.md)、[docs/prd/08.md](../prd/08.md)「M2 ③ 本批归属」、[DESIGN.md](../../DESIGN.md) §12.2、UIX-56、UIX-57、[docs/design-principles.md](../design-principles.md) P4、P7、[RULES.md](../../RULES.md) §2、§8、§9。
- 还没做的部分：按 id 读页、只写 `progress_page` 的写页、包出口、fake 与真实 SQLite 测试。handler、`expose=true`、代际表、协议、配置、密钥、UI、F-08 整改都不在本批。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6726168870](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6726168870) | 对得上。Wisdom 2026-11-09 03:39 Asia/Shanghai 原话：「批准按FINAL-CORE-PLAN.md第12节页码core范围实施，含用例、端口、SQLite、fake及测试；先提交计划和批准台账，经Forge审查后编码，只开Draft，不Ready、不合入、不发版，不含F-08另批整改。」本计划只覆盖该评论里的页码 core。F-08 段不实施。 |
| FINAL-CORE-PLAN.md §12 页码 core | Forge 审查后的最终方案 | 对得上。处理见下文「行为」。F-08 段没有被这句原话批准。 |
| [docs/approvals.md](../approvals.md) | 02:37 行 | 对得上已合入的四条契约。那一行明确不含 core。本批的新批准是 03:39，由第二笔提交写入台账。第一笔引用的是上面的 issue 评论，不依赖当时尚未写入的台账行。 |
| [docs/approvals.md](../approvals.md) | 23:45 行 | 对得上页级保存与重开恢复的方向，以及 8 GB 录屏仍未验证。本批不做重开界面，不把录屏标成通过。 |
| [packages/contracts/src/ipc/library-progress.ts](../../packages/contracts/src/ipc/library-progress.ts) | `getProgressPage`、`setProgressPage` | 对得上契约形状。成功响应含 `id`、`generation`、`progressPage`。本批用例不接收、不返回 generation。handler 以后再把内存代际填进契约响应。不改这个文件。 |
| [packages/features/library/src/application/ports/library-repository.ts](../../packages/features/library/src/application/ports/library-repository.ts) | `updateProgress` | 对得上。唯一写页方法接收 `{ openedAt, progressPage: number \| null }`。本批另增 `updateProgressPage(id, page: number)`，不改原方法。 |
| [packages/features/library/src/adapters/sqlite-library-repository.ts](../../packages/features/library/src/adapters/sqlite-library-repository.ts) | `updateProgress`、`writeThenRead`、`findById`、`readPage` | 对得上。现有更新语句总是 `UPDATE lib_entries SET opened_at = ?, progress_page = ? WHERE id = ?`。`writeThenRead`：事务抛错返回 `rejected`；写完回读不到行返回 `not_found`。`findById` 查不到返回 `ok(null)`；坏行或查询抛错返回 `rejected`。`readPage` 只接受 `null` 或 `number`，再交给 `parseProgressPage`。本批新增只写 `progress_page` 的语句并复用 `writeThenRead`。 |
| [packages/features/library/src/domain/library-record.ts](../../packages/features/library/src/domain/library-record.ts) | `parseProgressPage` | 对得上。`null` 原样返回。只要求整数且 ≥ 1，没有安全整数上界。不改它。 |
| [packages/features/library/src/application/use-cases/update-progress.ts](../../packages/features/library/src/application/use-cases/update-progress.ts) | `createUpdateProgress` | 对得上。不合法 id 返回 `not_found`。不合法时间或页返回 `rejected`。接受 `null`。成功返回 `LibraryEntry`，其中没有页。新写页不调用它。 |
| [packages/features/library/src/testing/fake-library-repository.ts](../../packages/features/library/src/testing/fake-library-repository.ts) | `updateProgress`、`seedLibrary` | 对得上。fake 的 `updateProgress` 同时覆盖 `openedAt` 和 `progressPage`。`seedLibrary` 用 `parseProgressPage`，因此会放行大于安全整数的整数。本批新增只改 `progressPage` 的方法。超界透传测试就用这个种子。 |
| [packages/features/library/migrations/0001_lib_entries.sql](../../packages/features/library/migrations/0001_lib_entries.sql) | CHECK | 对得上。`progress_page` 只约束 `NULL` 或 ≥ 1，没有上界。不改迁移，不改 CHECK。 |
| [packages/features/library/src/domain/library-failure.ts](../../packages/features/library/src/domain/library-failure.ts) | `LibraryCode` | 对得上。只有 `not_pdf`、`hash_mismatch`、`cancelled`、`not_found`、`rejected`。不新造错误码。 |
| [packages/features/library/src/index.ts](../../packages/features/library/src/index.ts) | 现有导出 | 对得上。core 测试从 `../../src/index.js` 引用用例。本批在这里增加两个工厂，不从 `src/ui/index.ts` 或 `pure.ts` 导出。 |
| [docs/arch/02-05.md](../arch/02-05.md)、[docs/prd/08.md](../prd/08.md)、[docs/arch/09-01.md](../arch/09-01.md) | 页码段 | 对得上「契约不等于保存或恢复已经实现」。实现之后这句对用户可见的重开仍成立，对 library core 会过时。正文不在本两笔里改。清单见「规格后续更新」。 |
| [docs/arch/04-02.md](../arch/04-02.md) | `library` 行 | 对得上现有文件。行内还没有两个新用例文件。实现阶段补上，本两笔不改正文。 |
| [DESIGN.md](../../DESIGN.md) | §12.2、UIX-56、UIX-57 | 对得上「转到页码」是输入跳转，UIX-56 是缩放，UIX-57 是整窗恢复。本批都不实现，也不改 DESIGN。 |
| [docs/design-principles.md](../design-principles.md) | P4、P7 | 对得上。本批无 UI，不自造控件。页码规则在 core，不在界面里算。不改该文件。 |
| 打开的 PR | 2026-11-09 开工时 | 对得上。没有打开的 PR，也没有打开的 PR 改 `packages/features/library`。已合入的 #169、#172、#179、#180、#181 不复用。 |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。Forge PASS 这两笔之前不填实现证据。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `42c8571b22330573ccb8dd99b2160b2838c93b5c` 只有本文件 | 该提交 |
| 2 | 只在 `docs/approvals.md` 追加 03:39 原话、时间、范围、来源，并改文末计数。然后停 | `8054c7f93e0ba0bca6e708dd1e4d8a38a51549b5` 只有台账行 | 该提交 |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 | 2026-11-09 03:47 Asia/Shanghai，Forge 对这两笔事前执行计划审查 PASS。登记 [issue #174 评论 6726246791](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6726246791)。此 PASS 先于实现，不是方案 PASS，也不是 Ready 或合入许可。本行写入时还没有实现提交 | 该评论 |
| 4 | 两个用例、端口、SQLite、fake、`index.ts` 出口、core 测试与 SQLite 测试。规格清单在同一次实现里更新，不在步骤 1、2 | `87d2324f521e575397862d1c895efe98ba6d09a8`。写页条件是 `Number.isSafeInteger(page) && page >= 1`。fake 与 SQLite 都断言 `openedAt` 不变。四份规格、changelog 和 manifest 唯一替换在同一提交 | [commands.md](../evidence/182/commands.md) |

## 行为

只在 `packages/features/library/`。application 只依赖本切片的 domain 与 port。不 import desktop、reader、ingest、settings，不 import 代际契约。repository 不保存 generation。用例输入没有 generation。

每个文件一件事，不把新规则写进 `update-progress.ts` 或 `ipc-handlers.ts`：

| 路径 | 只做的事 |
| --- | --- |
| 新建 `application/use-cases/get-progress-page.ts` | 按文献 id 读页 |
| 新建 `application/use-cases/set-progress-page.ts` | 校验安全正整数，再只写页 |
| `application/ports/library-repository.ts` | 增加 `updateProgressPage(id, page: number)`。参数类型不含 `null`。保留 `updateProgress` |
| `adapters/sqlite-library-repository.ts` | 增加 `UPDATE lib_entries SET progress_page = ? WHERE id = ?`，复用 `writeThenRead`。不改两列更新，不改 `AppStorage` |
| `src/testing/fake-library-repository.ts` | 同一方法只改该行的 `progressPage`。没有这篇返回 `not_found`。不改 `openedAt` |
| `src/index.ts` | 导出 `createGetProgressPage`、`createSetProgressPage` 和它们的输入、成功类型 |
| `test/core/` | 只经 `src/index.ts` 与 `src/testing/` 用 fake |
| `test/adapters/` | 用现有 library fixture 上的真实 `createSqliteLibraryRepository` |

不改：`update-progress.ts`、`parseProgressPage`、`findById`、`list`、`open-document.ts`、`0001_lib_entries.sql`、CHECK、contracts、生成物、`ipc-handlers.ts`、`library-main.ts`、desktop、协议、settings、密钥、UI、`composition-root.ts`、`slots.ts`、RULES、CI、DESIGN、原则。`apps/desktop/test/parse-capability-surface.test.ts` 的 F-08 遗留另批，不在本分支。

排除 settings 配置、safeStorage、密钥、kernel 存储和迁移，与「library 自己的 SQLite 只新增一条页码语句」不矛盾。后者是本批必须做的文献库页码持久化。

### 读：`createGetProgressPage`

输入 `{ id: string }`。成功是 `{ id: LibraryEntryId, progressPage: number | null }`。`progressPage` 来自现有读路径。`null` 是库存的空页。number 只表示 `parseProgressPage` 已经接受的整数，不声明为安全整数。不返回 `LibraryEntry`、generation、路径或 `openedAt`。

| 条件 | 结果 |
| --- | --- |
| id 不能解析 | `not_found`。不查库。沿用 `createUpdateProgress` |
| `findById` 得到 `null` | `not_found` |
| `findById` 得到一行 | 成功，页为该行的 `progressPage`。不再做安全整数过滤 |
| `findById` 得到 `rejected` | `rejected`。含坏行和查询抛错 |

历史超界值：读用例原样带回现有读路径给出的 number。不改 `findById` 和 `list`。SQLite 驱动把大整数返回成 number 还是 bigint 尚未核实，SQLite 测试不断言超界读。驱动若返回 bigint，现有 `readPage` 已把非 number 当成坏行，`findById` 返回 `rejected`，读用例只转发。将来的 handler 用已合入的响应 schema 拒绝超界成功值，映射为现有 `invalid_payload`，不透传给 renderer，不新造错误码。那一条不属于本批验收。

不选「读到超界就 `rejected`」。那会和 `findById` / `list` 口径分裂，并和坏行共用一个码。

### 写：`createSetProgressPage`

输入 `{ id: string, progressPage: number }`。类型上不接收 `null`，运行时仍拒绝 `null`。没有 generation，没有 `openedAt`。成功是 `{ id: LibraryEntryId, progressPage: number }`，页就是写入的那个安全整数。

| 条件 | 结果 |
| --- | --- |
| id 不能解析 | `not_found`。不写库 |
| 不满足 `Number.isSafeInteger(page) && page >= 1`。含 `null`、`0`、负数、小数、`NaN`、`Infinity`、`-Infinity`、`Number.MAX_SAFE_INTEGER + 2` | `rejected`。不调用端口 |
| 端口报告没有这篇 | `not_found` |
| 端口报告行损坏或存储抛错 | `rejected` |
| 端口成功 | 成功体带回写入的页 |

`Number.MAX_SAFE_INTEGER` 可以通过。`Number.MAX_SAFE_INTEGER + 2` 不可以。这道检查只在新用例里，不放进 `parseProgressPage`，因此 `updateProgress` 与 `openDocument` 不变。不能把读成功叫成安全整数。

### 测试

core 测试放在 `packages/features/library/test/core/`。不启动 Electron，不读源码文本，不断言活代际。fake 上至少：

- 读到 `null` 成功。
- 读到 `1` 和 `Number.MAX_SAFE_INTEGER` 成功。
- 没有这篇时，读和写都是 `not_found`。
- id 不合法时，读和写都是 `not_found`。
- 写 `null`、`0`、`-1`、小数、`NaN`、`Infinity`、`-Infinity`、`Number.MAX_SAFE_INTEGER + 2` 都是 `rejected`，不调用端口，fake 里的页和 `openedAt` 都不变。
- 写 `1` 和 `Number.MAX_SAFE_INTEGER` 成功，`openedAt` 与写入前相同。
- 端口返回 `rejected` 时，读和写都转发 `rejected`。
- 超界透传必须测：`seedLibrary` 种入 `progressPage: Number.MAX_SAFE_INTEGER + 2`，读页成功，并且原样返回同一个 number。这锁住「读用例不另加过滤」，不依赖 SQLite 驱动。

SQLite 测试放在 `test/adapters/`，走真实 `createSqliteLibraryRepository` 和现有 `withLibrary`。不用 fake 代替 SQL。至少：写入一个安全整数页之后，`opened_at` 与写入前相同，`progress_page` 变为该页；没有这篇时得到 `not_found`。不把驱动对大整数的返回类型写成已测。

[docs/arch/12.md](../arch/12.md) 要求端口的内存实现和 SQLite 实现跑契约测试。本批按批准清单落实：重叠的读写、`not_found` 与 `rejected` 两边都有；超界透传只在 fake。`openedAt` 不变在 fake 和真实 SQLite 两端都测，fake 的断言不删。不把 SQLite 测试放进 `test/core/`。不新增 npm script。Vitest 现有 include 已覆盖 `packages/features/*/test/core/**` 与 `test/adapters/**`。

## 规格后续更新

步骤 1 和步骤 2 不改 PRD、ARCHITECTURE 正文，也不改 `tools/compare-spec-bytes/manifest.json`。这只说明那两笔。Forge PASS 之后的实现提交要补下面四份正文，在 [docs/spec-changelog.md](../spec-changelog.md) 加一行，并只追加 manifest 的唯一替换。不改基线 `f8d5d01`，不改 `compare.mjs`。

| 文件 | 实现阶段要补的一句 | 不写成 |
| --- | --- | --- |
| [docs/arch/04-02.md](../arch/04-02.md) `library` 行 | 增加 `get-progress-page.ts` 与 `set-progress-page.ts`。各只做一个用例 | 不删 `update-progress.ts`，不把 handler 写进行里 |
| [docs/arch/02-05.md](../arch/02-05.md) | library core 能按 id 读写 `progress_page`。写页不接受 `null`，不改 `openedAt`。读页不声明安全整数 | 不写成重开、handler 或 `expose=true` 已经完成 |
| [docs/arch/09-01.md](../arch/09-01.md) | 页码 IPC 仍是那两条，`expose` 仍为 false。core 读写不等于命令已经挂上 | 不发明 `reader.setPage` |
| [docs/prd/08.md](../prd/08.md) | 补一句 core 读写已有，保存到重开的用户路径仍未验收 | 不把 US-08、AC-11、3A、PRC-01–26 或 8 GB 录屏标成通过 |

DESIGN 与原则不在这份清单里。

## 验收与未验证

| 证据 | 本批 | 不在本批 |
| --- | --- | --- |
| CI | 实现 tip 的 node 与文档门禁。core 与 adapter 测试都在 node。本计划阶段不跑 | desktop、协议另计 |
| Cloud 本机 | 实现 tip 全量只跑一次。`GITLEAKS_BIN` 未设置时的 detect 跳过不是具名 G9 通过。没有 Electron 就不得称为 Electron 实跑 | 同左 |
| Box | Forge 按风险决定。建议纯 core 不单建 Box。不跑就写「未跑」和理由，不写 PASS，不援引 03:06 | 有桌面或协议行为时另定 |
| Windows 真机 | 不跑，也不替代 8 GB 录屏 | 打开 / 滚动 / 重开的 8 GB 录屏和截图仍未验收。AC-11 的界面降级状态仍未验收 |

全部保留未验：AC-11、3A、PRC-01–26、8 GB Windows 录屏与截图。US-08 的译文与笔记不因页码 core 标成通过。UIX-57 仍未满足。具名 G9 若失败，按 ADR 0005 停止放行并保留原件。

G12：本批不改 contracts，契约 PR 的 200 行理由不适用。这不豁免「非生成代码超过 600 行须拆分或写具体 `G12:` 理由」。实现 tip 以门禁读数为准。两个用例预计各自远小于 600 行；`sqlite-library-repository.ts` 现为 243 行，只加一条语句。若非生成 diff 超过 600，先拆分；拆不开时理由必须写明哪几项必须同一次证明。不预写 `G12:`，不改 600 上限。

热点文件：无。不改 `composition-root.ts` 与 `slots.ts`。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「批准按FINAL-CORE-PLAN.md第12节页码core范围实施，含用例、端口、SQLite、fake及测试；先提交计划和批准台账，经Forge审查后编码，只开Draft，不Ready、不合入、不发版，不含F-08另批整改。」 | 页码 core 的实施范围。台账行在第二笔。链接：[6726168870](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6726168870)，以及第二笔写入的 [docs/approvals.md](../approvals.md) 03:39 行 | 2026-11-09 03:39 | Wisdom |
| 读页超界沿现有读路径透传，fake 必须断言；写页由新用例拒绝非安全正整数 | 这是 §12 里已经选中的技术范围，随 03:39 一起批准。不改 `findById` / `list` | 2026-11-09 03:39 | Wisdom，经 FINAL-CORE-PLAN.md §12 |
| 第一笔只有计划，第二笔只有台账，然后停 | 03:39 原话要求先提交计划和批准台账，经 Forge 审查后才编码。方案审查不代替 | 2026-11-09 03:39 | Wisdom |
| 对 `42c8571` 与 `8054c7f` 的事前执行计划审查 PASS | 发生在实现之前。不是方案 PASS，不是新的范围批准，不是 Ready 或合入许可。03:39 批准与 03:42 继续推进仍然有效。实现时落实三项：写页条件是 `Number.isSafeInteger(page) && page >= 1`；fake 与 SQLite 都断言 `openedAt` 不变；四份规格、changelog 与 manifest 唯一替换随实现提交。链接：[6726246791](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6726246791) | 2026-11-09 03:47 | Forge 排序，非业主决定 |

## 证据链接

- `docs/evidence/182/commands.md`：全量记录在 `87d2324f521e575397862d1c895efe98ba6d09a8`。其后只追加本表与该证据，没有重跑 `pnpm test` 或 `pnpm run check`。

## 自检

- [x] 影响 arch / prd 吗？影响。四份正文、changelog 和 manifest 唯一替换在 `87d2324`。不改基线，不改 `compare.mjs`。
- [x] Forge 已亲读 `42c8571` 与 `8054c7f` 并 PASS（2026-11-09 03:47，[6726246791](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6726246791)）。此勾选先于实现提交。
