# 执行计划

分支 `feature/config-store-chip-174`。基线是 `main` `5db585df3c460a1d6a8ac2d33583cde16e48970e`，tree `b56d0d364b9dea92a04c4c7da98a8575034d9716`（提交说明 `docs: 按现状改正阅读界面与 renderer 清单 (#203)`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 的 2026-11-14 13:57 那一行，以及 [docs/spec-changelog.md](../spec-changelog.md) 的对应一行。批准数从 151 改为 152。`tools/compare-spec-bytes/manifest.json` 不动：比对的规格字节没有变，不追加空修订。两笔都不是执行计划 PASS。Forge 亲读这两笔并 PASS 之前，不写实现。本文件在第二笔里不回填 SHA。

本两笔不改业务代码、测试、CI、CSP、协议注册、codegen 生成物、契约、主进程、`packages/features/library/src/`、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)、`docs/design/**`（N-10）。不标 Ready，不合入，不发版，不 force-push。

任务类型：本两笔是纯文档。交接说明写「不适用」。后面的编码按下面的 PR 拆开。存储那一笔是 core 改动。chip 那一笔是 UI 改动，任务说明必须带上下面这一句，且 core 目录零改动：

> 本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 现状理解

- 已有阅读屏。[packages/features/reader/src/ui/reader-screen.tsx](../../packages/features/reader/src/ui/reader-screen.tsx) 第 55 行是空的 `<span className="oi-reader-chip" />`，放在拖拽空白后面。测试 [reader-screen.test.tsx](../../packages/features/reader/test/ui/reader-screen.test.tsx) 第 48 行锁住这段文字是空字符串。丢位置的提示已经是 `role=status`（同文件第 49–52 行）。[copy.ts](../../packages/features/reader/src/ui/copy.ts) 没有降级句。
- 已有能力契约，三笔都已合入。PR #179 把文献库 PDF 收成受控资产，并写明 AC-11 的真实最小能力查询在数据源收口前不得标通过。PR #180 定了配置读写和能力查询的形状；Wisdom 2026-11-09 01:56 把 `parsing.getParseCapabilities` 的 `expose` 留到真实配置来源与 handler 同一次合入。PR #181 定了页级进度，不实现保存或恢复，也不改这条能力查询。
- 三条命令现在都是 `expose: false`。[packages/contracts/src/ipc/parsing.ts](../../packages/contracts/src/ipc/parsing.ts) 第 15–22 行：`parsing.getParseCapabilities`，请求是空对象，成功体是 `{ state: "configured" | "unconfigured" }`，错误是 `storage_corrupt` 与 `secret_unavailable`，再加传输错误，`idempotent: true`。[packages/contracts/src/ipc/settings-parse.ts](../../packages/contracts/src/ipc/settings-parse.ts) 第 35–54 行：`settings.saveParseService` 与 `settings.getParseServiceStatus` 同样不暴露。保存请求带 `vendorId`、`format`、`baseUrl`、`modelId`、`allowedHosts`（至少一项）和 `secret`，都非空。保存成功体只有 `{ state: "configured" }`。`secret` 只出现在保存请求上。
- 状态语义在 [packages/contracts/src/parse-service-status.ts](../../packages/contracts/src/parse-service-status.ts) 第 5–9 行，以及 [docs/arch/02-05.md](../arch/02-05.md) 第 32 行：没有元数据记录才是 `unconfigured`。孤儿密文不参与判断。`configured` 还要所引用的密钥可用。记录在、但密钥缺失、解密失败或损坏，是错误，不是 `unconfigured`。构建是否提供解析、本篇是否已有译文，都不是这条查询的结果。同段写明存储、密钥读写、handler 与 core 都还没有实现，未接到那次合入之前不得把 AC-11 标成验收通过。
- 生产表面不包含这条查询。[apps/desktop/test/parse-capability-surface.test.ts](../../apps/desktop/test/parse-capability-surface.test.ts) 禁止 registry 与 preload 出现 `parsing`、`settings` 和密钥相关名字，并写明以后的暴露批准必须在同一次改动里更新这个测试。[apps/desktop/test/ipc-production-assembly.test.ts](../../apps/desktop/test/ipc-production-assembly.test.ts) 期望命令列表里没有 `parsing.getParseCapabilities`。
- 数据库只有一份 `db/oi.sqlite`，表前缀按切片，迁移由拥有切片持有（[docs/arch/08-02.md](../arch/08-02.md)）。`settings` 的前缀是 `set_`。密钥在主进程的 `secrets.bin`，经 `safeStorage`，不进 SQLite，不进渲染进程（[docs/arch/08-03.md](../arch/08-03.md)、[docs/arch/01.md](../arch/01.md)）。今天打开这一份库的代码在 [packages/features/library/src/adapters/library-main.ts](../../packages/features/library/src/adapters/library-main.ts) 第 113–127 行，只读 `library` 的迁移。`settings/` 与 `diagnostics/` 在 [docs/arch/03.md](../arch/03.md) 仍是「计划中」。依赖图里 reader 只经 `window.oi` 调其他切片，业务切片不 import `settings`（[docs/arch/04-03.md](../arch/04-03.md)）。主进程可以依赖适配器和用例（[docs/arch/05-01.md](../arch/05-01.md)）。
- AC-11 在 [docs/prd/06-01.md](../prd/06-01.md) 第 18 行：未配置任何解析服务时，可打开 PDF、浏览原文、读取文字层通读、记笔记；界面显示明确降级状态。US-16 在 [docs/prd/05.md](../prd/05.md) 第 25 行，提示的原词是「未解析 / 去配置」。③ 只覆盖「打开 PDF、浏览原文」和这句降级状态。文字层通读和记笔记仍不在本批。
- PRC-10 在仓库里没有定义。批次 D 计划的 D-20 写明：这个编号未入库，只沿用设计稿编号，不把编号写进 PRD。本文件沿用这个边界。
- DESIGN 里任务摘要 chip 的位置在 [DESIGN.md](../../DESIGN.md) §4.5.1 第 468 行：弹性空白（拖拽区）之后、栏位分段之前。§3.8.1 第 341 行的 chip 文案是进度、「解析失败 · 查看」、「✓ 解析完成」，那是任务状态，不是未配置句。§4.1 第 367 行把「解析与翻译状态摘要」放在标题栏。§4.1 第 394 行的空态是「这篇论文还没有译文。可以先读原文文字层 · 去设置翻译服务」。3A 要求切到对照或译文时把降级句再说一次，不用阅读区横幅。本批不改 DESIGN 正文。
- 另一条分支 `feature/reader-nav-zoom-174` 在写本文件时，`git ls-remote` 没有这个 head，也没有打开的 PR。范围来自 Issue #174 评论 [6872732174](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872732174)：同一基线 `5db585d`，只交计划和台账，做缩放、转到页码、位置历史和栏位；明确不含配置存储和 AC-11 chip；也会改 `docs/approvals.md`。冲突留到合入顺序确定后再处理。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| 13:57 批准 | Issue #174 评论 [6872740488](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872740488) | 对得上。原话有两句：「配置存储+chip：按推荐，现在开计划 Draft，只交计划和台账，不写代码；不 Ready/合入/发版」；「#201：按推荐，单开只改 docs 的小 PR 修 ADR 0010:22、commands.md:85、arch/09.md:32；不 Ready/合入/发版」。GitHub `created_at` 是 `2026-11-14T05:58:09Z`。台账时间用评论正文里的 13:57。本 PR 只执行第一句。第二句记在同一行里，避免丢掉，本 PR 不改那三个文件 |
| 台账 | [docs/approvals.md](../approvals.md) 末行 | 对得上。`5db585d` 上末行是 2026-11-14 13:38 的合入同步，计数是 151 条批准 + 1 条反馈记录 + 4 条决定 + 5 条合入同步。第二笔只追加 13:57，改为 152。文首「日期：2026-11-08」不动，后面的行也没有改过它 |
| 6-2 A | 评论 [6739648033](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6739648033) | 批次 D 不含降级 chip。AC-11 的降级部分和 PRC-10 保持「未满足 / 待补」，不删除。最小配置存储、读口、handler 和 chip 另开一批，M2 结束前补完。本文件就是这一批的计划 |
| 3A | 台账 2026-11-05 21:01，评论 [6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956) | 降级句写在任务摘要 chip，`role=status`。切到对照或译文时，空态里再说一次。不用阅读区横幅。③ 只覆盖打开 PDF 与浏览原文。默认视图暂时是原文。不改 DESIGN。‹ 和「返回文献库」回库。← → 保持禁用 |
| 配置语义 | 评论 [6724143329](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6724143329) | 保留「用户有没有配置解析服务」的原义。补最小真实配置存储和读写接口的设计。不含设置页、完整解析任务和译文。只读能力查询回答真实配置来源，不回答「这个构建有没有解析」。这不是实现批准，也不是契约签名批准 |
| 硬约束 | PR #180 契约与 02-05 第 32 行 | A1：`settings.saveParseService` 与 `settings.getParseServiceStatus` 保持 `expose: false`。A2：没有元数据记录就是 `unconfigured` |
| 原则 | [docs/design-principles.md](../design-principles.md) 第 21、25、27 行 | P3 阅读屏没有常驻主按钮。P5 状态在原处、`role=status`、不用 toast。P7 界面不自己计算业务条件 |

