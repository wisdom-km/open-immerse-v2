declare const documentIdBrand: unique symbol;
export type DocumentId = string & { readonly [documentIdBrand]: "DocumentId" };

declare const pageRevisionIdBrand: unique symbol;
export type PageRevisionId = string & { readonly [pageRevisionIdBrand]: "PageRevisionId" };

declare const blockIdBrand: unique symbol;
export type BlockId = string & { readonly [blockIdBrand]: "BlockId" };

declare const jobIdBrand: unique symbol;
export type JobId = string & { readonly [jobIdBrand]: "JobId" };

declare const assetIdBrand: unique symbol;
export type AssetId = string & { readonly [assetIdBrand]: "AssetId" };

declare const reservationIdBrand: unique symbol;
export type ReservationId = string & { readonly [reservationIdBrand]: "ReservationId" };
