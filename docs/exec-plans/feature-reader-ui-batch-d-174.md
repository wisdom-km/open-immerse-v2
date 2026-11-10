# 执行计划

分支 `feature/reader-ui-batch-d-174`。基线是 `main` `e7db04f69e2a705f3d4389727af6f1b1001067c5`，tree `15f7237771b020692f0ec86bf36f1db297114f79`（提交说明 `feat: 接通 openDocument 只写最近，G12 已放行 (#174) (#191)`）。本文件按 [docs/exec-plans/TEMPLATE.md](TEMPLATE.md) 编写。它必须自包含。

停点：第一笔提交只有本文件。第二笔提交只有 [docs/approvals.md](../approvals.md) 里 2026-11-10 09:12 那一行，并把批准数从 129 改为 130。两笔都不是执行计划 PASS。Forge 亲读这两笔并 PASS 之前，不写实现。本文件在第二笔里不回填 SHA。

本两笔不改业务代码、测试、CI、CSP、codegen 生成物、[DESIGN.md](../../DESIGN.md)、[docs/design-principles.md](../design-principles.md)、`docs/design/**`（N-10）。不标 Ready，不合入，不发版，不 force-push。

任务类型：本两笔是纯文档。交接说明写「不适用」。后面的编码是 UI 改动。那时候的任务说明必须带上下面这一句，且 core 目录零改动：

> 本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

设计真相源是 Loom 的批次 D 设计稿（本仓库 uploads 中的 `BATCH-D-DESIGN.md`，文内日期 2026-11-09）。它对照的 main 还是 `631859c`。下面「现状理解」改按本基线重写。设计稿与仓库规格冲突时，需求与架构以仓库规格为准，界面以设计稿和已批的 1A / 2A / 3A / 6-1 B / 6-2 A 为准。不改 DESIGN 正文。

## 现状理解

- 已有行为：文献库可以列出、单击选中、用「打开文件…」或拖入导入。`LibraryTable` 的行把双击和 Enter 吞掉，不打开。[packages/features/library/src/ui/library-table.tsx](../../packages/features/library/src/ui/library-table.tsx) 第 66–72 行：单击调用 `onSelect`；`onDoubleClick` 走 `stopPointer`，只 `preventDefault`；`onKeyDown` 在 Enter 时只 `preventDefault`。右键同样只 `preventDefault`。测试 [library-screen.test.tsx](../../packages/features/library/test/ui/library-screen.test.tsx) 第 272–285 行锁住：单击把 `aria-selected` 设为 true，双击和 Enter 不增加任何 IPC。
- 已有打开通道：`window.oi.ingest.openDocument({ id })` 已暴露，生产 map 已挂上已有用例。请求没有页。用例自己读 `progressPage`，和这次的 `openedAt` 一起写回。`null` 写回 `null`。不提交解析。见 [docs/exec-plans/feature-open-document-174.md](feature-open-document-174.md) 的调用顺序，以及 [docs/arch/02-05.md](../arch/02-05.md) 第 30 行。
- 已有阅读通道：`library.bindReadingAsset`、`library.revokeReadingAsset`、`library.getProgressPage`、`library.setProgressPage` 都已 `expose: true`，生成在 [oi.generated.ts](../../apps/desktop/src/preload/oi.generated.ts)。写页不接受 `null`。读页成功可以是 `null`。旧 `(id, generation)` 被拒时回显请求里的那一对。生产 IPC 已挂上，仍不等于重开已验收。
- 已有协议：`oi-asset://asset/<assetId>` 用 `readFileSync` 读该条目的 `source.pdf`。只接受 GET 与 HEAD。不写 Range，不回 206。见 [reading-asset-protocol.ts](../../apps/desktop/src/main/reading-asset-protocol.ts) 第 31–51 行与第 141–150 行。
- 已有 PDF.js：`pdfjs-dist` 6.5.438。`pdfjsInitParameters` 只有 `data: Uint8Array` 和 `isEvalSupported: false`，没有 `disableRange`。见 [pdfjs-document.ts](../../packages/features/reader/src/adapters/pdfjs-document.ts) 第 35–43 行。`clampPage` 已从 [pure.ts](../../packages/features/reader/src/pure.ts) 导出。
- 还没有阅读屏。仓库里没有 `ErrorPage`、`StatusLine`、`TitleBar`、`IconButton` 的实现，也没有 `packages/ui-kit`。这些名字只在 DESIGN 的组件表里。诊断导出没有实现：没有 `packages/features/diagnostics/`，desktop 源码里没有「导出诊断」。
- 菜单只有「文件 › 打开…」（[library-menu.ts](../../apps/desktop/src/main/library-menu.ts) 第 1–4 行）。没有「返回文献库」。
- CSP 常量仍是 `connect-src 'self'`，`img-src` 含 `oi-asset:`，没有 `connect-src oi-asset:`。见 [csp.ts](../../apps/desktop/src/main/security/csp.ts) 第 2–3 行，与 [docs/arch/09.md](../arch/09.md) 第 32 行草案逐字相同。

