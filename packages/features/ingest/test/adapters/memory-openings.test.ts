import { parseJobId, type JobId, type LibraryEntryId } from "@oi/contracts";
import { parseLibraryEntryId } from "@oi/feature-library";
import { expect, it } from "vitest";

import { createMemoryOpenings } from "../../src/adapters/memory-openings.js";

const ID = "d".repeat(64);

function entryId(value: string): LibraryEntryId {
  const id = parseLibraryEntryId(value);
  if (id === undefined) {
    throw new Error("id");
  }
  return id;
}

function jobId(value: string): JobId {
  const parsed = parseJobId(value);
  if (!parsed.ok) {
    throw new Error("job id");
  }
  return parsed.value;
}

it("returns the stored job id when find is called on the same instance", () => {
  const openings = createMemoryOpenings();
  const id = entryId(ID);
  openings.remember(id, jobId("job-1"));
  expect(openings.find(id)).toBe("job-1");
});

it("does not share a job id when a new instance is created", () => {
  const first = createMemoryOpenings();
  const second = createMemoryOpenings();
  const id = entryId(ID);
  first.remember(id, jobId("job-1"));
  expect(second.find(id)).toBeUndefined();
});
