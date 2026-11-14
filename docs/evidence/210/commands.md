# PR #210 证据

本笔是 E1a（转到页码、位置历史、页码按钮的少量样式）。菜单整段在 E1c。整份 E1 的 1382 行草稿没有提交。E1b 和 E1c 不在本笔。没有放宽 pr-size，没有自定像素上限的 MB 数。

## 8 GB 真机测法

执行人是 Anvil，机器是 Wisdom 的 Windows 真机。本环境不跑这一项。更高内存的机器不能代替。机器没有核实是 8 GB 就标未验证并停。

打开同一份样本 PDF，阅读屏保持原文。每次打开从 100% 开始，不沿用上一次的缩放。分别停在 100%、200%、400%。另外把显示缩放设为 200%，再停在 400%。

每一档记下：

- 当时画布像素字节合计（每张 canvas 的宽 × 高 × 4，只算还在文档里的画布）
- 本进程在任务管理器里的工作集（Tab working set）
- 显示缩放、`devicePixelRatio`、可见页码、同时存在的 canvas 张数

不写一个 MB 上限。不把单页像素上限调大后再交。测完把这些数交给 Wisdom 判断。

像素上限的具体数字计划写明等这次实测，不在代码里猜。

## 本环境跑过的命令

Node 22.23.4。工作目录是仓库根。退出码是这一轮实际跑出来的。

- `corepack pnpm exec vitest run packages/features/reader/test/ui/reader-screen.test.tsx packages/features/reader/test/ui/failed-read-leave.test.tsx packages/features/reader/test/ui/go-to-page.test.tsx packages/features/reader/test/ui/history-controls.test.tsx`：退出码 0。4 个文件，24 个测试通过。
- `GATE_BASE=origin/main corepack pnpm run check`：退出码 0。其中含 pr-size、lint、typecheck、typecheck:core。
