import { fileURLToPath } from "node:url";

import {
  dataRootLayout,
  openAppStorage,
  readSliceMigrations,
  type AppStorage,
} from "@oi/platform-node";

import type { LibraryIpcHandlers } from "../application/library-ipc.js";
import type { PdfPicker } from "../application/ports/pdf-picker.js";
import { createImportPdf } from "../application/use-cases/import-pdf.js";
import { createListLibrary } from "../application/use-cases/list-library.js";
import { createRelocateSource } from "../application/use-cases/relocate-source.js";
import { createFsPdfFileStore } from "./fs-pdf-file-store.js";
import { createLibraryIpcHandlers } from "./ipc-handlers.js";
import { createSqliteLibraryRepository } from "./sqlite-library-repository.js";

export type LibraryClock = {
  nowMs(): number;
};

export type LibraryMainOptions = {
  readonly dataRoot: string;
  readonly pickPdf: PdfPicker;
  readonly clock: LibraryClock;
};

export type LibraryMain = {
  readonly handlers: LibraryIpcHandlers;
  readonly close: () => void;
};

type Opened =
  | { readonly ok: true; readonly storage: AppStorage }
  | { readonly ok: false };

export function createLibraryMain(options: LibraryMainOptions): LibraryMain {
  const opened = openLibrary(options);
  if (!opened.ok) {
    return {
      handlers: unavailableHandlers(),
      close() {
        return undefined;
      },
    };
  }
  return {
    handlers: handlersFor(opened.storage, options),
    close: closeOnce(opened.storage),
  };
}

function openLibrary(options: LibraryMainOptions): Opened {
  try {
    return openLibraryResult(options);
  } catch {
    return { ok: false };
  }
}

function openLibraryResult(options: LibraryMainOptions): Opened {
  const migrations = readSliceMigrations("library", migrationsDirectory());
  if (!migrations.ok) {
    return { ok: false };
  }
  const opened = openAppStorage({
    dataRoot: options.dataRoot,
    clock: options.clock,
    migrations: migrations.value,
  });
  if (!opened.ok) {
    return { ok: false };
  }
  return { ok: true, storage: opened.value };
}

function migrationsDirectory(): string {
  return fileURLToPath(new URL("../../migrations", import.meta.url));
}

function handlersFor(
  storage: AppStorage,
  options: LibraryMainOptions,
): LibraryIpcHandlers {
  const repository = createSqliteLibraryRepository(storage);
  const files = createFsPdfFileStore({
    layout: dataRootLayout(options.dataRoot),
  });
  return createLibraryIpcHandlers({
    importPdf: createImportPdf({
      repository,
      files,
      clock: options.clock,
      ingest: {
        openDocument() {
          return undefined;
        },
      },
    }),
    listLibrary: createListLibrary(repository),
    relocateSource: createRelocateSource({ repository, files }),
    pickPdf: options.pickPdf,
  });
}

function unavailableHandlers(): LibraryIpcHandlers {
  return {
    import: () => failed(),
    importDropped: () => failed(),
    list: () => failed(),
    relocate: () => failed(),
  };
}

function failed(): Promise<{
  readonly ok: false;
  readonly error: { readonly code: "handler_threw"; readonly retryable: true };
}> {
  return Promise.resolve({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
}

function closeOnce(storage: AppStorage): () => void {
  const state = { closed: false };
  return () => {
    if (state.closed) {
      return;
    }
    state.closed = true;
    storage.close();
  };
}
