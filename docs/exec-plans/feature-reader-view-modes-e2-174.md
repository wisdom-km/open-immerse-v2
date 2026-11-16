# 执行计划

E2，阅读屏栏位分段和已批空态。基线是 main `dc35b82bb2682f83f87ef5af268975a9dba5dacc`。唯一 parent 是 `4e1d7ec64907147a56405a7bc37430f38f45cfb0`，tree 是 `541b99575dc2446ee057b3104a2e2c887046ca0e`。2026-11-16 已核对 `origin/main` 仍是这个 SHA。若审查时 main 已前移，实现从当时的 main 另开，本文件不改写成新基线。

本文件名是用户指定的 `feature-reader-view-modes-e2-174.md`，对应以后的实现主题。本 PR 的分支是 `feature/reader-view-modes-e2-plan-174`，只交计划和台账。[docs/exec-plans/README.md](README.md) 写文件名与分支同名。这里按指定文件名留在原地，避免实现阶段再改名。

本 PR 不写产品代码，不改测试，不改 CI，不改 CSP，不改 PRD、ARCHITECTURE、RULES、DESIGN 正文。不开 Ready，不合入，不发版。Forge 审查本计划通过之前不实现。实现范围以审查通过后的本文件为准。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 现状理解

- 现在已有的行为：缩放 2a / 2b 已合入。打开 PDF 进入阅读屏，画原文页。视图菜单已有「原文」「对照」「译文」，Windows 是 Ctrl+1/2/3，mac 是 Cmd+1/2/3，点击只 `dispatchEvent`。`shell.tsx` 不听这三项。工具栏没有栏位分段。没有空态句。`open-session` 把 `viewMode` 写成 `original`。契约写明不发明 `reader.setViewMode`，页码与栏位留在 renderer。R-E13 未验证：DESKTOP-0GI64S8 是 32GB，Anvil 第 2–4 步未运行。不以 32GB 或限制系统内存代替真 8GB，不标 PASS。
- 相关的节：[批次 E 计划](feature-reader-nav-zoom-174.md) 的栏位行、验收第 1 条、菜单表、G-7、与 PR #205 的空态接缝、R-E6；[DESIGN.md](../../DESIGN.md) §4.1、§4.5.1a、§11.4；[docs/design-principles.md](../design-principles.md) P4、P5、P7；[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1、§6；[docs/arch/06.md](../arch/06.md)。6-1 A（台账 2026-11-14 14:13，[评论 6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563)）默认原文、不记住，空态用已批原句。这覆盖 DESIGN 第 156 行的默认「对照」和 §11.4 的恢复视图。不改 DESIGN 正文（N-10）。
- 还没做的部分：栏位 `radiogroup`、对照的左原文右空态、译文的整个主区空态、菜单事件接到这次打开的栏位。不接翻译，不改 PDF 画页比例。Loom 的原则复核还在进行，本文件不把它写成已通过。

## 目标

一次打开里可以在原文、对照、译文之间切换。默认原文。离开后再打开，仍是原文，不记住。对照是左栏原文、右栏空态。译文是整个主区空态。空态句子是「本阶段暂不提供译文，请先阅读原文。」文字链接在 Windows 是「切到原文（Ctrl+1）」，在 mac 是「切到原文（⌘1）」。没有「开始翻译」，没有「去设置」。点链接或按 Ctrl+1 / ⌘1 回到原文，页码不变，缩放百分比不变，不入位置历史，不发翻译请求，不改画页比例。

## 已批来源

