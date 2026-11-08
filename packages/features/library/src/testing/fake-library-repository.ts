import type { Result } from "@oi/kernel";

import { parseLibraryEntryId } from "../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../domain/library-failure.js";
import {
  parseFileName,
  parseProgressPage,
  parseTimestamp,
  parseTitle,
  type LibraryRecord,
} from "../domain/library-record.js";
import type {
  LibraryProgressPageUpdate,
  LibraryProgressUpdate,
  LibraryRepository,
  LibrarySourceUpdate,
} from "../application/ports/library-repository.js";

export type FakeLibrarySeed = {
  readonly id: string;
  readonly fileName: string;
  readonly title: string;
  readonly originalPath: string;
  readonly addedAt: string;
  readonly openedAt: string | null;
  readonly progressPage: number | null;
};

export type FakeLibraryRepository = LibraryRepository &
  LibraryProgressPageUpdate & {
    readonly records: () => readonly LibraryRecord[];
  };

export function createFakeLibraryRepository(options?: {
  readonly failInsert?: boolean;
}): FakeLibraryRepository {
  const rows: LibraryRecord[] = [];
  const failInsert = options?.failInsert ?? false;
  return {
    records() {
      return rows.map((row) => ({ ...row }));
    },
    findById(id) {
      return found(rows, id);
    },
    insert(record) {
      return insertRow(rows, record, failInsert);
    },
    list() {
      return { ok: true, value: rows.map((row) => ({ ...row })) };
    },
    updateSource(id, source) {
      return updateSource(rows, id, source);
    },
    updateProgress(id, progress) {
      return updateProgress(rows, id, progress);
    },
    updateProgressPage(id, page) {
      return updateProgressPage(rows, id, page);
    },
  };
}

export function seedLibrary(
  repository: FakeLibraryRepository,
  seed: FakeLibrarySeed,
): void {
  const record = seedRecord(seed);
  const inserted = repository.insert(record);
  if (!inserted.ok) {
    throw new Error(inserted.error.code);
  }
}

function seedRecord(seed: FakeLibrarySeed): LibraryRecord {
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

function found(
  rows: readonly LibraryRecord[],
  id: LibraryRecord["id"],
): Result<LibraryRecord | null, LibraryFailure> {
  const match = rows.find((row) => row.id === id);
  return { ok: true, value: match ?? null };
}

function insertRow(
  rows: LibraryRecord[],
  record: LibraryRecord,
  failInsert: boolean,
): Result<void, LibraryFailure> {
  if (failInsert || rows.some((row) => row.id === record.id)) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  rows.push(record);
  return { ok: true, value: undefined };
}

function updateSource(
  rows: LibraryRecord[],
  id: LibraryRecord["id"],
  source: LibrarySourceUpdate,
): Result<LibraryRecord, LibraryFailure> {
  const index = rows.findIndex((row) => row.id === id);
  const current = rows[index];
  const fileName = parseFileName(source.fileName);
  if (current === undefined || fileName === undefined) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  const next = {
    ...current,
    originalPath: source.originalPath,
    fileName,
  };
  rows[index] = next;
  return { ok: true, value: next };
}

function updateProgress(
  rows: LibraryRecord[],
  id: LibraryRecord["id"],
  progress: LibraryProgressUpdate,
): Result<LibraryRecord, LibraryFailure> {
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

function updateProgressPage(
  rows: LibraryRecord[],
  id: LibraryRecord["id"],
  page: number,
): Result<LibraryRecord, LibraryFailure> {
  const index = rows.findIndex((row) => row.id === id);
  const current = rows[index];
  if (current === undefined) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  const next = {
    ...current,
    progressPage: page,
  };
  rows[index] = next;
  return { ok: true, value: next };
}
