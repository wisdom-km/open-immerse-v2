# 执行计划

分支 `feature/reading-ipc-expose-wiring-174`。基线是远端 `main` `ee785bd112f06339ff0872489c8f7b5bcc20e79a`（PR #187 squash 合入，提交说明 `docs: 批次 A 对齐扁平错误字段 (#174) (#187)`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 2026-11-09 15:07 行。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不改 `accept-result.ts`，不改契约，不改 codegen，不改装配。本文件不是那个 PASS。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。[docs/design-principles.md](../design-principles.md) 的 P4、P7 保持：这一批没有界面。

任务类型：本两笔是纯文档。交接说明写「不适用」。实现阶段同时改契约的 `expose` 与生产 handler 装配。不拆成先合契约、再开实现。理由见「不拆」。

## 现状理解

- 已有行为：`ee785bd` 上四条阅读命令仍是 `expose: false`。正式 codegen 的 `ipcRegistry`、`createOi` 与 `Window["oi"]` 只有 `library.import`、`library.importDropped`、`library.list`、`library.relocate`。`libraryCommandChannels` 与 `library-wiring.ts` 的 map 也只有这四条。`createLibraryMain` 只装配导入、列表和重定位，不调用 `createReadingGenerationTable`。四个 command 工厂和 `createGetProgressPage`、`createSetProgressPage` 已从 library 包出口导出。代际表是闭包内存，不入库，无参调用得到空表。`acceptHandlerResult` 已把扁平 `id` 与 `generation` 留下来，并展开嵌套 `detail`。复制时跳过 `code`、`retryable`、`message`、`detail`，不跳过 `stack`。普通赋值 `target[key] = source[key]` 在键是 `__proto__` 时会改掉目标的原型。
- 相关的节：[docs/arch/02-05.md](../arch/02-05.md) 页级进度段、[docs/arch/06.md](../arch/06.md)、[docs/arch/09.md](../arch/09.md) 第 23 行、[docs/arch/09-01.md](../arch/09-01.md) 页码段、[docs/arch/13.md](../arch/13.md) G11、G12、G18、[docs/prd/08.md](../prd/08.md)「M2 ③ 本批归属」、[DESIGN.md](../../DESIGN.md) UIX-57、[RULES.md](../../RULES.md) §2、§4、§9、N-03、N-09、N-10。
- 还没做的部分：两个 nit，四条 `expose: true`，生产进程里的那一张代际表，以及生产 map。本两笔只写计划和台账。允许 Anvil 把 `main@ee785bd` 的合后收口发到 #174；那不是本分支的提交。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6734352813](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6734352813) | 对得上。Wisdom 2026-11-09 15:07 Asia/Shanghai 原话是「按推荐：开批次 B 计划+台账两笔 Draft，两个 nit 作为接线前置写进计划，不实施/Ready/合入/发版；允许 Anvil 把合后收口发到 #174」。GitHub `created_at` 是 `2026-11-09T07:08:10Z`。台账时间用评论正文里的 15:07 |
| [docs/approvals.md](../approvals.md) | 第 130 行 | 对得上。2026-11-09 01:56，PR #180：`expose` 为 true 留到真实配置来源与 handler 同一次合入。本批不拆契约 PR，引用的是这一行 |
| [apps/desktop/src/main/ipc/accept-result.ts](../../apps/desktop/src/main/ipc/accept-result.ts) | `copyBusinessFields` | 对得上。103 行。85–92 行的跳过名单没有 `stack`，也没有 `__proto__`。81 行是普通赋值 |
| [apps/desktop/test/accept-result.test.ts](../../apps/desktop/test/accept-result.test.ts) | 扁平字段 | 对得上。114 行。不断言 `stack` 或 `__proto__` |
| [packages/contracts/src/ipc/reading-asset.ts](../../packages/contracts/src/ipc/reading-asset.ts) | `expose` | 对得上。118 行。75 行与 91 行是 false |
| [packages/contracts/src/ipc/library-progress.ts](../../packages/contracts/src/ipc/library-progress.ts) | `expose` | 对得上。115 行。75 行与 90 行是 false |
| [apps/desktop/src/main/ipc/library-command-channels.ts](../../apps/desktop/src/main/ipc/library-command-channels.ts) | 生产名单 | 对得上。13 行。只有导入、拖入、列表、重定位 |
| [apps/desktop/src/main/library-wiring.ts](../../apps/desktop/src/main/library-wiring.ts) | `commandMap` | 对得上。140 行。96–102 行的 map 与上面名单一致。`startLibrary` 只调用一次 `createLibraryMain` |
| [packages/features/library/src/adapters/library-main.ts](../../packages/features/library/src/adapters/library-main.ts) | `createLibraryMain` | 对得上。135 行。打开一次存储。失败时四条现有 handler 返回 `handler_threw`。不建代际表 |
| [packages/features/library/src/index.ts](../../packages/features/library/src/index.ts) | 工厂出口 | 对得上。69–81 行导出四个 command 工厂、两个页码用例和 `createReadingGenerationTable` |
| [apps/desktop/src/main/composition-root.ts](../../apps/desktop/src/main/composition-root.ts) | 装配根 | 对得上。27 行。热点。把 `startLibrary` 的 map 交给 `wireIpc`。本批目标 diff 为 0 |
| [apps/desktop/src/renderer/slots.ts](../../apps/desktop/src/renderer/slots.ts) | 热点 | 对得上。3 行。本批目标 diff 为 0 |
| [apps/desktop/test/ipc-production-assembly.test.ts](../../apps/desktop/test/ipc-production-assembly.test.ts) | 覆盖 | 对得上。43 行。生产名单必须盖住 registry 里的每条命令 |
| [apps/desktop/test/reading-command-surface.test.ts](../../apps/desktop/test/reading-command-surface.test.ts) | 公开面 | 对得上。68 行。四条阅读命令现在在隐藏名单里。断言走 registry、`createOi` 和 `Window["oi"]`，不读源码文本 |
| [apps/desktop/test/oi-keys.test.ts](../../apps/desktop/test/oi-keys.test.ts) | `createOi` 键 | 对得上。38 行。键名单与现在的四条公开命令一致 |
| [apps/desktop/test/parse-capability-surface.test.ts](../../apps/desktop/test/parse-capability-surface.test.ts) | F-08 | 对得上。158 行。禁止名单是解析、settings 与 secret。不读源码文本。本批不删这些名字 |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。Forge PASS 这两笔之前不填实现证据。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | 已提交。只有本文件 | `2d12766c025eefbf1b33df64a7762e4433f7974d`，tree `d82da01e81782b7d894e21e68d7a9f2c792a00f5` |
| 2 | 只在 `docs/approvals.md` 追加 15:07 原话、所批范围、时间和登记链接，并改文末计数。然后停 | 已提交。只有台账，计数当时改为 121。随后停过 | `5a9c40ea11ffdaa4ed9f42cecc921820915515a9`，tree `86a34bd706f0e86a1ee7611321822fb23a606536` |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 | Forge 计划审查 PASS，PR #188 评论 [6734534945](https://github.com/wisdom-km/open-immerse-v2/pull/188#issuecomment-6734534945)。Wisdom 2026-11-09 15:20 批准实施，Issue #174 评论 [6734546327](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6734546327)。台账另有一笔，计数改为 122 | PASS 不代替 15:20。台账提交 `80c7f2b56cfaa41ea71c94315e58df31dbb1ae56`，tree `4de3e3d9bad0ae7da5f9d5d4cca7e350a5cc6124` |
| 4 | 先做「接线前置」，再做「接线」。不在步骤 1、2 | 前置 `e299993c753f4f28ffde9d7a4e696825812e98ff`（tree `06b8a236b200200441eca464796b996062cff23b`）只改 `accept-result.ts` 与 `accept-result.test.ts`。跳过 `__proto__` 与 `stack`。该文件 5 通过。接线 `3e361b59e5930caadfa33c561776eedf18fc8894`（tree `59cf125536fb840298a72fc9d012cb4c462efc85`）：四条 `expose` 改为 true，正式 codegen，`createLibraryMain` 同一次打开建一张表，失败路径返回 `handler_threw`。规格 `4077a531dac017a25f5b23e4658749bb87372c7f`（tree `079cdcf70bea1e4597aa2e90b156ca7599e81151`）。类型修复 `26424591c15197227aabc7e75e86707e17a570c5`（tree `7ae992934fa2538718871e39c489b41f5f2798f9`）：生成的 `IpcJsonSchema` 补 `minimum` 与 `maximum`，再跑 codegen；`ipc-router.test.ts` 的公开通道名单跟上这四条。`09.md` 第 23 行同时把「先核代际还是先查库」改成「先查表再查库」，重复登记与崩溃后清表不动。非锁文件在该 tip 上是 1077 行，超过 600。没有写 `G12:` | 全量只跑在 `26424591c15197227aabc7e75e86707e17a570c5`。`check` 在 G12 退出码 1，此前各项已走到 `check-pr-size`。`codegen` 与随后的 `git diff --exit-code` 退出码 0。Vitest 171 个文件，723 通过，3 跳过，0 失败。这 3 个跳过是 G9 detect，停在 `phase=binary`，因为 `GITLEAKS_BIN` 未设置，不算具名 G9 通过。`check-docs` 与 `check-arch-graph` 退出码 0。Python：ruff check、ruff format、pyright、lint-imports 退出码 0，pytest 181 通过。回填本表的提交不再跑全量 |

