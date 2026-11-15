# 执行计划

E1c-2 的 2b：阅读器缩放的滚轮、触控板捏合、Ctrl+滚轮。基线 main `0667c0ddffb71756811b74fb27e192c7bd026ccd`（PR #216 已合入）。2a 核心是 PR #215，2a 控件是 PR #216。本文件自洽。任务类型是纯文档。实现是 UI 改动，切片是 reader。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败。seam 不够用时先停。

第一笔只有本文件。第二笔只补 [docs/approvals.md](../approvals.md)。两笔之后停下等 Forge 审查。不写产品代码，不标 Ready，不合入，不发版，不 force-push。

## 现状理解

- 现在已有的行为：菜单「放大 / 缩小 / 实际大小 / 适合宽度」和 − / 百分比 / + 会缩放 PDF 栏。命令在 `useZoom`（`packages/features/reader/src/ui/use-zoom.ts` 第 41–80 行）。`apply`（第 52–57 行）先 `rememberZoomAnchor`，再改百分比，再立刻 `setSpoken`。shell 经 `use-bound-nav.ts` 第 43 行 `...zoom` 调同一组 `ZoomCommands`。锚点写回在 `page-column.tsx` 第 137–151 行的 `placeZoomAnchor`，不读 `shownPage`（PR #215 F1）。适合宽度、适合页面在 `use-zoom.ts` 第 122–201 行量 CSS，先 `Math.floor`，再交 `resolveZoomPercent`。播报是 `.oi-reader-zoom` 这一个 `role="status"`（`zoom-controls.tsx` 第 24–28 行），和页码、迷路那句不是同一个节点。没有滚轮监听。`reader-screen.tsx` 258 行。Electron 依赖是 45.2.1。
- 相关的节：[DESIGN.md](../../DESIGN.md) §11.3（第 716–719 行）、§11.8、§3.5 第 271 行、DS-07；[docs/design-principles.md](../design-principles.md) P4、P5、P7 与 §4 第 4 条；[docs/arch/02-01.md](../arch/02-01.md)、[docs/arch/06.md](../arch/06.md)、[docs/arch/12.md](../arch/12.md)、[docs/arch/13.md](../arch/13.md) G12；[docs/exec-plans/feature-reader-zoom-e1c2-174.md](feature-reader-zoom-e1c2-174.md) 第 114、135–155、159–185 行；[docs/exec-plans/feature-reader-nav-zoom-174.md](feature-reader-nav-zoom-174.md) 第 37、199、208–211 行。不改 DESIGN 正文（N-10）。
- 还没做的部分：滚轮、捏合、Ctrl+滚轮，以及写监听之前的测量。不记住缩放。`.oi-reader-column article` 仍是 `min-height: 100%`（`reader.css` 第 113 行）。本计划不改这句。25% 时新页会不会被整页高度顶出视口，留给真机看。

## 计划 / 实际

计划列在开工前填。实际列与证据在做完后填。实现不进本 PR。

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本文件 |  |  |
| 2 | 台账补 15:37 与 17:58 两行 |  |  |
| 3 | Forge 审查本计划。PASS 之前没有实现提交 |  |  |
| 4 | 本 PR 合入后，从当时的 main 另开实现 PR。写监听之前先测。捏合已经在缩放整窗就停，不写滚轮产品代码 |  | `docs/evidence/<实现 PR 号>/commands.md` |
| 5 | 第 4 步没有叫停，才按下面的文件表写监听、单测和 e2e |  |  |

## 拆出 zoom-fit.ts

PR #216 第 1 轮 n3（[评论 6890312264](https://github.com/wisdom-km/open-immerse-v2/pull/216#issuecomment-6890312264)）的原话是：2b 再加东西之前，建议把适合尺寸的测量拆成 `zoom-fit.ts`。第 3 轮（[6890791155](https://github.com/wisdom-km/open-immerse-v2/pull/216#issuecomment-6890791155)）写成「2b 之前把适合尺寸的测量拆出去」。第 5 轮（[6892062439](https://github.com/wisdom-km/open-immerse-v2/pull/216#issuecomment-6892062439)）写明第 3 轮的 n3 仍然有效。本计划照做。行为不变。

从 `use-zoom.ts` 搬出这些，行号按 `0667c0d`：

| 符号 | 现在的行 | 搬到 zoom-fit.ts 之后 |
| --- | --- | --- |
| `MeasuredFit` | 122–126 | 不导出 |
| `measureFit` | 129–137 | 不导出 |
| `fitWidthPercent` | 139–149 | 导出 |
| `fitPagePercent` | 151–165 | 导出 |
| `clampFloor` | 167–173 | 不导出 |
| `axisChrome` | 175–188 | 不导出 |
| `pageFrame` | 190–196 | 不导出 |
| `px` | 198–201 | 不导出 |

