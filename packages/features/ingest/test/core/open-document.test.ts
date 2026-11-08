import { createListLibrary, createUpdateProgress } from "@oi/feature-library";
import { expect, it } from "vitest";

import {
  createOpenDocument,
  openFailure,
  type OpenDocument,
} from "../../src/index.js";
import { createFakeOpenings } from "../../src/testing/fake-openings.js";
import { createFixedClock } from "../../src/testing/fixed-clock.js";
import { createFixedJobIds } from "../../src/testing/fixed-job-ids.js";
import {
  createIngestLibrary,
  type IngestLibrary,
} from "../../src/testing/fake-ingest-library.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID = "a".repeat(64);
const PATH = "/library-source/paper.pdf";
const OPENED_MS = Date.parse("2026-02-02T00:00:00.000Z");
const LATER_MS = Date.parse("2026-02-03T00:00:00.000Z");
const OPENED = "2026-02-02T00:00:00.000Z";
const LATER = "2026-02-03T00:00:00.000Z";

type Harness = {
  readonly library: IngestLibrary;
  readonly openings: ReturnType<typeof createFakeOpenings>;
  readonly jobIds: ReturnType<typeof createFixedJobIds>;
  readonly open: OpenDocument;
};

function harness(options?: {
  readonly page?: number | null;
  readonly times?: readonly number[];
  readonly present?: boolean;
}): Harness {
  const library = createIngestLibrary();
  if (options?.present !== false) {
    library.seed({
      id: ID,
      fileName: "paper.pdf",
      title: "paper",
      originalPath: PATH,
      addedAt: "2026-01-01T00:00:00.000Z",
      openedAt: null,
      progressPage: options?.page ?? null,
    });
  }
  const jobIds = createFixedJobIds(["job-1", "job-2"]);
  const openings = createFakeOpenings();
  const open = createOpenDocument({
    lookup: library.lookup,
    updateProgress: createUpdateProgress(library.repository),
    clock: createFixedClock(options?.times ?? [OPENED_MS, LATER_MS]),
    jobIds,
    openings,
  });
  return { library, openings, jobIds, open };
}

function recentIds(library: IngestLibrary): readonly string[] {
  const recent = createListLibrary(library.repository)({ view: "recent" });
  return recent.ok ? recent.value.map((entry) => entry.id) : [];
}

it("AC-11 returns a job id when the library has the id and no parser is wired", () => {
  const { open } = harness();
  const result = open({ id: ID });
  expect(result.ok && result.value.jobId).toBe("job-1");
  expect(pathLeaks(result, [PATH])).toEqual([]);
  expect(JSON.stringify(result)).not.toContain("originalPath");
});

it("AC-01 returns the same job id when the same instance opens the id twice", () => {
  const { open, jobIds } = harness();
  const first = open({ id: ID });
  const second = open({ id: ID });
  expect(first.ok).toBe(true);
  expect(second.ok).toBe(true);
  if (first.ok && second.ok) {
    expect(first.value.jobId).toBe(second.value.jobId);
  }
  expect(jobIds.calls()).toBe(1);
});

it("records openedAt when the open succeeds", () => {
  const { library, open } = harness();
  open({ id: ID });
  expect(recentIds(library)).toEqual([ID]);
  expect(library.records()[0]?.openedAt).toBe(OPENED);
});

it("keeps a null progress page when the open succeeds", () => {
  const { library, open } = harness({ page: null });
  const result = open({ id: ID });
  expect(result.ok).toBe(true);
  expect(library.records()[0]?.progressPage).toBeNull();
});

it("keeps a stored progress page when the open succeeds", () => {
  const { library, open } = harness({ page: 4 });
  const result = open({ id: ID });
  expect(result.ok).toBe(true);
  expect(library.records()[0]?.progressPage).toBe(4);
  expect(library.records()[0]?.openedAt).toBe(OPENED);
});

it("rewrites openedAt and keeps the page when the same id is opened again", () => {
  const { library, open, jobIds } = harness({ page: 4 });
  const first = open({ id: ID });
  const second = open({ id: ID });
  expect(first.ok).toBe(true);
  expect(second.ok).toBe(true);
  if (first.ok && second.ok) {
    expect(second.value.jobId).toBe(first.value.jobId);
  }
  expect(jobIds.calls()).toBe(1);
  expect(library.records()[0]?.openedAt).toBe(LATER);
  expect(library.records()[0]?.progressPage).toBe(4);
});