| 决定 | 原话与范围 | 出处 |
| --- | --- | --- |
| 6-1 A | 「6-1 按推荐 A：空态文案「本阶段暂不提供译文，请先阅读原文。」加「切到原文（Ctrl+1）」链接，mac 显示 ⌘1」。没有「开始翻译」，没有「去设置」 | 台账 2026-11-14 14:13，[6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563) |
| 6-3 A | 文献库里这几项不置灰，点了不起作用。「主进程知道当前界面」挂进 M2 退出格，本批不做 | 同一条 |
| 栏位不记住 | G-7。没有 `setViewMode`。每次打开原文 | [批次 E 计划](feature-reader-nav-zoom-174.md) |
| 空态接缝 | `view-mode-empty-copy` 放 6-1 A。`view-mode-empty-degrade` 本批没有文字。降级句等 E2 合入后由 PR #205 第 3 笔再填 | 批次 E 计划「与 PR #205 的空态接缝」。15:13 已把第 3 笔的前置改成等 E2 合入 |
| 先做 E2 | 「按推荐：R-E13 记为未验证遗留，先做 E2；有真 8GB 机器后在当时的 main 上补测」 | 2026-11-16 11:08，[6906182172](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6906182172)。台账行在本 PR 第二笔 |

R-E13 保持未验证。E2 的实现和验收都不改 Windows 或任何系统设置，不用限制内存的办法重跑 R-E13，也不把 R-E13 标成 PASS。

## 代码位置（dc35b82）

行数是这一版的物理行数。

| 位置 | 现在 | E2 怎么用 |
| --- | --- | --- |
| `packages/features/reader/src/ui/reader-screen.tsx` | 258 行。`ReaderScreen` 第 28–105 行，78 行 | 只拼装。见下面的行数预算 |
| `packages/features/reader/src/ui/copy.ts` | 18 行 | 只加 6-1 A 的句子和两句链接文字 |
| `packages/features/reader/src/ui/use-bound-nav.ts` | 69 行 | 用已有的展开写法，把三个栏位命令并进 `ReaderNav` |
| `apps/desktop/src/renderer/shell.tsx` | 147 行 | 听已有的三个事件，转成命令。字面值仍只在 `shell-events.ts` |
| `apps/desktop/src/renderer/shell-events.ts` | 12 行 | 已有 `viewOriginalEvent`、`viewBilingualEvent`、`viewTranslationEvent`。不改 |
| `apps/desktop/src/renderer/reader.css` | 136 行 | 只加并排和焦点。沿用本文件已有的 token 和 `Canvas` / `CanvasText` 后备。不新造颜色 |
| `apps/desktop/src/main/library-menu.ts` | 94 行 | 不改。三项和加速键已经在 |
| `packages/features/reader/src/pure.ts` | 已导出 `READER_VIEW_MODE_ORIGINAL` | 不改 |
| `packages/contracts/src/ipc/reader.ts` | 第 22 行写明不发明 `reader.setViewMode` | 不改 |
| `packages/features/reader/test/ui/reader-screen.test.tsx` | 736 行。`barSlots()` 现在期望 `gap zoom-controls chip`。第 65 行负向匹配不动 | 只改栏位插上之后的槽位断言 |
| `apps/desktop/e2e/reader-nav.spec.ts` | 287 行。已有 `clickMenu` | 菜单点击走这里。加速键不走这里 |
| `apps/desktop/test/library-menu.test.ts` | 100 行 | 不改。菜单标签和加速键保持原断言 |

## 模块边界

任务类型是 UI 改动。切片是 reader 的 `src/ui`，加上 desktop 的 renderer。core 不动：不改 `domain/`、`application/`、`index.ts`、`pure.ts`、`contracts/src/ipc/**`，也不改 `packages/features/library/src`。

栏位是这一次打开的界面状态，放在新建的 `use-view-mode.ts`。初值是原文。文档 id 变化时回到原文。不写 `localStorage` / `sessionStorage`，不写回 `ReaderSession.viewMode`，不调用 IPC。domain 里的 `viewMode` 保持打开时的 `original`。

`reader-screen.tsx` 不承接切换、空态和分栏。三件分三个文件：

- `view-mode-switch.tsx`：栏位分段。只负责三选一。
- `view-mode-empty.tsx`：6-1 A 的句子、文字链接、空的降级插入点。
- `view-mode-panes.tsx`：按栏位决定主区放什么。原文只放现有 `PageColumn`。对照是左栏现有原文、右栏空态。译文只放空态。