## 目标

未配置解析服务时，打开一篇已入库的 PDF，原文仍能看。标题栏任务摘要 chip 显示 US-16 的「未解析 / 去配置」，`role=status`，不是按钮，不是链接。查询来自真实的元数据表。没有记录就是 `unconfigured`。本批不写密钥，因此生产路径不会返回 `configured`。

用户能看见的成功：空库打开 PDF，原文在，chip 上有这句。切到对照或译文时，空态用同一句再说一次；栏位切换本身属于 `feature/reader-nav-zoom-174`，本批只提供那一句和承载它的组件。

## 模块、读口、依赖

配置存储放在新的 `settings` 切片，不放进 `library`，不放进 `reader`。`settings` 拥有 `set_` 表（[docs/arch/04-02.md](../arch/04-02.md)、[docs/arch/08-02.md](../arch/08-02.md)）。目录按 [docs/arch/03-01.md](../arch/03-01.md)。

表 `set_parse_service` 只有一行，主键固定为 1。列对应已有保存请求里的元数据：`vendor_id`、`format`、`base_url`、`model_id`、`allowed_hosts`（JSON 文本）、`secret_ref`（不透明字符串）。没有密钥列，不读 `secrets.bin`。

读口不新造契约。两条已有命令都调用同一个用例：

