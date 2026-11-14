# PR #211 证据

本笔是 E1b：按 `devicePixelRatio` 画页，只画视口 ±2，单页像素上限暂为 Infinity。Refs #174、#202。不含缩放、菜单、Ready、合入、发版。

## 8 GB 真机测法

执行人是 Anvil，机器是 Wisdom 的 Windows 真机。本环境不跑。更高内存不能代替。没核实是 8 GB 就标未验证并停。打开同一份样本，阅读屏保持原文，每次从 100% 开始。分别停在 100%、200%、400%，再把显示缩放设为 200% 后停在 400%。每一档记下画布像素字节（宽 × 高 × 4，只算还在文档里的画布）、Windows 任务管理器里渲染进程的专用工作集、显示缩放、`devicePixelRatio`、可见页码和 canvas 张数。不写 MB 上限，不把像素上限调大后再交。`PROVISIONAL_PAGE_PIXEL_CAP` 等这次实测之后才换成那个数。

## 本环境跑过的命令（Node 22.23.4，仓库根）

- `corepack pnpm exec vitest run packages/features/reader/test/ui/canvas-window.test.ts packages/features/reader/test/ui/render-scale.test.ts packages/features/reader/test/ui/page-column.test.tsx packages/features/reader/test/ui/pdf-session.test.ts packages/features/reader/test/ui/reader-screen.test.tsx packages/features/reader/test/ui/open-reading.test.ts packages/features/reader/test/ui/failed-read-leave.test.tsx`：退出码 0。7 个文件，52 个通过。
- `GATE_BASE=origin/main corepack pnpm run check`：退出码 0。含 pr-size、lint、typecheck、typecheck:core。pr-size 是 572。
