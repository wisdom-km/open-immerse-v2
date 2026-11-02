# 执行计划

超过 300 行，所以有这份计划。路径按 [TEMPLATE.md](TEMPLATE.md) 用分支名 `feature/m1-logging-contract`。第一笔提交只有本文件。Forge 审查通过之前不写实现。PR 保持 Draft，不离开 Draft，不合入，不 force push。

行数是开工前的预计，不是测量。契约、单测、两笔附带提交、规格里已经过时的句子、延期的 backlog 行和证据加在一起，紧凑写也超过 300 行。交接里「契约单独约 150–250 行、可以不写计划」没有算上 Wisdom 2026-11-02 23:17 放进同一 PR 的附带项和延期登记。

## 现状理解

- 已有行为：`packages/contracts` 与 `packages/kernel` 已在。`packages/kernel/src/index.ts` 只再导出 `Result`。没有 `diag-events.ts`、`logger.ts`、`clock.ts`。没有 `packages/platform-node`。诊断事件还不能被类型或运行时拒绝。`desktop-e2e-windows` 跑 Playwright Electron 冒烟，不上传截图。`apps/desktop/playwright.config.ts` 没有 `screenshot`。
- 相关的节：PRD S10、US-14、AC-101（§6.1.13）、§8 M1 行、§9 诊断日志决定。AC-09 是 M2，本计划只保证不违反。ARCHITECTURE §2.5 `diagnostics` 行、§4.1 文件表（`diag-events.ts`、`logger.ts`、`clock.ts`、`file-logger.ts`）、§4.3（`diagnostics` 不被业务切片 import）、§11、§7.9.5 的 URL 打码留给 `platform-node`。RULES §2 契约单独成 PR、§4 调试模式与证据、§5 第 8 条、N-10、N-11。
- 还没做的部分：六个事件的白名单、`pipeline.run` 的六个字段、`Logger` 与 `Clock`、对应单测。落盘、保留、清空、装配根注入都属于下一个实现 PR。

已定决定（Wisdom 2026-11-02 23:17，覆盖交接末尾「待 Wisdom 决定」）：

- 拆成两个 PR。本 PR 只做契约：`packages/contracts/src/diag-events.ts` 与 `packages/kernel` 的 `Logger`、必要的 `Clock`，以及对应单测。分支名 `feature/m1-logging-contract`。实现 PR 等本 PR 合入后另开，本计划不写它。
- `packages/platform-node` 在实现 PR 新建，只放 logging。本 PR 不建这个包，不建空目录。
- 「关闭调试模式前询问是否删除」本里程碑不做界面。M2 交 Loom。
- 两件附带事项放进本 PR，各自单独一个 commit：backlog §4 加 #69 #70 #71 #72；`desktop-e2e-windows` 截图并用 `actions/upload-artifact` 上传。不加 xvfb，不改 `.cursor/install.sh`。
- Python worker 的 stderr JSON 日志另开 Issue，里程碑 M3，与 supervisor 一起做。先查重，再在 backlog 加行。

## 计划 / 实际

