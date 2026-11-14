# 缩放档位

Node v22.23.4。工作目录是仓库根。基线 main `be2235f24c53a44bfb23749de8e73b7d50c72588`。没有改台账、contracts、expose、界面、main、protocol、CSP 或 library。没有 Ready、合入或发版。

## 实测来源

Anvil 报告 `/workspace/oi-qa/v2-zoom-steps/ANVIL.md`（Forge 盒子上的文件）。机器 DESKTOP-0GI64S8。Edge 157.0.4341.46，Chrome 157.0.8103.39。两边用键盘 Ctrl-/Ctrl= 逐档测，界面百分比和 devicePixelRatio 逐行 diff 都为 0。17 档：25、33、50、67、75、80、90、100、110、125、150、175、200、250、300、400、500。到两端后再按也不变。zip SHA256 `e7ea8017c1c3dff8194ea864d4b7eba868d43af6a86233ba732bc1f873a6c3db`。

本 PR 取其中落在 25–400 的 16 档。500 是按 6-2 A 截掉的。MIN/MAX 仍是 25/400，默认 100，不记住缩放。

还没核实：只测了键盘，菜单和气泡上的 −/+ 没逐档点。系统缩放不是 100% 时会不会变也没测。

## corepack pnpm exec vitest run packages/features/reader/test/core/zoom-bounds.test.ts packages/features/reader/test/core/position-history.test.ts

退出码 0。2 个文件，21 通过，0 失败，0 跳过，类型错误 0。断言只看返回的百分比，以及栈上的 current、back、forward。

```
Test Files  2 passed (2)
     Tests  21 passed (21)
Type Errors  no errors
```

## corepack pnpm test

退出码 0。184 个文件，823 通过，0 失败，3 跳过。3 个跳过是本机未设置 `GITLEAKS_BIN` 时已有的 G9 用例，不是这一笔新增的。

```
Test Files  184 passed (184)
     Tests  823 passed | 3 skipped (826)
Type Errors  no errors
```

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。1 个切片。`check-pr-size` 含本文件是 151 行。

## node tools/check-arch-graph/check.mjs

退出码 0。

```
arch-graph: undocumented 0
arch-graph: planned 12
arch-graph: unmapped 0
arch-graph: index 0
```
