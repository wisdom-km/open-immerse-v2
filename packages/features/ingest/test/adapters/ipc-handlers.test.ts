import { openDocument, type IngestOpenDocumentRequest } from "@oi/contracts";
import {
  createUpdateProgress,
  formatUtc,
  parseLibraryEntryId,
} from "@oi/feature-library";
import { expect, it } from "vitest";

import { createIngestIpcHandlers } from "../../src/adapters/ipc-handlers.js";
import { createOpenDocument } from "../../src/index.js";
import { createFakeOpenings } from "../../src/testing/fake-openings.js";
import { createFixedClock } from "../../src/testing/fixed-clock.js";
import { createFixedJobIds } from "../../src/testing/fixed-job-ids.js";
import { createIngestLibrary } from "../../src/testing/fake-ingest-library.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID = "b".repeat(64);
const PATH = "/library-source/paper.pdf";
const OPENED_MS = Date.parse("2026-02-02T00:00:00.000Z");
const LATER_MS = Date.parse("2026-02-03T00:00:00.000Z");

function request(id: string): IngestOpenDocumentRequest {
  return { id: id as IngestOpenDocumentRequest["id"] };
}

function harness(page: number | null = null) {
  const library = createIngestLibrary();
  library.seed({
    id: ID,
    fileName: "paper.pdf",
    title: "paper",
    originalPath: PATH,
    addedAt: "2026-01-01T00:00:00.000Z",
    openedAt: null,
    progressPage: page,
  });
  const jobIds = createFixedJobIds(["job-1", "job-2"]);
  const open = createOpenDocument({
    lookup: library.lookup,
    updateProgress: createUpdateProgress(library.repository),
    parseEntryId: parseLibraryEntryId,
    formatOpenedAt: formatUtc,
    clock: createFixedClock([OPENED_MS, LATER_MS]),
    jobIds,
    openings: createFakeOpenings(),
  });
  return {
    library,
    jobIds,
    handlers: createIngestIpcHandlers({ openDocument: open }),
  };
}

it("creates the openDocument handler for the exposed command", () => {
  const { handlers } = harness();
  expect(Object.keys(handlers)).toEqual(["openDocument"]);
  expect(openDocument.expose).toBe(true);
  expect(openDocument.idempotent).toBe(true);
  expect(openDocument.channel).toBe("ingest.openDocument");
});

it("returns the job id without originalPath when open succeeds", async () => {
  const { handlers, library } = harness(4);
  const result = await handlers.openDocument(request(ID));
  expect(result).toEqual({ ok: true, value: { jobId: "job-1" } });
  expect(pathLeaks(result, [PATH])).toEqual([]);
  expect(JSON.stringify(result)).not.toContain("originalPath");
  expect(library.records()[0]?.progressPage).toBe(4);
});

it("returns not_found without a message when the id is unknown", async () => {
  const { handlers } = harness();
  const result = await handlers.openDocument(request("c".repeat(64)));
  expect(result).toEqual({
    ok: false,
    error: { code: "not_found", retryable: false },
  });
  expect(pathLeaks(result, [PATH])).toEqual([]);
  expect(JSON.stringify(result)).not.toContain("message");
});

it("returns not_found and reuses the job id when progress is missing at write time", async () => {
  const { handlers, library, jobIds } = harness(4);
  library.failNextProgress("not_found");
  const failed = await handlers.openDocument(request(ID));
  expect(failed).toEqual({
    ok: false,
    error: { code: "not_found", retryable: false },
  });
  expect(failed.ok).toBe(false);
  expect(pathLeaks(failed, [PATH])).toEqual([]);
  expect(JSON.stringify(failed)).not.toContain("message");
  const again = await handlers.openDocument(request(ID));
  expect(again).toEqual({ ok: true, value: { jobId: "job-1" } });
  expect(jobIds.calls()).toBe(1);
  expect(library.records()[0]?.progressPage).toBe(4);
});

it("returns handler_threw without a message when the progress write is rejected", async () => {
  const { handlers, library, jobIds } = harness();
  library.failNextProgress("rejected");
  const failed = await handlers.openDocument(request(ID));
  expect(failed).toEqual({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
  expect(failed.ok).toBe(false);
  expect(JSON.stringify(failed)).not.toContain("message");
  expect(pathLeaks(failed, [PATH])).toEqual([]);
  const again = await handlers.openDocument(request(ID));
  expect(again).toEqual({ ok: true, value: { jobId: "job-1" } });
  expect(jobIds.calls()).toBe(1);
});

it("returns invalid_payload when the request has no id string", async () => {
  const { handlers } = harness();
  const result = await handlers.openDocument({ id: 4 } as never);
  expect(result).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
});
