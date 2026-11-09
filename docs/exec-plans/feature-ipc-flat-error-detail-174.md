# 执行计划

分支 `feature/ipc-flat-error-detail-174`。基线是远端 `main` `633610f9376cd7124099aa9deae5ca92b15549e2`（PR #185 squash 合入，唯一 parent `f59851d83fa8135d5cbb60e5ed08fcc40e2058b7`，tree `0cfd7a3e6a3fd2294879725e593030ff26900223`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 2026-11-09 13:50 行。然后停。Forge 亲读这两笔确切提交并 PASS 之前，不改 `accept-result.ts`，不改 `pass-through.ts`，不改测试。本文件不是那个 PASS。

本任务没有 UI。不改 [DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md) 或 `docs/design/**`（N-10）。[docs/design-principles.md](../design-principles.md) 的 P4、P7 保持：这一批没有界面。

任务类型：本两笔是纯文档。交接说明写「不适用」。实现阶段改的是 desktop router 的收口，不是 UI 改动、seam 变更或 core 改动。

## 现状理解

- 已有行为：`633610f` 上四个阅读 command 按 `IpcCommandResult` 把拒绝字段放在错误对象上，不嵌套 `detail`。`get`、`set`、`revoke` 的 `rejected` 带 `id` 与 `generation`。`bind` 的 `rejected` 只带 `id`。描述符仍把这些字段的 schema 写在 `IpcErrorSpec.detail` 里。`IpcCommandResult` 与正式 codegen 把 `Static<Detail>` 摊到错误对象上。生产 `acceptHandlerResult` 只在错误对象有 `detail` 键时保留该键；没有这个键就把其余字段丢掉，只留 `code` 与 `retryable`。`ipc-router.test.ts` 锁住的业务错误是嵌套 `detail`。四条契约仍是 `expose: false`。registry 与生产 `wireIpc` 没有这四条。
- 相关的节：[docs/arch/02-04.md](../arch/02-04.md) 第 2 条、[docs/arch/02-05.md](../arch/02-05.md) 页级进度段、[docs/arch/05-01.md](../arch/05-01.md)、[docs/arch/05-02.md](../arch/05-02.md) F-08、[docs/arch/06.md](../arch/06.md)、[docs/arch/09.md](../arch/09.md)、[docs/arch/09-01.md](../arch/09-01.md)、[docs/arch/13.md](../arch/13.md) G11 与 G12、[docs/prd/06-01.md](../prd/06-01.md) AC-11、[docs/prd/08.md](../prd/08.md)「M2 ③ 本批归属」、[DESIGN.md](../../DESIGN.md) §12.2 与 UIX-57、[docs/design-principles.md](../design-principles.md) P4、P7、[RULES.md](../../RULES.md) §1.1、§2、§4、§9、N-03、N-09、N-10。
- 还没做的部分：生产 router 仍会丢掉扁平的 `id` 与 `generation`。本两笔只写计划和台账。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| Issue #174 评论 | [6733283555](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6733283555) | 对得上。Wisdom 2026-11-09 13:50 Asia/Shanghai 原话是「按推荐：批准批次 A 单独 Draft，按 PLAN.md 第 154 行原句，错误格式用平铺，计划+台账两笔先审，不 Ready/合入/发版」。评论抄录了所批原句全文。GitHub `created_at` 是 `2026-11-09T05:50:28Z`。台账时间用评论正文里的 13:50。仓库里没有名为 PLAN.md 的文件。原句以这条评论为准 |
| [packages/contracts/src/ipc/descriptor.ts](../../packages/contracts/src/ipc/descriptor.ts) | `IpcErrorBody`、`IpcCommandResult` | 对得上。40–57 行把 `detail` schema 摊进错误对象。65–71 行的结果类型用这个错误体。本批不改 |
| [tools/codegen/preload-render-error.mjs](../../tools/codegen/preload-render-error.mjs) | `renderOne` | 对得上。31–36 行是 `{ code, retryable }` 与 detail 类型的交叉，不是嵌套 `detail` 键。本批不跑 codegen，不改生成物 |
| [packages/contracts/src/ipc/reading-asset.ts](../../packages/contracts/src/ipc/reading-asset.ts) | `bindRejected`、`pairRejected` | 对得上。32–44 行把字段写在 `detail` schema 里。`expose` 在 75 行与 91 行仍是 false |
| [packages/contracts/src/ipc/library-progress.ts](../../packages/contracts/src/ipc/library-progress.ts) | `pairRejected` | 对得上。26–30 行同样把 `id` 与 `generation` 写在 `detail` schema 里。`expose` 在 75 行与 90 行仍是 false |
| [packages/features/library/src/application/get-progress-page-command.ts](../../packages/features/library/src/application/get-progress-page-command.ts) | `rejected` | 对得上。101–110 行返回扁平 `{ code: "rejected", retryable: false, id, generation }` |
| [packages/features/library/src/application/set-progress-page-command.ts](../../packages/features/library/src/application/set-progress-page-command.ts) | `rejected` | 对得上。107–116 行与 get 相同 |
| [packages/features/library/src/application/revoke-reading-asset-command.ts](../../packages/features/library/src/application/revoke-reading-asset-command.ts) | `rejected` | 对得上。57–66 行与 get 相同 |
| [packages/features/library/src/application/bind-reading-asset-command.ts](../../packages/features/library/src/application/bind-reading-asset-command.ts) | `rejectedId` | 对得上。82–83 行返回扁平 `{ code: "rejected", retryable: false, id }`，没有 `generation` |
| [apps/desktop/src/main/ipc/accept-result.ts](../../apps/desktop/src/main/ipc/accept-result.ts) | `acceptError` | 对得上。85 行。44–63 行的传输错误只留 `code` 与 `retryable`。66–74 行没有 `detail` 键时丢掉其余字段；有则保留嵌套 `detail`。不按命令的 error schema 校验附加字段 |
| [apps/desktop/src/main/ipc/pass-through.ts](../../apps/desktop/src/main/ipc/pass-through.ts) | `IpcPassThrough` | 对得上。30 行。6–8 行的错误体只声明 `code` 与 `retryable`。21–25 行只检查这两项的类型，不拒绝多余键 |
| [apps/desktop/src/main/ipc/ipc-router.ts](../../apps/desktop/src/main/ipc/ipc-router.ts) | `callHandler` | 对得上。178 行把 handler 的结果交给 `acceptHandlerResult` 后原样返回。本批 diff 为 0 |
| [apps/desktop/test/ipc-router.test.ts](../../apps/desktop/test/ipc-router.test.ts) | 传输与嵌套 detail | 对得上。495 行。204–232 行剥掉三种传输错误的附加字段。235–263 行与 278–288 行锁住嵌套 `detail`。断言要改，用例不删 |
| [apps/desktop/src/main/ipc/registry.generated.ts](../../apps/desktop/src/main/ipc/registry.generated.ts) | `channel` | 对得上。只有 `library.import`、`library.importDropped`、`library.list`、`library.relocate`。本批不改 |
| [apps/desktop/package.json](../../apps/desktop/package.json) | dependencies | 对得上。没有 `@oi/contracts`。desktop main 不为了错误类型去 import 契约。见 [docs/arch/05-01.md](../arch/05-01.md)：MAIN 的出边没有到 C |
| [apps/desktop/src/main/composition-root.ts](../../apps/desktop/src/main/composition-root.ts) | 装配根 | 对得上。27 行。热点。本批 diff 为 0 |
| [apps/desktop/src/renderer/slots.ts](../../apps/desktop/src/renderer/slots.ts) | 热点 | 对得上。3 行。本批 diff 为 0 |
| [packages/features/library/src/adapters/library-main.ts](../../packages/features/library/src/adapters/library-main.ts) | `createLibraryMain` | 对得上。135 行。本批 diff 为 0 |
| [apps/desktop/src/main/library-wiring.ts](../../apps/desktop/src/main/library-wiring.ts) | 装配 | 对得上。140 行。本批 diff 为 0 |