- `parsing.getParseCapabilities({})` → `{ state }`，或 `storage_corrupt` / `secret_unavailable`。`expose` 维持 false，直到下面的决定 W1。
- `settings.getParseServiceStatus({})` → 同一个成功体和同一组读错误。`expose` 维持 false。这是 A1，本批不打开。

用例：

```ts
createGetParseServiceStatus(deps: {
  store: ParseServiceStore;
  secrets: ParseSecretLookup;
}): (input: Record<string, never>) => Result<
  { state: "configured" | "unconfigured" },
  { code: "storage_corrupt" | "secret_unavailable" }
>
```

`ParseServiceStore.readMetadata()` 返回这一行，或 `null`，或 `storage_corrupt`。不返回密钥字节。`ParseSecretLookup` 只回答某个 `secret_ref` 现在能不能用。本批的生产适配器固定返回 `secret_unavailable`，不打开 `secrets.bin`，不写密钥文件。测试替身可以返回「可用」，用来锁住「有记录且密钥可用 → configured」。生产 chip 走不到 `configured`。

分类规则放在 `settings` 的 domain，一处：

- 没有行：`unconfigured`。不询问密钥。孤儿密文因此不参与判断（A2）。
- 行读不出来，或 `allowed_hosts` 不是非空字符串数组：`storage_corrupt`。
- 有合法行，密钥不可用：`secret_unavailable`。
- 有合法行，密钥可用：`configured`。本批生产适配器不产生这一支。
- 没有 `build_unsupported`。构建是否带解析不进入结果。

`settings.saveParseService` 本批不实现。它的成功体只有 `configured`，而 `configured` 要求可用密钥。本批又禁止密钥存储。做成生产写入就会要么返回一个没有密钥的 `configured`，要么改契约。两件事都在下面的决定里，不在本批默认范围。

依赖方向：

- `settings/domain` → `@oi/kernel`，以及 `@oi/contracts` 里的状态类型（`parse-service-status`）。不 import IPC 命令对象，不 import reader、library、ingest。
- `settings/application` → domain 与自己的端口。
- `settings/adapters` → application、`@oi/platform-node`、IPC 类型。
- `reader` 的 UI 只调用 `window.oi`。不 import `settings`。
- `settings` 不 import `reader`。
- 主进程可以 import `settings` 的 main 出口和 `library` 的 main 出口。这一步本身是决定 W2。