## 来源核对

| 来源 | 位置 | 核对结果 |
| --- | --- | --- |
| 09:12 批准 | Issue #174 评论 [6756038040](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6756038040) | 对得上。原话是「批准」；随后问「对吧？这个这一批的是不是都实现完了？咱们按照那个项目进度是不是应该开那个P4D的？」；并确认「批次D」。回复的是文末「下一批要实现的是批次 D，仍需你批准后才能开工」。GitHub `created_at` 是 `2026-11-10T01:13:57Z`。台账时间用 09:12。这是实施批准。本两笔不是计划 PASS |
| 台账 | [docs/approvals.md](../approvals.md) 末行 | 对得上。`e7db04f` 上末行是 2026-11-09 21:06，计数是 129 条批准 + 1 条反馈 + 4 条决定 + 3 条合入同步。第二笔只追加 09:12，改为 130 |
| 09:01 追认 | 评论 [6755854594](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6755854594) | 台账里没有。原话含「追认 openDocument 小批实现及 build 脚本改动和计数 129」。本 PR 不补这一行。合入核实评论 [6755946053](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6755946053) 也不是新的批准原话，本 PR 不补 |
| 已批手势与阅读屏 | 台账 2026-11-05 21:01，评论 [6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956) | 1A 默认原文，不改 DESIGN 正文。2A：有历史先后退，无历史回库；‹ 与菜单「返回文献库」始终回库；Esc 不回库。3A 的 chip 本批不做。一并批准的范围含单击只选中、双击与 Enter 打开、「打开文件…」不打开选中行 |
| 读页失败文案 | 台账 2026-11-09 20:06，评论 [6739648033](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6739648033) | 6-1 B 已批。本行台账只抄了 6-3 那一句。6-1 的文案在同一条评论里，设计稿已核对。本 PR 不补 6-1 的台账行 |
| 批次 C 证据 | [docs/evidence/190/commands.md](../evidence/190/commands.md) 第 91–99 行 | 只证明 Electron 45.2.1 的 main 进程 `net.fetch("oi-asset://asset/1")` 收到同一 URL、状态 200、`application/pdf`。不起窗口，不经 CSP，不跑 PDF.js |
| 页码与恢复 | [docs/arch/02-05.md](../arch/02-05.md) 第 30–32 行，[docs/arch/09.md](../arch/09.md) 第 20–25 行，[docs/arch/09-01.md](../arch/09-01.md) 第 21 行，[docs/prd/08.md](../prd/08.md) 第 25 行，[docs/prd/05.md](../prd/05.md) 第 17 与 25 行，[docs/prd/06-01.md](../prd/06-01.md) 第 8 与 18 行 | 页级进度走 `progressPage`。不做 session 的页加块，不做整窗恢复。AC-11 整句仍未验收。AC-01 的「打开不重新导入」仍在 |
| 原则 | [docs/design-principles.md](../design-principles.md) 第 19–27 行 | P1 内容优先，P3 每屏最多一个主按钮，P5 不弹窗，P7 规则在 core |

## 目标

从文献库打开一篇已经入库的 PDF，默认只看原文，停在上次读到的页；阅读过程中记住页；离开时回到文献库并撤销这一代阅读登记。换一篇不把上一篇的页码、标题或提示留在新一篇上。

用户能看见的成功：双击或选中后 Enter 能打开；看到原文；关掉再开，停在上次那一页；出错时用整屏说明，并能回库。

## 验收

编号沿用设计稿 D-01–D-20。D-19 与 D-20 保持未满足，不删除，也不改写成通过。

