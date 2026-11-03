import { expect, expectTypeOf, it } from "vitest";

import type {
  AssetId,
  BlockId,
  DocumentId,
  IdInvalid,
  IdKind,
  JobId,
  PageRevisionId,
  ReservationId,
} from "../src/ids.js";
import {
  parseAssetId,
  parseBlockId,
  parseDocumentId,
  parseJobId,
  parsePageRevisionId,
  parseReservationId,
} from "../src/ids.js";
import type { Result } from "../src/result.js";

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const documentDiffersFromPage: Equal<DocumentId, PageRevisionId> = false;
const pageDiffersFromBlock: Equal<PageRevisionId, BlockId> = false;
const blockDiffersFromJob: Equal<BlockId, JobId> = false;
const jobDiffersFromAsset: Equal<JobId, AssetId> = false;
const assetDiffersFromReservation: Equal<AssetId, ReservationId> = false;
const documentDiffersFromString: Equal<DocumentId, string> = false;

const cases: readonly {
  readonly kind: IdKind;
  readonly parse: (value: unknown) => Result<string, IdInvalid>;
}[] = [
  { kind: "DocumentId", parse: parseDocumentId },
  { kind: "PageRevisionId", parse: parsePageRevisionId },
  { kind: "BlockId", parse: parseBlockId },
  { kind: "JobId", parse: parseJobId },
  { kind: "AssetId", parse: parseAssetId },
  { kind: "ReservationId", parse: parseReservationId },
];

it("keeps branded ids distinct", () => {
  expectTypeOf(documentDiffersFromPage).toEqualTypeOf<false>();
  expectTypeOf(pageDiffersFromBlock).toEqualTypeOf<false>();
  expectTypeOf(blockDiffersFromJob).toEqualTypeOf<false>();
  expectTypeOf(jobDiffersFromAsset).toEqualTypeOf<false>();
  expectTypeOf(assetDiffersFromReservation).toEqualTypeOf<false>();
  expectTypeOf(documentDiffersFromString).toEqualTypeOf<false>();
});

it("brands the string when the value is a string", () => {
  for (const { kind, parse } of cases) {
    expect(parse(`id-${kind}`)).toEqual({ ok: true, value: `id-${kind}` });
  }
  expect(parseDocumentId("")).toEqual({ ok: true, value: "" });
  type ParsedDocument = Extract<ReturnType<typeof parseDocumentId>, { ok: true }>["value"];
  expectTypeOf<ParsedDocument>().toEqualTypeOf<DocumentId>();
});

it("returns id_invalid when the value is not a string", () => {
  for (const { kind, parse } of cases) {
    expect(parse(1)).toEqual({ ok: false, error: { code: "id_invalid", kind } });
    expect(parse(null)).toEqual({ ok: false, error: { code: "id_invalid", kind } });
    expect(parse(undefined)).toEqual({ ok: false, error: { code: "id_invalid", kind } });
  }
});
