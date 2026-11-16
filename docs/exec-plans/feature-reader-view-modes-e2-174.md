# 执行计划

E2，阅读屏栏位分段和已批空态。基线是 main `dc35b82bb2682f83f87ef5af268975a9dba5dacc`。唯一 parent 是 `4e1d7ec64907147a56405a7bc37430f38f45cfb0`，tree 是 `541b99575dc2446ee057b3104a2e2c887046ca0e`。2026-11-16 已再核对 `origin/main` 仍是这个 SHA。若审查时 main 已前移，实现从当时的 main 另开，本文件不改写成新基线。

本文件名是用户指定的 `feature-reader-view-modes-e2-174.md`。本 PR 的分支是 `feature/reader-view-modes-e2-plan-174`，只交计划和台账。[docs/exec-plans/README.md](README.md) 写文件名与分支同名。这里按指定文件名留在原地。

本 PR 不写产品代码，不改测试，不改 CI，不改 CSP，不改 PRD、ARCHITECTURE、RULES、DESIGN 正文。不开 Ready，不合入，不发版。Forge 对 `1e7e210` 的审查是 PASS 带 nits，不是实现放行。n1–n3 只改本文件的措辞。2026-11-16 12:08 只批准另写菜单勾选的最小 seam 设计，不批准 IPC、contracts 或 main 编码。设计在 [feature-reader-view-menu-seam-174.md](feature-reader-view-menu-seam-174.md)。产品代码仍不写。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 原则通过，实现未验证

Loom 2026-11-16 的原则复核结论是：通过，沿用已批准的 E2，不增加新设计。依据是本轮读过的 Loom 附件。这不是实现验收，也不是测试或真机通过。台账不新增行：这次没有新的 Wisdom 原话，复核结论不算新批准。

上一稿把「菜单不加勾选」写成计划选用。该句收回。菜单单选勾仍是已有要求。当前缺 checked 模型和 renderer→main 回传。本计划不删这项，也不写回传接线。编码路径仍不代选，见「菜单单选勾」。

| 结论 | 范围 |
| --- | --- |
| 原则复核通过 | H1–H12 沿用已批规格。不改默认原文，不重问空态文案，不新定栏宽、拖拽或色板 |
| 实现未验证 | 仓库里还没有 E2 的产品代码。下表 E2-01–E2-09 都未执行。读屏、物理键盘、高对比、mac、R-E13 都未测 |
| 勾选设计已另写 | 12:08 只批准写设计。编码未批。要求还在，不擅自加 IPC |

## 现状理解

- 现在已有的行为：缩放 2a / 2b 已合入。打开 PDF 进入阅读屏，画原文页。视图菜单已有「原文」「对照」「译文」和 Ctrl / ⌘+1/2/3，点击只 `dispatchEvent`。`shell.tsx` 不听这三项，所以快捷键现在不会切栏位。工具栏没有栏位分段。没有空态句。一次打开只有一份 `ReaderScreen`：session、历史和 zoom 都在它的上层。`PageColumn` 只有一份。`open-session` 把 `viewMode` 写成 `original`。契约写明不发明 `reader.setViewMode`。R-E13 未验证。
- 相关的节：[批次 E 计划](feature-reader-nav-zoom-174.md) 的栏位行、验收第 1 条、菜单表、G-7、空态接缝、R-E6；[DESIGN.md](../../DESIGN.md) §4.1、§11.4；[docs/design-principles.md](../design-principles.md) P4、P5、P7 与 §4；[ARCHITECTURE.md](../../ARCHITECTURE.md) §2.1、§6。临时默认原文来自 1A，台账 2026-11-05 21:01，[评论 6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956)。6-1 A 只定空态文案。不记住栏位是 G-7。这两条覆盖 DESIGN 第 156 行的默认「对照」和 §11.4 的恢复视图。不改 DESIGN 正文（N-10）。
- 还没做的部分：栏位分段、已批空态、把已有三个事件接到同一次阅读会话。不接翻译，不改画页比例。

## 目标

