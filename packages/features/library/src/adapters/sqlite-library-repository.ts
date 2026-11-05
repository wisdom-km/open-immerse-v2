import type { AppStorage, SqlValue } from "@oi/platform-node";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../domain/document-identity.js";
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
  LibraryProgressUpdate,
  LibraryRepository,
  LibrarySourceUpdate,
} from "../application/ports/library-repository.js";

type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: LibraryFailure };

const COLUMNS =
  "id, file_name, title, original_path, added_at, opened_at, progress_page";

export function createSqliteLibraryRepository(
  storage: AppStorage,
): LibraryRepository {
  return {
    findById(id) {
      return findById(storage, id);
    },
    insert(record) {
      return insertRecord(storage, record);
    },
    list() {
      return listRecords(storage);
    },
    updateSource(id, source) {
      return updateSource(storage, id, source);
    },
    updateProgress(id, progress) {
      return updateProgress(storage, id, progress);
    },
  };
}

function findById(
  storage: AppStorage,
  id: LibraryEntryId,
): Outcome<LibraryRecord | null> {
  try {
    const row = storage.query(
      `SELECT ${COLUMNS} FROM lib_entries WHERE id = ?`,
      [id],
    );
    if (row === undefined) {
      return { ok: true, value: null };
    }
    const record = parseRow(row);
    if (record === undefined) {
      return { ok: false, error: libraryFailure("rejected") };
    }
    return { ok: true, value: record };
  } catch {
    return { ok: false, error: libraryFailure("rejected") };
  }
}

function insertRecord(
  storage: AppStorage,
  record: LibraryRecord,
): Outcome<void> {
  try {
    storage.transaction(() => {
      storage.execute(
        `INSERT INTO lib_entries (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        recordValues(record),
      );
    });
    return { ok: true, value: undefined };
  } catch {
    return { ok: false, error: libraryFailure("rejected") };
  }
}

function listRecords(storage: AppStorage): Outcome<readonly LibraryRecord[]> {
  try {
    const rows = storage.queryAll(`SELECT ${COLUMNS} FROM lib_entries`);
    const records: LibraryRecord[] = [];
    for (const row of rows) {
      const record = parseRow(row);
      if (record === undefined) {
        return { ok: false, error: libraryFailure("rejected") };
      }
      records.push(record);
    }
    return { ok: true, value: records };
  } catch {
    return { ok: false, error: libraryFailure("rejected") };
  }
}

function updateSource(
  storage: AppStorage,
  id: LibraryEntryId,
  source: LibrarySourceUpdate,
): Outcome<LibraryRecord> {
  const fileName = parseFileName(source.fileName);
  if (fileName === undefined || source.originalPath.length === 0) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  return writeThenRead(storage, id, () => {
    storage.execute(
      "UPDATE lib_entries SET original_path = ?, file_name = ? WHERE id = ?",
      [source.originalPath, fileName, id],
    );
  });
}

function updateProgress(
  storage: AppStorage,
  id: LibraryEntryId,
  progress: LibraryProgressUpdate,
): Outcome<LibraryRecord> {
  return writeThenRead(storage, id, () => {
    storage.execute(
      "UPDATE lib_entries SET opened_at = ?, progress_page = ? WHERE id = ?",
      [progress.openedAt, progress.progressPage, id],
    );
  });
}

function writeThenRead(
  storage: AppStorage,
  id: LibraryEntryId,
  write: () => void,
): Outcome<LibraryRecord> {
  try {
    storage.transaction(write);
  } catch {
    return { ok: false, error: libraryFailure("rejected") };
  }
  const found = findById(storage, id);
  if (!found.ok) {
    return found;
  }
  if (found.value === null) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  return { ok: true, value: found.value };
}

function recordValues(record: LibraryRecord): SqlValue[] {
  return [
    record.id,
    record.fileName,
    record.title,
    record.originalPath,
    record.addedAt,
    record.openedAt,
    record.progressPage,
  ];
}

function parseRow(row: Record<string, unknown>): LibraryRecord | undefined {
  const id = readId(row.id);
  const fileName = readFileName(row.file_name);
  const title = readTitle(row.title);
  const originalPath = readPath(row.original_path);
  const addedAt = readTime(row.added_at);
  const openedAt = readOpenedAt(row.opened_at);
  const progressPage = readPage(row.progress_page);
  if (
    id === undefined ||
    fileName === undefined ||
    title === undefined ||
    originalPath === undefined ||
    addedAt === undefined ||
    openedAt === undefined ||
    progressPage === undefined
  ) {
    return undefined;
  }
  return { id, fileName, title, originalPath, addedAt, openedAt, progressPage };
}

function readId(value: unknown): LibraryEntryId | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return parseLibraryEntryId(value);
}

function readFileName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return parseFileName(value);
}

function readTitle(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return parseTitle(value);
}

function readPath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  return value;
}

function readTime(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return parseTimestamp(value);
}

function readOpenedAt(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  return readTime(value);
}

function readPage(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value !== "number") {
    return undefined;
  }
  return parseProgressPage(value);
}
