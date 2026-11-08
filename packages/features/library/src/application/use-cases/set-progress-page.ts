import type { Result } from "@oi/kernel";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../../domain/library-failure.js";
import type { LibraryProgressPageUpdate } from "../ports/library-repository.js";

export type SetProgressPageInput = {
  readonly id: string;
  readonly progressPage: number;
};

export type SetProgressPageValue = {
  readonly id: LibraryEntryId;
  readonly progressPage: number;
};

export type SetProgressPage = (
  input: SetProgressPageInput,
) => Result<SetProgressPageValue, LibraryFailure>;

export function createSetProgressPage(
  repository: LibraryProgressPageUpdate,
): SetProgressPage {
  return (input) => setProgressPage(repository, input);
}

function setProgressPage(
  repository: LibraryProgressPageUpdate,
  input: SetProgressPageInput,
): Result<SetProgressPageValue, LibraryFailure> {
  const id = parseLibraryEntryId(input.id);
  if (id === undefined) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  if (!isSafeProgressPage(input.progressPage)) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  const written = repository.updateProgressPage(id, input.progressPage);
  if (!written.ok) {
    return written;
  }
  return {
    ok: true,
    value: { id, progressPage: input.progressPage },
  };
}

function isSafeProgressPage(page: unknown): page is number {
  return typeof page === "number" && Number.isSafeInteger(page) && page >= 1;
}