优先系统行为。分段用原生 `<input type="radio" name="同一组">`，包在 `<fieldset>` 里，`<legend>` 的文字是「栏位」。每个单选的可访问名称是「原文」「对照」「译文」。选中态用原生的 `checked`，由它带出 `aria-checked`。焦点在这一组里时，← / → 用浏览器自己的单选组行为，不另写 `keydown`。不用 `div` 加 `role="radiogroup"`。不用 `appearance: none` 去掉系统外观。选中不只靠颜色。

快捷键只走已经注册的菜单加速键。`shell.tsx` 把三个事件转成命令，写法对齐现在的 `zoomCommand`：单独一个小函数，不把三个分支堆进 `menuAction`。reader 包不出现 `oi-view-original` 这三串字面值，也不订阅 window。同一个键不走第二套 `keydown`。

菜单项保持现在的普通项。不加 `type: "radio"`，不加勾选。勾选要主进程知道当前栏位，而 6-3 A 已把「主进程知道当前界面」挂进 M2 退出格。互斥由工具栏这一组原生单选表达。`library-menu.ts` 不改。

空态不放 `role="status"`。不使用 toast，不用对话框。链接不是主按钮。`data-testid="view-mode-empty-degrade"` 的节点在，调用点不传降级句，文本是空的。组件可以接受可选字符串，E2 的调用不传。不写「未解析 / 去配置」，不接 `parsing.getParseCapabilities`。

切栏位不调用历史的 jump / back，不改缩放百分比，不改 `paint` 的比例参数，不改页码。加载中仍是现有骨架，出错仍是现有错误页。空态只替换已经能画出的主区。切到译文或离开原文栏时卸下 `PageColumn`，停止绘制；切回原文时仍是同一页。页内滚动位置没有已批规格，本计划不另做恢复。若卸下或挂回改写了页码、缩放或历史，就停。

linux 的链接文字走 Windows 那一句「切到原文（Ctrl+1）」。分叉方式沿用缩放 tooltip 已有的 mac / 非 mac，不新造第三句。

## 行为

- 打开是原文。分段里「原文」为选中。主区是现在的原文栏。
- 对照：左栏仍是现在的原文栏，画页比例和缩放百分比不变。右栏是空态。
- 译文：整个主区是空态，原文栏不在。
- 空态里 `view-mode-empty-copy` 的文本等于「本阶段暂不提供译文，请先阅读原文。」链接的可访问名称在非 mac 等于「切到原文（Ctrl+1）」，在 mac 等于「切到原文（⌘1）」。两处都没有「开始翻译」，没有「去设置」。
- 点链接，或菜单「原文」，或 Ctrl+1 / ⌘1，回到原文。页码文字不变，缩放百分比不变。
- 切栏位不入位置历史。后退栈不变。
- 再打开同一篇或另一篇，都是原文。
- 文献库里菜单三项仍不置灰。阅读屏已卸下时，事件没有监听者，状态不变。不另写「不在阅读屏就丢掉」。
- 不出现翻译请求。测试看现有阅读 client 的调用记录，不新增翻译 IPC，也不发网络请求。

## 行数预算

口径是 [docs/arch/06.md](../arch/06.md) 的物理行。普通源文件建议 400、硬上限 600。React 组件文件建议 250、硬上限 400。测试建议 600、硬上限 800。函数建议 50、硬上限 80。ESLint `max-lines-per-function` 是 80，空行和注释都算。`ReaderScreen` 现在 78 行，再加栏位钩子就会过 80。所以实现的第一笔先把离开接线移出去，不改行为。

`reader-screen.tsx` 现在 258 行，已经超过组件建议上限 250。E2 不把分段、空态、分栏写进这个文件。抽出离开接线之后，这个文件回到 250 以下，再只加拼装。停在 250。超过 250 就停下报告，不写「为什么不拆」来继续往里堆。函数超过 80 同样停下。

