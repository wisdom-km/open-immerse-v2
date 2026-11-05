# 执行计划

分支 `feature/m2-library-core-166`。基线 `origin/main` `a9b44e429d9aad3ee86e394c17359b8518f6d796`（#168 契约已 squash 合入）。第一笔提交只有本文件。预计超过 300 行，且同时动 `packages/features/library` 与 `packages/platform-node`，所以按 [RULES.md](../../RULES.md) §2 先交计划。Forge 不在线审这份计划；计划提交之后同一分支继续实现。PR 保持 Draft，正文写 `Refs #166`，不写 Closes / Fixes。不合入，不 force push，不 rebase（N-01、N-03）。不改 `.github/`（N-02）。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

任务类型：core 改动。涉及切片：`library`。没有 UI。`packages/platform-node` 只加 `library/` 路径辅助（#166 决定 2）。G18 只数 `packages/features/*/src/**`，platform-node 与单一切片同 PR 不触发「多于一个 feature slice」。

## 现状理解

- 已有行为：`packages/contracts/src/library.ts` 与 `packages/contracts/src/ipc/library.ts` 已定义 `LibraryEntry`、`LibrarySourceRecord`、`LibraryView` 和四条通道 `library.import` / `library.importDropped` / `library.list` / `library.relocate`。四条都是 `expose: false`。`LibraryEntry` 没有路径字段；`originalPath` 只在 `LibrarySourceRecord`。`apps/desktop/src/main/ipc/registry.generated.ts` 的登记是空数组，`wire-ipc.ts` 的 `handlers` 是空 `Map`。`packages/platform-node` 已能 `openAppStorage`，布局有 `db/`、`assets/`、`staging/`、`logs/`、`secrets.bin`，不建 `library/`。`data-root.test.ts` 断言 `library` 目录不存在。默认打开后没有 `lib_` 表。`packages/features/library` 还不存在。
- 相关的节：[docs/arch/03-01.md](../arch/03-01.md) §3.1、[docs/arch/04-02.md](../arch/04-02.md) `library` 行、[docs/arch/05-01.md](../arch/05-01.md) §5.1、[docs/arch/06.md](../arch/06.md) §6、[docs/arch/08-02.md](../arch/08-02.md) §8.2、[docs/arch/09.md](../arch/09.md) §9、[docs/arch/09-01.md](../arch/09-01.md) §9.1、[docs/prd/03-01.md](../prd/03-01.md) S6、[docs/prd/06-01.md](../prd/06-01.md) AC-01、[docs/prd/03-06.md](../prd/03-06.md) E08 / B16、[docs/prd/08.md](../prd/08.md) M2、[DESIGN.md](../../DESIGN.md) UIX-12 / R14 / §4.5.3、[docs/design-principles.md](../design-principles.md) P7。
- 还没做的部分：SHA-256 身份与去重、`lib_` 迁移、导入 / 列表 / 重定位 / 阅读进度用例、PDF 落盘、可测的 IPC handler、`library/` 路径辅助。UI、`expose: true`、装配根、B16、`checkSource`、`shell.revealItem`、ingest 都不在本 PR。

## 来源核对