`index.ts` 只导出 `createGetParseServiceStatus`。SQLite 和 handler 从 `./main` 出口给主进程，渲染进程的包入口到不了它们。

## 每个文件的职责和行数上限

一个文件只做一件事。下表是 Forge PASS 并且相应决定已有答复之后的实现文件。本 PR 不创建它们。行数是硬上限，按 [docs/arch/06.md](../arch/06.md)：普通文件建议 400、硬限 600；函数建议 50、硬限 80。这里把新文件压得更紧，避免一个文件堆两件事。

| 文件 | 只做这一件事 | 上限 |
| --- | --- | --- |
| `packages/features/settings/package.json` | 包名 `@oi/feature-settings`、exports、依赖 | 40 |
| `packages/features/settings/README.md` | 一段：这包只存解析服务元数据 | 30 |
| `src/index.ts` | 导出 `createGetParseServiceStatus` | 20 |
| `src/pure.ts` | 再导出 `classifyParseRecord` | 15 |
| `src/domain/parse-record-failure.ts` | 两个读错误码 | 30 |
| `src/domain/parse-record.ts` | `classifyParseRecord` | 80 |
| `src/application/ports/parse-service-store.ts` | `readMetadata` 端口 | 40 |
| `src/application/ports/parse-secret-lookup.ts` | 「这个 secret_ref 能否用」端口 | 30 |
| `src/application/use-cases/get-parse-service-status.ts` | 读端口，调用分类 | 70 |
| `src/adapters/sqlite-parse-service-store.ts` | 只 SELECT 这一行并校验 | 90 |
| `src/adapters/unavailable-secret-lookup.ts` | 固定 `secret_unavailable`，无文件 IO | 25 |
| `src/adapters/get-parse-capabilities-handler.ts` | 只翻译 `parsing.getParseCapabilities` | 50 |
| `src/adapters/get-parse-service-status-handler.ts` | 只翻译 `settings.getParseServiceStatus` | 50 |
| `src/testing/fake-parse-service-store.ts` | 内存替身 | 40 |
| `migrations/0001_set_parse_service.sql` | 这一张表 | 25 |
| `test/core/classify-parse-record.test.ts` | 分类四支，以及无行时不调用密钥端口 | 120 |
| `test/core/get-parse-service-status.test.ts` | 用例把端口结果收成契约成功体或错误 | 160 |
| `test/adapters/sqlite-parse-service-store.test.ts` | 空表、坏 JSON、一行合法元数据；不读密钥文件 | 160 |
| `packages/features/reader/src/ui/parse-degrade-copy.ts` | 常量「未解析 / 去配置」 | 15 |
| `packages/features/reader/src/ui/parse-status-chip.tsx` | 按给定状态渲染 chip | 50 |
| `packages/features/reader/src/ui/parse-empty-note.tsx` | 同一句，`role=status` | 40 |
| `packages/features/reader/src/ui/use-parse-status.ts` | 只调用一次读口 | 50 |
| `packages/features/reader/test/ui/parse-status-chip.test.tsx` | chip 的四种结果 | 150 |
| `packages/features/reader/test/ui/parse-empty-note.test.tsx` | 空态复读 | 80 |

已有文件只做点名的那一处，不顺手改别的：

| 文件 | 现在 | 允许的改动 | 上限 |
| --- | --- | --- | --- |
| `reader-screen.tsx` | 168 | 用 chip 组件换掉第 55 行的空 span；视图不是原文时渲染空态复读 | 200 |
| `reader-client.ts`（feature） | 48 | 增加 `readParseStatus` | 80 |
| `apps/desktop/src/renderer/reader-client.ts` | 80 | 生产实现调用已暴露的那条命令。等到 W1 之后 | 110 |
| `use-reader-session.ts` | 258 | 不改 | 258 |
| `reader-screen.test.tsx` | 560 | 不往这个文件加用例。已有假客户端补上读口的默认返回，让第 48 行的空 chip 仍然成立 | 600 |
| `copy.ts` | 10 | 不改。句子在新文件 | 10 |
| `page-column.tsx` | 95 | 不改。不把句子放进原文栏 | 95 |
| `domain/reader-session.ts` | 已有视图与缩放 | 不改。缩放、历史、栏位留给另一条分支 | 保持现状 |
| `apps/desktop/src/main/composition-root.ts` | 27，热点 | 目标 diff 0 | 27 |

