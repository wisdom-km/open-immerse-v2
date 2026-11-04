# 执行计划

修 [Issue #69](https://github.com/wisdom-km/open-immerse-v2/issues/69)。分支 `feature/m2-oi-app-content-type-69`。基线 `origin/main` `71e3104`。第一笔提交只有本文件。交接要求提交计划后直接实现，不等另一次 Forge 审查。PR 保持 Draft，不离开 Draft，不合入，不 force push（N-01、N-03）。不改 `.github/`（N-02）。

本任务只改桌面外壳的 oi-app 静态响应与对应测试。不改功能切片，不改 worker。预计远低于 G12 的 600 行。RULES §2 写「小任务不用这份计划」以及「Forge 审查通过之前不写实现」。交接明确要求第一笔就是这份计划，并且写完就实现。用户指示优先于 RULES。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。任务类型不是 UI 改动、seam 变更、core 改动。涉及的是 `apps/desktop` 外壳，不是 `packages/features` 切片。

## 现状理解

- 已有行为：`apps/desktop/src/main/static-file.ts`（135 行）第 4 行把 `HTML` 写成 `text/html; charset=utf-8`，`resolveStaticFile` 第 27 行对每个放行文件都回这个类型。`relativePath` 第 79 行只接受以 `.html` 结尾的路径，比较区分大小写。路径校验仍是：`oi-app:`、主机名 `app`、无用户名密码端口、`decodeURIComponent`、拒绝 `\0`、去掉开头的斜杠后按 `/` 与 `\` 分段、拒绝空段 `.` `..`、`realpath` 必须留在根内。`protocol-response.ts`（34 行）的 `headers()` 只有 `Content-Type` 与 `Content-Security-Policy`。405 与 404 的类型是 `text/plain; charset=utf-8`。没有 `X-Content-Type-Options`。`app-protocol.ts`（17 行）只注册 `oi-app`（`standard` 与 `secure`）并调用 `respond`。`apps/desktop/src/renderer/` 只有空白 `index.html`。
- 相关的节：[docs/arch/09.md](../arch/09.md) §9 第 16、23、24 行；[docs/prd/06-01-07.md](../prd/06-01-07.md) AC-67 ①；[RULES.md](../../RULES.md) §1.1、§1.3、§1.4、§2、§5 第 1、2、4 条、§9、N-02、N-06、N-08、N-10、N-11；[DESIGN.md](../../DESIGN.md) D2 与 [docs/design-principles.md](../design-principles.md) §3（字体不打包）。CSP 常量在 `apps/desktop/src/main/security/csp.ts`，与 §9 草案逐字相同。AC-67 ② 的 `oi-asset://` 与 AC-67 ③ 的 Fuses 不在本 PR。
- 还没做的部分：扩展名到 Content-Type 的显式表；`X-Content-Type-Options: nosniff` 加在每一种 oi-app 响应上。放行范围仍只有 `.html`。

## 来源核对

| 来源 | 核对结果 |
| --- | --- |
| Issue #69 正文第 1 条 | 对得上。正文写 `static-file.ts:19` 把 Content-Type 固定为 `text/html`，M2 提供其他资源时要按扩展名设置。该行号是 PR #65 时的位置。现在常量在第 4 行，使用在第 27 行，行为与正文一致。处理：按本计划 MIME 表改这两处。放行范围不按「提供其他资源」扩大，见下一条评论。 |
| Issue #69 正文第 2 条 | 对得上。`headers()` 没有 `X-Content-Type-Options`。处理：200、HEAD、404、405 都加 `nosniff`。 |
| [评论 6625006385](https://github.com/wisdom-km/open-immerse-v2/issues/69#issuecomment-6625006385) | 对得上。Wisdom 2026-11-04 15:15（UTC+8）原话「只开69吧」。范围是只做 #69，只改 `apps/desktop/src/main/` 与对应测试，不改 CI。处理：允许改的文件见下节；不改 `.github/**`。 |
| [评论 6625123533](https://github.com/wisdom-km/open-immerse-v2/issues/69#issuecomment-6625123533) | 对得上。Wisdom 2026-11-04 15:21（UTC+8）原话「按推荐」。oi-app 仍只放行 `.html`；表只决定 Content-Type；未知扩展名默认 `application/octet-stream`；每种响应都加 nosniff；以后放行 js/css 另批。处理：`relativePath` 不接受表内其它扩展名。 |
| [docs/backlog.md](../backlog.md) 第 94 行 | 对得上。该行是「oi-app 协议按扩展名设置 Content-Type（`static-file.ts:19` 固定 text/html），并加 `X-Content-Type-Options: nosniff`」，时机写着「M2（开始服务非 HTML 资源时）」，链到 #69。处理：本 PR 不改这一行。 |
| [docs/approvals.md](../approvals.md) | 对得上。搜 `#69`、`Content-Type`、`nosniff`、`oi-app` 无命中。处理：批准只引用上面两条 issue 评论。本 PR 不改 `approvals.md`。 |
| [docs/arch/09.md](../arch/09.md) 第 16 行 | 对得上。nosniff 写在 `oi-asset://` 的笔记库图片规则里，不在 oi-app。处理：nosniff 加到 oi-app 的 `headers()`。不新建、不修改 oi-asset 处理器。 |
| [docs/arch/09.md](../arch/09.md) 第 23 行 | 对得上。应用页面经 `oi-app://` 加载，不用 `file://`。处理：不改 `app-protocol.ts` 的注册方式，不改窗口加载。 |
| [docs/arch/09.md](../arch/09.md) 第 24 行 | 对得上。CSP 由 main 加在 oi-app 响应上，常量在 `security/csp.ts`。`script-src`、`style-src`、`img-src`、`font-src`、`connect-src`、`worker-src` 都是 `'self'`。`wasm-unsafe-eval` 仍是待 M2 实测，放宽要 ADR。处理：不改 CSP 常量。表只保留下面「留下」的行。 |
| [docs/prd/06-01-07.md](../prd/06-01-07.md) 第 12 行（AC-67 ①） | 对得上。生效 CSP 与常量一致、页面经 oi-app 加载。处理：`e2e/csp.spec.ts` 已有的 CSP 断言保持原样并通过；另加 nosniff 与 `content-type`。不改这条验收正文。 |
| [RULES.md](../../RULES.md) | 对得上。搜 `Content-Type`、`nosniff`、`oi-app`、`#69` 无命中。处理：按 §1.1、§1.4 的测试命名、§5 第 4 条（无模块级可变状态）、§9 写证据。不改 RULES。 |
| `/workspace/oi-v2/pr65-review/REVIEW.md` 第 27 行 | 不符（本机读不到）。本机 `/workspace` 是本仓库检出，没有 `oi-v2/pr65-review/REVIEW.md`。Issue #69 正文第 1 条引用了这份 Forge 审查。处理：不把读不到的行当成新要求。实现以正文第 1 条和 15:21 的评论为准。 |
| `/workspace/oi-qa/v2-pr65-02e18e2/ANVIL.md` 第 44 行 | 不符（本机读不到）。没有该文件。正文第 2 条写明缺 nosniff，并称 §9 只对 oi-asset 要求 nosniff。这与 arch 09 第 16 行一致。处理：只给 oi-app 加 nosniff，不改 oi-asset。 |
| 其他 `/workspace/oi-v2/*review*/` 与 `/workspace/oi-qa/` | 不符（本机没有这些目录）。处理：没有可核对的额外命中，不构成新要求。 |
| `static-file.ts`、`protocol-response.ts`、`app-protocol.ts` | 对得上。见「现状理解」。处理：前两个按下面改；`app-protocol.ts` 不改。路径校验除 `.html` 后缀改为不区分大小写外，解码、`\0`、`..`、反斜杠、符号链接出根、主机名 `app` 不改。 |
| `protocol-response.test.ts`、`static-file.test.ts`、`e2e/csp.spec.ts` | 对得上。现有断言是 405、缺文件 404、符号链接 404、200 的类型与正文与 CSP，以及路径越界返回 null。处理：这些断言保留，只增加。 |
| [AGENTS.md](../../AGENTS.md) 第 38、48、56 行 | 对得上。第 38 行要求先把 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin` 放在 PATH 前面。第 48 行是全量 `pnpm test`。第 56 行是 `corepack pnpm exec vitest run <文件>`。处理：用第 56 行的写法跑点名的测试文件。不跑第 48 行的全量测试。 |
| `tools/check-file-size/check.mjs` 第 27 行 | 对得上。`source` 600、`test` 800，另有 `entry` 150、`component` 400。处理：新模块保持很小。不改这个脚本，不加 allowlist。 |
| `gh pr view 139 --json files` | 对得上。PR #139 仍 OPEN，文件是 `docs/evidence/60/commands.md`、`docs/exec-plans/feature-m3-worker-asgi-auth-60.md`、`workers/parser/oi_worker/api/auth.py`、`workers/parser/tests/api/test_auth_streaming.py`。处理：这四个都不碰。参考计划用已在 main 的 [feature-m3-worker-stop-signals-59.md](feature-m3-worker-stop-signals-59.md)，不用 #60 那份。 |

## MIME 表

`contentTypeFor` 只看扩展名，不读文件字节，不引入 `mime`。扩展名用 `path.extname` 再 `toLowerCase()`。未知扩展名与无扩展名返回 `application/octet-stream`。

留下的行（CSP 里今天已经允许、且 M2 渲染层经 oi-app 加载时会对上的类型）：

| 扩展名 | Content-Type | 为什么留下 |
| --- | --- | --- |
| `.html` | `text/html; charset=utf-8` | 现在唯一放行并加载的文档。与第 4 行常量相同，200 的类型不变。 |
| `.js`、`.mjs` | `text/javascript; charset=utf-8` | `script-src 'self'`。脚本与 ES module 用这两类。现在不放行。 |
| `.css` | `text/css; charset=utf-8` | `style-src 'self'`。样式表。现在不放行。 |
| `.svg` | `image/svg+xml` | `img-src 'self'`。应用页自己的图。笔记库图片仍不放行 SVG，那是 oi-asset，本 PR 不碰。现在不放行。 |
| `.png` | `image/png` | `img-src 'self'`。应用页位图。现在不放行。 |

删掉的行（交接里的候选，本计划判定用不上）：

| 扩展名 | 为什么删 |
| --- | --- |
| `.json`、`.map` | 渲染层没有规格要求经 oi-app 加载 JSON 或 source map。`connect-src 'self'` 允许连接，但不等于要给这两种扩展名单独的类型。未知类型走 `application/octet-stream`，配合 nosniff 不会被当成脚本。 |
| `.woff2` | `font-src 'self'` 在 CSP 里。DESIGN D2 与 design-principles §3 写明字体栈从 `system-ui` 起，不打包界面字体。没有字体会经 oi-app 加载。 |
| `.wasm` | §9 把 `wasm-unsafe-eval` 列为待实测，放宽要 ADR。当前 CSP 常量不含它。不在表里预留 `.wasm`。 |

不多加 `.jpg`、`.gif`、`.webp`、`.ico` 或其它扩展名。

## 实现

`apps/desktop/src/main/mime-types.ts`：一个冻结的显式常量表，加上 `contentTypeFor(filePath)`。不导出可变集合。没有模块级 `let`。

`static-file.ts`：删掉 `HTML`。放行成功时 `contentType` 改为 `contentTypeFor(filePath)`。`relativePath` 仍用 `endsWith`，只把后缀比较改为 `toLowerCase()`，所以 `INDEX.HTML` 可以放行。`.xhtml` 仍会通过，因为现在就是 `endsWith(".html")`，本 PR 不收紧。`.js`、`.css`、`.svg`、`.png`、`.mjs` 以及它们的大写形式仍返回 null。解码、`\0`、`..`、反斜杠、符号链接、主机名不改。

`protocol-response.ts`：`headers()` 增加 `"X-Content-Type-Options": "nosniff"`。CSP 仍用 `CONTENT_SECURITY_POLICY`。405 与 404 仍是 `text/plain; charset=utf-8`，同样带 nosniff。

`app-protocol.ts` 不改。

测试（英语，`<结果> when <条件>`，与现有文件同一种语言）：

- 新 `apps/desktop/test/mime-types.test.ts`：表里每一行都断言，含大写扩展名（如 `INDEX.HTML`、`APP.JS`）。`contentTypeFor("x.bin")` 与无扩展名都是 `application/octet-stream`。
- `static-file.test.ts`：原有越界用例保留。补上表内非 `.html`（至少 `.js` 与 `.css`，以及留下的 `.mjs`、`.svg`、`.png`）即使文件在根内也返回 null，`resolveStaticFile` 为 `missing`。`INDEX.HTML` 仍可解析，类型与表一致。
- `protocol-response.test.ts`：原有状态码、200 的类型、正文、CSP 保留。增加 nosniff：200 GET、200 HEAD、404 缺文件、404 越界路径、404 符号链接出根、405 POST。`oi-app://app/a.js` 与 `a.exe` 在文件存在时仍是 404 且带 nosniff。大写 `.HTML` 的 200：类型与表一致，正文与文件字节一致，CSP 不变。`.js` / `.css` 的类型只在 `contentTypeFor` 的单测里断言，不经 `respond` 放行。
- e2e：不新建文件。在 `e2e/csp.spec.ts` 加一条：reload 的文档响应 `x-content-type-options` 为 `nosniff`，`content-type` 为 `text/html; charset=utf-8`。已有三条 CSP 测试不改断言。

## 不改的文件

不改 `.github/**`、`.cursor/**`、`workers/**`、`docs/backlog.md`、`docs/approvals.md`、`docs/spec-changelog.md`、`AGENTS.md`、`RULES.md`、`PRD.md`、`docs/prd/**`、`ARCHITECTURE.md`、`docs/arch/**`、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`apps/desktop/src/main/security/**`、`apps/desktop/src/renderer/**`、`packages/**`、`tools/**`、`fixtures/**`、`package.json`、`pnpm-lock.yaml`、`apps/desktop/package.json`。不改 PR #139 的四个文件。

## 计划 / 实际

计划列在开工前填。实际列在实现之后回填。证据写在 `docs/evidence/69/commands.md`。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 只提交本文件 |  | 本文件 |
| 2 | 按上面实现 `mime-types.ts`、改 `static-file.ts` 与 `protocol-response.ts`、补单元测试与 `csp.spec.ts` 的一条断言。不改 `app-protocol.ts` |  |  |
| 3 | 只跑交接点名的定向命令。Node 用第 38 行的 PATH。不跑 `pnpm test`，不跑 `pnpm run check`，不跑全量 e2e |  | `docs/evidence/69/commands.md` |

## 决策记录（Decision Log）

只记会影响后续的决定。下面两行是已记录的批准，原话链到 issue 评论。`docs/approvals.md` 没有对应行；交接禁止本 PR 写入该文件，所以这里不链到它。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 只开工 #69：oi-app 按扩展名设 Content-Type 并加 nosniff；只改 `apps/desktop/src/main/` 与对应测试，不改 CI | Wisdom 原话「只开69吧」。见 [Issue #69 评论](https://github.com/wisdom-km/open-immerse-v2/issues/69#issuecomment-6625006385) | 2026-11-04 15:15 | Wisdom |
| 放行范围不变：仍只放行 `.html`；表只决定 Content-Type；未知扩展名默认 `application/octet-stream`；放行 js/css 等以后另批 | Wisdom 原话「按推荐」。见 [Issue #69 评论](https://github.com/wisdom-km/open-immerse-v2/issues/69#issuecomment-6625123533) | 2026-11-04 15:21 | Wisdom |
| 分支用 `feature/m2-oi-app-content-type-69`，计划提交后同一 PR 里写实现 | 交接点名。RULES §2 的功能分支前缀也是 `feature/`。不等另一次审查是交接写明的，批准已经在上面两行 | 2026-11-04 | 交接 |
| `.html` 后缀比较不区分大小写，其它扩展名仍拒绝 | 验收要求 `INDEX.HTML` 的 `respond` 为 200。15:21 的「只放行 .html」仍成立。`endsWith` 的其余行为不改 | 2026-11-04 | 本计划 |
| 表里不放 `.json`、`.map`、`.woff2`、`.wasm` | 见上面「删掉的行」。不新造批准 | 2026-11-04 | 本计划 |
| nosniff 与 `content-type` 的 e2e 加在 `e2e/csp.spec.ts`，不新建 `content-type.spec.ts` | 该文件已经 reload oi-app 文档。AC-67 ① 的原断言保持不动 | 2026-11-04 | 本计划 |
| 不改 `docs/approvals.md` 与 `docs/backlog.md` 的 #69 行 | 交接禁止。批准只在 issue 评论 | 2026-11-04 | 交接 |

## 证据链接

- `docs/evidence/69/commands.md`：实现后写入。本笔提交还没有这份证据。
