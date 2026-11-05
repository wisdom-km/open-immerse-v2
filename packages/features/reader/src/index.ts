export type { ReaderCode, ReaderFailure } from "./domain/reader-failure.js";
export { readerFailure } from "./domain/reader-failure.js";
export type {
  PdfDocuments,
  ReaderCancel,
} from "./application/ports/pdf-documents.js";
export type { ReaderState } from "./application/ports/reader-state.js";
export type {
  ReaderIpcDeps,
  ReaderIpcHandlers,
} from "./application/reader-ipc.js";
export type {
  OpenReaderSession,
  OpenReaderSessionDeps,
  OpenReaderSessionInput,
} from "./application/use-cases/open-session.js";
export { createOpenReaderSession } from "./application/use-cases/open-session.js";
export type {
  SetZoom,
  SetZoomInput,
  SetZoomValue,
} from "./application/use-cases/set-zoom.js";
export { createSetZoom } from "./application/use-cases/set-zoom.js";
export { createReaderIpcHandlers } from "./adapters/ipc-handlers.js";