不改 `packages/features/library/src/`，除非决定 W3 点头。不改 CSP，不改协议注册，除非实现时发现必须改，那时停在决定 W9。

## chip 的位置和文案

位置沿用现在的 `.oi-reader-chip`：标题栏里，拖拽空白之后。这就是 DESIGN §4.5.1 第 468 行的「任务摘要 chip」，也是 §4.1 第 367 行的状态摘要。不放到原文栏，不加阅读区横幅（3A）。

未配置时的句子用 US-16 的「未解析 / 去配置」。DESIGN §3.8.1 第 341 行的进度、失败、完成是解析任务的状态，本批没有解析任务，不用那三句。DESIGN §4.1 第 394 行是译文空态，指向翻译设置；3A 要求空态再说一次降级句，所以空态用同一句「未解析 / 去配置」，不用第 394 行那句。不改 DESIGN（N-10，3A 已写明不改）。

chip 是 `role=status` 的文本。没有 `href`，没有按钮，不导航。「去配置」三个字留在句子里，因为 US-16 就是这么写的。把它做成入口属于决定 W6。

`configured`（只有测试替身能造出来）：chip 保持空，不显示降级句。`storage_corrupt` 与 `secret_unavailable`：不显示「未解析 / 去配置」，也不借用「解析失败 · 查看」。chip 留空，原文仍可浏览。要给这两种错误新句子，属于决定 W7。

对照 / 译文的复读：`parse-empty-note.tsx` 使用同一个常量，`role=status`。`reader-screen` 只在当前视图不是原文时渲染它。栏位控件、对照栏和译文栏由 `feature/reader-nav-zoom-174` 做。那条分支合入之前，产品里切不过去；复读由单测注入视图来锁。真机截图因此分两张，见测试计划。

界面不自己判断「有没有配置」。`use-parse-status` 只调用读口，组件只按返回的 `state` 或错误码选句子（P7）。

## AC-11 与 PRC-10 怎样变成可验收

AC-11 整句仍不标通过。文字层通读和记笔记没有做。可以单独验收的是这一截：

1. 库里没有 `set_parse_service` 行。
2. 打开一篇已入库 PDF，原文能浏览。
3. chip 显示「未解析 / 去配置」，`role=status`，句子来自读口的 `unconfigured`，不是界面写死的常量分支绕过查询。单测里的常量只是文案；生产组件必须先拿到 `unconfigured` 才渲染它。
4. 证据是：分类与用例单测、chip 组件测试、Electron e2e、Windows 真机截图。四样都在，这一截才算可验收。

PRC-10 仍不写入 PRD，也不改批次 D 计划里的 D-19 / D-20（N-14，那两行是当时的记录）。本批把 D-20 所指的那块 chip 证据收成上面第 3、4 步。审查时看本文件的这一节，不看一个新的 PRD 编号。要把 PRC-10 写进规格正文，属于决定 W4。

[docs/arch/02-05.md](../arch/02-05.md) 第 32 行和 [docs/prd/08.md](../prd/08.md) 第 25 行仍写着「存储和 handler 还没有实现，不得把 AC-11 标成通过」。实现合入后这两句会过时。本计划 PR 不改它们。实现 PR 默认也不改。要改，走 W4。

## 实现顺序

Forge 排序，非业主决定。G18 一个 PR 只能碰一个 `packages/features/<name>/src`。下面四笔都在本计划 PASS 之后，而且每一笔碰到的决定要先有答复。本文件的两笔提交不包含它们。