| 来源 | 节 / 位置 | 核对结果 |
| --- | --- | --- |
| Issue #166 正文 | 决定 1 | 对得上。处理：源 PDF 算 SHA-256（小写 64 hex）作为 `LibraryEntry.id`；经 `staging/` 校验后移到 `library/<sha256>/source.pdf`；同一事务写 `lib_` 行，记下 `originalPath` 与 `fileName`；已有 id 返回已有条目且 `duplicate: true`，不新建行、不再写文件、不调用解析端口。 |
| Issue #166 正文 | 决定 2 | 对得上。处理：`DataRootLayout` 增加 `libraryDirectory`；`ensureDataRootDirectories` 创建 `library/`；增加 `libraryEntryDirectory` 与 `librarySourcePath`。SHA 必须是 64 位小写 hex，拒绝 `..` 与分隔符。从 `packages/platform-node/src/index.ts` 导出。 |
| Issue #166 正文 | 决定 3 | 对得上。处理：不做 B16 检测 UI、不做 `library.checkSource`、不做 `shell.revealItem`。只存原路径与 `fileName`。实现 `relocate`：请求只有 `{ id }`，选文件端口在 main 侧注入，features 不 `import "electron"`。成功只更新 `originalPath` 与 `fileName`，不改 id，不重写 `library/<sha>/source.pdf`。 |
| Issue #166 正文 | 决定 4 | 对得上。处理：只做 `list` 与排序。不做删除、多选、批量、行内「⋯」、右键菜单、`session.save`。本 PR 无 UI。 |
| Issue #166 正文 | 决定 5 | 对得上。处理：`view: "recent"` 只含 `openedAt != null`，未传 `sort` 时按 `openedAt desc`，core 筛、core 排。`view: "all"` 是全部条目。表里只有 PDF，没有 Markdown。 |
| Issue #166 正文 | 决定 6–7 | 对得上。处理：不建 Markdown 笔记库、术语库、「打开文件夹…」。不接 ingest，不接 PDF.js。导入依赖里留一个 `ingest.openDocument`，实现不调用它；测试断言调用次数为 0。 |
| Issue #166 正文 | 决定 8–10 | 对得上 core 部分。处理：排序在 `list-library` 完成，UI 不自排。`recent` 的默认序是 `openedAt desc`。`all` 未传 `sort` 时：`openedAt` 为空的排后，组内再按 `addedAt desc`，同刻再用 `id` 升序钉死。这覆盖 [docs/arch/09-01.md](../arch/09-01.md) 对 all「默认 openedAt desc」的字面读法；契约 `LibraryView` 注释已写明以决定 10 为准。启动落在「最近」、空态链接是 UI，属拆分 C。 |
| Issue #166 正文 | 拆分 B | 对得上。处理：只建 `packages/features/library` 的 domain / application / adapters / migrations / `src/testing` / `test/core` / `test/adapters`。不建 `src/ui/**`。源文件软 400 / 硬 600，函数 ≤ 80（domain 纯函数按 §6 例外）。本文件是超过 300 行之前的计划。 |
| Issue #166 评论 | [6649725202](https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6649725202) | 对得上。A = #168 已在 `main@a9b44e4`。本分支从这次 `origin/main` 拉出。不改 `packages/contracts/**`。 |
| Issue #166 评论 | [6649758865](https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6649758865) | 对得上。Wisdom 原话「按照计划继续推进」。范围是拆分 B。实现提交把这一行写入 [docs/approvals.md](../approvals.md)。 |
| Issue #163 评论 | [6648926549](https://github.com/wisdom-km/open-immerse-v2/issues/163#issuecomment-6648926549) | 对得上。2026-11-05 11:31 已在 approvals。它授权推进 #163 遗留项并开始导入与文献库。本 PR 只做 #166 的 B，不重做 #163 的存储内核。 |
| [docs/approvals.md](../approvals.md) | 23:40 / 11:31 / 11:38 行 | 对得上。23:40 定了 M2 顺序，11:31 授权推进到导入与文献库，11:38 定稿决定 1–10 与 A/B/C。处理：计划引用这三行。实现提交再补 12:30（A 已合入的同步，不计入新的批准）与 12:33（开工 B）。 |
| [docs/arch/03-01.md](../arch/03-01.md) | §3.1 | 对得上。处理：包名 `@oi/feature-library`，目录含 `package.json`、`README.md`、`src/index.ts`、`src/pure.ts`、`domain/`、`application/ports/`、`application/use-cases/`、`adapters/`、`src/testing/`、`migrations/`、`test/core/`、`test/adapters/`。不建 `src/ui/`。 |
| [docs/arch/04-02.md](../arch/04-02.md) | `library` 行 | 对得上要做的文件，对不上本 PR 不做的文件。处理：做 `document-identity.ts`、`library-record.ts`、`import-pdf.ts`、`list-library.ts`、`update-progress.ts`、`library-repository.ts`、`sqlite-library-repository.ts`。`update-progress` 无 IPC，只写 `openedAt` 与页进度。不做 `get-bibliographic-records.ts`（写作预留）。不做 `ui/library-list.tsx`。不做 v1 导入器。 |
| [docs/arch/05-01.md](../arch/05-01.md) | ADP→PN | 对得上。处理：只有 `adapters/` 导入 `@oi/platform-node` 与 `node:fs` / `node:crypto`。`domain/` 与 `application/` 不导入 platform-node、electron、`node:`。 |
| [docs/arch/06.md](../arch/06.md) | 行数表 | 对得上。处理：源文件不超过 600，测试不超过 800，函数不超过 80。超过 600 行的 PR 在提交说明和 PR 正文写 `G12:`，不改上限（N-08）。 |
| [docs/arch/08-02.md](../arch/08-02.md) | §8.2 | 对得上。处理：写入顺序是暂存 → 校验摘要 → 移到 `library/<sha256>/source.pdf` → 事务内写 `lib_` 引用。失败删掉本次的 `library/<sha>/`（空目录也删）。暂存文件由本切片在失败路径删掉；既有清理约定仍然适用。迁移文件只在本切片，表前缀只 `lib_`。不改其他切片的迁移。 |
| [docs/arch/09.md](../arch/09.md) | §9 路径规则 | 对得上。处理：handler 与用例返回的 `LibraryEntry` 和列表只有 `id`、`fileName`、`title`、`addedAt`、`openedAt`。错误 `message` 用固定短句，不拼接异常文本，因此不含绝对路径。 |
| [docs/arch/09.md](../arch/09.md) | 第 11 行 ingest 唯一入口 | 对不上已合入的 #168。该行写「打开 PDF 只有 `ingest.openDocument`；`library.importPdf` 不是 IPC」。#168 已把 `library.import` / `library.importDropped` 定为 IPC，且 `expose` 仍为 false。处理：本 PR 以 #166 / #168 为准，文献库导入不经 ingest。不改 §9 正文，留给下一份文档 PR。 |
| [docs/arch/09-01.md](../arch/09-01.md) | `list` / `relocate(id)` | 对得上字段，all 的默认序以决定 10 为准。处理：显式 `sort.field` 为 `title`、`status`、`openedAt`、`addedAt`，`dir` 为 `asc` 或 `desc`。`relocate` 由注入的选文件端口打开选择器，renderer 不传路径。`checkSource` 与批量删除不做。与副本的关系仍按该节「还没核实」：本 PR 不发明「重写副本」的语义。 |
| [docs/prd/03-01.md](../prd/03-01.md) | S6 | 对得上。处理：身份是原 PDF 的 SHA-256。重复导入不建新文献、不调用解析端口。阅读进度走 `update-progress`，不另开 IPC。 |
| [docs/prd/06-01.md](../prd/06-01.md) | AC-01 | 对得上。处理：同一 SHA-256 第二次导入返回 `duplicate: true`，`lib_` 行数与 `library/` 下目录数与第一次成功后相同。 |
| [docs/prd/03-06.md](../prd/03-06.md) | E08 / B16 | 对得上「界面不收绝对路径」。B16 UI 推后。处理：本 PR 无 UI。返回值也不带绝对路径，供以后的界面只用文件名。 |
| [DESIGN.md](../../DESIGN.md) | UIX-12、R14、§4.5.3 | 对得上重复导入跳已有条目。R14 与 §4.5.3 的左栏、空态、主按钮是 UI。处理：core 给出 `duplicate` 与已有条目；不改 DESIGN 正文（N-10）。 |
| [docs/design-principles.md](../design-principles.md) | P7 / 第 101 行 | 对得上。处理：筛选和排序都在 core。打开 / 拖入 / 最近是主路径：对话框导入与 `importDropped` 两条 handler 都落到同一个导入用例。不改该文件（N-10）。 |
| [RULES.md](../../RULES.md) | §2 | 对得上。处理：一个 feature 切片；第一笔只有本计划；证据在 PR 号出来后写入 `docs/evidence/<PR号>/commands.md`。 |
| [docs/exec-plans/feature-m2-sqlite-storage-163.md](feature-m2-sqlite-storage-163.md) | 行为 / 不做 | 对得上。该计划有意不建 `library/`、不建 `lib_`。处理：本 PR 补上这两处，不改 `openAppStorage` 的默认迁移列表。不传 library 迁移时仍然没有 `lib_` 表。 |
| [packages/contracts/src/library.ts](../../packages/contracts/src/library.ts) | `LibraryView` 注释 | 对得上。处理：recent / all 的默认序按注释实现。`status` 在②没有解析状态：全部视为同一占位，次序回落到 `addedAt` 的请求方向，再按 `id` 升序。不发明 IPC 没有的状态枚举，不给 `LibraryEntry` 加 `status` 字段。 |
| [packages/contracts/src/ipc/library.ts](../../packages/contracts/src/ipc/library.ts) | 四描述符 | 对得上。处理：实现四条 handler，错误码只用契约里的 `cancelled`、`not_pdf`、`hash_mismatch`、`not_found`，外加传输错误 `handler_threw`（存储或读文件失败，`retryable: true`）。`expose` 保持 false。`importDropped` 的路径不进 request schema：handler 的第二个事实参数是绝对路径，返回值仍是契约的 `Result`。PR-C 再把 preload 的路径接上。不改描述符，因此不跑出会改 registry 的 codegen 差异。 |
| [packages/platform-node/src/storage/data-root.ts](../../packages/platform-node/src/storage/data-root.ts) | 现状 | 对得上。现在没有 `libraryDirectory`，测试期望目录不存在。处理：改成创建 `library/`，并单测非法 sha。`secrets.bin` 仍然不创建。 |
| `apps/desktop/src/main/ipc/registry.generated.ts` | 空 registry | 对得上。处理：不改该文件，不改 `wire-ipc.ts`，不改 `composition-root.ts`。handler 由切片导出，适配器测试直接调用。 |
| SPEC-DRAFT.md | §3 PR-B 行 | 对得上文件清单与「失败不留半份」。端口名用 `pdf-file-store.ts`（§4.2 未列，在下面写死）。迁移文件名用 `migrations/0001_lib_entries.sql`，表名 `lib_entries`。与 #166 冲突时以 #166 与本交接为准。 |
| LOOM-PRINCIPLE-CHECK.md | §1、§4 B01 / B02、§6 | 对得上 recent 的定义、all 的空值排序，以及 UI 项推后。B01 说接阅读器前 `openedAt` 可恒空；本 PR 仍做薄 `update-progress`，所以 recent 不必等 UI 才有数据，只是还没有 IPC、也没有阅读器调用。B02 的空值排后由 core 给出。 |
| [tools/check-one-slice/check.mjs](../../tools/check-one-slice/check.mjs) | `slicesIn` | 对得上。它只统计 `packages/features/*/src/**`。本 PR 只新增 `library` 的 `src/`。 |
| [tools/check-pr-size/check.mjs](../../tools/check-pr-size/check.mjs) | 600 + `G12:` | 对得上。core、适配器、迁移、platform-node 与测试会超过 600 行。提交说明与 PR 正文写：`G12: 导入、去重、列表排序、lib_ 迁移、library/ 路径辅助与失败不留半份是同一次证明，不拆、不改 600 行上限。` |

