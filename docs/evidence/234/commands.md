# PR #234 命令记录

阶段 1 只检查文档和提交说明。没有安装依赖，没有启动 Electron 或 native，没有跑产品测试。`pnpm install`、`pnpm test`、`pnpm run check`、eslint、vitest、tsc、pytest 都没有跑。行为验收 N1–N11 保持未跑，不标通过。

Node 是 v22.23.4。PATH 把 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin` 放在前面。工作区是 `/home/ubuntu/worktrees/feature-view-menu-lifecycle-none-174`。

## 检查对象

commit `516e7d2e89b14afc21d89023888806915cfc4290`，tree `609b74cee74cf496b77118f891b394dbdd830370`。base `e70ec91a673cb2784491bb02924d77b96a05b147`，tree `3270b2bed76595084025fa7a697e23aa2caf841d`。

相对 base 的路径只有：

- `docs/approvals.md`
- `docs/exec-plans/feature-reader-view-menu-seam-174.md`
- `docs/exec-plans/feature-view-menu-lifecycle-none-174.md`
- `docs/exec-plans/feature-view-menu-lifecycle-ownership-plan-174.md`

`apps/`、`packages/`、`workers/`、`tools/`、`.github/`、`package.json`、`pnpm-lock.yaml` 的差分是空的。

## check-docs

命令：`node tools/check-docs/check.mjs`

退出码 0。输出：

```
check-docs: strict
links: 0
anchors: 0
status: 0
verbatim: 0
tree: 0
findings: 0
```

## check-commits

命令：`node tools/check-commits/check.mjs --base e70ec91a673cb2784491bb02924d77b96a05b147`

退出码 0。输出：

```
check-commits: subjects match Conventional Commits
```

## 本文件

上面两次跑在本文件加入之前。把本文件加入索引后再跑，退出码仍是 0。提交 `edd7c85a0f0a4eca5dcc6d17a13e6a2ed0e7873e` 之后又跑了同一两条命令，退出码仍是 0，那次已经包含本文件当时的正文。本段是那次通过之后补上的。产品代码和测试代码仍然是 0。历史失败、意外 zip 123777540 字节、纯桩结果、旧 lint、skip 和环境 HOLD 不在这里清理。

## Forge 首轮计划修订

commit `ceae876f3846e40b656f4af708820d67b385bc0b`，tree `b405a1bd675d8fd377620970d642c65d775ff9fb`。只改 `docs/exec-plans/feature-view-menu-lifecycle-none-174.md`，103 行新增、39 行删除。没有改 `docs/approvals.md`。没有产品或测试代码。没有安装依赖，没有跑产品测试，没有启动 Electron 或 native。

命令：`node tools/check-docs/check.mjs`

退出码 0。findings 0。

命令：`node tools/check-commits/check.mjs --base e70ec91a673cb2784491bb02924d77b96a05b147`

退出码 0。

行为验收仍是未跑，不标通过。

## cca5ac3 复审后的握手修订

commit `1bb9177ada0385c5fcf97dfc5cc028953712a4cb`，tree `20b56b3479f9b67ba25ddd18bb9fb8d8297974b0`。只改 `docs/exec-plans/feature-view-menu-lifecycle-none-174.md`，54 行新增、25 行删除。没有改 `docs/approvals.md`。没有产品或测试代码。没有安装依赖，没有跑产品测试，没有启动 Electron 或 native。

命令：`node tools/check-docs/check.mjs`

退出码 0。findings 0。

命令：`node tools/check-commits/check.mjs --base e70ec91a673cb2784491bb02924d77b96a05b147`

退出码 0。

N1–N13 仍是未跑，不标通过。

## 实现后的 Node 纯桩

实现提交停在 `5b6e04401ddf59073542fb0d0c58cda5a89b545c`，tree `cfc24c6df52f79ed747c8a5dfd00b18f501729b2`。这三笔是 `9bd7f8a`、`347ac15`、`5b6e044`。工作目录都是 `/home/ubuntu/worktrees/feature-view-menu-lifecycle-none-174`。Node 是 v22.23.4。

没有执行 `pnpm install`。工作区里没有自己的 `node_modules`，测试通过符号链接用了已经存在的安装。读过 `electron/install.js`：它会调用 `@electron/get` 的 `downloadArtifact`。没有运行这个脚本。检查时 `electron/dist` 和 `path.txt` 都不存在，跑完测试之后仍然不存在。没有启动 Electron 或 native。

命令：

`corepack pnpm exec eslint --max-warnings 0 apps/desktop/src/main/view-menu-epoch.ts apps/desktop/src/main/view-menu-lifecycle.ts apps/desktop/src/main/view-menu-gate.ts apps/desktop/src/main/index.ts apps/desktop/src/main/composition-root.ts apps/desktop/src/main/library-wiring.ts apps/desktop/test/view-menu-epoch.test.ts apps/desktop/test/view-menu-lifecycle.test.ts apps/desktop/test/view-menu-wiring.test.ts apps/desktop/test/view-menu-gate.test.ts`

退出码 0。

命令：

`corepack pnpm exec tsc -p apps/desktop/tsconfig.main.json --noEmit --pretty false`

退出码 0。

命令：

`corepack pnpm exec vitest run apps/desktop/test/view-menu-epoch.test.ts apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-wiring.test.ts apps/desktop/test/view-menu-lifecycle.test.ts apps/desktop/test/open-document-wiring.test.ts apps/desktop/test/reading-asset-protocol.test.ts --reporter=verbose`

退出码 0。6 个文件，92 个用例通过，0 失败，0 跳过。原始输出在 `docs/evidence/234/view-menu-node.txt`。

`pnpm run check` 没有跑。完整门禁保持 HOLD。这次纯桩通过不写成真实 Electron、真机或首次全绿。历史里的 PR #232 启动失败、意外 zip、纯桩 7 通过 / 1 定位失败、六条负向 6 通过、lint、skip 和 HOLD 都还在。

## Windows desktop-e2e

run `45063027149`，commit `133470a93d49107bfbe70022459af134e03161f0`，merge-ref `8d28a2db950b18a8809f008c7dbb9e75d17aa503`。`desktop-e2e-windows` 的 Desktop unit tests 失败。其余五项通过。失败用例是 `reports a synchronous loadURL throw through the ready failure path`。Windows 报 `EBUSY: resource busy or locked, unlink ...\oi.sqlite`。`loadURL` 抛出前 `startLibrary` 已经打开数据库，测试末尾的 `rmSync` 在 Windows 上删不掉仍被占用的文件。Linux 上同一次删除成功，所以本地 92 个用例没有暴露。随后去掉这次删除。断言仍是 stderr 含 `load failed`，以及没有未处理的 rejection。本地重跑该用例退出码 0。没有启动 Electron。

## 07c58fe 官方六绿

run `45063351227`，commit `07c58feb187d1b3ea5bc5e755327f26cf7356959`，tree `1f1a58e00d4ffe7fd41586bf5f5622d2ca3fb596`。六项成功。`desktop-e2e-windows` 的 Desktop unit tests、Windows native view menu、Playwright Electron smoke 和截图上传都是 success。这是去掉 `rmSync` 之后的历史结果。它不证明夹具已经关闭自己打开的数据库。

## B1 夹具收尾

Forge 对 `07c58fe` 的必要阻断是新集成测试的资源收尾。只改 `apps/desktop/test/view-menu-lifecycle.test.ts`。没有新增生产 close、getter 或其他文件接口。`view-menu-wiring.test.ts` 没有改。

假 `app.on` 只收集 `will-quit`。`startDesktop` 留下的 `submit` 和 `noteNone` Promise 先排空。然后调用收集到的回调。这个回调就是 `startLibrary` 注册的 `main.close()`。回调返回之后才 `rmSync` 本次 `mkdtemp` 目录。`rmSync` 没有 try/catch，没有延时，也没有循环重试。断言失败时，监听和 stderr spy 走 `finally`，目录收尾走 `afterEach`。已经开始收尾的失败不会再删第二次。

N1、N2 和 `loadURL` 同步抛错这三条在监听外面断言：关闭前 `db/oi.sqlite` 存在，调用了 1 个 `will-quit` 回调，目录随后不存在。stderr 仍要含 `load failed`，未处理 rejection 仍是空。这次 Linux 运行不能证明 Windows 文件锁；能证明的是回调被调用，并且目录在回调之后删除。没有把生产泄漏或跨测试污染写成已经证实的事实。

命令：`corepack pnpm exec eslint --max-warnings 0 apps/desktop/test/view-menu-lifecycle.test.ts`。退出码 0。

命令：`corepack pnpm exec prettier --check apps/desktop/test/view-menu-lifecycle.test.ts`。退出码 0。

命令：

`corepack pnpm exec vitest run apps/desktop/test/view-menu-epoch.test.ts apps/desktop/test/view-menu-gate.test.ts apps/desktop/test/view-menu-wiring.test.ts apps/desktop/test/view-menu-lifecycle.test.ts apps/desktop/test/open-document-wiring.test.ts apps/desktop/test/reading-asset-protocol.test.ts --reporter=verbose`

退出码 0。6 个文件，92 通过，0 失败，0 跳过。原始输出在 `docs/evidence/234/view-menu-close.txt`。stderr 有 Node 的 SQLite ExperimentalWarning。这不是首次全绿。此前同一组 92 通过、run `45063027149` 的 Windows `EBUSY` 和后续 skip、run `45063351227` 的六绿都还是各自的历史。

另一次只跑 N1，并在 `startDesktop()` 之后临时加上 `expect(boot.created).toHaveLength(99)`。vitest 退出码 1。断言失败后 `afterEach` 仍收尾。跑完时 `${TMPDIR:-/tmp}` 下 `oitest-life-*` 的目录数仍是 41，没有留下新的 `oitest-life-*/db/oi.sqlite`。这 41 个是更早运行留下的，本轮没有清理它们，也不把它们写成这次修复前的生产泄漏。临时断言已经从文件里去掉，随后的 92 通过不包含它。

安装复用的符号链接：

- `node_modules` → `/agent/repos/open-immerse-v2/node_modules`
- `apps/desktop/node_modules` → `/agent/repos/open-immerse-v2/apps/desktop/node_modules`
- `packages/features/library/node_modules` → `/agent/repos/open-immerse-v2/packages/features/library/node_modules`
- `packages/platform-node/node_modules` → `/agent/repos/open-immerse-v2/packages/platform-node/node_modules`
- `apps/desktop/node_modules/electron` → `/agent/repos/open-immerse-v2/node_modules/.pnpm/electron@45.2.1/node_modules/electron`

`electron/dist` 与 `path.txt` 都不存在。没有运行 `electron/install.js`。没有启动 Electron 或 native。`pnpm run check` 仍未跑。完整门禁保持 HOLD。