| 顺序 | 内容 | 先要有的决定 | 切片 |
| --- | --- | --- | --- |
| 1 | `settings` 切片：表、分类、用例、SQLite、固定不可用的密钥端口、两个 handler 工厂、临时库测试。不注册进生产 map，不改 `expose` | 无。不碰下面的禁区 | 只有 `settings` |
| 2 | `library-main` 接受额外迁移列表，默认空；把已打开的存储交回调用方。现有测试在列表为空时行为不变 | W3 | 只有 `library` |
| 3 | 主进程把 settings 迁移并进一次 `openAppStorage`，把两个读 handler 并进现有命令 map。`parsing.getParseCapabilities` 的 `expose` 改为 true，重新 codegen，同一笔改表面测试。`settings.*` 仍是 false。`composition-root.ts` diff 0，改动落在 `library-wiring.ts` | W1、W2，且 1 和 2 已合入 | 不改 feature `src`。改契约和主进程 |
| 4 | reader chip、空态复读、feature 里的 `readParseStatus`、桌面 client 的生产调用、e2e | W1 已随第 3 笔合入。W6、W7 维持本文件的默认 | 只有 `reader` |

第 1 笔单独合入还不满足 AC-11。第 4 笔的 e2e 要跑在第 3 笔已经合入的 main 上。

## 测试计划

本两笔不跑产品测试。CI 六个 job 是这两笔的证据。下面是实现阶段的测试。每一笔实现只在自己的 tip 上跑一遍全量，不在本文件的 tip 上预跑。

单测：

- 无行 → `unconfigured`，密钥端口调用次数是 0。
- 坏行 → `storage_corrupt`。
- 合法行且密钥端口不可用 → `secret_unavailable`。
- 合法行且测试替身报告密钥可用 → `configured`。生产适配器的测试锁住它从不返回可用，并且不读 `secrets.bin`。
- 结果和错误里没有 `secret`、`secretRef`、路径。
- chip：`unconfigured` 显示这句且 `role=status`，节点在标题栏，不在 `.oi-reader-column` 里。`configured` 的假客户端留下空 chip。两种错误不显示这句。
- 空态组件在对照和译文视图显示同一常量；原文视图不显示。
- 打开 PDF 的现有路径不调用 `submitParse`。本批没有这条命令的生产调用。

Electron e2e：新文件 `apps/desktop/e2e/parse-status-chip.spec.ts`。不改 [electron-app.ts](../../apps/desktop/e2e/fixtures/electron-app.ts) 的默认启动。这个 spec 自己用临时 `user-data-dir`，保证表是空的。PDF 用测试里生成的一页最小文件，不提交出版社 PDF。走现有导入再打开。断言 chip 文本、`role=status`、原文栏里有画出的页。它跑在现有的 `desktop-e2e-windows` job 里。

Windows 真机：

- 机器按已有口径：8 GB 的 Windows。没有这台机器就写「未验证」，不用更大内存的机器顶上（台账 2026-11-05 22:13 与 2026-11-08 23:45）。
- 项 1：空配置打开一篇 PDF，原文可见，chip 可见。截图放进 `docs/evidence/<实现 PR 号>/`。没有这张图，AC-11 的这一截仍是未验收。
- 项 2：切到对照或译文，空态再次出现同一句。栏位切换在另一条分支。那条分支还没合入时，这一项写「未验证」，不在本批里做临时切换控件。
- 本计划 PR 不跑真机，不附截图。

## 风险

- 生产路径在密钥存储做成之前永远不返回 `configured`。已配置用户的 chip 会走 `secret_unavailable` 并留空。这是禁止密钥存储的直接结果。要改变它，先有密钥存储的另一批，本批不打开。
- `library-main` 今天独占这次 `openAppStorage`。settings 再开一次连接会变成第二个写者，违反一份 `oi.sqlite`。所以 W3 没有答复时，第 1 笔的表只能在临时库测试里出现，生产库不会有这张表。
- 01:56 已经把 `expose: true` 的条件写成「真实来源与 handler 同一次合入」。13:57 只批准计划。把条件写成现在就改 `expose`，会越过这条批准。第 3 笔必须单独再问。
- chip 与栏位、缩放、页码跳转、位置历史都落在 `reader-screen.tsx` 的标题栏。两条分支同时改这个文件时，后合入的一方要重放自己的那一处，不能整文件覆盖。
- 空态复读在产品里要等栏位分支。若把复读的验收算进本批的 Windows 项 1，会逼着本批去做栏位。项 1 只截原文和 chip。
- 批次 D 的 D-04 写过「不调用 `getParseCapabilities`」。那是 D 当时没有查询实现时的验收。本批之后，阅读屏会调用这一条只读查询。D-04 的那句不改写（N-14）。本批的 e2e 改为：调用这一条，不调用解析作业。

