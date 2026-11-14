# 执行计划

E1c。从 main `d5d5ea234e36e7c5fc7336b387814b395c48aa91`（parent `311b419`，tree `ff7fc9f8`）开工。本文件是计划。Forge 审查通过之前不写实现。

依据是已批准的 [批次 E 计划](feature-reader-nav-zoom-174.md)（PR #206）和拆分记录 [评论 6876352033](https://github.com/wisdom-km/open-immerse-v2/pull/210#issuecomment-6876352033)。菜单整段的出处是 [评论 6877059582](https://github.com/wisdom-km/open-immerse-v2/pull/210#issuecomment-6877059582)。Forge 对 PR #212 tip `aa14f83` 的审查是 [评论 6880898801](https://github.com/wisdom-km/open-immerse-v2/pull/212#issuecomment-6880898801)：E1c 再拆成两笔，不超出已批范围。

## 现状理解

- 阅读屏已经能转到页码、后退、前进，并按 dpr 只画视口 ±2。`reader-screen.tsx` 253 行。`useLeaveKeys` 仍在第 53 行和第 240–253 行。
- 缩放的 16 档已在 main（PR #209），`domain/zoom-bounds.ts` 第 50–52 行。`pure.ts` 已导出 `nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`。E1c-1 不调用它们。E1c-2 只调用，不改 domain，不改 `pure.ts`。
- `library-menu.ts` 第 4–31 行是菜单模板，第 41–49 行是 `scriptForMenuEvent`。`apps/desktop/test/library-menu.test.ts` 已经存在，53 行。
- `library-wiring.ts` 第 144–154 行的 `menuEntry` 参数是 `(typeof fileMenu.items)[number]`，并且只复制 `label`、一个 `accelerator` 和 `click`。
- `copy.ts` 第 6 行仍写「返回文献库（Alt+←）」。事件名不在这个文件里。
- `pdf-session.ts` 第 153–155 行重复判断 `paintStopped`。第 160 行 `zoom: 1`。第 189–197 行逐页 `getPage`。第 199–205 行每次绘制读一次 `devicePixelRatio`。
- `page-column.tsx` 第 109–118 行 `frameStyle` 用 `box.width` 和 `box.height`，不乘缩放。
- `pdf-session.test.ts` 第 152 行起的 dpr 测试没有 `try/finally`。
- `reader-screen.tsx` 第 36–41 行用微任务把 `releasePixels` 设回 `true`。第 140–146 行有两个 `role="status"`。
- `apps/desktop/e2e/` 没有打开过 PDF 的用例。`playwright.config.ts` 的 `testDir` 是 `./e2e`，没有 `grep`，也没有 `testIgnore`。CI 的 `desktop-e2e-windows`（`.github/workflows/ci.yml` 第 275 行）跑 `pnpm --filter desktop e2e`。
- `PROVISIONAL_PAGE_PIXEL_CAP` 仍是 Infinity。8 GB 实测改到 E1c-2 合入之后。

## 两笔的边界

| 笔 | PR | 做什么 | pr-size 估计 |
| --- | --- | --- | --- |
| E1c-1 | 本 PR #212，计划通过后才写代码 | 整段视图菜单只派发事件。缩放四项和三种视图没有监听者时什么都不做。tooltip、删 `useLeaveKeys`、菜单后退的测试、迷路和页码不各播两遍、n2–n5、`reader-screen.tsx` 收到 250 行以下、25 页 canvas 计数 e2e、Ctrl+G / Alt+← / 历史用尽回库的 e2e | 436 |
| E1c-2 | E1c-1 合入 main 之后另开 | 全部缩放：`use-zoom`、控件、占位乘缩放、当前页锚点、停下后播一次百分比、25% 和 400% 置灰、加载前和出错时不渲染、`passive: false` 的滚轮、捏合、Ctrl+滚轮后窗口缩放因子仍是 1 的 e2e、§10 第 2–4 项实测 | 504 |

