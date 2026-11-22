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

## 21:31 修正

这一节是 cbc11f8 之后的修正。上面的第一次全量超时、单独重跑和 cbc11f8 的 CI 六项成功都保留，不改记。机器仍是 Linux 6.12.113+ x86_64，Node v22.23.4，pnpm 10.34.9，工作目录 `/agent/repos/oi-gate-b-plan`。没有启动 Electron，没有安装缺的环境。时间取命令日志里的 Start at，时区是 UTC。

修前探针是临时测试，打在当时的门上，没有提交。`corepack pnpm exec vitest run apps/desktop/test/view-menu-gate-before.test.ts --reporter=verbose`。退出码 1。6 条里 4 条失败、2 条通过。Start at 13:40:01。

- R1 失败：传入译文事件后，实际派发仍是 `['oi-view-original']`，期望 `['oi-view-translation']`。重建调用已经是原文镜像。
- R2 resolve 失败：`expected 1 to be 2`。派发等待期间写下的 none 没有再替换。
- R2 reject 失败：click 返回 0，但最后一次替换仍是原文 radio，不是 none。
- R3 重建后置检查期间销毁失败：`expected 1 to be +0`。click 返回 1。
- R3 额外替换期间销毁通过：这条在 cbc11f8 上已经不派发。
- R4 单独让 dispatch 返回 rejected Promise 通过：click 返回 0，随后的 submit 仍能安装。当时的 13 条测试没有打到这个端口。

## corepack pnpm exec vitest run apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-mirror.test.ts apps/desktop/test/library-menu.test.ts

退出码 0。Start at 13:43:54。3 个文件，32 个测试通过。Type Errors: no errors。其中门 24 条：B3–B9 各一条，B10 原来的六条，加上请求目标、派发等待、销毁、dispatch 拒绝和只读观察。这不是全量。

## corepack pnpm run typecheck

退出码 0。`node tools/typecheck.mjs`。这是修正后的工作区，不是 cbc11f8。

## corepack pnpm exec eslint apps/desktop/src/main/view-menu-gate.ts apps/desktop/test/view-menu-gate.test.ts --max-warnings 0

退出码 0。在 prettier 写回这两个文件之后。

## corepack pnpm test

退出码 1。Start at 13:44:08，Duration 62.32s。197 个文件里 3 个失败、194 个通过。952 个测试里 4 个失败、945 个通过、3 个跳过。Type Errors: no errors。四条都是 `Test timed out in 5000ms`，不是断言失败：

- `tools/check-commits/message.test.ts`：`rejects a subject outside Conventional Commits`
- `tools/check-hotspots/hotspot.test.ts`：`prints a slots diff over 30 lines and ignores an unrelated file`
- `tools/check-hotspots/hotspot.test.ts`：`does not print an over hint for a named file at or under 30 lines`
- `tools/check-one-slice/slice.test.ts`：`rejects two feature slices and allows one slice ui plus core (G18)`

这次全量没有再超时 `tools/codegen/drift.test.ts`。不能把这次通过写成那条旧超时不存在，也不能把这 4 条写成全量通过。

3 个跳过没有印在这次全量摘要里。随后只跑 `tools/check-secrets/leak.test.ts --reporter=verbose`，退出码 0。9 条里 6 条通过、3 条跳过，原因都是 `GITLEAKS_BIN is unset`：

- `rejects a committed access key that lacks the oitest_ prefix (G9)`
- `allows a synthetic key that uses the oitest_ prefix (G9)`
- `rejects the same suffix when the prefix is nottest_ (G9)`

这能对上全量的 3 个跳过。没有安装 gitleaks。

定向重跑只覆盖上面三个超时文件：

`corepack pnpm exec vitest run tools/check-commits/message.test.ts tools/check-hotspots/hotspot.test.ts tools/check-one-slice/slice.test.ts`

退出码 0。Start at 13:45:26。3 个文件，6 个测试通过。Type Errors: no errors。这不是全量通过。