## 和 `feature/reader-nav-zoom-174` 可能冲突的文件

写本文件时那条分支还没有推到 origin。下表按评论 6872732174 的范围预测。合入顺序不确定，本 PR 不 rebase 到它上面，也不改它的文件。

| 文件 | 为什么会撞 | 本批怎么减少重叠 |
| --- | --- | --- |
| `docs/approvals.md` | 对方要补 13:51 和 #203 的合入同步；本批补 13:57 | 只加一行。冲突留到合入顺序确定后 |
| `docs/spec-changelog.md` | 两边都会在表头下插一行 | 本批一行。不改 manifest |
| `packages/features/reader/src/ui/reader-screen.tsx` | 对方要加缩放、页码、栏位；本批要换第 55 行的 chip | 只换 chip 和空态复读的挂载点 |
| `packages/features/reader/src/ui/reader-client.ts` | 对方要加缩放、跳页、历史方法 | 只加 `readParseStatus` |
| `apps/desktop/src/renderer/reader-client.ts` | 同上，生产实现 | 只加这一条 invoke |
| `packages/features/reader/test/ui/reader-screen.test.tsx` | 对方会改标题栏断言；本批的假客户端要补默认读口 | 新用例放新文件。这个文件只补默认返回 |
| `packages/features/reader/test/ui/failed-read-leave.test.tsx` | 假客户端在这里组装 | 同上，只补默认返回 |
| `packages/features/reader/test/ui/open-reading.test.ts` | 同上 | 同上 |
| `packages/features/reader/src/ui/use-reader-session.ts` | 对方很可能改会话 | 本批不改 |
| `packages/features/reader/src/domain/reader-session.ts` | 对方要改缩放和视图 | 本批不改 |
| `packages/features/reader/src/ui/page-column.tsx` | 对方要改栏 | 本批不改 |
| `apps/desktop/src/renderer/reader.css` | 对方可能改栏位样式 | 本批不改，沿用 `.oi-reader-chip` |
| `apps/desktop/src/renderer/shell.tsx` | 对方若改壳的挂载 | 本批不改 |

`copy.ts` 本批不改。句子在 `parse-degrade-copy.ts`，对方不必碰这个新文件。

## 需 Wisdom 决定

每一条都写出代价。没有答复时，实现停在该条的前面。本文件不替这些条做选择。

| ID | 事项 | 不做的代价 | 做的代价 |
| --- | --- | --- | --- |
| W1 | 把 `parsing.getParseCapabilities` 的 `expose` 改为 true，并在同一次合入重新 codegen | renderer 调不到查询。chip 没有真实来源。AC-11 这一截不能验收。01:56 的条件一直挂着 | 同一笔必须改 [parse-capability-surface.test.ts](../../apps/desktop/test/parse-capability-surface.test.ts) 和 [ipc-production-assembly.test.ts](../../apps/desktop/test/ipc-production-assembly.test.ts)。现在连 `parsing` 这个名字都不许出现。`settings.*` 和密钥名字继续禁止 |
| W2 | 改主进程：`apps/desktop/src/main/library-wiring.ts` 把 settings 迁移和两个读 handler 并进现有的一次打开与命令 map | handler 到不了生产 map。临时库里的表用户用不上 | `composition-root.ts` 是热点，目标保持 diff 0。改动集中在 `library-wiring.ts`。这是主进程文件 |
| W3 | 改 `packages/features/library/src/adapters/library-main.ts`：`createLibraryMain` 接受额外 `MigrationSource`，默认空，并把已打开的 `AppStorage` 交给调用方 | settings 的 `set_*` 进不了已经打开的那一份 `oi.sqlite`。再开一个连接是第二个写者。另开一个 sqlite 文件要改 [docs/arch/08-02.md](../arch/08-02.md)，那也是规格正文 | 这一笔只能单独成 PR。和 `settings/src` 放在一起会失败 G18。空列表时现有测试必须保持原行为 |
| W4 | 改规格正文：02-05 第 32 行、prd 08 第 25 行，以及 parsing 行上的 `expose` false。以及是否把 PRC-10 写进 PRD | 实现合入后，正文仍写「还没有实现，不得标通过」。审查会看到漂移。PRC-10 继续只有设计稿编号 | 13:57 只批准计划和台账。现在改正文超出批准。PRC-10 没有可抄的定义，写进 PRD 等于新造一条验收 |
| W5 | 实现 `settings.saveParseService`，或修改它的成功体 | 生产环境不能写入配置，也就永远不返回 `configured`。设置页本身就不在本批 | 成功体只有 `configured`，而 `configured` 要求可用密钥。本批没有密钥存储。要做成，就要么存储密钥，要么改契约。两条都超出 13:57，也碰到 A1 |
| W6 | 把 chip 上的「去配置」做成链接或按钮 | 句子保持纯文本。用户不能从 chip 进入设置。本批本来就没有设置页 | 点击就要有目的地。那是设置页，超出本批，也给阅读屏加一个操作入口 |
| W7 | 为 `storage_corrupt` 和 `secret_unavailable` 新写一句界面文案 | 这两种结果 chip 留空，不显示「未解析 / 去配置」，原文仍可浏览。没有新句子可审 | DESIGN 和 US-16 没有这两句。不能借用「解析失败 · 查看」。新句子要先定词，并且仍然不改 DESIGN 正文 |
| W8 | 允许一个实现 PR 同时改 `settings/src` 和 `library/src`，或同时改 `settings/src` 和 `reader/src` | 按上面的四笔拆开。多一次审查 | G18 失败，除非书面放行这一个 PR |
| W9 | 改 CSP，或改 `oi-asset` 协议注册 | 本批用已有 IPC，不需要改。阅读资产面保持现状 | 任何改动都会扩大阅读资产或网络面。实现里一旦发现「不改就做不成」，停下来再问，不在那一笔里顺手改 |

