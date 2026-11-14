# 批次 E · 阅读屏导航（缩放、转到页码、位置历史、栏位）

分支 `feature/reader-nav-zoom-174`。基线 main `5db585df3c460a1d6a8ac2d33583cde16e48970e`，tree `b56d0d364b9dea92a04c4c7da98a8575034d9716`（PR #200 与 PR #203 已合入）。本文件自洽。Forge 审查通过之前没有实现提交。本 PR 只交计划和台账，不写产品代码，不改测试，不改 CI，不改 CSP，不改 DESIGN。不开 Ready，不合入，不发版。

开工依据是已经在台账里的 2026-11-05 21:01 ③ 批准，不另造原话。原话见 [Issue #174 评论 6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956)。本批只用其中还没做的四项，以及拍板 1、拍板 2。拍板 3（AC-11 chip）不在本批。

## 现状理解

1. main `5db585d` 上，打开一份 PDF 进入阅读屏，画原文页，标题下有「第 N / M 页」。工具栏 ‹ 和菜单「返回文献库」回文献库。`Alt+←` 现在一律回库，因为还没有位置历史（批次 D 的 D-15）。`Esc` 不回库。没有缩放、没有页码输入、没有 ← →、没有「原文 / 对照 / 译文」。
2. 相关的节：DESIGN §4.1、§11.3、§11.4、§12.1、§12.2；原则 §4、§8；PRD §3.6；ARCH §9.1 与 §4.2；契约 `packages/contracts/src/ipc/reader.ts`、`packages/contracts/src/reader.ts`。DESIGN 第 156 行仍写默认「对照」。③ 的临时默认是原文。不改 DESIGN 正文（N-10）。
3. 还没做的是下面四项。侧栏开关、Aa、大纲、⋯、配置存储、AC-11 chip、只画视口附近的页，都不在本批。

## 来源核对

| 项 | 现在的代码 | 规格怎么写 | 本批 |
| --- | --- | --- | --- |
| 缩放 25%–400% | `reader.setZoom` 已在契约里，`expose: false`。`createSetZoom` 只写阅读切片自己的内存，桌面主进程没有注册它。`clampZoomPercent`、`resolveZoomPercent`、`viewportForZoom` 已在 `pure.ts`。画页在 `pdf-session.ts` 里固定 `scale: 1` | DESIGN §11.3。ARCH §9.1：按文档记住，不调 `webFrame.setZoomFactor`，不造 `reader.setPage` | 只做阅读中的缩放。见「需 Wisdom 决定」1、2、3 |
| 转到页码 | 「第 N / M 页」只是文字，不能输入 | DESIGN §11.4：`⌥⌘G` / `Ctrl+G`，Enter 跳，Esc 只取消输入，越界就地提示「共 M 页」且不跳 | 做。越界判定见决定 4 |
| 位置历史 | `position-history.ts` 已有上限 50、同页不记、前进清空、不落盘。界面没有 ← →。`Alt+←` 直接回库 | DESIGN §12.1。拍板 2：有历史先后退，没有时回库；‹ 和「返回文献库」始终回库；← → 无历史时置灰，不触发 ‹；不用 Esc | 做。改掉 D-15 里 `Alt+←` 一律回库 |
| 栏位 | 只有原文栏 | 拍板 1：默认原文，临时；对照和译文可切，诚实空态，不出「开始翻译」。⌘1/2/3 已批 | 做。空态句子见决定 5 |
| 菜单 | `library-menu.ts` 只有「打开…」和「返回文献库」。返回项没有快捷键，点击在页面里发 `oi-return-library` | 菜单入口已在 ③ 一并批准的范围里 | 见决定 1。本 PR 不改这个文件 |

## 目标

阅读屏在一次打开里可以：

- 把 PDF 栏缩到 25%–400%，以及实际大小、适合宽度、适合页面。不缩放整窗。不造滑块。
- 用快捷键或「第 N / M 页」转到某一页。这次跳转记入位置历史。
- 最多记 50 条跳转。`⌘[` / `Alt+←` 有历史就回到上一处，没有就回文献库。← → 空时置灰。
- 在原文、对照、译文之间切换。默认原文。对照和译文只显示空态，不请求翻译。

## 验收

- 打开后是原文，比例是 100%。对照和译文能切到，没有「开始翻译」，没有翻译请求。切回原文，页还在。
- − 与 + 不超出 25 和 400。实际大小是 100%。适合宽度、适合页面走已有的 `resolveZoomPercent`，结果再夹到 25–400。整窗不变。
- 「第 N / M 页」可输入。Enter 跳到该页并记入历史。Esc 只取消输入，人还在阅读屏。越界不跳，就地显示「共 M 页」。
- 连续跳转最多留下 50 条可后退记录。同页再跳不记。新跳转清掉前进。普通滚动不记。
- 有后退记录时，`⌘[` / `Alt+←` 和工具栏 ← 回到上一处。没有时，这两键等于 ‹，回文献库。工具栏 ‹ 和菜单「返回文献库」在有历史时也直接回库。→ 没有前进记录时置灰，点击无效。`Esc` 不回库。
- 离开阅读屏再进来，历史是空的（DESIGN：不落盘）。
- AC-11 仍未满足。不把本批写成 AC-11 通过。

## 拆分

本 PR 只写计划。实现最多两个 PR，都等本计划审查通过，并且等下面标了「需 Wisdom 决定」的项有了原话。决定没来的文件不改。

| 实现 PR | 内容 | 为什么分开 |
| --- | --- | --- |
| E1 | 缩放、转到页码、位置历史、工具栏、阅读屏快捷键 | 转到页码是历史的唯一记入来源，三者和工具栏绑在一起 |
| E2 | 「原文 / 对照 / 译文」和 ⌘1/2/3，对照与译文的空态 | 不碰画页比例，可单独验收。空态句子等决定 5 |

菜单若获准，放进获准时正在写的那一个实现 PR，不单开第三个。

## 键盘（已批的，两套都写）

Mod 在 macOS 是 ⌘，在 Windows 是 Ctrl。不使用 Electron 的 `zoomIn` / `zoomOut` / `resetZoom` 角色。

| 动作 | macOS | Windows |
| --- | --- | --- |
| 放大 | ⌘+ | Ctrl++ |
| 缩小 | ⌘− | Ctrl+− |
| 实际大小 | ⌘0 | Ctrl+0 |
| 适合宽度 | ⌥⌘0 | Ctrl+Alt+0 |
| 转到页码 | ⌥⌘G | Ctrl+G |
| 有历史则后退，没有则回库 | ⌘[ | Alt+← |
| 前进（有记录才生效） | ⌘] | Alt+→ |
| 原文 | ⌘1 | Ctrl+1 |
| 对照 | ⌘2 | Ctrl+2 |
| 译文 | ⌘3 | Ctrl+3 |

适合页面没有已批快捷键，只从菜单和点百分比打开的三项里进入。不新造快捷键。

`Ctrl+G` 现在没有被「打开…」占用。「打开…」是 `CmdOrCtrl+O`。查找的 ⌘G / F3 不在本批，本批不注册查找。

捏合和 Ctrl+滚轮只作用在 PDF 栏上，并 `preventDefault`，避免 Chromium 把整个界面放大。步进与工具栏 +/− 相同，等决定 3。

不劫持 PageUp、PageDown、Home、End、Space。批次 D 已把这五键留给栏内滚动。鼠标侧键、触控板双指横滑、长按 ← 弹出历史列表，③ 的四项里没有，本批不做。

## 菜单（两套）

文件菜单保持现有两项。

| 菜单项 | macOS 快捷键 | Windows 快捷键 | 行为 |
| --- | --- | --- | --- |
| 文件 › 返回文献库 | 无 | 无 | 始终回库。已有，不改快捷键 |
| 显示 › 原文 | ⌘1 | Ctrl+1 | 切到原文 |
| 显示 › 对照 | ⌘2 | Ctrl+2 | 切到空态 |
| 显示 › 译文 | ⌘3 | Ctrl+3 | 切到空态 |
| 显示 › 放大 | ⌘+ | Ctrl++ | 只缩 PDF 栏 |
| 显示 › 缩小 | ⌘− | Ctrl+− | 只缩 PDF 栏 |
| 显示 › 实际大小 | ⌘0 | Ctrl+0 | 100% |
| 显示 › 适合宽度 | ⌥⌘0 | Ctrl+Alt+0 | 走 `resolveZoomPercent` |
| 显示 › 适合页面 | 无 | 无 | 走 `resolveZoomPercent`，不新造快捷键 |
| 显示 › 后退 | ⌘[ | Alt+← | 与工具栏 ← 同一条规则 |
| 显示 › 前进 | ⌘] | Alt+→ | 没有记录则点击无效 |
| 显示 › 转到页码 | ⌥⌘G | Ctrl+G | 打开页码输入 |

这些「显示」项都在 `apps/desktop/src/main/library-menu.ts`。那是主进程。见决定 1。没决定之前，快捷键和工具栏仍按上表在渲染进程里做，菜单不增加项。

点百分比打开的是渲染进程里的三项（实际大小、适合宽度、适合页面），不是滑块，也不再开一条主进程菜单。

## 每个文件

行数上限按 ARCH §6：React 组件建议 250、硬 400；普通 `.ts` 建议 400、硬 600；函数建议 50、硬 80。一个文件只做一件事。`reader-screen.tsx` 现在 168 行，只负责把下面的块拼起来，上限 250，不把缩放、历史、栏位写进它。

| 文件 | 实现 PR | 职责 | 上限 | 禁区 |
| --- | --- | --- | --- | --- |
| `packages/features/reader/src/ui/zoom-controls.tsx` | E1，新建 | 工具栏「− % +」，以及点百分比后的三项 | 150 | 否 |
| `packages/features/reader/src/ui/go-to-page.tsx` | E1，新建 | 「第 N / M 页」变成输入；Esc 只取消输入 | 120 | 否。越界判定等决定 4 |
| `packages/features/reader/src/ui/history-controls.tsx` | E1，新建 | 工具栏 ← →。空的一侧置灰，不调用 ‹ | 80 | 否 |
| `packages/features/reader/src/ui/reader-keys.ts` | E1，新建 | 上表快捷键的监听与分发。不写比例、页码、历史规则 | 150 | 否 |
| `packages/features/reader/src/ui/remembered-zoom.ts` | E1，新建 | 本次进程内按文献 id 记住比例。进程退出即丢 | 80 | 否。不写盘，不改 `expose` |
| `packages/features/reader/src/ui/page-column.tsx` | E1，改 | 现 95 行。按 `viewportForZoom` 的结果设定栏宽，并在这一栏上接捏合 / Ctrl+滚轮 | 200 | 否 |
| `packages/features/reader/src/ui/pdf-session.ts` | E1，改 | 现 228 行。`paint` 接受调用方给的 scale。改动控制在 40 行以内 | 400 | 否 |
| `packages/features/reader/src/ui/reader-screen.tsx` | E1、E2 都只拼装 | 现 168 行。撤掉「Alt+← 一律回库」。‹ 始终回库 | 250 | 否 |
| `packages/features/reader/src/ui/copy.ts` | E1、E2 | 现 10 行。页码、越界「共 M 页」、按钮名。空态句子等决定 5 | 80 | 否 |
| `apps/desktop/src/renderer/reader.css` | E1、E2 | 现 87 行。新控件的排列。不改颜色和字号的定稿 | 200 | 否 |
| `apps/desktop/src/renderer/shell.tsx` | E1 | 现 81 行。继续听 `oi-return-library`。若决定 1 通过，再听新的菜单事件名 | 150 | 否 |
| `apps/desktop/src/renderer/shell-events.ts` | E1，仅当决定 1 通过 | 新菜单事件名的常量，与 `library-menu.ts` 用同一字符串 | 40 | 否 |
| `packages/features/reader/src/ui/view-mode-switch.tsx` | E2，新建 | 三个栏位按钮。默认原文 | 100 | 否 |
| `packages/features/reader/src/ui/view-mode-empty.tsx` | E2，新建 | 对照、译文的空态。不出现「开始翻译」，不发请求 | 80 | 句子等决定 5 |
| `apps/desktop/src/main/library-menu.ts` | 决定 1 通过才改 | 现 53 行。只追加上表菜单项，点击仍 `dispatchEvent`。不新 IPC，不改协议，不改 CSP | 120 | **是主进程。需 Wisdom 决定** |
| `apps/desktop/test/library-menu.test.ts` | 同上 | 现 53 行。断言新菜单项的标签和快捷键 | 120 | **随主进程。需 Wisdom 决定** |
| `packages/features/reader/src/domain/page-bounds.ts` | 决定 4 通过才改 | 现有 `clampPage` 不动。若获准，另加一个越界就返回空的函数，并经 `pure.ts` 导出 | 120 | **domain 属于 UI 改动不能碰的 core。需 Wisdom 决定** |

测试文件与被测文件配对，放在 `packages/features/reader/test/ui/` 和已有的 `apps/desktop/test/`。每个测试文件只测一个块。不把多项断言堆进一个测试文件。

下面这些本批明确不改：

- `packages/contracts/**`、`packages/features/reader/src/application/**`、`packages/features/reader/src/index.ts`、`packages/features/reader/src/pure.ts`（决定 4 若获准，`pure.ts` 只多一行导出，仍算那项决定，不预先改）
- `packages/features/library/src/**`
- `apps/desktop/src/main/` 里除决定 1 点名的 `library-menu.ts` 以外的文件，包括 `csp.ts`、协议注册、preload
- wasm、`blob:`、`.mjs`、`.wasm`
- DESIGN.md、`docs/design-principles.md`、`docs/design/**`
- `docs/arch/04-02.md` 第 20 行

`createSetZoom` 保持现状：测试仍覆盖它，桌面不调用它。见决定 2。

## 需 Wisdom 决定

没写进上表「才改」的文件，可以在本计划审查通过后按 E1、E2 做。下面五项不自己扩。

1. **显示菜单要改主进程。** 文件是 `apps/desktop/src/main/library-menu.ts` 和它的测试。推荐做法与现有「返回文献库」相同：菜单点击后在页面里 `dispatchEvent`，不新 IPC，不改 CSP，不改协议。代价：动主进程，和本批禁区相撞。不做的代价：快捷键和工具栏仍完成四项里除「菜单入口」以外的部分，③ 已批准的菜单入口缺失。置灰也不在这一步做。批次 D 已写明，置灰要让主进程知道当前是否在阅读屏，那是新的状态通道。本批不建这条通道。菜单项若获准添加，不在阅读屏时渲染进程丢掉事件。工具栏 ← → 的置灰只在渲染进程里做。
2. **按文档记住比例若要跨重启，就要改契约。** `reader.setZoom` 现在 `expose: false`。ARCH §9.1 写「按文档记住」。`session.save` 不在本批（ARCH §9.1 第 21 行：本批不实现）。推荐：只在渲染进程里按 id 记住，退出即丢，不把 `expose` 改成 true，不注册 `createSetZoom`，不改 contracts。代价：与「按文档记住」的字面不完全一致，同一次运行里再次打开同一份会恢复，重启不会。若要跨重启或要走 IPC，就得改 contracts 和主进程，本批停，另批。
3. **点一次 +/−、以及捏合 / Ctrl+滚轮的一步是多少，规格没写。** 只写了 25–400 和入口。不自定步进，也不自定一串停靠点。E1 在这一项有原话之前，不做 +/− 和滚轮；实际大小、适合宽度、适合页面不依赖步进，可以先做。
4. **转到页码的越界不能用 `clampPage`。** `clampPage` 会把越界页夹到 1 或末页，等于跳了，和 DESIGN §11.4「不跳、就地提示」相反。判断「这一页在不在 1..M」是规则，按 P7 不写在界面里。新函数要放进 `domain/page-bounds.ts` 并经 `pure.ts` 导出，而 UI 改动不能改 domain。推荐：允许 E1 只加这一个函数，`clampPage` 的行为一字不改。不获准，转到页码就不做越界提示，E1 停在页码输入以外的部分。
5. **对照和译文的空态用哪一句。** 拍板 1 只排除了「开始翻译」，没有指定句子。不自撰。E2 等这一句原话。空态不发翻译请求这一点不依赖句子，可以先在测试里断言没有请求。

## 不做

- 配置存储，以及 AC-11 的任务摘要 chip（拍板 3，另批，还没批实现）。
- 只画视口附近的页（#202）。本批仍按现有方式画已打开的页，只改比例。
- 侧栏开关、Aa、大纲、⋯、Range、`disableRange`。
- CSP、wasm、`blob:`、`.mjs`、协议注册。
- 鼠标侧键、触控板横滑、长按历史列表。
- PageUp、PageDown、Home、End、Space。
- 查找（⌘F / ⌘G / F3）。本批占用的是 ⌥⌘G 与 Ctrl+G，不注册 ⌘G。
- 改 DESIGN 第 156 行。默认原文只是 ③ 的临时行为。
- 把 `reader.setZoom` 的 `expose` 改成 true。见决定 2。

## 测试计划

实现 PR 才跑。本 PR 不新增测试，不跑 Vitest。

单测：

- 已有 `position-history.test.ts`、`zoom-bounds.test.ts` 保持通过。不改它们的断言。
- 决定 4 若获准：新函数的单测只断言越界返回空、界内返回原页，并断言 `clampPage` 仍夹页。
- `zoom-controls`、`go-to-page`、`history-controls`、`reader-keys`、`view-mode-switch`、`view-mode-empty` 各一个测试文件。覆盖：夹在 25 与 400、Enter 记入历史、Esc 不回库、← 空时不调用离开回调、‹ 在有历史时仍离开、默认原文、空态文案里没有「开始翻译」。
- 键位测试分两套输入：macOS 用 `metaKey`，Windows 用 `ctrlKey` / `altKey`，断言进了同一个动作。

Electron e2e（实现 PR，沿用现有桌面 e2e 的打开方式）：

- 打开一份小 PDF。按放大。断言窗口的缩放因子仍是 1，PDF 画布变大。
- `Ctrl+G` 输入一个页码，Enter 后该页进入视口，再 Alt+← 回到原页。历史用尽后再 Alt+←，回到文献库。
- 点 ‹ 时即使刚跳过页，也直接回文献库。
- ⌘2 / Ctrl+2 出现空态，网络或 IPC 上没有翻译请求。再 ⌘1 回到原文。

Windows 真机（实现 PR 合入前，由真机执行；本环境没有 Windows）：

- 截图：100%、一次放大后的 PDF 栏、25% 与 400% 不再变化、转到页码的输入、越界时的「共 M 页」、← → 置灰、对照空态、原文仍是默认。
- 每张图进该实现 PR 的 `docs/evidence/<PR号>/`。截图里要看得见工具栏和 PDF 栏，用来核对整窗没有一起放大。
- macOS 真机本环境也没有。e2e 的键位用 `metaKey` 覆盖 ⌘，不把没跑的 macOS 真机写成通过。

## 风险

- `Alt+←` 从「一律回库」改成「先历史」。批次 D 的 D-15 测试会失败，要在 E1 里改断言，不能留着旧行为。
- Ctrl+滚轮若没 `preventDefault`，Chromium 会放大整个界面。e2e 要断言窗口缩放因子不变。
- 高分屏的画布像素比只在 `pdf-session.ts` 里用已有画布尺寸，不在界面里另算一套比例。算错会只在真机上发糊。Windows 截图用来看，不代替单测。
- `Ctrl+G` 以后若要做查找，会和转到页码抢键。本批按已批的 ⌥⌘G / Ctrl+G 占用转到页码，不预留查找。
- 菜单置灰没做。获准添加菜单后，不在阅读屏时点击会被丢掉，菜单看起来仍可点。这是决定 1 里写明的代价。
- 比例不跨重启。若审查把 ARCH 的「按文档记住」理解成必须落盘，就停在决定 2，不偷偷改 `expose`。

## 自检

- 本 PR 的任务类型是纯文档，UI–core 交接说明写不适用。
- 不改 N-10、N-11 的文件，不改 CI。
- 台账在下一笔提交。本文件不回填自己的 SHA。