同一次打开、同一份阅读会话里，可以在原文、对照、译文之间切换。默认原文。离开后再打开，仍是原文，不记住栏位。对照是左栏现有原文、右栏空态，只把原文容器变窄，不自动适合宽度。译文是整个主区空态，PDF 隐藏但不另开文档。回到原文时页码、位置历史和缩放百分比都还在。空态句子是「本阶段暂不提供译文，请先阅读原文。」Windows 链接文字是「切到原文（Ctrl+1）」，mac 是「切到原文（⌘1）」。没有「开始翻译」，没有「去设置」。0 个主按钮。不发翻译请求。

## 已批来源

| 决定 | 原话与范围 | 出处 |
| --- | --- | --- |
| 1A | 「1A ³默认原文（临时）…M4 再恢复对照…不改 DESIGN 正文」。对照 / 译文可切，是诚实空态，不出「开始翻译」 | 台账 2026-11-05 21:01，[6658666956](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6658666956) |
| 6-1 A | 「6-1 按推荐 A：空态文案「本阶段暂不提供译文，请先阅读原文。」加「切到原文（Ctrl+1）」链接，mac 显示 ⌘1」 | 台账 2026-11-14 14:13，[6872935563](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6872935563) |
| 6-3 A | 文献库里这几项不置灰，点了不起作用。「主进程知道当前界面」挂进 M2 退出格，本批不做 | 同一条 |
| 菜单单选 | 批次 E 计划菜单表：视图 › 原文 / 对照 / 译文，「单选。对照和译文是空态」 | [批次 E 计划](feature-reader-nav-zoom-174.md)。这是已有要求，不是本轮新设计 |
| 栏位不记住 | G-7。没有 `setViewMode`。每次打开原文 | 批次 E 计划 |
| 空态接缝 | `view-mode-empty-copy` 放 6-1 A。`view-mode-empty-degrade` 本批没有文字 | 批次 E 计划。降级句等 E2 合入后由 PR #205 第 3 笔再填 |
| 先做 E2 | 「按推荐：R-E13 记为未验证遗留，先做 E2；有真 8GB 机器后在当时的 main 上补测」 | 2026-11-16 11:08，[6906182172](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6906182172) |

## H1–H12

这些是 Loom 复核写明的硬约束。本计划沿用，不另加产品行为。

| ID | 硬约束 | 本计划怎么落 |
| --- | --- | --- |
| H1 | 只做栏位分段和已批空态。不碰画页比例，不请求翻译，不接服务或存储 | 排除项不变 |
| H2 | 顺序是原文、对照、译文。`radiogroup` 名称「栏位」。选中始终只有一个 | 组容器的角色是 `radiogroup`，可访问名称是「栏位」。`<fieldset>` 默认角色是 `group`，不把 `group` 叫成 `radiogroup` |
| H3 | 放在标题栏右侧、空 chip 的右边。不改标题左区，不加侧栏或 Aa | `ReaderBar` 末尾，chip 之后 |
| H4 | 每次打开默认原文，不持久化 viewMode。不改 DESIGN 终态默认 | `use-view-mode` 只活在这次打开。文档 id 变了就回到原文 |
| H5 | 原文是现有 PDF。对照是左 PDF、右空态。译文是主内容空态。回原文页不变 | 见「同一阅读会话」 |
| H6 | 空态逐字使用批准句。Windows「切到原文（Ctrl+1）」，mac「切到原文（⌘1）」。0 个主按钮 | `view-mode-empty.tsx`。linux 沿用 Windows 那一句 |
| H7 | Ctrl / ⌘+1/2/3、工具栏、菜单、返回链接共用一份状态。全局快捷键只走已有菜单 accelerator | `shell.tsx` 订阅已有事件。不另写 renderer 全局 `keydown` |
| H8 | 切换不入历史、不改页码、不主动写回。不能靠隐藏或重建阅读器把页码、历史、缩放复位 | 不卸载 `ReaderScreen`，不复制 `PageColumn`，不重新 `openDocument` |
| H9 | 键盘可达。Tab 顺序跟视觉一致。焦点至少 2px。目标至少 24×24。选中不只靠颜色 | 原生 radio 的 checked。焦点环用现有 `--oi-reader-focus`。高对比未测，不写 PASS |
| H10 | `view-mode-empty-degrade` 留着，本批为空。不写 AC-11 降级句 | 调用点不传降级句 |
| H11 | 只改 UI。不改 domain、application、`index.ts`、`pure.ts`、contracts。seam 不够就停 | 勾选回传属于 seam 不够，见下节，本轮停 |
| H12 | 没有 Ready、合入、发版授权。R-E13 保持未验证 | 本 PR 是 Draft。不用 32GB 或限制内存代替真 8GB |