## 计划 / 实际

计划列在开工前填。实际列在对应提交之后才填。本文件提交时，实际列保持空白。第二笔只改台账，不回填本表。Forge PASS 这两笔之前不填实现证据。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `dda5ad0a5d76b9501bfd6bce7b7072cef1cc5eed` 只有本文件，+191 | 该提交 |
| 2 | 只在 `docs/approvals.md` 追加 13:50 原话、所批原句全文、时间和登记链接，并改文末计数。然后停 | `720294557631353be8387b1d02df327a19b23087` 只有 `docs/approvals.md`，+2/−1 | 该提交 |
| 3 | Forge 亲读步骤 1 与步骤 2 的确切提交。PASS 之前没有步骤 4 | 2026-11-09 14:06 Asia/Shanghai PASS。评论 [6733486945](https://github.com/wisdom-km/open-immerse-v2/pull/187#issuecomment-6733486945)。GitHub `created_at` 是 `2026-11-09T06:06:27Z` | 该评论 |
| 4 | 按「行为」与「原句对照」实现。不在步骤 1、2 | `bb9d2d4d1a3b41b7b24234db64dc4bb7d3d685ce` 只改 `accept-result.ts`（+34/−16，完成后 103 行）、`pass-through.ts`（+7/−4，完成后 33 行）、新建 `accept-result.test.ts`（+114，114 行），并改 `ipc-router.test.ts` 两处断言与用例名（+7/−4，完成后 498 行）。跳过名单的最终结论：复制自有键时跳过 `code`、`retryable`、`message`、`detail`。不跳过 `stack`。原句只要求不出现 `message`；把 `stack` 写进跳过名单是原句外的行为，所以新测试只夹 `message`，不断言 `stack`。冲突规则：先留下错误对象上的扁平字段，`detail` 里的同名键不覆盖。不另写冲突测试。不按 error schema 校验附加字段 | 该提交上的全量，见证据链接。回填本表的提交不再跑全量 |

## 原句对照

下表每一行都是 13:50 所批原句里的一个约束。实现不得少做一行，也不得多做原句没有的事。

| 原句约束 | 本文件落点 |
| --- | --- |
| 单独 Draft | 本分支只做错误形状。不包含批次 B、C、D。不把 Draft 标成 Ready |
| 对齐 `IpcCommandResult` 的扁平错误字段与 `accept-result.ts` 的收口形状 | 见「行为」 |
| 只改 `apps/desktop` 的 accept-result、必要时的 pass-through 类型，以及对应测试 | 见预算表。`pass-through.ts` 要改，理由见「类型」 |
| 生产 router 不再丢掉 handler 按 `IpcCommandResult` 放在错误对象上的 `id` 与 `generation` | 扁平 `rejected` 经现有 `registerIpcRouter` 后仍带这些字段 |
| 规范输出与 `IpcCommandResult` 及正式 codegen 的错误类型一致，使用扁平字段 | 输出没有嵌套 `detail` 键 |
| 若 handler 已嵌套 `detail`，则展开到错误对象上 | 改现有两条夹具的断言，不删用例 |
| 传输错误仍只保留 `code` 与 `retryable` | `sender_rejected`、`invalid_payload`、`handler_threw`。现有 204–232 行的断言不改 |
| 不另造错误码 | 不新增 `code`。不改 `ipcTransportErrors` |
| 不改四个阅读 command 的实现 | `bind`、`revoke`、`get`、`set` 四个 command 文件 diff 为 0 |
| 不改两个用例 | `use-cases/get-progress-page.ts` 与 `use-cases/set-progress-page.ts` diff 为 0 |
| 不改 contracts | `packages/contracts` diff 为 0 |
| 不改 expose | 四条仍是 false |
| 不写入 registry、preload 或生产 `wireIpc` | 不跑 codegen，不改生成物，不改 `ipc-router.ts`、`library-command-channels.ts` |
| 四个装配文件的 diff 为 0 | `composition-root.ts`、`slots.ts`、`library-main.ts`、`library-wiring.ts` |
| 不含 desktop UI、受控协议、settings、密钥、RULES 或 CI | 见「不改」 |
| 第一笔只有执行计划，第二笔只抄录批准台账，Forge 亲读这两笔 PASS 之后才写实现 | 步骤 1–3 |
| 只开 Draft，不授权 Ready、合入或发版 | PR 保持 Draft |
| AC-11、3A、PRC-01–26、UIX-57 与 8 GB 录屏保持未验收 | 见验收矩阵 |

## 行为

只改 `apps/desktop` 里收口结果的文件和测试。desktop main 继续不 import `@oi/contracts`。不把 `IpcCommandResult` 抄进 desktop。错误仍是带 `code` 的普通数据（[docs/arch/02-04.md](../arch/02-04.md) 第 2 条）。

`acceptHandlerResult` 的参数保持现在的两个：响应 schema 与 handler 结果。错误路径继续不读那份 schema。`ipc-router.ts` 的调用点不变。

### 传输错误

`code` 是 `sender_rejected`、`invalid_payload` 或 `handler_threw` 时，输出只有 `code` 与 `retryable`。`retryable` 仍用 `accept-result.ts` 里现有的三行表，不用 handler 送来的那个布尔值。`detail`、`message`、`id`、`generation` 和其他键都不留下。这三码的现有测试断言保持原句。

### 业务错误

其他 `code` 走业务错误。输出是扁平对象。

1. `code` 与 `retryable` 取错误对象自己的值。
2. 再复制错误对象上的其他自有键。跳过 `code`、`retryable`、`message`、`detail`。
3. `detail` 的值是普通对象（不是 `null`，不是数组）时，把它的自有键补到错误对象上。同样跳过 `code`、`retryable`、`message`、`detail`。已经从第 2 步留下的键不被覆盖。
4. `detail` 不是普通对象时，不留下 `detail` 键，也不按它的内容造字段。现有夹具没有这种输入。实现不另写这种夹具。
5. 输出对象上没有 `detail` 键，也没有 `message` 键。

因此：

| handler 的错误对象 | 输出的 `error` |
| --- | --- |
| `{ code: "rejected", retryable: false, id, generation }` | 同一对 `id` 与 `generation` 还在。没有 `detail`，没有 `message` |
| `{ code: "rejected", retryable: false, id }` | 仍只有这个 `id`。不补 `generation` |
| `{ code: "not_found", retryable: false, detail: { id: "doc-1" }, message }` | `{ code: "not_found", retryable: false, id: "doc-1" }`。`id` 还在。`message` 不在 |
| 三种传输码，不论还带了什么 | 只有 `code` 与表里的 `retryable` |

不新增错误码。不把业务错误改写成传输错误。成功值的现有收口不动。

### 类型

`IpcPassThrough` 的错误体要放宽。现在的声明只有 `code` 与 `retryable`。扁平的 `id` 与 `generation` 应当写在这个类型上，而不是靠先装进变量来躲过多余属性检查。放宽后仍有 `code: string` 与 `retryable: boolean`，并允许其余只读的普通数据字段。不用 `any`。不从 `@oi/contracts` 导入。`isPassThrough` 仍只要求 `code` 为字符串、`retryable` 为布尔。不把 `id` 或 `generation` 改成必填，因为 `bind` 没有 `generation`，`not_found` 可以两者都没有。传输错误的返回值字面量仍只有 `code` 与 `retryable`。

这是原句里的「必要时」。本批判断为必要：不放宽的话，声明类型与扁平输出不一致。

## 改哪些文件

物理行数含空行和注释，按 [docs/arch/06.md](../arch/06.md)。函数低于 80 行，圈复杂度不超过 15，参数不超过 4 个。超过建议上限时，实施说明写明为什么不拆。不预写 `G12:`。

| 路径 | 只做的事 | 行数预算 |
| --- | --- | --- |
| `apps/desktop/src/main/ipc/accept-result.ts` | 业务错误保留扁平字段；嵌套 `detail` 展开。现在 85 行 | +40 以内。完成后低于 150，硬上限 600 |
| `apps/desktop/src/main/ipc/pass-through.ts` | 放宽错误体声明。现在 30 行 | +20 以内。硬上限 600 |
| 新建 `apps/desktop/test/accept-result.test.ts` | 扁平 `rejected` 的两条夹具，走现有 `registerIpcRouter` | +80 到 +160。建议低于 600，硬上限 800 |
| `apps/desktop/test/ipc-router.test.ts` | 只改 235–263 行与 278–288 行锁嵌套 `detail` 的断言和用例名。现在 495 行 | 仍低于 800。不把新用例堆进这个文件 |
| `ipc-router.ts` | 现在 244 行 | diff 0 |
| `composition-root.ts` | 现在 27 行 | diff 0 |
| `slots.ts` | 现在 3 行 | diff 0 |
| `library-main.ts` | 现在 135 行 | diff 0 |
| `library-wiring.ts` | 现在 140 行 | diff 0 |

新测试文件的名字按 RULES §1.4，对 `accept-result.ts`。夹具用本地 registry 条目，请求形状照 `ipc-router.test.ts` 里已有的 `command`，这样 handler 能被调用。拒绝体的字段照四个 command 的返回值。不 import 那些工厂，也不跑两个用例。不把四条通道写进生产 registry。

`ipc-router.test.ts` 里那两条 `it` 保留。断言从嵌套 `detail: { id: "doc-1" }` 改成扁平的 `id: "doc-1"`。`it` 的句子改成描述扁平结果。这是改断言，不是删用例。两条里「编码结果不含 secret-message / secret-error」的断言保留。

204–232 行的传输测试不改断言。实现把它打红时，改收口，不放宽这条测试。

测试名用英文 `… when …`，与 `ipc-router.test.ts` 同一目录的现有句子一致。同一文件不中英混用。

## 验收与未验证

实现阶段至少这些可观察结果。都走 `registerIpcRouter`。它在 [ipc-router.ts](../../apps/desktop/src/main/ipc/ipc-router.ts) 178 行调用 `acceptHandlerResult` 并原样返回。

| 证据 | 用什么 | 不用什么 |
| --- | --- | --- |
| 扁平 `rejected` 带 `id` 与 `generation` | 新文件。输出仍是这一对，值相同 | 不 import 页码 command |
| bind 形状的扁平 `rejected` | 新文件。输出只有 `id`。对象上没有 `generation` 键 | 不补一个 generation |
| 三种传输错误 | 现有 204–232 行。`sender_rejected`、`invalid_payload`、`handler_threw` 只剩 `code` 与表里的 `retryable` | 不改这些断言来迁就实现 |
| 旧嵌套 `detail` | 现有两条夹具。`id` 仍是 `"doc-1"`，没有 `detail` 键 | 不删这两条 `it` |
| `message` | 业务错误与传输错误的输出都没有 `message` 键。现有秘密字符串不出现在编码结果里 | 不把 `message` 当成业务字段 |

| 账本 | 本批 | 不在本批 |
| --- | --- | --- |
| CI | 实现 tip 的 node 与文档门禁。必须跑。本两笔不代替那次 | 不把 CI 全绿写成 G1–G18 都已有 |
| Cloud | 实现 tip 全量只跑一次。`GITLEAKS_BIN` 未设置时的 detect 跳过不是具名 G9 通过 | 不把别的 tip 的通过数写成这一批 |
| Box | 不跑。理由：四条命令仍未进入 registry 或生产 `wireIpc`，没有新的生产入口。不写 Box PASS | 本批不写别的 Box 规则 |
| 真机 | 不跑。没有必须真机实跑的项 | AC-11、3A、PRC-01–26、UIX-57、8 GB 录屏仍未验收 |

具名 G9 若失败，按 ADR 0005 停止放行并保留原件。

## 不改

四个阅读 command、`use-cases/get-progress-page.ts`、`use-cases/set-progress-page.ts`、contracts、`expose`、codegen、`registry.generated.ts`、preload、`oi.generated.ts`、`ipc-router.ts`、`library-command-channels.ts`、`payload-schema.ts`、`ipc-handlers.ts`、`library-main.ts`、`library-wiring.ts`、`composition-root.ts`、`slots.ts`、desktop UI、受控协议、`oi-asset://`、Range、CSP、settings、safeStorage、密钥、RULES、CI、门禁、DESIGN、原则、[docs/spec-changelog.md](../spec-changelog.md)、`tools/compare-spec-bytes/manifest.json`。

步骤 1 和步骤 2 也不改这些文件。实现阶段同样不改。规格没有单独立一节写「线上 JSON 是扁平还是嵌套」。本批对齐已经存在的 `IpcCommandResult` 和 codegen，不补那一节。若文档门禁因此失败，停，不自行改规格。

## 风险

- 选错规范形状会逼后续 expose 批次再改 codegen 或再改 command。本批按已批的扁平形状做。codegen 与四个 command 已经是扁平的，本批不改它们。
- 现有 router 测试锁的是嵌套 `detail`。改输出形状必须改这两处断言。删掉它们就失去旧夹具。
- 同一键若既在错误对象上、又在 `detail` 里，且值不同：本批没有这种夹具。实现按「先留下扁平字段，`detail` 不覆盖」处理，不另写冲突测试。
- `pass-through.ts` 放宽之后，输入侧仍接受带多余键的错误。输出侧由 `accept-result.ts` 决定留下什么。不要在 `isPassThrough` 里开始删除键，以免和收口分成两套规则。

## 还没核实

- `accept-result.ts` 66–74 行不按该命令的 error schema 校验 `detail` 或扁平附加字段。本批默认不补这道校验。补了就要把 schema 送进 `acceptHandlerResult`，或改 `ipc-router.ts`。那超出原句。
- PRC-01–26 的完整定义表还没找到。这 26 条保持未验收，本批不去找清单的途中改代码。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「按推荐：批准批次 A 单独 Draft，按 PLAN.md 第 154 行原句，错误格式用平铺，计划+台账两笔先审，不 Ready/合入/发版」 | 本分支只实施批次 A。规范形状是扁平。原句全文见台账第二笔。链接：[6733283555](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6733283555) | 2026-11-09 13:50 | Wisdom |

批次 B、C、D 不在本文件的实施范围内。它们的登记不能用来改本分支的 router、契约或装配。

## 证据链接

- 不另建 `docs/evidence/187/`。本批只允许计划回填和点名的代码文件。全量记在这里，也记在 PR #187 描述。
- 实现 tip `bb9d2d4d1a3b41b7b24234db64dc4bb7d3d685ce`，tree `435efa42d289352fa8014dd15ac47bfdeb060c94`。Node v22.23.4。pnpm 10.34.9。`GATE_BASE=origin/main`。`GITLEAKS_BIN` 未设置。
- `corepack pnpm run check` 退出码 0。`check-pr-size: 380 non-generated lines`。`check-one-slice: 0 feature slice(s)`。`check-hotspots` 通过。
- `corepack pnpm test` 退出码 0。170 个文件通过。719 通过，3 跳过，0 失败。类型错误 0。3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect，日志只有 `phase=binary`：`reject-access-key`、`allow-oitest`、`reject-nottest`。这不是具名 G9 通过。
- `node tools/check-docs/check.mjs` 退出码 0。`node tools/check-arch-graph/check.mjs` 退出码 0（`unmapped 0`）。
- Python：ruff check、ruff format、pyright、lint-imports 退出码都是 0。pytest 181 通过，退出码 0。
- 没有出现 #186 的 5000ms 超时。Box 未跑。真机未跑。Electron 未跑。没有为计数再跑一次全量。

## 自检

- [x] 影响 arch / prd 吗？不影响。本两笔和原句允许的实现都不改 PRD、ARCHITECTURE、changelog 或 manifest。