## 接线前置

这一步在任何 `expose: true`、codegen 或生产 map 改动之前提交。只改 `accept-result.ts` 与 `accept-result.test.ts`。不跑全量。提交前只跑这两个测试文件。

两个 nit 都走现有 `registerIpcRouter`。跳过名单在 `isSkippedField` 一处。错误对象和嵌套 `detail` 共用它。传输错误仍只留 `code` 与表里的 `retryable`，不改 204–232 行那条 router 测试。

### nit 1：`__proto__`

选择：跳过键 `__proto__`。不用 `Object.defineProperty`。

理由：要求是复制时不能改掉错误对象的原型。`target[key] = source[key]` 在键为 `__proto__` 时会走 setter，把目标的 `[[Prototype]]` 换成赋进去的值。跳过这个键之后，输出仍是普通对象，原型不变，键也不出现。`__proto__` 不是这四条命令的业务字段。`Object.defineProperty` 能留下一个同名自有数据属性，但可枚举性、可写性和可配置性都没有原句。留在输出上还会多一个非业务键。跳过沿用已经在用的跳过名单，不新开一条写入路径。

测试：业务错误上有一个自有、可枚举的 `__proto__` 键（用 `Object.defineProperty` 造输入，不用赋值）。经 router 之后，`Object.getPrototypeOf` 仍是 `Object.prototype`，输出没有这个自有键。嵌套 `detail` 里的同名键同样不改原型、不出现在输出里。