`reader-screen.test.tsx` 现在 736 行，已经超过测试建议上限 600，离硬上限 800 还有余量。E2 只改 `barSlots()` 那一条期望。新行为写进新测试文件。不删已有测试来凑行数，也不把新用例挪进这个文件。

`check-pr-size` 统计 `git diff --numstat` 的新增加删除，生成文件除外，上限 600。下表是非生成行。一份实现 PR 的估算要 ≤ 346，乘 1.73 才仍 ≤ 600。1.73 来自 PR #212：`(755 − 436) / 436`。超过 346 就停下，把 `git diff --numstat` 的实际行数和拆分建议报给 Forge。不写 `G12:`，不把下一份的文件塞进这一份，不把 PR 标成 Ready。

| PR | 装什么 | 估算 | ×1.73 |
| --- | --- | --- | --- |
| 本 PR | 本文件和台账。没有产品代码 | 文档 |  |
| E2-0 | 把 `ReaderScreen` 里的离开接线移到 `use-reader-leave.ts`。行为不变。现有 `reader-screen` 测试仍覆盖离开 | 72 | 125 |
| E2-1 | 栏位状态、原生分段、空态、对照和译文的主区、菜单事件、并排所必需的样式、对应单测 | 338 | 585 |
| E2-2 | `clickMenu` 的 e2e、mac / 非 mac 链接文字的第二支、shell 事件单测、`forced-colors` | 109 | 189 |

