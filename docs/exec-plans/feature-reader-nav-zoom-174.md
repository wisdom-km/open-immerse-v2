# 批次 E · 阅读屏导航（缩放、转到页码、位置历史、栏位）

分支 `feature/reader-nav-zoom-174`。基线 main `5db585df3c460a1d6a8ac2d33583cde16e48970e`，tree `b56d0d364b9dea92a04c4c7da98a8575034d9716`。本文件自洽。Forge 审查通过之前没有实现提交。本 PR 只改文档，不写产品代码，不改测试，不改 CI，不改 CSP，不改 DESIGN。不开 Ready，不合入，不发版。

开工依据是台账里已有的 2026-11-05 21:01 ③ 批准，[评论 6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956)。2026-11-14 14:13 的三件决定见 [评论 6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563)。Loom 的对照稿是 `/cursor/stores/bot/oi-v2/BATCH-E-DESIGN.md`（下称 Loom）。本计划逐条满足 Loom §9，并写入 §7、§8、§10。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败。seam 不够用时先停。

## 现状理解

1. main `5db585d` 上，打开一份 PDF 进入阅读屏，画原文页，标题下有「第 N / M 页」。工具栏 ‹ 和菜单「返回文献库」回文献库。`Alt+←` 一律回库。`Esc` 不回库。没有缩放、页码输入、← →、栏位切换。
2. 相关的节：DESIGN §4.1、§11.3、§11.4、§12.1、§12.2；原则 §4、§8；PRD §3.6 与 §8 的 M2 退出格；ARCH §6、§9.1；RULES §8 第 4 条。DESIGN 第 156 行仍写默认「对照」。不改 DESIGN 正文（N-10）。
3. 还没做的是下面四项。侧栏、Aa、大纲、⋯、配置存储、AC-11 chip、只画视口附近的页，都不在本批。

## 来源核对

| 项 | 现在的代码 | 规格 / 决定 | 本批 |
| --- | --- | --- | --- |
| 缩放 | `reader.setZoom` 的 `expose` 是 false。桌面没有注册它。`clampZoomPercent`、`resolveZoomPercent`、`viewportForZoom` 已在 `pure.ts`。画页固定 `scale: 1`，不乘 dpr | 14:13 的 6-2 A：浏览器式预设档位，25–400%。不记住，每次打开 100%。UIX-56 未满足。档位列表要实测，不照抄 Loom 的近似值 | 实际大小、适合宽度、适合页面用已有纯函数。+/−、捏合、Ctrl+滚轮的下一档见「需 Wisdom 决定」1 |
| 转到页码 | 「第 N / M 页」只是文字 | DESIGN §11.4。越界用 `clampPage(n, M) === n` 判断，不相等就不跳、不夹取 | 做。不新增 domain 函数 |
| 位置历史 | `recordJump` 在 `current` 为空时只写入 current，不压栈。界面没有 ← → | 2A。Loom §4.2：打开时先写 current；跳转前把可见页写成 current，且滚动不入栈 | 打开时 `recordJump` 已够用。可见页写成 current 且不压栈，现有函数做不到。见决定 2 |
| 栏位 | 只有原文栏 | 14:13 的 6-1 A。默认原文。不记住（G-7：没有 setViewMode） | 做。文案用已批原句 |
| 菜单 | 只有「打开…」和「返回文献库」 | 14:13 的 6-3 A：文献库里不置灰，点了不起作用，记缺口。「主进程知道当前界面」挂进 M2 退出格。阅读屏「后退」不置灰 | 加视图菜单。不建场景通道 |

## 目标

一次打开里可以：只缩放 PDF 栏；就地转到页码并记入历史；最多 50 条，按 2A 后退；在原文、对照、译文之间切换。默认原文，每次打开都是原文和 100%。对照是左原文、右空态。译文是整个主区空态。不请求翻译。

## 验收

