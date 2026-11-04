import { expect, it } from "vitest";

import * as seam from "../../src/index.js";
import * as view from "../../src/pure.js";

it("exports the source-span seam and not the parser", () => {
  expect(Object.keys(seam).sort()).toEqual([
    "calloutType",
    "extractMath",
    "formulaBlocked",
    "headingSlug",
    "listOwned",
    "mathCuts",
    "overFormulaBudget",
    "renderMarkdown",
    "serialize",
    "skipRanges",
    "toHtmlBlocked",
    "wikiCuts",
  ]);
  expect(Object.keys(view)).toEqual(["sliceSource"]);
});
