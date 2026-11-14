# 执行计划

E1c。从 main `d5d5ea234e36e7c5fc7336b387814b395c48aa91`（parent `311b419`，tree `ff7fc9f8`）开工。本文件是计划。Forge 审查通过之前不写实现。

依据是已批准的 [批次 E 计划](feature-reader-nav-zoom-174.md)（PR #206）和拆分记录 [评论 6876352033](https://github.com/wisdom-km/open-immerse-v2/pull/210#issuecomment-6876352033)。菜单整段在这一笔，出处是 [评论 6877059582](https://github.com/wisdom-km/open-immerse-v2/pull/210#issuecomment-6877059582) 的「排期记录」。主进程只改 `library-menu.ts` 一次，依据是 [评论 6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956)。

## 现状理解

- 阅读屏已经能转到页码、后退、前进，并按 dpr 只画视口 ±2。`reader-screen.tsx` 253 行。`useLeaveKeys` 仍在第 53 行和第 240–253 行，Alt+← 无条件回文献库。
- 缩放档位已在 main（PR #209）。16 档是 `domain/zoom-bounds.ts` 第 50–52 行的 25、33、50、67、75、80、90、100、110、125、150、175、200、250、300、400。界面只经 `pure.ts` 调用 `nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`。不改 domain，不改 `pure.ts`。
- `library-menu.ts` 只有「打开…」和「返回文献库」。视图菜单还没有。
- `copy.ts` 第 6 行 `BACK_TOOLTIP` 仍写「返回文献库（Alt+←）」。事件名不在这个文件里。
- `pdf-session.ts` 第 153–155 行在 `drawPage` 开头又判断了一次 `paintStopped`。`paintCanvas` 第 136 行已经判断过。第 160 行缩放写死 `zoom: 1`。第 189–197 行 `loadBoxes` 逐页 `await getPage`。第 199–205 行每次绘制读一次 `devicePixelRatio`。
- `pdf-session.test.ts` 第 152–164 行的 dpr 测试在断言之后直接改回 `devicePixelRatio` 并 `close`，没有 `try/finally`。
- `use-canvas-window.ts` 第 31–41 行和第 51–59 行每次滚动对栏里每一页做 `getBoundingClientRect`。
- `reader-screen.tsx` 第 36–41 行用 `queueMicrotask` 把 `releasePixels` 设回 `true`。工具栏点击时卸载发生在这个微任务之前。菜单走 `window` 事件，微任务可能先跑，卸载时第 99–101 行会把 canvas 宽高设为 0。没有测试覆盖「阅读屏还在时微任务把标志设回 true」。
- `reader-screen.tsx` 第 140–146 行有两个 `role="status"`：页码播报和迷路提示。没有测试断言它们各只出现一次。
- 没有 25 页的 Electron e2e。`PROVISIONAL_PAGE_PIXEL_CAP` 仍是 Infinity。8 GB 实测在 E1c 合入之后，不在本笔。

## 计划 / 实际

计划列是开工前的范围。实际列等实现 PR 再填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 缩放控件和 `use-zoom`，只用已有的 16 档 |  |  |
| 2 | `library-menu.ts` 一次写完视图菜单，事件名用字面值 |  |  |
| 3 | ‹ 的 tooltip 去掉快捷键；← → 的 tooltip 写上快捷键；删 `useLeaveKeys` |  |  |
| 4 | 菜单「后退」在有历史时退一步；迷路提示和页码播报不各说两遍 |  |  |
| 5 | n2、n3、n5，以及微任务恢复的测试；`reader-screen.tsx` 收到 250 行以下 |  |  |
| 6 | 25 页 Electron e2e：canvas 数在可见页 ±2 以内 |  |  |

## 这一笔做

界面只调用 `pure.ts` 已导出的 `nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`。不改 core、domain、`pure.ts`、contracts、`library/src`。不改 DESIGN。不发整份 PDF，不用 Range，不改 CSP，不注册协议。主进程只改 `library-menu.ts`。`PROVISIONAL_PAGE_PIXEL_CAP` 保持 Infinity。

### 缩放

新文件 `packages/features/reader/src/ui/use-zoom.ts`。持有当前百分数，默认 100。放大走 `nextZoomPercent`，缩小走 `previousZoomPercent`。适合宽度、适合页面先按栏宽或栏高算出百分数，再 `clampZoomPercent`。不新写档位表。

新文件 `packages/features/reader/src/ui/zoom-controls.tsx`。工具栏是「−」、当前百分数、「+」。点百分数用原生 `<details>` 打开档位，不自绘弹出层。菜单里另有适合页面；视图菜单里没有适合页面（批次 E 计划 C12）。捏合在松手时把比例交给 `clampZoomPercent`。Ctrl+滚轮 `preventDefault`，只改 PDF 栏，不改窗口缩放系数。不使用 Electron 的 `zoomIn` / `zoomOut` / `resetZoom` role，也不调用 `webFrame.setZoomFactor`。