## 计划 / 实际

计划列在开工前填。实际列在实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `a74d97e` 只有本文件 | 本表 |
| 2 | platform-node：`libraryDirectory`、`ensureDataRootDirectories` 创建 `library/`、`libraryEntryDirectory`、`librarySourcePath`，导出，并改 data-root 测试 | `e2da38c`。`secrets.bin` 仍不创建。非法摘要返回 `storage.invalid_path` | [commands.md](../evidence/169/commands.md) |
| 3 | `@oi/feature-library` 骨架、`0001_lib_entries.sql`、repository 与 fs store | `c1c7b2d`。插入在一个事务里。暂存失败、摘要不符、插入失败都不留 `library/<sha>/` | 同上 |
| 4 | `import-pdf`、`list-library`、`relocate-source`、`update-progress`，以及 core / adapter 测试 | 同一次提交。重复导入不写文件、不调用 ingest。`status` 按 `addedAt` 再 `id`。标题去掉末尾 `.pdf` | 同上 |
| 5 | `ipc-handlers.ts`（注入选文件端口）与错误码测试。`expose` 仍为 false | handlers 在 `c1c7b2d`。`f7c781c` 去掉适配器对 `@oi/kernel` 的 import。契约 `expose` 未改 | 同上 |
| 6 | approvals 补 12:30 / 12:33。`vitest.config.ts` 的 include 加上 `packages/features/*/test/adapters/**/*.ts`，否则 `pnpm test` 收集不到适配器测试。不改 workflow。证据在 PR 号出来后写入 `docs/evidence/<PR号>/commands.md` | `f739ab1` 补了这两行。include 在 `c1c7b2d`。未改 `.github/` | 同上 |
| 7 | `GATE_BASE=origin/main corepack pnpm run check` 与 `corepack pnpm test`。失败则只修这次引入的失败 | 在 `f7c781c` 上两条都是退出码 0。`pnpm test`：511 passed、3 skipped。`check-docs` findings 0。依赖图 planned 从 22 变为 16 | 同上 |

