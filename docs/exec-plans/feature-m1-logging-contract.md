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
| 1 | 本文件。预计超过 300 行，先停 | Forge 对 `c098b10` 给了 PASS | 本文件 |
| 2 | 延期登记。worker stderr 的 Issue 已开，见文末 #73。批准后、写契约之前，只在 `docs/backlog.md` §4 为 #73 加一行。询问弹窗的 Issue 仍按文末第 2 条，批准后再开，并加一行。这两笔都不改已有行，也不写入 #69–#72 | #73 的 backlog 行是 `b8def18`。询问弹窗开了 #75，backlog 行是 `1705248`。没有改已有行 | `docs/backlog.md` |
| 3 | `packages/contracts/src/diag-events.ts`。六个事件 id 做成封闭常量，顺序与 §11 一致：`egress.ask`、`budget.refused`、`upstream.server_error`、`scoring.unavailable`、`pipeline.run`、`ipc.oversize`。不加第七个。每条记录都有 `ts`、`level`、`event`、`feature`。`pipeline.run` 的流水线字段只有 `run_id`、`route`、`step`、`status`、`error_class`、`duration_ms`。`upstream.server_error` 另有必填 `requestId`（§11 写的是 camelCase，不是 `request_id`）。`ipc.oversize` 另有 `channel` 与 `bytes`（规格只写了通道名与字节数）。`requestId` 在其他事件上可选，可以和 `run_id` 同时出现。不把 `source` 加进本 PR | `e1c3095` 的 `diag-events.ts` | `docs/evidence/74/commands.md` |
| 4 | 不新造枚举。`step`、`status`、`level` 都是 `string`。§11 没有给这三项的封闭取值；解析、OCR、翻译只作为测试夹具里的三种 `step`。成功时 `error_class` 为 `""`，字段仍在。失败时 `error_class` 为字符串，不含上游原文。`duration_ms` 为有限数且不小于 0。`bytes` 为不小于 0 的整数。`ts` 为非空字符串，不规定必须是 `Date.toISOString()` | 同上。测试夹具用 `parse`、`ocr`、`translate` 三种 `step`，类型仍是 `string` | 同上 |
| 5 | `readDiagEvent(unknown)` 返回 kernel 的 `Result`，失败为 `{ code: "diag_event_rejected" }`。未知 `event`、缺必填、类型不对，则拒绝。白名单以外的键丢弃，不因为多了键就把整条判失败，也不扫描字段值去找正文或密钥。不在 `route`、`run_id`、`requestId`、`channel`、`feature` 上加绝对路径正则。不用 `additionalProperties: false` 把额外键变成拒绝。函数拆开，每个不超过 80 行，圈复杂度不超过 15。从 `@oi/kernel` 只做 type-only import。`DiagLogger = Logger<DiagEvent>` | 同上。`readDiagEvent` 回拷白名单字段 | 同上 |
| 6 | `packages/kernel/src/logger.ts` 只有接口和常量，无实现，不 import `node:`，不 import contracts。`Logger<TRecord>` 有 `log`、`setDebugMode`、`clearDebugLogs`。`DEBUG_MODE_DEFAULT = false`。`DebugModeChange` 为 `{ enabled: true }` 或 `{ enabled: false; deleteFiles: boolean }`：询问界面在 M2，决定由调用方传入。`DEBUG_LOG_MAX_AGE_MS` 为 7 天，`DEBUG_LOG_MAX_BYTES` 为 50 MB。目录名常量 `diagnostics` 与 `debug`。不在这里删除文件 | 同上。`logger.ts` 没有文件实现 | 同上 |
| 7 | `packages/kernel/src/clock.ts` 只有 `Clock.nowMs(): number`。不导出 `systemClock`，不规定时间字符串的格式。不 import `node:`。不建 `id.ts`。`run_id` 的生成留到实现 PR | 同上。`clock.ts` 只有 `nowMs` | 同上 |
| 8 | 两个包的 `index.ts` 只再导出上述公开类型、常量与 `readDiagEvent`。不改 `result.ts` | 同上。两处 `index.ts` 再导出 | 同上 |
| 9 | 单测在 `packages/contracts/test/diag-events.test.ts` 与 `packages/kernel/test/`。用例名 `<结果> when <条件>`，对得上的加 AC-101。未知事件用 `// @ts-expect-error` 并写原因。不读源码文本做断言。不用真实 Key；需要假密钥形态时用 `oitest_` 前缀。不断言 `package.json` 里没有 langsmith：本 PR 不落盘，依赖清单不变 | 同上。单测 10 条，含一条 `@ts-expect-error` | 同上 |
| 10 | 改掉已经不成立的规格句子，不追加「后来改为」。ARCHITECTURE §11 开头删去「本仓库还没有 `packages/`」和「本规格不建这个文件」。§4.1 `diag-events.ts` 那一行删去「拟议路径」和「不建这个文件」。§16 加一句：`logger.ts` 与 `clock.ts` 已在 §4.1，Wisdom 2026-11-02 23:17 的指示代替这两个文件的 ADR，不另建 `docs/adr/` 页。`docs/spec-changelog.md` 记本 PR。`docs/backlog.md` §4 已有行不改，包括「诊断日志代码」那一行 | 同上。改了 §11 开头、§4.1 那一行和 §16 一行。changelog 记了本 PR | 同上 |
| 11 | 附带 commit A，只加行。在 `docs/backlog.md` §4 表末加下面四行，不改已有行。Issue 已存在，不开新的：#69 oi-app 按扩展名设置 Content-Type 并加 `nosniff`，M2；#70 打包后 renderer 路径 `dist/../../src/renderer` 失效，M8；#71 desktop e2e 覆盖权限 check handler 并拆开冒烟，M1 收尾；#72 `app-protocol.ts` 的 `readUrl` / `readMethod` 可内联，M1 下一个碰该文件的 PR。文案用交接 §7 附带项 A 的表 | `20944ca`。只加了这四行 | `docs/backlog.md` |
| 12 | 附带 commit B。`apps/desktop/playwright.config.ts` 用 Playwright 自带的 `screenshot: "on"`，不手写截图控件，不改 `e2e/smoke.spec.ts` 的断言（拆分属 #71）。`.github/workflows/ci.yml` 的 `desktop-e2e-windows` 在冒烟步骤之后加 `actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9`（v7.0.2，2026-10-07 的 tag；实现当天再对一下 tag 是否仍指向这个 SHA）。`if: always()`。artifact 名 `desktop-e2e-windows-screenshots`。路径 `apps/desktop/test-results/**/*.png`，没有文件则该步失败。不加 xvfb，不改 `.cursor/install.sh` 与 `.cursor/environment.json`，不改分支保护。`docs/ci-and-environment.md` 的该 job 一行补上上传截图。`docs/spec-changelog.md` 加一行 | `bae7c7b`。2026-11-02 核对 tag `v7.0.2` 仍指向 `cf430e030ddbb5b0abf93d22962f4752f3646cd9`。没有改 `smoke.spec.ts` | `docs/evidence/74/commands.md` |
| 13 | `docs/evidence/<PR号>/commands.md`。命令、SHA、通过 / 失败 / 跳过。写明本环境是 Linux，不跑 Electron，截图以 Windows job 的 artifact 为准，并链接该 artifact。合成的一条 `pipeline.run` JSON（成功，`error_class` 为 `""`）放在同一目录，不放正文、译文、提示词、密钥、绝对路径 | 写在 `docs/evidence/74/`。截图链接 pull request run `41474597703` 的 artifact | 同目录 |
| 14 | 门禁在实现提交的 tip 上各跑一次：`corepack pnpm test`、`corepack pnpm run check`（`GATE_BASE=origin/main`）。PATH 先放 Node 22.23.4。不新增运行时依赖。不改 DESIGN、`docs/design-principles.md`、`docs/design/**`。不改 worker。不改 G5 规则：contracts 对 kernel 保持 type-only | 在 `bae7c7b` 各跑一次。`check` 退出码 0。测试 114 通过、2 跳过、0 失败。非生成 diff 当时 610 行，提交说明里有 `G12:` | `docs/evidence/74/commands.md` |

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

