# 执行计划

E1c。从 main `d5d5ea2` 开工。依据是已批准的 [批次 E 计划](feature-reader-nav-zoom-174.md)（PR #206）和拆分记录 [评论 6876352033](https://github.com/wisdom-km/open-immerse-v2/pull/210#issuecomment-6876352033)。菜单整段见 [评论 6877059582](https://github.com/wisdom-km/open-immerse-v2/pull/210#issuecomment-6877059582)。Forge 对 `aa14f83` 的审查是 [评论 6880898801](https://github.com/wisdom-km/open-immerse-v2/pull/212#issuecomment-6880898801)，对 `e84ecbc` 的审查是 [评论 6881018587](https://github.com/wisdom-km/open-immerse-v2/pull/212#issuecomment-6881018587)：拆分和 B2 的 (a) 已确认。

## 两笔的边界

| 笔 | PR | 做什么 | 估计 |
| --- | --- | --- | --- |
| E1c-1a | 本 PR #212 | 视图菜单只派发。缩放四项和三种视图没有监听者。tooltip、删 `useLeaveKeys`、菜单后退、迷路和页码各播一次、n2–n5、`reader-screen.tsx` 低于 250。单元测试留在这一笔 | 561 |
| E1c-1b | E1c-1a 合入 main 后另开 | Electron e2e。源码在 `d6170ed` | 205 |
| E1c-2 | 另开 | 全部缩放。估计 504。百分比菜单底行是「只缩放 PDF 原文栏；界面跟随系统缩放」（#206 第 94 行）。适合页面只在这个菜单里，算进 `zoom-controls.tsx` 的 120 行 | 504 |

三笔都不申请 G12。E1c-1a 合入后，缩放四项和三种视图点了也什么都不做，直到 E1c-2 和 E2。#206 第 104 行的 6-3 A 已接受。其间不发版。PR 正文要写明。E1c-2 只调用 `pure.ts` 已导出的 `nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`。E1c-1a 不调用。不改 core、domain、`pure.ts`、contracts、`library/src`。不发整份 PDF，不用 Range，不改 CSP，不注册协议。`PROVISIONAL_PAGE_PIXEL_CAP` 保持 Infinity。

## E1c-1

`shell-events.ts` 增加事件名。测试断言字面值，不从 `copy.ts` 导入。S5：`oi-history-back`、`oi-history-forward`、`oi-go-to-page`。只派发、E1c-2 或 E2 才接行为：`oi-view-original`、`oi-view-bilingual`、`oi-view-translation`、`oi-zoom-in`、`oi-zoom-out`、`oi-zoom-actual`、`oi-zoom-fit-width`。

`library-menu.ts` 追加视图菜单。mac「显示」，Windows 和 linux「视图(&V)」。顺序：后退、前进、转到页码…、原文、对照、译文、放大、缩小、实际大小、适合宽度。适合页面不进这个菜单。`scriptForMenuEvent` 放行这些名字。不设 `enabled: false`。适合宽度是 `Alt+Cmd+0` / `Ctrl+Alt+0`。#206 第 90 行：部分欧洲键盘上这等于 AltGr。不改键。

#206 第 106 行：每项只注册一个 accelerator。`applicationMenuTemplate(platform)` 选键。darwin 用 `Cmd+[`、`Cmd+]`、`Alt+Cmd+G`、`Cmd+1/2/3`、`Cmd+=`、`Cmd+-`、`Cmd+0`、`Alt+Cmd+0`。win32 和 linux 用 `Alt+Left`、`Alt+Right`、`Ctrl+G`、`Ctrl+1/2/3`、`Ctrl+=`、`Ctrl+-`、`Ctrl+0`、`Ctrl+Alt+0`。Ctrl+= 是否真的放大是 #206 §10 第 5 条，E1c-2 测。不加隐藏项，不加 keydown。

B2 确认 (a)。只改 `library-menu.ts`。`fileMenu.items` 放宽成 `MenuItemSpec`（`label`、`event`、可选 `accelerator`）。`library-wiring.ts` 第 145 行是 `(typeof fileMenu.items)[number]`，源码保持逐字节不变。不选隐藏项，不选改 `library-wiring.ts` 的 (b)。

