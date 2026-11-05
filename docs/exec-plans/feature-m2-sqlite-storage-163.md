# 执行计划

分支 `feature/m2-sqlite-storage-163`。基线 `origin/main` `523c18d`（Markdown 组 #159 / #160 / #162 已在 main）。第一笔提交只有本文件。预计超过 300 行，所以按 [RULES.md](../../RULES.md) §2 先交计划。交接写明「不确定时偏保守：先计划提交再实现」，并写明本仓库惯例是计划与实现同 PR、多提交。本计划写完后继续实现，PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

本任务没有 UI。任务类型不是 UI 改动、seam 变更、core 改动。涉及的是 `packages/platform-node` 与 ADR 登记，不是 `packages/features` 切片。G18 只数 `packages/features/*/src/**`。

## 现状理解

- 已有行为：`packages/platform-node` 只有诊断日志落盘（`src/logging/`）。`src/index.ts` 只导出 `createFileLogger` 与 worker stderr 读取。没有 SQLite、没有 `app_meta`、没有 `schema_migrations`、没有数据根目录辅助。`apps/desktop` 依赖 Electron `45.2.1`。装配根 `composition-root.ts` 只启动文件日志。`docs/adr/` 已有 0001–0003。没有 0004。
- 相关的节：[docs/arch/08-04.md](../arch/08-04.md) §8.4、[docs/arch/08-02.md](../arch/08-02.md) §8.2、[docs/arch/08-03.md](../arch/08-03.md) §8.3、[docs/arch/10-04.md](../arch/10-04.md) §10.4、[docs/arch/01.md](../arch/01.md) §1、[docs/arch/03.md](../arch/03.md) §3、[docs/arch/03-01.md](../arch/03-01.md) §3.1、[docs/arch/04-01.md](../arch/04-01.md) §4.1、[docs/arch/16.md](../arch/16.md) §16、[docs/prd/06-01-07.md](../prd/06-01-07.md) AC-66 ①、[docs/prd/08.md](../prd/08.md) M2 行、[docs/adr/0001-m4-desktop-ui.md](../adr/0001-m4-desktop-ui.md)、[docs/adr/README.md](../adr/README.md)。
- 还没做的部分：数据根路径、SQLite 打开与 WAL、迁移运行器、迁移前备份与失败后原文件字节不变、更高 `app_schema` 只读、JSON `schemaVersion` 未知字段往返。协议版本（AC-66 ②）不在本 PR。

## 来源核对

| 来源 | 核对结果 |
| --- | --- |
| [docs/arch/08-04.md](../arch/08-04.md) | 对得上。`app_schema` 只增不减；迁移前复制到 `staging/`；失败回滚且原文件不动；成功只留最近一份备份；更高 `app_schema` 只读、写入次数 0；JSON 带 `schemaVersion`，未知字段写回不丢，主版本更高则该文档只读；与 §10.4 合一个 ADR，在第一张业务表之前合入。处理：ADR 0004 登记这些规则。本 PR 只建 `app_meta` 与 `schema_migrations`。不改 §8.4 正文。 |
| [docs/arch/08-02.md](../arch/08-02.md) | 对得上。布局是 `db/oi.sqlite`、`assets/`、`staging/`、`logs/`、`secrets.bin`。`schema_migrations` 记录各切片 `migrations/`，按（切片, 版本号）排序，两个切片不改同一个文件。`dataRoot` 可迁移，指针文件名与位置由 Forge 定，本页写「还没核实」。处理：路径辅助覆盖 `db/`、`assets/`、`staging/`、`logs/` 与 `secrets.bin` 路径。指针只提供由调用方传入文件名的拼接，不选定文件名，不实现迁移流程。`library/` 留给导入 PR。 |
| [docs/arch/10-04.md](../arch/10-04.md) | 对得上。协议规则写入同一 ADR。桌面主版本范围计划放在 `packages/worker-client/src/supervisor-protocol.ts`，该包还不存在。处理：ADR 0004 写入协议规则。本 PR 不建 `worker-client`，不实现 AC-66 ②。 |
| [docs/prd/06-01-07.md](../prd/06-01-07.md) AC-66 ① | 对得上三条存储测试。同一条还写「界面出现错误页并能导出诊断包」。处理：三条自动化测试在本 PR。错误页与诊断包导出不在本 PR（无 UI）。因此 PR 用 `Refs #163`，不把 issue 标成已完成。 |
| [docs/prd/08.md](../prd/08.md) M2 | 对得上。SQLite + 文件存储（含版本与迁移备份）是 M2 交付之一。导入、PDF.js、设置与密钥、诊断包导出、`.md` 打开不在本 PR。 |
| #163 与 #28 评论 [6634955416](https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6634955416) | 对得上。Wisdom 2026-11-04 23:40 原文：「那就按照你的这个建议吧，先做SQL Lite的加文件存储，再做导入和文献库，最后做PDF.js阅读」。Markdown 组已在 `523c18d` 合入。处理：本 PR 只做顺序 ① 的基础设施。 |
| #163 评论 [6646970218](https://github.com/wisdom-km/open-immerse-v2/issues/163#issuecomment-6646970218) | 对得上。Wisdom 2026-11-05 09:20 原文：「继续」。范围是 Markdown 组合完后开工 #163。处理：本计划之后实现。 |
| [docs/arch/16.md](../arch/16.md) §16 | 对得上。第一批 ADR 里，存储与协议升级规则仍写着「须在 M2 建第一张业务表之前合入」，0002、0003 已登记。处理：§16 加上 ADR 0004 已登记，并在 `tools/compare-spec-bytes/manifest.json` 加唯一替换。不改基线 `f8d5d01`。 |
| [docs/adr/0001-m4-desktop-ui.md](../adr/0001-m4-desktop-ui.md) | 对得上。数据目录可迁移已采纳。指针文件名、`secrets.bin` 能否同机复制、`staging/` 与 `logs/` 迁移还是清空，该页写明未代定。处理：本 PR 不重做迁移 UI，不选定指针文件名。ADR 0004 引用 0001，不改 0001 正文。 |
| `openai-review*/REPORT.md` | 仓库与 `/opt` 下没有这份报告。相近文字在 [docs/reviews/2026-10-30-architecture-review.md](../reviews/2026-10-30-architecture-review.md)：迁移前复制到 `staging/`，失败停在旧文件，更高 `app_schema` 只读或拒绝写入。与 §8.4 一致，不另写一条规则。 |

