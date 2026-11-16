# 执行计划

S1：菜单状态内部契约、索引、契约测试。分支 `feature/view-menu-contract-s1-174`。文件名与分支同名。

基线 main `95796e5f96cc8cceb78dc6389585626d03d1d486`。唯一 parent 是 `dc35b82bb2682f83f87ef5af268975a9dba5dacc`。tree `f0eb5ca8291c7295ffa0a1b161a370a32f6074e0`。这是已合 PR #220。方案源是 [feature-reader-view-menu-seam-174.md](feature-reader-view-menu-seam-174.md) 里的 S1。本文件不改那份设计。

本回合只交本文件和 [docs/approvals.md](../approvals.md)。不写契约、测试、生成物、产品代码。Forge 精确版本审查 PASS 之前停。PASS 之后按下面的白名单实现，不必再请 Wisdom 逐笔重批。这次批准不是 S2a、S2b、S2c-prep、S2c-on、E2、S3 的批准，也不是本计划的 PASS。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。任务类型是 seam 变更。切片是契约里的 `shell` 通道。本 S1 无 UI，不做视觉变更。原则沿用 Loom 已有审查：原生系统行为优先，不自造控件（[docs/design-principles.md](../design-principles.md) P4，[DESIGN.md](../../DESIGN.md) D1）。

## Goal

在 `packages/contracts` 增加一条未暴露的 `shell.reportViewMenu`。一条命令，`read` 与 `submit` 两个闭合分支。成功体都是 `{ epoch }`。`expose` 保持 false。正式 codegen 之后三份生成物与基线逐字节相同。索引只再导出这条命令和它的类型。契约测试用现有的 TypeBox `Value.Check` 接受合法边界、拒绝非法载荷。

## Context