## 行为

### 路径辅助

- `dataRootLayout` 增加 `libraryDirectory = <dataRoot>/library`。其余字段不变。
- `ensureDataRootDirectories` 多创建这一个目录。仍不创建 `secrets.bin`。
- `libraryEntryDirectory(layout, sha256)` → `library/<sha256>`。`librarySourcePath(layout, sha256)` → `library/<sha256>/source.pdf`。摘要不是 `/^[0-9a-f]{64}$/` 时返回 `storage.invalid_path`，文案沿用现有的 `path was rejected`，不含输入路径。
- 默认 `openAppStorage` 不读取 library 迁移。已有「打开后无 `lib_` 表」的测试保持不变。

### 表

`lib_entries`：`id`（主键，64 位小写 hex）、`file_name`、`title`、`original_path`、`added_at`、`opened_at`（可空）、`progress_page`（可空，≥ 1）。只有 library 适配器读写。`readSliceMigrations("library", <本切片 migrations 目录>)` 交给 `openAppStorage`，记入 `schema_migrations`。

### 导入

1. 读源文件。前 5 字节不是 `%PDF-` → `not_pdf`。读不了 → `rejected`（handler 映射为 `handler_threw`）。
2. SHA-256 小写 hex 即 id。库中已有：返回已有 `LibraryEntry`，`duplicate: true`。不写文件，不调用 `ingest.openDocument`。
3. 否则把字节写入 `staging/<sha>`，再读回核对摘要。不符 → `hash_mismatch`，删掉该暂存文件。
4. 相符则移到 `library/<sha>/source.pdf`，`chmod 0o444`。然后在一个事务里插入 `lib_` 行。
5. `originalPath` 是调用方给出的源路径。`fileName` 是该路径的 basename，必须符合契约的文件名形状（不含斜杠）。`title` 初值是去掉末尾 `.pdf`（大小写不敏感）之后的 `fileName`，不接 PDF.js。`addedAt` 来自注入的 `Clock`，格式为 UTC ISO-8601 带 `Z`。`openedAt` 为 null，`progress_page` 为 null。
6. 插入失败：删除 `library/<sha>/`，返回 `rejected`。成功返回的条目不含 `originalPath`。