## 代码位置（dc35b82）

| 位置 | 现在 | E2 怎么用 |
| --- | --- | --- |
| `packages/features/reader/src/ui/reader-screen.tsx` | 258 行。`ReaderScreen` 第 28–105 行，78 行。session、历史、zoom 在这一层。`ReaderBar` 第 134 行是 `header`，不是 toolbar | 只拼装。栏位状态和这一层的 session 并列，不换成新的 key |
| `packages/features/reader/src/ui/page-column.tsx` | 一份 `PageColumn`。`frameStyle` 是 `box.width * zoom` 与 `box.height * zoom`。`Restore` 在挂载时 `scrollIntoView` | 不复制第二份。切栏位不让 `Restore` 再跑 |
| `packages/features/reader/src/ui/zoom-controls.tsx` | `keepClosed` 在缩放 `<select>` 上拦截 ArrowUp/Down/Left/Right、Home、End、PageUp、PageDown 这 8 个键 | 栏位组不复制这个函数 |
| `packages/features/reader/src/ui/copy.ts` | 18 行 | 只加 6-1 A 的句子和两句链接文字 |
| `packages/features/reader/src/ui/use-bound-nav.ts` | 69 行 | 展开写法，把三个栏位命令并进 `ReaderNav` |
| `apps/desktop/src/renderer/shell.tsx` | 147 行。`MenuNav` 没有栏位命令。订阅列表没有这三项 | 只订阅已有事件 |
| `apps/desktop/src/renderer/shell-events.ts` | 已有三个事件名 | 不改 |
| `apps/desktop/src/renderer/reader.css` | 136 行。已有 `--oi-reader-focus`、`--oi-focus-width`、`--oi-focus-offset`，以及 `Canvas` / `CanvasText` 后备。`.oi-reader-live` 用 1px 裁剪 | 并排和焦点沿用这些。仓库里没有 `--oi-reader-link`、`--oi-reader-ink-2`，不引用、不新造 |
| `apps/desktop/src/main/library-menu.ts` | `MenuItemSpec` 只有 label、event、accelerator。第 25–27 行已有三项和加速键 | 勾选路径未定之前不改 |
| `apps/desktop/src/main/library-wiring.ts` | `installFileMenu` 启动时建一次菜单。`menuEntry` 只写 label、accelerator、click | 没有 checked，也没有按栏位重建 |
| `packages/contracts/src/ipc/reader.ts` | 第 22 行：不发明 `reader.setViewMode` | 不改。勾选也不借用这个名字 |
| `packages/features/reader/test/ui/reader-screen.test.tsx` | 736 行。`barSlots()` 期望 `gap zoom-controls chip`。第 65 行负向匹配不动 | 槽位改成 chip 后面还有栏位组 |
| `apps/desktop/e2e/reader-nav.spec.ts` | 287 行。已有 `clickMenu` | 菜单点击走这里。加速键不走这里 |
| `apps/desktop/test/library-menu.test.ts` | 100 行。断言标签和加速键 | 勾选未定之前不改 |

## 模块边界

任务类型是 UI 改动。切片是 reader 的 `src/ui`，加上 desktop 的 renderer。core 不动。

栏位状态放在新建的 `use-view-mode.ts`，和 session、历史、zoom 并列，同属这一次 `ReaderScreen`。初值原文。不写 `localStorage` / `sessionStorage`，不写回 `ReaderSession.viewMode`，不调用 IPC。domain 里的 `viewMode` 保持打开时的 `original`。

三个新文件：

- `view-mode-switch.tsx`：栏位分段。放在 chip 右边。
- `view-mode-empty.tsx`：6-1 A 的句子、返回原文的文字链接、空的降级插入点。
- `view-mode-panes.tsx`：按栏位安排这一份 `PageColumn` 和空态。不创建第二份阅读会话。

