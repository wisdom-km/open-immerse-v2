# 执行计划

分支 `feature/config-store-chip-174`。基线是 `main` `d8e5afb2aff5d9b151050e07aa3a11b4a0a41290`，tree `7c60f428c10db03e23052ad93956c823905597b6`（提交说明 `docs: 改正 ADR 0010 的 CCITT 描述与 arch/09 wasm 现状 (#204)`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：本分支不改台账。13:57 那一行已由 PR #204 写在 main 上。14:37 与 14:49 的批准行由 PR #206 补。第 1 笔的「实际」列已回填，第 2、3 笔不回填。`tools/compare-spec-bytes/manifest.json` 不动：比对的规格字节没有变，不追加空修订。第 1 笔已按 2026-11-14 14:49 的批准写在本分支。第 2、3 笔仍等上一笔合入后再从 main 开新分支。

第 1 笔只加 `packages/features/settings`，以及 `pnpm install` 为这个包写下的 lockfile 记录。不改 CI、CSP、协议注册、codegen 生成物、契约、主进程、`packages/features/library/src/`、reader、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)、`docs/design/**`（N-10）。不标 Ready，不合入，不发版。为接上已合入的 PR #204，本分支 rebase 到 main `d8e5afb` 后用 `--force-with-lease` 推送。依据是 2026-11-14 14:20 的批准，Issue #174 评论 [6873024142](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6873024142)。这个依据只适用于本 feature 分支上的 rebase。不对别的分支 force-push。14:20 的台账行由 PR #206 补，本分支不写。

