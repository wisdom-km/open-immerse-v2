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
