# 执行计划

E1c-2，阅读屏缩放。从 main `ba6a71e803d0640f11ab97ef3edc919379173050` 开工。parent 是 `d5d5ea2`，tree 是 `85a6fefb`。这一份只写计划。Forge 审查通过之前不写产品代码。不含 Ready、合入、发版。

范围以 [E1c 计划](feature-reader-render-e1c-174.md) 的「E1c-2」为准，并落实 [批次 E 计划](feature-reader-nav-zoom-174.md)。E1c 计划把这一笔估成 504 行。按下面的加删重算，含测试和证据，大约 840 行，超过 600。本计划提出拆分，不写放行理由。

## 现状理解

- 现在已有的行为：E1c-1 已合入。视图菜单有放大、缩小、实际大小、适合宽度，只派发 `oi-zoom-in`、`oi-zoom-out`、`oi-zoom-actual`、`oi-zoom-fit-width`。shell 不听这四项。`pdf-session.ts` 把 `zoom` 写成 1。`frameStyle` 用页盒的宽高做占位，不乘缩放。没有 − / 百分比 / +。档位已在 `pure.ts`：`nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`、`ZOOM_PERCENT_MIN`（25）、`ZOOM_PERCENT_MAX`（400）、`DEFAULT_ZOOM_PERCENT`（100）。`resolveZoomPercent` 能算适合宽度和适合页面。`PROVISIONAL_PAGE_PIXEL_CAP` 是 Infinity。Electron 是 45.2.1。
- 相关的节：[DESIGN.md](../../DESIGN.md) §11.3（C31）、§11.8；[docs/design-principles.md](../design-principles.md) P4、P5、P7；[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1、§6；批次 E 计划的缩放行、第 94 行、G-5、§10 第 2–4 项。6-2 A（台账 2026-11-14 14:13）不记住缩放，每次打开 100%，UIX-56 的「按文档记住」未满足。这覆盖 DESIGN §11.3「按文档记住缩放级别」。不改 DESIGN 正文（N-10）。
- 还没做的部分：占位乘缩放、当前页锚点、百分比播报、边界置灰、加载前和出错时不显示控件、`passive: false` 的滚轮、捏合、Ctrl+滚轮的 e2e、§10 第 2–4 项的测量、百分比菜单底行。N2、N3、N4 不在本批。8 GB 实测在两笔都合入之后，测法在 `docs/evidence/210/commands.md`。原文 / 对照 / 译文是 E2。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件与台账。不写产品代码 |  |  |
| 2 | E1c-2a：控件、档位、占位、锚点、播报。不装滚轮监听 |  |  |
| 3 | 先测 §10 第 2–4 项，写入 `docs/evidence/<该 PR>/commands.md`。捏合已经在缩放整窗就停，不再做 2b |  |  |
| 4 | E1c-2b：滚轮、捏合、Ctrl+滚轮 e2e，以及拦住之后再测一次 |  |  |

## 拆分

`check-pr-size` 把新增和删除都算进去。下表是非生成行。建议上限和硬上限见 [ARCHITECTURE.md](../../ARCHITECTURE.md) §6：React 组件建议 250、硬上限 400；普通源文件建议 400、硬上限 600；测试建议 600、硬上限 800。

E1c-2a，估计 548。控件和绘制，没有滚轮拦截。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/use-zoom.ts` 新建 | 80 | 80 | 不会。普通文件 |
| `packages/features/reader/src/ui/zoom-controls.tsx` 新建 | 130 | 130 | 不会。组件建议 250 |
| `packages/features/reader/src/ui/copy.ts` | 20 | 32 | 不会 |
| `packages/features/reader/src/ui/page-column.tsx` | 40 | 189 | 不会。现 149，组件建议 250 |
| `packages/features/reader/src/ui/pdf-session.ts` | 14 | 270 | 不会。现 258，普通文件建议 400 |
| `packages/features/reader/src/ui/reader-screen.tsx` | 10 | 250 | 现 247。只加钩子调用和把控件交给栏。超过 250 就停，不在这一笔把栏抽成新文件。抽走的行会按新增再加删除重计，容易顶破 600。硬上限 400 |
| `apps/desktop/src/renderer/reader.css` | 24 | 137 | 不会 |
| `packages/features/reader/test/ui/zoom-controls.test.tsx` 新建 | 140 | 140 | 不会 |
| `packages/features/reader/test/ui/use-zoom.test.ts` 新建 | 50 | 50 | 不会 |
| 既有绘制测试改断言 | 40 |  | 不会 |

E1c-2b，估计 294。只在第 3 步没有叫停时做。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/zoom-gesture.ts` 新建 | 70 | 70 | 不会 |
| `page-column.tsx` 挂上监听 | 24 | 213 | 不会。仍低于 250 |
| 手势单测 | 70 |  | 不会 |
| `apps/desktop/e2e/` 里 Ctrl+滚轮 | 90 |  | 不会。测试建议 600 |
| `docs/evidence/<PR号>/commands.md` | 40 |  | 文档 |

两笔都不改 `apps/desktop/src/main/`。`library-menu.ts` 也不改。依据：E1c-1 已经登记四项并派发事件。适合页面不进应用菜单，只进百分比菜单（批次 E 计划第 94 行）。百分比菜单在渲染进程，不新增主进程菜单项。

也不改 `shell.tsx`。四项事件已经在 `window` 上。`use-zoom.ts` 在阅读屏挂着时听，卸下就不听。加载前和出错时处理函数直接返回。shell 仍只听返回、后退、前进、转到页码。

## 行为

系统菜单和按钮用现成的。不造滑块，不用 `zoomIn` / `zoomOut` / `resetZoom` role，不调用 `webFrame.setZoomFactor`。百分比菜单是批次 E 计划第 94 行已经写明的渲染进程菜单：点百分比打开，底行是「只缩放 PDF 原文栏；界面跟随系统缩放」。这一行不是命令。适合页面只出现在这个菜单里。− 和 + 是按钮，`disabled` 表示不可用，不只靠颜色。tooltip 带快捷键：Windows / linux 是 Ctrl+=、Ctrl+−、Ctrl+0、Ctrl+Alt+0；mac 是 ⌘=、⌘−、⌘0、⌥⌘0。名称用「放大」「缩小」「实际大小」「适合宽度」「适合页面」。

档位只调用 `pure.ts` 已导出的函数。+ 用 `nextZoomPercent`，− 用 `previousZoomPercent`。实际大小用 `DEFAULT_ZOOM_PERCENT`。适合宽度、适合页面用 `resolveZoomPercent`，里面已经 `clampZoomPercent`。边界用 `ZOOM_PERCENT_MIN` 和 `ZOOM_PERCENT_MAX`。25% 时 − 置灰，快捷键什么都不做。400% 时 + 置灰，快捷键什么都不做。不在 UI 里再写一张档位表。不改 `zoom-bounds.ts`、`pure.ts`、domain。

不记住缩放。每次打开是 100%。不调用 `setZoom`。UIX-56 的「按文档记住」仍未满足。

占位：`frameStyle` 的宽高乘 `zoomPercent / 100`。CSS 不乘 `devicePixelRatio`。`pdf-session.ts` 把写死的 `zoom: 1` 改成这个比例。backing store 仍走 `renderSize`，也就是缩放乘 dpr，再受像素上限约束。`PROVISIONAL_PAGE_PIXEL_CAP` 保持 `Number.POSITIVE_INFINITY`。不抄 `2 ** 25`。

锚点是 G-5：保持当前可见页，不做指针锚点。先改每一页的占位尺寸，再把滚动调到同一页仍在视口里。不把缩放写进位置历史。

播报：手势结束后，一个 `role="status"` 写一次百分比。滚动不写。按钮一点就算结束。不和页码播报、迷路那句共用一个节点，避免后一次把前一次顶掉。不使用 toast。毫秒数不写进计划。滚轮和捏合若需要「停手」的间隔，常量放在实现里，PR 说明里写出这个数。

加载前和出错时不渲染 −、百分比、+。这时菜单里的缩放项点了也没有作用。文献库里这几项仍不置灰，点了仍没有作用（6-3 A）。

## 滚轮和捏合

写监听之前先测，结果进 `docs/evidence/<该 PR>/commands.md`。Electron 不是 45.2.1 就停。

1. 打开窗口后打印 `typeof contents.setZoomMode`。不是 `"function"` 就不调用。拦住整页缩放不依赖这个 API。
2. 还没加监听时在 PDF 栏上捏合，看标题栏和画布变不变，并看 `setVisualZoomLevelLimits` 在不在。捏合已经在缩放整窗，就停下来再问，不改 main。
3. 还没加监听时 Ctrl+滚轮，记下窗口缩放因子和标题栏字号。加上 `preventDefault` 后再测一次。标题栏必须不变，因子仍是 1。没有 Ctrl 的 wheel 只滚动。

监听用 `addEventListener("wheel", …, { passive: false })`，只在 Ctrl 或 ⌘ 时 `preventDefault`。方向调用 `previousZoomPercent` 或 `nextZoomPercent`。Chromium 里触控板捏合常常是带 Ctrl 的 wheel。若事件能给出连续比例，松手时只用 `clampZoomPercent`，不用 UI 里的数组。若只能拿到带 Ctrl 的 wheel，就一格一档。测完再定，计划不猜事件名。

e2e 复用阅读屏导航那条的临时 `userData`。Ctrl+滚轮之后 `getZoomFactor()` 仍是 1，画布的 CSS 尺寸变大。不调用 `webFrame.setZoomFactor`。

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
- Ctrl+滚轮，以及触控板捏合。没有触控板就标未验证。
- 百分比只播一次。
- 加载中和打不开时没有这组控件。菜单里的缩放项点了没有作用。
- §10 第 2–4 项的测量写进该 PR 的 `commands.md`。
- 两笔都合入之后，在确认是 8 GB 的 Windows 上按 `docs/evidence/210/commands.md` 实测。不自定 MB，不改像素上限。打开期间不改系统缩放。

## 不做

N2：打开时逐页 `getPage`。N3：阅读中途改系统缩放并重画。N4：每次滚动测量全部页。三种视图的空态。配置存储和 chip。侧栏、Aa、大纲。Range、`disableRange`。CSP、wasm、`blob:`、`.mjs`、协议注册、`bypassCSP`。经 IPC 送整份 PDF。改 core、domain、`pure.ts`、contracts、`library/src`。改 `library-wiring.ts` 和其他主进程文件。分块渲染。`PDFDocumentProxy.cleanup()`。按文档记住缩放。把 `expose` 改成 true。自定 MB 或像素上限。改 DESIGN。Ready、合入、发版。

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 拆成 E1c-2a 和 E1c-2b | 重算约 840 行，超过 600。2a 约 548，2b 约 294。不写放行理由 | 2026-11-15 | 本计划的估算。Forge 排序，非业主决定 |
| 不改 `library-menu.ts` | 四项已经派发。适合页面不进应用菜单 | 2026-11-15 | 沿用 E1c 计划。依据是批次 E 计划第 94 行 |
| 不记住缩放 | 6-2 A。DESIGN §11.3 的记住缩放不改正文 | 2026-11-14 14:13 | Wisdom。台账对应 [评论 6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563) |
| 锚点用当前可见页 | G-5。规格没写指针锚点 | 2026-11-14 | 批次 E 计划。Loom 建议，不是新的业主决定 |
| 百分比单独一个 `role=status` | 不顶掉页码或迷路那句。仍是就地播报，不是 toast | 2026-11-15 | 本计划。Forge 可以改 |

## 证据链接

- 这一笔没有 `docs/evidence/<PR号>/`。测量写在实现那一笔。
- 8 GB 的测法已在 `docs/evidence/210/commands.md`。

## 自检

- [x] 影响 arch / prd 吗？不影响。不改 PRD、ARCHITECTURE、DESIGN。
