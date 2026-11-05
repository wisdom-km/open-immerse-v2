import type { LibraryEntry } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import { parseLibraryEntryId } from "../../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../../domain/library-failure.js";
import { toLibraryEntry } from "../../domain/library-record.js";
import type { LibraryRepository } from "../ports/library-repository.js";
import type { PdfFileStore } from "../ports/pdf-file-store.js";

export type RelocateSourceInput = {
  readonly id: string;
  readonly filePath: string;
};

export type RelocateSourceResult = {
  readonly entry: LibraryEntry;
};

export type RelocateSource = (
  input: RelocateSourceInput,
) => Result<RelocateSourceResult, LibraryFailure>;

export type RelocateSourceDeps = {
  readonly repository: LibraryRepository;
  readonly files: PdfFileStore;
};

export function createRelocateSource(deps: RelocateSourceDeps): RelocateSource {
  return (input) => relocateSource(deps, input);
}

function relocateSource(
  deps: RelocateSourceDeps,
  input: RelocateSourceInput,
): Result<RelocateSourceResult, LibraryFailure> {
  const id = parseLibraryEntryId(input.id);
  if (id === undefined) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  const found = deps.repository.findById(id);
  if (!found.ok) {
    return found;
  }
  if (found.value === null) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  const inspected = deps.files.inspect(input.filePath);
  if (!inspected.ok) {
    return inspected;
  }
  if (inspected.value.id !== id) {
    return { ok: false, error: libraryFailure("hash_mismatch") };
  }
  const updated = deps.repository.updateSource(id, {
    originalPath: input.filePath,
    fileName: inspected.value.fileName,
  });
  if (!updated.ok) {
    return updated;
  }
  return { ok: true, value: { entry: toLibraryEntry(updated.value) } };
}