`docs/approvals.md` 还没有 23:40 与 09:20 这两行。实现提交补上，否则本计划引用的批准不算已批准（[docs/exec-plans/README.md](README.md)）。

## 计划 / 实际

计划列在开工前填。实际列在实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 | `b240d56` 只提交本文件 | 本文件 |
| 2 | ADR `docs/adr/0004-storage-and-protocol-versions.md`。五节：背景、选项、决定、后果、状态。状态为采纳。登记 [docs/adr/README.md](../adr/README.md)、[docs/arch/16.md](../arch/16.md)、[docs/backlog.md](../backlog.md) E-P1-1。§16 的改动配 compare-spec-bytes amendment。不改 §8.4、§10.4 正文 | 已写入。compare-spec-bytes 退出码 0。两条 amendment 各替换一次 | 实现提交 |
| 3 | `packages/platform-node` 数据根、打开、迁移、备份恢复、JSON 文档。从 `src/index.ts` 导出，供 main 以后注入。不改 `composition-root.ts` | 已写入 `src/storage/`。装配根未改 | 实现提交 |
| 4 | AC-66 ① 三条测试，外加迁移排序与「两个切片不改同一文件」 | 定向 vitest 12 通过 | 实现提交后写入 `docs/evidence/<PR号>/commands.md` |
| 5 | `docs/approvals.md` 补两行。`docs/spec-changelog.md` 加一行。证据在 PR 号出来后写入 `docs/evidence/<PR号>/commands.md` | approvals 已补 23:40 与 09:20，总数 79。changelog 与证据在 PR #165 | [commands.md](../evidence/165/commands.md) |
| 6 | `GATE_BASE=origin/main corepack pnpm run check`，以及定向 vitest。失败则只修这次引入的失败 | `caa5a5e`：定向 vitest 12 通过；`pnpm test` 456 通过、3 跳过；`pnpm run check` 退出码 0 | [commands.md](../evidence/165/commands.md) |

预计行数（开工前，含空行）：实现与测试约 900–1400，加上 ADR 与登记。超过 G12 的 600 行。实现提交说明和 PR 描述都写一行 `G12:`：打开、迁移、失败时原文件字节不变、更高版本只读、JSON 往返是同一次 AC-66 ①，拆开不能一起证明这三条。不调上限（N-08）。

函数不超过 80 行，圈复杂度不超过 15，参数不超过 4 个。禁止顶层 `let`（F-06）。不建 `utils.ts`。错误信息里不写绝对路径、正文或密钥。

## 驱动

2026-11-05 在本机 Node v22.23.4 上核实，不照抄假设。