两笔都 ≤600，都不申请 G12。E1c-1 余量约 164 行。E1c-2 余量约 96 行。主进程菜单只在 E1c-1 改一次。8 GB 实测在 E1c-2 合入之后。N2、N3、N4 两笔都不做，理由在文末。

界面交接句只约束 E1c-2：只调用 `pure.ts` 已导出的 `nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`。不改 core、domain、`pure.ts`、contracts、`library/src`。两笔都不发整份 PDF，不用 Range，不改 CSP，不注册协议。`PROVISIONAL_PAGE_PIXEL_CAP` 保持 Infinity。

## E1c-1

### 菜单

`shell-events.ts` 增加事件名。reader 测试断言字面值，不从 `copy.ts` 导入。S5 锁住的三个是 `oi-history-back`、`oi-history-forward`、`oi-go-to-page`。同一笔还要发出、E1c-2 或 E2 才接行为的：`oi-view-original`、`oi-view-bilingual`、`oi-view-translation`、`oi-zoom-in`、`oi-zoom-out`、`oi-zoom-actual`、`oi-zoom-fit-width`。

`library-menu.ts` 第 4–31 行的模板后追加视图菜单。mac「显示」，Windows「视图(&V)」。顺序：后退、前进、转到页码…、原文、对照、译文、放大、缩小、实际大小、适合宽度。适合页面不进这个菜单。第 41–49 行的 `scriptForMenuEvent` 放行这些名字，仍然 `dispatchEvent`。不设 `enabled: false`。文献库里点了没有监听者，什么都不做。

适合宽度的快捷键是 `Alt+CmdOrCtrl+0`。#206 计划第 90 行已经记下：在部分欧洲键盘上这等于 AltGr。这是已批键位，只记风险，不改键。

#206 第 106 行写明 accelerator 只注册一份。键盘表是按平台各一个键，不是同一项同时注册两个。`applicationMenuTemplate` 已经接收 `platform`：

| 菜单项 | darwin | win32 / linux |
| --- | --- | --- |
| 后退 | `Cmd+[` | `Alt+Left` |
| 前进 | `Cmd+]` | `Alt+Right` |
| 转到页码 | `Alt+Cmd+G` | `Ctrl+G` |
| 原文 / 对照 / 译文 | `Cmd+1/2/3` | `Ctrl+1/2/3` |
| 放大 | `Cmd+=` | `Ctrl+=` |
| 缩小 | `Cmd+-` | `Ctrl+-` |
| 实际大小 | `Cmd+0` | `Ctrl+0` |
| 适合宽度 | `Alt+Cmd+0` | `Ctrl+Alt+0` |

放大是否真的吃到 Ctrl+=，是 #206 §10 第 5 条，E1c-2 测。E1c-1 不加隐藏项，也不加 keydown。

### B2：第二个 accelerator 和 `library-wiring.ts`

Electron 的菜单项只有一个 `accelerator`。本计划按 #206 第 106 行每项只注册上面那一个，所以不需要第二个键。下面仍把两条路写清。Forge 确认之前两路都不实现。(b) 还要 Wisdom 批准。

(a) 只改 `library-menu.ts`。把 `fileMenu.items` 的声明类型放宽成共用条目：`label`、`event`、可选的 `accelerator`。`library-wiring.ts` 第 145 行写的是 `(typeof fileMenu.items)[number]`，源码不用动，参数类型会跟着变宽，`toMenuItem` 就能映射视图菜单。`"accelerator" in item` 已经会把那一个快捷键抄进 Electron。

隐藏项不属于能独立完成的 (a)。`menuEntry` 第 150–152 行只复制 `label`、`accelerator` 和 `click`。数据上的 `visible: false` 到不了 Electron，第二项会显示出来。Electron 45.2.1 的 `acceleratorWorksWhenHidden` 是否让隐藏项的快捷键在 Windows 上生效：文档把这项写成 macOS 行为，Windows 没有在本仓库核实。标成 needs real-device check。不选这条。

