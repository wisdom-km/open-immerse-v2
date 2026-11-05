import type { LibraryEntry } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import type { LibraryFailure } from "../../domain/library-failure.js";
import type { LibraryListInput } from "../../domain/library-order.js";
import { orderLibraryEntries } from "../../domain/library-order.js";
import { toLibraryEntry } from "../../domain/library-record.js";
import type { LibraryRepository } from "../ports/library-repository.js";

export type ListLibraryInput = LibraryListInput;

export type ListLibrary = (
  input: ListLibraryInput,
) => Result<LibraryEntry[], LibraryFailure>;

export function createListLibrary(repository: LibraryRepository): ListLibrary {
  return (input) => listLibrary(repository, input);
}

function listLibrary(
  repository: LibraryRepository,
  input: ListLibraryInput,
): Result<LibraryEntry[], LibraryFailure> {
  const rows = repository.list();
  if (!rows.ok) {
    return rows;
  }
  return {
    ok: true,
    value: orderLibraryEntries(rows.value.map(toLibraryEntry), input),
  };
}