it("returns not_found when the id is not 64 lowercase hex", () => {
  const { library, jobIds, open } = harness();
  const result = open({ id: "NOPE" });
  expect(result).toEqual({ ok: false, error: openFailure("not_found") });
  expect(library.progressWrites()).toBe(0);
  expect(jobIds.calls()).toBe(0);
  expect(library.records()[0]?.openedAt).toBeNull();
  expect(pathLeaks(result, [PATH])).toEqual([]);
});

it("returns not_found when the library has no row", () => {
  const { library, jobIds, open } = harness({ present: false });
  const result = open({ id: ID });
  expect(result).toEqual({ ok: false, error: openFailure("not_found") });
  expect(library.progressWrites()).toBe(0);
  expect(jobIds.calls()).toBe(0);
  expect(pathLeaks(result, [PATH])).toEqual([]);
});

it("returns rejected when lookup fails and does not allocate a job id", () => {
  const { library, jobIds, open } = harness();
  library.failLookup("rejected");
  const result = open({ id: ID });
  expect(result).toEqual({ ok: false, error: openFailure("rejected") });
  expect(library.progressWrites()).toBe(0);
  expect(jobIds.calls()).toBe(0);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect("message" in result.error).toBe(false);
  }
});

it("returns rejected when formatUtc throws RangeError for 9e15", () => {
  const { library, jobIds, open } = harness({ times: [9e15] });
  const result = open({ id: ID });
  expect(result).toEqual({ ok: false, error: openFailure("rejected") });
  expect(library.progressWrites()).toBe(0);
  expect(jobIds.calls()).toBe(0);
  expect(library.records()[0]?.openedAt).toBeNull();
  expect(library.records()[0]?.progressPage).toBeNull();
  expect(pathLeaks(result, [PATH, "Invalid time value"])).toEqual([]);
  expect(JSON.stringify(result)).not.toContain("originalPath");
});

it("returns rejected when the clock is not finite", () => {
  const { library, jobIds, open } = harness({
    times: [Number.POSITIVE_INFINITY],
  });
  const result = open({ id: ID });
  expect(result).toEqual({ ok: false, error: openFailure("rejected") });
  expect(library.progressWrites()).toBe(0);
  expect(jobIds.calls()).toBe(0);
});

it("keeps the job id when a later clock is outside the Date range", () => {
  const { library, openings, jobIds, open } = harness({
    page: 4,
    times: [OPENED_MS, 9e15],
  });
  const first = open({ id: ID });
  const second = open({ id: ID });
  expect(first.ok && first.value.jobId).toBe("job-1");
  expect(second).toEqual({ ok: false, error: openFailure("rejected") });
  expect(jobIds.calls()).toBe(1);
  expect(library.progressWrites()).toBe(1);
  expect(library.records()[0]?.openedAt).toBe(OPENED);
  expect(library.records()[0]?.progressPage).toBe(4);
  const id = library.records()[0]?.id;
  expect(id !== undefined && openings.find(id)).toBe("job-1");
});

it("returns not_found and reuses the job id when progress is missing at write time", () => {
  const { library, openings, jobIds, open } = harness({ page: 4 });
  library.failNextProgress("not_found");
  const failed = open({ id: ID });
  expect(failed).toEqual({ ok: false, error: openFailure("not_found") });
  expect(failed.ok).toBe(false);
  expect(library.progressWrites()).toBe(1);
  expect(library.records()[0]?.openedAt).toBeNull();
  expect(library.records()[0]?.progressPage).toBe(4);
  expect(pathLeaks(failed, [PATH])).toEqual([]);
  const again = open({ id: ID });
  expect(again.ok && again.value.jobId).toBe("job-1");
  expect(jobIds.calls()).toBe(1);
  const id = library.records()[0]?.id;
  expect(id !== undefined && openings.find(id)).toBe("job-1");
  expect(library.records()[0]?.progressPage).toBe(4);
  expect(library.records()[0]?.openedAt).toBe(LATER);
});

it("returns rejected and reuses the job id when the progress write is rejected", () => {
  const { library, jobIds, open } = harness();
  library.failNextProgress("rejected");
  const failed = open({ id: ID });
  expect(failed).toEqual({ ok: false, error: openFailure("rejected") });
  expect(failed.ok).toBe(false);
  expect(JSON.stringify(failed)).not.toContain("message");
  expect(pathLeaks(failed, [PATH])).toEqual([]);
  const again = open({ id: ID });
  expect(again.ok && again.value.jobId).toBe("job-1");
  expect(jobIds.calls()).toBe(1);
});