- `import { DatabaseSync } from "node:sqlite"` 成功，不需要 `--experimental-sqlite`。进程打出 `ExperimentalWarning`。`@types/node` 22.20.5 有 `DatabaseSync`，含 `readOnly`（v22.12.0 起）与 `timeout`（v22.16.0 起）。
- 同一天测了三件事：只读打开后主文件字节与打开前相同；只读连接上 `INSERT` 被拒绝；`BEGIN IMMEDIATE` 后 `INSERT` 再 `ROLLBACK`，主文件字节与回滚前不同。所以「事务回滚」本身不能满足「原库逐字节不变」。
- Electron `45.2.1` 的发行说明写 Node.js `24.22.1`（https://releases.electronjs.org/release/v45.2.1 ，2026-11-05 查阅）。`node:sqlite` 在 Electron 里从 36.7.3 / 37.2.3 起修复（electron/electron#47706，2025-07）。45 晚于这次修复。本机没有 Electron 二进制，没有在 Electron 进程里再执行一次 `import("node:sqlite")`。
- 不用 `better-sqlite3` 或 `sqlite3`。二者是原生扩展，要按 Electron 45 的 ABI（Node 24）另编一份，CI 与测试用的是 Node 22.23.4。还要新增依赖并过 G10。`node:sqlite` 不加依赖。
- 不用 `sql.js`。它不提供规格要求的文件 WAL 与单写者锁。

决定：用 `node:sqlite` 的 `DatabaseSync`。同步 API，单连接即单写者。打开读写库后执行 `PRAGMA journal_mode = WAL`。只读库不执行这条 pragma。`timeout` 设为 0，第二个人抢锁时立刻失败，不在库上等待。

## 行为

`openAppStorage({ dataRoot, clock, supportedAppSchema, migrations })` 返回 `Result`。

- `dataRootLayout` 给出 `db/oi.sqlite`、`assets/`、`staging/`、`logs/`、`secrets.bin`。`ensureDataRootDirectories` 只创建前四个目录，不创建 `secrets.bin`，不创建 `library/`。
- `assetFilePath` 使用 SHA-256 的前 2 个十六进制字符做分桶：`assets/<前两位>/<assetId>`。摘要必须是 64 位小写十六进制。`assetId` 与暂存文件名只允许字母、数字、`_`、`-`。拒绝 `..` 与分隔符。
- `dataRootPointerPath(anchorDirectory, fileName)` 只做拼接。文件名由调用方传入。本 PR 不创建指针文件。
- 基础设施表由运行器在事务里创建，不放进任何功能切片的 `migrations/`：`app_meta(id=1, app_schema)` 与 `schema_migrations(slice, version, migration_id, applied_at)`。`app_schema` 降低时由触发器拒绝。本常量 `STORAGE_APP_SCHEMA` 是 `1`。
- 各切片迁移由调用方传入，或用 `readSliceMigrations(slice, directory)` 读取 `NNNN_name.sql`。排序键是（切片名，版本号）。已记录的（切片，版本）跳过。两个切片各读各的目录，运行器不写这些文件。
- 已有库：先以只读打开，读 `app_schema`。高于 `supportedAppSchema` 时保持只读并返回，写入 API 在送到驱动之前拒绝，`writes` 保持 0，不备份、不迁移。
- 需要迁移时：先把主文件以及已有的 `-wal`、`-shm` 读进内存；把迁移前的主文件写成 `staging/oi.sqlite.bak`（临时文件再改名，只留这一份）；再打开读写连接，在事务外设置 WAL，在 `BEGIN IMMEDIATE` 里建基础设施表、执行未跑的迁移、把 `app_schema` 升到支持版本（只升不降）、提交。失败时 `ROLLBACK`、关闭连接，再把内存快照写回，并删掉快照里本来没有的 `-wal` / `-shm`。这一步是为了补上实测里回滚不保字节的缺口。成功后连接保持打开，备份留在 `staging/oi.sqlite.bak`。
- 新建库没有旧文件可备份。失败则删除刚创建的文件与 `-wal` / `-shm`。成功不写 bak。
- 不需要迁移的已有库：读写打开并设置 WAL。这一步允许改变文件头。AC-66 不要求这种打开保持字节不变。
- JSON：`readJsonDocument` / `writeJsonDocument` 放在 platform-node，不改 `packages/contracts`（契约改动要单独成 PR）。对象带整数 `schemaVersion`。写回时把已读到的字段与本次更新合并，调用方没提到的字段仍在。`schemaVersion` 高于调用方给出的主版本时，写回返回原来的文本，`writes` 为 0。
- 公开 API 不导出 `DatabaseSync`。renderer 到不了 `node:sqlite`：现有 `renderer-isolation` 与 `ui-through-seam` 已经拒绝 `packages/platform-node` 与 `node:`。本 PR 不改 dependency-cruiser。
- 不改 `composition-root.ts`。现在打开会在用户目录留下空库，文献库还没有表。main 以后调用导出的 `openAppStorage`。