留在 `use-zoom.ts`：`ZoomCommands`、`ZoomSession`、`ZoomState`、`PageSize`、`useZoom`、`apply`、`Hold`、`rememberZoomAnchor`、`measureHold`、`placeZoomAnchor`。

导出面只有 `fitWidthPercent(session)` 和 `fitPagePercent(session)`，返回 `number | undefined`。`zoom-fit.ts` 自己声明一个结构上与 `ZoomSession` 相同的参数类型，不从 `use-zoom.ts` 导入，避免循环。`use-zoom.ts` 只导入这两个函数。`resolveZoomPercent`、`ZOOM_PERCENT_MIN`、`ZOOM_PERCENT_MAX` 仍从 `pure.ts` 来。`readVisible` 仍从 `use-reader-session.ts` 来。

测试不跟着搬文件。`use-zoom.test.tsx` 第 60–107 行已经用 `zoomFitWidth` / `zoomFitPage` 走命令。搬走测试会把同一段按新增再加删除重计。n9（`clampFloor` 的非有限分支）在这个文件加一条：栏的宽度不是有限数时，命令不改百分比、不写播报。n10（`px` 在 `undefined` 时返回 0）不单测：`getComputedStyle` 给的是字符串，经命令看不出这一支；不为它导出 `px`。

## 复评 UI 层取整

适合宽度和适合页面继续在 UI 层 `Math.floor`，放在 `zoom-fit.ts` 里，仍在调用 `resolveZoomPercent` 之前。不下沉到 core、domain、`pure.ts`。

理由：预算来自栏的 `clientWidth` 和 `getComputedStyle` 的 padding、border。这些是 DOM 测量。domain 不能碰 `document`（[docs/arch/02-01.md](../arch/02-01.md)，G14）。`clampZoomPercent`（`zoom-bounds.ts` 第 35–43 行）用 `Math.round`。页宽 250、预算 239 时，95.6 会进成 96，内容宽 240，超出预算，出现滚动条。先 floor 得到 95，再交给已经存在的 seam。把 floor 改进 `clampZoomPercent` 会改 core 的取整，UI 任务不能改 core（RULES §8 规则 2，N-16、N-21）。25–400 和档位表仍只在 core。P7：界面把测量翻译成一次 seam 调用。这次不改 seam 的形状。

第 3 轮的原则风险是：适合宽度和适合页面都在 UI 层做 floor，然后才交给 `resolveZoomPercent`，要在 2b 之前重新评估。第 5 轮仍写「适合尺寸在 UI 层取整」。按这一节收口：留在 UI。不是新的业主决定。

## 2b 输入

优先用系统的 `wheel`。不造滑块，不加手势识别器，不用 `zoomIn` / `zoomOut` / `resetZoom` role，不调用 `webFrame.setZoomFactor`。Chromium 里触控板捏合是带 `ctrlKey` 的 `wheel`。Ctrl+滚轮是同一个事件。mac 上若捏合不带 `ctrlKey`，第 4 步叫停，不另猜事件名。

监听加在 `useZoom` 里，对 `session.columnRef` 的栏调用 `zoom-gesture.ts` 的挂上函数，`{ passive: false }`。卸下时摘掉。`reader-screen.tsx` 不加行，保持 258。`page-column.tsx` 不加行。没有 Ctrl、也没有 ⌘ 的 wheel 不 `preventDefault`，栏照常滚动。`ctrlKey` 或 `metaKey` 时 `preventDefault`，不让整窗缩放。

步进只走已有的 `commands.zoomIn` / `commands.zoomOut`，也就是 `nextZoomPercent` / `previousZoomPercent`。不另写档位表，不调用 `zoomFitWidth` / `zoomFitPage`。`deltaY > 0` 缩小，`deltaY < 0` 放大，与浏览器 Ctrl+滚轮一致。符号若和真机相反，第 4 步停下，不写两套。

累积 `deltaY`。绝对值满 100 取一档，减去 100，余量留下。100 是一格鼠标滚轮的常见 `deltaY`，写在 `zoom-gesture.ts` 的具名常量里，不是新的百分比表。捏合的小 `deltaY` 累到 100 才走一档。一次事件可以连取多档。真机上一次捏合跳过多档，再改成每个事件最多一档，并写进证据。

边界仍是 25 和 400。到边界时 `nextZoomPercent` / `previousZoomPercent` 返回当前值，`apply` 因前后相同直接返回，百分比不变，不重写播报。

锚点不另写。`apply` 里已有的 `rememberZoomAnchor`（第 54 行）在改百分比之前按栏的实时几何记下重叠最大的页和页内比例。`page-column.tsx` 第 143–146 行在比例变化后 `placeZoomAnchor`。不读 `shownPage`。这是 PR #215 F1 的同一条路径。