### 列表

- 先按 view 过滤，再排序。recent 即使传了别的 `sort`，也先丢掉 `openedAt == null`。
- 未传 `sort`：recent 按 `openedAt desc`；all 按「有 `openedAt` 的在前，空的在后」，组内 `addedAt desc`。
- 显式排序不再套用 all 的空值分组。`title` 用 `en` 比较。`openedAt` 的空值仍排在末尾，其余按 `dir`。`addedAt` 按 `dir`。`status`：没有状态列，全部同一占位，按 `addedAt` 的 `dir` 排。
- 任何一级打平后按 `id` 升序。时间用 `Date.parse` 比较，避免「有无毫秒」的字符串序颠倒。
- 返回数组的元素只有契约上的五个字段。

### 重定位

handler 先问选文件端口。取消 → `cancelled`，不读库。无此 id → `not_found`。所选文件非 PDF → `not_pdf`。内容 SHA-256 不等于 id → `hash_mismatch`。相等则更新该行的 `originalPath` 与 `fileName`。不改 id，不调用落盘端口。

### 阅读进度

`update-progress` 没有 handler。输入是 id、`openedAt`、`page`（正整数或 null）。成功后 recent 能看见这条。无此 id → `not_found`。非法时间或页码 → `rejected`，行不变。

### IPC

`createLibraryIpcHandlers` 放在 `adapters/ipc-handlers.ts`。`library.import` 与 `library.relocate` 使用选文件端口。`library.importDropped` 接收已经拿到的绝对路径。`library.list` 把 view / sort 交给用例。存储失败与读失败映射为 `{ code: "handler_threw", retryable: true }`，不把底层 `message` 传出去。通道不允许的码也映射为 `handler_threw`（例如拖入路径上不会出现 `cancelled`）。

### 依赖与装配

- 不加 npm 包。哈希用 `node:crypto`。workspace 依赖是 `@oi/contracts`、`@oi/kernel`、`@oi/platform-node`。`pnpm-lock.yaml` 只增加这个 workspace importer。
- `src/index.ts` 只做转出。`src/pure.ts` 是空的 `export {}`：排序不是展示纯函数，避免 UI 自己排。
- 不改 `composition-root.ts`、`wire-ipc.ts`、codegen 产物、契约、DESIGN、`.cursor/`。
- Electron 对话框留到 PR-C 的 desktop 适配。本 PR 的端口在测试里用假实现。

## 测试映射

