import { expectTypeOf, it } from "vitest";

import type { AssetId, BlockId, DocumentId, JobId, PageRevisionId, ReservationId } from "../src/ids.js";

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const documentDiffersFromPage: Equal<DocumentId, PageRevisionId> = false;
const pageDiffersFromBlock: Equal<PageRevisionId, BlockId> = false;
const blockDiffersFromJob: Equal<BlockId, JobId> = false;
const jobDiffersFromAsset: Equal<JobId, AssetId> = false;
const assetDiffersFromReservation: Equal<AssetId, ReservationId> = false;
const documentDiffersFromString: Equal<DocumentId, string> = false;

it("keeps branded ids distinct", () => {
  expectTypeOf(documentDiffersFromPage).toEqualTypeOf<false>();
  expectTypeOf(pageDiffersFromBlock).toEqualTypeOf<false>();
  expectTypeOf(blockDiffersFromJob).toEqualTypeOf<false>();
  expectTypeOf(jobDiffersFromAsset).toEqualTypeOf<false>();
  expectTypeOf(assetDiffersFromReservation).toEqualTypeOf<false>();
  expectTypeOf(documentDiffersFromString).toEqualTypeOf<false>();
});