- 打开后是原文、100%。切到对照或译文，句子是「本阶段暂不提供译文，请先阅读原文。」文字链接在 Windows 是「切到原文（Ctrl+1）」，在 mac 是「切到原文（⌘1）」。没有「开始翻译」，没有「去设置」。链接不是主按钮。点它或按 Ctrl+1 / ⌘1 回到原文，页不变。
- 实际大小是 100%。适合宽度、适合页面走 `resolveZoomPercent`，再经 `clampZoomPercent`。只改 PDF 栏。标题栏大小不变。25% 时 − 置灰，400% 时 + 置灰。快捷键在边界上什么都不做。
- 「第 N / M 页」就地变成输入框，不用对话框。Enter 在 `clampPage(n, M) === n` 时跳转并入栈。越界不跳，输入框保持编辑，就地显示「共 M 页」。Esc 和失焦只取消编辑。空 Enter 等于 Esc。非数字、小数、全角数字同样提示「共 M 页」，不另做转换。Esc 不回库。
- 只有转到页码入栈。打开时用 `recordJump` 把恢复页写成 current，back 仍空。滚动、PageUp/Down、Home/End、缩放、切栏位不入栈。后退或前进停下后走现有 `onScrollEnd` → `writePage`。`canWrite` 为 false 时不写回。离开或换文献时栈清空。不落盘。同一次运行里重开同一篇，栈也空（G-4，Loom 建议，规格没写保留）。
- 有后退项时，`⌘[` / `Alt+←` 和工具栏 ← 回到上一处。没有时这两键走 ‹ 的离开。‹ 和「返回文献库」始终回库。→ 没有前进项时置灰，点击和 `⌘]` / `Alt+→` 什么都不做，不回库。工具栏 ← → 用 `aria-disabled`，不移出 Tab 顺序。阅读屏菜单「后退」始终可点。mac 不响应 ⌥←。
- 同一个快捷键只走菜单 accelerator 一条路。渲染进程不再用 `useLeaveKeys` 并行监听。菜单里能看见快捷键。
- 跳页完成后 `role=status` 播一次「第 N / M 页」。缩放手势结束后播一次百分比。计划暂定停手 300 毫秒再播，规格没写这个毫秒数，Forge 可以改。滚动过程不播。
- AC-11、PRC-10、UIX-56 仍未满足。不把本批写成 ③ 完成。

## Loom §9 对照

| 项 | 计划做到 | 计划里没有 |
| --- | --- | --- |
| 范围 | 只做四件事。切片是 reader 的 `src/ui` 和 desktop 的 renderer，加上已有先例的 `library-menu.ts`。热点文件无 | Aa、侧栏、大纲、⋯、chip 文字、AC-11 降级句、配置存储、翻译 |
| 解耦 | 上文引用了 §2.1 与 RULES §8。E 的 UI PR 不改 domain、application、`index.ts`、`pure.ts`、`contracts/src/ipc`。只调已有 `pure.ts` | UI 里写 1..M、25..400、50。不改 seam 形状 |
| 契约 | 不改 `expose`。不新增 IPC。档位函数若要新增，另开 core PR，见决定 1 | 不在 E 里把 `expose: false` 改成 true |
| ‹ | 始终回库。tooltip 改成「返回文献库」，不带快捷键 | tooltip 不写 Alt+←。Esc 不回库 |
| ← → | 按 2A。只有工具栏按钮置灰。名称是「后退」「前进」 | 菜单「后退」不置灰。同一个键不走两条路径。mac 不响应 ⌥← |
| 历史 | 只有转到页码入栈。打开时 `recordJump` 写 current。最多 50，用 `POSITION_HISTORY_LIMIT`。离开清空。不持久化。可见页写入见决定 2 | 滚动、缩放、切栏位不入栈。历史不写存储。后退不绕过 `canWrite` |
| 转到页码 | 就地输入。越界留在编辑态并提示「共 M 页」。Esc 取消。输入框里的 PageUp/Down、Home/End、Space、←→ 按文本处理 | 不用对话框。越界不夹取。Esc 不离开阅读屏 |
| 缩放 | 只缩放 PDF 栏。无 Ctrl 的 wheel 只滚动。绘制用缩放乘 dpr。边界置灰。拦住整页缩放的手段等 §10 的实测，预定在 PDF 栏上 `preventDefault`（`passive: false`） | 不加 `zoomIn` / `zoomOut` / `resetZoom` / `viewMenu` role。不调 `webFrame.setZoomFactor`。不做滑块 |
| 内存 | 实现 PR 在 8 GB Windows 上实测 400%。超 Forge 写明的线就停。线没写明就测完停下，不自定 MB | 不测不交付。不做视口绘制 |
| 栏位 | `radiogroup`，名称「栏位」。Ctrl+1/2/3，mac ⌘1/2/3。默认原文。不记住 | 不默认对照。没有「开始翻译」「去设置」。主按钮仍是 0 |
| 空态 | 用 6-1 A 的原句。链接是文字链接 | 不写解析服务或配置 |
| 菜单 | Win「视图(V)」，mac「显示」。顺序按 Loom §2.2。文献库里不置灰 | 不放「显示侧栏」。不声称已经置灰 |
| 播报 | 跳页或手势结束后各一次 | 不每帧、不随滚动播 |
| 无障碍 | Tab 顺序与视觉一致。2px 焦点环。目标不小于 24×24。`reader.css` 加 `forced-colors`。200% 界面缩放下按 dpr 绘制 | 不只靠颜色表示置灰或选中 |
| 证据 | §测试计划 的 Win 真机录屏和截图。没有 8 GB 或 mac 就标未验证 | 不用 Box 代替真机。不把 AC-11 / PRC-10 标成通过 |

