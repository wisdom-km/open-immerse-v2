# 替换当前位置

Node v22.23.4。工作目录是仓库根。基线 main `5c6b34ea6559463b8135112b808b741357205268`。没有改台账、界面、contracts，也没有加缩放档位。没有 Ready、合入或发版。

## corepack pnpm exec vitest run packages/features/reader/test/core/position-history.test.ts

退出码 0。1 个文件，10 通过，0 失败，0 跳过，类型错误 0。其中 6 个是 `replaceCurrent`。断言只看栈上的 current、back、forward。

```
Test Files  1 passed (1)
     Tests  10 passed (10)
Type Errors  no errors
```

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。测试文件和本文件都已暂存，工作区相对暂存区干净。1 个切片。
