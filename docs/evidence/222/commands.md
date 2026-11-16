# PR #222 命令

Node v22.23.4。工作目录是仓库根。PATH 前置 `/home/ubuntu/.nvm/versions/node/v22.23.4/bin`。`origin/main` 是 `405c865a48902d6406a964a155823c49f4e3bff9`。下列命令跑在 `04d11267dd4baf982d8fd1a9685e8ddc5b8cac59`，当时还没有本文件。没有真机，没有 Anvil Box。没有 Ready、合入或发版。

## corepack pnpm run codegen

退出码 0。打印 `codegen: 1 generators`。随后 `git diff --exit-code` 退出码 0。三份生成物哈希与命令前相同。`oi.generated.ts` 是 `bbc7f9c05898fd5855e56461992774d421b8a5474de2a28f8e092a4d0570c0a9`。`oi-api.d.ts` 是 `e1e24168d06125117cfe12435415e280dc6ca9ca3c2fdc776d73c0494c596a14`。`registry.generated.ts` 是 `3790bc80745ec48f85fcf786ef1fa18ef7a84565c4fcf710d13f9d252492d19d`。

## corepack pnpm exec vitest run apps/desktop/test/view-menu-epoch.test.ts apps/desktop/test/ipc-router.test.ts apps/desktop/test/library-command-map.test.ts apps/desktop/test/open-document-wiring.test.ts

退出码 0。4 个文件、37 通过、0 跳过。Type Errors 无。四个文件的源码 `it` 也是 37。typecheck 没有并进这条计数。

## corepack pnpm test

退出码 0。195 个文件。909 通过，3 跳过，共 912。Type Errors 无。没有失败。3 个跳过都在 `tools/check-secrets/leak.test.ts`，因为 `GITLEAKS_BIN` 未设置：`rejects a committed access key that lacks the oitest_ prefix (G9)`、`allows a synthetic key that uses the oitest_ prefix (G9)`、`rejects the same suffix when the prefix is nottest_ (G9)`。跳过原因是 `GITLEAKS_BIN is unset. Point it at the gitleaks binary to run G9.` 定向四个文件没有跳过。

## GATE_BASE=origin/main corepack pnpm run check

退出码 0。Prettier 无违例。`check-file-size` 打印 492 source files within hard limits。`check-one-slice` 打印 0 feature slice(s)。`check-pr-size` 打印 539 non-generated lines。`check` 内再次 codegen 后工作区干净。提交说明没有放行标记。

## node tools/check-docs/check.mjs

退出码 0。`findings: 0`。本文件与计划实际列写入后再跑一次，退出码仍是 0，`findings` 仍是 0。

## GATE_BASE=origin/main node tools/check-pr-size/check.mjs

退出码 0。打印 539 non-generated lines。本文件 27 行。连同上面的 539，相对 base 的非生成合计是 566。没有失败，所以没有重跑。

## 非法 epoch 补测
补测提交 `2095b34309a551fd936c4824055471e0e9ffc92b`，tree `90a276ba2b20cb140ce44fbb7d87818178269633`。上面各节不改。Forge 重估复核，不是新的 Wisdom 批准。`prettier` 对新增 `it.each` 报告 unchanged，相对父笔 +18/−0。`corepack pnpm run codegen` 退出码 0，打印 `codegen: 1 generators`。`git diff --exit-code` 退出码 0。三份哈希与命令前相同：`oi.generated.ts` `bbc7f9c05898fd5855e56461992774d421b8a5474de2a28f8e092a4d0570c0a9`，`oi-api.d.ts` `e1e24168d06125117cfe12435415e280dc6ca9ca3c2fdc776d73c0494c596a14`，`registry.generated.ts` `3790bc80745ec48f85fcf786ef1fa18ef7a84565c4fcf710d13f9d252492d19d`。`check` 内再次 codegen 后工作区干净。
定向 Vitest 退出码 0。4 个文件、40 通过、0 跳过。原 12 个 `it` 之外加一个三行 `it.each`。Type Errors 无，没有并进 40。`GITLEAKS_BIN=/tmp/gitleaks`，版本 8.30.1，压缩包 sha256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` 与 CI 一致。`corepack pnpm test` 退出码 0。195 个文件。915 通过，0 跳过，共 915。G9 的 `reject-access-key`、`allow-oitest`、`reject-nottest` 都跑了 detect。`GATE_BASE=origin/main corepack pnpm run check` 退出码 0。`node tools/check-docs/check.mjs` 在本提交退出码 0，`findings: 0`；本节写入后再跑一次，退出码仍是 0。`check-pr-size` 在本提交打印 584。本节与计划实际列共 +5 行，合计 589。没有失败，所以没有重跑。
