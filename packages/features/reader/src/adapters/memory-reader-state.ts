import type {
  OpenReader,
  ReaderState,
} from "../application/ports/reader-state.js";

export function createMemoryReaderState(): ReaderState {
  const rows = new Map<OpenReader["id"], OpenReader>();
  return {
    find(id) {
      return rows.get(id);
    },
    save(reader) {
      rows.set(reader.id, reader);
    },
  };
}