(b) 改 `library-wiring.ts` 第 144–154 行这 11 行。参数改成和 (a) 相同的共用条目，返回值在已有的 `label` / `accelerator` / `click` 之外，有 `visible` 时一并传入。改完大约 19 行，pr-size 大约 +8。6658666956 只批了「菜单 + 已批快捷键」，没有点名这个文件。选 (b) 之前先停，请 Wisdom 批准。

推荐 (a) 的放宽类型，加上按平台各一个 accelerator。不改 `library-wiring.ts`，不用隐藏项。E1c-1 的 436 行不含 (b) 的 +8。即便改选 (b)，436+8 仍低于 600。

### 提示、离开、行数

删 `reader-screen.tsx` 第 53 行和第 240–253 行。`copy.ts` 第 6 行改成「返回文献库」，不带快捷键。`history-controls.tsx` 第 21 行的 `title` 改成带快捷键的「后退」「前进」。缩放按钮的 tooltip 留到 E1c-2，因为 E1c-1 没有缩放控件。

253 行删掉 `useLeaveKeys` 约 14 行，本笔不把缩放控件接进来，目标约 239 行，低于建议上限 250。

`shell.tsx` 第 24–32 行监听后退、前进、转到页码。有历史时 `oi-history-back` 退一步，没有历史时离开。前进没有目标时返回。窗口监听用 `flushSync` 包住离开，让 `page-column.tsx` 第 99–101 行的清理读到 `releasePixels === false`。微任务仍把标志设回 `true`，供没有卸载的情况。缩放和三种视图的事件没有监听者。

### 从 E1b 挪来的，以及导航 e2e

- 迷路与页码：`reader-screen.test.tsx` 断言 `LOST_PLACE` 只有一个节点，页码播报只有一个 `role="status"`，两句文字不同。这是批准 6878979931 写的「夹具未触发，带到 E1c」的单测。
- n2：删 `pdf-session.ts` 第 153–155 行。
- n3：上面的 `flushSync`。测试派发返回文献库事件，卸载清理不把 canvas 宽高写成 0。
- n4 的测试：阅读屏不卸载时，微任务之后标志回到 `true`。
- n5：`pdf-session.test.ts` 第 152 行起用 `try/finally` 恢复 `devicePixelRatio` 并 `close`。
- 25 页 canvas 计数，和 Ctrl+G 跳页、Alt+← 回去、历史用尽后回文献库。做法见下一节。Ctrl+滚轮后窗口缩放因子仍是 1，归 E1c-2。

### 25 页 e2e 怎么跑

现有打开路径会调用 `library-wiring.ts` 第 116 行的 `dialog.showOpenDialogSync`。Playwright 点不到这个原生对话框。不改生产代码。

- 对话框替身：只在测试里，`electronApp.evaluate` 跑在主进程，把 `dialog.showOpenDialogSync` 换成返回这份临时 PDF 路径的函数。生产的 `pickPdf` 不动。
- 用户数据：`composition-root.ts` 第 15 和 19 行用 `app.getPath("userData")`。`e2e/fixtures/electron-app.ts` 现在没有隔离。启动参数加上 `--user-data-dir` 指向临时目录，用完删掉。这样不会把 25 页样本导入真机上的文献库。
- PDF：测试里手写一份最小的 25 页 PDF（一份 catalog、25 个空内容页）。不加依赖，不提交论文。
- CI 会跑到：`playwright.config.ts` 没有跳过条件。新的 `e2e/*.spec.ts` 会被 `pnpm --filter desktop e2e` 收进去。用例里不写 `test.skip`。证据是 `desktop-e2e-windows` 的日志里这几条是 passed，不是 skipped。
- 行数：fixture 隔离和对话框替身约 35 行，手写 PDF 约 40 行，25 页计数和三条导航约 55 行，合计约 130。原先的 60 行不够。

### E1c-1 行数

