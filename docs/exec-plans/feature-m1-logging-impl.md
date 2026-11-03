# 执行计划

跨 `packages/platform-node` 与 `apps/desktop` 装配根，所以有这份计划。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-logging-impl`。第一笔提交只有本文件。Forge 对 `a8a97de` 有条件通过，「现状理解」不改。和草案冲突时以「Forge 审查结论」为准。PR 保持 Draft，不离开 Draft，不合入，不 force push。

行数是开工前的预计，不是测量。整个 PR 对 `main` 的非生成 diff 会超过 600 行：落盘、值约束与装配根是同一次 AC-101 交付，拆开就不能一起证明 ②③⑤。实现提交说明和 `PR_BODY` 都写 `G12:` 理由，不拆职责，不调上限（N-08）。`pnpm-lock.yaml` 由 G12 记为生成文件。

## 现状理解

- 已有行为：`packages/contracts/src/diag-events.ts` 有六个事件 id 与 `readDiagEvent`。白名单只校验字段名并回拷，不扫描字段值。`packages/kernel/src/logger.ts` 有 `Logger`、`DebugModeChange` 与常量：默认关、7 天、50 MB（`52_428_800` 字节）、目录名 `diagnostics` 与 `debug`。`packages/kernel/src/clock.ts` 只有 `nowMs(): number`，没有 `systemClock`。没有 `packages/platform-node`。`apps/desktop/src/main/index.ts` 没有日志器，也没有 `composition-root.ts`。`desktop-e2e-windows` 已用 `actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9` 上传 `desktop-e2e-windows-screenshots`。
- 相关的节：PRD §6.1.13 AC-101、§8 M1 行（本里程碑没有导出页）、§9 诊断日志决定。ARCHITECTURE §2.5 `diagnostics` 行、§3 与 §4.1 的 `platform-node/src/logging/file-logger.ts`、§5.1、§6、§7.9.5、§11、§13 G5 与 G11。RULES §1、§2、§4、§5 第 8 条、N-05、N-08、N-10、N-11、N-12。Issue #76 必做。#75、#73 不做。
- 还没做的部分：JSON 行落盘、调试保留与清空、`deleteFiles` 的文件效果、落盘前的值约束与脱敏、装配根注入应用数据目录与 Clock。

依赖图上的事实：§5.1 画了 `platform-node → kernel`，没有画 `platform-node → contracts`。现有 G5 禁止 `platform-node → features`，也禁止 kernel / contracts 指向 platform-node；没有禁止 `platform-node → contracts`。`readDiagEvent` 在 `@oi/contracts`，要在落盘前调用它，就得有这条值导入。本 PR 不改 `packages/contracts`，不改 §5.1，不放宽 G5。见文末提问 1。

## Forge 审查结论

Forge 对 `a8a97de` 有条件通过。下面各项覆盖同题的草案。

- 提问 1：Wisdom 2026-11-03 10:40 批准 `platform-node` 值导入 `readDiagEvent`。`value-guard` 先调用它，失败则不写。§5.1 补线由下一个文档 PR 处理。本 PR 不改 ARCHITECTURE，不改 G5。
- 提问 2：按草案，并补下面三节「值约束」。`[redacted]` 是 `value-guard` 的单一导出常量，测试引用它。`sk-`、`Bearer`、`Authorization` 按包含匹配，不区分大小写。能通过字符集的假 Key 也要被脱敏挡住，样本是 `step: "sk-oitest_abc"` 与 `route: "oitest_fixturekey"`（后者靠合成前缀 `oitest_` 的包含匹配）。查询参数只按 `key=`、`access_token=`、`client_id=`、`client_secret=` 匹配。`error_class: "api-key-missing"` 原样保留。`ts` 为 `^[0-9TZ:.+-]+$`，长度 ≤ 64。单文件超过 50 MB 整文件删除，并测当天正在写的文件被删后，下次写入能重新创建。守卫识别不了无空格的正文；正文出现 0 次，靠调用方不传，再加上长度上限。
- 提问 3：接受。不新增 G5 规则。`dependencies` 的键恰好是 `@oi/kernel` 与 `@oi/contracts`，没有 `optionalDependencies` 与 `peerDependencies`。`commands.md` 写明 ③ 的证据是只有文件 sink、依赖允许清单、以及 `check:deps` 通过。
- 装配根导出构造函数，在 `app.whenReady()` 里调用。不用副作用导入。`composition-root.ts` ≤ 30 行。PR 描述按 G11 声明这个热点文件。
- `log` 的同步 IO 失败时抛出。取舍：吞掉错误会让这条诊断静默丢失，调用方看不到；抛出让失败停在调用点。不重试，也不把这次失败再写进日志。M1 没有业务切片调用 `log`。构造时会跑 debug 保留，可能删掉已有 debug 文件，不写产品日志。`startMainLogger()` 在 `createMainWindow()` 之后。这里抛出时，`whenReady().then` 没有 catch，成为 unhandled rejection。窗口已经打开，影响小。
- 单测按被测文件拆成 4 个：`log-paths.test.ts`、`value-guard.test.ts`、`debug-retention.test.ts`、`file-logger.test.ts`。ESLint `max-lines-per-function` 的文件范围是 `**/*.{ts,tsx}`，`check-file-size` 遍历全部 `.ts`（`/test/` 上限 800，普通源文件 600，`composition-root.ts` 在入口名单里上限 150）。这两处已经覆盖 `packages/platform-node/**`，不改规则。
- 证据目录包含 AC-101 ②③⑤ 与 #76 的测试输出摘录。截图链接 `desktop-e2e-windows-screenshots`，写上 run ID 与 tip SHA，并且是接入 logger 之后那个 tip 的运行结果。
- 四个查询参数的打码暂放在 `value-guard`。M4 建 `http/redact.ts` 时与这里对齐。
- M1 的调试开关只活在 logger 实例里。没有设置界面，应用代码也不调用 `setDebugMode`。用户在 M1 无法开启调试模式。
- Electron 读的是编译后的 JS。`@oi/kernel`、`@oi/contracts`、`@oi/platform-node` 的 `exports.types` 仍是 `./src/index.js`（tsc 对到旁边的 `.ts`），`exports.default` 是 `./dist/index.js`。`apps/desktop` 的 `build` 先编译 kernel，再 contracts，再 platform-node，然后编译 main 与 preload。`dist/` 不入库。Vitest 把这三个包名指到各自的 `src/index.ts`，单测不依赖 `dist`。三个包的源码行为不改。不改 ARCHITECTURE，不改 G5。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 批准并实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。草案含文件清单、预计行数、AC → 测试、#76 值约束。先停 | `a8a97de` 只提交本文件。Forge 结论在 `0d86b46`。Wisdom 批准在 `55b1f53` | 本文件 |
| 2 | 新包 `@oi/platform-node`（Apache-2.0，`type: module`，`exports` 指向 `./src/index.js`）。`dependencies` 的键恰好是 `@oi/kernel` 与 `@oi/contracts`（`workspace:*`），没有 optional / peer。`value-guard` 值导入 `readDiagEvent`。无其他运行时依赖，不加日志框架。登记：`pnpm-workspace.yaml`、`apps/desktop/package.json`、`tools/check-deps/tsconfig.paths.json`、`vitest.config.ts` 的 include 加 `packages/platform-node/**/*.test.ts`。不放进 `tsconfig.core.json`，不放进 ESLint `coreFiles` | `7855bb3` 建包，依赖键恰好那两个。`2f7c18e` 把 kernel、contracts、platform-node 的 `exports.types` 留在 `./src/index.js`，`default` 指到 `./dist/index.js`。Vitest include 改为 `packages/platform-node/test/**/*.test.ts`，不再扫进 `node_modules` 里的符号链接 | `docs/evidence/77/commands.md` |
| 3 | `src/logging/log-paths.ts`。用注入的应用数据目录拼接 kernel 的 `PRODUCT_LOG_DIRECTORY` 与 `DEBUG_LOG_DIRECTORY`。路径只来自参数 | `7855bb3` | 同上 |
| 4 | `src/logging/value-guard.ts`。先值导入并调用 `readDiagEvent`，失败则整条不写。通过后按「值约束」脱敏和长度。`[redacted]` 只导出这一处。有限数字原样。占位符不回扫字符集 | `7855bb3`。失败则不写。Wisdom 2026-11-03 12:23 补 GitHub 前缀、`AKIA`/`ASIA`+16、40 位 hex，以及长度 ≥ 20 且香农熵 ≥ 4.0 的兜底。UUID 与 `ts` 字符集豁免 | 同上 |
| 5 | `src/logging/debug-retention.ts`。只处理 debug 目录。先删 `mtimeMs < nowMs - DEBUG_LOG_MAX_AGE_MS` 的文件，再按 mtime 从旧到新删，直到 `stat.size` 之和 ≤ `DEBUG_LOG_MAX_BYTES`。单文件仍超过 50 MB 时整文件删除，不截断半行。产品目录不进这个函数 | `7855bb3`。超限整文件删除 | 同上 |
| 6 | `src/logging/file-logger.ts`。`createFileLogger` 返回 kernel `Logger`。`log` 为同步 `appendFileSync`，返回 `void`。产品目录在记录通过值守卫后始终追加。调试目录仅在 `setDebugMode({ enabled: true })` 之后追加同一条 JSON 行。默认关且从未开启时不创建 debug 目录。写入后把 mtime 设为 `clock.nowMs()`。保留在构造、再次开启、以及每次 debug 写入之后运行。`clearDebugLogs` 使 debug 文件数为 0。`setDebugMode({ enabled: false, deleteFiles })` 按布尔删除或保留。文件名 `<UTC YYYY-MM-DD>.jsonl`。构造时不写文件。同步 IO 失败则抛出（见审查结论）。调试开关只在该实例内。返回 `Logger<DiagEvent>` | `7855bb3`。IO 失败抛出 | 同上 |
| 7 | `src/index.ts` 只再导出 `createFileLogger` 与调用所需的选项类型 | `7855bb3`。不导出 `REDACTED` | 同上 |
| 8 | 四个单测文件，见审查结论。用例名 `<结果> when <条件>`，对得上的加 `AC-101`。注入 Clock 与临时目录，不 `sleep`。体积用 `truncate` 设定 `stat.size`。假密钥形态用 `oitest_`。不断言源码文本（F-08）。依赖断言读 `package.json`：键恰好两个，且没有 optional / peer | `7855bb3`。四个文件 30 通过。Anvil 的 9 类假 key 与误伤用例在 `value-guard-secrets.test.ts`，每个字符串字段都测 | 同上 |
| 9 | 新建 `apps/desktop/src/main/composition-root.ts`，物理行数 ≤30（G11 按新增行计算）。导出 `startMainLogger`，在 `app.whenReady()` 里调用。注入 `app.getPath("userData")` 与 `{ nowMs: () => Date.now() }`。Electron 与 `Date.now` 只出现在装配根。platform-node 不 import `electron` | `7855bb3` 新建 14 行，在 `createMainWindow()` 之后调用。`2f7c18e` 让 `build` 先编译三个包 | 同上 |
| 10 | `docs/evidence/77/commands.md`、AC-101 ②③⑤ 与 #76 的测试输出摘录、一条脱敏 JSON 行。命令在实现 tip 各跑一次。截图链到接入 logger 之后那个 tip 的 `desktop-e2e-windows-screenshots`，写明 run ID 与该 tip 的 SHA。不改 workflow，不加 xvfb，不改 `.cursor/install.sh` 与 `.cursor/environment.json` | include 收窄在 `4f8aaaa`。截图 tip 是 `1f860b0` 的 run `41576898895` 与 `41576892353` | `docs/evidence/77/commands.md` |

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

## 值约束

Forge 已让提问 2 按草案执行。不改契约类型。`[redacted]` 只从 `value-guard.ts` 导出一次，测试引用这个常量。

1. `readDiagEvent` 失败：两个目录都不写。Wisdom 2026-11-03 10:40 批准这里值导入它。
2. 字符串先脱敏，再看长度与字符集。命中任一条，整个值换成 `REDACTED`。占位符含括号，不再送去字符集检查。
3. 脱敏（整值替换，包含匹配）：`authorization`、`bearer`、`sk-` 不区分大小写；合成前缀 `oitest_` 不区分大小写（这样 `route: "oitest_fixturekey"` 能通过字符集，仍然被脱敏挡住）；`access_token=`、`client_id=`、`client_secret=`、`key=`；绝对路径（以 `/` 开头、以盘符加斜杠开头、或含 `\`）。
4. Wisdom 2026-11-03 12:23，Anvil 在 `3d1b709` 探测到三条原样落盘。补在字符集之前，仍是整值替换：
   - GitHub：不区分大小写，包含 `ghp_`、`gho_`、`ghu_`、`ghs_`、`ghr_`、`github_pat_`。`ghp_oitestfake` 能通过小写字符集，以前会落盘。
   - AWS：区分大小写，`AKIA` 或 `ASIA` 后面紧跟 16 位 `[A-Za-z0-9]`。`run_id` 与 `requestId` 允许大写，所以这条必须在字符集之前。后缀只有 15 位、又落在这两个字段的字符集里时，原样保留。
   - 十六进制：包含连续 40 位及以上 `[0-9a-fA-F]`。全是数字的 40 位也算，它能通过 `ts` 字符集。同一字符重复 40 次时熵是 0，仍然替换。
   - 高熵兜底：长度 ≥ 20，且每字符香农熵 ≥ 4.0 bit。阈值选 4.0 是为了接住 `qm7w2e9r4t6y8u1i3o5p0a`（长 22，约 4.46）。误伤边界：
     - 长度不到 20 不查熵。`api-key-missing` 长 15。`fixture-paper-body` 长 18、熵约 3.73。`qm7w2e9r4t6y8u1i3o5` 长 19、熵约 4.25，仍然保留。
     - 标准 UUID（`8-4-4-4-12` 的十六进制）整段豁免。均匀样本 `01234567-89ab-cdef-0123-456789abcdef` 熵约 4.06，这是该形式的上限。`550e8400-e29b-41d4-a716-446655440000`（约 3.39）与 `123e4567-e89b-12d3-a456-426614174000`（约 3.69）原样保留。
     - 符合 `ts` 字符集 `^[0-9TZ:.+-]+$` 的字符串豁免。该字符集理论上限是 4.0。`2026-11-02T00:00:00.000Z` 实测约 2.55。40 位纯数字仍由十六进制那条替换。
     - 长但低熵的枚举原样保留：`error-error-error-error`（长 23，约 1.75）、`pipeline-step-parse-done`（长 24，约 3.32）。
5. 字符集与长度，未命中脱敏时才用：
   - `event`、`level`、`feature`、`step`、`status`、`error_class`、`route`、`channel`，以及其余字符串：`^[a-z0-9_.:-]*$`，长度 ≤ 64。空串合法。
   - `run_id`、`requestId`：`^[A-Za-z0-9_.:-]+$`，长度 ≤ 128。
   - `ts`：`^[0-9TZ:.+-]+$`，长度 ≤ 64。`2026-11-02T00:00:00.000Z` 可以落盘。
6. 有限数字原样，含 `duration_ms` 与 `bytes`。守卫不新增键。
7. 开启调试后写入 debug 的仍是这一条已守卫的 JSON 行。本 PR 不发明第二套调试字段。

`step: "sk-oitest_abc"` 与 `route: "oitest_fixturekey"` 都符合第 5 条的字符集，用例要证明是脱敏把它们换成占位符。`error_class: "api-key-missing"` 不含 `key=`，原样保留。

守卫识别不了无空格、又短于长度上限、且落在字符集里的正文（例如单独的 `fixture-paper-body`）。正文出现 0 次，靠调用方不把正文放进字段，再加上长度上限挡住超长字符串。带空格或超过 64 的合成正文会变成占位符，落盘里这段样本出现 0 次。

若实现时 G9 命中这些夹具：停下，不放宽 `.gitleaks.toml`，不把样本改成真实密钥。报告按 WORKFLOW「密钥」交给 Wisdom，报告里不写密钥的值。

## AC → 测试映射

| AC | 用例要观察的结果 |
| --- | --- |
| AC-101 ② | 从未开启时 debug 文件数为 0，且不创建该目录。开启后 debug 出现 JSON 行。注入时钟拨到 8 天前写入、再拨回现在跑保留：早于 7 天的文件数为 0。`truncate` 造出总量 > 50 MB：保留后总量 ≤ 50 MB，且先删更旧的文件。单文件 `stat.size` > 50 MB 时该文件被删。当天文件被删掉之后，下一次 `log` 重新创建它。`clearDebugLogs` 后文件数为 0。`{ enabled: false, deleteFiles: true }` 后为 0；`deleteFiles: false` 且文件仍在 7 天与 50 MB 以内时文件还在。构造时也会跑保留，所以越过上限的旧文件在下次启动被清掉。调试行里被脱敏或超长的样本命中 0 次 |
| AC-101 ③④ | `dependencies` 的键排序后恰好是 `@oi/contracts`、`@oi/kernel`。没有 optional / peer。测试把 `globalThis.fetch` 设为抛错并计数，写日志时期望次数为 0。不新增 G5 规则。`check:deps` 通过写进 `commands.md`。`log` 的返回类型是 `void`；调用返回后文件已能读到该行 |
| AC-101 ⑤ | 产品文件在 `<注入目录>/diagnostics/`，调试文件在 `<注入目录>/debug/`。断言该路径不位于仓库的 `packages/features/diagnostics/` |
| AC-101 ① + #76 | 脱敏样本与超长正文落盘命中 0 次。`api-key-missing`、`parse`、空 `error_class` 原样保留。未通过 `readDiagEvent` 的值不产生新字节 |

## 装配根

`composition-root.ts` 导出 `startMainLogger`。`apps/desktop/src/main/index.ts` 在 `app.whenReady()` 的回调里调用它。模块求值时不调用 `getPath`，不创建目录，不写文件。应用数据目录来自 `app.getPath("userData")`，时钟是 `{ nowMs: () => Date.now() }`。

G11 只数 `composition-root.ts` 与 `slots.ts`。本 PR 不改 `slots.ts`。`composition-root.ts` 控制在 30 行以内。PR 描述声明热点文件 `composition-root.ts`。

## 不做

- 不改 `packages/contracts` 与 `packages/kernel` 的行为。#76 在落盘层做。
- 不画关闭调试前的询问（#75，M2，Loom）。只消费 `deleteFiles`。
- 不写 Python worker 的 stderr（#73，M3）。
- 不做诊断页、一键导出、产品日志的保留天数与体积（M2，AC-83）。`diagnostics/` 不滚动删除。
- 不接 LangSmith 或其他云端追踪，不默认上报，不把文档全文写入日志。
- 不打点解析、OCR、翻译。这些切片还不存在。
- 不建 `platform-node/src/http/redact.ts`、sqlite、secrets 或其他空目录。四个查询参数的打码暂放在 `value-guard.ts`。M4 建 `http/redact.ts` 时与这里对齐。
- 不建 `diagnostics/domain/redaction-rules.ts`（M2 导出）。
- 不改 DESIGN、`docs/design-principles.md`、`docs/design/**`、worker、CI 行为、分支保护、`.gitleaks.toml`。
- 不持久化调试开关，不新增运行时依赖。用户在 M1 无法开启调试模式。

## 给 Forge 的提问

三条都已答复。提问 1：Wisdom 2026-11-03 10:40 批准值导入 `readDiagEvent`。§5.1 的补线不在本 PR。

## 证据链接

- `docs/evidence/77/`：实现 tip 写入 `commands.md`、AC-101 ②③⑤ 与 #76 的测试输出摘录、一条脱敏 JSON 行，并链接接入 logger 之后那个 tip 的 `desktop-e2e-windows-screenshots`（run ID 与 tip SHA）。