播报不重复。按钮、菜单、快捷键仍在 `apply` 里立刻写一次，没有停手间隔（E1c-2 计划第 114 行）。滚轮和捏合调用同一个 `zoomIn` / `zoomOut`，多传一个可选参数，默认仍是立刻播报，所以 [use-bound-nav.ts](../../packages/features/reader/src/ui/use-bound-nav.ts) 的 `ZoomNav` 保持 `() => void`，shell 不用改。传入「停手后再播」时：百分比和锚点立刻更新；`spoken` 在最后一次这种调用之后 300 毫秒写一次，写的是当时的百分比。300 毫秒来自批次 E 计划第 37 行，只推迟播报，不推迟缩放。定时器被新的滚轮重置。按钮调用会清掉定时器并立刻写。文字和节点上已有的相同就不写。到边界没有新百分比就不写。仍是 `.oi-reader-zoom` 那一个节点。滚动不写。页码那句和迷路那句不动。

加载前和出错时 `active` 为假，不挂监听，命令仍直接返回。换文档时清定时器，百分比回到 100。PDF 栏缩放不加过渡动画。

## 每个文件

`check-pr-size` 把新增和删除都算进去，文档也算（[docs/arch/13.md](../arch/13.md) G12）。建议上限和硬上限见 [docs/arch/06.md](../arch/06.md)。

本 PR 只有计划和台账。本文件 154 行，台账加两行并替换合计那一行，计入 158，低于 600。实现若和本文件放在同一个 PR，计划全文加上表内约 523 行会超过 600。所以实现不进本 PR。合入后另开的那一份按下表，估算 523，余量 77。写的时候 `git diff --numstat` 超过 600 就停，按下面的拆分把「拆 fit」和「手势」分成两份，不写 `G12:`，不删测试。

| 文件 | 代码位置（0667c0d） | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- | --- |
| `packages/features/reader/src/ui/zoom-fit.ts` 新建 | 上表那些函数 | 98 | 98 | 不会。普通文件建议 400 |
| `use-zoom.ts` | 删第 122–201 行；`apply` 第 52–57 行加停手播报；`useZoom` 末尾挂监听 | 122 | 159 | 不会。现 201 |
| `zoom-gesture.ts` 新建 | 栏上的 wheel | 68 | 68 | 不会 |
| `use-zoom.test.tsx` | 现有 fit 用例留着；加 n9 和停手播报 | 55 | 257 | 不会。测试建议 600。现 202 |
| `zoom-gesture.test.tsx` 新建 | 经真实 `commands` | 80 | 80 | 不会 |
| `apps/desktop/e2e/reader-nav.spec.ts` | 现有放大用例在第 23–47 行，追加 Ctrl+滚轮 | 48 | 约 296 | 不会。测试硬上限 800 |
| `docs/evidence/<实现 PR 号>/commands.md` | 第 4 步 | 36 | 36 | 文档 |
| 本文件回填「实际」列 | 实现 PR 里改几格 | 16 |  | 文档 |
| `reader-screen.tsx` | 不改 | 0 | 258 | 停在 260。超过 260 就停，不写放行理由 |
| `page-column.tsx` | 不改 | 0 | 183 | 组件建议 250 |
| `use-bound-nav.ts` | 不改。类型若拒绝可选参数，只加这个可选参数，计入 4，上表 523 改为 527 | 0 | 69 | 不会 |

523 的构成：98 + 122 + 68 + 55 + 80 + 48 + 36 + 16。`docs/approvals.md` 的两行在本 PR，不重复计入实现 PR。

拆分（只在实现 PR 的非生成行超过 600 时使用）：

| PR | 装什么 | 估算 |
| --- | --- | --- |
| 本 PR | 本文件和台账两行 | 158 |
| 拆 fit | `zoom-fit.ts`、`use-zoom.ts` 只删测量、n9 那一条 | 211 |
| 手势 | 监听、停手播报、手势单测、e2e、证据、本文件回填 | 312 |

211 + 312 = 523。两份都不超过 600。

## 测试计划

单测走真实命令，不读源码文本（F-08）。渲染 `useZoom`，调用它返回的 `zoomIn` / `zoomOut` / `zoomFitWidth` / `zoomFitPage`。手势测试把 `WheelEvent` 派到栏上，断言百分比和 `role="status"` 的文字，不把命令换成假函数。