任务类型：第 1 笔是 core 改动，切片是 `settings`。交接说明按 RULES §8.4 写在 PR 描述里。第 2 笔仍是 library 切片加契约 expose 与主进程接线。第 3 笔是 UI 改动，任务说明必须带上下面这一句，且 core 目录零改动：

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
- 另一条分支是 Draft [PR #206](https://github.com/wisdom-km/open-immerse-v2/pull/206)，tip 以合入时为准。范围来自 Issue #174 评论 [6872732174](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872732174)：只交计划和台账，做缩放、转到页码、位置历史和栏位；不含配置存储和 AC-11 chip。本分支不改台账。14:13、14:17、14:20、14:37、14:49 的批准行和 PR #204 的合入同步行都由 #206 补。对照和译文的空态容器是它计划里的 `view-mode-empty.tsx`。6-1 A 已在 14:13 批过，接缝见 chip 一节。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| 13:57 批准 | Issue #174 评论 [6872740488](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872740488) | 对得上。原话有两句：「配置存储+chip：按推荐，现在开计划 Draft，只交计划和台账，不写代码；不 Ready/合入/发版」；「#201：按推荐，单开只改 docs 的小 PR 修 ADR 0010:22、commands.md:85、arch/09.md:32；不 Ready/合入/发版」。GitHub `created_at` 是 `2026-11-14T05:58:09Z`。台账时间用评论正文里的 13:57。本 PR 只执行第一句。第二句记在同一行里，避免丢掉，本 PR 不改那三个文件 |
| 台账 | [docs/approvals.md](../approvals.md) 末行 | `5db585d` 上曾是 151。本分支一度自己加了 13:57。PR #204 已合入 main `d8e5afb`，同一条 13:57 已经在台账里，合计已是 152。本分支 rebase 之后删掉重复行，不再改合计。文首「日期：2026-11-08」不动 |
| 6-2 A | 评论 [6739648033](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6739648033) | 批次 D 不含降级 chip。AC-11 的降级部分和 PRC-10 保持「未满足 / 待补」，不删除。最小配置存储、读口、handler 和 chip 另开一批，M2 结束前补完。本文件就是这一批的计划 |
| 3A | 台账 2026-11-05 21:01，评论 [6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956) | 降级句写在任务摘要 chip，`role=status`。切到对照或译文时，空态里再说一次。不用阅读区横幅。③ 只覆盖打开 PDF 与浏览原文。默认视图暂时是原文。不改 DESIGN。‹ 和「返回文献库」回库。← → 保持禁用 |
| 配置语义 | 评论 [6724143329](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6724143329) | 保留「用户有没有配置解析服务」的原义。补最小真实配置存储和读写接口的设计。不含设置页、完整解析任务和译文。只读能力查询回答真实配置来源，不回答「这个构建有没有解析」。这不是实现批准，也不是契约签名批准 |
| 硬约束 | PR #180 契约与 02-05 第 32 行 | A1：`settings.saveParseService` 与 `settings.getParseServiceStatus` 保持 `expose: false`。A2：没有元数据记录就是 `unconfigured` |
| 原则 | [docs/design-principles.md](../design-principles.md) 第 23、25、27 行 | P3 阅读屏没有常驻主按钮。P5 状态在原处、`role=status`、不用 toast。P7 界面不自己计算业务条件。第 21 行是 P1 |

## 目标

未配置解析服务时，打开一篇已入库的 PDF，原文仍能看。标题栏任务摘要 chip 显示 US-16 的「未解析 / 去配置」，`role=status`，不是按钮，不是链接。查询来自真实的元数据表。没有记录就是 `unconfigured`。本批不写密钥，因此生产路径不会返回 `configured`。

用户能看见的成功：空库打开 PDF，原文在，chip 上有这句。切到对照或译文时，空态把同一句再说一次。栏位和空态容器属于 PR #206。本批只提供这句，以及给那个容器用的函数。

## 模块、读口、依赖

配置存储放在新的 `settings` 切片，不放进 `library`，不放进 `reader`。`settings` 拥有 `set_` 表（[docs/arch/04-02.md](../arch/04-02.md)、[docs/arch/08-02.md](../arch/08-02.md)）。目录按 [docs/arch/03-01.md](../arch/03-01.md)。

表名用 [docs/arch/08-03.md](../arch/08-03.md) 第 9 行已有的 `set_providers`。不另起 `set_parse_service`，也不改 08-03。本批写入的列是 `vendor_id`、`format`、`base_url`、`model_id`、`allowed_hosts`（JSON 文本）、`purpose`、`credential_slot`。`purpose` 表示这条配置拿来做什么。解析服务这一行的值是 `parse`。部分唯一索引是 `WHERE purpose = 'parse'`，所以解析服务最多一行。[docs/arch/07-09.md](../arch/07-09.md) §7.9.3 的「能力标记」是 `chat`、`vision`、`ocr`、`scoring`、`streaming`，按服务商和模型给，不是这一列。本批不写那些标记，列名也不叫 `capability`。`credential_slot` 只存 §7.9.5 的 slot 引用，不存密钥字节。密钥是否可用按这一列去问端口，对齐 [docs/arch/02-05.md](../arch/02-05.md) 第 32 行的「所引用密钥」，以及 [parse-service-status.ts](../../packages/contracts/src/parse-service-status.ts) 第 6–7 行：没有记录指向的密文不参与判断，记录在但密钥缺失是错误。不读 `secrets.bin`。查询结果里不带回 slot，也不带回密钥。这两列在第 1 笔写 `0001_set_providers.sql` 之前定稿。迁移进了用户的库之后再改列，就要另写 `0002`。本批不留这个口子。

读口不新造契约。生产只接一条命令，它调用下面的用例：

- `parsing.getParseCapabilities({})` → `{ state }`，或 `storage_corrupt` / `secret_unavailable`。`expose` 在本计划 PR 维持 false。第 2 笔按已批的 W1 只打开这一条。`settings.*` 保持 false。
- `settings.getParseServiceStatus` 保持 `expose: false`，本批不建它的 handler，也不放进生产 map。它不在 registry 里，放进去也没有通道可绑（A1）。

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

`ParseServiceStore.readMetadata()` 返回这一行，或 `null`，或 `storage_corrupt`。不返回密钥字节，也不把 `credential_slot` 放进 IPC 成功体。`ParseSecretLookup` 只回答这一行所引用的 slot 现在能不能用。本批的生产适配器固定返回 `secret_unavailable`，不打开 `secrets.bin`，不写密钥文件。测试替身可以返回「可用」，用来锁住「有记录且所引用密钥可用 → configured」。生产 chip 走不到 `configured`。

分类规则放在 `settings` 的 domain，一处：

- 没有 `purpose = 'parse'` 的行：`unconfigured`。不询问密钥。孤儿密文因此不参与判断（A2）。
- 行读不出来，或任一文本列是空串，或 `allowed_hosts` 不是非空字符串数组：`storage_corrupt`。空串的口径和保存请求里的 `nonEmpty` 相同。
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

`index.ts` 只导出 `createGetParseServiceStatus`。SQLite、迁移目录和 parsing handler 从 `./main`（`src/adapters/settings-main.ts`）给主进程。渲染进程的包入口到不了它们。迁移目录用 `fileURLToPath(new URL("../../migrations", import.meta.url))`，和 `library-main.ts` 第 129–131 行同一写法。

## 每个文件的职责和行数上限

一个文件只做一件事。下表是 Forge PASS 并且相应决定已有答复之后的实现文件。第 1 笔的文件已在本 PR 创建。第 2、3 笔的文件还不创建。行数是硬上限，按 [docs/arch/06.md](../arch/06.md)：普通文件建议 400、硬限 600；函数建议 50、硬限 80。这里把新文件压得更紧，避免一个文件堆两件事。

| 文件 | 只做这一件事 | 上限 |
| --- | --- | --- |
| `packages/features/settings/package.json` | 包名 `@oi/feature-settings`、exports（含 `./main`）、依赖 | 45 |
| `packages/features/settings/tsconfig.build.json` | 与 library 同一形状，只编 `src` | 30 |
| `packages/features/settings/README.md` | 一段：这包只读解析服务元数据 | 30 |
| `src/index.ts` | 导出 `createGetParseServiceStatus` | 20 |
| `src/pure.ts` | 再导出 `classifyParseRecord` | 15 |
| `src/domain/parse-record-failure.ts` | 两个读错误码 | 30 |
| `src/domain/parse-record.ts` | `classifyParseRecord` | 80 |
| `src/application/ports/parse-service-store.ts` | `readMetadata` 端口 | 40 |
| `src/application/ports/parse-secret-lookup.ts` | 「这个 slot 能否用」端口 | 30 |
| `src/application/use-cases/get-parse-service-status.ts` | 读端口，调用分类 | 70 |
| `src/adapters/sqlite-parse-service-store.ts` | 只 SELECT `purpose = 'parse'` 的那一行并校验 | 90 |
| `src/adapters/unavailable-secret-lookup.ts` | 固定 `secret_unavailable`，无文件 IO | 25 |
| `src/adapters/get-parse-capabilities-handler.ts` | 只翻译 `parsing.getParseCapabilities` | 50 |
| `src/adapters/settings-main.ts` | `./main`：导出 handler 工厂和迁移目录 | 60 |
| `src/testing/fake-parse-service-store.ts` | 内存替身 | 40 |
| `migrations/0001_set_providers.sql` | `set_providers` 这一张表 | 30 |
| `test/core/classify-parse-record.test.ts` | 分类四支，以及无行时不调用密钥端口 | 120 |
| `test/core/get-parse-service-status.test.ts` | 用例把端口结果收成契约成功体或错误 | 160 |
| `test/adapters/sqlite-parse-service-store.test.ts` | 空表、坏 JSON、空串、一行合法元数据；不读密钥文件 | 180 |
| `packages/features/reader/src/ui/parse-degrade-copy.ts` | 常量，以及「给定读结果，要不要复读这句」 | 40 |
| `packages/features/reader/src/ui/parse-status-chip.tsx` | 按给定状态渲染 chip | 50 |
| `packages/features/reader/src/ui/use-parse-status.ts` | 只调用一次读口 | 50 |
| `packages/features/reader/test/ui/parse-status-chip.test.tsx` | chip 的四种结果 | 150 |
| `packages/features/reader/test/ui/parse-degrade-copy.test.ts` | 只有 `unconfigured` 返回这句 | 60 |
| `apps/desktop/package.json` | 第 2 笔加上 `@oi/feature-settings`，并在 `build` 里加上 `tsc -p` 这一包的 `tsconfig.build.json`，紧挨 library 那一行 | 只加依赖和这一条编译命令 |
| `pnpm-lock.yaml` | 第 2 笔由 `pnpm install` 写入，不手改 | 锁文件 |
| `tools/check-deps/tsconfig.paths.json` | 第 2 笔加上 `@oi/feature-settings` 与 `@oi/feature-settings/main` 两条路径 | 只加这两条 |

已有文件只做点名的那一处，不顺手改别的：

| 文件 | 现在 | 允许的改动 | 上限 |
| --- | --- | --- | --- |
| `reader-screen.tsx` | 168 | 只用 chip 组件换掉第 55 行的空 span。不在这里挂空态 | 190 |
| `reader-client.ts`（feature） | 47 | 增加 `readParseStatus` | 80 |
| `apps/desktop/src/renderer/reader-client.ts` | 80 | 生产实现调用已暴露的那条命令。等到 W1 之后 | 110 |
| `use-reader-session.ts` | 258 | 不改 | 258 |
| `reader-screen.test.tsx` | 560 | 不往这个文件加用例。假客户端的默认 `readParseStatus` 返回 `configured`。返回 `unconfigured` 会让「未解析」撞上第 49 行的 `/解析/` | 600 |
| `copy.ts` | 10 | 不改。句子在新文件 | 10 |
| `page-column.tsx` | 95 | 不改。不把句子放进原文栏 | 95 |
| `domain/reader-session.ts` | 已有视图与缩放 | 不改。缩放、历史、栏位留给另一条分支 | 保持现状 |
| `apps/desktop/src/main/composition-root.ts` | 27，热点 | 目标 diff 0 | 27 |

不改 `packages/features/library/src/`，除非决定 W3 点头。CSP 和协议注册本批不做，见下面的缺口。发现必须改就停，不在这一批里改。

## chip 的位置和文案

位置沿用现在的 `.oi-reader-chip`：标题栏里，拖拽空白之后。这就是 DESIGN §4.5.1 第 468 行的「任务摘要 chip」，也是 §4.1 第 367 行的状态摘要。不放到原文栏，不加阅读区横幅（3A）。

未配置时的句子用 US-16 的「未解析 / 去配置」。DESIGN §3.8.1 第 341 行的进度、失败、完成是解析任务的状态，本批没有解析任务，不用那三句。DESIGN §4.1 第 394 行是译文空态，指向翻译设置。3A 的原话是「切到对照/译文时空态再说一次」，所以空态必须再出现「未解析 / 去配置」，不用第 394 行那句，也不改 DESIGN（N-10）。

chip 是 `role=status` 的文本。没有 `href`，没有按钮，不导航。「去配置」三个字留在句子里，因为 US-16 就是这么写的。本批不把它做成入口，见 W6。

`configured`（只有测试替身能造出来）：chip 保持空，不显示降级句。`storage_corrupt`、`secret_unavailable` 与 `handler_threw`：不显示「未解析 / 去配置」，也不借用「解析失败 · 查看」。chip 留空，原文仍可浏览。本批不给这两种错误新句子，见 W7。

对照 / 译文的空态只有 PR #206 的 `view-mode-empty.tsx`。本批不新建 `parse-empty-note.tsx`，也不在 `reader-screen` 上再挂一个兄弟节点。

接缝：#206 拥有这个组件，并先放进 2026-11-14 14:13 已批的 6-1 A（Issue #174 评论 [6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563)）：「本阶段暂不提供译文，请先阅读原文。」加上「切到原文（Ctrl+1）」链接，mac 显示 ⌘1。本批只导出 `parse-degrade-copy.ts` 里的一句「未解析 / 去配置」，以及一个函数：读口结果是 `unconfigured` 时返回这句，否则返回空。`view-mode-empty.tsx` 在 6-1 A 那句之后调用这个函数，`role=status`。不是 `unconfigured` 时，空态只有 6-1 A，没有降级句。

合入顺序：PR #206 先合入 `view-mode-empty.tsx`，里面只有 6-1 A。本批的 reader PR 以那一版为基线，只在该文件里、6-1 A 文案之后插入上面的函数调用。本批不创建这个文件，也不改 #206 的计划。若 reader PR 不得不先合，它只做标题栏 chip，不碰还不存在的空态文件；插入留到 #206 合入之后的一小笔，那一小笔仍然只改 reader。真机上的空态截图等这个顺序完成，见测试计划。

界面不自己判断「有没有配置」。`use-parse-status` 只调用读口，组件只按返回的 `state` 或错误码选句子（P7）。空态函数同样只看读结果。

## AC-11 与 PRC-10 怎样变成可验收

AC-11 整句仍不标通过。文字层通读和记笔记没有做。可以单独验收的是这一截：

1. 库里没有 `purpose = 'parse'` 的 `set_providers` 行。
2. 打开一篇已入库 PDF，原文能浏览。
3. chip 显示「未解析 / 去配置」，`role=status`，句子来自读口的 `unconfigured`，不是界面写死的常量分支绕过查询。单测里的常量只是文案；生产组件必须先拿到 `unconfigured` 才渲染它。
4. 证据是：分类与用例单测、chip 组件测试、Electron e2e、Windows 真机截图。四样都在，这一截才算可验收。

PRC-10 不写入 PRD，也不改批次 D 计划里的 D-19 / D-20（N-14，那两行是当时的记录）。本批把 D-20 所指的那块 chip 证据收成上面第 3、4 步。审查时看本文件的这一节。

[docs/arch/02-05.md](../arch/02-05.md) 第 32 行和 [docs/prd/08.md](../prd/08.md) 第 25 行仍写着「存储和 handler 还没有实现，不得把 AC-11 标成通过」。本 PR 不改它们。W4 已批：第 2 笔同一个 PR 只把这两处改成合入后的事实，并同步 manifest。PRC-10 不进 PRD。别的规格文字不改。AC-11 整句仍然不标通过。第 1 笔不接生产 handler，所以这两处仍是事实。

## 实现顺序

Forge 排序，非业主决定。G18 只数 `packages/features/<name>/src`（`tools/check-one-slice/check.mjs` 的 `slicesIn`）。W1–W4 已于 2026-11-14 14:37 批过。第 1 笔已写在本分支。第 2、3 笔仍等上一笔合入后再从 main 开新分支。

| 顺序 | 内容 | 先要有的决定 | 切片 |
| --- | --- | --- | --- |
| 1 | `settings` 切片：`set_providers` 的 `0001` 用 `purpose` 和 `credential_slot`，不再改列名。分类、用例、SQLite、固定不可用的密钥端口、`parsing.getParseCapabilities` 的 handler 工厂、临时库测试。不注册进生产 map，不改 `expose`，不建 `settings.getParseServiceStatus` 的 handler | 2026-11-14 14:49 已批。本分支已实现 | 只有 `settings` |
| 2 | `library-main` 接受额外迁移，默认空，并把已打开的存储交回调用方。`library-wiring.ts` 只把 parsing 这一条 handler 并进现有 map。库打不开时这条仍在 map 里，返回 `handler_threw`。`expose` 只打开 `parsing.getParseCapabilities`，重新 codegen，同一笔改表面测试，并按 W4 只改 02-05 第 32 行与 prd 08 第 25 行、同步 manifest。`settings.*` 仍是 false。`composition-root.ts` 不改 | W1–W4 已于 14:37 批。还要第 1 笔已合入，并且本轮计划复审 PASS | 只有 `library`。契约和主进程在同一笔，见「不拆」 |
| 3 | reader chip、`readParseStatus`、桌面 client 的生产调用、降级句函数、e2e。不新建空态组件。#206 已合入后，才在 `view-mode-empty.tsx` 的 6-1 A 之后插入降级句 | W1 已随第 2 笔合入。W5、W6、W7、W9 本批不做 | 只有 `reader` |

第 1 笔单独合入还不满足 AC-11。第 3 笔的 e2e 要跑在第 2 笔已经合入的 main 上。第 2 笔和第 3 笔不能合成一笔：RULES §8 第 2 条把 `contracts/src/ipc/**` 算作 core，UI 改动的 PR 不能带 core。

## 不拆

[RULES.md](../../RULES.md) §2 写契约改动单独成 PR、先合入。同一节和 [docs/approvals.md](../approvals.md) 2026-11-09 01:56 那一行写的是：`expose` 为 true 只在真实配置来源与 handler 同一次合入。`apps/desktop/src/main/ipc/ipc-router.ts` 第 89–97 行的 `assertHandlers`：registry 里每条 command 都必须有 handler，没有就 throw。若先单独把 `parsing.getParseCapabilities` 的 `expose` 改成 true 并合入，codegen 会把它放进 registry，生产 map 还没有它，启动时 throw。因此第 2 笔不拆。契约上只改 `parsing.getParseCapabilities` 这一条的 `expose`，`settings.*` 不开。非生成改动远小于 §2 的 200 行。这一条例外已含在 14:37 的 W1 里。第 2 笔仍等第 1 笔合入后再做。先例是 [feature-reading-ipc-expose-wiring-174.md](feature-reading-ipc-expose-wiring-174.md) 的「不拆」一节。

## 测试计划

本两笔不跑产品测试。CI 六个 job 是这两笔的证据。下面是实现阶段的测试。每一笔实现只在自己的 tip 上跑一遍全量，不在本文件的 tip 上预跑。

单测：

- 没有 `purpose = 'parse'` 的行 → `unconfigured`，密钥端口调用次数是 0。
- 坏 JSON、空串、`allowed_hosts` 不是非空字符串数组 → `storage_corrupt`。
- 合法行且密钥端口不可用 → `secret_unavailable`。
- 合法行且测试替身报告密钥可用 → `configured`。生产适配器的测试锁住它从不返回可用，并且不读 `secrets.bin`。
- 结果和错误里没有 `secret`、`secretRef`、路径。
- 升级：先有一份只含 library 迁移的库，再打开并带上 `set_providers` 迁移。`lib_*` 行还在。`app_schema` 仍是打开前那个受支持的数（现在是 1，`applyMigrations` 把它写成 `supportedAppSchema`，不另加一）。没有 parse 行时查询是 `unconfigured`。做不到就按「还没核实」停，不改 `STORAGE_APP_SCHEMA`，也不改 [docs/arch/08-04.md](../arch/08-04.md)。
- 库打不开：`createLibraryMain` 走 `unavailableHandlers()`（`library-main.ts` 第 82 行与第 183 行）。parsing 这条仍在 map 里，返回与文献库失败路径相同的 `handler_threw`，不返回 `unconfigured`。chip 不显示降级句。
- 只读打开：`appSchema` 高于本应用时走 `openReadonly`（`open-storage.ts` 第 105–107 行），不跑迁移。表在就按分类规则 SELECT。表不在就是 `handler_threw`，不当成 `unconfigured`，也不当成 `storage_corrupt`。`storage_corrupt` 只留给已经读到、但内容坏了的记录。不写库。chip 对这个错误留空。
- chip：`unconfigured` 显示这句且 `role=status`，节点在标题栏，不在 `.oi-reader-column` 里。`configured` 的假客户端留下空 chip。`handler_threw` 和两种读错误不显示这句。
- `parse-degrade-copy` 只在 `unconfigured` 时返回这句。
- 打开 PDF 的现有路径不调用 `submitParse`。本批没有这条命令的生产调用。
- `reader-screen.test.tsx`、`failed-read-leave.test.tsx`、`open-reading.test.ts` 的假客户端默认返回 `configured`。

Electron e2e：新文件 `apps/desktop/e2e/parse-status-chip.spec.ts`。不改 [electron-app.ts](../../apps/desktop/e2e/fixtures/electron-app.ts) 的默认启动。这个 spec 自己用临时 `user-data-dir`，保证表是空的。PDF 用测试里生成的一页最小文件，不提交出版社 PDF。走现有导入再打开。断言 chip 文本、`role=status`、原文栏里有画出的页。它跑在现有的 `desktop-e2e-windows` job 里。

Windows 真机：

- 机器按已有口径：8 GB 的 Windows。没有这台机器就写「未验证」，不用更大内存的机器顶上（台账 2026-11-05 22:13 与 2026-11-08 23:45）。
- 项 1：空配置打开一篇 PDF，原文可见，chip 可见。截图放进 `docs/evidence/<实现 PR 号>/`。没有这张图，AC-11 的这一截仍是未验收。
- 项 2：切到对照或译文，空态里有「未解析 / 去配置」，并且 #206 自己的句子若已存在，只能在旁边。栏位切换在 PR #206。那条还没合入时，这一项写「未验证」，不在本批里做临时切换控件。
- 本计划 PR 不跑真机，不附截图。

## 风险

- 生产路径在密钥存储做成之前永远不返回 `configured`。已配置用户的 chip 会走 `secret_unavailable` 并留空。这是禁止密钥存储的直接结果。要改变它，先有密钥存储的另一批，本批不打开。
- `library-main` 今天独占这次 `openAppStorage`。settings 再开一次连接会变成第二个写者，违反一份 `oi.sqlite`。W3 已批：同一次打开收额外迁移，并把已打开的库交回。PASS 之前不写这行代码，生产库不会有这张表。
- 01:56 要求 `expose: true` 与真实来源、handler 同一次合入。14:37 已批 W1：只开 `parsing.getParseCapabilities`，`settings.*` 不开，并且这一次不单独先合契约。代码要等本轮计划复审 PASS 后才做第 2 笔。
- chip 与栏位、缩放、页码跳转、位置历史都落在 `reader-screen.tsx` 的标题栏。两条分支同时改这个文件时，后合入的一方要重放自己的那一处，不能整文件覆盖。
- 空态复读在产品里要等 PR #206 的 `view-mode-empty.tsx`。项 1 只截原文和 chip。空态那张截图等 #206 先合入、本批再插入降级句之后再拍。6-1 A 的句子不换成降级句，降级句只加在它后面。
- 批次 D 的 D-04 写过「不调用 `getParseCapabilities`」。那是 D 当时没有查询实现时的验收。本批之后，阅读屏会调用这一条只读查询。D-04 的那句不改写（N-14）。本批的 e2e 改为：调用这一条，不调用解析作业。

## 和 `feature/reader-nav-zoom-174` 可能冲突的文件

对方是 Draft PR #206，tip 以合入时为准。实现文件以合入时为准。下表后半是它计划里点名、本批也会碰到的文件。合入顺序不确定。本 PR 不 rebase 到它上面，也不改它的文件。14:13、14:17、14:20、14:37 和 PR #204 合入同步的台账行由它补。

| 文件 | 为什么会撞 | 本批怎么减少重叠 |
| --- | --- | --- |
| `docs/approvals.md` | #206 已改。本分支 rebase 到 `d8e5afb` 后不再改台账 | 13:57 只留 #204 那一行 |
| `docs/spec-changelog.md` | 两边都在表头下插行 | 修订只再加一行 |
| `docs/prd/08.md` | #206 已改。本批的事实更新在 W4，还没做 | 本 PR 不改 |
| `tools/compare-spec-bytes/manifest.json` | #206 已改。W4 的事实更新才需要同步 | 本 PR 不改 |
| `packages/features/reader/src/ui/reader-screen.tsx` | 对方计划要加缩放、页码、栏位；本批要换第 55 行的 chip | 只换 chip。不挂空态 |
| `packages/features/reader/src/ui/view-mode-empty.tsx` | #206 先建，只放 6-1 A | 本批不创建。#206 合入后，本批只在 6-1 A 之后插入降级句 |
| `packages/features/reader/src/ui/reader-client.ts` | 对方要加缩放、跳页、历史方法 | 只加 `readParseStatus` |
| `apps/desktop/src/renderer/reader-client.ts` | 同上，生产实现 | 只加这一条 invoke |
| `packages/features/reader/test/ui/reader-screen.test.tsx` | 对方会改标题栏断言；本批的假客户端要补默认读口 | 新用例放新文件。默认返回 `configured` |
| `packages/features/reader/test/ui/failed-read-leave.test.tsx` | 假客户端在这里组装 | 同上 |
| `packages/features/reader/test/ui/open-reading.test.ts` | 同上 | 同上 |
| `packages/features/reader/src/ui/use-reader-session.ts` | 对方计划会改会话 | 本批不改 |
| `packages/features/reader/src/domain/reader-session.ts` | 对方要改缩放和视图 | 本批不改 |
| `packages/features/reader/src/ui/page-column.tsx` | 对方要改栏 | 本批不改 |
| `packages/features/reader/src/ui/copy.ts` | 对方计划要加空态句子 | 本批不改。降级句在 `parse-degrade-copy.ts` |
| `apps/desktop/src/renderer/reader.css` | 对方可能改栏位样式 | 本批不改，沿用 `.oi-reader-chip` |
| `apps/desktop/src/renderer/shell.tsx` | 对方若改壳的挂载 | 本批不改 |

## W1–W4（已批）

2026-11-14 14:37 Asia/Shanghai，Wisdom 在 Forge 卡片点选。原话：「按推荐：PR205 的 W1–W4 全批：W1 只开 parsing.getParseCapabilities、settings.* 不开；W2 只改 library-wiring.ts；W3 createLibraryMain 收额外迁移并交出已打开的库；W4 同 PR 只把 02-05:32、prd/08:25 改成事实并同步 manifest，PRC-10 不进 PRD。仅计划，不 Ready/合入/发版」。来源是 Issue #174 评论 [6873227945](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6873227945) 和 PR #205 评论 [6873228513](https://github.com/wisdom-km/open-immerse-v2/pull/205#issuecomment-6873228513)。四项都在实现第 2 笔、同一个 PR。批准范围就是这四句，不扩大。不开放 `settings.*`。不改 `composition-root.ts`。除 02-05 第 32 行和 prd 08 第 25 行之外，不改规格文字。台账的 14:37 行由 PR #206 补，本分支不写。代码要等本轮计划复审 PASS 后才开工。

| ID | 状态 | 已批范围 |
| --- | --- | --- |
| W1 | 已批 | 只把 `parsing.getParseCapabilities` 的 `expose` 改为 true，与真实来源、handler 同一次合入，这一次不按 RULES §2 把契约单独先合。`settings.*` 不开 |
| W2 | 已批 | 只改 `apps/desktop/src/main/library-wiring.ts`：settings 迁移并进一次打开，map 里只加 `parsing.getParseCapabilities` |
| W3 | 已批 | `createLibraryMain` 接受额外迁移，默认空，并把已打开的库交给调用方 |
| W4 | 已批 | 与第 2 笔同一个 PR，只把 [docs/arch/02-05.md](../arch/02-05.md) 第 32 行和 [docs/prd/08.md](../prd/08.md) 第 25 行改成合入后的事实，并同步 manifest。PRC-10 不进 PRD |

## 本批不做

W5、W6、W7、W9 不再请批。登记成缺口，实现时不补。

| ID | 缺口 | 本批的行为 |
| --- | --- | --- |
| W5 | 不实现 `settings.saveParseService`，也不改它的成功体 | 生产上不会返回 `configured`。写入要等密钥存储的另一批 |
| W6 | 不把「去配置」做成链接或按钮 | chip 和空态里的这句都是纯文本。没有设置页 |
| W7 | 不给 `storage_corrupt` 和 `secret_unavailable` 新写文案 | 这两种结果 chip 留空，原文仍可浏览。不用「解析失败 · 查看」 |
| W9 | 不改 CSP，不改 `oi-asset` 协议注册 | 走已有 IPC。实现里一旦发现必须改，停下来，不在这一批里改 |

## 还没核实

这三项不在本 PR 里跑。实现 PR 用下面的做法核实，结果写进那一笔的证据。核实不过就停，不改规格来迁就。

- `check-arch-graph`：第 1 笔和第 2 笔各自跑 `node tools/check-arch-graph/check.mjs`。看输出里的 `unmapped` 和 `undocumented` 有没有 `packages/features/settings`。第 1 笔还没有主进程 import，出现 unmapped 就记下来，不改 [docs/arch/05-01.md](../arch/05-01.md)。第 2 笔接上之后再跑。若出现文档里没有的依赖边，停。CI 里这个 job 目前是 `continue-on-error`，所以不能靠它变红来挡住。
- `appSchema` 升不升：不改 `STORAGE_APP_SCHEMA`（现在是 1，`packages/platform-node/src/storage/errors.ts`）。升级测试断言迁移之后 `app_schema` 仍是这个数。`applyMigrations` 只在它低于 `supportedAppSchema` 时把它写成那个数，不会因为多了一张 `set_` 表而加一。测试若做不到这一点，停，不改 [docs/arch/08-04.md](../arch/08-04.md)。
- 迁移目录打包后找不找得到：`tsconfig.build.json` 的 `rootDir` 是 `src`，`outDir` 是 `dist`，迁移 SQL 留在包根的 `migrations/`，不进 `dist`。第 2 笔在 desktop 的 `build` 里编译这一包之后，从发出的 `dist/adapters/settings-main.js` 解析 `new URL("../../migrations/0001_set_providers.sql", import.meta.url)`，断言文件存在。这和 library 现在的相对位置一样。断言失败就停，不另抄一份 SQL 进 `dist`。

## 计划 / 实际

计划列在开工前填。第 1 笔已回填。第 2、3 笔不回填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件 |  |  |
| 2 | 台账 13:57。#204 已写入 main，本分支不重复，合计仍是 152。manifest 不改 |  |  |
| 3 | 按审查 6873016564 与 6873205344 修订本文件。不改台账，不改规格正文 |  |  |
| 4 | settings 切片，见「实现顺序」第 1 笔 | 已写入 `packages/features/settings`。`0001_set_providers.sql` 含 `purpose`、`credential_slot` 和 `WHERE purpose = 'parse'` 的部分唯一索引。分类、用例、SQLite 只读、固定不可用密钥端口、handler 工厂。`credential_slot` 空串有单独用例。未注册生产 map，未改 expose。适配器不直接 import kernel 或 contracts，所以没有 05-01 未画出的边。domain 对 kernel 的类型导入实现了图上已有的 DOM→K，`tools/check-arch-graph/check.test.ts` 的 planned 计数从 13 改为 12。`pnpm-lock.yaml` 只加了这个包的 workspace 依赖，desktop 仍不依赖它。R3-N1 已去掉 #206 的行号。settings 单测 3 个文件、15 通过。`app_schema` 仍是 1 | `docs/evidence/205/commands.md` |
| 5 | library 迁移、主进程只接 parsing、expose。W1–W4 已批。代码等本轮计划复审 PASS |  |  |
| 6 | chip、降级句函数、e2e、Windows 截图 |  |  |

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 现在开计划 Draft，只交计划和台账，不写代码；不 Ready、不合入、不发版 | 13:57 这一行已由 PR #204 写入 main，本分支不重复。同一条评论里的 #201 文档修补也由 #204 落完 | 2026-11-14 13:57 | Wisdom。来源是 Forge 卡片「这两件怎么定？」。本批对应的评论是 [6872740488](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872740488) |
| 存储放在 `settings`，只做读，保存命令不实现；chip 用 US-16 原句并且不可点击；错误不新写文案。第一稿拆成四笔 | 对齐 A1、A2、3A、6-2 A 和 G18。下一行把四笔收成三笔 | 2026-11-14 | Forge 排序，非业主决定 |
| 表用 `set_providers`；降级句接在 6-1 A 之后，只在未配置时出现；生产只接 `parsing.getParseCapabilities`；契约与 handler 同一笔合入 | 回应 PR #205 评论 [6873016564](https://github.com/wisdom-km/open-immerse-v2/pull/205#issuecomment-6873016564)。当时留下 W1、W2、W3、W4。W5、W6、W7、W9 登记为本批不做。这不是新的 Wisdom 批准，台账不追加。下一行记下 14:37 的批准 | 2026-11-14 | Forge 排序，非业主决定 |
| 重复的 13:57 行删掉，合计不改 | PR #204 已把同一条批准写入 main。本分支 rebase 到 `d8e5afb` 后只留那一行，合计仍是 152。14:13、14:17、14:20、14:37 和 #204 合入同步行由 PR #206 补 | 2026-11-14 | 本任务的范围。不是新的产品决定 |
| `purpose` 表示用途，`credential_slot` 只存 slot 引用 | 回应 PR #205 评论 [6873205344](https://github.com/wisdom-km/open-immerse-v2/pull/205#issuecomment-6873205344)。§7.9.3 的能力标记不是这一列。第 1 笔写 `0001` 时就用这两列。这不是新的 Wisdom 批准，台账不追加 | 2026-11-14 | Forge 排序，非业主决定 |
| W1–W4 全批。仅计划，不 Ready、不合入、不发版 | 原话见 Issue #174 评论 [6873227945](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6873227945) 与 PR #205 评论 [6873228513](https://github.com/wisdom-km/open-immerse-v2/pull/205#issuecomment-6873228513)。范围只到这四项。代码要等本轮计划复审 PASS 后才开工。14:37 台账行由 #206 补 | 2026-11-14 14:37 | Wisdom。来源是 Forge 卡片点选 |
| 三笔实现按顺序做。第 1 笔接在本分支、本 PR | 原话：「按推荐：PR205 实现三笔都批，按顺序做。第 1 笔 settings 存储 core 接在 PR205 同一分支、同一 PR；第 2 笔主进程接线加 W1–W4、第 3 笔 reader chip 加空态降级句，各等上一笔合入后从 main 开新分支，第 3 笔还要等 #206 合入；每笔过 Forge 审查、CI、Box，真机项真机跑；不 Ready/合入/发版，每次合入单独问我」。见 Issue #174 评论 [6873363453](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6873363453) 与 PR #205 评论 [6873364010](https://github.com/wisdom-km/open-immerse-v2/pull/205#issuecomment-6873364010)。14:49 台账行由 #206 补。本行只授权第 1 笔写进本分支 | 2026-11-14 14:49 | Wisdom。来源是 Forge 卡片点选 |

## 不改

- 第 1 笔已写 settings 存储 core。仍不改 `packages/contracts`，不把任何 `expose` 改成 true。
- 不改 CSP，不改协议注册，不改主进程，不改 `packages/features/library/src/`。
- 不做设置页，不做完整解析任务，不做译文，不做密钥存储，不读 `secrets.bin`。
- 不改 DESIGN、`docs/design-principles.md`、`docs/design/**`。
- 不改 PRD、ARCHITECTURE、`docs/arch/**`、RULES 的正文。
- 不改 `tools/compare-spec-bytes/manifest.json`、不改基线 `f8d5d01`、不改 `compare.mjs`。
- 不改批次 D 计划里的 D-19 / D-20。
- 不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。
- 不标 Ready，不合入，不发版。`--force-with-lease` 只用于本 feature 分支接上 main 的 rebase，依据是 14:20 批准（评论 [6873024142](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6873024142)）。

## 证据链接

- [docs/evidence/205/commands.md](../evidence/205/commands.md)：第 1 笔的 `check-arch-graph` 输出。Windows 截图仍等第 3 笔。

## 自检

- [x] 影响 arch / prd 吗？本 PR 不改规格正文。第 2 笔的事实更新列为 W4，不在本 PR。
- [x] 第 1 笔是 settings 存储 core。台账仍不改。14:37 与 14:49 由 #206 补。
- [x] W1–W4 已按 14:37 原话标成已批。第 1 笔已按 14:49 写在本分支。第 2、3 笔还没开始。W5、W6、W7、W9 仍是本批不做。