### nit 2：`stack`

选择：复制时跳过 `stack`。15:07 原话把这条写成接线前置。批次 A 的计划当时不跳过它，那份计划不约束本批。

测试：业务错误带 `stack`（以及 `detail` 里的 `stack`）时，输出没有这个键，秘密字符串也不在编码结果里。`message` 的现有断言保持。

## 接线

前置那一笔已经在分支上之后才做。生产进程经 `startLibrary` 只调用一次 `createLibraryMain`。代际表在这一次打开里创建，无参调用 `createReadingGenerationTable()`。同一张表传进四个已导出工厂：`createBindReadingAssetCommand`、`createRevokeReadingAssetCommand`、`createGetProgressPageCommand`、`createSetProgressPageCommand`。读和写用同一次打开里的 `createGetProgressPage` 与 `createSetProgressPage`。不在 `library-wiring.ts` 再调一次表工厂，避免两张表。不新开第二份存储。

存储打不开时不建表。四条新通道仍在 map 里，返回与现有失败路径相同的 `handler_threw`，不新造错误码，响应不含数据根字符串。

`library-command-channels.ts` 加上 `library.bindReadingAsset`、`library.revokeReadingAsset`、`library.getProgressPage`、`library.setProgressPage`。`library-wiring.ts` 的 map 用这张名单取 handler。`composition-root.ts` 仍然只把整张 map 交给 `wireIpc`。

`reading-asset.ts` 与 `library-progress.ts` 里这四条的 `expose` 改为 `true`。然后跑正式 codegen。不手改 `registry.generated.ts`、`oi.generated.ts`、`oi-api.d.ts`（N-09）。契约测试里对应的 `expose` 断言改为 true。不改通道名、schema、错误码或幂等。

## 不拆

[RULES.md](../../RULES.md) §2 写契约改动单独成 PR、先合入。同一节的热点规则和 [docs/approvals.md](../approvals.md) 第 130 行（2026-11-09 01:56，PR #180）写的是：`expose` 为 true 留到真实来源与 handler 同一次合入。四条命令的 handler 已经在库里。若先单独把 `expose` 改成 true 并合入，codegen 会把通道放进 preload 和 registry，生产 map 还没有它们。`ipc-production-assembly.test.ts` 会失败，也会出现「renderer 能调、main 没人接」。因此本批不拆。契约文件上只改四条 `expose`，非生成改动远小于 §2 的 200 行，不另写不拆的行数理由。G18 只数 `packages/features/<切片>/src/`。本批若改 library 的 `library-main.ts`，仍然是一个切片。

## 改哪些文件