- 不建 `packages/platform-node`，不写 `file-logger.ts`，不执行 7 天与 50 MB 的删除，不执行清空，不把 logger 接到 `apps/desktop`。天数、体积和目录名只做成常量。`deleteFiles` 只是 `setDebugMode` 的参数。AC-101 ②③⑤ 的文件行为在实现 PR 用 core 测试证明。
- 不画关闭调试前的询问。不改 DESIGN。
- 不打点解析、OCR、翻译。这些切片还不存在。
- 不做 URL 查询参数打码。那是 `platform-node/src/http/redact.ts`，在实现 PR 或更晚的 HTTP 客户端里。
- 不接 LangSmith 或其他云端追踪，不默认上报，不把文档全文写入日志，不加日志框架。
- 不写 Python worker 的 stderr。见延期。
- 不建 `utils.ts`、`helpers.ts`、`id.ts`、`app-error.ts`、`docs/adr/` 新页。
- 不顺手做 Issue #61。本 PR 会改 `packages/contracts`，#61 的条目留在那个 Issue 里。
- 不改 e2e 断言，不加 xvfb，不改 `.cursor/install.sh` 与 `.cursor/environment.json`，不改分支保护。

## 延期

2026-11-02 用 `gh issue list --state all --limit 100` 查过。当时没有「Python worker stderr JSON 日志」，也没有「关闭调试模式前询问是否删除」。下面几件不并进已有编号：

- #59 是 worker 在 uvicorn 接管前收到 SIGINT / SIGTERM 时退出码非 0，M3 与 supervisor 一起改。不是日志格式。
- #48 是红队样本（密钥进日志）。不是 worker 的 stderr 管道。
- #60 是 `BaseHTTPMiddleware`。与日志无关。

1. Python worker 把结构化 JSON 写到 stderr，supervisor 收集并加上 `source: worker`（ARCHITECTURE §11）。已开 [#73](https://github.com/wisdom-km/open-immerse-v2/issues/73)，里程碑 M3。backlog 行已加，不再开同题 Issue。现有读入会丢掉白名单外的键，所以落地时要把 `source: "worker"` 纳入允许字段。本 PR 不写 Python。
2. 关闭调试模式前询问是否删除调试日志。已开 [#75](https://github.com/wisdom-km/open-immerse-v2/issues/75)，里程碑 M2，交 Loom。M1 不画这个界面（Wisdom 2026-11-02 23:17）。backlog 行已加。

#69、#70、#71、#72 已经开着，只补 backlog 行。

## 证据链接

- `docs/evidence/74/commands.md`：命令、退出码、截图 artifact。合成样例在 `docs/evidence/74/pipeline-run.json`。
