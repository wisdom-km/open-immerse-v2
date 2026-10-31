import { expect, it } from "vitest";

import { sameJobId } from "../../src/index.js";

it("returns true when the two ids are equal", () => {
  expect(sameJobId("job-1", "job-1")).toBe(true);
});