| ID | 标准 | 本批怎么验 | 状态 |
| --- | --- | --- | --- |
| D-01 | 单击只选中；双击打开；选中后 Enter 打开；「打开文件…」不打开选中行 | 组件测试。真机见文末清单，本次不跑 | 实现阶段要满足 |
| D-02 | 打开已有文献不触发再导入，列表不出现新行 | 组件测试数 `library.import` 仍为 0 | 实现阶段要满足 |
| D-03 | 默认原文栏占满主区；阅读屏 0 个主按钮；不渲染 Aa、侧栏、大纲、⋯ | 组件测试查按钮名与缺席的控件 | 实现阶段要满足 |
| D-04 | 无解析服务时能打开并滚动全部页 | 不调用 `getParseCapabilities`。滚动本身见真机清单 | 自动测试只锁「不查询能力」；浏览全篇留真机 |
| D-05 | 已存正整数 N：重开后可见页是 `clampPage(N, M)` | 组件测试，假的读页结果 | 实现阶段要满足 |
| D-06 | 存页 `null`：从第 1 页起 | 组件测试 | 跟设计稿，不是仓库规条。见下节 |
| D-07 | 存页大于 M：显示第 M 页，不立即写回 | 组件测试数写页次数在落定前为 0 | 跟设计稿。仓库规格没写「夹完不回写」 |
| D-08 | 视口落到恢复页之前，保存请求数是 0 | 组件测试 | 实现阶段要满足 |
| D-09 | 读页失败：从第 1 页起，无弹窗，不挡滚动，不出现「解析」；页码旁 `role=status` 一行「没能读到上次的位置，已从第 1 页开始」，播一次；恢复成功无这句 | 组件测试 | 文案来自 6-1 B |
| D-10 | 浏览后离开再重开，回到离开前落定的页；退出应用再启动同样成立 | 组件测试只锁写页载荷。退出再启动留真机 | 真机项本次不跑 |
| D-11 | 换篇不串态。旧响应不改新篇的页码、标题、提示 | 组件测试注入迟到响应 | 本批换篇路径是回库再打开 |
| D-12 | 离开后旧 `(id, generation)` 的保存被丢弃，界面无提示 | 组件测试 | 服务端拒绝是已有行为，UI 仍要丢弃迟到响应 |
| D-13 | 读不到：整屏标题「无法打开此文件」，加原因句和「返回文献库」。无路径、无码、无「解析」 | 组件测试 | 原因句见下面的屏。不写「原文件没有被修改」 |
| D-14 | 任何位置都不出现「已保存」 | 走查测试的渲染文本 | 实现阶段要满足 |
| D-15 | ‹、菜单「返回文献库」、Alt+←（无历史）回库并 revoke；Esc 不回库 | 组件测试。mac 的 ⌘[ 同一条规则，本批不做 mac 真机 | 2A。本批没有位置历史，所以这两键直接回库 |
| D-16 | ‹ 有名称，tooltip 含快捷键；焦点可见；状态 `role=status` 不重复播 | 组件测试锁名称与 `role`。讲述人留真机 | 实现阶段要满足名称与 role |
| D-17 | `forced-colors` 与界面 200% 下打开、滚动、回库可用 | 只列真机，本次不跑 | 不新增 token |
| D-18 | UI 里没有「页码是否合法 / 能否保存」的判断；夹页只调 `clampPage` | 评审看 diff。测试不渲染 UI 去重算夹页 | P7 |
| D-19 | AC-11 的降级说明：未满足 / 待补 | 不渲染 chip 文字。不删 [docs/prd/06-01.md](../prd/06-01.md) 的 AC-11 | 未满足 / 待补 |
| D-20 | PRC-10：未满足 / 待补 | 同 D-19。D 的截图不能当 PRC-10 的证据 | 未满足 / 待补。PRC-10 的定义未入库，只沿用设计稿编号，不把编号写进 PRD |

不把 ③ 标成完成。转到页码、位置历史、缩放、栏位切换仍属 ③，本批不实现，也不在验收表里打勾。

## 调用顺序

打开一篇已入库文献时，界面按这张表调用已经暴露的命令。不新增 IPC，不含 `reader.setPage`。「落实」指该次 invoke 的 Promise 已经完成。

| 步 | 调用 | 开始条件 | 页 | 失败 |
| --- | --- | --- | --- | --- |
| 1 | `ingest.openDocument({ id })` | 双击该行，或该行已选中且焦点在该行上时按 Enter | UI 不传页。用例内部写回它刚读到的页和 `openedAt`。这一次不是界面保存 | `not_found`：整屏「文献库里没有这篇文献。」其他失败码：整屏「现在读不到这份 PDF。」不进入第 2 步 |
| 2 | `library.bindReadingAsset({ id })` | 第 1 步落实且 `ok` | 不写 `progress_page` | `not_found`：同一句「文献库里没有这篇文献。」其他失败：整屏「现在读不到这份 PDF。」 |
| 3 | `library.getProgressPage({ id, generation })` | 第 2 步落实且 `ok`。`generation` 用 bind 返回的那个数 | 只读 | `not_found`、`rejected`、`invalid_payload`、`sender_rejected`、`handler_threw`：不挡阅读，从第 1 页起，加下面的 StatusLine。不说成解析失败 |
| 4 | 用 bind 返回的 `assetId` 读 `oi-asset://asset/<assetId>` | 第 2 步已落实。可以和第 3 步并行，但必须在第 2 步之后 | 不写页 | 协议 404、PDF.js 打不开、或下面的 CSP 停点：整屏「现在读不到这份 PDF。」界面不区分这些原因 |
| 5 | 显示 | 第 4 步可读，并且第 3 步已经落实 | 见下段。这一步不调用 `setProgressPage` | 没有可显示的页：整屏错误，不留空白原文栏 |
| 6 | `library.setProgressPage` | 只在视口已经落在要显示的页之后。可见页变化并落定，或离开前补一次 | 请求带第 2 步那一对 `(id, generation)` 和当前可见页 | 失败不弹窗，不出现「已保存」。响应的一对不是当前打开的一对：丢弃，不改界面 |

第 5 步的显示，UI 不自己判断页码合法：

1. 读页成功且 `progressPage` 是正整数：可见页用 `clampPage(progressPage, pageCount)` 的返回值。`pageCount` 来自这份 PDF 已经打开后的页数。夹过的值不在这一步写回。
2. 读页成功且 `progressPage` 是 `null`：从第 1 页显示。仓库规格没有这一句。[docs/arch/02-05.md](../arch/02-05.md) 只写读页成功可以是 `null`，契约注释同样只写「成功页可以是 null」。这里跟设计稿 G6，不把它写成已有规条。
3. `clampPage` 返回 `undefined`：没有可显示的页，走整屏错误。UI 不另写 `if (page > pageCount)` 来决定显示或能否保存。

视口还没落到恢复页上时，第 6 步的调用次数是 0。刚显示恢复页本身不算「页变化」，不立刻保存。夹过的值因此不会在打开当下写回。

离开前的那一次补写，写的是当时的可见页。若可见页只因为夹页才和库存不同，这一次会把夹过的值写进去。这是设计稿「不立即写回」和「离开前补一次」放在一起时的读法，不是仓库里已有的句子。Forge 若要求夹过的值离开时也不写，就停，不在实现里选另一边。

`null` 页同样不在打开当下写成 1。用户没有翻页就离开时，补写的是当时可见的第 1 页。这也跟设计稿的离开补写，不是仓库规条。

落定：可见页这个数变了，并且原文栏的滚动已经结束。用滚动容器的 `scrollend`，不新写一个毫秒数。DESIGN 把骨架时延和保存间隔标成待定标。骨架沿用 DESIGN 已写的「超过 200ms 才显示」（[DESIGN.md](../../DESIGN.md) 第 155 与 396 行），仍标待定标，不另定。`prefers-reduced-motion` 下骨架不闪。

当前页（G17）：两页同时出现在原文栏里时，哪一页算当前页，DESIGN、PRD、ARCH 02-05 / 09 / 09-01 都没写。建议（不是已有规条）：取与原文栏视口相交高度最大的那一页；相交高度相同则取页码较小的一页。这个数是显示几何。保存时只把这个整数交给已有的 `setProgressPage`。Forge 若不接受这个建议，实现停在写页之前，不另造一套规则装成规格。

迟到响应：界面记住当前打开的那一对。写页或读页的响应里，`id` 或 `generation` 对不上，就不改页码、标题、错误页和 StatusLine。离开或换成另一篇之后，旧的一对一律丢弃。

## 文献库怎么改

只改打开手势，不改视觉，不做 B16，不渲染行内「⋯」和右键菜单。

[library-table.tsx](../../packages/features/library/src/ui/library-table.tsx)：

- 增加 `onOpen(id)`。单击仍只调用 `onSelect`。
- 双击改为调用 `onOpen(row.id)`。删掉「只 `preventDefault`、不打开」的处理。
- Enter：仅当这一行已经是选中行（`aria-selected`）时调用 `onOpen`。未选中的行按 Enter 不打开。焦点在「打开文件…」上时，Enter 走按钮自己的点击，不打开选中行。
- 右键保持现在的 `preventDefault`，不打开，不加菜单。

[library-app.tsx](../../packages/features/library/src/ui/library-app.tsx) 接收可选的 `onOpen`。没传入时，双击和 Enter 仍然不调用 IPC，避免单测打到生产通道。桌面壳必须传入。传入之后：

- 双击和选中后的 Enter 调用它，不调用 `library.import`。
- 「打开文件…」仍只走现有的 `requestImport`。选中了行也不改成打开那一行。
- 阅读屏盖住文献库时，文献库不再响应双击、Enter、打开文件和拖入，避免两篇叠在一起。回库后恢复。

文献库节点不卸载，用来留住列表滚动和选中行（DESIGN 第 159 行）。阅读期间对它设 `inert`。不新增 token。回库后再调一次现有的 `library.list`，让「最近」用上 `openDocument` 已经写入的 `openedAt`。排序仍由已有的 list 完成，UI 不自己排。

本批不把首次单个导入接进阅读。导入成功后的行为保持现在的留在文献库。K4 里「单个首次导入成功进阅读器」留到以后，不在本批标成完成。

## 阅读屏

复用 DESIGN 已有组件的职责和名字。仓库里还没有这些组件，实现时在 `packages/features/reader/src/ui/` 按 DESIGN 的组件表做，不另起控件名，不用 toast，不用模态来报告读页失败。不新增颜色、间距、字号 token，不改 DESIGN 里已有的数。

| 屏 | 显示 | 不显示 |
| --- | --- | --- |
| 打开中 | 标题栏：‹、标题。超过 DESIGN 已写的 200ms 才出页骨架 | 页码数字、进度百分比、「解析中」、主按钮 |
| 原文 | 标题栏：‹、标题、「第 N / M 页」、空白拖拽区、空的 chip 位。原文栏占满其余主区 | Aa、侧栏、大纲、⋯、选区工具条、栏位切换、缩放、「已保存」、chip 文字 |
| 整屏错误 | 标题栏：‹、标题，无页码。标题「无法打开此文件」。次按钮「返回文献库」 | 路径、`assetId`、IPC 码、HTTP 码、「解析失败」、「原文件没有被修改」、诊断导出按钮 |
| 读页失败 | 同原文，从第 1 页起。页码旁 `StatusLine`：「没能读到上次的位置，已从第 1 页开始」 | 弹窗、重试、恢复成功时的任何提示 |

原因句只有两句，按失败来源选，不靠 UI 猜测：

- 第 1 步或第 2 步返回 `not_found`：「文献库里没有这篇文献。」
- 其余打不开，包括协议 404 和 PDF.js 加载失败：「现在读不到这份 PDF。」

`ingest.openDocument` 的失败码里没有 `not_pdf`。协议 404 也不带这个码。本批不显示「文件不是 PDF」，也不在 UI 里调用 `looksLikePdf` 来决定这句话。

‹ 是 `IconButton`：`aria-label`「返回文献库」，tooltip 含 Alt+←。它不是主按钮。阅读屏主按钮个数是 0。文献库唯一主按钮仍是「打开文件…」。

chip 位留在标题栏上，不渲染文字，不渲染「未配置」。AC-11 的降级部分与 PRC-10 在本批标「未满足 / 待补」。

StatusLine：`role=status`，文案出现时播一次。用户滚动，或换成另一篇，或回到文献库之后，这行消失。不可点击。

键盘：本批不做转到页码，所以不劫持 PageUp、PageDown、Home、End、Space，让原文栏自己滚动。Alt+← 无历史时走离开。本批不记录位置历史，因此 Alt+← 直接离开。mac 的 ⌘[ 按 2A 同一条规则，本批不测 mac。Esc 不离开，也不退出全屏（全屏行为不在本批改）。

离开的触发：‹、菜单「返回文献库」、Alt+←。顺序是：先停止再发新的保存；补一次最后的可见页，但不等这次 `setProgressPage` 返回；然后调用 `revokeReadingAsset`，用的是当前这一对；revoke 已经发出后就切回文献库，不等它成功。保存失败或 revoke 失败都不挡住离开，也不弹窗。还没有 bind 成功时，没有一对可撤销，直接切回。进程退出不等最后一次保存。

菜单：在现有「文件」菜单加一项「返回文献库」。点击后向渲染进程发一次事件，由阅读屏走上面的离开顺序。已在文献库时，这次点击不切屏、不 revoke。不为此新增 IPC。DESIGN 第 707 行写不可用项置灰；置灰要让 main 知道当前场景，那会是新的状态通道。本批不做。这项缺口记在这里，不假装已经置灰。

换篇：本批只走「回库，再打开另一行」。阅读屏上不接拖入，也不把 Ctrl+O 接成第二篇。若阅读期间文献库仍在树里，它必须忽略打开手势，见上一节。

## 文件与模块边界

本两笔只加本文件和台账一行。下面是 PASS 之后的编码位置，现在不改。

G18：`tools/check-one-slice` 在同一个 PR 改了两个 `packages/features/<切片>/src/` 且没有 ADR 时失败。本批不写 ADR 来过这道门。编码拆成两笔 Draft（Forge 排序，非业主决定），都等本计划 PASS 之后，都不在本 PR 里开工：

1. 文献库手势：只改 `packages/features/library/src/ui/` 里的表格和 `LibraryApp`，以及对应的 UI 测试。交出 `onOpen`。不 import reader，不画阅读屏。
2. 阅读屏：只改 `packages/features/reader/src/ui/` 与 `apps/desktop` 的壳、菜单和测试。不改 `packages/features/library/src/`。

| 路径 | 只做的事 | 现在动不动 |
| --- | --- | --- |
| `library-table.tsx`、`library-app.tsx`、`library-screen.test.tsx` | 上一节的手势 | 本两笔不动 |
| 新建 `packages/features/reader/src/ui/` | 阅读屏、页码读出、错误页、StatusLine、打开顺序的调用 | 本两笔不动 |
| `packages/features/reader/package.json` | 加 `./ui` 出口，照 library 的 `./ui` 指向 `src/ui/index.ts`。UI 用到 React 时补上包内已有版本的依赖 | 本两笔不动 |
| `apps/desktop/package.json` | 增加 workspace 依赖 `@oi/feature-reader`。锁文件只由包管理器重写，不手改 | 本两笔不动 |
| `apps/desktop/src/renderer/main.tsx` | 在文献库之上盖阅读屏，把 `onOpen` 接上 | 本两笔不动 |
| `apps/desktop/src/renderer/slots.ts`、`composition-root.ts` | 目标 diff 为 0。场景不塞进热点 | 本两笔不动 |
| `library-menu.ts` 与它的测试 | 加「返回文献库」 | 本两笔不动 |
| 新建 `apps/desktop/src/renderer/reader.css` | 只引用已有的 `--oi-*` 与 `--oi-reader-*` | 本两笔不动 |
| `csp.ts`、协议、`pdfjs-document.ts`、`pure.ts`、domain、application、contracts、codegen | 不改 | diff 0 |

UI 只能经本切片的 `src/pure.ts` 使用 `clampPage`（[docs/arch/05-01.md](../arch/05-01.md) 第 25 行；dependency-cruiser 的 `ui-through-seam` 禁止 UI import domain、application、adapters 和 `index.ts`）。原文栏可以 import 本包已有的 `pdfjs-dist`，初始化对象保持 `{ data, isEvalSupported: false }`，不从 adapter 文件 import `pdfjsInitParameters`。不设置 `disableRange`。不写 `disableRange: false`。

一个文件只做一种事：取数、展示、或装配。函数不超过 80 行。热点若不得不改，每个文件不超过 30 行，并在该编码 PR 的描述里声明。

## 架构硬约束

- 业务规则在 core。UI 不判断页码是否合法、这次能不能保存、这篇是不是因为解析失败才打不开。
- 夹页只调用已导出的 `clampPage`。
- seam 不够用就停。本批不改四条阅读命令和 `openDocument` 的请求、响应、错误码、`expose`。
- 不把整份 PDF 字节放进新的或旧的 IPC。[docs/arch/09.md](../arch/09.md) 第 20 行：renderer 只接收 `assetId`，不接收绝对路径，不接收整份 PDF 字节。
- 不改 CSP。不授予 `bypassCSP`、`supportFetchAPI`、`connect-src oi-asset:`、`wasm-unsafe-eval`、`blob:`。
- 协议仍只 GET / HEAD，不写 Range，不返回 206。
- 不改 `session.save` / `session.restore`。不实现整窗恢复。UIX-57 保持未验收。
- 日志若以后要加，不得含路径、正文、`assetId`。本两笔不改日志。
- core 目录在 UI 编码里的 diff 是 0。核心测试必须仍能在没有界面时跑。本两笔不跑、也不改那些测试。

## CSP 停点

已知证据不够，也不能说成「已经读不到」。

[docs/evidence/190/commands.md](../evidence/190/commands.md) 第 91–99 行只记录了 main 进程的 `net.fetch`。没有 `BrowserWindow`，响应自己也没有 CSP 头。PDF.js 6.5.438 没有参与。ARCH 第 25 行和第 32 行把「现行 CSP 能否让 renderer 经 `oi-asset://` 读到这份 PDF」以及 PDF.js 是否需要 `wasm-unsafe-eval` 与 `blob:` worker，标成待 M2 实测。任何放宽都要先有 ADR。

实现阶段的第一件和 PDF 有关的事，是在真实窗口里核对，而不是改协议：

1. 用现行 `csp.ts`，经 `oi-app://` 打开页面。
2. 页面里的 PDF.js 以 `isEvalSupported: false` 读取 `oi-asset://asset/<assetId>` 的字节，再交给现有的 `data: Uint8Array` 初始化。不设置 `disableRange`。
3. 记录能不能画出第一页。证据写进该编码 PR 的 `docs/evidence/<PR号>/`。

若读不到、画不出，或只有改 CSP、加 `supportFetchAPI`、加 `blob:` / `wasm-unsafe-eval`、写 Range、把 `disableRange` 设成 false、或经 IPC 送整份字节才能画出来：停。不改 `csp.ts`，不改 ARCH 的 CSP 草案，不在 D 里自造另一条读文件的路。先写 ADR，再请 Wisdom 决定。本计划不写那份 ADR。

这三项没有窗口证据，同样算停点里的未核实，不在 D 里用实现去绕：

- PDF.js 在 sandbox 渲染进程里要不要单独的 worker 文件。现有打包只把 `main.tsx` 打成 `apps/desktop/src/renderer/main.js`，该文件在 gitignore 里。
- 服务端不回 206 时，PDF.js 默认会不会自己去要 Range。本批的协议不提供 206，初始化参数也不写 `disableRange: false`。
- 8 GB 内存上打开大 PDF 的行为。

## 原文件那句

不使用「原文件没有被修改。」

核对过的代码：协议只 `readFileSync` 副本 `source.pdf`；路径来自 `librarySourcePath`，不是用户当时选择的原路径；`openDocument` 不打开 PDF 文件，它写的是库里的 `openedAt` 和刚读到的页。没有做打开前、打开后的文件字节比对，所以还不能把这句写进错误页。DESIGN 第 350 行有这句，本批不照搬，也不改 DESIGN。

诊断导出：desktop 与 features 里都没有可用入口。UIX-14 写 M2 前入口不渲染，DESIGN 第 520 行也写导出入口在 M2 前隐藏。错误页不渲染「导出诊断包…」。

## 明确不含

配置存储、密钥、`settings.saveParseService`、`settings.getParseServiceStatus`、`parsing.getParseCapabilities` 的接线、降级 chip 的实现。转到页码、位置历史、缩放、栏位切换。首次单个导入直接进阅读。译文、笔记、问答。`session.save`、`session.restore`、整窗恢复。新 IPC，含 `reader.setPage`。改 CSP。写 Range，或把 `disableRange` 设成 false。Ready、合入、发版。改 DESIGN 正文和原则正文。把 AC-11 或 PRC-10 标成通过，或从文档里删掉。

## 测试计划

实现阶段用组件测试，假的 `window.oi`。不在本两笔里加测试，也不把以前的通过数写成这一批。

文献库：

- 传入 `onOpen` 后，单击只选中，不调用 `onOpen`。
- 双击调用一次，参数是该行 id。
- 选中后在该行按 Enter 调用一次。未选中的行按 Enter 不调用。
- 点击「打开文件…」不调用 `onOpen`，仍只走导入。
- 现有「双击和 Enter 不增加 IPC」的断言改成：没传 `onOpen` 时仍然不增加；传了就只调用回调，不调用 `library.import`。

阅读屏：

- 顺序：`openDocument` 落实之后才出现 `bindReadingAsset`，bind 落实之后才出现 `getProgressPage`。落定前 `setProgressPage` 的次数是 0。
- 正整数页显示 `clampPage` 的结果。大于页数时显示末页，落定前写页次数是 0。
- `null` 显示第 1 页，打开当下写页次数是 0。
- 读页失败出现指定的那一句，`role=status` 只有一个。成功时这句不出现。渲染文本里没有「解析」「已保存」、路径和错误码。
- `not_found` 与其他失败各用上面的那一句原因。没有诊断按钮。
- 迟到的另一对响应不改变当前标题和页码。
- Alt+← 会 revoke 并回到库。Esc 不 revoke。
- 阅读屏内没有名为 Aa、侧栏、大纲、⋯ 的控件，也没有主按钮「打开文件…」。

本两笔不跑全量。实现 tip 的全量按 RULES §4 每个 tip 只跑一次，记在那个 PR 的 `docs/evidence/<PR号>/`。

## 真机项

本次不实跑。实现 PR 也不要用 Box 或高配机器代替下表。没有对应机器就在该 PR 标「未验证」。出处是 2026-11-05 22:13 与 2026-11-08 23:45。

| # | 要看的 | 证据 | 机器 |
| --- | --- | --- | --- |
| R1 | 单击选中、双击打开、Enter 打开 | 录屏，加选中态和进入阅读的截图 | Windows 真机 |
| R2 | 打开中的骨架，若超过 200ms | 截图 | 同上 |
| R3 | 默认原文，滚动全篇 | 录屏，加首页和末页截图 | 同上 |
| R4 | 读到第 N 页，回库，再打开仍是第 N 页 | 录屏，加两次页码截图 | 同上 |
| R5 | 退出应用再启动，打开同一篇 | 录屏加截图 | 同上 |
| R6 | A 的第 N 页回库后再开 B | 录屏加 B 的截图 | 同上 |
| R7 | 注入读不到时的整屏错误 | 截图。注入方式在实现 PR 写明 | 同上 |
| R8 | 读页失败的那一行已批文案 | 截图 | 同上 |
| R9 | `forced-colors` 与界面 200% | 截图 | 同上 |
| R10 | 8 GB Windows 上打开、滚动、重开 | 录屏加截图 | 8 GB。没有就标未验证 |
| R11 | 降级 chip | 不做。D 的图不能当 AC-11 证据 | 等以后的配置批 |

M1 真机和 `.md` 录屏仍是 M2 整格的退出条件，不在本批，不删除。

## 计划 / 实际

实际列在对应提交之后才填。本文件这一笔保持空白。第二笔只改台账，不回填本表。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件。第一笔只有它 |  |  |
| 2 | 只在台账追加 09:12，129 改为 130。然后停 |  |  |
| 3 | Forge 亲读步骤 1 与步骤 2。PASS 之前没有实现 |  |  |
| 4 | PASS 之后按「文件与模块边界」编码。先做 CSP 那一节的窗口核对。读不到就停 |  |  |

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 「批准」；随后问「对吧？这个这一批的是不是都实现完了？咱们按照那个项目进度是不是应该开那个P4D的？」；并确认「批次D」 | 开工批次 D。实施批准。先计划与台账，Forge 亲读 PASS 之后才编码。这句不是计划 PASS。链接见第二笔台账行，来源 [6756038040](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6756038040) | 2026-11-10 09:12；09:13 确认 | Wisdom |
| `null` 页从第 1 页起，只跟设计稿 G6 | 仓库规格没写。不升格成规条 | 2026-11-10 | 本计划，依据设计稿，非业主新决定 |
| 两页同屏时取相交高度最大的一页，相同则取较小页码 | 规格没写。只是建议。Forge 不接受就停 | 2026-11-10 | 本计划的建议，非业主决定 |
| 编码按 G18 拆成文献库手势和阅读屏两笔 | 不写 ADR 去合并两个切片的 `src/` | 2026-11-10 | Forge 排序，非业主决定 |
| 错误页不用「原文件没有被修改」 | 读路径没有做字节比对 | 2026-11-10 | 本计划，依据还没核实 |
| 09:01 的 PR #191 追认不补进本 PR 台账 | 用户要求只注记、不补更早的批准 | 2026-11-10 | 本任务范围，非新的业主决定 |

## 自检

- [ ] 影响 arch / prd 吗？不影响。本两笔不改规格，不加 [docs/spec-changelog.md](../spec-changelog.md)。
- [ ] D-19、D-20、AC-11、PRC-10 都还在，没有标成通过。
- [ ] 实现前的 CSP 窗口核对写在上面。读不到就停，不改 CSP。
