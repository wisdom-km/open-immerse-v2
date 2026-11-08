import type { IngestCommands } from "@oi/contracts";

import type { OpenDocument } from "./use-cases/open-document.js";

export type IngestIpcHandlers = {
  readonly openDocument: IngestCommands["openDocument"];
};

export type IngestIpcDeps = {
  readonly openDocument: OpenDocument;
};