计划列在开工前填。实际列在 Forge 批准并实现之后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。预计超过 300 行，先停 |  |  |
| 2 | 延期登记。查重已完成，见文末。批准后、写契约之前，为文末两条各开一条 Issue，并在 `docs/backlog.md` §4 各加一行。这一笔不改已有行，也不写入 #69–#72 |  |  |
| 3 | `packages/contracts/src/diag-events.ts`。六个事件 id 做成封闭常量，顺序与 §11 一致：`egress.ask`、`budget.refused`、`upstream.server_error`、`scoring.unavailable`、`pipeline.run`、`ipc.oversize`。不加第七个。每条记录都有 `ts`、`level`、`event`、`feature`。`pipeline.run` 另有且仅有 `run_id`、`route`、`step`、`status`、`error_class`、`duration_ms`。`upstream.server_error` 另有且仅有 `request_id`。`ipc.oversize` 另有且仅有 `channel`、`bytes`。其余三个事件没有额外字段 |  |  |
| 4 | 封闭的取值：`step` 为 `parse`、`ocr`、`translate`（AC-101 点名的三次 run）。`status` 为 `ok`、`failed`（§11 没有枚举，这里收成这两个）。成功时 `error_class` 为 `""`，字段仍在。失败时 `error_class` 为非空字符串，不含上游原文。`level` 为 `debug`、`info`、`warn`、`error`，与 kernel 的 `LogLevel` 用 `import type` 锁成同一个类型。`duration_ms` 与 `bytes` 为有限数且不小于 0。`ts` 为 `Date.toISOString()` 的形态（UTC，毫秒，以 `Z` 结尾） |  |  |
| 5 | `readDiagRecord(unknown)` 返回 `DiagRecord` 或 `undefined`。未知 `event`、白名单外的字段、空的必填字符串、含 CR/LF 的字符串，都得到 `undefined`。不扫正文去找密钥（字段白名单优先）。绝对路径不是字段；`route`、`run_id`、`request_id`、`channel`、`feature` 拒绝以 `/` 开头或匹配盘符路径的值。用 TypeBox，`additionalProperties: false`。函数拆开，每个不超过 80 行，圈复杂度不超过 15。从 `@oi/kernel` 只做 type-only import |  |  |
| 6 | `packages/kernel/src/logger.ts` 只有接口和默认值：`LogLevel`、`LogRecord`（`ts`、`level`、`event`、`feature`）、`Logger.write`、`DEBUG_MODE_DEFAULT = false`。没有文件实现，不 import `node:`。不放 `disableDebug` 或 `deleteFiles`：询问界面在 M2，删除文件在实现 PR 的 file-logger |  |  |
| 7 | `packages/kernel/src/clock.ts`：`Clock.nowMs()`、`systemClock()`（`Date.now`）、`formatLogTimestamp`（有限毫秒 → 上一条的 UTC 字符串）。不 import `node:`。不建 `id.ts`。`run_id` 的生成留到实现 PR |  |  |
| 8 | 两个包的 `index.ts` 只再导出上述公开类型、常量与 `readDiagRecord`。不改 `result.ts` |  |  |
| 9 | 单测在 `packages/contracts/test/diag-events.test.ts` 与 `packages/kernel/test/`。用例名 `<结果> when <条件>`，对得上的加 AC-101。未知事件用 `// @ts-expect-error` 并写原因。不读源码文本做断言。不用真实 Key；需要假密钥形态时用 `oitest_` 前缀。不断言 `package.json` 里没有 langsmith：本 PR 不落盘，依赖清单不变 |  |  |
| 10 | 改掉已经不成立的规格句子，不追加「后来改为」。ARCHITECTURE §11 开头删去「本仓库还没有 `packages/`」和「本规格不建这个文件」。§4.1 `diag-events.ts` 那一行删去「拟议路径」和「不建这个文件」。§16 加一句：`logger.ts` 与 `clock.ts` 已在 §4.1，Wisdom 2026-11-02 23:17 的指示代替这两个文件的 ADR，不另建 `docs/adr/` 页。`docs/spec-changelog.md` 记本 PR。`docs/backlog.md` 里「诊断日志代码」那一行改成：白名单与 `Logger` 在本 PR，打点与 file-logger 在实现 PR。这一行的修改不放进 #69 那个 commit |  |  |
| 11 | 附带 commit A，只加行。在 `docs/backlog.md` §4 表末加下面四行，不改已有行。Issue 已存在，不开新的：#69 oi-app 按扩展名设置 Content-Type 并加 `nosniff`，M2；#70 打包后 renderer 路径 `dist/../../src/renderer` 失效，M8；#71 desktop e2e 覆盖权限 check handler 并拆开冒烟，M1 收尾；#72 `app-protocol.ts` 的 `readUrl` / `readMethod` 可内联，M1 下一个碰该文件的 PR。文案用交接 §7 附带项 A 的表 |  |  |
| 12 | 附带 commit B。`apps/desktop/playwright.config.ts` 用 Playwright 自带的 `screenshot: "on"`，不手写截图控件，不改 `e2e/smoke.spec.ts` 的断言（拆分属 #71）。`.github/workflows/ci.yml` 的 `desktop-e2e-windows` 在冒烟步骤之后加 `actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9`（v7.0.2，2026-10-07 的 tag；实现当天再对一下 tag 是否仍指向这个 SHA）。`if: always()`。artifact 名 `desktop-e2e-windows-screenshots`。路径 `apps/desktop/test-results/**/*.png`，没有文件则该步失败。不加 xvfb，不改 `.cursor/install.sh` 与 `.cursor/environment.json`，不改分支保护。`docs/ci-and-environment.md` 的该 job 一行补上上传截图。`docs/spec-changelog.md` 加一行 |  |  |
| 13 | `docs/evidence/<PR号>/commands.md`。命令、SHA、通过 / 失败 / 跳过。写明本环境是 Linux，不跑 Electron，截图以 Windows job 的 artifact 为准，并链接该 artifact。合成的一条 `pipeline.run` JSON（成功，`error_class` 为 `""`）放在同一目录，不放正文、译文、提示词、密钥、绝对路径 |  |  |
| 14 | 门禁在实现提交的 tip 上各跑一次：`corepack pnpm test`、`corepack pnpm run check`（`GATE_BASE=origin/main`）。PATH 先放 Node 22.23.4。不新增运行时依赖。不改 DESIGN、`docs/design-principles.md`、`docs/design/**`。不改 worker。不改 G5 规则：contracts 对 kernel 保持 type-only |  |  |