## 拆分

本 PR 只写计划。实现最多两个 PR，都等本计划审查通过。决定 1 和决定 2 没回答之前，依赖它们的文件不改。

| 实现 PR | 内容 | 分开的原因 |
| --- | --- | --- |
| E1 | 转到页码、历史按钮、视图菜单、实际大小、适合宽度、适合页面、按 dpr 绘制 | 转到页码是历史的唯一入栈来源 |
| E2 | 栏位分段和已批空态 | 不碰画页比例 |

+/−、捏合、Ctrl+滚轮放进 E1，但只在决定 1 的纯函数已经合入之后。决定 2 的纯函数同样先合入，E1 才写「跳转前记下可见页」。

## 键盘

Mod 在 macOS 是 ⌘，在 Windows 是 Ctrl。不加 Electron 的缩放 role。

| 动作 | macOS | Windows |
| --- | --- | --- |
| 放大 | ⌘+ | Ctrl++（键盘上常是 Ctrl+=，是否生效见实测） |
| 缩小 | ⌘− | Ctrl+− |
| 实际大小 | ⌘0 | Ctrl+0 |
| 适合宽度 | ⌥⌘0 | Ctrl+Alt+0 |
| 转到页码 | ⌥⌘G | Ctrl+G |
| 有历史则后退，没有则回库 | ⌘[ | Alt+← |
| 前进，没有则无效 | ⌘] | Alt+→ |
| 原文 | ⌘1 | Ctrl+1 |
| 对照 | ⌘2 | Ctrl+2 |
| 译文 | ⌘3 | Ctrl+3 |

适合页面没有快捷键。不新造。Ctrl+Alt+0 在部分欧洲键盘上等于 AltGr，这是已批键位，只记风险，不改。不劫持 PageUp、PageDown、Home/End、Space。侧键、触控板横滑、长按 ← 的列表不在 ③ 的四项里，本批不做。

## 菜单

文件菜单保持「打开…」和「返回文献库」。新增 Win「视图(V)」和 mac「显示」，顺序如下。适合页面不进这个菜单（C12：G03 / G04 图里没有），只出现在点百分比打开的渲染进程菜单里，菜单底部一行是「只缩放 PDF 原文栏；界面跟随系统缩放」。

| 菜单项 | macOS | Windows | 行为 |
| --- | --- | --- | --- |
| 视图 › 后退 | ⌘[ | Alt+← | 阅读屏里始终可点。有历史则后退，没有则回库 |
| 视图 › 前进 | ⌘] | Alt+→ | 没有记录则点击无效。不置灰 |
| 视图 › 转到页码… | ⌥⌘G | Ctrl+G | 打开页码输入。加载前什么都不做 |
| 视图 › 原文 / 对照 / 译文 | ⌘1/2/3 | Ctrl+1/2/3 | 单选。对照和译文是空态 |
| 视图 › 放大 / 缩小 / 实际大小 / 适合宽度 | 见上表 | 见上表 | 只缩 PDF 栏 |

