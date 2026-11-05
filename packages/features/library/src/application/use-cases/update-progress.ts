import type { LibraryEntry } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import { parseLibraryEntryId } from "../../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../../domain/library-failure.js";
import {
  parseProgressPage,
  parseTimestamp,
  toLibraryEntry,
} from "../../domain/library-record.js";
import type { LibraryRepository } from "../ports/library-repository.js";

export type UpdateProgressInput = {
  readonly id: string;
  readonly openedAt: string;
  readonly page: number | null;
};

export type UpdateProgress = (
  input: UpdateProgressInput,
) => Result<LibraryEntry, LibraryFailure>;

export function createUpdateProgress(
  repository: LibraryRepository,
): UpdateProgress {
  return (input) => updateProgress(repository, input);
}

function updateProgress(
  repository: LibraryRepository,
  input: UpdateProgressInput,
): Result<LibraryEntry, LibraryFailure> {
  const id = parseLibraryEntryId(input.id);
  if (id === undefined) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  const openedAt = parseTimestamp(input.openedAt);
  const page = parseProgressPage(input.page);
  if (openedAt === undefined || page === undefined) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  const updated = repository.updateProgress(id, {
    openedAt,
    progressPage: page,
  });
  if (!updated.ok) {
    return updated;
  }
  return { ok: true, value: toLibraryEntry(updated.value) };
}