分段用原生 `<input type="radio">`，同一 `name`。三个 radio 的可访问名称是「原文」「对照」「译文」。选中用原生 `checked`。组容器的角色必须是 `radiogroup`，可访问名称必须是「栏位」。`<fieldset>` 加上 `<legend>` 时，默认可访问角色是 `group`，不是 `radiogroup`。只断言有 `fieldset`，或有三个 `input`，不算满足 H2。实现可以保留 `fieldset`，但要显式加上 `role="radiogroup"`，并由 legend 或 `aria-label` 得到名称「栏位」。测试用 `getByRole('radiogroup', { name: '栏位' })` 找到这一组，再在组内用 `getByRole('radio', { name })` 找到三项。这是行为断言。组件留在现有 `header` 里，不加 `role="toolbar"`。这一组的 ← / → / ↑ / ↓ 用浏览器自己的组内行为：移动并选中。不写全局 `keydown`，也不写第二套监听。不把 `zoom-controls.tsx` 的 `keepClosed` 搬过来。那 8 个键只继续作用在缩放 `<select>` 上。焦点在页码框、PDF 或别的文本控件里时，这一组不吞键。

自绘分段和 `role="toolbar"` 都不做。APG 里嵌在 toolbar 中的 radio，方向键只移动焦点、不改变选中。那和普通组不同。若以后要改成 toolbar，先停下来报告。

Ctrl / ⌘+1/2/3 只走已经注册的菜单加速键。`shell.tsx` 把三个已有事件转成命令，写法对齐 `zoomCommand`。reader 包不出现这三串事件字面值，也不订阅 window。不写第二套全局 `keydown`。页码框聚焦时这三键若被菜单抢走，只记录并停，不加监听去抢回来。不修已知的 Ctrl+0 / Ctrl+−。

空态不放 `role="status"`，不用 toast，不用对话框。返回入口不是主按钮，名称等于已批整句，点击只切回原文，不离开阅读屏。`view-mode-empty-degrade` 的节点在，文本为空。不写「未解析 / 去配置」。

linux 的链接文字用「切到原文（Ctrl+1）」。分叉沿用缩放 tooltip 已有的 mac / 非 mac。

## 同一阅读会话

三个栏位共用现在这一份 session、这一份位置历史、这一份 zoom。切栏位不是重开文件。

- 不改变 `ReaderScreen` 的文档 id，不用栏位当 React key，不卸载 `ReaderScreen`。
- `PageColumn` 只保留现有这一份，传现在的 `columnRef`、`paint`、`boxes`、`zoom`、`releasePixels`。不复制第二份来凑对照，不调用打开文档。
- 切栏位不调用历史的 jump / back，不改缩放百分比，不调用 `zoomFitWidth`、`fitWidthPercent` 或 `resolveZoomPercent`，不改 `frameStyle` 的公式，不改 dpr 和像素上限。
- 原文：这一份 `PageColumn` 按现在的方式占满主区。
- 对照：同一份 `PageColumn` 留在左边，空态在右边。容器变窄来自多了一个兄弟节点，空态按内容占位，原文栏用现有 flex 吃掉剩余空间。不新定百分比、不新定 38em、不加分隔条、不记住宽度。变窄不等于适合宽度。
- 译文：主区看见空态。这一份 `PageColumn` 仍留在成功分支的树上，不卸载。卸载会让 `Restore` 再执行 `scrollIntoView`，绘制 effect 也会重跑。隐藏用 `inert` 移出 Tab 和读屏，视觉上不占主区，裁剪沿用 `.oi-reader-live` 已有的 1px 裁剪，不新造动画。切回原文或对照时去掉 `inert` 和裁剪，组件不重挂。
- 页码、历史和缩放的主人不变。测试钉住：切换前后页码文字、缩放百分比、后退状态不变，`writePage` 不因这次切换多出来。若缩容器或隐藏仍然发出 scroll，并因此写回另一页，就停。不改写回 seam，也不改成卸载再滚回。

## 加载、错误和焦点

加载中仍是现有骨架，出错仍是现有错误页。这两支不被栏位切换换成空态。菜单和快捷键可以改栏位状态，但不能把错误页变成「暂不提供译文」的假成功。空态只出现在现在已经能画出 PDF 的那一支。加载完成后，若栏位已经是对照或译文，再按该栏位显示；第一次挂上 `PageColumn` 仍是打开时的那一次，不是为了切栏位又挂一次。

