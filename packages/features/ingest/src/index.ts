export { openFailure } from "./domain/open-failure.js";
export type { OpenCode, OpenFailure } from "./domain/open-failure.js";
export type { JobIdSource } from "./application/ports/job-ids.js";
export type {
  LibraryLookup,
  LibraryLookupHit,
} from "./application/ports/library-lookup.js";
export type { Openings } from "./application/ports/openings.js";
export type {
  IngestIpcDeps,
  IngestIpcHandlers,
} from "./application/ingest-ipc.js";
export { createOpenDocument } from "./application/use-cases/open-document.js";
export type {
  OpenDocument,
  OpenDocumentDeps,
  OpenDocumentInput,
  OpenDocumentValue,
} from "./application/use-cases/open-document.js";
export { createIngestIpcHandlers } from "./adapters/ipc-handlers.js";
