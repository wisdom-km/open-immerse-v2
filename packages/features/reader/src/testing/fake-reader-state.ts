import type { LibraryEntryId } from "@oi/contracts";

import type {
  OpenReader,
  ReaderState,
} from "../application/ports/reader-state.js";

export function createFakeReaderState(): ReaderState {
  const rows = new Map<LibraryEntryId, OpenReader>();
  return {
    find(id) {
      return rows.get(id);
    },
    save(reader) {
      rows.set(reader.id, reader);
    },
  };
}