焦点：

- 在分段里用指针或方向键切换后，焦点留在分段上。
- 不把焦点搬到空态正文。
- 全局快捷键切换时，不抢还在的控件。页码框、缩放选择、返回按钮若还在，焦点留在原地。
- 若焦点在即将隐藏的 PDF 子树里，或在即将移除的返回链接上，先落到仍然存在的对应 radio，再隐藏或移除。不落到 `body`。从空态链回原文时，落到「原文」radio。
- 不因此新增播报文案。读屏是否够用，留真机，不在本计划写成通过。

## 菜单单选勾

已批要求是菜单里原文 / 对照 / 译文为单选，并显示现在的快捷键。加速键和事件名已经在。勾选状态还没有模型，也没有从 renderer 回到 main 的接线。只在 `shell.tsx` 订阅事件，可以让点击、加速键和工具栏共用 renderer 里的一份栏位；菜单上的勾不会出现。本计划不把「单选勾」写成已完成，也不把它从要求里删掉。

dc35b82 上的缺口：

1. `MenuItemSpec` 没有 `type`，没有 `checked`。
2. `menuEntry` 的菜单项只有 label、accelerator、click。
3. `installFileMenu` 只在启动时 `Menu.setApplicationMenu` 一次。之后没有按当前栏位改写菜单。
4. 现有通道是 main 用 `executeJavaScript` 向 renderer 派发事件。没有反向通道把当前栏位送回 main。
5. `shell.tsx` 还没订阅这三项。

编码走甲还是走乙，仍不代选。

| 路径 | 内容 | 代价 |
| --- | --- | --- |
| 甲 | E2 只订阅已有三事件。菜单保持普通项，没有勾。要求保留，合入后记为未完成，不写成通过 | 不改 main，不改契约。已批「单选勾」仍未满足 |
| 乙 | 12:08 已批准把最小设计写到 [菜单 seam 计划](feature-reader-view-menu-seam-174.md)。本文件仍不写通道、载荷和权限。那份设计不是编码批准 | 不在这里实现，不改 main，不改契约，不改 IPC。不能叫 `reader.setViewMode`。沿 6-3 A，文献库里不置灰；置灰缺口本批不修 |

路径乙的设计已经另写。Forge 对 `8ac2c97` 的第五轮审查是 FAIL，只补 read 成功后的 submit，以及新快照先清旧 pending none。架构不换，编码仍未批。唯一顺序是 S1、S2a、S2b、S2c、E2-0、E2-1、E2-2、S3。E2 这三笔不写上报，也不等 S3。S3 才依赖本文件的栏位主人和 S2c 的生产 handler。S2b 之前菜单仍是今天的普通项。S2b 到 S3 之前是 none 形状的普通项，没有 radio 勾。两份计划都不写产品代码。文档代由渲染端按需读取，不另发布脚本。

## 行为

- 打开是原文。分段里「原文」为选中。主区是现在的原文栏。chip 右边才是这一组。
- 对照：左边仍是这一份原文栏，画页公式和缩放百分比不变，不调用适合宽度。右边是空态。
- 译文：主区是空态。这一份原文栏还在树上，但是 `inert` 且不占主区。
- `view-mode-empty-copy` 的文本等于「本阶段暂不提供译文，请先阅读原文。」链接名称在非 mac 等于「切到原文（Ctrl+1）」，在 mac 等于「切到原文（⌘1）」。没有「开始翻译」，没有「去设置」。主按钮数是 0。
- 点返回入口、菜单「原文」或 Ctrl+1 / ⌘1，回到原文。页码、历史、缩放百分比不变。`ReaderScreen` 不重建。
- 再打开同一篇或另一篇，都是原文。
- 文献库里三项仍不置灰。阅读屏卸下后，事件没有栏位可改。不另写「不在阅读屏就丢掉」。
- 不出现翻译请求。
- 方向键只在栏位组内改变选中。缩放选择框的 8 键拦截还在那个 `<select>` 上。

## 行数预算

口径见 [docs/arch/06.md](../arch/06.md)。`ReaderScreen` 现在 78 行，函数硬上限 80。实现的第一笔先把离开接线移出去，不改行为。`reader-screen.tsx` 现在 258 行，超过组件建议上限 250。抽出之后回到 250 以下，E2 只加拼装，停在 250。

