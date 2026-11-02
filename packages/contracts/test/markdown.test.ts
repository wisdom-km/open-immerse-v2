import { expectTypeOf, it } from "vitest";

import type { AssetId } from "../src/ids.js";
import type { MdFormulaCrop } from "../src/markdown.js";

type CropArm = Extract<MdFormulaCrop, { assetId: AssetId }>;
type PageLinkArm = Extract<MdFormulaCrop, { kind: "page_link" }>;

it("types a crop node with an asset and no page-link kind", () => {
  expectTypeOf<CropArm["type"]>().toEqualTypeOf<"formula_crop">();
  expectTypeOf<CropArm["display"]>().toEqualTypeOf<"inline" | "block">();
  expectTypeOf<CropArm["assetId"]>().toEqualTypeOf<AssetId>();
  type CropHasKind = "kind" extends keyof CropArm ? true : false;
  expectTypeOf<CropHasKind>().toEqualTypeOf<false>();
});

it("types a page-link node with a page and no asset", () => {
  expectTypeOf<PageLinkArm["kind"]>().toEqualTypeOf<"page_link">();
  expectTypeOf<PageLinkArm["page"]>().toEqualTypeOf<number>();
  type PageHasAsset = "assetId" extends keyof PageLinkArm ? true : false;
  expectTypeOf<PageHasAsset>().toEqualTypeOf<false>();
});
