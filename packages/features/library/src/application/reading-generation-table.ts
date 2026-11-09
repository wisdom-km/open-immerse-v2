import type { LibraryEntryId } from "../domain/document-identity.js";

export type ReadingGenerationLookup = {
  matches(id: LibraryEntryId, generation: number): boolean;
};

export type ReadingGenerationAdoption =
  | { readonly ok: true; readonly assetId: string; readonly generation: number }
  | { readonly ok: false; readonly reason: "exhausted" };

export type ReadingGenerationTable = ReadingGenerationLookup & {
  bind(id: LibraryEntryId): ReadingGenerationAdoption;
  revoke(id: LibraryEntryId, generation: number): boolean;
};

type CurrentGeneration = {
  readonly assetId: string;
  readonly generation: number;
};

/**
 * 不传参数时是空表。传入 id 时，该 id 的当前代际放在安全整数上界，
 * 只供上界测试证明下一次 bind 不回绕。生产调用不传这个参数。
 */
export function createReadingGenerationTable(
  atCeiling?: LibraryEntryId,
): ReadingGenerationTable {
  const rows = new Map<LibraryEntryId, CurrentGeneration>();
  const issued = { next: 1 };
  if (atCeiling !== undefined) {
    rows.set(atCeiling, {
      assetId: "1",
      generation: Number.MAX_SAFE_INTEGER,
    });
    issued.next = 2;
  }
  return {
    matches(id, generation) {
      return rows.get(id)?.generation === generation;
    },
    bind(id) {
      return adopt(rows, issued, id);
    },
    revoke(id, generation) {
      if (rows.get(id)?.generation !== generation) {
        return false;
      }
      rows.delete(id);
      return true;
    },
  };
}

function adopt(
  rows: Map<LibraryEntryId, CurrentGeneration>,
  issued: { next: number },
  id: LibraryEntryId,
): ReadingGenerationAdoption {
  const previous = rows.get(id);
  const generation = previous === undefined ? 1 : previous.generation + 1;
  if (!Number.isSafeInteger(generation) || generation < 1) {
    return { ok: false, reason: "exhausted" };
  }
  const assetId = String(issued.next);
  issued.next += 1;
  rows.set(id, { assetId, generation });
  return { ok: true, assetId, generation };
}
