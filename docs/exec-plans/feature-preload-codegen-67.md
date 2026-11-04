# 执行计划

由契约生成 preload，不手写 IPC。本文件只定方案，不写实现。基线 `origin/main@6988420cc9fb68f461d151c069ac4b5965570caf`（PR #146 已合入，`gh pr view 146` 的 `state` 为 `MERGED`）。分支 `feature/preload-codegen-design-67`。路径按 [TEMPLATE.md](TEMPLATE.md)。第一笔提交只有本文件的骨架。Forge 审查通过、Wisdom 批准形状之前不写实现，也不开契约 PR。

关联：[Issue #67](https://github.com/wisdom-km/open-immerse-v2/issues/67)。PRD 没有单独的 AC 编号。相关验收是 AC-53、AC-67、AC-79、AC-80、AC-100。

## 现状理解

- 已有行为：`apps/desktop/src/preload/index.ts` 只有 `contextBridge.exposeInMainWorld("oi", {})`。`apps/desktop/src/main/security/window-preferences.ts` 固定 `contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`，不写 `webSecurity`、不写 `webviewTag`。e2e 用 `JSON.stringify(window.oi)` 断言 `"{}"`。`packages/contracts/src/ipc/` 只有 `settings.ts`：四条外发命令的 `Promise<Result<...>>` 与五条通道字面量，没有请求 schema、没有幂等字段。`tools/codegen/manifest.json` 的 `generators` 是空数组；`run.mjs` 只在 worker schema 存在时生成 `workers/parser/oi_worker/protocol/`。`apps/desktop/src/main/` 没有 `ipc-router.ts`。
- 相关的节：[docs/arch/09.md](../arch/09.md)、[docs/arch/09-01.md](../arch/09-01.md)、[docs/arch/02-04.md](../arch/02-04.md)、[docs/arch/02-02.md](../arch/02-02.md)、[docs/arch/01.md](../arch/01.md)、[docs/arch/11.md](../arch/11.md)、[docs/arch/04-05.md](../arch/04-05.md)、[docs/arch/13.md](../arch/13.md)。[RULES.md](../../RULES.md) §2 契约先行、§3 第 3 条、N-09、N-18、§8.4 的 `<切片>.<操作>`。[DESIGN.md](../../DESIGN.md) §4.9 与 [docs/design-principles.md](../design-principles.md) 的 P7：界面只显示 seam 给出的数据。
- 还没做的部分：没有 IPC 描述格式，没有 preload 生成，没有 main 端路由。本 PR 不补这些代码。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 骨架。第一笔只有本文件 | `52a53ef` | 本文件 |
| 2 | 写满 §3.1–§3.6 与来源核对 | 本提交 | 本文件 |
| 3 | `node tools/check-docs/check.mjs` 与 `node tools/compare-spec-bytes/compare.mjs` | 见证据目录 | 证据目录 |
| 4 | 不写实现。Loom 审、Wisdom 批之后才开契约 PR | 未写实现 | — |

## 决策记录（Decision Log）

[docs/approvals.md](../approvals.md) 没有 #67 的行。按 [docs/exec-plans/README.md](README.md)，没记在那里的不算仓库内已批准。本任务禁止改 `docs/approvals.md`，所以下面只引用 issue 上的原话，不把缺行补成批准。

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先出方案文档，不写代码，不碰当时仍开放的 #146 | 原话「67那个按推荐。」见 [评论](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628434530) | 2026-11-04 | Wisdom |
| 顺序是方案 → 契约 PR → 生成器与 `ipc-router` 同一个 PR | 原话「这67的也都按照你的建议去做吧。」见 [评论](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628452608)。形状仍等这份方案经 Loom 审、Wisdom 批 | 2026-11-04 | Wisdom |
| 契约 PR 只改 `packages/contracts/src/ipc/**` 与其测试，先合 | [Forge 18:05](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628045811)。Forge 排序，非业主决定；上一行的原话把这个顺序一并说了 | 2026-11-04 | Forge 排序；Wisdom 18:29 复述了顺序 |

形状命名、退订写法、幂等落点、传输错误是否并进联合、CI 硬编码列表，都还在 §3.6，不是已定事项。

## 3.1 生成的 `window.oi` 形状

推荐形状（待 §3.6 的 Q1–Q4、Q6 拍板）：

```ts
window.oi.settings.answerEgressConsent(input): Promise<
  Result<
    { vendorId: string },
    { code: "unknown_request" } | TransportError
  >
>;

window.oi.settings.onEgressConsentRequired(
  cb: (payload: EgressConsentRequired) => void,
): () => void;
```

命令名是 `window.oi.<切片>.<操作>(请求)`。通道字符串仍是 `<切片>.<操作>`，例如 `settings.answerEgressConsent`。这与 [docs/arch/09.md](../arch/09.md) 的 `<feature>.<command>`、[docs/arch/02-02.md](../arch/02-02.md) 的「一条命令一个方法」、[RULES.md](../../RULES.md) §8.4 的 `<切片>.<操作>` 是同一套名字。renderer 拿不到通道字符串，也没有 `invoke(channel, payload)`。

事件名是 `window.oi.<切片>.on<Event>(回调)`，返回退订函数。通道字符串是 `<切片>.on<Event>`，例如 `settings.onEgressConsentRequired`。回调参数是该事件的载荷，不是 `Result`。事件不是一次请求。对比过的另外两种写法在 Q2。

返回值一律是 `Promise<Result<响应, 错误>>`。[packages/kernel/src/result.ts](../../packages/kernel/src/result.ts) 的 `Result` 是 `{ ok: true, value }` 或 `{ ok: false, error }`。业务错误是带 `code` 的普通对象，与今天 `settings.ts` 里的 `AnswerEgressConsentError` 相同。preload 与 router 都不把业务失败变成抛出。router 若捕获到处理器抛出的异常，也收成 `Result`，因为 [docs/arch/02-02.md](../arch/02-02.md) 写明 `handle` 抛出的错误到 renderer 只剩 `message`。

ARCH §9 的四项到类型的映射：

| 定义里的项 | 描述符字段 | 生成结果 |
| --- | --- | --- |
| 请求 schema | `request`（TypeBox，仓库已有 `@sinclair/typebox` 0.34.52） | 方法参数 |
| 响应 schema | `response` | `Result` 的 `value` |
| 错误码集合 | `errors` | `Result` 的 `error.code` 联合；字段只有 schema 里写了的普通数据 |
| 是否幂等 | `idempotent: boolean` | 注册表上的只读标记，并写进该方法的生成注释 |

幂等不触发自动重试。[RULES.md](../../RULES.md) §1.1 禁止无上限重试。重复调用的后果仍由用例决定：`answerEgressConsent` 对同一 `requestId` 第二次返回 `unknown_request`，这是 [docs/arch/07-00.md](../arch/07-00.md) 已写的业务码，不是 preload 的策略。`idempotent: true` 只表示「同样的请求再来一次，用例自己保证结果不重复副作用」。Q4 比较了只写注释、写入注册表、preload 自动重试三种落点。

长任务的响应 schema 只有 `jobId`。进度是 `jobs` 的事件。取消是另一次命令 `jobs.cancel`。生成器不把一次 invoke 收成「等完全部进度」。

体积：[docs/arch/11.md](../arch/11.md) 规定单条 IPC 超过默认 1 MB 时记 `ipc.oversize`，字段只有通道名和字节数，不带内容。测量点在 main 的 router，在发给 renderer 之前。字节怎么量以锁定的 Electron 45.2.1 为准，本方案不指定一个未核实的 API。超限只记日志，不改 `Result` 的形状。页面图、PDF、音频仍只传 `assetId`。[docs/arch/04-05.md](../arch/04-05.md) 的块窗口默认取该阈值的一半，用来让 AC-79 的夹具里 `ipc.oversize` 为 0；切开大文档是 markdown 用例的事，不是生成器的事。每次 invoke 在 router 里生成关联用的 id，透传到日志与 worker。它不进 `Result`，除非那条命令的响应 schema 自己包含它。外发同意里的 `requestId` 是事件载荷里的业务 id，和这条关联 id 不是同一个字段。

`expose: false` 的命令不生成方法。`markdown.writeFile` 在 v2 永远是 `expose: false`（N-18，AC-53）。类型可以留在契约里，preload 文本里不出现 `writeFile`。

拖入文件是唯一要在 preload 里碰路径的情况（[docs/arch/04-05.md](../arch/04-05.md) §4.5.3 第 6 条）。描述符用 `transport: "dropped-file"`。生成的方法接收 `File`，在 preload 里调用 `webUtils.getPathForFile`，随即 `invoke`，不把路径放进 renderer 能读的状态，也不把路径当作返回值。这条不进第一份契约 PR：`contracts/src/ipc/markdown.ts` 还不存在。描述符的联合里先留这个 `transport`，避免以后手写第二套格式。

## 3.2 契约改动

单独的契约 PR，先合（[RULES.md](../../RULES.md) §2、§3 第 3 条）。只改 `packages/contracts/src/ipc/**` 与 `packages/contracts/test/**`。不改 preload，不改 `run.mjs`，不改 `manifest.json`。

以 `settings.ts` 为起点，新增一份描述符，而不是再维持一套与接口平行的注释。现有 `SettingsEgressCommands` 改成由描述符推导，避免两份定义。导出名字保持不变，`packages/contracts/src/index.ts` 的再导出尽量只动已有那一段。

建议新增的字段：

| 字段 | 作用 |
| --- | --- |
| `channel` | `"settings.answerEgressConsent"` 这种字面量 |
| `kind` | `"command"` 或 `"event"` |
| `request` / `response` 或事件的 `payload` | TypeBox schema |
| `errors` | 错误码字符串元组 |
| `idempotent` | 仅 command。事件不填 |
| `expose` | `false` 时生成器与 router 都忽略 |
| `transport` | `"invoke"`（默认）或 `"dropped-file"` |

按 [docs/arch/07-00.md](../arch/07-00.md) 的注释，四条命令的幂等初值是：`answerEgressConsent` 否、`withdrawEgressConsent` 否、`setEgressPromptEnabled` 是、`listEgressDestinations` 是。第一份契约 PR 里这四条都 `expose: false`。没有 router 和处理器之前不暴露。事件 `settings.onEgressConsentRequired` 同样 `expose: false`。

契约测试放在 `packages/contracts/test/ipc-settings.test.ts`。`vitest.config.ts` 的 `include` 已有 `packages/contracts/**/*.test.ts`，`CI / node` 的 `pnpm test` 会收集。断言：通道字面量、错误码、幂等布尔值与 §7.0 一致；`expose` 全为 `false`；描述符能被 TypeBox 检查一份合法样本和一份非法样本。不读 `apps/desktop/src` 的源码（F-08）。

G12：只改 `packages/contracts/` 时非生成行数上限是 200（`tools/check-pr-size/check.mjs`）。这份契约 PR 把描述符和四条命令的 schema 写完，若超过 200 行，提交说明或 PR 正文加一行 `G12:`，不改上限。G18：不改 `packages/features/**`，切片数为 0。`contracts/src/ipc/settings.ts` 按 [docs/arch/13.md](../arch/13.md) 是 settings 的契约文件，不是热点。G11 的脚本今天只数名为 `composition-root.ts` 与 `slots.ts` 的文件（`tools/check-hotspots/check.mjs`），还没有按 import 图发现热点。共享描述符文件一旦被两个切片的实现 import，规格上会变成热点，那时每个 PR 不超过 30 行；第一份契约 PR 只有 settings 使用它。

`contracts/src/errors.ts` 在 [docs/arch/04-01.md](../arch/04-01.md) 里，仓库里还没有这个文件。本方案不新建它。命令自己的错误码留在该切片的 ipc 文件里。

## 3.3 生成器

输入是 `packages/contracts/src/ipc/**` 里 `expose: true` 的描述符。`expose: false` 的不出现在任何输出里。

输出三份，都带首行 `// Generated by tools/codegen. Do not edit.`：

| 输出 | 职责 |
| --- | --- |
| `apps/desktop/src/preload/oi.generated.ts` | 导出 `createOi(bridge)`。每个命令闭包自己的通道名，调用 `bridge.invoke`。每个事件调用 `bridge.subscribe` 并返回退订。不 import `electron` |
| `apps/desktop/src/renderer/oi-api.d.ts` | `Window.oi` 的类型。放在 desktop，不放进 contracts：core 的 tsconfig 没有 DOM（G14） |
| `apps/desktop/src/main/ipc/registry.generated.ts` | 暴露中的通道、schema、幂等、kind。router 只注册这张表 |

`apps/desktop/src/preload/index.ts` 保持手写，并且只做两件事：用 `ipcRenderer` 实现 `bridge`，再 `exposeInMainWorld("oi", createOi(bridge))`。通道名不写在这个文件里。它是入口文件，硬上限 150 行（[docs/arch/06.md](../arch/06.md)）。`bridge.invoke` 只在 preload 内部，不挂到 `window.oi`。

`run.mjs` 在现有协议生成之外调用 preload 生成。`manifest.json` 增加一条，不走今天的字节复制：

```json
{
  "id": "preload",
  "kind": "preload",
  "input": "packages/contracts/src/ipc",
  "outputs": [
    "apps/desktop/src/preload/oi.generated.ts",
    "apps/desktop/src/renderer/oi-api.d.ts",
    "apps/desktop/src/main/ipc/registry.generated.ts"
  ]
}
```

`copy.mjs` 继续只复制带 `input` 与 `output`、且没有 `kind: "preload"` 的项。`tools/codegen/drift.test.ts` 的复制夹具保持不变。

`tools/codegen/hand-edit.test.ts` 增加一条：临时目录里生成 preload，提交后再改一个字节，重新生成后 `git diff --exit-code` 非 0，并且输出含 G7 的改正说明。该文件已经在 `tools/**/*.test.ts` 里。另加断言：生成文本不含 `writeFile`、不含 `ipcRenderer`、不含 `exposeInMainWorld`。扫描的是临时目录里的生成物，对应 [docs/arch/04-05.md](../arch/04-05.md) §4.5.7 的生成物检查，不扫描功能切片的 `src/`。

漂移仍是 G7：`pnpm codegen && git diff --exit-code`（`package.json` 的 `check` 已有这一步）。不改 CI。

`.github/workflows/ci.yml` 第 212 行在 `worker-health` 矩阵里把 TypeScript protocol fixtures 写成两个文件：`tools/codegen/versions.test.ts` 与 `packages/contracts/test/worker-protocol.test.ts`。新测试不会被这一步收集。`CI / node` 另有 `pnpm test`（同文件第 81 行），收集面是 `vitest.config.ts` 的 `include`。preload 与契约测试落在这三条已有路径里：`tools/**/*.test.ts`、`packages/contracts/**/*.test.ts`、`apps/desktop/test/**/*.test.ts`。因此生成器 PR 与契约 PR 都不改 `ci.yml`。#146 已合入，那一行就是 `6988420` 上的文本。把该列表改成目录，另开 PR，本方案不排进实现（Q5）。

生成文件按 [docs/arch/06.md](../arch/06.md) 不计行数，生成器 PR 要在 `tools/check-file-size/allowlist.json` 的 `ignore` 里登记路径和理由。这是 `ignore`，不是要 ADR 到期日的 `exemptions`。G12 的 `generatedPrefixes` 今天只有 `workers/parser/oi_worker/protocol/`。preload 生成物仍计入 600 行。生成器 PR 若因此超过 600，正文写 `G12:`。不在那个 PR 里改 `tools/check-pr-size/check.mjs`（N-08）。要不要把 preload 路径加入 G12 的生成前缀，另案，本方案不实施。

main 端 `ipc-router.ts` 手写，不生成。它做四件事：校验发送方是本应用窗口的 frame，且页面来源是 `oi-app://`（[docs/arch/09.md](../arch/09.md)、[docs/arch/01.md](../arch/01.md)）；用 schema 校验载荷；调用装配根注入的处理器；捕获异常并收成 `Result`。处理器仍是各切片的 `adapters/ipc-handlers.ts`，只做转接（F-02、F-15）。router 不写业务分支。`composition-root.ts` 是 G11 具名热点，接上 router 的改动不超过 30 行。

e2e 的 `JSON.stringify(window.oi) === "{}"` 在值全是函数时仍然成立，因为 `JSON.stringify` 会丢掉函数。生成器 PR 要另加一条按键名列表的断言，不能只留这一条。那是实现 PR 的测试，本 PR 不改 e2e。

## 3.4 交付计划

Wisdom 18:29 已要求生成器与 `ipc-router` 同一个 PR。这里仍列出三种做法，供 Loom 核对这句话落在哪一档。

A，推荐。生成器与 router 同一个 PR。这个 PR 可以一行产品通道都不暴露：契约里的 settings 仍是 `expose: false`，生成结果是空的 `oi`，router 对空表注册零个 `handle`。此后某个切片要把 `expose` 改成 `true`，必须在同一个 PR 里提交处理器、生成物和 router 能找到的处理函数。desktop 测试断言：注册表里每个 `expose: true` 的通道都有处理函数。这样不会出现「renderer 能调、main 没人接」。

代价：该 PR 跨 `tools/codegen` 与 `apps/desktop` 的 main、preload。它不改 `packages/features/**` 时 G18 的切片数是 0，允许。G12 见 §3.3。热点只有 `composition-root.ts` 的装配行。

B。先合生成器，router 以后再合。PR 更小。一旦有人把 settings 的 `expose` 设为 `true`，或者生成器按「文件里有定义就暴露」来做，preload 会带上没有处理器的通道。这和 18:29 要避免的中间态是同一件事。不推荐。

C。生成器带 allowlist 或运行时开关，router 补齐后再放开。静态的 `expose` 已经是 A 里的那张表，不必再做第二份名单。运行时功能开关与 [docs/backlog.md](../backlog.md) 里「不用通用功能开关」那条审查意见相撞。不推荐。

和 G18、G12 的关系：契约 PR 一个切片都不变，行数按契约 200 行档。生成器加 router 的 PR 仍不进入 `packages/features/*/src/**`，G18 通过。以后 settings 的处理器要放进 `packages/features/settings/` 时，那个 PR 只含这一个切片，加上生成物和不超过 30 行的装配根。不要把 markdown 的处理器夹进 settings 的 PR。

## 3.5 安全约束

窗口选项保持今天的 `window-preferences.ts`：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`，`webSecurity` 维持默认，不启用 `<webview>`。生成器不写这些字段。导航、权限、CSP、`oi-app://` 仍是外壳已有职责（AC-67 ①），不在本方案里重做。

`contextBridge` 只暴露 `createOi` 返回的函数。不暴露 `ipcRenderer`、`fs`、`shell`，也不暴露通用 `invoke` / `subscribe`。发送方校验在 router。UI 不接收绝对路径：数据目录只返回名称与不透明句柄（[docs/arch/09-01.md](../arch/09-01.md)、[DESIGN.md](../../DESIGN.md) §4.9）。`shell.openFile` 是 main 内部入口，不生成到 `window.oi`。`shell.revealItem` 若以后成为 IPC，响应里没有路径。

不暴露写 md 的 API（N-18）。生成物出现 `writeFile` 即测试失败。装配根不注入 `MdFileWriter`。

密钥不进 renderer（AC-59 ⑤ 的方向：renderer 只知道已设置或未设置）。日志不记正文、译文、提示词、密钥、绝对路径，也不记 IPC 载荷。`ipc.oversize` 只记通道名和字节数。

Electron Fuses 归 #68，见 [docs/backlog.md](../backlog.md) 与 [docs/arch/09.md](../arch/09.md) 的 Fuses 列表。本方案的衔接点只有一句：Fuses 在打包时设置，不改变 `window.oi` 的形状，也不改 preload 生成器的输入。#68 不把通道写进手写 preload。

设计原则 P7：UI 只根据 `Result` 与事件载荷显示。失败不用抛异常来驱动界面。[docs/design-principles.md](../design-principles.md) 的颜色、间距、字号本方案不取用。

## 3.6 给 Wisdom 的开放问题

Q1. 命令方法怎么命名？

1. `window.oi.<切片>.<操作>(请求)`。推荐。与 §9、§2.2、RULES §8.4 同一套名字，renderer 没有通道字符串。
2. `window.oi["<切片>.<操作>"](请求)`。键是字符串，调用点容易拼出未生成的通道。
3. `window.oi.invoke("<切片>.<操作>", 请求)`。这是被 §1 与 §2.2 禁止的通用入口。

Q2. 事件怎么订阅、怎么退订？

1. `window.oi.<切片>.on<Event>(回调)` 返回退订函数。推荐。一个事件一个方法，退订不需要再传通道名。
2. `window.oi.<切片>.subscribe("on<Event>", 回调)` 返回退订函数。方法是通用的，事件名是字符串。
3. `window.oi.on("<切片>.on<Event>", 回调)`。跨切片的通用订阅，和 Q1 的第 3 项是同一类口子。

Q3. 生成器与 router 怎么交付？

1. 同一个 PR（本节 A）。推荐。与 18:29 的原话一致；第一笔可以零条产品通道，`expose` 与「有处理函数」由测试绑在一起。
2. 先生成器，后 router（本节 B）。会出现能调但不能接的中间态。
3. allowlist 或运行时开关（本节 C）。和第二份名单或通用功能开关重复。

Q4. 幂等写在哪里？

1. 只写生成注释。人能看见，router 与测试读不到。
2. 描述符与注册表里的布尔值，不自动重试。推荐。满足 §9「每个定义包含是否幂等」，重复语义仍由用例的错误码表达。
3. preload 对 `idempotent: true` 的命令自动重试。与「不写无上限重试」相撞，也会把业务上的第二次 `unknown_request` 盖掉。

Q5. `ci.yml` 第 212 行的硬编码 vitest 列表怎么处理？

1. 新测试只放进 `vitest.config.ts` 已收集的路径，本系列 PR 不改 CI。推荐。`CI / node` 的 `pnpm test` 会跑到。第 212 行继续只跑 worker 协议夹具。
2. 在生成器 PR 里把新文件加进第 212 行。那一行属于 `worker-health`，不是 preload 的家，而且本系列不改 CI。
3. 另开 PR，把第 212 行改成目录。可以以后做。不做它，preload 测试也不会缺跑。

Q6. 传输失败要不要进每条命令的错误联合？

1. 要。业务码再并上 `sender_rejected`、`invalid_payload`、`handler_threw`，后三个带 `message` 与 `retryable`。推荐。失败仍然是 `Result`，类型里看得到。
2. 业务码保持契约里写的联合，传输失败也返回 `Result`，但 `code` 不写进类型。UI 会遇到类型里没有的码。
3. router 继续抛。renderer 只剩 `message`，§2.4 的「错误是数据」在这条路上不成立。

## 来源核对

下面 S1–S10 是交接里的十条。S11 起是开工时再读 issue 评论和 `docs/` 检索后补上的。检索词：`preload`、`ipc`、`codegen`、`window.oi`、`#67`。

| # | 来源 | 方案怎么接 |
| --- | --- | --- |
| S1 | Issue #67 正文 | §3.1–§3.3。由契约生成，不手写通道。验收仍是 `pnpm codegen` 之后 `git diff --exit-code` 为 0 |
| S2 | Forge 18:05，[评论 6628045811](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628045811) | 契约 PR 先行，见 §3.2。形状见 §3.1。router 同 PR 见 §3.4。#146 已合入，不再有「避开 #146 文件」的开放 PR |
| S3 | Wisdom 18:28，[评论 6628434530](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628434530) | 本 PR 只写方案。Loom 审、Wisdom 批之前不开契约 PR。决策记录写了 `approvals.md` 没有对应行 |
| S4 | [docs/backlog.md](../backlog.md) 外壳三条里的 #67 行 | §3.3。外壳只暴露空 `oi`。现有 codegen 只生成 worker 协议。G7 继续用 `pnpm codegen && git diff --exit-code` |
| S5 | [docs/arch/09.md](../arch/09.md) 定义四要素 | §3.1 的映射表 |
| S6 | [docs/arch/09.md](../arch/09.md) 窗口安全与 Fuses | §3.5。Fuses 只写与 #68 的衔接 |
| S7 | 交接写的 `/workspace/oi-v2/pr65-review/REVIEW.md` | 本环境没有这份路径。同内容以仓库为准：`window-preferences.ts`、`preload/index.ts`、e2e、[docs/backlog.md](../backlog.md) 的 #66 / #67 / #68 |
| S8 | [RULES.md](../../RULES.md) 契约先行、N-09、N-18、§8.4 | §3.1 命名，§3.2 单独契约 PR，§3.3 不手改生成物，§3.5 不暴露 `writeFile` |
| S9 | [架构评审](../reviews/2026-10-30-architecture-review.md) P1-7 与 main 发送方校验；[docs/backlog.md](../backlog.md) 的 reader P2-9 | §3.1 体积与 `ipc.oversize`。§3.5 发送方校验。reader 只订阅 `window.oi` 与 `pure.ts`（[v2-full-review](../reviews/v2-full-review.md) P2-9，[docs/arch/04-03.md](../arch/04-03.md)） |
| S10 | `.github/workflows/ci.yml` 第 212 行 | §3.3 与 Q5。不改 CI |
| S11 | Wisdom 18:29，[评论 6628452608](https://github.com/wisdom-km/open-immerse-v2/issues/67#issuecomment-6628452608) | 交接写完时这条已在 issue 上。决策记录与 Q3 的推荐项按这句：生成器与 router 同一个 PR；形状等本方案批准后再开工 |
| S12 | [docs/arch/01.md](../arch/01.md)、[docs/arch/02-02.md](../arch/02-02.md)、[docs/arch/02-04.md](../arch/02-04.md) | preload 只暴露类型化命令与订阅。错误是 `Result`。renderer 只用 `pure.ts` 与 `window.oi` |
| S13 | [docs/arch/04-05.md](../arch/04-05.md)、[docs/design/md-reader.md](../design/md-reader.md) | `writeFile` 不注册。拖入路径走 `dropped-file`。块窗口对上 `ipc.oversize` |
| S14 | [docs/arch/07-00.md](../arch/07-00.md)、[docs/v2-gap-and-changes.md](../v2-gap-and-changes.md) | settings 四条命令的幂等初值。设置页的评分开关将来是 `window.oi.quality.*`，不是把规则放进 preload |
| S15 | [docs/arch/03.md](../arch/03.md)、[docs/arch/05-02.md](../arch/05-02.md) F-11、[docs/arch/12.md](../arch/12.md)、[docs/arch/13.md](../arch/13.md) | 生成物目录、禁止手改、UI 测试用 fake `window.oi`、G7 / G12 / G18 |
| S16 | [docs/prd/06-01-01.md](../prd/06-01-01.md) AC-53、[docs/prd/06-01-07.md](../prd/06-01-07.md) AC-67、[docs/prd/06-01-10.md](../prd/06-01-10.md) AC-79 与 AC-80、[docs/prd/06-01-12.md](../prd/06-01-12.md) AC-100 | preload 无 `writeFile`。安全基线与 `oi-app://`。IPC 体积。ipc 契约文件不是 G11 热点样例。界面只到 `pure.ts`、contracts、`window.oi` |
| S17 | [DESIGN.md](../../DESIGN.md) §4.9、§4.10；[docs/design-principles.md](../design-principles.md) P4、P7 | 不返回绝对路径。原生对话框留在 main。PDF 缩放将来是 `reader.setZoom`，不是 Electron 的整窗缩放 role。本方案不改这些正文 |
| S18 | [docs/approvals.md](../approvals.md)；交接点名的 `openai-review/REPORT.md` 与 `openai-review2/REPORT.md` | `approvals.md` 无 #67。两份 REPORT 不在本仓库，也没有并进 `docs/reviews/`。不另寻仓库外结论 |

`docs/architecture/` 里的桌面草案写过「preload 只暴露具体命令」。那是历史草案，不作为本方案的依据。

## 证据链接

- `docs/evidence/<PR号>/commands.md`：PR 开出后把 `<PR号>` 写成实际编号，并记下定向检查的退出码。

## 自检

- [ ] 影响 arch / prd 吗？不影响。本 PR 不改规格正文，也不改 `docs/spec-changelog.md`。

## 不做

- 不改代码、不改 CI、不改 `manifest.json`、不改 `docs/arch/**`、`RULES.md`、PRD、`DESIGN.md`、`docs/design-principles.md`、`docs/design/**`、`docs/backlog.md`、`docs/approvals.md`、`docs/spec-changelog.md`。
- 不 force push，不合入，不把 Draft 标成 Ready。
- 不加登录、订阅或计费。空的 `AccountSession` 仍返回 `not_in_v2`（AC-94），与 preload 生成无关。