`check-pr-size` 的实际硬线是非生成新增+删除超过 600。346 只是开工前的估算门槛：估算 × 1.73 ≤ 600，所以估算写到 346 以内。它不是 CI 硬线，也不是 Wisdom 批准的上限。估算超过 346 时，先重算并拆开，再决定要不要开工。这是主动重估。不把估算超过 346 写成 G12，也不为此请用户批准，不删已有测试。实际 diff 超过 600 才是门禁失败：停下，报 `git diff --numstat` 和拆分建议，仍不写 G12 放行，仍不删测试来凑 600。路径乙的设计不在下表里。本文件不把契约或 main 的行塞进 E2-1。

| PR | 装什么 | 估算 | ×1.73 |
| --- | --- | --- | --- |
| 本 PR | 本文件和台账。没有产品代码 | 文档 |  |
| E2-0 | 把离开接线移到 `use-reader-leave.ts`。行为不变 | 72 | 125 |
| E2-1 | 栏位状态、原生分段、空态、同一份 PageColumn 的显隐、已有菜单事件、并排样式、单测。不含勾选回传 | 338 | 585 |
| E2-2 | `clickMenu` 的 e2e、链接文字的第二支、shell 事件单测、`forced-colors` | 109 | 189 |

E2-0，合计 72。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `use-reader-leave.ts` 新建 | 36 | 36 | 不会 |
| `reader-screen.tsx` | 36 | 229 | `ReaderScreen` 降到 80 以下 |

E2-1，合计 338。338 × 1.73 = 585，低于实际硬线 600。346 减 338 还剩 8 行估算余量。估算合计超过 346 时重算并拆开，不把它当成 G12，也不当成必须请用户批准的硬线。焦点回落写在 `view-mode-panes.tsx` 的 40 行里，不另开文件；估算不够就重算，不挤占勾选通道，不删测试。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `use-view-mode.ts` 新建 | 36 | 36 | 不会 |
| `view-mode-switch.tsx` 新建 | 60 | 60 | 不会。不加 8 键拦截 |
| `view-mode-empty.tsx` 新建 | 40 | 40 | 不会 |
| `view-mode-panes.tsx` 新建 | 40 | 40 | 不创建第二份 PageColumn，不创建栏位状态 |
| `copy.ts` | 8 | 26 | 不会 |
| `reader-screen.tsx` | 10 | 239 | 停在 250 |
| `reader.css` | 22 | 158 | 不新造颜色，不引用未定义的 link token |
| `shell.tsx` | 14 | 161 | 只订阅已有事件。不改 main |
| `use-bound-nav.ts` | 8 | 77 | 展开写法 |
| `view-mode-switch.test.tsx` 新建 | 36 | 36 | 含组内方向键改变选中 |
| `view-mode-empty.test.tsx` 新建 | 32 | 32 | 不会 |
| `view-mode-panes.test.tsx` 新建 | 22 | 22 | 页码、缩放、历史不变 |
| `reader-screen.test.tsx` | 6 | 742 | 只改槽位断言。已超过建议上限 600。正文写明断言本来就在这个文件。不删测试 |
| 本文件「实际」列的回填 | 4 |  | 文档 |

E2-2，合计 109。只在 E2-1 合入之后另开。`forced-colors` 只给新控件补系统色继承，不把高对比写成已通过，也不重做旧控件。改显示设置仍要当时的单独授权。

| 文件 | 计入 | 改完大约 | 会不会超 |
| --- | --- | --- | --- |
| `reader-nav.spec.ts` | 45 | 332 | `clickMenu("对照")` 与 `clickMenu("原文")`。不在 CI 里按 Ctrl+1/2/3 |
| `reader.css` 的 `forced-colors` | 16 | 174 | 沿用已有焦点环 |
| 链接文字的 mac / 非 mac 第二支 | 24 |  | 放在空态测试 |
| shell 收到三个事件 | 20 |  | 卸下后再派发，栏位无处可改 |
| 本文件「实际」列的回填 | 4 |  | 文档 |

## 验收与测试

本 PR 不跑 Vitest。下表是以后要覆盖的断言，现在全部未执行。只断言行为，不读源码文本做断言。

