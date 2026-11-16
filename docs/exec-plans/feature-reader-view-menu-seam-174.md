# 执行计划

E2 菜单选中状态回传的最小 seam 设计与分批。本文件名是指定的 `feature-reader-view-menu-seam-174.md`。分支仍是 `feature/reader-view-modes-e2-plan-174`，与 [README](README.md) 的同名规则不同，按指定文件名留在原地。栏位与空态仍在 [E2 计划](feature-reader-view-modes-e2-174.md)。

本文件只写设计。2026-11-16 12:08 的原话是：「按推荐：先写 E2 菜单选中状态回传的最小 seam 设计与分批计划；本次不批准 IPC、contracts 或 main 编码，方案审查后再定实施范围，不 Ready、不合入、不发版」。台账见 [docs/approvals.md](../approvals.md)，来源是 [#174 6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822) 与 [PR #220 6907027779](https://github.com/wisdom-km/open-immerse-v2/pull/220#issuecomment-6907027779)。这不是编码批准。方案交 Forge 审查后，再请 Wisdom 定实施范围。

不改产品代码、测试、CI、PRD、ARCHITECTURE、RULES、DESIGN。不开 Ready，不合入，不发版。`c4b3fb9` 的 CI 只属于那个 tip。

本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

## 现状理解

- 现在已有的行为：`library-menu.ts` 的 `MenuItemSpec` 只有 label、event、accelerator。视图里「原文 / 对照 / 译文」是普通项，事件是 `oi-view-original`、`oi-view-bilingual`、`oi-view-translation`，加速键是 Cmd/Ctrl+1/2/3。它们和后退、页码、缩放项排在同一子菜单，中间没有分隔。`library-wiring.ts` 的 `installFileMenu` 只在启动时 `Menu.setApplicationMenu` 一次。`menuEntry` 的 click 只 `dispatchMenu`。`dispatchMenu` 取 `BrowserWindow.getAllWindows()[0]`，用 `executeJavaScript` 派发无载荷的 `Event`。`shell.tsx` 不听这三项。`packages/contracts/src/ipc/reader.ts` 写明不发明 `reader.setViewMode`，并且 `setZoom` 的 `expose` 是 false。`readerViewModeSchema` 的三个字面量是 `original`、`contrast`、`translation`。`open-session` 把会话里的 `viewMode` 写成 `original`。Electron 是 `apps/desktop/package.json` 的 45.2.1。
- 相关的节：[ARCHITECTURE](../../ARCHITECTURE.md) §2.4、§9、§9.1；[RULES](../../RULES.md) §3 第 3 条、§8.2 规则 3、N-09；[原则](../design-principles.md) P4；批次 E 计划菜单表「单选」。Electron 45 的 [MenuItem.checked](https://www.electronjs.org/docs/latest/api/menu-item) 写明：radio 被点击时把自己的 `checked` 打开，并关掉同一菜单里相邻项的 `checked`。`checked` 只用于 checkbox 或 radio。
- 还没做的部分：菜单勾。本文件不实现它。

## 所有权

阅读中的当前栏位只有一份，主人是将来 E2 的 `use-view-mode`，活在这一次 `ReaderScreen` 里。它用 `original`、`contrast`、`translation` 这三个已有字面量。初值 `original`。不写 `ReaderSession.viewMode`，不写存储，不调用 `reader.setZoom`。`oi-view-bilingual` 只是已有事件名，状态值用 `contrast`，不另造一套词。

main 只留菜单展示用的镜像：`none`、`original`、`contrast`、`translation`。`none` 表示没有打开的阅读屏，三个 radio 都不勾。镜像不驱动阅读屏，不回写会话，不进 `session.save`。ARCH §9.1 的 `session.save` 含「视图」，本批不实现，也不拿它存栏位。

## 比较

| 方案 | 做什么 | 为什么不选 |
| --- | --- | --- |
| 推荐：一条 invoke | 见下节。renderer 在栏位提交后上报。main 只按接受的上报改勾 | 工具栏、空态链接和菜单都能改同一份栏位，只有上报能覆盖这三处 |
| 只让 `executeJavaScript` 回传结果 | click 里问 renderer 这次命令有没有生效 | 工具栏和「切到原文」链接不经过 main。菜单会停在旧勾 |
| `reader.setViewMode` 或改会话 | 把栏位写进 reader 契约或 `ReaderSession` | 契约已禁止这个名字。会话里的 `viewMode` 是打开时的 `original`，不是菜单镜像 |
| main 再把镜像推回 renderer | 第二份状态回写 | 和上报对撞，形成回环 |

不新造菜单，不用自绘勾。不把缩放项改成 radio，不改缩放快捷键，不做文献库置灰。6-3 A 仍是：文献库里这三项不置灰，点了不改栏位。

## 推荐

新增一条暴露的 invoke，通道名 `shell.reportViewMenu`。preload 由描述符生成，出现在 `window.oi.shell.reportViewMenu`。renderer 不直接碰 `ipcRenderer`。reader 包不写通道名：`ReaderScreen` 用回调把当前栏位交给 `shell.tsx`，由 shell 调用。

请求只有两个字段，多余字段拒绝：`mode` 是 `none`、`original`、`contrast`、`translation` 之一；`generation` 是大于等于 1 的整数。响应只回接受后的 `mode`。没有文档 id、标题、页码、缩放、文案、路径。`bilingual`、`对照`、`dual` 都是坏载荷。

幂等标记为 false。代际更旧时返回已有的 `rejected`，不新造错误码。形状不对用已有的 `invalid_payload`。发送方不对用已有的 `sender_rejected`。发送方沿用 `isAppSender`：只要本应用窗口、主 frame、`oi-app:`。不放宽。传输是 invoke，不建订阅，所以没有单独的解除订阅。窗口关掉时丢掉该 `webContents.id` 的镜像和代际。

菜单是进程级的一份。产品是单窗口。上报的发送方必须是当前这一个窗口。窗口数不是 1，或发送方不是这个窗口时，返回 `rejected`，不改勾。现在的 `dispatchMenu` 仍取第一个窗口；实施时不要为多窗口改架构。

main 按 `webContents.id` 记住最后接受的代际。新上报的代际必须更大。相同或更小的代际是 `rejected`，勾保持上次接受的镜像。shell 侧同一时刻只飞一次上报；更新的栏位等这次回来，再只发最新的那次。main 不把 mode 发回 renderer。click 不调用这条 invoke。这样没有回环。

`handler_threw` 已是可重试。shell 对同一次栏位最多再发一次。再失败就停，勾留在上次接受的镜像，阅读屏不回滚。`invalid_payload` 不重试。

## 原生 radio 与失败时的勾

三个栏位项改成 Electron `type: 'radio'`，并且仍然相邻。后退、页码、缩放保持普通项，避免被算进相邻 radio。`enabled` 不动，文献库里也不置灰。

Electron 文档写明：点击 radio 会先勾上它，并清掉同一菜单里相邻项。文档没有写 click 回调里再改 `checked` 是否赶在菜单关闭前画完。这点要在锁定的 45.2.1 上核实；核实不了就停，不改成自绘勾。

click 回调的第一件事，是按最后接受的镜像把三个 radio 写回去，抵消这次自动勾选。然后才派发已有事件。回调返回时，勾仍等于镜像，不等于刚点的那一项。之后只有被接受的上报才能改勾。

命令没人处理时（文献库、阅读屏还没绑上）不会上报。自动勾被写回，勾保持原镜像。文献库的镜像是 `none`，三项都不勾。阅读屏里上报失败时，界面栏位已经变了，菜单可能暂时还是旧勾；下一次成功的上报用更大的代际盖过。不把菜单失败写回栏位。

`e2e` 的 `clickMenu` 是在主进程里直接调用 `item.click`。它不是系统菜单点击，也不是物理键。Box 同样不能冒充。Ctrl / ⌘+1/2/3 仍只走已有 accelerator，accelerator 会进同一个 click。物理键留 Windows 真机。

## 生命周期顺序

1. 进程启动：建菜单，三项 radio 的 `checked` 都是 false。镜像 `none`，代际 0。
2. 打开文献：`ReaderScreen` 挂上，栏位初值 `original`。先改主人，再上报 `original`。加载骨架和错误页期间也报这个栏位。空态句仍只出现在能画 PDF 的成功支，沿 E2。
3. 工具栏、空态链接、菜单或加速键改栏位：先改主人，代际加一，再上报。菜单路径是 click 先写回旧镜像，事件进 renderer，主人变更后再上报。
4. 换文献：同一屏上主人回到 `original`，再上报 `original`。不先上报上一篇的栏位。
5. 离开阅读屏：先上报 `none`，再卸下。三项都不勾。不置灰。
6. 再次打开：新的一次会话，又是 `original`。不恢复上次的对照或译文。
7. 飞行中的旧代际后到：main 返回 `rejected`，不覆盖更新的勾。

对照和译文仍共用这一次会话。不丢页码、历史、缩放，不重新打开文档，不复制 `PageColumn`。6-1 A 的空态文案不变。R-E13 仍未验证。

## 分批

口径见 [docs/arch/06.md](../arch/06.md)。`check-pr-size` 硬线是非生成新增加删除 600。只改 `packages/contracts/` 时硬线是 200。346 是估算 × 1.73 ≤ 600 的估算门槛。估算超过 346 就重算拆开，不写 G12，不删测试。实际超过 600 才是门禁失败。

S1 必须带上 codegen 改写的 `oi.generated.ts` 和 `registry.generated.ts`，否则 G7（`pnpm run codegen` 后 `git diff --exit-code`）失败。因此 S1 不是「只有 contracts」的 200 行档。生成物禁止手改（N-09）。这两份生成物现在不在 pr-size 的排除名单里，行数要算进 600。

| PR | 目标 | 依赖 | 估算 | ×1.73 |
| --- | --- | --- | --- | --- |
| S1 | 只增加描述符、导出、契约测试，并提交生成物 | 无。先合入 | 150 | 260 |
| S2 | main 注册处理函数，三个菜单项改为 radio，镜像与 click 写回 | S1 已合入。不改 renderer | 170 | 294 |
| S3 | shell 上报。reader 只加回调，不在 reader 里写通道名 | S2 已合入，且 E2 的栏位主人已在 main 上 | 110 | 190 |

S1 文件：`packages/contracts/src/ipc/shell.ts` 新建约 55 行；`packages/contracts/src/index.ts` 约 12 行；`packages/contracts/test/ipc-shell.test.ts` 新建约 70 行；两份生成物合计约 13 行。不注册 handler。此时调用会走到现有的「handler missing」，变成 `handler_threw`。S3 不得早于 S2。

S2 文件：`library-menu.ts` 约 25 行，只给三项加 radio；新建 `apps/desktop/src/main/view-menu-mirror.ts` 约 70 行，只做镜像、代际和写回；`library-wiring.ts` 约 35 行，现 253 行，改完约 288，低于普通文件建议 400；`library-menu.test.ts` 约 20 行；镜像的纯函数测试约 20 行。不改 `enabled`，不改加速键，不改事件名，不改缩放项的 type。

S3 文件：`shell.tsx` 约 35 行；`reader-screen.tsx` 或 `use-view-mode.ts` 的回调约 15 行；两边的行为测试约 60 行。不把上报塞进 E2-1 的 338 行估算。E2-1 仍只订阅已有事件。

### S1 验收

描述符的通道、expose、invoke、幂等 false、四个 mode、代际、多余字段拒绝，都由契约测试钉住。生成物含 `shell.reportViewMenu`，且与描述符一致。没有 main 行为变化。坏载荷测试在契约层，不启动 Electron。

### S2 验收

处理函数：合法上报改镜像；坏 mode、多余字段、代际不增加、第二个窗口，分别是 `invalid_payload` 或 `rejected`；非 `oi-app:` 主 frame 是 `sender_rejected`。菜单模板里只有原文、对照、译文是 radio，缩放不是。在 Electron 45.2.1 上建真实菜单：点「对照」后，回调返回前勾回到旧镜像；随后接受 `contrast` 才只勾对照。若相邻规则把「放大」卷进去，停。不测物理键。

### S3 验收

打开后菜单勾原文。工具栏改对照、译文、再回原文，勾跟着走，各一次上报。换文献后勾原文。回文献库后三项都不勾，项仍可点。加载和错误页不把勾清成 `none`。旧代际后到不改勾。飞行中连点只留下最后一次。不写 `ReaderSession`。不发翻译请求。页码、历史、缩放不变。

e2e 只用 `clickMenu` 看命令能进阅读屏。另有一条 Electron 内读 `checked` 的断言，标明不是物理键。Windows 真机另记：系统菜单里点三项，以及物理 Ctrl+1/2/3。mac 没有设备就标未验证。Box 不代替这张清单。R-E13 不在这三笔里测。

## 将来要另批的实施范围

方案审查通过之后，Wisdom 若批准实施，最小范围只到下面这些文件。批准里要写明批的是 S1、S2、S3 的哪几笔。没有写到的笔不开工。

- S1：`packages/contracts/src/ipc/shell.ts`、`packages/contracts/src/index.ts`、`packages/contracts/test/ipc-shell.test.ts`，以及 codegen 产出的 `apps/desktop/src/preload/oi.generated.ts`、`apps/desktop/src/main/ipc/registry.generated.ts`。不手改生成物。
- S2：`apps/desktop/src/main/library-menu.ts`、`apps/desktop/src/main/library-wiring.ts`、新建 `apps/desktop/src/main/view-menu-mirror.ts`，以及对应测试。这是 main 编码，本次未批。
- S3：`apps/desktop/src/renderer/shell.tsx`，reader 的 UI 回调和测试。不改 `packages/features/reader/src/domain`、`application`、`index.ts`、`pure.ts`，不改 `contracts/src/ipc/reader.ts`。

不批：preload 手写、CSP、协议、`reader.setViewMode`、缩放菜单、文献库置灰、持久化、ARCH 正文。若实施时要在 ARCH §9.1 补一句 shell 通道，那是同一次实施 PR 里的规格同步，不在本次设计批准里先改。

## 计划 / 实际

| 步骤 | 计划 | 实际 | 证据 |
| --- | --- | --- | --- |
| 1 | 本 PR 只交本文件、E2 计划里的关联和停点、台账 |  |  |
| 2 | Forge 审查本设计。通过前不写 S1 |  |  |
| 3 | Wisdom 另批实施范围之后，从当时的 main 开 S1，Draft |  |  |

## 决策记录

| 决定 | 理由 | 日期（Asia/Shanghai） | 谁定的 |
| --- | --- | --- | --- |
| 先写本设计，不编码 | 原话见文首 | 2026-11-16 12:08 | Wisdom，[6907026822](https://github.com/wisdom-km/open-immerse-v2/issues/174#issuecomment-6907026822) |
| 推荐一条 `shell.reportViewMenu` | 菜单 click 的回传盖不住工具栏和链接。不新增第二条通道 | 2026-11-16 | 本设计的推荐，不是实施批准 |

## 自检

- [x] 影响 arch / prd 吗？不影响。未改 arch / prd。

## 交接

三笔都从当时的 main 另开分支，不从本计划分支写代码。先完整读 `PRD.md`、`ARCHITECTURE.md`、`RULES.md`、`DESIGN.md`、`docs/design-principles.md` 和本文件。PR 先开 Draft。本任务受 UI 与业务核心解耦约束：ARCHITECTURE.md §2.1 与 RULES.md §8。改 UI 不得改变核心行为，也不得让核心测试失败；seam 不够用时先停下来说明缺什么。

S1 的任务类型是 seam 变更。涉及切片：无 feature 切片；契约文件是新建的 `contracts/src/ipc/shell.ts`。只做描述符、导出、契约测试和 codegen 生成物。不注册 handler，不改菜单。估算 150。坏载荷留在契约测试。

S2 的任务类型是 seam 变更里的 main 接线。涉及 desktop main。依赖 S1 已合入。只做 radio、镜像、代际、click 写回和 handler。不改 renderer，不置灰，不改缩放项。先在 Electron 45.2.1 上核实相邻 radio。估算 170。

S3 的任务类型是 UI 改动。涉及切片：reader 的 `src/ui`，加上 desktop renderer。依赖 S2 已合入，并且 E2 栏位主人已在 main。shell 上报，reader 只提供回调。不改 core。对照 / 译文仍共用会话。估算 110。R-E13 保持未验证。物理键不写成 e2e 已覆盖。
