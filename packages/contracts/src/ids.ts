import type { Result } from "./result.js";

declare const documentIdBrand: unique symbol;
export type DocumentId = string & { readonly [documentIdBrand]: "DocumentId" };

declare const pageRevisionIdBrand: unique symbol;
export type PageRevisionId = string & {
  readonly [pageRevisionIdBrand]: "PageRevisionId";
};

declare const blockIdBrand: unique symbol;
export type BlockId = string & { readonly [blockIdBrand]: "BlockId" };

declare const jobIdBrand: unique symbol;
export type JobId = string & { readonly [jobIdBrand]: "JobId" };

declare const assetIdBrand: unique symbol;
export type AssetId = string & { readonly [assetIdBrand]: "AssetId" };

declare const reservationIdBrand: unique symbol;
export type ReservationId = string & {
  readonly [reservationIdBrand]: "ReservationId";
};

export type IdKind =
  | "DocumentId"
  | "PageRevisionId"
  | "BlockId"
  | "JobId"
  | "AssetId"
  | "ReservationId";

export type IdInvalid = {
  readonly code: "id_invalid";
  readonly kind: IdKind;
};

// §2.4: a branded id is a string at runtime. No charset, length, UUID, or sha256 rule is specified.
function parseId<T extends string>(
  value: unknown,
  kind: IdKind,
): Result<T, IdInvalid> {
  if (typeof value !== "string") {
    return { ok: false, error: { code: "id_invalid", kind } };
  }
  return { ok: true, value: value as T };
}

export function parseDocumentId(value: unknown): Result<DocumentId, IdInvalid> {
  return parseId(value, "DocumentId");
}

export function parsePageRevisionId(
  value: unknown,
): Result<PageRevisionId, IdInvalid> {
  return parseId(value, "PageRevisionId");
}

export function parseBlockId(value: unknown): Result<BlockId, IdInvalid> {
  return parseId(value, "BlockId");
}

export function parseJobId(value: unknown): Result<JobId, IdInvalid> {
  return parseId(value, "JobId");
}

export function parseAssetId(value: unknown): Result<AssetId, IdInvalid> {
  return parseId(value, "AssetId");
}

export function parseReservationId(
  value: unknown,
): Result<ReservationId, IdInvalid> {
  return parseId(value, "ReservationId");
}