E2-0，合计 72。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/use-reader-leave.ts` 新建 | 36 | 36 | 不会。普通文件 |
| `packages/features/reader/src/ui/reader-screen.tsx` | 36 | 229 | 删掉移走的行，加上钩子调用。组件建议 250。`ReaderScreen` 函数降到 80 以下，并给 E2-1 留出余量 |

E2-1，合计 338。338 × 1.73 = 585。余量是到 346 的 8 行。某一格比预算少，别的格可以用这 8 行。合计超过 346 就停。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `use-view-mode.ts` 新建 | 36 | 36 | 不会 |
| `view-mode-switch.tsx` 新建 | 60 | 60 | 不会。组件建议 250。函数停在 80 |
| `view-mode-empty.tsx` 新建 | 40 | 40 | 不会 |
| `view-mode-panes.tsx` 新建 | 40 | 40 | 不会。不在这里创建栏位状态 |
| `copy.ts` | 8 | 26 | 不会 |
| `reader-screen.tsx` | 10 | 239 | E2-0 之后约 229。这里只调用钩子、把栏位传给栏和主区。停在 250 |
| `reader.css` | 22 | 158 | 只写并排。不写新颜色，不去掉原生单选外观 |
| `shell.tsx` | 14 | 161 | import 三个已有名字，`MenuNav` 加三个命令，`names` 加三项，新建 `viewCommand`。不改 main |
| `use-bound-nav.ts` | 8 | 77 | 展开写法，与缩放相同 |
| `view-mode-switch.test.tsx` 新建 | 36 | 36 | 不会 |
| `view-mode-empty.test.tsx` 新建 | 32 | 32 | 不会 |
| `view-mode-panes.test.tsx` 新建 | 22 | 22 | 不会 |
| `reader-screen.test.tsx` | 6 | 742 | 只改槽位断言。已超过建议上限 600。这一笔的正文写明：断言本来就在这个文件，新用例在新文件，所以不拆。不删测试 |
| 本文件「实际」列的回填 | 4 |  | 文档 |

E2-2，合计 109。只在 E2-1 合入之后，从当时的 main 另开。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `apps/desktop/e2e/reader-nav.spec.ts` | 45 | 332 | 用 `clickMenu("对照")` 和 `clickMenu("原文")`。不在 CI 里按 Ctrl+1/2/3。PR #212 已证实 Playwright 按键不会触发菜单加速键 |
| `reader.css` 的 `forced-colors` | 16 | 174 | 沿用已有焦点环写法。不新造颜色 |
| 链接文字的 mac / 非 mac 第二支 | 24 |  | 放在空态测试文件。测试建议 600 |
| shell 收到三个事件后栏位改变 | 20 |  | 卸下后再派发，状态不变 |
| 本文件「实际」列的回填 | 4 |  | 文档 |

## 验收与测试

本 PR 不跑 Vitest。实现 PR 才跑。只断言行为，不读源码文本做断言。

单测：

- 组的可访问名称是「栏位」。三个原生单选的名称是「原文」「对照」「译文」。打开时「原文」为选中。
- `view-mode-empty-copy` 的文本等于「本阶段暂不提供译文，请先阅读原文。」
- 链接名称等于「切到原文（Ctrl+1）」或「切到原文（⌘1）」，两支都测。没有「开始翻译」，没有「去设置」。
- `view-mode-empty-degrade` 的文本是空的。不用 `/解析/` 或同类宽正则去匹配空态整段。不改 `reader-screen.test.tsx` 第 65 行。
- 点链接回到原文。对照时原文栏还在，译文时原文栏不在。页码和缩放百分比不变。历史的后退状态不变。
- 换文档 id 之后回到原文。
- 加载中仍是骨架，出错仍是现有错误页。
- 阅读 client 上没有新增的翻译调用。

e2e 只覆盖菜单点击：`clickMenu("对照")` 之后看见空态句，`clickMenu("原文")` 之后原文栏回来。不把这条写成加速键已覆盖。

真机清单。Box 和 Playwright 不能代替。没有对应设备就标未验证，不标 PASS。本计划不授权修改显示缩放、高对比、内存或任何系统设置。

| 编号 | 内容 |
| --- | --- |
| R-E6 | 人手物理键盘：Windows Ctrl+1/2/3，mac ⌘1/2/3。对照和译文两种空态，再回到原文。页码不变。不发翻译请求。没有 mac 就标未验证 |
| R-E6b | 页码框有焦点时，Ctrl+1/2/3 或 ⌘1/2/3 会不会被菜单加速键抢走。只记录。被抢走就停，不加第二套 `keydown`。不修已知的 Ctrl+0 / Ctrl+− |
| 读屏 | Narrator 或 NVDA 读出组名「栏位」、当前选中项和空态句。没有新的批准就不改系统里的读屏安装 |

R-E13 不在本清单里重测。

## 排除项

不改 PRD、ARCHITECTURE、RULES、DESIGN、`docs/design/**`。不改 main 进程、`library-menu.ts`、core、`pure.ts`、contracts、`library/src`。不改 CSP。不加 wasm、`wasm-unsafe-eval`、`.mjs`、`blob:`、`bypassCSP`、协议注册、Range、`disableRange`、整份 PDF 的 IPC。不接翻译，不建 chip，不写降级句。不改画页比例，不改缩放档位，不把栏位写入历史。不修页码框抢走 Ctrl+0 / Ctrl+−。不做 B7，不做菜单置灰。不持久化栏位。不改 Windows 或任何系统设置。不用 32GB 或限制内存给 R-E13 标 PASS。

## 停止点

- 本计划审查通过之前，不写 E2-0、E2-1、E2-2。
- 下面两问没有答复之前，不写 E2-1。E2-0 不依赖这两问，但同样等计划审查。
- 实现时非生成行超过 346，或 `reader-screen.tsx` 超过 250，或任一函数超过 80，就停。
- 对照或译文必须改画页比例、改 core、改 contracts、改 main、改 CSP，才能完成已批行为，就停。把缺的那一项写出来，不在 E2 里改。
- 页码框焦点抢走 Ctrl+1/2/3 时停。不加第二套按键监听。
- 不把 R-E13 标成通过。没有真 8GB 机器就不测。

## 原则待核

Loom 正在做原则复核。下列各项本计划不写成已通过。

- P4：计划用原生单选，不用自绘分段。DESIGN 标题栏画的是分段外观。若复核要求按图自绘，要先有决定，再去掉原生外观，并补高对比。
- P4：菜单不加勾选。批次 E 计划的菜单表写「单选」。勾选和「主进程知道当前界面」是同一类事，6-3 A 已排除。
- P5：空态是主区内容，不是 `role="status"`，也不是对话框。
- P7：栏位留在 renderer，不写回 domain。契约已经这样写。复核若认为这是业务规则，就停，不在 E2 里改 core。
- DESIGN 第 156 行默认对照，§11.4 写恢复视图。已批 6-1 A 和 G-7 是默认原文、不记住。不改 DESIGN 正文。
- 空态元素：已批写的是「文字链接」，又写「不是主按钮」。见下面的待决问题。

## 需要决定的问题

这两问不答，E2-1 不开工。本计划不替它们补设计。

1. 对照的右栏多宽。6-1 A 和批次 E 计划只写了「左原文、右空态」，没有比例。DESIGN 的 38em 是完整译文栏的行宽，不是这句空态。本计划不选 1:1，也不选 38em。译文占整个主区，不依赖这个数；为了不让「对照」先被选中而主区仍是整栏原文，对照和译文仍放在同一笔 E2-1。
2. 文字链接用什么元素。推荐：`<button type="button">`，外观只有文字和下划线，可访问名称是整句，不设 `role="link"`，因为没有要打开的地址。不推荐 `<a href="#">`。若复核要求角色就是链接，再定，不在实现时擅自加 href。

菜单勾选不是第三问的开工条件。默认不加勾、不改主进程。若审查要求勾选，E2 停下，另批主进程改动。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本 PR：本文件和台账。不写产品代码 |  |  |
| 2 | 审查通过后，从当时的 main 开 E2-0。只移离开接线 |  | 现有 `reader-screen` 测试 |
| 3 | 上面两问有答复后，从 E2-0 合入后的 main 开 E2-1 |  | 三个新测试文件、槽位断言 |
| 4 | E2-1 合入后开 E2-2。e2e 只用 `clickMenu` |  | `reader-nav.spec.ts`、真机 R-E6 另记，不写成 e2e 已覆盖 |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| R-E13 记为未验证遗留，先做 E2。有真 8GB 机器后在当时的 main 上补测 | 原话见上表。不以 32GB 或限制内存代替 | 2026-11-16 11:08 | Wisdom，[6906182172](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6906182172) |
| 菜单不加单选勾，不改 `library-menu.ts` | 6-3 A 已把主进程感知界面挂进 M2。勾选属于那一类。这是计划选用，审查可以否掉并叫停 | 2026-11-16 | 计划选用，非业主新批准 |
| 栏宽和链接元素先问再写 E2-1 | 已批规格没有这两项。不在计划里补数字或补元素 | 2026-11-16 | 待审查 |

## 实施交接

下面整段可以交给实现。计划审查通过之前不要执行。

任务类型：UI 改动。涉及切片：reader 的 `src/ui`，desktop 的 renderer。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

从审查通过时的 main 开工，不要从本计划分支继续写代码。先读本文件。E2-0 只把 `ReaderScreen` 的离开接线移到 `use-reader-leave.ts`，行为不变。栏宽和文字链接两问有书面答复之后才开 E2-1。E2-1 按本文件的文件表和 338 行预算实现：原生单选组名「栏位」，默认原文，不记住；对照左原文右空态，译文整个主区空态；句子和链接用 6-1 A 的原句；`view-mode-empty-degrade` 为空；不出现「开始翻译」「去设置」；不发翻译请求；不改画页比例、页码、缩放和历史。菜单事件只在 `shell.tsx` 转接，不改 main，不加勾选。E2-2 再用 `clickMenu` 补 e2e。物理 Ctrl / ⌘+1/2/3 写入真机清单，不写成 e2e 已覆盖。R-E13 保持未验证。不改系统设置。非生成行超过 346，或必须碰到本文件「排除项」里的文件，就停下来报告。