- 现在已有的行为：`packages/contracts/src/ipc/` 有 10 个 `.ts`，没有 `shell.ts`。`packages/contracts/src/index.ts` 是 200 行，导出各切片的 IPC，不导出菜单上报。`packages/contracts/test/` 没有 `ipc-shell.test.ts`。`readerViewModeSchema` 在 `packages/contracts/src/reader.ts`，只有 `original`、`contrast`、`translation`。`packages/contracts/src/ipc/reader.ts` 写明不发明 `reader.setViewMode`。代表测试是 `packages/contracts/test/reading-asset.test.ts` 与 `packages/contracts/test/ipc-ingest.test.ts`：断言 `expose`，并用 `Value.Check` 接受闭合载荷、拒绝多余字段和越界整数。校验器没有单独的 shell 模块。`apps/desktop/src/main/ipc/payload-schema.ts` 的 `integer` 分支只判断 `Number.isInteger`，不读 `minimum` / `maximum`。codegen 的输入目录是 `packages/contracts/src/ipc`（`tools/codegen/manifest.json`）。`tools/codegen/preload-descriptors.mjs` 先收集描述符，再留下 `expose === true` 的项。三份输出是 `apps/desktop/src/preload/oi.generated.ts`、`apps/desktop/src/renderer/oi-api.d.ts`、`apps/desktop/src/main/ipc/registry.generated.ts`。视图菜单今天是普通项，事件名 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`（`apps/desktop/src/main/library-menu.ts`）。栏位值仍是 `contrast`，不是 `bilingual`。
- 相关的节：[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.3、§2.4、§4.1、§6、§9、§13 的 G12；[RULES.md](../../RULES.md) §2、§3 第 3 条、§8.2 规则 3、§9；[docs/ci-and-environment.md](../ci-and-environment.md)「门禁」；已合 seam 计划的「一条命令」与 S1 验收；[E2 计划](feature-reader-view-modes-e2-174.md) 的 H11 与「菜单单选勾」。E2 三笔不写这条上报。顺序仍是 S1 → S2a → S2b → S2c-prep → S2c-on → E2-0 → E2-1 → E2-2 → S3。文档阶段 `unpublished` / `open` / `retired` 属于 S2a。地板、替换门和菜单勾属于 S2b 及以后。
- 还没做的部分：这条描述符、两行索引、`Value.Check` 行为测试。handler、生产表、`expose: true`、renderer 上报、栏位 UI、存储都还没批。

已读 PRD、ARCHITECTURE、RULES、DESIGN、设计原则、AGENTS 的强制项和路由、seam 全文、E2 计划里与菜单 seam 相关的约束。没有发现必须停工的规格冲突。DESIGN 正文仍写默认「对照」，已批临时默认是原文；两处都保持原文，本批不改。ARCH §9.1 已列出 `shell.revealItem` 与 `shell.openFile`，仓库里还没有对应描述符。本批不补这两条。

## Constraints

请求是一个 `Type.Union`，两臂都是 `additionalProperties: false` 的对象。JSON Schema 上这是 `anyOf`。不另写解析器。不新增校验器。测试调用 `@sinclair/typebox/value` 的 `Value.Check`。这和阅读登记测试是同一个校验器。`payload-schema.ts` 不在本批，也不能把「schema 拒绝越界」写成「传输层已经拒绝越界」。

`read` 只有 `op: "read"`。`mode`、`epoch`、`generation`、`bootId` 和任何其他字段都是多余字段，`Value.Check` 为 false。

`submit` 必须同时有 `op: "submit"`、`mode`、`epoch`、`generation`。`mode` 四值是 `none`、`original`、`contrast`、`translation`。`none` 表示当前没有已接受的阅读栏位，不是 `ReaderViewMode`，也不写入 `reader.ts`。`bilingual` 是现有菜单事件名，不是 `mode`。

`epoch` 与 `generation` 各自是整数，闭区间是 1 到 `Number.MAX_SAFE_INTEGER`（含两端）。用 `Type.Integer` 的 `minimum` 与 `maximum`。缺一、0、负数、非整数、`MAX_SAFE_INTEGER + 1`、`NaN`、`Infinity`、数字字符串都拒绝。两字段单独越界就拒绝整份 `submit`。相等的 generation 在 schema 上仍然合法：和地板比较是以后的 handler，不在本批。

成功体是同一个闭合对象 `{ epoch }`，`epoch` 用同一整数区间。不回 `mode`，不回 `generation`，不回新的授权。读成功与提交成功的 schema 不分成两份。

通道 `shell.reportViewMenu`。`kind` 是 `command`。`transport` 是 `invoke`。`idempotent` 是 false。`expose` 是 false。错误只使用已有码，顺序是 `rejected`，然后 `ipcTransportErrors`：`sender_rejected`、`invalid_payload`、`handler_threw`。前三个 `retryable` 为 false，`handler_threw` 为 true。`rejected` 不带 `detail`。不新造错误码。载荷里没有发送方 id、路径、权限、密钥或 `bootId`。

`shellIpc` 只有这一条。索引在 `packages/contracts/src/index.ts` 现有 reader 出口之后增加：

```ts
export type { ShellChannel, ShellCommands } from "./ipc/shell.js";
export { reportViewMenu, shellIpc } from "./ipc/shell.js";
```

不导出内部 schema，不把 `none` 并进 `ReaderViewMode`。codegen 扫描的是 `ipc/` 目录，不靠这行出口才看见描述符。`expose: false` 在过滤后不会进入三份生成物。

## Done when

下面几条同时成立，才算 S1 实现做完。本回合一条都不算达到。

- 三份手写文件与白名单一致，`expose` 仍是 false。
- 行为矩阵每条都有 `Value.Check` 断言。类型扩展断言可以另有一条，不算行为用例。没有源码文本断言。
- 正式 `corepack pnpm run codegen` 之后 `git diff --exit-code` 为 0。三份生成物不进提交。
- 三文件新增+删除不超过 200。整个 PR 的非生成新增+删除不超过 600。没有 `G12:`。
- `docs/evidence/<PR号>/commands.md` 写下文的门禁表，退出码来自这次实际运行。
- Draft 保持 Draft。不 Ready，不合入，不发版。

## 文件白名单

本回合：

| 文件 | 动作 |
| --- | --- |
| `docs/exec-plans/feature-view-menu-contract-s1-174.md` | 第一笔，只此文件 |
| `docs/approvals.md` | 第二笔，只此文件 |

Forge PASS 之后的实现：

| 文件 | 动作 |
| --- | --- |
| `packages/contracts/src/ipc/shell.ts` | 新建。目录里现在没有这个文件 |
| `packages/contracts/src/index.ts` | 只加上面两行出口 |
| `packages/contracts/test/ipc-shell.test.ts` | 新建 |
| `docs/evidence/<PR号>/commands.md` | 命令跑完后再写。PR 号出来之前不建目录 |

其他路径 diff 为 0。包括 `reader.ts`、`ipc/reader.ts`、`error-codes.ts`、`payload-schema.ts`、三份生成物、`apps/desktop/src/main/**`、handler、registry 生产表、`library-wiring.ts`、`composition-root.ts`、`slots.ts`、renderer、`packages/features/**`、存储、CI、CSP、PRD、ARCHITECTURE、RULES、DESIGN、`docs/design/**`、`docs/design-principles.md`、seam 计划、E2 计划。

## 逐文件改删估算

口径：`git diff --numstat` 的新增+删除。净行不使用。

`tools/check-pr-size/check.mjs` 把三方 diff 里每个未排除文件的新增和删除相加。排除名单只有 `pnpm-lock.yaml`、`workers/parser/uv.lock`、`dist/`、`workers/parser/oi_worker/protocol/`。计划、台账、证据、契约源码、契约测试，以及一旦变化的三份 IPC 生成物，都计入。[docs/ci-and-environment.md](../ci-and-environment.md) 写的排除项少了协议目录；机器以 `check.mjs` 为准。全部文件都在 `packages/contracts/` 下时上限是 200，否则是 600。本 PR 含 `docs/`，机器上限是 600。已合 seam 仍要求这三个契约文件自己的新增+删除不超过 200，生成物 diff 为 0。600 不用来放宽这 200。不写 `G12:`。估算乘 1.73 超过 346 时先重算；346 不是 CI 失败线。

| 文件 | 现在 | 新增 | 删除 | 停 |
| --- | --- | --- | --- | --- |
| `ipc/shell.ts` | 无 | 72 | 0 | 源文件建议 400，硬 600。类型映射沿 `ipc/reader.ts` 第 59–77 行，约 19 行。不写超过 50 行的函数 |
| `src/index.ts` | 200 | 2 | 0 | 改完约 202。建议 400，硬 600。200 不是文件上限。机器热点只点名 `composition-root.ts` 与 `slots.ts`；描述里仍声明这个桶，改动 2 行 |
| `ipc-shell.test.ts` | 无 | 120 | 0 | 测试建议 600，硬 800。矩阵不删 |
| 三文件合计 |  | 194 | 0 | 超过 200 就停 |
| 本文件与台账 | 本回合实测 | 计入 600 | 计入 600 | 实现前用 numstat 加上 194 与证据约 50。和超过 600 就停，不开始写契约 |
| 证据 | 无 | 约 50 | 0 | 只计入 600 |

函数软 50、硬 80，见 [docs/arch/06.md](../arch/06.md)。不申请豁免。

## 行为测试矩阵

校验器是 `Value.Check`。`true` 是接受，`false` 是拒绝。`ceiling` 是 `Number.MAX_SAFE_INTEGER`。

| 结果 | 条件 |
| --- | --- |
| 接受 | `{ op: "read" }` |
| 拒绝 | `{}`、`{ op: "submit" }`、`{ op: "READ" }`、`null`、`[]` |
| 拒绝 | `read` 另带 `mode`、`epoch`、`generation`、`bootId` 或其他字段。`mode` 用 `original` 与 `none` 各一次 |
| 接受 | 四个 `mode` 各自配 `epoch` 1、`generation` 1，以及两者都是 `ceiling` |
| 接受 | `original` 配 `epoch` 1、`generation` `ceiling`，以及 `epoch` `ceiling`、`generation` 1 |
| 拒绝 | `submit` 缺 `op`、`mode`、`epoch`、`generation` 中的任何一个 |
| 拒绝 | `mode` 为 `bilingual`、空串 |
| 拒绝 | `submit` 另带 `bootId` 或其他字段 |
| 拒绝 | `epoch` 或 `generation` 为 0、负数、1.5、`ceiling + 1`、`NaN`、`Infinity`、字符串 `"1"` |
| 接受 | 响应 `{ epoch: 1 }` 与 `{ epoch: ceiling }` |
| 拒绝 | 响应 `epoch` 为 0、1.5、`ceiling + 1`，空对象，或另带 `generation`、`mode`、`bootId` |
| 描述符 | `expose` false，`idempotent` false，通道、`kind`、`transport` 如上。`shellIpc` 只有这一条。桶出口与模块出口是同一个值 |
| 通道 | 与 `settings`、`settingsParse`、`parsing`、`library`、`libraryProgress`、`readingAsset`、`reader`、`ingest` 的通道合在一起没有重复。不改那些测试文件 |
| 错误 | 码与 `retryable` 的顺序如上。没有 `detail`。没有新码 |
| 栏位 | `readerViewModeSchema` 拒绝 `none`，仍接受 `original`。菜单 `submit` 接受 `none`。不改 `reader.ts` |

`expectTypeOf` 只可用来说明描述符满足 `IpcCommandDescriptor`。它不代替上表。不读 `shell.ts` 或生成物的文本。不导入 `payload-schema.ts`，不启动 Electron。

## 依赖方向

`shell.ts` 只依赖 `@sinclair/typebox`、`./descriptor.js` 的类型、`./error-codes.js` 的 `REJECTED` 与 `ipcTransportErrors`。不依赖 `reader.ts`、features、apps、kernel 的值、Electron。测试可以引用 `readerViewModeSchema` 做上表最后一行。contracts 仍是叶子。G18 只数 `packages/features/<切片>/src/`；本 PR 的功能切片数是 0。

## 必须停止项

- 三文件新增+删除超过 200，或整个 PR 超过 600。
- codegen 后三份生成物有 diff。不手改，不提交，不把 `expose` 改成 true。
- 需要新校验器、新错误码、`detail`、`bootId`、发送方字段、第二条 IPC，或改 `payload-schema.ts`。
- 要改 main、handler、生产接线、renderer、UI、存储、CI、CSP、协议，或规格正文。
- 要补 `shell.revealItem`、`shell.openFile`、`reader.setViewMode`，或放宽权限。
- 要删断言、写 `G12:`、离开 Draft、合入、发版、对外评论。
- 把本计划 PASS 当成 S2 或 E2 的开工许可。

## 门禁命令及 G1 证据表

本回合不跑这些命令，不把没跑写成通过。实现笔在最终 tip 上各跑一次。Node 使用 22.23.4，并把 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin` 放在 PATH 前面，再调用 `corepack pnpm`。

| 顺序 | 命令 | 期望 |
| --- | --- | --- |
| 1 | `corepack pnpm exec vitest run packages/contracts/test/ipc-shell.test.ts` | 退出码 0。先于全量 |
| 2 | `corepack pnpm test` | 同一 tip 只跑一次。退出码写入证据 |
| 3 | `corepack pnpm run check` | 含 G1 与 G7。`GATE_BASE=origin/main` |

G1 是 `corepack pnpm run check:format`：Prettier 3.6.2，范围 `**/*.{ts,tsx,mjs,js,cjs}`（`tools/check-format/check.mjs`）。Markdown 不在 G1。G7 是同一条 `check` 末尾的 `codegen` 加 `git diff --exit-code`。

证据表放在 `docs/evidence/<PR号>/commands.md`。一行一条实际跑过的命令。没跑的不填通过。

| 门禁 | 命令 | 退出码 | 摘要 |
| --- | --- | --- | --- |
| G1 | `corepack pnpm run check:format` |  | Prettier 打印的文件；通过则写「无违例文件」 |
| G7 | `check` 里的 codegen 与 `git diff --exit-code` |  | 三份生成物是否有 diff |
| 契约测试 | 上表第 1 条 |  | 通过 / 失败 / 跳过的个数 |
| 全量测试 | `corepack pnpm test` |  | 个数 |
| G12 | `check` 里的 `check-pr-size` |  | 打印的非生成行数。没有 `G12:` |
| G4 | `check` 里的 `check-file-size` |  | 硬上限之内 |
| G18 | `check` 里的 `check-one-slice` |  | 功能切片数 |

CI 跑 `.github/workflows/ci.yml` 的 `node` job（`pnpm check`、`pnpm test`、gitleaks、`check-docs`）和既有 python job。本批不改 Python。Box 由 Anvil 在实现 tip 上跑全量；本回合没有可交给 Box 的产品行为。真机不跑：不启动 Electron。读屏、物理键、mac 菜单、R-E13 仍未验证，不在本批补测。

## 交接

Forge 对本文所在 tip 审查 PASS 之后，把下面这段交给实现。PASS 之前不执行。

```text
从 feature/view-menu-contract-s1-174 的计划审查 PASS tip 继续。基线 main 95796e5f96cc8cceb78dc6389585626d03d1d486。只实现 docs/exec-plans/feature-view-menu-contract-s1-174.md 的白名单与行为矩阵。
任务类型：seam 变更。涉及切片：contracts 的 shell.reportViewMenu。
本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。
expose 保持 false。先确认 git diff --numstat 里计划与台账的新增+删除，加上契约估算 194 与证据约 50，不超过 600。三份契约文件的新增+删除不超过 200。超过就停。
用 Value.Check 写完全部矩阵。不新增校验器。不改 payload-schema.ts。正常跑 corepack pnpm run codegen。三份生成物有 diff 就停，不手改，不提交。
然后按该文件的门禁表跑命令，把退出码写入 docs/evidence/<PR号>/commands.md。保持 Draft。不 Ready，不合入，不发版，不评论。这不是 S2、E2 或 S3 的授权。
```

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。不写契约 | 本 PR 第一笔 | 该笔 SHA |
| 2 | 只改批准台账 | 本 PR 第二笔 | 该笔 SHA |
| 3 | Forge 审查。通过前不写契约 | 未发生 |  |
| 4 | 三文件、codegen 零差异、证据表 | 未发生。本回合不跑 | 无 |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 只实施 S1 的契约、索引和契约测试；先审计划 | 原话在台账 2026-11-16 14:51 行 | 2026-11-16 | Wisdom，[6909583000](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6909583000) |
| 不把这次批准写成后续批次的批准 | 同一条原话只点名 S1 | 2026-11-16 | Wisdom，同一链接 |
| 四值用 `none` / `original` / `contrast` / `translation` | 已合 seam 的四值。`none` 不进入 `ReaderViewMode` | 2026-11-16 | 已合 seam，不是新批准 |
| 不新增校验器 | 现有测试已经用 `Value.Check`。`payload-schema.ts` 不执行上下限，且不在白名单 | 2026-11-16 | 按已合 seam 核对代码，不是新批准 |
| 补 PR #220 四条台账 | 评论 6909206681、6909446852、6909490745、6909570661 已逐条核对。类别分开 | 2026-11-16 | 本回合台账范围，不是新的产品批准 |

## 证据链接

- `docs/evidence/<PR号>/`：无。本回合没有测试日志。

## 自检

- [x] 影响 arch / prd 吗？不影响。不改规格正文，不加 changelog。
- [ ] 实现、codegen、G1 证据：留给 PASS 之后。本回合不做。