| 验收 | 观察 |
| --- | --- |
| AC-01 / 决定 1 | 同一字节第二次导入 `duplicate === true`，行数与 `library/` 子目录数不变，`ingest.openDocument` 调用次数为 0，源文件仍在 |
| §8.2 失败不留半份 | 暂存写入抛错、摘要第二次不一致、插入返回失败：之后 `lib_` 行数与导入前相同，没有 `library/<sha>/source.pdf` |
| §9 | 成功与失败结果上递归没有 `path` / `originalPath` / `filePath`；`message` 不含临时目录，也不匹配绝对路径形状 |
| 决定 5 / 10 | recent 不含 `openedAt == null`；all 默认空值在后且组内 `addedAt desc`；显式四字段可用；`status` 的次序等于 `addedAt` + `id` |
| relocate | SHA 相同才改 `originalPath`；不同返回 `hash_mismatch`；取消返回 `cancelled`；副本字节不变 |
| update-progress | 写入后 recent 含该条；无 IPC 通道被注册（本 PR 不改 registry） |
| platform-node | `library/` 存在，`secrets.bin` 不存在；`..`、分隔符、大写、短摘要都被拒绝 |
| 默认存储 | 不传 library 迁移时 `sqlite_master` 仍无 `lib_` |

用例名用 `<结果> when <条件>`。对得上 AC-01 的用例名以 `AC-01` 开头。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| M2 先做存储，再做导入与文献库 | 原文：「那就按照你的这个建议吧，先做SQL Lite的加文件存储，再做导入和文献库，最后做PDF.js阅读」。已在 approvals 23:40 行。来源：https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6634955416 | 2026-11-04 23:40 | Wisdom |
| 推进到导入与文献库 | 原文：「OK，那就按照你的建议去推进吧，163，然后和导入和文献库。」已在 approvals 11:31 行。来源：https://github.com/wisdom-km/open-immerse-v2/issues/163#issuecomment-6648926549 | 2026-11-05 11:31 | Wisdom |
| #166 决定 1–10 与 A/B/C | 原文：「这些都按照推荐吧，当然那个推荐也需要你跟Loom一起去讨论一下子，综合一下你俩共同的建议。」已在 approvals 11:38 行 | 2026-11-05 11:38 | Wisdom |
| 开工拆分 B | 原文：「按照计划继续推进」。实现提交写入 approvals。来源：https://github.com/wisdom-km/open-immerse-v2/issues/166#issuecomment-6649758865 | 2026-11-05 12:33 | Wisdom |
| 做薄 `update-progress`，无 IPC | §4.2 有这个文件，契约 A 没有通道。不做的话 recent 在阅读器接线前只能是空。交接 §7 建议做 | 2026-11-05 | 交接建议，本计划采纳 |
| `status` 排序回落到 `addedAt` 再 `id` | ②没有解析状态。不发明新的状态枚举。交接 §7 建议稳定回落 | 2026-11-05 | 交接建议，本计划采纳 |
| 标题初值是去掉 `.pdf` 的文件名 | 无解析结果。交接 §7 写死。不接 PDF.js | 2026-11-05 | 交接建议，本计划采纳 |
| 选文件只留端口 | features 不能导入 electron。真 `dialog` 属 PR-C。交接 §7 建议本 PR 用假对话框 | 2026-11-05 | 交接建议，本计划采纳 |
| §9 第 11 行暂不改 | 与 #168 冲突。#166 把文献库导入定为 IPC。改 ARCH 正文是下一份文档 PR | 2026-11-05 | 交接，本计划采纳 |
| 落盘端口名 `pdf-file-store` | SPEC 用过这个名字。§4.2 没列。文件是 `application/ports/pdf-file-store.ts` 与 `adapters/fs-pdf-file-store.ts` | 2026-11-05 | 本计划 |
| 超过 600 行不拆 B | 导入、去重、排序、迁移、路径辅助与失败清理要一起证明。不改 G12 上限 | 2026-11-05 | 交接，本计划采纳 |
| 适配器不 import kernel | §5.1 没有画出 ADP → K。适配器用本地结果形状。`src/testing` 由 `layer-of` 排除，假实现留在模板要求的目录。已画出的 APP→DOM、APP→C、APP→K、ADP→APP、ADP→DOM、ADP→PN 因此落地，planned 快照 22→16 | 2026-11-05 | 实现时 |

## 证据链接

- [commands.md](../evidence/169/commands.md)

## 自检

- [x] 影响 arch / prd 吗？§9 第 11 行与 #168 对不上。本 PR 不改 arch / prd / DESIGN 正文。approvals 补两行。规格变更记录不适用。