物理行数含空行和注释，按 [docs/arch/06.md](../arch/06.md)。函数低于 80 行，圈复杂度不超过 15，参数不超过 4 个。超过建议上限时，实施说明写明为什么不拆。不预写 `G12:`。

`tools/check-pr-size/check.mjs` 的 600 行计入本文件、台账，以及 `registry.generated.ts`、`oi.generated.ts`、`oi-api.d.ts`。它只排除锁文件和 `workers/parser/oi_worker/protocol/`。下面的手写预算是增量目标。codegen 之后若「非锁文件」合计超过 600，停，报告数字，不写 `G12:`，不手改生成物。

| 路径 | 只做的事 | 现在 | 预算 | 完成后上限 |
| --- | --- | --- | --- | --- |
| `accept-result.ts` | 跳过 `__proto__` 与 `stack` | 103 | +20 以内 | 建议 400，硬上限 600 |
| `accept-result.test.ts` | 两条 nit | 114 | +80 以内 | 建议 600，硬上限 800 |
| `reading-asset.ts`、`library-progress.ts` | 四条 `expose` 改为 true | 118、115 | 各 +0 行量级 | 建议 400，硬上限 600 |
| 两份契约测试 | `expose` 断言改为 true | 148、139 | 各 +10 以内 | 建议 600，硬上限 800 |
| `library-main.ts` | 一次打开、一张表、四个工厂；失败路径补四条 `handler_threw` | 135 | +100 以内 | 建议 400，硬上限 600 |
| `library-main.test.ts` | 失败路径不含数据根；不把第二实例写成杀进程 | 67 | +40 以内 | 建议 600，硬上限 800 |
| `library-command-channels.ts` | 加上四条通道 | 13 | +8 以内 | 硬上限 600 |
| `library-wiring.ts` | map 覆盖这四条。不再建第二张表 | 140 | +40 以内 | 建议 400，硬上限 600 |
| 新建 `apps/desktop/test/reading-ipc-wiring.test.ts` | 经 router 走真实工厂 | 无 | +220 以内 | 建议 600，硬上限 800 |
| `reading-command-surface.test.ts`、`oi-keys.test.ts` | 四条出现在 registry 与 `createOi`。不读源码文本 | 68、38 | 各 +20 以内 | 建议 600，硬上限 800 |
| `composition-root.ts` | 无 | 27 | diff 0 | 入口硬上限 150 |
| `slots.ts` | 无 | 3 | diff 0 | 硬上限 600 |
| 规格四文件、changelog、manifest | 见「规格」。实现阶段才改 | 见各文件 | 替换句加 changelog 一行、manifest 一条 | 不改基线，不改 `compare.mjs` |

手写增量按上表上限相加仍低于 600。生成物另算，超限即停。

热点停止条件：`composition-root.ts` 若必须按通道、代际或 `assetId` 写分支，停，不加这支。`slots.ts` 若必须为这四条加界面插槽，停。公开面由 codegen 的 `createOi` 给出，不经插槽。

## 验收

都在实现阶段。本两笔不宣称这些已经发生。

| 结果 | 怎么看 |
| --- | --- |
| 四条出现在 registry 和 `createOi` | `reading-command-surface.test.ts` 与 `oi-keys.test.ts` 改隐藏名单为出现。类型走 `Window["oi"]`。不读生成文件或 src 的文本 |
| 生产 map 覆盖 registry | 现有 `ipc-production-assembly.test.ts`。四条写进 `libraryCommandChannels`，不在测试里临时补 |
| 经 router 走真实命令 | 新测试用一次 `createLibraryMain` 给出的四个工厂。当前代际读、写成功。旧代际、未 bind、已 revoke 都是 `rejected`，回显字段仍在。不在测试里重写代际判断 |
| bind 成功才发出 `assetId` | 成功响应有它。`rejected` 与 `not_found` 没有这个键 |
| 公开面回归不读源码文本 | `parse-capability-surface.test.ts` 保持 F-08。禁止名单不删。它失败时停，不靠删名字变绿 |
| 不宣称重开或 AC-11 | 描述、changelog 和规格句都不写已验收。UIX-57 不标通过 |

## 测试矩阵

| 账本 | 本批 | 不在本批 |
| --- | --- | --- |
| CI | 实现 tip 的 node 与文档门禁必须跑。本两笔不代替那次 | 不把 CI 全绿写成 G1–G18 都已有 |
| Cloud | 接线完成的那个实现 tip 全量只跑一次。前置那一笔只跑它自己的测试文件。`GITLEAKS_BIN` 未设置时的 detect 跳过不是具名 G9 通过 | 不把别的 tip 的通过数写成这一批 |
| Box | 定向 IPC 装配待定。跑了才写结果。本文件不写 PASS | 不预写通过 |
| 真机 | 不跑。本批没有界面，没有必须真机实跑的项 | AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏仍未验收 |

