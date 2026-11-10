import { fileURLToPath } from "node:url";

import {
  dataRootLayout,
  openAppStorage,
  readSliceMigrations,
  type AppStorage,
} from "@oi/platform-node";

import {
  createBindReadingAssetCommand,
  type BindReadingAssetCommand,
} from "../application/bind-reading-asset-command.js";
import {
  createGetProgressPageCommand,
  type GetProgressPageCommand,
} from "../application/get-progress-page-command.js";
import type { LibraryIpcHandlers } from "../application/library-ipc.js";
import {
  createLibraryOpenPort,
  type LibraryOpenPort,
} from "../application/library-open-port.js";
import type {
  LibraryProgressPageUpdate,
  LibraryRepository,
} from "../application/ports/library-repository.js";
import type { PdfPicker } from "../application/ports/pdf-picker.js";
import { createReadingGenerationTable } from "../application/reading-generation-table.js";
import {
  createRevokeReadingAssetCommand,
  type RevokeReadingAssetCommand,
} from "../application/revoke-reading-asset-command.js";
import {
  createSetProgressPageCommand,
  type SetProgressPageCommand,
} from "../application/set-progress-page-command.js";
import { createGetProgressPage } from "../application/use-cases/get-progress-page.js";
import { createImportPdf } from "../application/use-cases/import-pdf.js";
import { createListLibrary } from "../application/use-cases/list-library.js";
import { createRelocateSource } from "../application/use-cases/relocate-source.js";
import { createSetProgressPage } from "../application/use-cases/set-progress-page.js";
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

export type ReadingIpcHandlers = {
  readonly bindReadingAsset: BindReadingAssetCommand;
  readonly revokeReadingAsset: RevokeReadingAssetCommand;
  readonly getProgressPage: GetProgressPageCommand;
  readonly setProgressPage: SetProgressPageCommand;
};

export type { LibraryOpenPort } from "../application/library-open-port.js";

export type LibraryMain = {
  readonly handlers: LibraryIpcHandlers;
  readonly reading: ReadingIpcHandlers;
  readonly locate: (assetId: string) => string | undefined;
  readonly openPort: LibraryOpenPort | null;
  readonly clock: LibraryClock;
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
      reading: unavailableReading(),
      locate() {
        return undefined;
      },
      openPort: null,
      clock: options.clock,
      close() {
        return undefined;
      },
    };
  }
  const built = handlersFor(opened.storage, options);
  return {
    handlers: built.handlers,
    reading: built.reading,
    locate: built.locate,
    openPort: built.openPort,
    clock: options.clock,
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
): Pick<LibraryMain, "handlers" | "reading" | "locate" | "openPort"> {
  const repository = createSqliteLibraryRepository(storage);
  const files = createFsPdfFileStore({
    layout: dataRootLayout(options.dataRoot),
  });
  const reading = readingHandlers(repository);
  return {
    handlers: createLibraryIpcHandlers({
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
    }),
    reading: reading.reading,
    locate: reading.locate,
    openPort: createLibraryOpenPort(repository),
  };
}

function readingHandlers(
  repository: LibraryRepository & LibraryProgressPageUpdate,
): Pick<LibraryMain, "reading" | "locate"> {
  const table = createReadingGenerationTable();
  const getProgressPage = createGetProgressPage(repository);
  const setProgressPage = createSetProgressPage(repository);
  return {
    reading: {
      bindReadingAsset: createBindReadingAssetCommand(getProgressPage, table),
      revokeReadingAsset: createRevokeReadingAssetCommand(table),
      getProgressPage: createGetProgressPageCommand(getProgressPage, table),
      setProgressPage: createSetProgressPageCommand(setProgressPage, table),
    },
    locate(assetId) {
      return table.locate(assetId);
    },
  };
}

function unavailableHandlers(): LibraryIpcHandlers {
  return {
    import: () => failed(),
    importDropped: () => failed(),
    list: () => failed(),
    relocate: () => failed(),
  };
}

function unavailableReading(): ReadingIpcHandlers {
  return {
    bindReadingAsset: () => failed(),
    revokeReadingAsset: () => failed(),
    getProgressPage: () => failed(),
    setProgressPage: () => failed(),
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