| # | 断言 | 现在 |
| --- | --- | --- |
| E2-01 | 新开、重开、换文献都是原文。选中和主区一致。不落盘 viewMode | 未执行 |
| E2-02 | 对照左 PDF 右空态。译文主区空态。两句文字逐字正确。无「开始翻译」「去设置」。0 个主按钮 | 未执行 |
| E2-03 | 快捷键、分段、菜单点击、返回链接是同一份状态。一次输入只切一次。文献库里菜单无作用。加速键不写成 e2e 已覆盖 | 未执行 |
| E2-04 | `getByRole('radiogroup', { name: '栏位' })` 找到这一组，组内三个 `radio` 名称正确且只有一个 checked。不接受只断言 `fieldset` 或三个 `input`。方向键在组内改变选中。不复制缩放 select 的 8 键拦截。焦点不落到隐藏子树 | 未执行 |
| E2-05 | 页码、可见位置、历史、zoom 保持。不额外 `writePage`。不二次打开，不发翻译请求。不改画页尺寸公式。不自动适合宽度 | 未执行 |
| E2-06 | 加载和错误不被切栏位绕过。页码框或输入法里冲突就停。不加第二套全局 keydown | 未执行 |
| E2-07 | 200% 与高对比下名称、选中、焦点可辨，目标至少 24×24。改系统显示设置另要授权 | 未执行。不写 PASS |
| E2-08 | diff 只在约定的 UI 和测试里。core 和契约不动。勾选若走路径乙，不在这份 UI diff 里 | 未执行 |
| E2-09 | R-E13 保持未验证 | 未执行。不以本计划或 32GB 代填 |

真机沿用批次 E 的 R-E6。R-E11 的 mac ⌘1/2/3 没有设备就标未验证。物理键和 `clickMenu` 分开记。Narrator 或 NVDA 读组名、选中项和空态句；没有新的批准就不改系统里的读屏安装。

## 排除项

不改 PRD、ARCHITECTURE、RULES、DESIGN、`docs/design/**`。勾选编码未批准。seam 设计不写在本文件，不改 main、`library-menu.ts`、preload、IPC、contracts。不改 core、`pure.ts`、`library/src`、CSP。不加 wasm、`wasm-unsafe-eval`、`.mjs`、`blob:`、`bypassCSP`、协议注册、Range、`disableRange`、整份 PDF 的 IPC。不接翻译，不建 chip，不写降级句。不改画页比例，不自动适合宽度，不把栏位写入历史。不重建 `ReaderScreen`，不复制 `PageColumn`，不重新打开文档。不修页码框抢走 Ctrl+0 / Ctrl+−。不做 B7。沿 6-3 A，文献库里不置灰；置灰缺口本批不修。不持久化栏位。不改 Windows 或任何系统设置。不用 32GB 或限制内存给 R-E13 标 PASS。

## 停止点

- 12:08 不让 E2-0、E2-1、E2-2 或勾选编码开工。不改菜单模型，不加通道，也不把「单选勾」从要求里删掉。
- 勾选设计在菜单 seam 计划。审查通过后仍要 Wisdom 另定实施范围。本文件不写那份设计，E2-1 不写 IPC。
- 估算超过 346 时重算并拆开。这不是 G12，也不需要用户批准。实际非生成行超过 600 才按 `check-pr-size` 停下。两种情况都不删测试。
- `reader-screen.tsx` 超过 250，或任一函数超过 80，就停。这是文件和函数上限，与 346 无关。
- 缩容器或隐藏 PDF 若改写页码、历史或缩放，就停。
- 页码框焦点抢走 Ctrl+1/2/3 时停。不加第二套按键监听。
- 不把 R-E13、高对比、读屏、加速键 e2e 标成通过。

## 需要 Wisdom 决定

勾选设计已按 12:08 写到菜单 seam 计划。那不是编码批准。甲仍是勾选未完成；除非 Wisdom 明确同意延期勾选，否则甲不是完整验收。乙的实施范围等方案审查后再由他定。本文件不代批编码。这不是新的空态文案，也不是新的栏宽。