6-3 A：这些项在文献库里也显示，不置灰。点了或按下快捷键，渲染进程不在阅读屏时丢掉事件。这是缺口，违反 DESIGN 第 707 行的置灰要求，按 6-3 A 接受。补上置灰的小 PR 已写入 `docs/prd/08.md` 的 M2 退出格，本批不做那条通道。

快捷键文字写在菜单项上，accelerator 只注册一份。`useLeaveKeys` 删除，避免 Alt+← 走两次。

## 历史的调用顺序

1. 页码已知时：`recordJump(emptyPositionHistory(), { page: 恢复页 })`。`current` 成为恢复页，`back` 仍空。
2. 转到页码且目标与 `current` 不同：先把「跳转前可见页」写成 `current` 且不压栈（决定 2），再 `recordJump` 目标页。可见页来自现有的 `readVisible`。
3. 后退：`goBack`。栈没变就走 ‹ 的离开。前进：`goForward`。栈没变就停。
4. 滚动停下后仍走 D 的写回。历史跳转不另写，也不跳过。

`recordJump` 不能做第 2 步的前半：它会把旧 `current` 压进 `back`，滚动就会入栈。

## 每个文件

行数按 ARCH §6。一个文件一件事。`reader-screen.tsx` 现在 168 行，只拼装，上限 250。

| 文件 | PR | 职责 | 上限 | 禁区 |
| --- | --- | --- | --- | --- |
| `packages/features/reader/src/ui/go-to-page.tsx` | E1，新建 | 就地输入。越界只调用 `clampPage` 做相等判断 | 150 | 否 |
| `packages/features/reader/src/ui/history-controls.tsx` | E1，新建 | ← →。空的一侧 `aria-disabled`。不调用 ‹ | 80 | 否 |
| `packages/features/reader/src/ui/zoom-controls.tsx` | E1，新建 | 「− % +」和百分比菜单。+/− 只调用决定 1 的纯函数 | 160 | 决定 1 未合入前，这个文件不写 +/− |
| `packages/features/reader/src/ui/page-column.tsx` | E1，改 | 现 95 行。栏宽用 `viewportForZoom`。wheel 区分有没有 Ctrl | 200 | 否 |
| `packages/features/reader/src/ui/pdf-session.ts` | E1，改 | 现 228 行。canvas 按缩放乘 `devicePixelRatio` 绘制，CSS 尺寸只按缩放 | 400 | 否。这是 UI 文件 |
| `packages/features/reader/src/ui/reader-screen.tsx` | E1、E2 | 撤掉 `useLeaveKeys`。‹ 的 tooltip 改为「返回文献库」 | 250 | 否 |
| `packages/features/reader/src/ui/copy.ts` | E1、E2 | 现 10 行。越界句、按钮名、6-1 A 的原句 | 80 | 否 |
| `packages/features/reader/src/ui/view-mode-switch.tsx` | E2，新建 | `radiogroup`。默认原文 | 120 | 否 |
| `packages/features/reader/src/ui/view-mode-empty.tsx` | E2，新建 | 空态和文字链接。0 个主按钮 | 80 | 否 |
| `apps/desktop/src/renderer/reader.css` | E1、E2 | 排列、焦点环、`forced-colors`。不新造颜色定稿 | 220 | 否 |
| `apps/desktop/src/renderer/shell.tsx` | E1 | 现 81 行。听返回和视图菜单事件。不在阅读屏时丢掉 | 160 | 否 |
| `apps/desktop/src/renderer/shell-events.ts` | E1 | 事件名常量，与菜单用同一字符串 | 40 | 否。不新建 `ui-events.ts` |
| `apps/desktop/src/main/library-menu.ts` | E1 | 现 53 行。追加视图菜单。点击仍 `dispatchEvent`。不新 IPC，不改 CSP，不改协议。阅读屏「后退」不 `enabled: false` | 160 | 主进程。D 已改过这个文件。6-3 A 要求这些项在库里可见 |
| `apps/desktop/test/library-menu.test.ts` | E1 | 标签、访问键 (V)、快捷键、没有置灰 | 140 | 随菜单文件 |

测试与被测文件配对，放在 `packages/features/reader/test/ui/` 和 `apps/desktop/test/`。一个测试文件只测一块。

