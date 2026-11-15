# 执行计划

E1c-2，阅读屏缩放。从 main `ba6a71e803d0640f11ab97ef3edc919379173050` 开工。parent 是 `d5d5ea2`，tree 是 `85a6fefb`。2026-11-15 07:05 Wisdom 原话是「批准，按照你的建议做吧」，见台账和 [评论 6885626184](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6885626184)。先交台账和计划。Forge 审查计划 PASS 之后才实现，实现范围以这份计划为准。不含 Ready、合入、发版，这三件仍要单独批准。

范围以 [E1c 计划](feature-reader-render-e1c-174.md) 的「E1c-2」为准，并落实 [批次 E 计划](feature-reader-nav-zoom-174.md)。E1c 计划把这一笔估成 504 行。按文件重算，含测试和证据，大约 840 行，超过 600。Forge 计划审查 r1（[评论 6885763111](https://github.com/wisdom-km/open-immerse-v2/pull/213#issuecomment-6885763111)）选用方案甲：本 PR 只放计划和台账。合入前要 Wisdom 单独批准，07:05 不含合入。实现等本 PR 合入后，从当时的 main 另开。PR #212 估了 436，合入时 pr-size 是 755，多了 73%。下面每一份实现 PR 的估算乘 1.73 仍不超过 600。超过 600 就停下，把实际行数和拆分建议报给 Forge，不写放行理由。Forge 计划审查 r2（[评论 6885978232](https://github.com/wisdom-km/open-immerse-v2/pull/213#issuecomment-6885978232)）把状态和占位合成「2a 核心」，控件留在后面。

## 现状理解

- 现在已有的行为：E1c-1 已合入。视图菜单有放大、缩小、实际大小、适合宽度，只派发 `oi-zoom-in`、`oi-zoom-out`、`oi-zoom-actual`、`oi-zoom-fit-width`。shell 不听这四项。`pdf-session.ts` 把 `zoom` 写成 1。`frameStyle` 用页盒的宽高做占位，不乘缩放。没有 − / 百分比 / +。档位已在 `pure.ts`：`nextZoomPercent`、`previousZoomPercent`、`clampZoomPercent`、`ZOOM_PERCENT_MIN`（25）、`ZOOM_PERCENT_MAX`（400）、`DEFAULT_ZOOM_PERCENT`（100）。`resolveZoomPercent` 能算适合宽度和适合页面。`PROVISIONAL_PAGE_PIXEL_CAP` 是 Infinity。Electron 是 45.2.1。
- 相关的节：[DESIGN.md](../../DESIGN.md) §11.3（C31）、§11.8；[docs/design-principles.md](../design-principles.md) P4、P5、P7；[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1、§6；批次 E 计划的缩放行、第 94 行、G-5、§10 第 2–5 项和第 11 项。6-2 A（台账 2026-11-14 14:13）不记住缩放，每次打开 100%，UIX-56 的「按文档记住」未满足。这覆盖 DESIGN §11.3「按文档记住缩放级别」。不改 DESIGN 正文（N-10）。
- 还没做的部分：占位乘缩放、当前页锚点、百分比播报、边界置灰、加载前和出错时不显示控件、`passive: false` 的滚轮、捏合、Ctrl+滚轮的 e2e、百分比菜单底行。实测含 §10 第 2–5 项和第 11 项，以及下面真机清单里的 R-E3、R-E4、R-E7、R-E8、R-E9、R-E12、R-E13。N2、N3、N4 不在本批。8 GB 实测在 2a 两份合入之后。测法在 `docs/evidence/210/commands.md`。原文 / 对照 / 译文是 E2。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | PR #213：本文件、台账、规格记录。不写产品代码。合入前要 Wisdom 单独批准 |  |  |
| 2 | #213 合入后，从新 main 开 Draft。2a 核心：状态、档位、播报、卸下时摘监听、占位乘缩放、当前页锚点。菜单和快捷键会真的缩放 PDF 栏。还没有工具栏按钮 | 缩放锚点读当前可见页几何。适合宽度的 `resolveZoomPercent` 接线挪到控件 PR。播报节点常驻。`reader-screen.tsx` 258 行。pr-size 600 | `use-zoom.test.tsx`、`page-column.test.tsx`、`pdf-session.test.ts`、`reader-nav.spec.ts` |
| 3 | 核心合入后，从新 main 开 Draft。2a 控件：− / 百分比 / +、百分比菜单、tooltip |  |  |
| 4 | 控件合入后，在 2b 里、写监听之前先测。结果写入该 PR 的 `docs/evidence/<PR号>/commands.md`。捏合已经在缩放整窗就停，不写滚轮产品代码。见「第 4 步叫停」 |  |  |
| 5 | 第 4 步没有叫停，才写 2b 的滚轮、捏合和 Ctrl+滚轮 e2e。仍是这一个 PR |  |  |

## 拆分

`check-pr-size` 把新增和删除都算进去。下表是非生成行，含该 PR 里回填的「实际」列。建议上限和硬上限见 [docs/arch/06.md](../arch/06.md)：React 组件建议 250、硬上限 400；普通源文件建议 400、硬上限 600；测试建议 600、硬上限 800。超过建议上限时，该 PR 正文写明为什么不拆。

1.73 来自 PR #212：`(755 − 436) / 436`。一份 PR 的估算要 ≤ 346，乘 1.73 才仍 ≤ 600。上一稿把状态和占位拆开：钩子若放在控件里，页列和 session 拿不到同一个值；只合入状态则没有调用方；只合入控件则百分比会变、页面不会变大。审查 r2 因此把状态和占位合成核心，控件放在后面。上一稿三份相加是 154 + 301 + 128 = 583，不是 582。核心加控件按本表是 339 + 300 = 639，乘 1.73 约 1105，仍然超过 600，所以这两份不合在一起。2b 单独留着，因为它依赖第 4 步的实测。

| PR | 装什么 | 估算 | ×1.73 |
| --- | --- | --- | --- |
| #213 | 本文件、台账、规格记录。没有产品代码 | 只有文档 |  |
| 2a 核心 | 状态、档位、播报、占位、锚点、菜单经 shell 调用命令、菜单放大的窗口系数 | 339 | 586 |
| 2a 控件 | 按钮、百分比菜单、tooltip、样式 | 300 | 519 |
| 2b | 滚轮、捏合、Ctrl+滚轮 e2e、测量记录。第 4 步叫停就不写产品代码 | 298 | 516 |

任一实现 PR 的非生成行超过 600，就停下，不推那个提交。把 `git diff --numstat` 的实际行数，以及建议怎么再拆，报给 Forge。不写放行理由。不把下一份的文件塞进这一份。不把 PR 标成 Ready。

2a 核心，合计 339。`use-reader-session.ts` 计 0，不改变这个和。审查 r4 把 `shell.tsx` 从 6 行改成 16 行，比上一稿多 10。`use-bound-nav.ts` 用展开写法，仍计 8 行。测试按表里的 25 行计，339 × 1.73 = 586，余量 14 行。测试若是 20 行，合计 334，乘 1.73 是 578；若是 30 行，合计 344，乘 1.73 是 595。不用展开、`use-bound-nav.ts` 到 14 行时，合计 345，345 × 1.73 = 597，余量 3 行。这些都没有超过 600，适合宽度留在核心。测试取 30 行、同时不用展开时合计 350，350 × 1.73 = 606，已经超过 600。实现时非生成行超过 600，就把适合宽度（`resolveZoomPercent` 的接线和对应测试）挪到控件那一份，不写放行理由。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/use-zoom.ts` 新建 | 80 | 80 | 不会。普通文件 |
| `packages/features/reader/src/ui/copy.ts` | 20 | 32 | 不会 |
| `packages/features/reader/test/ui/use-zoom.test.ts` 新建 | 50 | 50 | 不会 |
| `packages/features/reader/src/ui/page-column.tsx` | 40 | 189 | 不会。现 149，组件建议 250 |
| `packages/features/reader/src/ui/pdf-session.ts` | 14 | 270 | 不会。现 258，普通文件建议 400 |
| `packages/features/reader/src/ui/use-reader-session.ts` | 0 | 258 | 不改。普通文件建议 400，硬上限 600。见下面的路径 |
| 既有绘制测试改断言 | 40 |  | 不会 |
| `apps/desktop/e2e/` 里菜单「放大」后看窗口因子 | 30 |  | 不会。用 `clickMenu("放大")`。PR212 已证实 CI 上用 Playwright 按快捷键不会触发菜单 accelerator |
| `packages/features/reader/src/ui/reader-screen.tsx` | 6 | 253 | 现 247。超过建议上限 250，停在 260。见下面 |
| `packages/features/reader/src/ui/reader-client.ts`、`asset-pdf.ts`、`open-reading.ts` | 6 |  | 不会。`PdfPaint` 增加 zoom，后两个文件只把参数往后传。现各 50、67、151 行 |
| `apps/desktop/src/renderer/shell.tsx` | 16 | 136 | 现 120。import 加 4 个名字，`MenuNav` 加 4 个命令，`names` 加 4 项，`menuAction` 加 4 个分支 |
| `packages/features/reader/src/ui/use-bound-nav.ts` | 8 | 61 | 现 53。用展开写法，见下面。四个命令各自写成函数会到 12–14 行 |
| shell 或阅读屏测试 | 25 |  | 浮动 20 到 30。用到 `paint` 的现有测试跟着改签名 |
| 本文件「实际」列的回填 | 4 |  | 文档 |

`useZoom` 在 `ReaderScreen` 里调用一次，不碰 window 事件。它只提供百分比、档位和四个命令。`shell.tsx` 的 16 行是这四处：import 加上 `shell-events.ts` 里已有的 `zoomInEvent`、`zoomOutEvent`、`zoomActualEvent`、`zoomFitWidthEvent`，`MenuNav` 加四个命令，`names` 加这四项，`menuAction` 加四个分支。不在 `shell.tsx` 再写一遍字面值。`ReaderNav` 增加 `zoomIn`、`zoomOut`、`zoomActual`、`zoomFitWidth`。`use-bound-nav.ts` 用展开写法，仍计 8 行：`navCommands` 多收一个缩放命令对象，返回值里写 `...zoom`；`bind` 沿用已有的 `call(key)`，不把四个命令各自写成函数。各自写成函数会到 12–14 行。事件名仍只写在 `shell-events.ts`。reader 包不出现这四个字面值，也不成为订阅方。

核实过 RULES 第 89 行。给事件新增发布方或订阅方才要登记 `contracts/src/ui-events.ts` 并附 ADR。`contracts/src/ui-events.ts` 不存在。`oi-open-file` 是 #172 加的，没有登记。`oi-return-library` 是 #199 加的，不是 PR212 加的，也没有登记。PR212 加的 `oi-history-back`、`oi-history-forward`、`oi-go-to-page` 没有登记，`shell.tsx` 已经在听这三项，也在听 #199 的 `oi-return-library`。放大这四项的发布方仍是桌面菜单，订阅方仍是这个 shell，不是新的切片。reader 包不订阅。因此这次不登记，不改 contracts。G5 的 `ui-events-declared` 仍是延后项。RULES 第 89 行和架构正文「切片间」的分歧是审查 r4 的 H1，不在这一份里定，也不挡本 PR。

绘制路径是这一条。`use-reader-session.ts` 只持有 `ReadingView`，`paint` 在 `open-reading.ts` 里创建。这个钩子不调用 `paint`，也不接收 zoom，所以保持 258 行，不改。普通源文件建议上限 400，硬上限 600。`ReaderScreen` 从 `session.phase.reading.paint` 取出绘制函数，把百分比另传给 `ReaderBody` 和 `page-column`。`page-column` 第 89 行的 effect 依赖加上 zoom，调用 `paint(page, canvas, zoom)`。`PdfPaint` 定义在 `reader-client.ts` 第 8 行，从 `(page, canvas)` 加上 zoom。`open-reading.ts` 和 `asset-pdf.ts` 把这个参数传到 `pdf-session.ts` 的 `drawPage`，替换写死的 `zoom: 1`。用到 `paint` 的测试跟着改签名。锚点要用的 `session.columnRef` 和当前页已经在 `ReaderScreen`。

加载前或出错时，四个命令直接返回。卸下时 `onLeave` 已经把 `navRef` 清掉，之后菜单事件再到 shell，状态不变。

`reader-screen.tsx` 这一份大约多 6 行，用掉审查 r1 已经同意的「最多到 260」。核心 PR 的正文写「为什么不拆」：状态必须在栏和页列的共同上层创建一次；把栏抽成新文件会把挪走的行按新增再加删除重计。超过 260 就停下，把实际行数报给 Forge，不写放行理由。

核心合入之后，菜单的放大、缩小、实际大小、适合宽度，以及对应快捷键，会缩放 PDF 栏，带当前页锚点和百分比播报。到 25% 和 400% 时快捷键不生效（6-3 A）。没有工具栏按钮。没有没人调用的钩子。

2a 控件，合计 300。钩子的 6 行已经算进核心，这里不再计那 3 行，所以比上一稿的 301 少 1。乘 1.73 是 519。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/zoom-controls.tsx` 新建 | 130 | 130 | 不会。组件建议 250。不在这里创建缩放状态 |
| `apps/desktop/src/renderer/reader.css` | 24 | 137 | 不会 |
| `packages/features/reader/src/ui/reader-screen.tsx` | 2 | 255 | 核心之后大约 253。这里只在栏里加 `<ZoomControls zoom={…} />`，大约 1 到 2 行。停在 260，还剩大约 5 行。超过 260 就停下并报告 |
| `packages/features/reader/test/ui/zoom-controls.test.tsx` 新建 | 140 | 140 | 不会。含点击 + 后百分比改变。不另开 e2e 文件 |
| 本文件「实际」列的回填 | 4 |  | 文档 |

控件合入之后才出现 −、百分比、+ 和百分比菜单。

2b，合计 298。只在第 4 步没有叫停时写产品代码。叫停时这个 PR 只留证据。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `packages/features/reader/src/ui/zoom-gesture.ts` 新建 | 70 | 70 | 不会 |
| `page-column.tsx` 挂上监听 | 24 | 213 | 不会。仍低于 250 |
| 手势单测 | 70 |  | 不会 |
| `apps/desktop/e2e/` 里 Ctrl+滚轮 | 90 |  | 不会。测试建议 600 |
| `docs/evidence/<PR号>/commands.md` | 40 |  | 文档。第 4 步和第 5 步的测量都写在这个文件 |
| 本文件「实际」列的回填 | 4 |  | 文档 |

2b 的 e2e 接受现有 fixture，这一轮不修。`apps/desktop/e2e/fixtures/electron-app.ts` 在 `electron.launch` 之后才读 `getPath("userData")`，再期望它等于临时目录。这个顺序用来证明启动参数已经生效。改到启动之前会碰到每一条 e2e，和「只放大 PDF 栏」无关。断言失败就停。这是 PR212 r1 的 n5。

PR212 r1 的 n2 这一轮不处理。那一条是 shell 层的 `flushSync` 只测过一次。shell 只加四项，`flushSync` 那条路径不变。

这几份都不改 `apps/desktop/src/main/`。`library-menu.ts` 也不改。依据：E1c-1 已经登记四项并派发事件。适合页面不进应用菜单，只进百分比菜单（批次 E 计划第 94 行）。百分比菜单在渲染进程，不新增主进程菜单项。

改 `shell.tsx`，只加 import 里的四个名字、`MenuNav` 的四个命令、`names` 的四项和 `menuAction` 的四个分支。不改 `apps/desktop/src/main/`。`use-zoom.ts` 不监听 window 事件。加载前和出错时命令直接返回。卸下后 `navRef` 已空，再派发这四个菜单事件，状态不变。

## 行为

系统菜单和按钮用现成的。不造滑块，不用 `zoomIn` / `zoomOut` / `resetZoom` role，不调用 `webFrame.setZoomFactor`。百分比菜单是批次 E 计划第 94 行已经写明的渲染进程菜单：点百分比打开，底行是「只缩放 PDF 原文栏；界面跟随系统缩放」。字面值以 #206 第 94 行为准，出处是 DESIGN 第 718 行。这一行不是命令。适合页面只出现在这个菜单里。− 和 + 是按钮，`disabled` 表示不可用，不只靠颜色。tooltip 带快捷键：Windows / linux 是 Ctrl+=、Ctrl+−、Ctrl+0、Ctrl+Alt+0；mac 是 ⌘=、⌘−、⌘0、⌥⌘0。名称用「放大」「缩小」「实际大小」「适合宽度」「适合页面」。

档位只调用 `pure.ts` 已导出的函数。+ 用 `nextZoomPercent`，− 用 `previousZoomPercent`。实际大小用 `DEFAULT_ZOOM_PERCENT`。适合宽度、适合页面用 `resolveZoomPercent`，里面已经 `clampZoomPercent`。边界用 `ZOOM_PERCENT_MIN` 和 `ZOOM_PERCENT_MAX`。25% 时 − 置灰，快捷键什么都不做。400% 时 + 置灰，快捷键什么都不做。不在 UI 里再写一张档位表。不改 `zoom-bounds.ts`、`pure.ts`、domain。

不记住缩放。每次打开是 100%。不调用 `setZoom`。UIX-56 的「按文档记住」仍未满足。

占位：`frameStyle` 的宽高乘 `zoomPercent / 100`。CSS 不乘 `devicePixelRatio`。`pdf-session.ts` 把写死的 `zoom: 1` 改成这个比例。backing store 仍走 `renderSize`，也就是缩放乘 dpr，再受像素上限约束。`PROVISIONAL_PAGE_PIXEL_CAP` 保持 `Number.POSITIVE_INFINITY`。不抄 `2 ** 25`。

锚点是 G-5：保持当前可见页，不做指针锚点。先改每一页的占位尺寸，再把滚动调到同一页仍在视口里。不把缩放写进位置历史。

播报：一个 `role="status"` 写一次百分比。滚动不写。按钮一点就算手势结束，随即写一次，没有停手间隔。滚轮和捏合的停手时长统一为批次 E 计划第 37 行的「暂定 300 毫秒」：停手后再写一次。Forge 可以改这个数。不和页码播报、迷路那句共用一个节点，避免后一次把前一次顶掉。不使用 toast。

PDF 栏缩放不加过渡动画。已核对 DESIGN：§3.5 第 271 行的「缩放」是位移和缩放这类动效，在 `prefers-reduced-motion: reduce` 时改为不动画；DS-07（第 821 行）是同一句。§11.3 没有要求 PDF 栏缩放带过渡。两处不相反，按「不加过渡动画」写。

加载前和出错时不渲染 −、百分比、+。这时菜单里的缩放项点了也没有作用。文献库里这几项仍不置灰，点了仍没有作用（6-3 A）。

## 行为断言

只断言行为，不读源码文本做断言（F-08）。批次 E 计划第 339 行是同一句。用例落在上表已经计入的测试文件里。

- 边界置灰：25% 时 − 带 `disabled`，400% 时 + 带 `disabled`。置灰后再派发对应事件，百分比不变。
- 加载前和出错时没有控件：没有 −、百分比、+。这时调用四个缩放命令，百分比和外框都不变。
- 卸下后派发事件，状态不变：阅读屏卸下之后，shell 再收到四个菜单事件，百分比不变。`use-zoom.ts` 自己不监听 window。
- 当前页锚定：缩放之后，缩放前的当前页仍与视口相交（G-5，批次 E 计划第 199 行）。
- 百分比只播一次：写进它自己的 `role="status"` 一次。页码那句和迷路那句还在。
- 占位尺寸乘以缩放比例：外框宽高等于页盒乘 `zoomPercent / 100`。
- 适合宽度和适合页面的百分比都来自 `resolveZoomPercent`。
- 百分比菜单底行的文字等于「只缩放 PDF 原文栏；界面跟随系统缩放」。字面值以 #206 第 94 行为准，出处是 DESIGN 第 718 行。适合页面只出现在这个菜单里。测试用这个字面值，不从 copy 导入。
- `renderSize` 的倍数是缩放乘 dpr。`PROVISIONAL_PAGE_PIXEL_CAP` 仍是 Infinity。只断言行为。
- tooltip 两个分支都测（PR212 r1 的 n6）：快捷键按 `navigator.userAgent` 分 mac 和 Windows。测试用 `vi.spyOn` 或 `Object.defineProperty` 各设一次。linux 走 Windows 那一支。不只测 Windows。

## 滚轮和捏合

写监听之前先测，结果进该 PR 的 `docs/evidence/<PR号>/commands.md`。Electron 不是 45.2.1 就停。

1. §10 第 2 项，批次 E 计划第 208 行：打开窗口后打印 `typeof contents.setZoomMode`。不是 `"function"` 就不调用。拦住整页缩放不依赖这个 API。
2. §10 第 3 项，批次 E 计划第 209 行：还没加监听时在 PDF 栏上捏合，看标题栏和画布变不变，并看 `setVisualZoomLevelLimits` 在不在。捏合已经在缩放整窗，就按「第 4 步叫停」停，不改 main。
3. §10 第 4 项，批次 E 计划第 210 行：还没加监听时 Ctrl+滚轮，记下窗口缩放因子和标题栏字号。加上 `preventDefault` 后再测一次。标题栏必须不变，因子仍是 1。没有 Ctrl 的 wheel 只滚动。
4. §10 第 5 项，批次 E 计划第 211 行：Ctrl++ 在 Windows 美式键盘和中文输入法下的实际键。输入法开、关各一遍，分别按 Ctrl+=、Ctrl+Shift+=、小键盘 +/−。哪一个进了放大或缩小，写进证据。计划不预先声称全部生效。Ctrl+= 进不了放大就停下来问。不加隐藏菜单项，也不加 keydown。
5. §10 第 11 项，批次 E 计划第 217 行。原文还记了 Alt+←、⌘[ 和 Ctrl+1/2/3。这一份把缩放相关的两键扩进来：页码输入框聚焦时，Ctrl+0 和 Ctrl+− 会不会被菜单快捷键抢走。Alt+← 仍在上面的并入清单里。被抢走就停，不加第二套 keydown。Ctrl+1/2/3 是视图，留给 E2。

监听用 `addEventListener("wheel", …, { passive: false })`，只在 Ctrl 或 ⌘ 时 `preventDefault`。方向调用 `previousZoomPercent` 或 `nextZoomPercent`。Chromium 里触控板捏合常常是带 Ctrl 的 wheel。若事件能给出连续比例，松手时只用 `clampZoomPercent`，不用 UI 里的数组。若只能拿到带 Ctrl 的 wheel，就一格一档。测完再定，计划不猜事件名。

e2e 复用阅读屏导航那条的临时 `userData`，并接受上面写的 fixture 顺序。Ctrl+滚轮之后 `getZoomFactor()` 仍是 1，画布的 CSS 尺寸变大。不调用 `webFrame.setZoomFactor`。

## 第 4 步叫停

监听还没加时，捏合已经在缩放整窗，就停。2b 不写滚轮和捏合的产品代码，不改 main。测量已经写下的证据留在这个 PR。

带回这些数据：Electron 版本；`typeof contents.setZoomMode`；`setVisualZoomLevelLimits` 在不在；捏合前后标题栏和画布有没有变；Ctrl+滚轮前后的窗口缩放因子和标题栏字号。

因此没满足的是 DESIGN §11.3 第 717 行这一句：触控板捏合、Ctrl+滚轮同样缩放 PDF 栏。核心和控件仍然交付菜单缩放、按钮、百分比菜单、快捷键、25%–400%、当前页锚点和播报。适合页面仍只在百分比菜单。

核心那一份证明缩放只放大 PDF 栏、窗口缩放系数仍是 1：e2e 用 `clickMenu("放大")` 之后 `getZoomFactor()` 仍是 1，画布的 CSS 尺寸变大。单测断言外框是页盒乘缩放。这条 e2e 在核心，不依赖 2b，也不依赖工具栏按钮。控件那一份用单测覆盖点击 +。几份都不调用 `webFrame.setZoomFactor`。

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
- R-E3，批次 E 计划第 358 行：精确式触控板的捏合和双指滚动。没有触控板就标未验证。
- R-E4，批次 E 计划第 359 行：Ctrl+= / Ctrl+- / Ctrl+0 / Ctrl+Alt+0，美式键盘，中文输入法开和关。
- 百分比只播一次。用 NVDA 测第一次按「放大」时能听到百分比。播报节点从打开起就在页面上。锚点按缩放开始时的可见页和页内比例，不读 shownPage。真机上看页内位置会不会漂，当前页仍要留在视口里。
- 加载中和打不开时没有这组控件。菜单里的缩放项点了没有作用。
- §10 第 2–4 项是批次 E 计划第 208–210 行，第 5 项是第 211 行，第 11 项是第 217 行。测量写进 2b 那个 PR 的 `commands.md`。
- R-E7，批次 E 计划第 362 行：显示缩放 200% 下的 100% / 200% / 400%。并入 00:28 批准的真实系统缩放清晰度检查，测法抄 `docs/evidence/210/commands.md`：先改系统缩放，再重启应用、重新打开 PDF，然后核对 `devicePixelRatio` 和 canvas 的 `width` 都已经跟着变了。不要在 PDF 已经打开时改系统缩放再记数。改 Windows 显示缩放要 Wisdom 当时本人批准。没有这句批准就不改显示缩放，本项标未验证。
- R-E8，批次 E 计划第 363 行：高对比主题。缩放下要看 −、百分比、+ 和置灰态。
- R-E9，批次 E 计划第 364 行：Narrator 读出按钮名称，页码和百分比各播一次。没有 Narrator 时用 NVDA，并标明。
- R-E12，批次 E 计划第 366 行：25 页以上的 PDF，快速滚到底再回顶，100% 和 400% 各一次。看滚动条长度和页框。离开窗口的 canvas 先把宽高设为 0 再移出。
- R-E13，批次 E 计划第 367 行：8 GB 机器上 400% 再加显示缩放 200% 的内存峰值。按同计划第 218 行和 `docs/evidence/210/commands.md` 记四个点：100%、200%、400%，以及 400% 加显示缩放 200%。记下画布像素字节合计，以及任务管理器里渲染进程的专用工作集。不自定 MB，不改像素上限。2a 两份合入之后再测。机器未核实是 8 GB 就标未验证并停。更高内存的机器不能代替。改 Windows 显示缩放要 Wisdom 当时本人批准。

## 不做

N2：打开时逐页 `getPage`。N3：阅读中途改系统缩放并重画。N4：每次滚动测量全部页。三种视图的空态。配置存储和 chip。侧栏、Aa、大纲。Range、`disableRange`。CSP、wasm、`blob:`、`.mjs`、协议注册、`bypassCSP`。经 IPC 送整份 PDF。改 core、domain、`pure.ts`、contracts、`library/src`。改 `library-wiring.ts` 和其他主进程文件。分块渲染。`PDFDocumentProxy.cleanup()`。按文档记住缩放。把 `expose` 改成 true。自定 MB 或像素上限。改 DESIGN。Ready、合入、发版。

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先交台账和计划，审过才实现 | 原话「批准，按照你的建议做吧」。E1c-2 照 Forge 的建议推进。实现范围以这份计划为准 | 2026-11-15 07:05 | Wisdom。台账对应 [评论 6885626184](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6885626184) |
| #213 只放计划和台账；实现分成核心、控件、滚轮 | 审查 r1 的方案甲，审查 r2 把状态和占位合成核心。审查 r3 补上 shell 接线和 `PdfPaint` 之后，核心 329，控件 300，滚轮 298。上一稿三份相加是 583。核心加控件是 629，乘 1.73 约 1088，不合在一起。超过 600 就把适合宽度挪到控件那一份，不写放行理由 | 2026-11-15 | Forge 计划审查 r3，[评论 6886102293](https://github.com/wisdom-km/open-immerse-v2/pull/213#issuecomment-6886102293) |
| `useZoom` 在 `ReaderScreen` 调用一次，不碰 window 事件 | 菜单沿用 PR212。shell 已是菜单事件的订阅方，`oi-zoom-*` 在 PR212 里没有登记，这次也不登记。`use-reader-session.ts` 保持 258 行，建议上限 400，硬上限 600 | 2026-11-15 | 本计划的核实。审查 r3 的 B1 |
| 底行字面值以 #206 第 94 行为准 | 出处是 DESIGN 第 718 行 | 2026-11-15 | Forge 计划审查 r3 的 n1 |
| 核心 shell 计 16 行，合计 339 | 审查 r4：import、`MenuNav`、`names`、`menuAction` 各约 4 行。`use-bound-nav.ts` 用展开写法仍计 8。339 × 1.73 = 586，余量 14 行。不用展开会到 345 × 1.73 = 597，余量 3 行。超过 600 仍把适合宽度挪到控件那一份 | 2026-11-15 | Forge 计划审查 r4，[评论 6886274662](https://github.com/wisdom-km/open-immerse-v2/pull/213#issuecomment-6886274662) |
| 滚轮和捏合的停手时长是「暂定 300 毫秒」 | 批次 E 计划第 37 行。按钮没有停手间隔，一点就播 | 2026-11-15 | 批次 E 计划。Forge 可以改这个数 |
| 2b 接受启动之后才核对 userData | PR212 r1 的 n5。这个顺序证明启动参数已生效。改它会碰到每一条 e2e | 2026-11-15 | 本计划。审查 r1 要求写明是修还是接受 |
| PDF 栏缩放不加过渡动画 | DESIGN §3.5 第 271 行和 DS-07 说的是动效里的缩放，§11.3 没有要求过渡。两处不相反 | 2026-11-15 | 本计划。已核对 DESIGN |
| 不改 `library-menu.ts` | 四项已经派发。适合页面不进应用菜单 | 2026-11-15 | 沿用 E1c 计划。依据是批次 E 计划第 94 行 |
| 不记住缩放 | 6-2 A。DESIGN §11.3 的记住缩放不改正文 | 2026-11-14 14:13 | Wisdom。台账对应 [评论 6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563) |
| 锚点用当前可见页 | G-5。规格没写指针锚点 | 2026-11-14 | 批次 E 计划。Loom 建议，不是新的业主决定 |
| 百分比单独一个 `role=status` | 不顶掉页码或迷路那句。仍是就地播报，不是 toast | 2026-11-15 | 本计划。Forge 可以改 |

## 证据链接

- PR #213 没有 `docs/evidence/<PR号>/`。§10 的测量和第 4 步叫停带回的数据，写在 2b 的 `docs/evidence/<PR号>/commands.md`。核心和控件不新建证据目录。
- 8 GB 的测法已在 `docs/evidence/210/commands.md`。四个点写在上面的 R-E13。

## 自检

- [x] 影响 arch / prd 吗？不影响。不改 PRD、ARCHITECTURE、DESIGN。
