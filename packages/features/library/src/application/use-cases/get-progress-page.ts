import type { Result } from "@oi/kernel";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../../domain/library-failure.js";
import type { LibraryRepository } from "../ports/library-repository.js";

export type GetProgressPageInput = {
  readonly id: string;
};

export type GetProgressPageValue = {
  readonly id: LibraryEntryId;
  readonly progressPage: number | null;
};

export type GetProgressPage = (
  input: GetProgressPageInput,
) => Result<GetProgressPageValue, LibraryFailure>;

export function createGetProgressPage(
  repository: Pick<LibraryRepository, "findById">,
): GetProgressPage {
  return (input) => getProgressPage(repository, input);
}

function getProgressPage(
  repository: Pick<LibraryRepository, "findById">,
  input: GetProgressPageInput,
): Result<GetProgressPageValue, LibraryFailure> {
  const id = parseLibraryEntryId(input.id);
  if (id === undefined) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  const found = repository.findById(id);
  if (!found.ok) {
    return found;
  }
  if (found.value === null) {
    return { ok: false, error: libraryFailure("not_found") };
  }
  return {
    ok: true,
    value: { id, progressPage: found.value.progressPage },
  };
}
