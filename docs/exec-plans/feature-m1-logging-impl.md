# 执行计划

跨 `packages/platform-node` 与 `apps/desktop` 装配根，所以有这份计划。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-logging-impl`。第一笔提交只有本文件。Forge 审查通过之前不写实现。PR 保持 Draft，不离开 Draft，不合入，不 force push。

行数是开工前的预计，不是测量。实现若让整个 PR 对 `main` 的非生成 diff 超过 600 行，在实现提交说明或 `PR_BODY` 加一行 `G12:`，不拆职责，不调上限（N-08）。`pnpm-lock.yaml` 由 G12 记为生成文件。

Forge 若改正「现状理解」，实现以改正后的那一节为准。未改正就通过，则按下面草案实现。

## 现状理解

- 已有行为：`packages/contracts/src/diag-events.ts` 有六个事件 id 与 `readDiagEvent`。白名单只校验字段名并回拷，不扫描字段值。`packages/kernel/src/logger.ts` 有 `Logger`、`DebugModeChange` 与常量：默认关、7 天、50 MB（`52_428_800` 字节）、目录名 `diagnostics` 与 `debug`。`packages/kernel/src/clock.ts` 只有 `nowMs(): number`，没有 `systemClock`。没有 `packages/platform-node`。`apps/desktop/src/main/index.ts` 没有日志器，也没有 `composition-root.ts`。`desktop-e2e-windows` 已用 `actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9` 上传 `desktop-e2e-windows-screenshots`。
- 相关的节：PRD §6.1.13 AC-101、§8 M1 行（本里程碑没有导出页）、§9 诊断日志决定。ARCHITECTURE §2.5 `diagnostics` 行、§3 与 §4.1 的 `platform-node/src/logging/file-logger.ts`、§5.1、§6、§7.9.5、§11、§13 G5 与 G11。RULES §1、§2、§4、§5 第 8 条、N-05、N-08、N-10、N-11、N-12。Issue #76 必做。#75、#73 不做。
- 还没做的部分：JSON 行落盘、调试保留与清空、`deleteFiles` 的文件效果、落盘前的值约束与脱敏、装配根注入应用数据目录与 Clock。

依赖图上的事实：§5.1 画了 `platform-node → kernel`，没有画 `platform-node → contracts`。现有 G5 禁止 `platform-node → features`，也禁止 kernel / contracts 指向 platform-node；没有禁止 `platform-node → contracts`。`readDiagEvent` 在 `@oi/contracts`，要在落盘前调用它，就得有这条值导入。本 PR 不改 `packages/contracts`，不改 §5.1，不放宽 G5。见文末提问 1。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 批准并实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。草案含文件清单、预计行数、AC → 测试、#76 值约束。先停 |  | 本文件 |
| 2 | 新包 `@oi/platform-node`（Apache-2.0，`type: module`，`exports` 指向 `./src/index.js`）。`dependencies` 只有 `@oi/kernel` 与 `@oi/contracts`（`workspace:*`）。无其他运行时依赖，不加日志框架。登记：`pnpm-workspace.yaml`、`apps/desktop/package.json`、`tools/check-deps/tsconfig.paths.json`、`vitest.config.ts` 的 include 加 `packages/platform-node/**/*.test.ts`。不放进 `tsconfig.core.json`，不放进 ESLint `coreFiles` |  |  |
| 3 | `src/logging/log-paths.ts`。用注入的应用数据目录拼接 kernel 的 `PRODUCT_LOG_DIRECTORY` 与 `DEBUG_LOG_DIRECTORY`。路径只来自参数 |  |  |
| 4 | `src/logging/value-guard.ts`。先 `readDiagEvent`；失败则整条不写。通过后按文末草案处理每个字符串值。`duration_ms` 与 `bytes` 原样。占位符不回扫字符集 |  |  |
| 5 | `src/logging/debug-retention.ts`。只处理 debug 目录。先删 `mtimeMs < nowMs - DEBUG_LOG_MAX_AGE_MS` 的文件，再按 mtime 从旧到新删，直到 `stat.size` 之和 ≤ `DEBUG_LOG_MAX_BYTES`。单文件仍超过 50 MB 时整文件删除，不截断半行。产品目录不进这个函数 |  |  |
| 6 | `src/logging/file-logger.ts`。`createFileLogger` 返回 `Logger<DiagEvent>`。`log` 为同步 `appendFileSync`，返回 `void`。产品目录在事件通过守卫后始终追加。调试目录仅在 `setDebugMode({ enabled: true })` 之后追加同一条已守卫的 JSON 行。默认关且从未开启时不创建 debug 目录。写入 debug 文件后把 mtime 设为 `clock.nowMs()`。保留在构造、再次开启、以及每次 debug 写入之后运行。`clearDebugLogs` 使 debug 文件数为 0。`setDebugMode({ enabled: false, deleteFiles })` 按布尔删除或保留。文件名 `<UTC YYYY-MM-DD>.jsonl`。构造时不写文件。同步 IO 失败则抛出。调试开关只在该实例内，不写设置文件 |  |  |
| 7 | `src/index.ts` 只再导出 `createFileLogger` 与调用所需的选项类型 |  |  |
| 8 | 单测在 `packages/platform-node/test/`。用例名 `<结果> when <条件>`，对得上的加 `AC-101`。注入 Clock 与临时目录，不 `sleep`。体积用 `truncate` 设定 `stat.size`。假密钥形态用 `oitest_`。不断言源码文本（F-08）。依赖清单用 `JSON.parse` 读本包 `package.json` 的 `dependencies` 键 |  |  |
| 9 | 新建 `apps/desktop/src/main/composition-root.ts`，物理行数 ≤30（G11 按新增行计算）。注入 `app.getPath("userData")` 与 `{ nowMs: () => Date.now() }`。`index.ts` 增加一行副作用导入。Electron 与 `Date.now` 只出现在装配根。platform-node 不 import `electron` |  |  |
| 10 | `docs/evidence/<PR号>/commands.md` 与一条脱敏 JSON 行。命令在实现 tip 各跑一次。截图链到该 PR 的 `desktop-e2e-windows` artifact `desktop-e2e-windows-screenshots`。不改 workflow，不加 xvfb，不改 `.cursor/install.sh` 与 `.cursor/environment.json` |  |  |

预计行数（开工前，含空行与注释）：

| 部分 | 行 |
| --- | --- |
| `log-paths.ts` | 40 |
| `value-guard.ts` | 180 |
| `debug-retention.ts` | 150 |
| `file-logger.ts` | 200 |
| `src/index.ts` | 25 |
| `package.json` 与登记（workspace、desktop 依赖、paths、vitest include） | 40 |
| `composition-root.ts` 与 `main/index.ts` 一行 | 25 |
| 单测 | 450 |
| `docs/evidence/<PR号>/` | 40 |
| 合计 | 约 1150 |

函数不超过 80 行，圈复杂度不超过 15，参数不超过 4 个。禁止顶层 `let`（F-06）。不建 `utils.ts`、`helpers.ts`。

## #76 值约束规则草案

规格没有写死正则与长度。Issue #76 的示例字符集是 `^[a-z0-9_.:-]+$`，并写「以规格为准」。下面是落盘层草案，不改契约类型。

1. `readDiagEvent` 失败：两个目录都不写。
2. 成功后只处理回拷对象上的字符串。先做脱敏，再做长度与字符集。命中任一条，整个值换成固定占位 `[redacted]`。占位符本身含括号，不再送去字符集检查。
3. 脱敏（整值替换）：`Authorization`（大小写不敏感）；`Bearer` 后接令牌；字面量前缀 `sk-`；查询参数名 `access_token`、`key`、`client_id`、`client_secret`；绝对路径（以 `/` 开头、以盘符加 `:` 与斜杠开头、或含 `\`）。
4. 字符集与长度，未命中脱敏时才用：
   - `event`、`level`、`feature`、`step`、`status`、`error_class`、`route`、`channel`：`^[a-z0-9_.:-]*$`，长度 ≤ 64。空串合法（成功时 `error_class` 为 `""`）。
   - `run_id`、`requestId`：`^[A-Za-z0-9_.:-]+$`，长度 ≤ 128。
   - `ts`：长度 ≤ 64；含空白、`/`、`\` 或上面的脱敏形态则替换。不要求 ISO-8601。契约里的 `2026-11-02T00:00:00.000Z` 因此仍可落盘。
5. 数字字段不改。守卫不新增键，不删除契约要求的键。
6. 开启调试后写入 debug 的仍是这一条已守卫的白名单 JSON 行。本 PR 不发明第二套调试字段。

合成样本沿用契约测试已有的 `fixture-paper-body`、`fixture-translation`、`fixture-prompt`、`oitest_fixturekey`、`/tmp/fixture/paper.pdf`、`Bearer oitest_header`、`oitest_querytoken`，并加上带 `oitest_` 的 `sk-` 形态与带上述四个查询参数的 URL。分别填进 `error_class`、`route`、`step` 以及其他字符串字段。落盘文本对每个样本的命中次数为 0。

若实现时 G9 命中这些夹具：停下，不放宽 `.gitleaks.toml`，不把样本改成真实密钥。报告按 WORKFLOW「密钥」交给 Wisdom，报告里不写密钥的值。

## AC → 测试映射

| AC | 用例要观察的结果 |
| --- | --- |
| AC-101 ② | 从未开启时 debug 文件数为 0，且不创建该目录。开启后 debug 出现 JSON 行。注入时钟拨到 8 天前写入、再拨回现在跑保留：早于 7 天的文件数为 0。`truncate` 造出总量 > 50 MB：保留后总量 ≤ 50 MB，且先删更旧的文件。单文件 `stat.size` > 50 MB 时该文件被删。`clearDebugLogs` 后文件数为 0。`{ enabled: false, deleteFiles: true }` 后为 0；`deleteFiles: false` 且文件仍在 7 天与 50 MB 以内时文件还在。构造时也会跑保留，所以越过上限的旧文件在下次启动被清掉。调试行里禁止样本命中 0 次 |
| AC-101 ③④ | 本包 `dependencies` 的键没有 langsmith、OpenTelemetry exporter、以及其他日志上报包。测试把 `globalThis.fetch` 设为抛错，日志用例不打桩、不发请求。现有 `check:deps` 照常跑，本 PR 不新增、不放宽 dependency-cruiser 规则。`log` 的返回类型是 `void`；调用返回后文件已能读到该行 |
| AC-101 ⑤ | 产品文件在 `<注入目录>/diagnostics/`，调试文件在 `<注入目录>/debug/`。断言该路径不位于仓库的 `packages/features/diagnostics/` |
| AC-101 ① + #76 | 上节样本填进各字符串字段后，落盘命中 0 次。未通过 `readDiagEvent` 的值不产生新字节。合法短值（如 `step: "parse"`、成功时的空 `error_class`）原样保留 |

## 装配根

`composition-root.ts` 只做构造：应用数据目录来自 `app.getPath("userData")`，时钟是 `{ nowMs: () => Date.now() }`。`getPath("userData")` 在 `ready` 之前可用。模块求值时不创建目录、不写文件，避免冒烟在开窗前写盘。

G11 只数 `composition-root.ts` 与 `slots.ts`。本 PR 不改 `slots.ts`。`composition-root.ts` 控制在 30 行以内。`index.ts` 的一行导入不计入 G11。

## 不做

- 不改 `packages/contracts` 与 `packages/kernel` 的行为。#76 在落盘层做。
- 不画关闭调试前的询问（#75，M2，Loom）。只消费 `deleteFiles`。
- 不写 Python worker 的 stderr（#73，M3）。
- 不做诊断页、一键导出、产品日志的保留天数与体积（M2，AC-83）。`diagnostics/` 不滚动删除。
- 不接 LangSmith 或其他云端追踪，不默认上报，不把文档全文写入日志。
- 不打点解析、OCR、翻译。这些切片还不存在。
- 不建 `platform-node/src/http/redact.ts`、sqlite、secrets 或其他空目录。四个查询参数的打码做在 `value-guard.ts`，覆盖 §7.9.5 点名的那四个名字。
- 不建 `diagnostics/domain/redaction-rules.ts`（M2 导出）。
- 不改 DESIGN、`docs/design-principles.md`、`docs/design/**`、worker、CI 行为、分支保护、`.gitleaks.toml`。
- 不持久化调试开关，不新增运行时依赖。

## 给 Forge 的提问

实现前需要本节有答复。通过且不改「现状理解」即表示接受草案。

1. 触发：规格图与落盘需要的导入不一致。停在：ARCHITECTURE.md §5.1 的依赖图；`readDiagEvent` 位于 `packages/contracts`。已读：§5.1、§11、G5 `layer-direction` 与 `contracts-is-leaf`。现状：图上没有 `platform-node → contracts`，现有门禁允许这条边。提问：是否接受本 PR 用值导入调用 `readDiagEvent`，且不改 §5.1、不改 G5？
2. 触发：长度、字符集、占位符、超过 50 MB 的单文件如何删除，规格没有写死。停在：本文件「#76 值约束规则草案」与保留步骤。已读：AC-101、§11、§7.9.5、Issue #76。现状：草案写在上面。提问：这四项是否按草案执行？
3. 触发：交接要求用 dependency-cruiser 证明没有云端 exporter。停在：`tools/check-deps/build-rules.mjs`。已读：RULES §1、N-08、WORKFLOW「门禁规则要改」。现状：现有规则已经禁止 platform-node 指向 features 与 electron；云端包不会被导入。提问：是否接受只断言 `package.json` 的依赖键，并靠现有 `check:deps`，而不新增 G5 规则？

## 证据链接

- 本提交没有 `docs/evidence/<PR号>/`。实现 tip 再写入 `commands.md` 与一条脱敏 JSON 行，并链接 Windows job 的 `desktop-e2e-windows-screenshots`。