行号是 main `d5d5ea2`。加和删都计入。

| 文件 | 动哪里 | 估计 |
| --- | --- | --- |
| `apps/desktop/src/main/library-menu.ts` | 第 4–31 行后追加视图菜单；第 41–49 行放行事件名；放宽 `fileMenu.items` 的声明类型 | 72 |
| `apps/desktop/test/library-menu.test.ts` | 已有 53 行，追加视图菜单和字面值断言。不是新文件 | 45 |
| `apps/desktop/src/renderer/shell-events.ts` | 第 1–2 行旁增加常量 | 14 |
| `apps/desktop/src/renderer/shell.tsx` | 第 24–32 行；`flushSync` | 26 |
| `packages/features/reader/src/ui/reader-screen.tsx` | 删第 53、240–253 行 | 22 |
| `packages/features/reader/src/ui/history-controls.tsx` 及测试 | 第 21 行 `title` | 24 |
| `packages/features/reader/src/ui/copy.ts` | 第 6 行。不写事件名 | 2 |
| `packages/features/reader/src/ui/pdf-session.ts` | 删第 153–155 行 | 3 |
| `packages/features/reader/test/ui/pdf-session.test.ts` | 第 152 行起恢复 `try/finally` | 10 |
| `packages/features/reader/test/ui/reader-screen.test.tsx` | 菜单后退、播报各一次、微任务、菜单离开不清零 | 70 |
| `apps/desktop/e2e/fixtures/electron-app.ts` 与新的 e2e | 临时 userData、对话框替身、手写 PDF、25 页计数、Ctrl+G、Alt+←、历史用尽 | 130 |
| 本计划的「实际」列 | 实现时补 | 18 |
| 合计 |  | 436 |

## E1c-2

E1c-1 合入之后从当时的 main 另开。不改 `library-menu.ts`。缩放菜单项已经会派发事件，这一笔只加监听。

#206 里 E1c 的缩放要求，上一版计划漏了的，都在这一笔：

- 占位尺寸乘缩放。`page-column.tsx` 第 109–118 行的 `frameStyle` 改为页宽、页高乘当前百分数，不乘 `devicePixelRatio`。#206 第 52、235、270 行。
- 以当前页为锚点，不做指针锚点（G-5，#206 第 199、247、270 行）。顺序：先改每一页的占位，再把 `scrollTop` 调到同一页仍在视口里，最后重画窗口里的 canvas。测试断言缩放前后当前页仍可见，`scrollTop` 不是原值的简单保留。
- 缩放手势停下后，用已有的页码 `role="status"` 播一次百分比（#206 第 37、253 行）。不另加第二个 live 区域，避免和页码播报各说一遍。释放和重画不播。
- 25% 时「−」置灰，400% 时「+」置灰。在边界上按快捷键不改变百分数（#206 第 32 行）。测试断言 `aria-disabled` 和百分数不变。
- 加载前和出错时不渲染缩放控件（#206 第 128 行）。
- Ctrl+滚轮：在 PDF 栏上 `addEventListener("wheel", …, { passive: false })`，再 `preventDefault`。React 的 `onWheel` 是被动的，写在里面的 `preventDefault` 不起作用。#206 第 51 行。无 Ctrl 的滚轮只滚动。
- 捏合在松手时把比例交给 `clampZoomPercent`。
- Electron e2e：Ctrl+滚轮之后 `webContents.getZoomFactor()` 仍是 1，画布的 CSS 尺寸变大。复用 E1c-1 的临时 userData 和对话框替身。
- 不使用 `zoomIn` / `zoomOut` / `resetZoom` role，不调用 `webFrame.setZoomFactor`。

### §10 第 2–4 项

在写拦截之前先测。结果写 `docs/evidence/<E1c-2 的 PR 号>/commands.md`。没有设备就标未验证并停。临时探测不留在最终 diff 里。Electron 依赖是 45.2.1（`apps/desktop/package.json`）。不是这个版本就停。

