# ingest

本步只接线 `ingest.openDocument`，并在进度写入成功后更新 `openedAt`。页码写回打开前已经存在的 `progressPage`：原来是 `null` 就仍是 `null`，原来是正整数就原样保留。不调用 PDF.js，不等待真机截图。完整编排、阅读界面、`expose: true` 都不在本步。

幂等只在同一记忆实例内。调用方持有 `createMemoryOpenings()` 的那一份。重启进程或再创建一份实例，不保证还是同一个 `jobId`。本步没有持久化的任务状态机。

公开 API：`src/index.ts` 转出 `createOpenDocument`、`openFailure`、端口类型和 `createIngestIpcHandlers`。`src/pure.ts` 没有导出。进程内记忆是 `src/adapters/memory-openings.ts` 的 `createMemoryOpenings`，不从桶转出。`openDocument.expose` 仍为 false，不挂 `wire-ipc`。

所有者：@wisdom-km。热点文件：无。
