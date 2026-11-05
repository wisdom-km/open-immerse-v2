# reader

PDF 原文的页码、缩放和视口规则，以及 PDF.js 按字节读取页数与页几何。没有阅读场景界面。

公开 API：`src/index.ts` 转出打开会话、`setZoom` 和 `createReaderIpcHandlers`。`src/pure.ts` 转出页码夹取、缩放边界、fit 视口、会话构造和位置历史。PDF.js 工厂在 `src/adapters/pdfjs-document.ts`，不从桶转出，避免 core 与 renderer 加载它。`reader.setZoom` 的 `expose` 仍为 false，不挂 `wire-ipc`。

成功打开后的 `openedAt` 不在本包写入。接线 PR `feature/m2-ingest-open-document-174` 在打开成功后调用已有的 library `updateProgress`（无 IPC）。本包不依赖 `@oi/feature-library`，也不调用 `ingest.openDocument`。

缩放按文档 id 记在注入的 `ReaderState` 里，只存在该实例的进程寿命中。进程内实现是 `src/adapters/memory-reader-state.ts` 的 `createMemoryReaderState`，不从桶转出。不发明 `session.save`。

所有者：@wisdom-km。热点文件：无。