1. `setZoomMode` 在不在。打开窗口后在主进程打印 `typeof contents.setZoomMode`。不是 `"function"` 就不调用。拦住整页缩放不依赖这个 API。
2. 捏合是否默认关闭。还没加监听时在 PDF 栏上捏合，看标题栏和画布有没有变。同时看 `setVisualZoomLevelLimits` 在不在。捏合已经在缩放整窗，就停下来再问，不改 main。
3. Ctrl+滚轮的默认行为。还没加监听时记录窗口缩放因子和标题栏字号。加上 `passive: false` 的 `preventDefault` 后再测一次：标题栏不变，缩放因子仍是 1。

### E1c-2 行数

| 文件 | 内容 | 估计 |
| --- | --- | --- |
| `use-zoom.ts` 与测试 | 百分数、下一档、上一档、边界不变 | 90 |
| `zoom-controls.tsx` 与测试 | 「− % +」、原生 `<details>`、边界置灰、加载前和出错时不渲染 | 120 |
| `page-column.tsx` 与测试 | 第 109–118 行乘缩放；当前页锚点 | 70 |
| `pdf-session.ts` 与测试 | 第 160 行改用当前倍数 | 27 |
| `reader-screen.tsx` | 只在阅读状态挂上控件；播报写进已有 live 区 | 32 |
| 滚轮与捏合 | `passive: false`；松手时夹取 | 45 |
| 对应单测 | 锚点、播一次、边界按键、滚轮不改窗口因子 | 40 |
| e2e | Ctrl+滚轮后缩放因子是 1，画布变大 | 40 |
| `reader.css` | 沿用现有工具栏类 | 10 |
| `docs/evidence/<PR号>/commands.md` | §10 第 2–4 项的测法和结果 | 30 |
| 合计 |  | 504 |

锚点如果要多一轮修正，估计再加约 40 行，合计约 544，仍低于 600。超过再停，不把 E1c-1 的菜单拉回来改。

## 两笔都不做

- N2。`loadBoxes`（`pdf-session.ts` 第 189–197 行）逐页 `getPage`。改成并行会改打开路径。#206 只要求长文档卡住时停下来测。大约 20 行。不放进任一一笔。
- N3。会话中途改显示缩放，已画的页不重画。大约 35 行。可以不做：缩放一变就会重画并重读 dpr。8 GB 实测不在打开之后改系统缩放。测法写在 `docs/evidence/210/commands.md`：先改系统缩放，再重启应用、重新打开 PDF，核对 `devicePixelRatio` 和 canvas 的 `width` 已经变了，再记数。
- N4。`use-canvas-window.ts` 第 51–59 行每次滚动测量每一页。节流会改变哪一页算可见。大约 25 行。不放进任一一笔。
- 原文 / 对照 / 译文的空态是 E2。像素上限的数字等 8 GB 实测。不发版。

## 决策记录（Decision Log）

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| E1c 再拆成 E1c-1 和 E1c-2 | 补齐 #206 的缩放项之后，一笔放不进 600 | 2026-11-15 | Forge 排序，非业主决定。评论 6880898801 |
| 推荐 B2 的 (a)，不改 `library-wiring.ts` | #206 第 106 行只注册一份 accelerator | 2026-11-15 | 本计划。Forge 确认前不写代码。(b) 需 Wisdom 批准 |
| 8 GB 实测改到 E1c-2 合入之后 | 400% 那一档依赖缩放 | 2026-11-15 | Forge 排序，非业主决定。评论 6880898801 |

## 自检

- [x] 影响 arch / prd 吗？不改 PRD、ARCHITECTURE、DESIGN。8 GB 测法的补句在 `docs/evidence/210/commands.md`。
- [x] 超过 300 行或跨模块：是。本 PR 只改计划和台账。
- [x] UI 改动的交接句：E1c-2 只调用 `pure.ts` 已导出的缩放函数，不改 core。E1c-1 不调用缩放函数。
