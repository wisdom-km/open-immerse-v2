import { expectTypeOf, it } from "vitest";

import type { MdFormulaCrop } from "../src/markdown.js";
import type { FormulaCropRef, StoredTranslationBlock, TranslationBlockChanged } from "../src/translation.js";

it("stores unverified formulas in crops and keeps markdown a string", () => {
  expectTypeOf<StoredTranslationBlock["markdown"]>().toEqualTypeOf<string | null>();
  expectTypeOf<StoredTranslationBlock["crops"]>().toEqualTypeOf<readonly FormulaCropRef[]>();
  expectTypeOf<FormulaCropRef["kind"]>().toEqualTypeOf<"crop" | "page_link">();
  expectTypeOf<FormulaCropRef["assetId"]>().not.toEqualTypeOf<FormulaCropRef["page"]>();
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
