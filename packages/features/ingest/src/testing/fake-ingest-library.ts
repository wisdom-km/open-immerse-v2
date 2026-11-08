import type { LibraryEntryId } from "@oi/contracts";
import type { Result } from "@oi/kernel";
import {
  libraryFailure,
  parseFileName,
  parseLibraryEntryId,
  parseProgressPage,
  parseTimestamp,
  parseTitle,
  type LibraryFailure,
  type LibraryRecord,
  type LibraryRepository,
} from "@oi/feature-library";

import {
  openFailure,
  type OpenCode,
  type OpenFailure,
} from "../domain/open-failure.js";
import type {
  LibraryLookup,
  LibraryLookupHit,
} from "../application/ports/library-lookup.js";

export type IngestLibrarySeed = {
  readonly id: string;
  readonly fileName: string;
  readonly title: string;
  readonly originalPath: string;
  readonly addedAt: string;
  readonly openedAt: string | null;
  readonly progressPage: number | null;
};

type ProgressFault = "not_found" | "rejected";

export type IngestLibrary = {
  readonly repository: LibraryRepository;
  readonly lookup: LibraryLookup;
  readonly records: () => readonly LibraryRecord[];
  readonly progressWrites: () => number;
  readonly failNextProgress: (code: ProgressFault) => void;
  readonly failLookup: (code: OpenCode) => void;
  readonly seed: (seed: IngestLibrarySeed) => void;
};

export function createIngestLibrary(): IngestLibrary {
  const rows: LibraryRecord[] = [];
  let progressWrites = 0;
  let progressFault: ProgressFault | undefined;
  let lookupFault: OpenCode | undefined;
  const repository = createRepository(rows, () => {
    progressWrites += 1;
    const fault = progressFault;
    progressFault = undefined;
    return fault;
  });
  return {
    repository,
    lookup: {
      findById(id) {
        return findHit(rows, id, () => {
          const fault = lookupFault;
          lookupFault = undefined;
          return fault;
        });
      },
    },
    records() {
      return rows.map((row) => ({ ...row }));
    },
    progressWrites() {
      return progressWrites;
    },
    failNextProgress(code) {
      progressFault = code;
    },
    failLookup(code) {
      lookupFault = code;
    },
    seed(seed) {
      const inserted = repository.insert(toRecord(seed));
      if (!inserted.ok) {
        throw new Error(inserted.error.code);
      }
    },
  };
}

function createRepository(
  rows: LibraryRecord[],
  takeFault: () => ProgressFault | undefined,
): LibraryRepository {
  return {
    findById(id) {
      return { ok: true, value: rows.find((row) => row.id === id) ?? null };
    },
    insert(record) {
      if (rows.some((row) => row.id === record.id)) {
        return { ok: false, error: libraryFailure("rejected") };
      }
      rows.push(record);
      return { ok: true, value: undefined };
    },
    list() {
      return { ok: true, value: rows.map((row) => ({ ...row })) };
    },
    updateSource() {
      return { ok: false, error: libraryFailure("not_found") };
    },
    updateProgress(id, progress) {
      return writeProgress(rows, id, progress, takeFault);
    },
  };
}

function writeProgress(
  rows: LibraryRecord[],
  id: LibraryEntryId,
  progress: { readonly openedAt: string; readonly progressPage: number | null },
  takeFault: () => ProgressFault | undefined,
): Result<LibraryRecord, LibraryFailure> {
  const fault = takeFault();
  if (fault !== undefined) {
    return { ok: false, error: libraryFailure(fault) };
  }
  const index = rows.findIndex((row) => row.id === id);
  const current = rows[index];
  if (current === undefined) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  const next = {
    ...current,
    openedAt: progress.openedAt,
    progressPage: progress.progressPage,
  };
  rows[index] = next;
  return { ok: true, value: next };
}

function findHit(
  rows: readonly LibraryRecord[],
  id: string,
  takeFault: () => OpenCode | undefined,
): Result<LibraryLookupHit | null, OpenFailure> {
  const fault = takeFault();
  if (fault !== undefined) {
    return { ok: false, error: openFailure(fault) };
  }
  const parsed = parseLibraryEntryId(id);
  const match =
    parsed === undefined ? undefined : rows.find((row) => row.id === parsed);
  if (match === undefined) {
    return { ok: true, value: null };
  }
  return { ok: true, value: { progressPage: match.progressPage } };
}

function toRecord(seed: IngestLibrarySeed): LibraryRecord {
  const id = parseLibraryEntryId(seed.id);
  const fileName = parseFileName(seed.fileName);
  const title = parseTitle(seed.title);
  const addedAt = parseTimestamp(seed.addedAt);
  const openedAt =
    seed.openedAt === null ? null : parseTimestamp(seed.openedAt);
  const progressPage = parseProgressPage(seed.progressPage);
  if (
    id === undefined ||
    fileName === undefined ||
    title === undefined ||
    addedAt === undefined ||
    openedAt === undefined ||
    progressPage === undefined ||
    seed.originalPath.length === 0
  ) {
    throw new Error("rejected");
  }
  return {
    id,
    fileName,
    title,
    originalPath: seed.originalPath,
    addedAt,
    openedAt,
    progressPage,
  };
}