## 测试映射

| 验收 | 观察 |
| --- | --- |
| AC-66 ① 迁移失败 | 注入一条非法 SQL。失败返回后，`oi.sqlite` 字节与调用前相同。错误信息里不出现临时目录 |
| AC-66 ① 更高 `app_schema` | 样例库的 `app_schema` 高于支持版本。打开为只读。调用写入 API 后 `writes` 为 0，样例行还在，文件字节不变 |
| AC-66 ① JSON | `schemaVersion` 在支持范围内时，更新已知字段后未知字段仍在。主版本更高时 `writes` 为 0，文本与读入的相同 |
| §8.2 排序与文件 | 两个临时目录里的迁移按（切片，版本）记录。两个 SQL 文件的字节不变 |
| §8.4 只增不减 | 直接 `UPDATE` 把 `app_schema` 改小会被拒绝，值仍是原来的整数 |
| §8.2 布局 | `secrets.bin` 路径在数据根下，不在 `db/` 里，打开后该文件不存在。`sqlite_master` 里没有 `lib_`、`doc_`、`job_`、`fsrc_`、`tr_`、`md_`、`note_`、`qa_`、`voice_`、`set_`、`bud_`、`diag_`、`ing_`、`wr_` 开头的表 |

用例名用 `<结果> when <条件>`，对得上的加 `AC-66`。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| M2 先做 SQLite + 文件存储，再做导入与文献库，最后做 PDF.js | 原文：「那就按照你的这个建议吧，先做SQL Lite的加文件存储，再做导入和文献库，最后做PDF.js阅读」。实现提交把这一行写入 approvals.md。来源：https://github.com/wisdom-km/open-immerse-v2/issues/28#issuecomment-6634955416 | 2026-11-04 23:40 | Wisdom |
| 开工 #163 | 原文：「继续」。实现提交写入 approvals.md。来源：https://github.com/wisdom-km/open-immerse-v2/issues/163#issuecomment-6646970218 | 2026-11-05 09:20 | Wisdom |
| 驱动用 `node:sqlite` 的 `DatabaseSync`，不加原生扩展 | 见上面「驱动」。Node 22.23.4 已能导入。Electron 45.2.1 绑定 Node 24.22.1，且 36.7.3 起修复了内置 SQLite | 2026-11-05 | 本计划 |
| 失败后用迁移前快照覆盖原文件 | 同一天实测：`ROLLBACK` 之后主文件字节已变。事务回滚仍然做。字节保证靠快照写回 | 2026-11-05 | 本计划 |
| 资产分桶用摘要前 2 位 | §8.2 只写 `<sha256-prefix>`，没有长度。2 位十六进制是 256 个目录 | 2026-11-05 | 本计划 |
| 不选定数据根指针文件名 | ADR 0001 与 §8.2 写明由 Forge 定，且尚未核实 | 2026-11-05 | 本计划 |
| JSON 往返放在 platform-node，不改 contracts | RULES §2：契约单独成 PR。AC-66 ① 允许放在 platform-node | 2026-11-05 | 本计划 |
| 不把打开接到装配根 | `composition-root.ts` 是热点（G11）。文献库表还不存在 | 2026-11-05 | 本计划 |
| PR 用 `Refs #163` | AC-66 ① 的错误页与诊断包导出不在本 PR | 2026-11-05 | 本计划 |

## 不做

- 不建 `lib_`、`doc_` 及其他业务前缀表，不做导入与文献提交。
- 不实现 `oi-asset://`、safeStorage、设置页、诊断导出、数据目录迁移流程。
- 不实现 AC-66 ②，不建 `packages/worker-client`。
- 不搬 M1 已经落盘的 `diagnostics/` 与 `debug/`。§8.2 的 `logs/` 只作为新目录出现。
- 不改 `DESIGN.md`、`docs/design-principles.md`、`docs/design/**`（N-10）。
- 不改 `.cursor/environment.json`、`.cursor/install.sh`（N-11）。
- 不改 CI、不改 dependency-cruiser、不加 npm 依赖。
- 不改 `packages/features/**` 与 worker。

## 证据链接

- `docs/evidence/165/commands.md`：实现 tip `caa5a5e` 上的命令与退出码。

## 自检

- [x] 影响 arch / prd 吗？影响 §16 的登记句，同一个 PR 里更新，并加 compare-spec-bytes amendment。不改 PRD 正文。
