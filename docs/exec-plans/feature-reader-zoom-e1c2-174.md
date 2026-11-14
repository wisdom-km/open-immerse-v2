# 执行计划

E1c-2，阅读屏缩放。从 main `ba6a71e803d0640f11ab97ef3edc919379173050` 开工。parent 是 `d5d5ea2`，tree 是 `85a6fefb`。2026-11-15 07:05 Wisdom 原话是「批准，按照你的建议做吧」，见台账和 [评论 6885626184](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6885626184)。先交台账和计划。Forge 审查计划 PASS 之后才实现，实现范围以这份计划为准。不含 Ready、合入、发版，这三件仍要单独批准。

范围以 [E1c 计划](feature-reader-render-e1c-174.md) 的「E1c-2」为准，并落实 [批次 E 计划](feature-reader-nav-zoom-174.md)。E1c 计划把这一笔估成 504 行。按下面的加删重算，含测试和证据，大约 840 行，超过 600。拆开，不写放行理由。Forge 计划审查 r1（[评论 6885763111](https://github.com/wisdom-km/open-immerse-v2/pull/213#issuecomment-6885763111)）选用方案甲：本 PR 只放计划和台账。审过之后合入要另请 Wisdom 批，07:05 不含合入。控件一笔和滚轮一笔各从合入后的 main 另开 Draft。

## 现状理解

- 现在已有的行为：E1c-1 已合入。视图菜单有放大、缩小、实际大小、适合宽度，只派发 `oi-zoom-in`、`oi-zoom-out`、`oi-zoom-actual`、`oi-zoom-fit-width`。shell 不听这四项。`pdf-session.ts` 把 `zoom` 写成 1。`frameStyle` 用页盒的宽高做占位，不乘缩放。没有 − / 百分比 / +。档位已在 `pure.ts`：`nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`、`ZOOM_PERCENT_MIN`（25）、`ZOOM_PERCENT_MAX`（400）、`DEFAULT_ZOOM_PERCENT`（100）。`resolveZoomPercent` 能算适合宽度和适合页面。`PROVISIONAL_PAGE_PIXEL_CAP` 是 Infinity。Electron 是 45.2.1。
- 相关的节：[DESIGN.md](../../DESIGN.md) §11.3（C31）、§11.8；[docs/design-principles.md](../design-principles.md) P4、P5、P7；[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1、§6；批次 E 计划的缩放行、第 94 行、G-5、§10 第 2–4 项。6-2 A（台账 2026-11-14 14:13）不记住缩放，每次打开 100%，UIX-56 的「按文档记住」未满足。这覆盖 DESIGN §11.3「按文档记住缩放级别」。不改 DESIGN 正文（N-10）。
- 还没做的部分：占位乘缩放、当前页锚点、百分比播报、边界置灰、加载前和出错时不显示控件、`passive: false` 的滚轮、捏合、Ctrl+滚轮的 e2e、百分比菜单底行。实测含 §10 第 2–5 项和第 11 项，以及下面真机清单里的 R-E3、R-E4、R-E7、R-E8、R-E9、R-E12、R-E13。N2、N3、N4 不在本批。8 GB 实测在两个实现 PR 都合入之后，测法在 `docs/evidence/210/commands.md`。原文 / 对照 / 译文是 E2。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | PR #213：本文件、台账、规格记录。不写产品代码。合入要另批 |  |  |
| 2 | 新的 Draft，从 #213 合入后的 main 开。E1c-2a：控件、档位、占位、锚点、播报。不装滚轮监听。总行数见下表，含本文件「实际」列的回填 |  |  |
| 3 | 在 E1c-2b 那个 PR 里、写监听之前测。结果写入该 PR 的 `docs/evidence/<PR号>/commands.md`。捏合已经在缩放整窗就停，不写 2b 的产品代码。带回什么、哪几条因此没满足、2a 用什么证明窗口因子仍是 1，见「第 3 步叫停」 |  |  |
| 4 | 另一个新的 Draft，从当时的 main 开。E1c-2b：滚轮、捏合、Ctrl+滚轮 e2e，以及拦住之后再测一次。只在第 3 步没有叫停时做 |  |  |

## 拆分

`check-pr-size` 把新增和删除都算进去。下表是非生成行，含该 PR 里回填的「实际」列。建议上限和硬上限见 [docs/arch/06.md](../arch/06.md)：React 组件建议 250、硬上限 400；普通源文件建议 400、硬上限 600；测试建议 600、硬上限 800。超过建议上限时，该 PR 正文写明为什么不拆。三个 PR 各自都不超过 600。

PR #213 只有文档。2a 和 2b 不进这个 PR。合入 #213 要另请 Wisdom 批。

E1c-2a 是 #213 合入之后的新 PR。控件和绘制，没有滚轮拦截。下表合计 582。600 减去 582 是 18。PR #212 当时估 436，合入时 pr-size 是 755，大约多了 73%，所以这 18 行余量可能会被用完。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/use-zoom.ts` 新建 | 80 | 80 | 不会。普通文件 |
| `packages/features/reader/src/ui/zoom-controls.tsx` 新建 | 130 | 130 | 不会。组件建议 250。钩子在这个文件里调用 |
| `packages/features/reader/src/ui/copy.ts` | 20 | 32 | 不会 |
| `packages/features/reader/src/ui/page-column.tsx` | 40 | 189 | 不会。现 149，组件建议 250 |
| `packages/features/reader/src/ui/pdf-session.ts` | 14 | 270 | 不会。现 258，普通文件建议 400 |
| `packages/features/reader/src/ui/reader-screen.tsx` | 6 | 253 | 现 247。见下面的退路。硬上限 400 |
| `apps/desktop/src/renderer/reader.css` | 24 | 137 | 不会 |
| `packages/features/reader/test/ui/zoom-controls.test.tsx` 新建 | 140 | 140 | 不会 |
| `packages/features/reader/test/ui/use-zoom.test.ts` 新建 | 50 | 50 | 不会 |
| 既有绘制测试改断言 | 40 |  | 不会 |
| `apps/desktop/e2e/` 里点放大后看窗口因子 | 30 |  | 不会。测试建议 600 |
| 本文件「实际」列的回填 | 8 |  | 文档 |

`reader-screen.tsx` 的退路选乙。`useZoom` 放在 `zoom-controls.tsx`，由它把百分比交给栏和页列。`reader-screen.tsx` 只加 import 和一层包裹，把已经算好的 `viewing` 传进去。改完大约 253，超过建议上限 250。实现 PR 正文写为什么不拆：钩子不在这个文件；把栏抽成新文件会把挪走的行按新增再加删除重计。这一笔停在 260。写到 260 仍放不下，就把包裹再收进 `zoom-controls.tsx`，然后提交。不把 PR 停下来问。

超行就停，这样报：准备 push 前看 `check-pr-size`。非生成行超过 600 就不推这个提交。报告里列出 `git diff --numstat`，对照上表指出多在哪些文件。不写放行理由。不把 2b 的文件塞进 2a。不把 PR 标成 Ready。

E1c-2b 是另一个新 PR，只在第 3 步没有叫停时开。下表合计 302。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/zoom-gesture.ts` 新建 | 70 | 70 | 不会 |
| `page-column.tsx` 挂上监听 | 24 | 213 | 不会。仍低于 250 |
| 手势单测 | 70 |  | 不会 |
| `apps/desktop/e2e/` 里 Ctrl+滚轮 | 90 |  | 不会。测试建议 600 |
| `docs/evidence/<PR号>/commands.md` | 40 |  | 文档。第 3 步和第 4 步的测量都写在这个文件 |
| 本文件「实际」列的回填 | 8 |  | 文档 |

2b 用同一条停法。超过 600 就不推，报告 numstat，不写放行理由。

2b 的 e2e 继续用 `apps/desktop/e2e/fixtures/electron-app.ts` 的临时 `userData`。这个 fixture 在 `electron.launch` 之后才读 `getPath("userData")`，再期望它等于临时目录。2b 接受这个顺序，不改 fixture。断言失败就停。

两笔都不改 `apps/desktop/src/main/`。`library-menu.ts` 也不改。依据：E1c-1 已经登记四项并派发事件。适合页面不进应用菜单，只进百分比菜单（批次 E 计划第 94 行）。百分比菜单在渲染进程，不新增主进程菜单项。

也不改 `shell.tsx`。四项事件已经在 `window` 上。`use-zoom.ts` 在阅读屏挂着时听，卸下就不听。加载前和出错时处理函数直接返回。shell 仍只听返回、后退、前进、转到页码。

## 行为

系统菜单和按钮用现成的。不造滑块，不用 `zoomIn` / `zoomOut` / `resetZoom` role，不调用 `webFrame.setZoomFactor`。百分比菜单是批次 E 计划第 94 行已经写明的渲染进程菜单：点百分比打开，底行是「只缩放 PDF 原文栏；界面跟随系统缩放」。这一行不是命令。适合页面只出现在这个菜单里。− 和 + 是按钮，`disabled` 表示不可用，不只靠颜色。tooltip 带快捷键：Windows / linux 是 Ctrl+=、Ctrl+−、Ctrl+0、Ctrl+Alt+0；mac 是 ⌘=、⌘−、⌘0、⌥⌘0。名称用「放大」「缩小」「实际大小」「适合宽度」「适合页面」。

档位只调用 `pure.ts` 已导出的函数。+ 用 `nextZoomPercent`，− 用 `previousZoomPercent`。实际大小用 `DEFAULT_ZOOM_PERCENT`。适合宽度、适合页面用 `resolveZoomPercent`，里面已经 `clampZoomPercent`。边界用 `ZOOM_PERCENT_MIN` 和 `ZOOM_PERCENT_MAX`。25% 时 − 置灰，快捷键什么都不做。400% 时 + 置灰，快捷键什么都不做。不在 UI 里再写一张档位表。不改 `zoom-bounds.ts`、`pure.ts`、domain。

不记住缩放。每次打开是 100%。不调用 `setZoom`。UIX-56 的「按文档记住」仍未满足。

占位：`frameStyle` 的宽高乘 `zoomPercent / 100`。CSS 不乘 `devicePixelRatio`。`pdf-session.ts` 把写死的 `zoom: 1` 改成这个比例。backing store 仍走 `renderSize`，也就是缩放乘 dpr，再受像素上限约束。`PROVISIONAL_PAGE_PIXEL_CAP` 保持 `Number.POSITIVE_INFINITY`。不抄 `2 ** 25`。

锚点是 G-5：保持当前可见页，不做指针锚点。先改每一页的占位尺寸，再把滚动调到同一页仍在视口里。不把缩放写进位置历史。

播报：一个 `role="status"` 写一次百分比。滚动不写。按钮一点就写，不等待。滚轮和捏合沿用批次 E 计划第 37 行的默认：停手 300 毫秒再写一次。300 写在实现的常量里，PR 说明里再写这个数。Forge 可以改这个数。不和页码播报、迷路那句共用一个节点，避免后一次把前一次顶掉。不使用 toast。缩放不加过渡动画，没有要随 `prefers-reduced-motion` 关掉的缩放动画（DS-07）。

加载前和出错时不渲染 −、百分比、+。这时菜单里的缩放项点了也没有作用。文献库里这几项仍不置灰，点了仍没有作用（6-3 A）。

## 行为断言

单测只断言行为，不读源码文本（F-08）。用例落在上表已经计入的测试文件里。

- 百分比到 25 时 − 带 `disabled`，再到 400 时 + 带 `disabled`。置灰后再派发对应事件，百分比不变。
- 加载前和出错时没有这组控件。这时派发四种缩放事件，百分比、外框和状态节点都不变。
- 阅读屏卸下之后，窗口上的缩放监听不在。再派发，没有写入。
- 缩放之后，缩放前的当前页仍与视口相交（G-5）。
- 百分比写进它自己的 `role="status"`，只写一次。页码那句和迷路那句的文本还在。
- 外框宽高等于页盒乘 `zoomPercent / 100`。`renderSize` 用的缩放是这个比例，再乘 dpr。像素上限仍是 Infinity。
- 适合宽度和适合页面的百分比都来自 `resolveZoomPercent`。
- 百分比菜单的底行等于「只缩放 PDF 原文栏；界面跟随系统缩放」。适合页面只出现在这个菜单里。
- tooltip 的快捷键分两支，按 `navigator.userAgent` 判断。测试用 `vi.spyOn` 或 `Object.defineProperty` 各设一次 mac 和 Windows 的 UA。linux 走 Windows 那一支。两支都断言，不只测 Windows。

## 滚轮和捏合

写监听之前先测，结果进该 PR 的 `docs/evidence/<PR号>/commands.md`。Electron 不是 45.2.1 就停。

1. 打开窗口后打印 `typeof contents.setZoomMode`。不是 `"function"` 就不调用。拦住整页缩放不依赖这个 API。
2. 还没加监听时在 PDF 栏上捏合，看标题栏和画布变不变，并看 `setVisualZoomLevelLimits` 在不在。捏合已经在缩放整窗，就按「第 3 步叫停」停，不改 main。
3. 还没加监听时 Ctrl+滚轮，记下窗口缩放因子和标题栏字号。加上 `preventDefault` 后再测一次。标题栏必须不变，因子仍是 1。没有 Ctrl 的 wheel 只滚动。
4. Ctrl++ 在 Windows 美式键盘和中文输入法下的实际键。输入法开、关各一遍，分别按 Ctrl+=、Ctrl+Shift+=、小键盘 +/−。哪一个进了放大或缩小，写进证据。计划不预先声称全部生效。Ctrl+= 进不了放大就停下来问。不加隐藏菜单项，也不加 keydown。这是批次 E 计划 §10 第 5 项。
5. 页码输入框聚焦时，记 Ctrl+0 和 Ctrl+− 会不会被菜单快捷键抢走。Alt+← 仍在上面的并入清单里。被抢走就停，不加第二套 keydown。这是批次 E 计划 §10 第 11 项里和缩放有关的两键。

监听用 `addEventListener("wheel", …, { passive: false })`，只在 Ctrl 或 ⌘ 时 `preventDefault`。方向调用 `previousZoomPercent` 或 `nextZoomPercent`。Chromium 里触控板捏合常常是带 Ctrl 的 wheel。若事件能给出连续比例，松手时只用 `clampZoomPercent`，不用 UI 里的数组。若只能拿到带 Ctrl 的 wheel，就一格一档。测完再定，计划不猜事件名。

e2e 复用阅读屏导航那条的临时 `userData`，并接受上面写的 fixture 顺序。Ctrl+滚轮之后 `getZoomFactor()` 仍是 1，画布的 CSS 尺寸变大。不调用 `webFrame.setZoomFactor`。

## 第 3 步叫停

监听还没加时，捏合已经在缩放整窗，就停。不写 2b 的产品代码，不改 main。

带回这些数据：Electron 版本；`typeof contents.setZoomMode`；`setVisualZoomLevelLimits` 在不在；捏合前后标题栏和画布有没有变；Ctrl+滚轮前后的窗口缩放因子和标题栏字号。

因此没满足的是 DESIGN §11.3 这一句：触控板捏合、Ctrl+滚轮同样缩放 PDF 栏。2a 仍然交付按钮、百分比菜单、快捷键、25%–400%、当前页锚点和播报。适合页面仍只在百分比菜单。

2a 自己证明按钮只放大 PDF 栏、窗口因子仍是 1：e2e 点放大之后 `getZoomFactor()` 仍是 1，画布 CSS 变大。单测断言外框是页盒乘缩放。这条 e2e 在 2a，不依赖 2b。两笔都不调用 `webFrame.setZoomFactor`。

## 真机清单

06:51 批准并入的未核实项，按原话列在这里。本轮快捷键用的是 SendInput，不是人手按键。

- 迷路播报
- 各播报是否只播一次
- 页码框开着时按 Alt+←
- 原生 tooltip 入图
- 白屏闪烁逐帧测
- 人手用物理键盘复核快捷键

E1c-2 自己的项。没有对应设备就标未验证，不用别的机器代替。

- −、百分比、+ 都在。25% 时 − 置灰，再按缩小没有变化。400% 时 + 置灰，再按放大没有变化。
- 点百分比，底行是「只缩放 PDF 原文栏；界面跟随系统缩放」。适合页面只在这个菜单里。
- 实际大小、适合宽度、适合页面只改 PDF 栏。标题栏字号不变。窗口缩放系数仍是 1。
- 物理键盘：Ctrl+=、Ctrl+−、Ctrl+0、Ctrl+Alt+0。mac 另机测 ⌘=、⌘−、⌘0、⌥⌘0。
- R-E3：精确式触控板的捏合和双指滚动。没有触控板就标未验证。
- R-E4：Ctrl+= / Ctrl+- / Ctrl+0 / Ctrl+Alt+0，美式键盘，中文输入法开和关。
- 百分比只播一次。
- 加载中和打不开时没有这组控件。菜单里的缩放项点了没有作用。
- §10 第 2–5 项和第 11 项的测量写进 2b 那个 PR 的 `commands.md`。第 5 项是美式键盘和中文输入法下的 Ctrl+=、Ctrl+Shift+=、小键盘 +/−。第 11 项在页码框聚焦时记 Ctrl+0 和 Ctrl+−。
- R-E7：显示缩放 200% 下看 100%、200%、400%。另按 00:28 批准做清晰度检查，测法抄 `docs/evidence/210/commands.md`：先改系统缩放，再重启应用、重新打开 PDF，然后核对 `devicePixelRatio` 和 canvas 的 `width` 都已经跟着变了。不要在 PDF 已经打开时改系统缩放再记数。改系统缩放这一步要 Wisdom 本人批。没有这句批准就不改显示缩放，本项标未验证。
- R-E8：高对比主题下的 −、百分比、+ 和置灰态。
- R-E9：Narrator 或 NVDA 读出按钮名称，百分比只播一次。批次 E 计划写的是 Narrator。
- R-E12：25 页以上的 PDF，快速滚到底再回顶，100% 和 400% 各一次。看滚动条长度和页框。离开窗口的 canvas 先把宽高设为 0 再移出。
- R-E13：两个实现 PR 都合入之后，在确认是 8 GB 的 Windows 上按 `docs/evidence/210/commands.md` 记四个点：100%、200%、400%，以及 400% 加显示缩放 200%。记下画布像素字节合计，以及任务管理器里渲染进程的专用工作集。不自定 MB，不改像素上限。机器未核实是 8 GB 就标未验证并停。更高内存的机器不能代替。显示缩放 200% 那一档同样要 Wisdom 本人批了才改系统缩放。

## 不做

N2：打开时逐页 `getPage`。N3：阅读中途改系统缩放并重画。N4：每次滚动测量全部页。三种视图的空态。配置存储和 chip。侧栏、Aa、大纲。Range、`disableRange`。CSP、wasm、`blob:`、`.mjs`、协议注册、`bypassCSP`。经 IPC 送整份 PDF。改 core、domain、`pure.ts`、contracts、`library/src`。改 `library-wiring.ts` 和其他主进程文件。分块渲染。`PDFDocumentProxy.cleanup()`。按文档记住缩放。把 `expose` 改成 true。自定 MB 或像素上限。改 DESIGN。Ready、合入、发版。

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先交台账和计划，审过才实现 | 原话「批准，按照你的建议做吧」。E1c-2 照 Forge 的建议推进。实现范围以这份计划为准 | 2026-11-15 07:05 | Wisdom。台账对应 [评论 6885626184](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6885626184) |
| 拆成 E1c-2a 和 E1c-2b，各开新 PR | 重算约 840 行，超过 600。审查 r1 选方案甲：#213 只有计划和台账。2a 合计 582，2b 合计 302。超过 600 就停并报告 numstat，不写放行理由。07:05 没有点名行数 | 2026-11-15 | Forge 计划审查 r1，[评论 6885763111](https://github.com/wisdom-km/open-immerse-v2/pull/213#issuecomment-6885763111)。行数是本计划的估算 |
| 钩子不放在 `reader-screen.tsx` | 审查 r1 的 S2 选乙。这个文件大约到 253，正文写为什么不拆，停在 260 | 2026-11-15 | Forge 计划审查 r1 |
| 按钮立即播，滚轮和捏合停手 300 毫秒 | 批次 E 计划第 37 行的默认。审查 r1 要求写进计划 | 2026-11-15 | 批次 E 计划。Forge 可以改这个数 |
| 不改 `library-menu.ts` | 四项已经派发。适合页面不进应用菜单 | 2026-11-15 | 沿用 E1c 计划。依据是批次 E 计划第 94 行 |
| 不记住缩放 | 6-2 A。DESIGN §11.3 的记住缩放不改正文 | 2026-11-14 14:13 | Wisdom。台账对应 [评论 6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563) |
| 锚点用当前可见页 | G-5。规格没写指针锚点 | 2026-11-14 | 批次 E 计划。Loom 建议，不是新的业主决定 |
| 百分比单独一个 `role=status` | 不顶掉页码或迷路那句。仍是就地播报，不是 toast | 2026-11-15 | 本计划。Forge 可以改 |

## 证据链接

- PR #213 没有 `docs/evidence/<PR号>/`。§10 的测量和第 3 步叫停带回的数据，写在 E1c-2b 那个 PR 的 `docs/evidence/<PR号>/commands.md`。2a 不新建证据目录。
- 8 GB 的测法已在 `docs/evidence/210/commands.md`。四个点写在上面的 R-E13。

## 自检

- [x] 影响 arch / prd 吗？不影响。不改 PRD、ARCHITECTURE、DESIGN。
