# 批次 E · 阅读屏导航（缩放、转到页码、位置历史、栏位）

分支 `feature/reader-nav-zoom-174`。基线 main `5c6b34ea6559463b8135112b808b741357205268`（#205 第 1 笔），tree `f106576602906c2801c334d0129e3e42862e2041`。本文件自洽。Forge 审查通过之前没有实现提交。本 PR 只改文档，不写产品代码，不改测试，不改 CI，不改 CSP，不改 DESIGN。不开 Ready，不合入，不发版。

开工依据是台账里已有的 2026-11-05 21:01 ③ 批准，[评论 6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956)。2026-11-14 14:13 的三件决定见 [评论 6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563)。2026-11-14 14:17 的内存方案 A 见 [评论 6872986479](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872986479) 与 [Issue #202 评论 6872987059](https://github.com/wisdom-km/open-immerse-v2/issues/202#issuecomment-6872987059)。#202 并入本批，不另开实现 PR。提议中的 ADR 是 [0012](../adr/0012-viewport-canvas-cap.md)。Loom 的对照稿在 Cloud 是 `/cursor/stores/bot/oi-v2/BATCH-E-DESIGN.md`，在 Box 是 `/workspace/oi-qa/v2-batch-e-design/BATCH-E-DESIGN.md`（下称 Loom）。两份都是 439 行，sha256 `034fa650b2ee5cd74c4da3ac54b378512ee250e0313f382691bc531cfb0d40a1`。Cloud 这一份已在本环境核对哈希。Box 那一份的哈希是 Forge 审查 [评论 6873533530](https://github.com/wisdom-km/open-immerse-v2/pull/206#issuecomment-6873533530) 记下的，与这一份相同。§4.6、验收 E-M1–E-M5、真机 R-E12 / R-E13 和 §9 的内存行都已按 14:17 写上。本计划按这一稿逐条满足 §9，并写入 §7、§8、§10。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败。seam 不够用时先停。

## 现状理解

1. main `d8e5afb` 上，打开一份 PDF 进入阅读屏，画原文页，标题下有「第 N / M 页」。#204 只改了文档，阅读屏代码和 `5db585d` 相同。工具栏 ‹ 和菜单「返回文献库」回文献库。`Alt+←` 一律回库。`Esc` 不回库。没有缩放、页码输入、← →、栏位切换。
2. 相关的节：DESIGN §4.1、§11.3、§11.4、§12.1、§12.2；原则 §4、§8；PRD §3.6 与 §8 的 M2 退出格；ARCH §6、§9.1；RULES §8 第 4 条。DESIGN 第 156 行仍写默认「对照」。不改 DESIGN 正文（N-10）。
3. 还没做的是下面四项，加上 14:17 并进来的视口绘制和单页像素上限。侧栏、Aa、大纲、⋯、配置存储、AC-11 chip 仍不在本批。

## 来源核对

| 项 | 现在的代码 | 规格 / 决定 | 本批 |
| --- | --- | --- | --- |
| 缩放 | `reader.setZoom` 的 `expose` 是 false。桌面没有注册它。`clampZoomPercent`、`resolveZoomPercent`、`viewportForZoom` 已在 `pure.ts`。画页固定 `scale: 1`，不乘 dpr | 14:13 的 6-2 A：浏览器式预设档位，25–400%。不记住，每次打开 100%。UIX-56 未满足。档位列表要实测，不照抄 Loom 的近似值 | 实际大小、适合宽度、适合页面用已有纯函数。+/−、捏合、Ctrl+滚轮的下一档见「已批」2，等缩放档位的 core PR |
| 转到页码 | 「第 N / M 页」只是文字 | DESIGN §11.4。越界用 `clampPage(n, M) === n` 判断，不相等就不跳、不夹取 | 做。不新增 domain 函数 |
| 位置历史 | `recordJump` 在 `current` 为空时只写入 current，不压栈。界面没有 ← → | 2A。Loom §4.2：打开时先写 current；跳转前把可见页写成 current，且滚动不入栈 | 打开时 `recordJump` 已够用。可见页写成 current 且不压栈，现有函数做不到。15:13 已批，先于档位单开 core PR |
| 栏位 | 只有原文栏 | 14:13 的 6-1 A。默认原文。不记住（G-7：没有 setViewMode） | 做。文案用已批原句 |
| 菜单 | 只有「打开…」和「返回文献库」 | 14:13 的 6-3 A：文献库里不置灰，点了不起作用，记缺口。「主进程知道当前界面」挂进 M2 退出格。阅读屏「后退」不置灰 | 加视图菜单。不建场景通道 |

## 目标

一次打开里可以：只缩放 PDF 栏；就地转到页码并记入历史；最多 50 条，按 2A 后退；在原文、对照、译文之间切换。默认原文，每次打开都是原文和 100%。对照是左原文、右空态。译文是整个主区空态。不请求翻译。原文栏保留 canvas 的范围是第一张可见页减 2 到最后一张可见页加 2，夹到 1..总页数。

## 验收

- 打开后是原文、100%。切到对照或译文，句子是「本阶段暂不提供译文，请先阅读原文。」文字链接在 Windows 是「切到原文（Ctrl+1）」，在 mac 是「切到原文（⌘1）」。没有「开始翻译」，没有「去设置」。链接不是主按钮。点它或按 Ctrl+1 / ⌘1 回到原文，页不变。
- 实际大小是 100%。适合宽度、适合页面走 `resolveZoomPercent`，再经 `clampZoomPercent`。只改 PDF 栏。标题栏大小不变。25% 时 − 置灰，400% 时 + 置灰。快捷键在边界上什么都不做。
- 「第 N / M 页」就地变成输入框，不用对话框。Enter 在 `clampPage(n, M) === n` 时跳转并入栈。越界不跳，输入框保持编辑，就地显示「共 M 页」。Esc 和失焦只取消编辑。空 Enter 等于 Esc。非数字、小数、全角数字同样提示「共 M 页」，不另做转换。Esc 不回库。
- 只有转到页码入栈。打开时用 `recordJump` 把恢复页写成 current，back 仍空。滚动、PageUp/Down、Home/End、缩放、切栏位不入栈。后退或前进停下后走现有 `onScrollEnd` → `writePage`。`canWrite` 为 false 时不写回。离开或换文献时栈清空。不落盘。同一次运行里重开同一篇，栈也空（G-4，Loom 建议，规格没写保留）。
- 有后退项时，`⌘[` / `Alt+←` 和工具栏 ← 回到上一处。没有时这两键走 ‹ 的离开。‹ 和「返回文献库」始终回库。→ 没有前进项时置灰，点击和 `⌘]` / `Alt+→` 什么都不做，不回库。工具栏 ← → 用 `aria-disabled`，不移出 Tab 顺序。阅读屏菜单「后退」始终可点。mac 不响应 ⌥←。
- 同一个快捷键只走菜单 accelerator 一条路。渲染进程不再用 `useLeaveKeys` 并行监听。菜单里能看见快捷键。
- 跳页完成后 `role=status` 播一次「第 N / M 页」。缩放手势结束后播一次百分比。计划暂定停手 300 毫秒再播，规格没写这个毫秒数，Forge 可以改。滚动过程不播。
- AC-11、PRC-10、UIX-56 仍未满足。AC-11 的「空态再说一次」本批未满足，由 PR #205 补。不把本批写成 ③ 完成。

## Loom §9 对照

| 项 | 计划做到 | 计划里没有 |
| --- | --- | --- |
| 范围 | 只做四件事。切片是 reader 的 `src/ui` 和 desktop 的 renderer，加上已有先例的 `library-menu.ts`。热点文件无 | Aa、侧栏、大纲、⋯、chip 文字、AC-11 降级句、配置存储、翻译 |
| 解耦 | 上文引用了 §2.1 与 RULES §8。E 的 UI PR 不改 domain、application、`index.ts`、`pure.ts`、`contracts/src/ipc`。只调已有 `pure.ts` | UI 里写 1..M、25..400、50。不改 seam 形状 |
| 契约 | 不改 `expose`。不新增 IPC。档位函数另开 core PR，15:13 已批 | 不在 E 里把 `expose: false` 改成 true |
| ‹ | 始终回库。tooltip 改成「返回文献库」，不带快捷键 | tooltip 不写 Alt+←。Esc 不回库 |
| ← → | 按 2A。只有工具栏按钮置灰。名称是「后退」「前进」 | 菜单「后退」不置灰。同一个键不走两条路径。mac 不响应 ⌥← |
| 历史 | 只有转到页码入栈。打开时 `recordJump` 写 current。最多 50，用 `POSITION_HISTORY_LIMIT`。离开清空。不持久化。可见页写入见已批的替换当前位置纯函数 | 滚动、缩放、切栏位不入栈。历史不写存储。后退不绕过 `canWrite` |
| 转到页码 | 就地输入。越界留在编辑态并提示「共 M 页」。Esc 取消。输入框里的 PageUp/Down、Home/End、Space、←→ 按文本处理 | 不用对话框。越界不夹取。Esc 不离开阅读屏 |
| 缩放 | 只缩放 PDF 栏。无 Ctrl 的 wheel 只滚动。绘制用缩放乘 dpr。边界置灰。拦住整页缩放的手段等 §10 的实测，预定在 PDF 栏上 `preventDefault`（`passive: false`） | 不加 `zoomIn` / `zoomOut` / `resetZoom` / `viewMenu` role。不调 `webFrame.setZoomFactor`。不做滑块 |
| 内存 | 按 Loom §4.6 和 E-M2：第一张可见页 −2 到最后一张可见页 +2 保留 canvas，单页像素上限。占位按各页自己的 PDF 尺寸乘缩放，页间距与已画页相同。挂上或卸下 canvas 时不改总高度、不改 `scrollTop`。释放时先把宽高设为 0，再移出 DOM（15:13 已批）。提议 ADR 0012 已在本 PR。8 GB 的超限线先不定数，E1 实测后停下 | 不测不交付。不用统一估算高度。占位不放转圈或「加载中」。不加内存开关、提示或横幅。不做分块渲染。不改 CSP、协议、主进程、core、contracts。不调用 `cleanup()` |
| 栏位 | `radiogroup`，名称「栏位」。Ctrl+1/2/3，mac ⌘1/2/3。默认原文。不记住 | 不默认对照。没有「开始翻译」「去设置」。主按钮仍是 0 |
| 空态 | `view-mode-empty.tsx` 归 E2。6-1 A 的原句和文字链接。`view-mode-empty-degrade` 留着，本批不填字 | 本批不写降级句，不造未配置状态，不写解析服务或配置。测试不用 `/解析/` 匹配整段 |
| 菜单 | Win「视图(V)」，mac「显示」。顺序按 Loom §2.2。文献库里不置灰 | 不放「显示侧栏」。不声称已经置灰 |
| 播报 | 跳页或手势结束后各一次 | 不每帧、不随滚动播 |
| 无障碍 | Tab 顺序与视觉一致。2px 焦点环。目标不小于 24×24。`reader.css` 加 `forced-colors`。200% 界面缩放下按 dpr 绘制 | 不只靠颜色表示置灰或选中 |
| 证据 | §测试计划 的 Win 真机录屏和截图。没有 8 GB 或 mac 就标未验证 | 不用 Box 代替真机。不把 AC-11 / PRC-10 标成通过 |

## 拆分

本 PR 只写计划。实现按下面「reader 切片的串行」：替换当前位置的 core PR，然后缩放档位的 core PR，然后 E1，然后 E2。15:13 已批。这一轮仍不写实现。复审 PASS 之前不开那几笔。

| 实现 PR | 内容 | 分开的原因 |
| --- | --- | --- |
| E1 | 转到页码、历史按钮、视图菜单、实际大小、适合宽度、适合页面、按 dpr 绘制、可见页 −2 到 +2、单页像素上限 | 转到页码是历史的唯一入栈来源。#202 和画页在同一文件，不另开 PR |
| E2 | 栏位分段和已批空态 | 不碰画页比例 |

+/−、捏合、Ctrl+滚轮放进 E1，但只在缩放档位的 core PR 已经合入之后。替换当前位置的纯函数先合入，E1 才写「跳转前记下可见页」。这两笔都是 15:13 已批。

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
2. 转到页码且目标与 `current` 不同：先把「跳转前可见页」写成 `current` 且不压栈（15:13 已批的替换当前位置纯函数），再 `recordJump` 目标页。可见页来自现有的 `readVisible`。这个纯函数在它自己的 core PR 合入前，E1 不写这一步。
3. 后退：`goBack`。栈没变就走 ‹ 的离开。前进：`goForward`。栈没变就停。
4. 滚动停下后仍走 D 的写回。历史跳转不另写，也不跳过。

`recordJump` 不能做第 2 步的前半：它会把旧 `current` 压进 `back`，滚动就会入栈。

## 每个文件

行数按 ARCH §6。一个文件一件事。`reader-screen.tsx` 现在 168 行，只拼装，上限 250。

| 文件 | PR | 职责 | 上限 | 禁区 |
| --- | --- | --- | --- | --- |
| `packages/features/reader/src/ui/go-to-page.tsx` | E1，新建 | 就地输入。越界只调用 `clampPage` 做相等判断。可访问名称「转到页码，第 N / M 页」。加载前和出错时不渲染 | 150 | 否 |
| `packages/features/reader/src/ui/history-controls.tsx` | E1，新建 | ← →。空的一侧 `aria-disabled`。不调用 ‹ | 80 | 否 |
| `packages/features/reader/src/domain/position-history.ts` | 替换当前位置的 core PR，改 | 现 70 行。加一个只替换 current、不清 forward、不压栈的纯函数。先于档位 | 400 | 不改 contracts。不在 E1 里写这个函数 |
| `packages/features/reader/src/domain/zoom-bounds.ts` | 缩放档位的 core PR，改 | 现 64 行。加上一档和下一档。等上一笔合入 | 400 | 不改 contracts，不改 `expose`。档位列表等 §10 第 6 条。未合入前 E1 不写 +/− |
| `packages/features/reader/src/pure.ts` | 上面两笔 core PR | 现 42 行。只加这两笔的导出 | 80 | 不在 E1、E2 里改 |
| `packages/features/reader/src/ui/zoom-controls.tsx` | E1，新建 | 「− % +」和百分比菜单。+/− 只调用已合入的档位纯函数。加载前和出错时不渲染，快捷键什么都不做 | 160 | 档位 core PR 未合入前，这个文件不写 +/− |
| `packages/features/reader/src/ui/canvas-window.ts` | E1，新建 | 给定第一张可见页、最后一张可见页和总页数，返回闭区间 [第一张−2, 最后一张+2]，夹在 1..M。只服务 `page-column` | 80 | 否。放 UI，不放 domain。放进 domain 就碰到 core，那要停下来问 |
| `packages/features/reader/src/ui/page-column.tsx` | E1，改 | 现 95 行。主改文件。栏宽、wheel、按窗口挂 canvas 或占位。尺寸齐了才挂 `Restore`。释放时先把 canvas 宽高设为 0，再移出 DOM，并走已有 cancel | 250 | 否。离开阅读屏时不清零 |
| `packages/features/reader/src/ui/pdf-session.ts` | E1，改 | 现 228 行。绘制 scale 是 `min(缩放 × devicePixelRatio, 上限对应的 scale)`。CSS 尺寸仍按缩放。超过上限就拉伸 | 400 | 否。这是 UI 文件 |
| `packages/features/reader/src/ui/use-reader-session.ts` | E1，改 | 现 258 行。打开、离开、滚动、`readVisible`。把第一张和最后一张可见页交给 `page-column`。不持有历史栈，不持有缩放百分比 | 400 | 否。改完不超过 400 |
| `packages/features/reader/src/ui/use-position-history.ts` | E1，新建 | 持有历史栈。只调用 `position-history.ts` 的纯函数。打开时写入恢复页 | 120 | 替换当前位置的纯函数不在这个文件里写 |
| `packages/features/reader/src/ui/use-zoom.ts` | E1，新建 | 持有本次打开的缩放百分比，初值 100。适合宽度、适合页面调用已有纯函数 | 120 | 档位 core PR 未合入前不写 +/− |
| `packages/features/reader/src/ui/reader-screen.tsx` | E1、E2 | 撤掉 `useLeaveKeys`。‹ 的 tooltip 改为「返回文献库」。只拼装，不持有历史栈和缩放百分比 | 250 | 否 |
| `packages/features/reader/src/ui/copy.ts` | E1、E2 | 现 10 行。越界句、按钮名、6-1 A 的原句 | 80 | 否 |
| `packages/features/reader/src/ui/view-mode-switch.tsx` | E2，新建 | `radiogroup`。默认原文 | 120 | 否 |
| `packages/features/reader/src/ui/view-mode-empty.tsx` | E2，新建 | 6-1 A 的句子和文字链接。6-1 A 之后留稳定插入点 `data-testid="view-mode-empty-degrade"`，本批不填字。0 个主按钮 | 100 | 否。不写降级句，不造未配置状态 |
| `apps/desktop/src/renderer/reader.css` | E1、E2 | 排列、焦点环、`forced-colors`。不新造颜色定稿 | 220 | 否 |
| `apps/desktop/src/renderer/shell.tsx` | E1 | 现 81 行。听返回和视图菜单事件。不在阅读屏时丢掉 | 160 | 否 |
| `apps/desktop/src/renderer/shell-events.ts` | E1 | 事件名常量，与菜单用同一字符串 | 40 | 否。不新建 `ui-events.ts` |
| `apps/desktop/src/main/library-menu.ts` | E1 | 现 53 行。追加视图菜单。点击仍 `dispatchEvent`。不新 IPC，不改 CSP，不改协议。阅读屏「后退」不 `enabled: false` | 160 | 主进程。授权是 2026-11-05 21:01（评论 6658666956）的「菜单 + 已批快捷键」，加上 6-3 A。D 也改过这个文件 |
| `apps/desktop/test/library-menu.test.ts` | E1 | 标签、访问键 (V)、快捷键、没有置灰 | 140 | 随菜单文件 |

测试与被测文件配对，放在 `packages/features/reader/test/ui/` 和 `apps/desktop/test/`。一个测试文件只测一块。

历史栈在 `use-position-history.ts`。缩放百分比在 `use-zoom.ts`。`reader-screen.tsx` 只拼装。`use-reader-session.ts` 现 258 行，上限 400，是普通 `.ts` 的建议上限，不是组件的 250。上表每个文件改完都不超过自己的上限。

`docs/arch/04-02.md` 第 20 行列的是 `ui/page-virtualizer.ts`。那一行是整页虚拟化组件，还包含对照跳转和译文块。本批只加纯函数文件 `canvas-window.ts`，算出保留 canvas 的页码闭区间。渲染仍在已有的 `page-column.tsx`。不把这个函数改名叫 `page-virtualizer.ts`，也不改 04-02 第 20 行。

不改：`packages/contracts/**`、`packages/features/reader/src/application/**`、`index.ts`、`packages/features/library/src/**`、`csp.ts`、协议、preload、wasm、`blob:`、`.mjs`、DESIGN、原则、`docs/design/**`、`docs/arch/04-02.md` 第 20 行、0011 正文。`position-history.ts`、`zoom-bounds.ts` 和 `pure.ts` 只在各自的 core PR 里改，不进 E1、E2。

## Seam（Loom §7）

| seam | 位置 | 状态 | 本批 |
| --- | --- | --- | --- |
| `clampPage` | `pure.ts` → `page-bounds.ts` | 已有 | 只用相等判断，不用返回值去跳 |
| `recordJump` / `goBack` / `goForward` / `emptyPositionHistory` / `POSITION_HISTORY_LIMIT` | `position-history.ts` | 已有。UI 还没用 | 打开和跳转用它们。可见页写入等替换当前位置的 core PR |
| 只替换 current | 无 | 不存在。15:13 已批 | 先于档位的 core PR。不进 E1 |
| 下一档、上一档 | 无 | 不存在。15:13 已批 | 档位 core PR。不进 E1 |
| `parseZoomPercent` / `clampZoomPercent` / `DEFAULT_ZOOM_PERCENT` / `ZOOM_PERCENT_MIN` / `MAX` / `parseZoomLevel` | `zoom-bounds.ts` | 已有 | 打开用 100。边界用 min/max |
| `resolveZoomPercent` / `viewportForZoom` | `viewport-mapping.ts` | 已有 | 适合宽度、适合页面 |
| `reader.setZoom` | `contracts/src/ipc/reader.ts` | `expose: false`。main 没注册 | 不调用。不改 expose |
| `reader.getZoom` | 无 | 不存在 | 不做。6-2 A 不记住 |
| 栏位 | `READER_VIEW_MODE_ORIGINAL`。契约写栏位留在 renderer | 没有写口 | 每次打开原文 |
| 页码写回 | `client.writePage` | 已有 | 不改 |
| 菜单事件 | `shell-events.ts` 的 window 事件 | D 的写法 | 沿用。不登记尚未存在的 `contracts/src/ui-events.ts` |
| 场景通道 | 无 | 不存在 | 6-3 A 不做。挂在 M2 退出格 |
| 按缩放乘 dpr 绘制，以及像素上限 | `pdf-session.ts` | UI 文件 | UI 自己改。不进 core |

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
| C16 | 菜单在 main，UI 任务通常不改那里 | E1 再改这个文件。授权是评论 6658666956 的「菜单 + 已批快捷键」，D 改过是先例 |
| C17 | 新 UI 事件要登记 `ui-events.ts`。文件不存在。D 没登记 | 本批不建。见 §10 |
| C18 | 重开同一篇时栈留不留 | 清空 |
| C19 | 每页都画。400% 面积约 16 倍。0011 写暂不开工 | 14:17 把 #202 并入本批。提议 ADR 0012 只改这一条 |
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
5. Ctrl++ 在 Windows 美式键盘和中文输入法下的实际键。测法：输入法开、关各一遍，分别按 Ctrl+=、Ctrl+Shift+=、小键盘 +/−。哪一个进了放大或缩小，写进证据。计划不预先声称全部生效。Ctrl+= 进不了放大就停下来问。不加隐藏菜单项，也不加 keydown。
6. 浏览器档位的精确列表。测法：在 Windows 上打开 Edge，用它自己的缩放从最小走到最大，记下界面上每一个百分比。Chrome 也在就再记一遍。两份相同才交给已批的档位纯函数。不同就停。不把 Loom 写的「约 25、33、50、67、75、80、90、100、110、125、150、175、200、250、300、400」抄进函数或本计划。
7. DESKTOP-0GI64S8 的内存还没核实。停点是第 12 条。更高内存的机器不能代替。
8. RULES 第 89 行的 `ui-events.ts` 登记是否适用于菜单的 window 事件。文件现在不存在。D 的返回事件没有登记。本计划不建这个文件。Forge 若认为必须登记，那是 contracts，停下来，不在 E 里新建。
9. 评论 6764944106 本计划没有单独再拉取。0011 的正文仍是已采纳，这一轮不改。14:17 用提议中的 0012 修订「暂不开工」。15:13 已批：0011「不实现画布清零」收窄为只管离开阅读屏，释放视口里的 canvas 时先清零。这一条写在 0012，不改 0011 正文。
10. Chromium 是否让滚动容器默认可用键盘聚焦。测法：实现 PR 里用键盘 Tab，看 PDF 栏能不能成为焦点。不能，再给栏加 `tabindex="0"`。这是 UI，不是新 seam。
11. 页码输入框聚焦时，Alt+← 或 ⌘[ 会不会被菜单快捷键抢走（UIX-65）。同时记 Ctrl+1/2/3、Ctrl+0、Ctrl+−。被抢走就停，不加第二套 keydown。
12. 停点。E1 在确认是 8 GB 的 Windows 上实测内存。任务管理器看本进程，录屏。记 100%、200%、400%，以及 400% 加显示缩放 200%：canvas 像素字节合计和 Tab working set。测完停下，把这些数带给 Wisdom 判断。不自定 MB 数，不把像素上限调大再交。机器没核实是 8 GB 就标未验证并停。更高内存的机器不能代替。

## 视口附近的页和单页像素上限

按 Loom §4.6，对应 §9 的内存行。#202 并入 E1，不另开实现 PR。提议 ADR 是 `docs/adr/0012-viewport-canvas-cap.md`，已经在本 PR，不另等一份 ADR。0011 仍是已采纳。0012 修订「暂不开工」，并按 15:13 把「不实现画布清零」收窄为只管离开阅读屏。压力后保留的 `[anon]` 不下降，这一实测写进 0012。不对用户提示这一局限。

100% 时 25 页画布 48,470,400 字节是 0011 的实测。Loom 里「400% 约 775 MB、±2 页约 155 MB、再乘 dpr 约 620 MB」是 Forge 的推算，本计划不把它写成已测到的数。

当前页用已有的 `readVisible`：与栏的视口相交最高的那一页，相交相同取较小页码。`visible-page.ts` 写明这是显示几何，不是夹页。每一页的 `article` 一直在，带 `data-page`。已画和未画都参加这个计算。「第 N / M 页」和历史仍用这一页。

可见页是所有与栏的视口相交的 `article`。第一张和最后一张按页码取。保留 canvas 的页是 `canvas-window.ts` 算出来的闭区间：第一张可见页减 2 到最后一张可见页加 2，再夹到 1..总页数。不用 `readVisible` 那一页单独加减 2。其余页不挂 canvas。卸下时调用现有的 `cancel`。canvas 数的上界是可见页数加 4。400% 时可见页通常只有 1 到 2 页，所以上界不会比「最多 5 张」更大。

释放时先把 canvas 的宽高设为 0，再移出 DOM。这是 15:13 已批的做法，和 0011 测量脚本里的视口路径相同。外框留着，文档总高度和 `scrollTop` 不变。0011「不实现画布清零」收窄为只管离开阅读屏。离开阅读屏时仍不清零，不调用 `PDFDocumentProxy.cleanup()`。

占位尺寸：

- 打开后、渲染占位之前，对 1..总页数的每一页按页码顺序 `getPage`，再 `getViewport({ scale: 1 })` 取 PDF 宽高。这一步不 `render`。
- 全部页的宽高都拿到之后，才用它们乘当前缩放写出每一页的 CSS 占位。不乘 `devicePixelRatio`。横版页和竖版页各算各的。页与页之间的间距和已画页相同。
- 不允许用一个统一的估算高度套所有页。
- 只为占位取尺寸，不为占位画 canvas。尺寸算在 `pdf-session.ts`。
- 外框在挂上 canvas 之前就有这个高度。canvas 画在框里，卸下时框还在。所以文档总高度不变。
- 耗时和页数成正比：每页一次 `getPage` 加一次 `getViewport`，不随缩放或像素上限变。这是读页对象，不是画 canvas。E1 在样本 PDF 和一份长文档上记这一步的墙钟时间。长文档若让打开停在空白上，或让恢复页在尺寸齐之前就滚了，就停下来问。本计划不写一个没测过的毫秒数。

`page-column.tsx` 第 77–86 行的 `Restore` 现在在挂载时就 `scrollIntoView`。E1 改成：尺寸数组还没齐时不挂 `Restore`。顺序是先取齐全部页尺寸，再渲染占位，再 Restore。

和批次 D、E-M1 的衔接：恢复页仍是批次 D 已经读到的 `progressPage`。E-M1 要求外框高度在画布挂上或卸下时不变，滚动不跳。尺寸后到会让恢复页先按空高度滚动，再被撑开，恢复页错位，E-M1 也不成立。所以 Restore 必须等全部尺寸。

占位外观：阅读区底色加页面边框，只用 `reader.css` 里已有的 `--oi-reader-*`，不新造 token。不放转圈，不放骨架，不写「加载中」。快速滚动时短暂看见空白页框可以接受。`forced-colors` 下页框要看得见，写进 E1 已有的强制色块。

滚动不跳：挂上或卸下 canvas 时不改 `scrollTop`，不再调用 `scrollIntoView`。`Restore` 只在尺寸齐了之后滚一次，换窗口时不再滚。视线所在的那一行因此不动。缩放仍以当前页为锚点：先改每一页的占位尺寸，再把滚动位置调到同一页仍在视口里的位置。指针锚点仍是 G-5，规格没写，本批不做。

页码和跳转都按占位，不按「有没有 canvas」：

- 「第 N / M 页」继续走 `readVisible`。未画页因为有高度，一样能被读出来。
- Ctrl+G 和历史后退滚的是那一页的 `article`，即使当时还没有 canvas。滚进视口后再画。这次滚动不另记入历史。
- 播报仍只在跳转或缩放手势停下后各一次。释放和重画不播。

和批次 D 的页码写回：

- `writePage` 仍只在用户滚动或跳页停下后，走现有的 `onScrollEnd`。`canWrite` 为 false 时不写。
- 释放和重画不调用 `writePage`，不改 `scrollTop`，不改文档总高度。因此不会自己再触发一次 `onScrollEnd`。
- 若实现时发现挂上 canvas 改变了高度，或浏览器因此发出 scroll，就停。不在 E1 里改写回的 seam。

读屏、焦点、Tab 顺序：

- canvas 不加 `tabindex`，设 `aria-hidden`。占位里没有可访问名称，也没有 live 区域。
- 释放和重画不移动焦点，不改变 Tab 顺序。标题栏的按钮、页码、栏位仍按原来的顺序。
- 卸下之前若焦点在即将去掉的节点上，先把焦点交回阅读栏，再卸。栏本身能不能被键盘聚焦，按 §10 第 10 条测；不能，再给栏加 `tabindex="0"`。

重算：

- 滚动：`onScroll` 再读可见页。第一张或最后一张变了就换窗口。离开窗口的页 cancel 并去掉 canvas，进入窗口的页再 paint。`scrollTop` 不动。
- 缩放：先按新缩放改每一页的占位尺寸，再按当前页锚点修正滚动，然后重画窗口内的 canvas。窗口仍是第一张可见页 −2 到最后一张可见页 +2。
- 转到页码和历史后退：先把目标页的占位滚进视口，再读可见页，窗口改到第一张可见页 −2 到最后一张可见页 +2，然后画。

单页上限在 `pdf-session.ts`。渲染 scale = min(缩放 × `devicePixelRatio`, 上限对应的 scale)。超过上限时只用 CSS 把较小的 canvas 拉到缩放后的尺寸。400% 时略虚可以接受。不写 `role=status`，不弹提示。上限是这个文件里的可调常量。具体数值等 8 GB 实测，本计划不写死，也不在别的文件里猜一个数。

已核实的参考，不是产品初值：本机安装的 `pdfjs-dist@6.5.438` 里，`legacy/web/pdf_viewer.mjs` 的 `maxCanvasPixels` 选项默认是 `2 ** 25`。同一文件只在 iOS 或 Android 上把 compat 覆盖写成 5242880。`legacy/build/pdf.mjs` 没有这个名字。阅读屏走 `page.render`，不经过 PDFViewer，所以这个默认值现在不会自动套上。实现不把 `2 ** 25` 抄成常量，除非实测选定它。

不做分块渲染。不加任何内存开关、提示或降级横幅。不调用 `PDFDocumentProxy.cleanup()`。若占位尺寸或窗口计算必须改 core、contracts、主进程、CSP 或协议，就停，不在 E1 里改。半径 2 放在 UI 的具名常量。把它挪进 domain 就是 core，本批不允许。

## 与 PR #205 的空态接缝

`view-mode-empty.tsx` 归本批 E2。依据是 [评论 6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956) 的 3A：「切到对照/译文时空态再说一次」。chip 和配置存储仍归 PR #205，本批不建 chip，不接 `parsing.getParseCapabilities`。

组件里先放 6-1 A：「本阶段暂不提供译文，请先阅读原文。」加上文字链接，Windows「切到原文（Ctrl+1）」，mac「切到原文（⌘1）」。这句放在 `data-testid="view-mode-empty-copy"` 里。紧挨着它的后面留一个稳定插入点，`data-testid="view-mode-empty-degrade"`。本批这个插入点里没有文字。组件接受一个可选的降级句字符串；本批的调用点不传，节点是空的。

PR #205 第 3 笔只在真实读口结果是未配置时，在调用处把降级函数的返回值传进这个节点，也就是接在 6-1 A 后面。句子的文字和「是不是未配置」都由 #205 决定。E2 合入时还没有那个函数，所以不在 `view-mode-empty.tsx` 里写死调用。本批不写这句，也不在阅读屏里造一个未配置状态。#205 计划里写的「第 120 行」指文件表里 `view-mode-empty.tsx` 这一行，行号随本稿改动，以这一行为准。

`view-mode-empty` 的测试只断言精确文案，或只读上面两个 testid。6-1 A 用整句相等，链接用「切到原文（Ctrl+1）」和「切到原文（⌘1）」的整句相等。插入点单独断言：本批它的文本是空的。不要用 `/解析/` 这类宽正则去匹配空态的整段文字。PR #205 第 3 笔会把「未解析 / 去配置」放进这个插入点；整段上的 `/解析/` 会把这句和 6-1 A 混在一次匹配里。`reader-screen.test.tsx` 第 49 行已有的 `document.body` 负向匹配留在那个文件，本批的空态测试不照搬，也不改那一行。

AC-11 的「空态再说一次」本批未满足，由 PR #205 补。AC-11 整句和 PRC-10 仍未满足。

## 与 PR #205 的规格接缝

约定 #206 先于 PR #205 合入。两边都会改 `docs/prd/08.md` 和 `tools/compare-spec-bytes/manifest.json`。

本批改的是 M2 退出格，在 `docs/prd/08.md` 第 12 行。manifest 里这条唯一替换的 source 是 `PRD.md`，old 是「8 GB Windows 与 M1 真机打开 / 滚动 / 重开录屏（PDF 与 `.md` 各一）」。第 9 行是里程碑表的分隔行 `| --- | --- | --- |`，本批保持原样。

PR #205 改第 25 行「M2 ③ 本批归属」里的事实句：`parsing.getParseCapabilities` 的 `expose` 为 false，以及「存储和 handler 尚未实现」。那一笔另加一条 manifest 替换。两条替换的 old 互不包含。#205 rebase 到本批合入后的 main 时，保留本批这一条，只追加第 25 行那条。

2026-11-14 14:37 已批 W4，见台账该行：实现第 2 笔同一个 PR 里，只把 `docs/arch/02-05.md` 第 32 行和 `docs/prd/08.md` 第 25 行改成事实并同步 manifest。PRC-10 不进 PRD。本批的第 12 行不动。

2026-11-14 14:49 已批 PR #205 的三笔实现，按顺序做。第 3 笔才把降级句填进 `view-mode-empty-degrade`。原话是等第 2 笔和 #206 都合入后，再从 main 开新分支。15:13 已把第 3 笔的前置改成等 #206 的 E2 合入。每笔合入单独请 Wisdom 批。本批仍不写这句。

## reader 切片的串行

RULES.md 第 87 行：一个切片同一时间一个活跃 PR。15:13 已批的顺序是：

1. 替换当前位置的 core PR。改 `position-history.ts`，经 `pure.ts` 导出。不改 contracts。
2. 缩放档位的 core PR。等第 1 笔合入。改 `zoom-bounds.ts`，经 `pure.ts` 导出。不改 contracts，不改 `expose`。原话是「先于档位单独做」。
3. E1。
4. E2。`view-mode-empty.tsx` 在 E2 合入后才存在。#206 是计划 PR，合入后仓库里还没有这个文件。
5. PR #205 第 3 笔。等 #206 的 E2 合入。14:49 的其余顺序不变：第 3 笔仍等第 2 笔合入，再从 main 开新分支。每笔合入单独请 Wisdom 批。本批不创建 `view-mode-empty.tsx`，也不写降级句。

E1 不提前。依据是第 87 行：E1 不能和这两笔 core PR 同时开着。E1 里的 +/−、捏合和 Ctrl+滚轮要调用档位函数，所以 E1 整份等第 2 笔合入。

功能上不必等新函数的，有视口窗口、占位尺寸、释放时先把宽高设为 0 再移出 DOM、转到页码、已有的 `recordJump` / `goBack`、实际大小、适合宽度、适合页面、按 dpr 绘制、像素上限、视图菜单。跳转前把可见页写成 current 必须等第 1 笔。这些也不另开一笔插到 core PR 前面或中间。

## 已批（2026-11-14 15:13）

来源是 [Issue #174 评论 6873638323](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6873638323)。同一原话在 [PR #206 评论 6873639011](https://github.com/wisdom-km/open-immerse-v2/pull/206#issuecomment-6873639011) 和 [PR #205 评论 6873639800](https://github.com/wisdom-km/open-immerse-v2/pull/205#issuecomment-6873639800)。计入批准。

1. **释放画布时清零。** 视口里卸下一页时，先把 canvas 的宽高设为 0，再移出 DOM，并调用现有的 cancel。外框留着。0011「不实现画布清零」收窄为只管离开阅读屏。离开阅读屏时仍不清零，不调用 `PDFDocumentProxy.cleanup()`。
2. **缩放档位放 core，单开 core PR。** 排在替换当前位置之后。位置是 `zoom-bounds.ts`，上一档和下一档，经 `pure.ts` 导出。输入是当前百分比，输出再经已有的 `clampZoomPercent`。不改 `packages/contracts`，不改 `expose`，不注册 `createSetZoom`。E1 的 +/−、捏合和 Ctrl+滚轮等这个 PR 合入。档位列表仍等 §10 第 6 条的实测，不照抄 Loom。捏合的连续变化在松手时用 `clampZoomPercent` 取整，取整后的档位用这两个函数，不在 UI 里另写一张表。
3. **替换当前位置的纯函数，先于档位单独做。** `recordJump` 在页不同时会把旧 current 推进 back。`position-history.ts` 加一个只替换 current、不清 forward、不压栈的纯函数，经 `pure.ts` 导出。不改 contracts。E1 的「原位置是可见页」等这个 PR 合入。没有它，后退回到的是上一次跳转或打开时的页，不是滚动后看见的页。
4. **8 GB 超限线先不定数。** E1 在确认是 8 GB 的机器上实测后停下，带数据请 Wisdom 判断。不自定 MB 数。停点是 §10 第 12 条。
5. **PR #205 第 3 笔改为等 #206 的 E2 合入。** 见上面的串行。14:49 里「等 #206 合入」按这条改。

## 不做

配置存储，AC-11 chip，解析服务说明。侧栏、Aa、大纲、⋯、Range、`disableRange`。CSP、wasm、`blob:`、`.mjs`、协议、主进程里除已列菜单文件以外的改动。E1 和 E2 不改 domain。contracts、`library/src`。分块渲染。`PDFDocumentProxy.cleanup()`。统一的估算页高。占位上的转圈、骨架或「加载中」。内存开关、内存提示、降级横幅。因释放或重画去写回页码。离开阅读屏时清零。侧键、触控板横滑、长按历史列表。查找。改 DESIGN。把 `expose` 改成 true。按文档记住缩放。菜单置灰通道。Win ☰。用放宽像素上限来通过 8 GB 实测。自定一个 MB 数。

## 测试计划

本 PR 不跑 Vitest。实现 PR 才跑。

单测：已有历史和缩放边界测试保持通过。`go-to-page` 断言越界不调用跳转、`clampPage` 的返回值不被当成目标页。`history-controls` 断言空的 ← 不调用离开。`view-mode-empty` 只按精确文案或稳定 testid 断言：`view-mode-empty-copy` 的文本等于 6-1 A 的原句，链接文字等于「切到原文（Ctrl+1）」或「切到原文（⌘1）」，并且没有「开始翻译」「去设置」。`view-mode-empty-degrade` 的文本是空的。不用 `/解析/` 或同类宽正则去匹配空态整段。测试不写「未解析 / 去配置」。键位分 `metaKey` 和 `ctrlKey`。

Electron e2e：打开小 PDF。窗口缩放因子在 Ctrl+滚轮后仍是 1，画布变大。Ctrl+G 跳页，Alt+← 回去，历史用尽后回库。‹ 在有历史时直接回库。Ctrl+2 出现空态，没有翻译请求。25 页样本上，DOM 里的 canvas 数 ≤ 当时可见页数 + 4。滚过之后，保留 canvas 的页码集合换成新的第一张可见页 −2 到最后一张可见页 +2。

视口和上限的单测只断言行为，不读源码做文本断言（F-08）：

- 窗口在首页、末页、中页，以及同一视口里有多页时的页码集合。任意时刻 canvas 数 ≤ 可见页数 + 4（E-M2）。
- 两页 PDF 尺寸不同时，占位高度不同。不允许两页得到同一个估算高度。
- scale 不超过上限对应的值，CSS 尺寸仍是缩放后的尺寸。超过上限时没有新增的提示节点。
- 占位里没有「加载中」这段文字，也没有进度条角色。
- 卸下 canvas 不调用 `writePage`。卸下前 canvas 的宽高是 0，然后移出 DOM。卸下前后外框高度相同，`scrollTop` 相同。离开阅读屏时不把宽高设为 0。
- canvas 不在 Tab 顺序里。卸下时焦点不留在被去掉的节点上。

内存在 100%、200%、400% 各记一次：当时 canvas 的像素字节合计，以及 Tab working set。8 GB Windows 真机要有录屏和截图。测完停下，带数据请 Wisdom 判断。不自定 MB 数，不把常量调大再交。没有确认是 8 GB 的机器就标未验证。E-M5 有横版混排夹具才测；没有夹具就标可延后，不挡 E1。

§10 的十二项实测按上面的测法做，和功能测试分开记。

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
| R-E10 | 8 GB 机器上 400% 的内存。测完停下，带数据请 Wisdom 判断。不自定 MB 数。机器未核实就标未验证并停 |
| R-E12 | 25 页以上的 PDF，快速滚到底再回顶，100% 和 400% 各一次。看滚动条长度和页框（E-M1、E-M3）。离开窗口的 canvas 先把宽高设为 0 再移出 |
| R-E13 | 8 GB 机器上 400% 再加显示缩放 200% 的内存峰值，含第一张可见页 −2 到最后一张可见页 +2 和像素上限。测完停下，带数据请 Wisdom 判断。不自定 MB 数。机器未核实就标未验证，和 R-E10 同一台 |
| R-E11 | mac 的 ⌘[ ⌘] ⌥⌘G ⌘1/2/3 和捏合。没有设备就标未验证 |

## 风险

- D-15 的「Alt+← 一律回库」会失败，E1 改断言。
- 菜单 accelerator 在输入框聚焦时会不会抢走 Alt+← 或 ⌘[，属于 §10 第 11 条。抢的话停，不加第二套 keydown。
- 400% 的内存可能仍超过 8 GB。视口绘制不保证压力后的 `[anon]` 下降，0011 已经量过。测完停下，带数据请 Wisdom 判断。不自定 MB 数，不放宽常量。
- 档位列表在实测前不存在。E1 不能先写一个临时数组。

## 自检

- 本 PR 的任务类型是纯文档。UI–core 交接写不适用。
- 不改 N-10、N-11 的文件，不改 CI。
- M2 退出格在 `docs/prd/08.md` 第 12 行。已删掉不在 6-3 A 原话里的「阅读屏菜单「后退」不置灰」。manifest 同一条替换跟着删。不改基线，不改 `compare.mjs`。第 25 行留给 PR #205。
- 这一笔补 15:13，计入批准。合计 164 条批准 + 1 条反馈记录 + 4 条决定 + 7 条合入同步，表内 176 行。merge-base 是 main `d8e5afb`。13:57 只留 #204 的批准行。14:13、14:17、14:20、14:22:10、14:37、14:49 都留着。