`copy.ts` 第 6 行改成「返回文献库」。`history-controls.tsx` 的 `title` 在渲染时用 `/Mac/.test(navigator.userAgent)` 选「后退（⌘[）」或「后退（Alt+←）」，前进同理。不用 `navigator.platform`，不用模块级 `let`。缩放按钮的 tooltip 留到 E1c-2。

`go-to-page.tsx` 第 11 行的 `editing` 仍是内部状态。阅读屏用 `onBindNav` 把 `back`、`forward`、`openGoTo` 交给 shell，绑定在 `use-bound-nav.ts`。`GoToPage` 挂上时登记打开函数，卸下时清掉。加载前或出错时输入框没挂上，「转到页码…」什么都不做（#206 第 100 行）。测试派发后页码输入框拿到焦点。`reader-screen.tsx` 删 `useLeaveKeys`，绑定之后低于 250 行。

shell 监听后退、前进、转到页码和返回文献库，用 `flushSync` 包住。有历史时后退一步，没有历史时离开。前进没有目标时返回。这样 `page-column.tsx` 第 99–101 行的清理读到 `releasePixels === false`。微任务仍把标志设回 `true`。阅读屏不卸载时，微任务之后的清理会清像素。

迷路与页码：`LOST_PLACE` 只有一个节点，页码播报是另一个 `role="status"`。n2：删 `drawPage` 开头的 `paintStopped`。n5：dpr 测试用 `try/finally` 恢复并 `close`。菜单后退、播报各一次、n2–n5 的单元测试留在本 PR。Electron e2e 改到 E1c-1b。

## E1c-1b

`d6170ed` 实测 pr-size 755。436 的表把 e2e 估成 130，把计划、台账和 changelog 估成 18，并且还没有 `go-to-page.tsx`、`use-bound-nav.ts`、`failed-read-leave.test.tsx`。Forge 决定再拆。这是排期，不改已批范围。

| 去向 | 加+删 |
| --- | --- |
| E1c-1a，留在 #212 | 561。菜单、shell、导航绑定、`pdf-session`、`copy.ts`、全部单元测试、计划和台账 |
| E1c-1b | 205。`reader-nav.spec.ts` 149，`blank-pdf.ts` 37，`electron-app.ts` 19 |

E1c-1b 从合入后的 main 另开。源码留在 `d6170ed` 的 `apps/desktop/e2e/reader-nav.spec.ts`、`apps/desktop/e2e/blank-pdf.ts`，以及 `fixtures/electron-app.ts` 相对 `d5d5ea2` 的改动。不改生产代码。测试里替换 `dialog.showOpenDialogSync`。`--user-data-dir` 指向临时目录，用完删掉。导入之前断言 `app.getPath("userData")` 等于该绝对路径，不相等就失败，不写 `test.skip`。PDF 手写，不加依赖。两条用例：25 页 canvas 落在可见页 ±2；菜单转到页码、后退，历史用尽回库。合成按键无效时，`app.evaluate` 从 `Menu.getApplicationMenu()` 按标签 `click()`。accelerator 仍锁在本 PR 的 `library-menu.test.ts`。真机按键另核。CI 的 `desktop-e2e-windows` 会收进 `e2e/*.spec.ts`。

## E1c-2

E1c-1b 合入后另开。不改 `library-menu.ts`。占位乘缩放（`page-column.tsx` 第 109–118 行）。当前页锚点（G-5）。停下后用已有 live 区播一次百分比。25% 和 400% 置灰。加载前和出错时不渲染控件。滚轮用 `addEventListener("wheel", …, { passive: false })` 再 `preventDefault`。捏合在松手时 `clampZoomPercent`。e2e：Ctrl+滚轮后 `getZoomFactor()` 仍是 1，画布 CSS 变大，复用 E1c-1b 的临时 userData。不用 `zoomIn` role，不调用 `webFrame.setZoomFactor`。

写拦截之前先测 §10 第 2–4 项，结果写 `docs/evidence/<PR号>/commands.md`。Electron 是 45.2.1，不是就停。1. `typeof contents.setZoomMode`。2. 还没加监听时捏合，并看 `setVisualZoomLevelLimits`。3. Ctrl+滚轮的默认因子和标题栏，加上 `preventDefault` 后再测。

## 三笔都不做

N2：`loadBoxes` 第 189–197 行逐页 `getPage`。N3：会话中途改显示缩放。8 GB 在 E1c-2 合入之后测。测法在 `docs/evidence/210/commands.md`：先改系统缩放，再重启、重新打开，核对 `devicePixelRatio` 和 canvas `width`，再记数。打开期间不改缩放。N4：`use-canvas-window.ts` 第 51–59 行每次滚动测量每一页。原文 / 对照 / 译文的空态是 E2。不发版。

## 决策记录

| 决定 | 理由 | 日期 | 谁 |
| --- | --- | --- | --- |
| 拆成 E1c-1 和 E1c-2 | 缩放项放不进 600 | 2026-11-15 | Forge 6880898801。6881018587 确认 |
| B2 用 (a) | #206 第 106 行每项一个 accelerator。linux 用 Windows 列 | 2026-11-15 | Forge 6881018587 |
| 8 GB 改到 E1c-2 之后 | 400% 依赖缩放 | 2026-11-15 | Forge 6880898801 |
| E1c-1 再拆成 1a 和 1b | `d6170ed` 实测 755。e2e 的 205 行改到 1b | 2026-11-15 | Forge。只改排期 |