- 没有 Ctrl、没有 ⌘ 的 wheel：百分比不变，`preventDefault` 没被调用。
- `ctrlKey` 的 wheel，`deltaY` 为 100：少一档；为 −100：多一档。`preventDefault` 被调用。
- 连续小 `deltaY`（捏合那种）累到 100 才一档。
- 300 毫秒之内连走两档，状态文字仍是空的或旧的；满 300 毫秒只出现最终百分比一次。按钮调用仍在同一拍写文字（现有用例保持）。
- 25% 再缩小、400% 再放大：百分比不变，文字不重写。
- 缩放后，缩放前重叠最大的那一页仍与视口相交。不读 `shownPage`。
- 适合宽度仍是 223 和 185，适合页面仍是 95。非有限宽度不改变百分比。
- 加载前不挂监听。换文档回到 100，不留上一次的文字。

Playwright e2e 加在 `reader-nav.spec.ts`，复用现有临时 `userData`。接受 `electron.launch` 之后才读 `getPath("userData")`（E1c-2 计划第 94 行）。在 PDF 栏上按住 Ctrl 再滚轮：画布 CSS 宽度变大，`getZoomFactor()` 仍是 1，标题栏字号不变。没有 Ctrl 的滚轮不改变百分比。不调用 `webFrame.setZoomFactor`。

必须真机，没有设备就标未验证，不用别的机器代替：

- Windows 鼠标滚轮：指针在 PDF 栏上，没有 Ctrl 时只滚动；有 Ctrl 时只改 PDF 栏，窗口缩放系数仍是 1。
- 触控板捏合，以及双指滚动仍只滚动。没有触控板就标未验证。
- Ctrl+滚轮。输入法开、关各一次。
- 显示缩放。15:37 的批准只覆盖 PR #216 tip `6146291` 的那一次，测完要调回。它不授权 2b 再改 Windows 显示缩放。没有 Wisdom 当时本人的新批准，就不改显示缩放，本项标未验证。批准之后再测 100% 与 200%（本机若仍最高 225%，400% 标未验证）。先改系统缩放，再重启应用、重新打开 PDF，然后看 `devicePixelRatio`。不要在 PDF 已经打开时改缩放再记数。

第 4 步还要记下：Electron 版本不是 45.2.1 就停；`typeof contents.setZoomMode`；`setVisualZoomLevelLimits` 在不在；还没加监听时捏合和 Ctrl+滚轮是否已经在缩放整窗。捏合已经在缩放整窗，就停，不改 main，证据留下。

## 不做

不改 CSP。不开 `wasm-unsafe-eval`。不加 `.wasm`、`.mjs`、`blob:`、`bypassCSP`。不注册协议。不碰 Range、`disableRange`。不经 IPC 传整份 PDF。不改主进程，含 `library-menu.ts`、`library-wiring.ts`。不改 core、domain、`pure.ts`、contracts、`library/src`。不改 DESIGN、`docs/design-principles.md`、`docs/design/**`。不改 `.cursor/environment.json`、`.cursor/install.sh`。不加滑块。不把 `expose` 改成 true。不记住缩放。不做 n4 的选项 tooltip、n5 的控件拆分、n8 的 `findBy` 超时、`forced-colors`。这些仍有效，不在这一份里用行数去做。不做 N2、N3、N4。不写 `G12:`。Ready、合入、发版都要另批。

若实现必须碰上面任何一项，停下，在实现 PR 里说明，不要做。

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先交计划和台账，审过才实现 | 07:05 原话「批准，按照你的建议做吧」。这一份只覆盖 2b 的计划，不含合入 | 2026-11-15 07:05 | Wisdom。台账对应 [评论 6885626184](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6885626184) |
| 适合尺寸的测量拆到 `zoom-fit.ts` | PR #216 n3。第 5 轮仍有效 | 2026-11-15 | Forge 排序，非业主决定。[6890312264](https://github.com/wisdom-km/open-immerse-v2/pull/216#issuecomment-6890312264)、[6892062439](https://github.com/wisdom-km/open-immerse-v2/pull/216#issuecomment-6892062439) |
| floor 留在 UI | 测量是 DOM。不下沉 core。见「复评 UI 层取整」 | 2026-11-15 | 本计划。沿用 N-16，不是新的业主决定 |
| 滚轮和捏合停手 300 毫秒再播一次 | 批次 E 计划第 37 行。按钮仍立刻播 | 2026-11-15 | 批次 E 计划。Forge 可以改这个数 |
| 15:37 的显示缩放批准记进本 PR，不扩大到 2b 再改缩放 | 原话见台账 17:58 那一行。15:37 的范围是 PR #216 tip `6146291` | 2026-11-15 17:58 | Wisdom。台账对应 [评论 6892665960](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6892665960) |

## 证据链接

- 本 PR 没有 `docs/evidence/<PR号>/`。第 4 步的测量写在实现 PR 的 `docs/evidence/<PR号>/commands.md`。

## 自检

- [x] 影响 arch / prd 吗？不影响。不改 PRD、ARCHITECTURE、DESIGN、RULES。
