import { createIngestIpcHandlers } from "@oi/feature-ingest/ipc";
import { createOpenDocument } from "@oi/feature-ingest/open-document";
import type { LibraryMain, LibraryOpenPort } from "@oi/feature-library/main";

import type { IpcCommandHandler } from "./ipc/ipc-router.js";

export const openDocumentChannel = "ingest.openDocument";

type RememberedId = NonNullable<ReturnType<LibraryOpenPort["parseEntryId"]>>;
type RememberedJob = ReturnType<LibraryOpenPort["decimalJobId"]>;

export function openDocumentHandler(main: LibraryMain): IpcCommandHandler {
  const port = main.openPort;
  if (port === null) {
    return unavailable;
  }
  const handlers = createIngestIpcHandlers({
    openDocument: createOpenDocument({
      lookup: {
        findById(id) {
          return port.readProgressPage(id);
        },
      },
      updateProgress(input) {
        return port.writeOpened(input);
      },
      parseEntryId(value) {
        return port.parseEntryId(value);
      },
      formatOpenedAt(nowMs) {
        return port.formatOpenedAt(nowMs);
      },
      clock: main.clock,
      jobIds: decimalJobIds(port),
      openings: memoryOpenings(),
    }),
  });
  return (payload) => handlers.openDocument(payload);
}

function unavailable(): ReturnType<IpcCommandHandler> {
  return Promise.resolve({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
}

function decimalJobIds(port: LibraryOpenPort): { next(): RememberedJob } {
  const state = { n: 0 };
  return {
    next() {
      state.n += 1;
      return port.decimalJobId(String(state.n));
    },
  };
}

function memoryOpenings(): {
  find(id: RememberedId): RememberedJob | undefined;
  remember(id: RememberedId, jobId: RememberedJob): void;
} {
  const rows = new Map<RememberedId, RememberedJob>();
  return {
    find(id) {
      return rows.get(id);
    },
    remember(id, jobId) {
      rows.set(id, jobId);
    },
  };
}