预计行数（开工前，含空行与测试）：

| 部分 | 行 |
| --- | --- |
| `diag-events.ts` | 150 |
| 契约单测 | 140 |
| `logger.ts`、`clock.ts` 与 kernel 单测 | 90 |
| 两处 `index.ts` | 15 |
| ARCHITECTURE、changelog、backlog 已有行 | 25 |
| 延期 Issue 的 backlog 行 | 4 |
| #69–#72 四行 | 4 |
| CI、Playwright、`docs/ci-and-environment.md` | 25 |
| `docs/evidence/<PR号>/` | 30 |
| 合计 | 约 480 |

G12 按整个 PR 对 `main` 的非生成 diff。本 PR 同时改 kernel、文档和 CI，阈值是 600，不是「只改 `packages/contracts`」的 200。预计低于 600。若实现时超过 600，提交说明或 `PR_BODY` 加一行 `G12:`，不拆白名单文件。

## 不做

- 不建 `packages/platform-node`，不写 `file-logger.ts`，不写 7 天与 50 MB 的删除，不写清空，不把 logger 接到 `apps/desktop`。AC-101 ②③⑤ 的文件行为在实现 PR 用 core 测试证明。本 PR 只锁住默认关（`DEBUG_MODE_DEFAULT`）和事件形状。
- 不画关闭调试前的询问。不改 DESIGN。
- 不打点解析、OCR、翻译。这些切片还不存在。
- 不做 URL 查询参数打码。那是 `platform-node/src/http/redact.ts`，在实现 PR 或更晚的 HTTP 客户端里。
- 不接 LangSmith 或其他云端追踪，不默认上报，不把文档全文写入日志，不加日志框架。
- 不写 Python worker 的 stderr。见延期。
- 不建 `utils.ts`、`helpers.ts`、`id.ts`、`app-error.ts`、`docs/adr/` 新页。
- 不顺手做 Issue #61。本 PR 会改 `packages/contracts`，#61 的条目留在那个 Issue 里。
- 不改 e2e 断言，不加 xvfb，不改 `.cursor/install.sh` 与 `.cursor/environment.json`，不改分支保护。

## 延期

2026-11-02 用 `gh issue list --state all --limit 100` 查过。没有「Python worker stderr JSON 日志」，也没有「关闭调试模式前询问是否删除」。下面两件不并进已有编号：

- #59 是 worker 在 uvicorn 接管前收到 SIGINT / SIGTERM 时退出码非 0，M3 与 supervisor 一起改。不是日志格式。
- #48 是红队样本（密钥进日志）。不是 worker 的 stderr 管道。
- #60 是 `BaseHTTPMiddleware`。与日志无关。

批准后按 [WORKFLOW.md](../WORKFLOW.md)「延期」开 Issue，并在 `docs/backlog.md` §4 加行。拟用的标题：

1. Python worker 把结构化 JSON 写到 stderr，supervisor 收集并加上 `source: worker`（ARCHITECTURE §11）。里程碑 M3，与 supervisor 一起。字段服从同一份白名单和禁止项。本 PR 不写 Python。
2. 关闭调试模式前询问是否删除调试日志。里程碑 M2，交 Loom。M1 不画这个界面（Wisdom 2026-11-02 23:17）。

#69、#70、#71、#72 已经开着，只补 backlog 行。

## 证据链接

- `docs/evidence/<PR号>/`：实现提交之后再写。本文件这一笔没有证据目录，也没有截图 artifact。
