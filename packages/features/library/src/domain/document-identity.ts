import type { LibraryEntryId } from "@oi/contracts";

export type { LibraryEntryId } from "@oi/contracts";

const SHA256_HEX = /^[0-9a-f]{64}$/;

export type ImportIdentity =
  | { readonly kind: "duplicate"; readonly id: LibraryEntryId }
  | { readonly kind: "new"; readonly id: LibraryEntryId };

/** 64 位小写十六进制才是文献 id。大写与带分隔符的字符串都不是。 */
export function parseLibraryEntryId(value: string): LibraryEntryId | undefined {
  if (!SHA256_HEX.test(value)) {
    return undefined;
  }
  return value as LibraryEntryId;
}

/**
 * 已有同一 id 就是重复导入：不建新行。
 * existing 为 null，或与本次摘要不同，则是新文献。
 */
export function classifyImport(
  id: LibraryEntryId,
  existing: LibraryEntryId | null,
): ImportIdentity {
  if (existing !== null && existing === id) {
    return { kind: "duplicate", id };
  }
  return { kind: "new", id };
}