不改：`packages/contracts/**`、`packages/features/reader/src/application/**`、`index.ts`、`pure.ts`、`packages/features/library/src/**`、`csp.ts`、协议、preload、wasm、`blob:`、`.mjs`、DESIGN、原则、`docs/design/**`、`docs/arch/04-02.md` 第 20 行。决定 1、2 若获准，各自的 core PR 才改 domain 和 `pure.ts` 的导出，不进 E1、E2。

## Seam（Loom §7）

| seam | 位置 | 状态 | 本批 |
| --- | --- | --- | --- |
| `clampPage` | `pure.ts` → `page-bounds.ts` | 已有 | 只用相等判断，不用返回值去跳 |
| `recordJump` / `goBack` / `goForward` / `emptyPositionHistory` / `POSITION_HISTORY_LIMIT` | `position-history.ts` | 已有。UI 还没用 | 打开和跳转用它们。可见页写入见决定 2 |
| `parseZoomPercent` / `clampZoomPercent` / `DEFAULT_ZOOM_PERCENT` / `ZOOM_PERCENT_MIN` / `MAX` / `parseZoomLevel` | `zoom-bounds.ts` | 已有 | 打开用 100。边界用 min/max |
| `resolveZoomPercent` / `viewportForZoom` | `viewport-mapping.ts` | 已有 | 适合宽度、适合页面 |
| 下一档、上一档 | 无 | 不存在 | 决定 1。不进 E 的 PR |
| `reader.setZoom` | `contracts/src/ipc/reader.ts` | `expose: false`。main 没注册 | 不调用。不改 expose |
| `reader.getZoom` | 无 | 不存在 | 不做。6-2 A 不记住 |
| 栏位 | `READER_VIEW_MODE_ORIGINAL`。契约写栏位留在 renderer | 没有写口 | 每次打开原文 |
| 页码写回 | `client.writePage` | 已有 | 不改 |
| 菜单事件 | `shell-events.ts` 的 window 事件 | D 的写法 | 沿用。不登记尚未存在的 `contracts/src/ui-events.ts` |
| 场景通道 | 无 | 不存在 | 6-3 A 不做。挂在 M2 退出格 |
| 按缩放乘 dpr 绘制 | `pdf-session.ts` | UI 文件 | UI 自己改 |

## 冲突与缺口（Loom §8，只列，不改 DESIGN）

| 编号 | 内容 | 本计划 |
| --- | --- | --- |
| C1 | 译文字号和 PDF 缩放共用 ⌘= / ⌘−。③ 没有 Aa | 现在不撞。M4 之前另定 |
| C2 | DESIGN 第 394 行带「去设置翻译服务」 | 不用这句。用 6-1 A |
| C3 | UIX-16 写 Alt+← 总回上一场景 | 按 2A。不改 DESIGN |
| C4 | 「按文档记住」和 UIX-56 / UIX-57 没有 seam | 6-2 A：不记住。UIX-56 未满足 |
| C5 | 标题栏正文没有 ← → 和缩放组，C31 / C32 有 | 按图放：‹、← →、标题和页码、空白、缩放、空 chip、栏位 |
| C6 | 不可用项应置灰。阅读屏「后退」不能置灰 | 6-3 A。工具栏 ← → 仍置灰 |
| C7 | 长按列表、侧键、触控板滑动 | 不做 |
| C8 | 越界要提示；`clampPage` 会夹取 | 只做相等判断 |
| C9 | ‹ 的 tooltip 写着 Alt+← | 改成「返回文献库」 |
| C10 | Alt+← 总是离开，mac 上 ⌥← 也离开，输入框里也触发 | 删掉这段监听 |
| C11 | mac「显示」正文没有后退、前进、转到页码，G03 图里有 | 菜单按 G03 图 |
| C12 | 「适合页面」不在 G03 / G04 | 只在百分比菜单里 |
| C13 | 阅读区 token 与 IconButton 用的 `--oi-text-2` 不一致 | 沿用 D 的 `reader.css`，不新造 token |
| C14 | 强制色。`reader.css` 没有对应块 | E1 补上 |
| C15 | 绘制 scale 1，不乘 dpr | E1 补上 |
| C16 | 菜单在 main，UI 任务通常不改那里。D 改过 | E1 按 6-3 A 再改这个文件 |
| C17 | 新 UI 事件要登记 `ui-events.ts`。文件不存在。D 没登记 | 本批不建。见 §10 |
| C18 | 重开同一篇时栈留不留 | 清空 |
| C19 | 每页都画。400% 面积约 16 倍。视口绘制不开工 | 先实测内存 |
| C20 | Win ☰ 还没有 | 不在本批 |
| G-1 | 步长没定 | 6-2 A 定为浏览器档位。列表待实测 |
| G-2 | 非数字、空、小数、全角、失焦 | 空 Enter 和失焦等于 Esc。其余提示「共 M 页」。全角不转换 |
| G-3 | Home/End 入不入栈 | 不入栈。不劫持 |
| G-4 | 离开时栈清不清 | 清 |
| G-5 | 缩放锚点 | 保持当前可见页，不做指针锚点 |
| G-6 | 分段控件没有无障碍表 | 用 radiogroup。这是 Loom 的建议 |
| G-7 | 栏位记不记住 | 不记住。每次原文 |

