# PR #231 B 纯替换门命令

Node v22.23.4。pnpm 10.34.9。机器是 Linux 6.12.113+ x86_64，工作目录 `/agent/repos/oi-gate-b-plan`。这不是 Windows，不是用户真机，没有启动 Electron。

命令先在含门实现和本文件的工作区执行。随后在干净提交 `46778b2bf899b5dc3f6c1f3ad68e234f219759b6`、tree `1eba837bbbe196e71cad23edfde5d6c64e2655eb` 上重跑门测试和 `typecheck`，退出码都是 0。不把计划提交 `a661e134f5d819c194917fabc5e6b6dceac57f99` 的 CI 当成这次证明。本段只补上这两个已经重跑过的值。

`corepack pnpm install --frozen-lockfile` 退出码 0。`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`。锁文件没有改。提示只忽略了 `esbuild@0.28.2` 的 build script。

## corepack pnpm exec vitest run apps/desktop/test/view-menu-gate.test.ts

退出码 0。1 个文件，13 个测试通过。Vitest 报告 Type Errors: no errors。13 条是 B3、B4、B5、B6、B7、B8、B9 各一条，加上 B10 的忙、空闲成功、替换抛错、后置失败、重建期间换形状、Promise 拒绝。

## corepack pnpm run typecheck

退出码 0。`node tools/typecheck.mjs`。

## corepack pnpm exec vitest run apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-mirror.test.ts apps/desktop/test/library-menu.test.ts

退出码 0。3 个文件，21 个测试通过。Type Errors: no errors。这是门、已合形状和已合菜单模板，不启动 Electron。

## corepack pnpm exec eslint apps/desktop/src/main/view-menu-gate.ts apps/desktop/test/view-menu-gate.test.ts --max-warnings 0

退出码 0。

## corepack pnpm exec prettier --check apps/desktop/src/main/view-menu-gate.ts apps/desktop/test/view-menu-gate.test.ts

退出码 0。

## corepack pnpm test

第一次退出码 1。197 个文件里 3 个失败、194 个通过。941 个测试里 3 个失败、935 个通过、3 个跳过。失败的三条都是 5000ms 超时，不是断言失败：

- `tools/check-hotspots/hotspot.test.ts`：`does not print an over hint for a named file at or under 30 lines`
- `tools/check-one-slice/slice.test.ts`：`rejects two feature slices and allows one slice ui plus core (G18)`
- `tools/codegen/drift.test.ts`：`codegen leaves a diff when generated output drifted (G7)`

这三条不导入替换门。全量并行时单测超时。单独重跑：

`corepack pnpm exec vitest run tools/check-hotspots/hotspot.test.ts tools/check-one-slice/slice.test.ts tools/codegen/drift.test.ts`

退出码 0。3 个文件，6 个测试通过。Type Errors: no errors。

## corepack pnpm run lint

退出码 0。`eslint . --max-warnings 0`。

## 没有跑的命令

没有跑 `vitest.windows-native.config.ts`。没有操作真机。没有产品菜单画面、物理键或读屏。fake 的 `known` 不是 Windows 上已经打开的菜单。