上一稿问过的对照比例和链接元素，本轮收回。比例没有已批数字，计划不新定，只缩容器。链接沿用已批「文字链接」和 0 个主按钮，不重问皮肤。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本 PR：计划与台账。不写产品代码 |  |  |
| 2 | 菜单 seam 的 S1、S2a、S2b、S2c 先合。E2-0 仍要另一次实现批准 |  | 现有 `reader-screen` 测试 |
| 3 | S2c 之后开 E2-0，再开 E2-1。只订阅已有事件，不写上报 |  | E2-01–E2-06 里能在单测钉住的部分。菜单仍是普通项，没有勾 |
| 4 | E2-1 合入后开 E2-2。e2e 只用 `clickMenu`。S3 在 E2-2 之后 |  | 加速键和 R-E6 另记 |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| R-E13 记为未验证遗留，先做 E2 | 原话见已批来源。不以 32GB 或限制内存代替 | 2026-11-16 11:08 | Wisdom，[6906182172](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6906182172) |
| 原则复核通过，不增加新设计 | Loom 附件。不是新批准，不是实现通过 | 2026-11-16 | Loom 复核。台账不新增行 |
| 收回「计划选用不加菜单勾」 | 上一稿把已有要求写成了不做。勾选缺的是 checked 和回传，不是授权消失 | 2026-11-16 | 本计划更正。路径仍待 Wisdom |
| 译文隐藏不卸载 PageColumn；对照不调用适合宽度 | 沿用 H5、H8 和现有 `Restore` 只在挂载时滚动。不是新布局比例 | 2026-11-16 | 计划落实已批约束，非业主新批准 |
| Forge 审查 `1e7e210` 为 PASS 带 n1–n3，并建议路径乙 | 建议只到「另写最小 seam 设计与分批计划」。不批准 IPC、契约或 main 编码。n1–n3 已改入本文件 | 2026-11-16 | Forge 排序，非业主决定 |
| 先写菜单勾选的最小 seam 设计 | 原话见菜单 seam 计划。不批准编码 | 2026-11-16 12:08 | Wisdom，[6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822) |
| 顺序定为 S1、S2a、S2b、S2c、E2-0、E2-1、E2-2、S3 | Forge 对 `fda2e57` FAIL。未完成 invoke 要有上限，pending 要在正常退出时执行，S2c 要注册进生产表 | 2026-11-16 | 计划按审查修正，不是新批准 |
| 第五轮只补两条转移 | Forge 对 `8ac2c97` FAIL。read 成功要接上 submit；新快照先清同阶段旧 pending none。不换架构 | 2026-11-16 | 计划按审查修正，不是新批准 |

## 实施交接

不要按本文件写勾选，也不要开工 E2-0。勾选设计在菜单 seam 计划，那份设计同样不是编码批准。

任务类型：UI 改动。涉及切片：reader 的 `src/ui`，desktop 的 renderer。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

从当时的 main 开工，不从本计划分支写产品代码。先读本文件的 H1–H12。临时默认原文来自 1A / 6658666956。6-1 A 只定空态文案。6-3 A 是文献库里不置灰，置灰缺口本批不修。E2-0 只移离开接线。E2-1 的组容器用 `getByRole('radiogroup', { name: '栏位' })` 能够找到，可访问名称是「栏位」。`<fieldset>` 的默认角色是 `group`，不能只靠 fieldset 充数。放在空 chip 右边。三个栏位共用同一 `ReaderScreen`、同一 session、同一历史、同一 zoom。对照只缩容器，不调用适合宽度。译文用 `inert` 隐藏这一份 `PageColumn`，不卸载、不复制、不重新打开文档。回到原文保留页码、历史和缩放。加载和错误页不被空态替换。焦点在即将消失的节点上时落到对应 radio。组内方向键用浏览器自己的 radio 行为，不复制 `keepClosed` 的 8 键拦截，不另写全局 `keydown`。Ctrl / ⌘+1/2/3 只订阅已有菜单事件。估算超过 346 就重算；实际非生成行超过 600 才是 `check-pr-size` 的停点。两种情况都不删测试，也不把 346 写成 G12。路径甲不改 main，并在验收里把菜单勾选写成未完成。路径乙不进入 E2-1。顺序是 S1、S2a、S2b、S2c、然后这三笔、最后 S3。R-E13 保持未验证。原则通过不等于实现通过。