## 计划 / 实际

计划列在开工前填。实际列留空。第二笔不回填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件 |  |  |
| 2 | 台账 13:57 与 spec-changelog 一行。manifest 不改 |  |  |
| 3 | settings 切片，见「实现顺序」第 1 笔 |  |  |
| 4 | library 迁移参数，W3 之后 |  |  |
| 5 | 主进程接线与 expose，W1 与 W2 之后 |  |  |
| 6 | chip、空态复读、e2e、Windows 截图 |  |  |

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 现在开计划 Draft，只交计划和台账，不写代码；不 Ready、不合入、不发版 | 原话见第二笔追加的台账行。同一条评论里的 #201 文档修补本 PR 不做 | 2026-11-14 13:57 | Wisdom。来源是 Forge 卡片「这两件怎么定？」。评论 [6872740488](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872740488) |
| 存储放在 `settings`，只做读，保存命令不实现；chip 用 US-16 原句并且不可点击；错误不新写文案；实现拆成四笔 | 对齐 A1、A2、3A、6-2 A 和 G18。W1–W9 仍待答复，这一行不代替那些答复 | 2026-11-14 | Forge 排序，非业主决定 |
| `approvals.md` 与另一条分支的冲突留到合入顺序确定后 | 13:57 的原话没有指定和导航分支的先后。用户要求本批不要提前消这个冲突 | 2026-11-14 | 本任务的范围。不是新的产品决定 |

## 不改

- 不写实现代码，不改 `packages/contracts`，不把任何 `expose` 改成 true。
- 不改 CSP，不改协议注册，不改主进程，不改 `packages/features/library/src/`。
- 不做设置页，不做完整解析任务，不做译文，不做密钥存储，不读 `secrets.bin`。
- 不改 DESIGN、`docs/design-principles.md`、`docs/design/**`。
- 不改 PRD、ARCHITECTURE、`docs/arch/**`、RULES 的正文。
- 不改 `tools/compare-spec-bytes/manifest.json`、不改基线 `f8d5d01`、不改 `compare.mjs`。
- 不改批次 D 计划里的 D-19 / D-20。
- 不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。
- 不标 Ready，不合入，不发版，不 force-push。

## 证据链接

- `docs/evidence/<PR号>/`：本两笔无。实现阶段的 Windows 截图才写入对应 PR 号的目录。

## 自检

- [x] 影响 arch / prd 吗？本两笔不影响。实现之后的正文更新列为 W4，不在本 PR。
- [x] 第一笔只有本文件。第二笔只有台账和 changelog。
- [x] 需 Wisdom 决定的项都在上一节，并写了代价。