## 还没核实（Loom §10）

这些在实现 PR 里先测，结果写进该 PR 的 `docs/evidence/<PR号>/`。测完之前不把对应行为写成已经成立。没有设备就标未验证并停下。

1. Electron 45.2.1 上，`enabled: false` 的菜单项会不会让 accelerator 失效。测法：在实现 PR 的 Electron 里临时加一项，标签带快捷键，`enabled: false`，click 记一次。按下该键。click 次数仍是 0，才说明置灰会吞掉快捷键。测完删掉临时项。阅读屏「后退」因此保持可点。本环境先核对 `electron` 依赖版本是 45.2.1，不是就停。
2. `webContents.setZoomMode` 在 45.2.1 上在不在。测法：打开窗口后打印 `typeof contents.setZoomMode`。不是 `"function"` 就不调用。拦住整页缩放的预定手段是 PDF 栏上的 `preventDefault`，不依赖这个 API。
3. 视觉缩放（捏合）是否默认关闭。测法：还没加监听时，在 PDF 栏上捏合，看标题栏和画布有没有变。Electron 类型里同时看 `setVisualZoomLevelLimits` 在不在。捏合已经在缩放整窗，就停下来再问，不自行改 main。
4. Ctrl+滚轮的默认行为。测法：还没加监听时，在 PDF 栏上 Ctrl+滚轮，记录窗口缩放因子和标题栏字号。加上 `preventDefault` 后再做一次，标题栏必须不变，窗口缩放因子仍是 1。无 Ctrl 的 wheel 只滚动。
5. Ctrl++ 在 Windows 美式键盘和中文输入法下的实际键。测法：输入法开、关各一遍，分别按 Ctrl+=、Ctrl+Shift+=、小键盘 +/−。哪一个进了放大或缩小，写进证据。计划不预先声称全部生效。
6. 浏览器档位的精确列表。测法：在 Windows 上打开 Edge，用它自己的缩放从最小走到最大，记下界面上每一个百分比。Chrome 也在就再记一遍。两份相同才交给决定 1 的纯函数。不同就停。不把 Loom 写的「约 25、33、50、67、75、80、90、100、110、125、150、175、200、250、300、400」抄进函数或本计划。
7. DESKTOP-0GI64S8 的内存还没核实。400% 的内存只在确认是 8 GB 的 Windows 上测。任务管理器看本进程，录屏。25 页 PDF，缩放到 400%。Forge 没在本计划的审查里写下限值，就测完停下，不自定一个 MB 数，也不交付。更高内存的机器不能代替。
8. RULES 第 89 行的 `ui-events.ts` 登记是否适用于菜单的 window 事件。文件现在不存在。D 的返回事件没有登记。本计划不建这个文件。Forge 若认为必须登记，那是 contracts，停下来，不在 E 里新建。
9. 评论 6764944106 本计划没有单独再拉取。ADR 0011 的「视口绘制暂不开工」沿用仓库里已合入的正文。
10. Chromium 是否让滚动容器默认可用键盘聚焦。测法：实现 PR 里用键盘 Tab，看 PDF 栏能不能成为焦点。不能，再给栏加 `tabindex="0"`。这是 UI，不是新 seam。

## 需 Wisdom 决定