`pdf-session.ts` 第 160 行的 `zoom: 1` 改成当前百分数换算的倍数。`page-column.tsx` 把这个百分数放进绘制依赖，缩放变化时重画已经挂上的页。

### 菜单

`apps/desktop/src/renderer/shell-events.ts` 增加事件名常量。reader 测试断言下面这些字面值，不从 `copy.ts` 导入。S5 锁住的三个是 `oi-history-back`、`oi-history-forward`、`oi-go-to-page`（E1a 审查 [评论 6876777382](https://github.com/wisdom-km/open-immerse-v2/pull/210#issuecomment-6876777382) 当时写在 `copy.ts` 第 7–9 行）。N4 要求事件名不要放进 `copy.ts`，所以常量只放在 `shell-events.ts`。

同一笔还要发出、但 E2 才接行为的三个：`oi-view-original`、`oi-view-bilingual`、`oi-view-translation`。缩放四个：`oi-zoom-in`、`oi-zoom-out`、`oi-zoom-actual`、`oi-zoom-fit-width`。视图菜单这一次写全，避免 E2 再改主进程。E1c 不实现原文 / 对照 / 译文的空态。

`library-menu.ts` 追加视图菜单。mac 菜单名「显示」，Windows「视图(&V)」。顺序：后退、前进、转到页码…、原文、对照、译文、放大、缩小、实际大小、适合宽度。快捷键：后退 `CmdOrCtrl+[` 与 `Alt+Left`，前进 `CmdOrCtrl+]` 与 `Alt+Right`，转到页码 mac `Alt+Cmd+G`、Windows `Ctrl+G`，三种视图 `CmdOrCtrl+1/2/3`，放大 `CmdOrCtrl+=`，缩小 `CmdOrCtrl+-`，实际大小 `CmdOrCtrl+0`，适合宽度 `Alt+CmdOrCtrl+0`。不设 `enabled: false`。文献库里这些项仍可点，没有监听者时什么都不做。`scriptForMenuEvent` 只放行上述名字，仍然 `dispatchEvent(new Event(...))`。

`shell.tsx` 第 24–32 行的监听扩到这些事件。阅读屏把后退、前进、转到页码和缩放函数交给 shell。有历史时 `oi-history-back` 退一步；没有历史时走现有的离开。前进没有目标时返回。

### 提示、离开、行数

删 `reader-screen.tsx` 第 53 行的调用和第 240–253 行的 `useLeaveKeys`。Alt+← 只留给菜单。`copy.ts` 第 6 行改成「返回文献库」，不带快捷键。`history-controls.tsx` 第 21 行的 `title` 改成带快捷键的「后退」「前进」（mac ⌘[ / ⌘]，Windows Alt+← / Alt+→）。缩放按钮的 `title` 同样带快捷键。

`reader-screen.tsx` 现在 253 行，建议上限 250。删掉 `useLeaveKeys` 约 14 行，接上缩放控件大约加回 9 行，目标 248 行以下。菜单监听放在 `shell.tsx`，不放进这个文件。若实现后仍超过 250，PR 正文写明为什么不拆，且不超过硬上限 400。

### 从 E1b 挪来的测试

- `apps/desktop/e2e/canvas-window.spec.ts`。测试里生成一份 25 页的空白 PDF 写到临时文件，走现有的打开路径。不提交论文，不新增依赖，不新开 IPC。滚动后 DOM 里的 canvas 数不超过「可见页数 + 4」，留下的页是第一张可见页 −2 到最后一张可见页 +2，夹在 1..25。
- `reader-screen.test.tsx` 断言迷路时 `LOST_PLACE` 只有一个节点，页码播报只有一个 `role="status"` 节点，播报文字不是迷路那句。

### n2、n3、n5 和微任务测试

- n2：删 `pdf-session.ts` 第 153–155 行。`paintCanvas` 第 136 行已经返回。
- n3：`shell.tsx` 的窗口监听用 `flushSync` 包住 `leave`，让卸载清理读到 `releasePixels === false`。微任务仍把标志设回 `true`，供没有卸载的情况。加一条测试：派发返回文献库事件后，卸载清理不把 canvas 宽高写成 0。
- n4 的测试（要做）：阅读屏不卸载时，微任务之后标志回到 `true`，随后的清理会清像素。这是补测试，不改这条恢复本身。
- n5：`pdf-session.test.ts` 第 152–164 行用 `try/finally` 包住 dpr 赋值、绘制和 `close`，抛错时也把 `devicePixelRatio` 设回去。

## 这一笔不做

下面三项都留在阅读界面里，不碰禁止区域。放进本笔会让 pr-size 超过 600，所以拆出去。

- N2。`loadBoxes`（`pdf-session.ts` 第 189–197 行）逐页等待 `getPage`。改成并行是打开路径的行为变化。批次 E 计划只要求长文档卡住时停下来测，没有批准在本笔改并发。估计大约 20 行，本笔没有这 20 行的余量。
- N3。会话中途改显示缩放不会重画已画的页。`deviceRatio` 在第 199–205 行每次绘制才读。监听变化并重画大约 35 行。2026-11-15 00:28 的批准把真实系统缩放的核对并进 E1c 之后的 8 GB 实测，不在本笔。
- N4。`use-canvas-window.ts` 第 51–59 行每次滚动测量每一页。节流会改变快速滚动时哪一页算可见，需要单独的测试，大约 25 行。和 N2、N3 加在一起会超过 600。

8 GB 实测、像素上限的具体数字、原文 / 对照 / 译文的空态、发版，都不在本笔。

## 文件与行号

行号是 main `d5d5ea2` 上的位置。新文件没有行号。

| 文件 | 动哪里 | 估计行数（加+删） |
| --- | --- | --- |
| `packages/features/reader/src/ui/use-zoom.ts` | 新文件 | 42 |
| `packages/features/reader/test/ui/use-zoom.test.ts` | 新文件 | 36 |
| `packages/features/reader/src/ui/zoom-controls.tsx` | 新文件 | 58 |
| `packages/features/reader/test/ui/zoom-controls.test.tsx` | 新文件 | 40 |
| `apps/desktop/src/main/library-menu.ts` | 第 10–31 行的菜单模板后追加视图菜单；第 33–44 行放行新事件名 | 68 |
| `apps/desktop/test/library-menu.test.ts` | 新文件。断言菜单文案、快捷键，以及脚本里的 S5 字面值 | 42 |
| `apps/desktop/src/renderer/shell-events.ts` | 第 1–2 行旁增加常量 | 12 |
| `apps/desktop/src/renderer/shell.tsx` | 第 24–32 行的监听；`flushSync` | 24 |
| `packages/features/reader/src/ui/reader-screen.tsx` | 删第 53、240–253 行；顶栏接上缩放控件 | 16 |
| `packages/features/reader/src/ui/history-controls.tsx` | 第 21 行 `title` | 22（含测试） |
| `packages/features/reader/src/ui/copy.ts` | 第 6 行。不写事件名 | 4 |
| `packages/features/reader/src/ui/page-column.tsx` | 绘制依赖带上百分数 | 8 |
| `packages/features/reader/src/ui/pdf-session.ts` | 删第 153–155 行；第 160 行改用当前缩放 | 14 |
| `packages/features/reader/test/ui/pdf-session.test.ts` | 第 152–164 行恢复 `try/finally`；补一档缩放绘制 | 16 |
| `packages/features/reader/test/ui/reader-screen.test.tsx` | 菜单后退、播报各一次、微任务恢复、菜单离开不清零 | 64 |
| `apps/desktop/src/renderer/reader.css` | 缩放按钮沿用现有工具栏类 | 10 |
| `apps/desktop/e2e/canvas-window.spec.ts` | 新文件 | 60 |
| 本计划的「实际」列 | 实现 PR 里补 | 24 |
| 合计 |  | 560 |

pr-size 估计 560。上限 600，不申请 G12。余量大约 40 行，留给审查时的小改。N2、N3、N4 不在这 560 里。

## 测试

- `use-zoom`：100 的下一档是 110，上一档是 90；400 再放大仍是 400；25 再缩小仍是 25；适合宽度算出的数被夹回 25–400。
- `zoom-controls`：点「+」「−」和百分数菜单会改百分数；tooltip 含快捷键。
- 菜单：模板含上述各项和快捷键；`scriptForMenuEvent` 对 `oi-history-back` 等字面值返回会 `dispatchEvent` 的脚本；reader 测试写出这三个字面值，不引用 `copy.ts`。
- 有历史时派发 `oi-history-back`，页码退回可见页，不调用离开。没有历史时派发它，调用离开。
- 迷路与页码：两个 `role="status"` 文案不同，各出现一次。
- 微任务：组件还在时，微任务之后标志为 `true`。菜单离开：卸载清理时 canvas 宽高不是 0。
- dpr 测试用 `try/finally` 恢复 `devicePixelRatio`。
- e2e：25 页样本滚动后 canvas 数 ≤ 可见页数 + 4，页码落在可见范围 ±2。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| E1 拆成三笔，E1c 是缩放加整段视图菜单 | 拆分记录 | 2026-11-14 | Forge 排序，非业主决定。评论 6876352033、6877059582 |
| 主进程菜单只改这一次 | 6658666956 | 2026-11-14 | 该评论授权的范围 |
| N2、N3、N4 不进本笔 | 放进去 pr-size 会超过 600 | 2026-11-15 | 本计划。Forge 可改 |

## 自检

- [ ] 影响 arch / prd 吗？本计划不改 PRD、ARCHITECTURE、DESIGN。
- [x] 超过 300 行或跨模块：是。第一笔提交只有本文件。
- [x] UI 改动的交接句：界面只调用 `pure.ts` 已导出的缩放函数，不改 core。
