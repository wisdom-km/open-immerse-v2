# PR #210 证据
本笔是 E1a（转到页码、位置历史、页码按钮的少量样式）。菜单整段在 E1c。整份 E1 的 1382 行草稿没有提交。没有放宽 pr-size，没有自定像素上限的 MB 数。

## 8 GB 真机测法

执行人是 Anvil，机器是 Wisdom 的 Windows 真机。本环境不跑。更高内存不能代替。没核实是 8 GB 就标未验证并停。打开同一份样本，阅读屏保持原文，每次从 100% 开始。分别停在 100%、200%、400%，再把显示缩放设为 200% 后停在 400%。每一档记下画布像素字节（宽 × 高 × 4，只算还在文档里的画布）、Windows 任务管理器里渲染进程的专用工作集、显示缩放、`devicePixelRatio`、可见页码和 canvas 张数。不写 MB 上限，不把像素上限调大后再交，测完交给 Wisdom。数字不在代码里猜。

## 本环境跑过的命令（Node 22.23.4，仓库根）

- `corepack pnpm exec vitest run packages/features/reader/test/ui/reader-screen.test.tsx packages/features/reader/test/ui/failed-read-leave.test.tsx packages/features/reader/test/ui/go-to-page.test.tsx packages/features/reader/test/ui/history-controls.test.tsx`：退出码 0。4 个文件，23 个通过。
- `GATE_BASE=origin/main corepack pnpm run check`：退出码 0。含 pr-size、lint、typecheck、typecheck:core。