14:13 已经定了空态文案、不记住缩放、文献库不置灰。下面两项仍要改 core。没回答之前，E 的 PR 不改这些文件。

1. **缩放档位函数必须新建在 core。** 位置：`packages/features/reader/src/domain/zoom-bounds.ts`，两个纯函数，上一档和下一档，经 `pure.ts` 导出。输入是当前百分比，输出是实测得到的下一档或上一档，再经已有的 `clampZoomPercent`。不改 `packages/contracts`，不改 `expose`，不注册 `createSetZoom`。代价：E1 的 +/−、捏合和 Ctrl+滚轮要等这个 core PR 合入。不做的代价：UI 只能自己写档位列表，违反 P7 和 Loom §9。捏合的连续变化在松手时用 `clampZoomPercent` 取整；取整后落到哪一档，仍用这两个函数，不在 UI 里另写一张表。
2. **跳转前把可见页写成 current，且不压栈，现有函数做不到。** `recordJump` 在页不同时会把旧 current 推进 back。需要在 `position-history.ts` 加一个只替换 current、不清 forward、不压栈的纯函数，经 `pure.ts` 导出。不改 contracts。代价：E1 的「原位置是可见页」要等这个 core PR。不做的代价：后退回到的是上一次跳转或打开时的页，不是滚动后看见的页，和 Loom §4.2 不一致。

## 不做

配置存储，AC-11 chip，解析服务说明。视口绘制。侧栏、Aa、大纲、⋯、Range、`disableRange`。CSP、wasm、`blob:`、`.mjs`、协议。侧键、触控板横滑、长按历史列表。查找。改 DESIGN。把 `expose` 改成 true。按文档记住缩放。菜单置灰通道。Win ☰。

## 测试计划

本 PR 不跑 Vitest。实现 PR 才跑。

单测：已有历史和缩放边界测试保持通过。`go-to-page` 断言越界不调用跳转、`clampPage` 的返回值不被当成目标页。`history-controls` 断言空的 ← 不调用离开。`view-mode-empty` 断言原句、链接文字，以及没有「开始翻译」「去设置」。键位分 `metaKey` 和 `ctrlKey`。

Electron e2e：打开小 PDF。窗口缩放因子在 Ctrl+滚轮后仍是 1，画布变大。Ctrl+G 跳页，Alt+← 回去，历史用尽后回库。‹ 在有历史时直接回库。Ctrl+2 出现空态，没有翻译请求。

§10 的十项实测按上面的测法做，和功能测试分开记。

Windows 真机要有录屏和对应截图，Box 不能代替：

| 编号 | 内容 |
| --- | --- |
| R-E1 | 跳页、后退三次、第四次回库 |
| R-E2 | Ctrl+滚轮，标题栏不变 |
| R-E3 | 精确式触控板的捏合和双指滚动。没有触控板就标未验证 |
| R-E4 | Ctrl+= / Ctrl+- / Ctrl+0 / Ctrl+Alt+0，美式键盘，中文输入法开和关 |
| R-E5 | 页码越界、Esc、单页 PDF |
| R-E6 | Ctrl+1/2/3 和两种空态 |
| R-E7 | 显示缩放 200% 下的 100% / 200% / 400% |
| R-E8 | 高对比主题 |
| R-E9 | Narrator：按钮名称，页码和百分比各播一次 |
| R-E10 | 8 GB 机器上 400% 的内存。机器未核实就标未验证并停 |
| R-E11 | mac 的 ⌘[ ⌘] ⌥⌘G ⌘1/2/3 和捏合。没有设备就标未验证 |

## 风险

- D-15 的「Alt+← 一律回库」会失败，E1 改断言。
- 菜单 accelerator 在输入框聚焦时会不会抢走 ⌘[，属于 §10。抢的话停，不加第二套 keydown。
- 400% 的内存可能超过机器。视口绘制不在本批里用来躲过这一项。
- 档位列表在实测前不存在。E1 不能先写一个临时数组。

## 自检

- 本 PR 的任务类型是纯文档。UI–core 交接写不适用。
- 不改 N-10、N-11 的文件，不改 CI。
- M2 退出格多了一句，manifest 有一条唯一替换。不改基线，不改 `compare.mjs`。
- 台账在同一笔提交里追加，不改旧行。
