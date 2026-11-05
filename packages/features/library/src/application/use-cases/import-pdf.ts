import type { LibraryEntry, LibraryEntryId } from "@oi/contracts";
import type { Clock, Result } from "@oi/kernel";

import { classifyImport } from "../../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../../domain/library-failure.js";
import {
  formatUtc,
  parseFileName,
  titleFromFileName,
  toLibraryEntry,
  type LibraryRecord,
} from "../../domain/library-record.js";
import type { LibraryRepository } from "../ports/library-repository.js";
import type { InspectedPdf, PdfFileStore } from "../ports/pdf-file-store.js";

export type ImportPdfResult = {
  readonly entry: LibraryEntry;
  readonly duplicate: boolean;
};

export type ImportPdf = (
  sourcePath: string,
) => Result<ImportPdfResult, LibraryFailure>;

/**
 * ingest 必须由调用方注入。#166 决定 7：本用例不调用它。
 * 测试断言 openDocument 的次数为 0。
 */
export type ImportPdfDeps = {
  readonly repository: LibraryRepository;
  readonly files: PdfFileStore;
  readonly clock: Clock;
  readonly ingest: {
    readonly openDocument: (id: LibraryEntryId) => void;
  };
};

export function createImportPdf(deps: ImportPdfDeps): ImportPdf {
  return (sourcePath) => importPdf(deps, sourcePath);
}

function importPdf(
  deps: ImportPdfDeps,
  sourcePath: string,
): Result<ImportPdfResult, LibraryFailure> {
  const inspected = deps.files.inspect(sourcePath);
  if (!inspected.ok) {
    return inspected;
  }
  const found = deps.repository.findById(inspected.value.id);
  if (!found.ok) {
    return found;
  }
  if (found.value !== null) {
    return duplicateResult(inspected.value.id, found.value);
  }
  return insertNew(deps, sourcePath, inspected.value);
}

function duplicateResult(
  id: LibraryEntryId,
  existing: LibraryRecord,
): Result<ImportPdfResult, LibraryFailure> {
  const decision = classifyImport(id, existing.id);
  if (decision.kind === "new") {
    return { ok: false, error: libraryFailure("rejected") };
  }
  return {
    ok: true,
    value: { entry: toLibraryEntry(existing), duplicate: true },
  };
}

function insertNew(
  deps: ImportPdfDeps,
  sourcePath: string,
  inspected: InspectedPdf,
): Result<ImportPdfResult, LibraryFailure> {
  const placed = deps.files.placeCopy(sourcePath, inspected.id);
  if (!placed.ok) {
    return placed;
  }
  const record = buildRecord(deps, sourcePath, inspected);
  if (!record.ok) {
    return rollback(deps, inspected.id, record);
  }
  const inserted = deps.repository.insert(record.value);
  if (!inserted.ok) {
    return rollback(deps, inspected.id, inserted);
  }
  return {
    ok: true,
    value: { entry: toLibraryEntry(record.value), duplicate: false },
  };
}

function buildRecord(
  deps: ImportPdfDeps,
  sourcePath: string,
  inspected: InspectedPdf,
): Result<LibraryRecord, LibraryFailure> {
  const fileName = parseFileName(inspected.fileName);
  const addedAt = formatUtc(deps.clock.nowMs());
  const title =
    fileName === undefined ? undefined : titleFromFileName(fileName);
  if (fileName === undefined || title === undefined || addedAt === undefined) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  if (sourcePath.length === 0) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  return {
    ok: true,
    value: {
      id: inspected.id,
      fileName,
      title,
      originalPath: sourcePath,
      addedAt,
      openedAt: null,
      progressPage: null,
    },
  };
}

function rollback<T>(
  deps: ImportPdfDeps,
  id: LibraryEntryId,
  failure: Result<T, LibraryFailure>,
): Result<T, LibraryFailure> {
  deps.files.removeCopy(id);
  return failure;
}
