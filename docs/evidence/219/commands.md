# PR #219 手势

Node v22.23.4。工作目录是仓库根，Playwright 在 `apps/desktop`。基线 `origin/main` `4e1d7ec64907147a56405a7bc37430f38f45cfb0`。测量跑在 `30f2c42a406924c4d88e42bbce395e14461ac390`，当时还没有本文件。`GATE_BASE=origin/main`。没有真机。没有 Ready、合入或发版。

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。`check-pr-size` 在 `30f2c42` 打印 516 non-generated lines。计划预算 ≤346，已超出。没有写 `G12:`，没有删测试。CI 硬上限 600。

## corepack pnpm test

退出码 0。192 个文件。878 通过，3 跳过，共 881。跳过在既有的 `tools/check-secrets/leak.test.ts`。本 PR 没有新增 skip。

## playwright test e2e/reader-nav.spec.ts

退出码 0。6 通过。Electron 45.2.1。`typeof webContents.setZoomMode` 是 `function`，没有调用。

Ctrl+滚轮样本：`deltaY` −100，`deltaMode` 0，`ctrlKey` true，`devicePixelRatio` 0.984375。`getZoomFactor()` 仍是 1。标题栏 `h1` 字号不变。普通滚轮不改百分比。控件显示 110%。

Ctrl+=、Ctrl+Shift+=、小键盘 +、小键盘 −、Ctrl+−：unchanged。同一环境 Ctrl+G 标注是「转到页码: menu click」。没有加 keydown。页码框聚焦后 Ctrl+0 与 Ctrl+− 标注 kept 110%。

监听之前、单独构建 `4e1d7ec` 的整窗捏合没有重测。监听之后窗口因子留在 1。没有改主进程。

## 真机

未跑。R-E4、NVDA 只读一次、触控板捏合与双指滚动、输入法开和关、显示缩放 200%、mac、8GB、F11、高对比度留在 PR 正文的待真机清单。
