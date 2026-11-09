# 接通 openDocument 只写最近

全量 `corepack pnpm run check` 的对象是 `724f7619b5d22437e629570178a5cd5d41fbed86`（tree `534ad11bd0787a5f4e4ab2a1fef056f8a245033a`）。Node v22.23.4。pnpm 10.34.9。基线 `main` 与 `origin/main` 都是 `631859c440320328164f6b3ecc0076dd7ca7ea94`。没有手动触发 CI。没有写 `G12:`。本机 `GITLEAKS_BIN` 未设置。没有跑真机，没有跑 `apps/desktop` 的 build 脚本。

Forge 有条件 PASS：[6739982998](https://github.com/wisdom-km/open-immerse-v2/pull/191#issuecomment-6739982998)。计划改正是 `47f416ff9021b610040993543a6eaf1b28df9ba7`（tree `1827921ac016421c9ed5c83029c71f92d5d8e561`），只改计划文件。

## 停点

命中停点 7。`724f761` 上的全量 check 在 `check-pr-size` 退出码 1：`722 non-generated lines > 600`。没有写 `G12:`，没有拆 PR，没有改生成物来压行数。

其后 `fb075ec191ffe4cab79297c5794f4aac70177ef2` 只把三处仍断言「未暴露」的测试改成已暴露。单独再跑 `node tools/check-pr-size/check.mjs`，退出码 1：`731 non-generated lines`。`pnpm-lock.yaml` 的 3 行不计入。没有重跑全量 check。

没有命中的停点：调用链没有 `submitParse`、`ing_route`、`ingest-policy`、jobs 写入、worker 或 PDF.js。`index.ts`、`composition-root.ts`、`slots.ts` 的 diff 是 0。请求、响应、错误码没有改，只把 `expose` 改为 true。`parse-capability-surface.test.ts` 的禁止名单没删。该文件在 `724f761` 的 Vitest 里通过。dependency-cruiser 在 `724f761` 上是 `no dependency violations found (333 modules, 966 dependencies cruised)`。`check-one-slice: 1 feature slice(s)`。`open-document-wiring.ts` 79 行。`library-wiring.ts` 相对基线 +14/−1。没有改 desktop 的 build 脚本。

## corepack pnpm run check

先在 `058f881d09d7c1c4cb869296c00efd9aeb21fc09` 跑了一次，退出码 2，停在 typecheck：`open-document-wiring.ts(38,45)` TS2345，载荷是 `unknown`。`724f761` 加上断言后重跑，这是上面那次走到 G12 的全量。

走到 G12 之前，退出码都是 0：format、lint、typecheck、typecheck:core、`check-file-size: 428 source files within hard limits`、dependency-cruiser、core-tests、三份 license、`check-one-slice`、`check-commits`、`check-hotspots: named hotspot diffs are within 30 lines`。codegen 与随后的 `git diff --exit-code` 没有跑到。

## corepack pnpm test

在 `724f761` 上跑了一次。Vitest 173 个文件，726 通过，3 失败，3 跳过。退出码 1。类型错误 0。

3 个失败都是仍断言 `expose` 为 false，或 registry 频道表还没有 `ingest.openDocument`：

- `apps/desktop/test/ipc-router.test.ts`：`registers one handle for each exposed library command`
- `packages/contracts/test/reading-asset.test.ts`：`exposes bind and revoke and keeps openDocument and setZoom hidden`
- `packages/features/ingest/test/adapters/ipc-handlers.test.ts`：`keeps openDocument unexposed when the handlers are created`

3 个跳过是 `GITLEAKS_BIN` 未设置时的 detect。这不是具名 G9 通过。

`fb075ec` 改了这三处断言。随后只重跑这三份，加上 `open-document-wiring.test.ts`、`parse-capability-surface.test.ts`，以及阅读公开面那次已经绿过的文件没有再整套重跑。这 6 个文件 41 通过，退出码 0。没有把 726 改写成整套通过。

## node tools/compare-spec-bytes/compare.mjs

在写入本证据文件之前跑过。退出码 0。ARCHITECTURE.md 66 parts match，字节 372940。PRD.md 与 RULES.md 的跨度也对上 `f8d5d01`。

## 调用链

`ingest.openDocument` 仍走已有的 `createOpenDocument`。它读 `progressPage`，写 `openedAt` 和刚读到的页，记一份进程内 `jobId`。不提交解析。
