import { expectTypeOf, it } from "vitest";

import type { AssetId } from "../src/ids.js";
import type { MdFormulaCrop } from "../src/markdown.js";
import type { FormulaCropRef, StoredTranslationBlock, TranslationBlockChanged } from "../src/translation.js";

it("stores unverified formulas in crops and keeps markdown a string", () => {
  expectTypeOf<StoredTranslationBlock["markdown"]>().toEqualTypeOf<string | null>();
  expectTypeOf<StoredTranslationBlock["crops"]>().toEqualTypeOf<readonly FormulaCropRef[]>();
  expectTypeOf<FormulaCropRef["kind"]>().toEqualTypeOf<"crop" | "page_link">();
  type Crop = Extract<FormulaCropRef, { kind: "crop" }>;
  expectTypeOf<Crop["assetId"]>().toEqualTypeOf<AssetId>();
});

it("rejects a crop ref that has no assetId", () => {
  // @ts-expect-error crop requires assetId
  const crop: FormulaCropRef = {
    fragmentId: "f",
    at: 0,
    display: "inline",
    kind: "crop",
  };
  expectTypeOf(crop).toExtend<FormulaCropRef>();
});

it("publishes block changes without the stored markdown body", () => {
  expectTypeOf<TranslationBlockChanged["status"]>().toEqualTypeOf<StoredTranslationBlock["status"]>();
  expectTypeOf<TranslationBlockChanged["failureKind"]>().toEqualTypeOf<
    StoredTranslationBlock["failureKind"]
  >();
  type HasMarkdown = "markdown" extends keyof TranslationBlockChanged ? true : false;
  expectTypeOf<HasMarkdown>().toEqualTypeOf<false>();
});

it("keeps a stored crop ref distinct from the document crop node", () => {
  expectTypeOf<FormulaCropRef>().not.toEqualTypeOf<MdFormulaCrop>();
});