## 规格

本两笔不改这些文件。实现阶段只改下面已经过时的句子，写成「生产 IPC 已挂上，仍不等于重开已验收」。

| 文件 | 现在的句子 | 改成 |
| --- | --- | --- |
| [docs/arch/02-05.md](../arch/02-05.md) 页级进度段 | `expose` 仍是 false，生产 IPC 仍未挂上 | 生产 IPC 已挂上，仍不等于重开已验收 |
| [docs/arch/09-01.md](../arch/09-01.md) 页码段 | 本批 `expose` 为 false，生产 IPC 仍未开通 | 同一句 |
| [docs/prd/08.md](../prd/08.md) 本批归属 | `expose` 仍为 false，生产 IPC 仍未开通。重开与 `expose` 为 true 仍未验收 | 生产 IPC 已挂上。重开的用户路径仍未验收。不把 AC-11 标成通过 |
| [docs/arch/09.md](../arch/09.md) 第 23 行 | 本批这两条以及两条页码命令的 `expose` 为 false | 只改这半句。同一句后半「重复登记、崩溃后清表、先核代际还是先查库仍不在本节写成签名」本批不动 |

同时在 [docs/spec-changelog.md](../spec-changelog.md) 加一行，并在 [tools/compare-spec-bytes/manifest.json](../../tools/compare-spec-bytes/manifest.json) 的 `amendments` 里只追加对应的唯一替换。不改基线 `f8d5d01`，不改 `compare.mjs`。若文档门禁因此失败，停，不自行扩大规格范围。

## 不改

desktop UI、`oi-asset://`、CSP、Range、`ingest.openDocument` 与 `setZoom` 的 `expose`、`getZoom`、`reader.setPage`、`session.save`、`session.restore`、settings、safeStorage、密钥、RULES、CI、门禁、DESIGN、原则、`parse-capability-surface.test.ts` 的禁止名单、两个页码用例文件、四个 command 工厂的判断、`ipc-router.ts`、`pass-through.ts`、`composition-root.ts`、`slots.ts`。

步骤 1 和步骤 2 也不改这些文件。`accept-result.ts` 要等步骤 3 的 PASS，并且只按「接线前置」改。

## 还没核实

- 生产 `createLibraryMain` 一次一张表。测试里第二个无参工厂是另一张空表。这不能代替「杀掉进程再拉起」。本批可以继续用第二个实例证明新表为空，但描述里不把它写成进程重启已验证。
- SQLite 把超界整数读成 number 还是 bigint，仍未核实。经 router 的成功用例只用安全正整数。不新增一条断言驱动类型的测试。

## 风险

- 生成物可能把 G12 顶过 600。停，不预写 `G12:`。
- `parse-capability-surface.test.ts` 若因为公开面变宽而失败，停。不删禁止名单。
- [docs/arch/09.md](../arch/09.md) 第 23 行后半仍说先核代际还是先查库不写成签名。12:04 的实现已经是先查表再查库。本批按范围只改 expose 那半句。要改后半，先另批。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「按推荐：开批次 B 计划+台账两笔 Draft，两个 nit 作为接线前置写进计划，不实施/Ready/合入/发版；允许 Anvil 把合后收口发到 #174」 | 本分支只写批次 B 的计划与台账。两个 nit 写在接线之前。不实施。链接：[6734352813](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6734352813) | 2026-11-09 15:07 | Wisdom |
| 跳过 `__proto__`，不用 `Object.defineProperty` | 见「接线前置」。只满足「不改原型」。不保留这个非业务键 | 2026-11-09 | 本计划的选择，Forge 可在 PASS 前退回 |
| 不拆契约 PR | [docs/approvals.md](../approvals.md) 第 130 行。`expose` 与生产 handler 同一次合入 | 2026-11-09 | 本计划，依据已批先例 |

批次 C、D 不在本文件的实施范围内。

## 证据链接

- `docs/evidence/<PR号>/`：本两笔无。实现 tip `26424591c15197227aabc7e75e86707e17a570c5` 的命令计数写在步骤 4 的证据列。回填本表的提交不再跑全量。

## 自检

- [x] 影响 arch / prd 吗？本两笔不影响。实现阶段会改「规格」表里的句子，并加 changelog 一行和 manifest 的唯一替换。
