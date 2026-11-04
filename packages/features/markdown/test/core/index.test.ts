import { expect, it } from "vitest";

import * as seam from "../../src/index.js";
import * as view from "../../src/pure.js";

it("exports the source-span seam and not the parser", () => {
  expect(Object.keys(seam).sort()).toEqual([
    "calloutType",
    "formulaBlocked",
    "headingSlug",
    "overFormulaBudget",
    "serialize",
    "toHtmlBlocked",
  ]);
  expect(Object.keys(view)).toEqual(["sliceSource"]);
});
