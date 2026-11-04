import { expect, it } from "vitest";

import { parseJobId, sameJobId } from "../../src/index.js";

function jobId(value: string) {
  const parsed = parseJobId(value);
  if (!parsed.ok) {
    throw new Error("expected a job id");
  }
  return parsed.value;
}

it("returns true when the two ids are equal", () => {
  expect(sameJobId(jobId("job-1"), jobId("job-1"))).toBe(true);
});

it("returns false when the two ids differ", () => {
  expect(sameJobId(jobId("job-1"), jobId("job-2"))).toBe(false);
});
