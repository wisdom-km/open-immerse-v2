import { expect, it } from "vitest";

import * as seam from "../../src/index.js";
import * as view from "../../src/pure.js";

it("exports nothing when the slice has no use cases", () => {
  expect(Object.keys(seam)).toEqual([]);
  expect(Object.keys(view)).toEqual([]);
});
