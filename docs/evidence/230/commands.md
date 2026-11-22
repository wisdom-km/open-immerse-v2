# PR #230 A 实施命令

Node v22.23.4。工作目录是仓库根。下面的退出码是本机这次跑出来的。Windows 作业的结果不写在本文件里冒充已经看到；CI 链接以提交后的 run 为准。

本机是 Linux。这里的 Electron 进程不是 Windows native，不是 mac，不是物理键、读屏或菜单截图，也不是现有 `dist/main` e2e。

## corepack pnpm install --frozen-lockfile

退出码 0。`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`。锁文件没有改。提示只忽略了 `esbuild@0.28.2` 的 build script。`electron@45.2.1` 的 `package.json` 没有 `scripts`。

## 安装前的 Electron 目录

`node_modules/.pnpm/electron@45.2.1/node_modules/electron/` 当时只有 `package.json`。没有 `path.txt`，没有 `dist/`。

## corepack pnpm exec vitest run apps/desktop/test/view-menu-mirror.test.ts apps/desktop/test/library-menu.test.ts

退出码 0。2 个文件，8 个测试通过，类型检查无错误。这是形状和静态菜单，不启动 Electron。

## corepack pnpm exec vitest run --config vitest.windows-native.config.ts

第一次退出码 0。1 个文件，1 个测试通过，耗时 3.52s。Vitest 打出来的输出里没有 Electron `index.js` 那句下载提示。这次输出不能用来判断 zip 有没有走网络。

这次之后：`path.txt` 的内容是 `electron`。`dist/electron` 存在。`dist/version` 是 `45.2.1`。`require("electron")` 返回 `.../electron/dist/electron`。

同一命令再跑一次，退出码 0，耗时 692ms。此时路径和 exe 已经在，这一次不必下载。

## corepack pnpm exec tsc --noEmit --project tsconfig.json --pretty false

退出码 0。

## node tools/check-file-size/check.mjs

退出码 0。

## node tools/check-deps/check.mjs

退出码 0。

## node tools/check-format/check.mjs

退出码 0。

## GATE_BASE=origin/main node tools/check-pr-size/check.mjs

在 `0f4209b5ab7e588b444ff7d0bc17e99ff53e3371` 上退出码 1。计数 659，高于 600。提交说明里没有行数例外理由。本 Draft 不补这个理由，失败保留。现行 CI 的 Check 步骤不读取 PR 正文。
