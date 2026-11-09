# 执行计划

分支 `feature/reading-generation-monotonic-174`。基线是远端 `main` `79959adfe26a91c3771a04dc6e3f9fcc5154442d`（PR #188 squash 合入）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 2026-11-09 17:14 行。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不改代际表，不改测试，不改规格正文。本文件不是那个 PASS。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。

任务类型：本两笔是纯文档。交接说明写「不适用」。实现阶段只改下面点名的 library 代际表、对应测试和一处规格句。

## 现状理解

- 已有行为：同一张代际表里，`revoke` 成功会删掉这篇文献的当前行。下一笔 `bind` 看到没有当前行，把 generation 设回 1。旧的 generation 1 又能通过 `matches`。Anvil 在 PR #188 的 QA 里用 Box 和真机都复现了：同一个 id 先 revoke 再 bind，代际从 1 再发起，revoke 前的旧 gen1 又能读写。代码来自 #184 的代际表，现已在 `main`。
- 相关的节：[docs/arch/02-05.md](../arch/02-05.md) 页级进度段、[docs/arch/09.md](../arch/09.md) 第 23 行、[docs/approvals.md](../approvals.md) 2026-11-09 12:04 代际表那一行。
- 还没做的部分：同一篇文献在同一张表里的代际只增不减。本两笔只写计划和台账。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6736397407](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6736397407) | 对得上。本 Draft 用的原话是「代际编号重新从 1 开始的问题在批次 D 前单独开计划加台账两笔的 Draft，修成同一篇文献只增不减」。GitHub `created_at` 是 `2026-11-09T09:14:22Z`。台账时间用评论正文里的 17:14。同一条评论里还有接受 02-05 措辞、允许 Anvil 发 QA，以及按 `270806a` 合入 PR #188。那些不是本 Draft 的范围。PR #188 已经合入 |
| [packages/features/library/src/application/reading-generation-table.ts](../../packages/features/library/src/application/reading-generation-table.ts) | `revoke` 与 `adopt` | 对得上。68 行。44–48 行匹配当前代际后 `rows.delete(id)`。60 行 `previous === undefined ? 1 : previous.generation + 1`。39 行 `matches` 只比较当前行 |
| [docs/arch/02-05.md](../arch/02-05.md) | 页级进度段 | 对得上。写着代际不入库、闭包内存、进程新起时表为空、每个文献 id 一条当前代际、新的 bind 替换旧的、上界不回绕、revoke 不写库 |
| [docs/arch/09.md](../arch/09.md) | 第 23 行 | 对得上。重复登记是否沿用同一个 `assetId`、重载或崩溃后是否清表，仍不在本节写成签名 |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。Forge PASS 这两笔之前不填实现证据。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `38fce75ac24fbd977c4d78f8301d1cf1f19bbd9b`，tree `96e2568459be8ee05e99574fd8df30a5f9522f9b`。只有本文件 | 该提交 |
| 2 | 只在 `docs/approvals.md` 追加 17:14 原话、所批范围、时间和登记链接，并改文末计数。然后停 | `2e4fed575515f4b0100b30d7567a7f7354a6bb39`，tree `43fafc0ed48343972b68b84afbb9fcb60c7fcf6d`。只改台账，计数 124 | 该提交 |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 | PASS：[6736646809](https://github.com/wisdom-km/open-immerse-v2/pull/189#issuecomment-6736646809)。审查时 tip 是 `2e4fed57` | 该评论 |
| 4 | 按「根因」和「修法」实现。不在步骤 1、2 | 18:42 台账 `f461eac564ea267014785ef9f4f993983ac6359b`，tree `405e52bdaff26e108438b793399f26fe25fa94c9`，只改 `docs/approvals.md`，计数 125。实现 `083407dcfe3cd816353ea6c27808997a1b2159d8`，tree `0805c5961098237d9478cf9ea5c6adb4a5668a47`。高水位在闭包内，不入库。`library-wiring.ts` 只加测试导出（+2/−1）。`reading-ipc-wiring.test.ts` +77，新开一条 `it`，避免原函数超过 80 行。commandMap 测试 68 行。相对 `origin/main` `79959ad`，这个 tip 的非生成行数是 350。四个热点 diff 为 0 | [docs/evidence/189/commands.md](../evidence/189/commands.md) |

## 根因

文件 [packages/features/library/src/application/reading-generation-table.ts](../../packages/features/library/src/application/reading-generation-table.ts)，基线 `79959ad`。

`revoke`（44–48 行）在请求的 generation 等于当前行时执行 `rows.delete(id)`。当前行没有了，已发过的代际数字也一起没了。

`adopt`（54–67 行）用 `rows.get(id)` 当 `previous`。60 行在 `previous === undefined` 时把 generation 设为 1，否则才加 1。revoke 之后这篇文献没有当前行，下一笔 bind 走 1 那一支。

`matches`（39 行）只判断当前行的 generation 是否等于请求。新的当前行又是 1 时，revoke 前那个 gen1 再次为真。get 和 set 因此又能读写。

`issued.next`（29 行、64–65 行）是另一张计数，revoke 不把它减回去。assetId 在同一张表里已经不会回到 `"1"`。QA 里重新从 1 开始的是 generation，不是 assetId。

四个 command 工厂只调用这张表的 `bind`、`revoke` 和 `matches`。它们没有另一套从 1 起算的逻辑。

## 修法

同一张表、同一篇文献的 generation 只增不减。revoke 之后再 bind，拿到比这张表已经发给这篇文献的代际更大的数。旧代际，包括刚 revoke 的那一个，`matches` 为假，get、set、revoke 都是 `rejected`。

高水位放在 `createReadingGenerationTable` 的闭包里，和现有的 `rows`、`issued` 一样，是函数内的 `const Map`。不是模块级 `let`。不写入 SQLite，不加列，不改 `progress_page`。revoke 仍只删除当前那一对（当前行），不删除高水位，也不写库。bind 用这篇文献的高水位加 1。只有成功的 bind 才写下当前行，并把高水位改成刚发出的数。加 1 之后不是 1 到 `Number.MAX_SAFE_INTEGER` 的整数时，仍返回 `exhausted`，不写当前行，也不把高水位降下来。

`atCeiling` 现有参数（25–36 行）把该 id 的当前代际放在上界，供「不回绕」测试。实施时这个参数也必须把该 id 的高水位放在 `Number.MAX_SAFE_INTEGER`。否则下一次 bind 会把空的高水位当成没发过，回到 1，并把现有不回绕测试改坏。生产调用仍然不传这个参数。

assetId 仍由 `issued.next` 在这张表的进程内从 1 递增。revoke 不回收 assetId。本计划不决定重复登记是否沿用同一个 `assetId`。

### 重启

新的一次 `createReadingGenerationTable()` 仍然是空表：没有当前行，也没有高水位。第一笔 bind 的 generation 仍是 1。这是 [docs/arch/02-05.md](../arch/02-05.md) 已经写上的「进程新起时表为空」，也是 12:04 原句「闭包内存，不入库，进程新起为空，不用模块级 let」允许的范围。

[docs/arch/09.md](../arch/09.md) 第 23 行的「重载或崩溃后是否清表」不是已经生效的规则。那半句写的是「仍不在本节写成签名」。把高水位放进库或模块级变量，会改掉已经生效的「不入库」和「进程新起时表为空」，并替这一行把未签名的崩溃清表定成不清。17:14 的原话没有这句。本计划不这样做，也不改第 23 行。

第二个工厂、第二次 `createLibraryMain`，仍然从 generation 1 开始。现有测试继续这样断言。这不能叫做杀掉 OS 进程再拉起。杀进程再拉起仍未核实。本批不把它写成已验证，也不为此加持久化。

## 改哪些文件

物理行数含空行和注释。函数低于 80 行，圈复杂度不超过 15，参数不超过 4 个。下面是实现阶段的增量，本两笔不改这些文件。合计约 165 行，低于 G12 的 600。不预写 `G12:`。不跑 codegen。契约、`expose`、通道名、schema、错误码和幂等都不改，所以没有生成物。

| 路径 | 只做的事 | 现在 | 预算 | 完成后上限 |
| --- | --- | --- | --- | --- |
| `reading-generation-table.ts` | 闭包内高水位。revoke 不删它。`adopt` 用它加 1。`atCeiling` 同时记下上界 | 68 | +40 以内 | 建议 400，硬上限 600 |
| `reading-generation-table.test.ts` | 同一张表 revoke 后再 bind 大于 1。旧代际不匹配。上界 revoke 后再 bind 仍不回绕。另一篇文献仍从 1 开始。第二个工厂仍是空表 | 140 | +60 以内 | 建议 600，硬上限 800 |
| `apps/desktop/test/reading-ipc-wiring.test.ts` | 同一次 `createLibraryMain`，经正式 registry 和 router：revoke 后再 bind，旧代际 `rejected`。第二次 `createLibraryMain` 仍是 generation 1 | 189 | +50 以内 | 建议 600，硬上限 800 |
| `docs/arch/02-05.md` | 只补下面「规格」那一处 | 33 | 一句替换，行数 +2 以内 | 不另起一节 |
| `docs/spec-changelog.md`、`tools/compare-spec-bytes/manifest.json` | 一行记录，一条唯一替换 | 见各文件 | +15 以内 | 不改基线 `f8d5d01`，不改 `compare.mjs` |

四个 command 工厂、`library-main.ts`、`library-wiring.ts`、contracts 的预算是 0。代际判断仍只在表里。

若实现后来加在本分支上，本文件、台账和上表合计仍低于 600。超过 600 就停，报告数字，不写 `G12:`。

## 规格

本两笔不改这些文件。实现阶段只补原话要求的那一处。

| 文件 | 现在的句子 | 改成 | 出处 |
| --- | --- | --- | --- |
| [docs/arch/02-05.md](../arch/02-05.md) 页级进度段 | 每个文献 id 只有一条当前代际，新的 bind 替换旧的 | 保留这一句。同一张表内补上：revoke 后再 bind 的 generation 大于这张表已经发给这篇文献的代际，不回到 1。旧代际不匹配 | 17:14 原话「修成同一篇文献只增不减」。这句是 12:04 已经写入的代际替换描述 |

不改「代际不入库」「闭包内存」「进程新起时表为空」「revoke 不写库」「generation 上界不回绕」。

不改 [docs/arch/09.md](../arch/09.md) 第 23 行。重复登记是否沿用同一个 `assetId`、重载或崩溃后是否清表，继续「仍不在本节写成签名」。17:14 没有批准把它们写成签名。

[docs/arch/09-01.md](../arch/09-01.md) 和 [docs/prd/08.md](../prd/08.md) 没有「revoke 后再从 1 开始」的句子。不改。

同时加 changelog 一行和 manifest 的唯一替换。不改基线，不改 `compare.mjs`。若文档门禁因此失败，停，不自行扩大规格范围。

## 测试矩阵

| 账本 | 本批要覆盖的 | 不在本批 |
| --- | --- | --- |
| 单测 | 同一张表：bind 为 1，revoke，再 bind 为 2。`matches(id, 1)` 为假，`matches(id, 2)` 为真。另一篇文献的第一笔仍是 1。`atCeiling` 的下一笔仍是 `exhausted`；revoke 这个上界后再 bind 仍是 `exhausted`，不是 1。assetId 仍递增，不回收。第二个无参工厂仍是空表，第一笔仍是 1 | 不把第二个工厂写成杀进程 |
| 生产 registry 与 router | 同一次 `createLibraryMain` 的四个真实工厂，经 `ipcRegistry` 里这四条和 `registerIpcRouter`。revoke 后再 bind。新 generation 大于 1。用旧 generation 做 get 和 set，结果是 `rejected`，回显 id 与 generation，响应里没有 `assetId`。新 generation 的 get 成功。现有 `reading-ipc-wiring.test.ts` 在 revoke 之后没有再 bind（80–90 行），所以没挡住这个回归 | 不改通道名。不在测试里重写代际判断 |
| 第二次打开 | `reading-ipc-wiring.test.ts` 98–118 行：另一个 `createLibraryMain` 打开同一批文件，bind 仍是 generation 1、assetId `"1"`。这句断言保持 | 这不是 OS 进程重启 |
| CI | 实现 tip 的 node 与文档门禁要跑。本两笔不代替那次 | 不把 CI 全绿写成 G1–G18 都已有 |
| 待批准的可选项 | 见下节。17:14 原话里没有它。默认不做，不计入上表行数 | 未另批之前不写这个测试 |

### 待批准的可选项：生产 commandMap

`library-wiring.ts` 的 `commandMap`（92–115 行）没有被测试调用。`reading-ipc-wiring.test.ts` 的 `bindReading`（139–161 行）自己组了一张 Map，接的是 `createLibraryMain` 的工厂和正式 registry，不是 `commandMap`。`ipc-production-assembly.test.ts` 只用 `libraryCommandChannels` 配上空的 handler，不断言 bind 接到 `main.reading.bindReadingAsset`。因此 commandMap 里把两条通道对调，上述测试仍会通过。

这是 nit，不在 17:14 原话里。默认不做。若以后另批，再加一个断言生产 map 的四条阅读通道，预计 +80 行以内，并且不得为此再建一张代际表。`library-wiring.ts` 顶层引用了 Electron。未批之前不导出 `commandMap`，不加依赖，也不改这个文件。

2026-11-09 18:42 已另批。实现是 `apps/desktop/test/library-command-map.test.ts`。`commandMap` 改为测试可见的导出。测试把同一次 `createLibraryMain` 上的四个方法换成哨兵，不另建代际表。Electron 在该测试文件里被替掉，没有加依赖。

## Box 和真机

本两笔不跑 Box，不跑真机，不写 PASS。

实现阶段要复跑的是 Anvil 已经复现的那一条：同一个 id，bind，revoke，再 bind，旧 generation 不能读写，新 generation 比旧的大。依据是 Issue #174 评论 [6736397407](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6736397407) 所记的 PR #188 QA：Box 和真机都复现了代际回到 1。Box 走这一条。真机也走这一条。

这一条不是 8 GB 录屏，不是 AC-11，不是重开恢复。跑过也不把那些标成通过。没有对应机器就写未验证，不用另一台机器代替。

杀 OS 进程再拉起不在本批实跑清单里。规格已经允许新进程的表为空。本批不把「没杀进程」写成重启已验证。

## 不改

`apps/desktop/src/main/composition-root.ts`、`apps/desktop/src/renderer/slots.ts`、`apps/desktop/src/main/ipc/ipc-router.ts`、`apps/desktop/src/main/ipc/pass-through.ts`。diff 都是 0。

desktop UI、`oi-asset://`、CSP、Range、settings、safeStorage、密钥、RULES、CI、门禁、DESIGN、原则。不加依赖。不改四个 command 工厂的判断，不改 `library-main.ts` 的建表次数，不改 `library-wiring.ts`。

步骤 1 和步骤 2 也不改这些文件。

## 还没核实

- 第二个空表不能代替杀掉 OS 进程再拉起。
- SQLite 把超界整数读成 number 还是 bigint，仍未核实。本批不新增这种断言。
- 高水位放在闭包里、进程新起为空，是本计划在 17:14 和已有「不入库 / 进程新起时表为空」之内做的选择。Forge 可以在 PASS 前退回。退回之前不改成入库。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「代际编号重新从 1 开始的问题在批次 D 前单独开计划加台账两笔的 Draft，修成同一篇文献只增不减」 | 本分支只写计划和台账。不实施。链接：[6736397407](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6736397407) | 2026-11-09 17:14 | Wisdom |
| 高水位在工厂闭包内，不入库 | 17:14 要求只增不减，没有要求越过进程。入库会改掉 12:04 已写的「不入库」和「进程新起时表为空」，并替 [docs/arch/09.md](../arch/09.md) 第 23 行未签名的崩溃清表做决定 | 2026-11-09 | 本计划的选择，Forge 可在 PASS 前退回 |
| commandMap 测试默认不做 | 不在 17:14 原话里 | 2026-11-09 | 本计划，标为待批准的可选项 |
| 「按推荐：按 PR189 计划 38fce75a 实施代际只增不减，并补生产 commandMap 四条阅读通道的映射测试；不 Ready/合入/发版」 | 按计划 `38fce75a` 实施，并补生产 commandMap 测试。链接：[6738024462](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6738024462)。Forge 计划审查 PASS：[6736646809](https://github.com/wisdom-km/open-immerse-v2/pull/189#issuecomment-6736646809) | 2026-11-09 18:42 | Wisdom |

批次 C、批次 D、Ready、合入和发版仍不在本文件的范围内。步骤 4 已按 18:42 实施。

## 证据链接

- `docs/evidence/189/commands.md`：实现 tip `083407dcfe3cd816353ea6c27808997a1b2159d8` 的命令记录。回填本列的提交不重跑全量。

## 自检

- [x] 影响 arch / prd 吗？本两笔不影响。实现阶段只改「规格」表里那一处，并加 changelog 一行和 manifest 的唯一替换。
