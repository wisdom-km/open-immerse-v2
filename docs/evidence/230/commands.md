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

## CI run 44995561367

head `fd2263c328fb3f68a0a8242d1078336e5f5f8ab4`。https://github.com/wisdom-km/open-immerse-v2/actions/runs/44995561367

`node` 的 Check 步骤失败，计数 663。该作业没有跑到后面的 Unit tests。这不是 Ubuntu 单测失败，是单测没跑到。

`desktop-e2e-windows` 通过。Desktop unit tests：26 个文件，126 个测试通过。随后 Windows native view menu 跑的是 `corepack pnpm exec vitest run --config vitest.windows-native.config.ts`。该测试的 stdout 出现 `Downloading Electron binary...`。1 个测试通过，6382ms。这句提示不能写成 zip 一定走了网络，日志也没有写出安装结束时的 path.txt 或 exe。测试能启动，说明当时进程拿到了可用二进制。Playwright 随后 32 passed，那是现有 `dist/main` e2e，不是这次 native。

`docs-report`、`python-worker`、`worker-health-macos`、`worker-health-windows` 通过。

## CI run 44995789348

head 仍是上面的 `fd2263c` 之后的证据提交。https://github.com/wisdom-km/open-immerse-v2/actions/runs/44995789348

`desktop-e2e-windows` 失败。同一测试 stdout 先打出四行形状，字段与 B1、B2 一致，然后进程退出码 `3221225477`。父测试按非 0 失败，没有把这行输出记成通过。`Downloading Electron binary...` 再次出现。node 作业仍停在行数门禁，Ubuntu 单测没有跑到。

随后把成功退出从 `app.exit(0)` 改成 `process.exit(0)`，并给子进程加上 `--disable-gpu` 与 `--disable-software-rasterizer`。这次本机 Linux 再跑，退出码 0。Windows 要看这次提交之后的 CI。

## 纯行数门禁的本地分类

工作目录是仓库根。Node 是 22.23.4。

`corepack pnpm exec vitest run tools/check-pr-size/limit.test.ts tools/check-file-size/limit.test.ts tools/check-hotspots/hotspot.test.ts tools/eslint/limits.test.ts tools/gate-remediation/catalog.test.ts tools/gate-remediation/run.test.ts`

退出码 0。6 个文件，18 个测试通过。

覆盖：601 行与 contracts-only 201 行都退出码 0，并打印合计和原先的提示数。带理由字符串的空提交不改变退出码。打不开的 git base 仍是非 0。普通 601、入口 151、组件 401、测试 801 都打印路径和行数且退出码 0。正好 600 和 10 行不打印超过项。生成文件仍跳过。豁免名单里的文件仍被打印。坏 JSON 和缺少理由字段的名单仍是非 0。`composition-root.ts` 与 `slots.ts` 超过 30 只打印，不相关文件不打印，不超过 30 不打印超过项。圈复杂度超过 15 仍失败。约 90 行的函数退出码 0，输出里没有函数行数规则。

`corepack pnpm exec vitest run tools/gate-remediation/ruff.test.ts tools/check-deps/boundaries.test.ts tools/check-secrets/leak.test.ts tools/check-license/reject.test.ts tools/check-commits/message.test.ts`

退出码 0。5 个文件，14 个测试通过，3 个跳过。ruff 的 C901 与 PLR0915 仍失败。一百行注释、两条语句的函数不触发 PLR0915。依赖方向、密钥和许可证的既有失败样例仍失败。`workers/parser/pyproject.toml` 没有改动。

未提交时跑过一次 `corepack pnpm run check`。它在 codegen 之后的 `git diff --exit-code` 失败，因为工作区还有未提交改动。这不是生成物漂移。本地 `main` 是 `94e6a9d847f6e5fc3c3ebbe2e089f535e31f5ed3`，不是 PR 的 base。那次 `check-pr-size` 因此打印 1261，不是相对 `origin/main` 的数。

## GATE_BASE=origin/main corepack pnpm run check

在 `45e209f10d723e1baafc636558b64b35ed4ddd56` 上退出码 0。格式、lint、类型、core 类型、单文件扫描、依赖（404 模块、1199 条依赖无违规）、许可证、切片、提交说明、热点、codegen 之后的 git diff 都通过。`check-pr-size` 打印 1379，并打印 former hint 600，退出码仍是 0。1379 等于相对 `origin/main` 的新增 1229 加删除 150。这不是把 run 44996860301 改写成通过。那次 node 停在总行数，codegen 和 Ubuntu 单测没有跑到。
