import type { Result } from "@oi/kernel";

import { parseLibraryEntryId } from "../domain/document-identity.js";
import {
  libraryFailure,
  type LibraryFailure,
} from "../domain/library-failure.js";
import { parseFileName } from "../domain/library-record.js";
import type {
  InspectedPdf,
  PdfFileStore,
} from "../application/ports/pdf-file-store.js";

export type FakePdfCounts = {
  readonly placed: number;
  readonly removed: number;
};

export function inspectedPdf(
  id: string,
  fileName: string,
): Result<InspectedPdf, LibraryFailure> {
  const parsed = parseLibraryEntryId(id);
  const name = parseFileName(fileName);
  if (parsed === undefined || name === undefined) {
    return { ok: false, error: libraryFailure("rejected") };
  }
  return { ok: true, value: { id: parsed, fileName: name } };
}

export function createFakePdfFileStore(options: {
  readonly inspected: Result<InspectedPdf, LibraryFailure>;
  readonly place?: Result<void, LibraryFailure>;
}): PdfFileStore & { readonly counts: () => FakePdfCounts } {
  const state = { placed: 0, removed: 0 };
  return {
    counts() {
      return { placed: state.placed, removed: state.removed };
    },
    inspect() {
      return options.inspected;
    },
    placeCopy() {
      state.placed += 1;
      return options.place ?? { ok: true, value: undefined };
    },
    removeCopy() {
      state.removed += 1;
      return { ok: true, value: undefined };
    },
  };
}
