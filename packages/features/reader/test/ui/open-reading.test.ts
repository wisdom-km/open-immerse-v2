import { expect, it } from "vitest";

import { MISSING_DOCUMENT, UNREADABLE_PDF } from "../../src/ui/copy.js";
import { openReading } from "../../src/ui/open-reading.js";
import type { ReaderClient } from "../../src/ui/reader-client.js";
import { visiblePage } from "../../src/ui/visible-page.js";

it("takes the taller overlap and the smaller page when heights match", () => {
  expect(
    visiblePage([
      { page: 2, overlap: 40 },
      { page: 1, overlap: 40 },
      { page: 3, overlap: 10 },
    ]),
  ).toBe(1);
  expect(
    visiblePage([
      { page: 1, overlap: 10 },
      { page: 2, overlap: 30 },
    ]),
  ).toBe(2);
});

it("calls bind only after openDocument resolves", async () => {
  const calls: string[] = [];
  let releaseOpen: (() => void) | undefined;
  const opened = new Promise<void>((resolve) => {
    releaseOpen = resolve;
  });
  const client = fakeClient({
    openDocument() {
      calls.push("open");
      return opened.then(() => ({ ok: true as const }));
    },
    bind(id) {
      calls.push("bind");
      return Promise.resolve({
        ok: true as const,
        id,
        assetId: "asset",
        generation: 2,
      });
    },
    readPage(id, generation) {
      calls.push("read");
      return Promise.resolve({
        ok: true as const,
        id,
        generation,
        progressPage: 1,
      });
    },
  });
  const pending = openReading(client, "paper");
  await Promise.resolve();
  expect(calls).toEqual(["open"]);
  releaseOpen?.();
  await pending;
  expect(calls).toEqual(["open", "bind", "read"]);
});

it("starts at page 1 when the stored page is null and does not write", async () => {
  const writes: number[] = [];
  const view = await openReading(
    fakeClient({
      readPage(id, generation) {
        return Promise.resolve({
          ok: true as const,
          id,
          generation,
          progressPage: null,
        });
      },
      writePage(_id, _generation, page) {
        writes.push(page);
        return Promise.resolve();
      },
    }),
    "paper",
  );
  expect(view.page).toBe(1);
  expect(view.lostPlace).toBe(false);
  expect(view.sentence).toBeUndefined();
  expect(writes).toEqual([]);
});

it("shows the clamped page and does not write before settle", async () => {
  const writes: number[] = [];
  const view = await openReading(
    fakeClient({
      readPage(id, generation) {
        return Promise.resolve({
          ok: true as const,
          id,
          generation,
          progressPage: 9,
        });
      },
      openPdf() {
        return Promise.resolve({ pageCount: 2, paint });
      },
      writePage(_id, _generation, page) {
        writes.push(page);
        return Promise.resolve();
      },
    }),
    "paper",
  );
  expect(view.page).toBe(2);
  expect(view.pageCount).toBe(2);
  expect(writes).toEqual([]);
});

it("starts at page 1 with the lost-place flag when the read fails", async () => {
  const view = await openReading(
    fakeClient({
      readPage() {
        return Promise.resolve({ ok: false as const, code: "rejected" });
      },
    }),
    "paper",
  );
  expect(view.page).toBe(1);
  expect(view.lostPlace).toBe(true);
  expect(view.sentence).toBeUndefined();
});

it("uses the missing sentence for not_found and does not bind", async () => {
  const calls: string[] = [];
  const view = await openReading(
    fakeClient({
      openDocument() {
        return Promise.resolve({ ok: false as const, code: "not_found" });
      },
      bind() {
        calls.push("bind");
        return Promise.resolve({ ok: false as const, code: "not_found" });
      },
    }),
    "paper",
  );
  expect(view.sentence).toBe(MISSING_DOCUMENT);
  expect(calls).toEqual([]);
});

it("uses the unreadable sentence for every other open failure", async () => {
  const view = await openReading(
    fakeClient({
      openDocument() {
        return Promise.resolve({
          ok: false as const,
          code: "handler_threw",
        });
      },
    }),
    "paper",
  );
  expect(view.sentence).toBe(UNREADABLE_PDF);
});

it("ignores a progress response for another pair", async () => {
  const view = await openReading(
    fakeClient({
      readPage() {
        return Promise.resolve({
          ok: true as const,
          id: "other",
          generation: 9,
          progressPage: 4,
        });
      },
    }),
    "paper",
  );
  expect(view.page).toBe(1);
  expect(view.lostPlace).toBe(true);
});

function paint(): Promise<void> {
  return Promise.resolve();
}

function fakeClient(over: Partial<ReaderClient>): ReaderClient {
  return {
    openDocument() {
      return Promise.resolve({ ok: true as const });
    },
    bind(id) {
      return Promise.resolve({
        ok: true as const,
        id,
        assetId: "asset",
        generation: 1,
      });
    },
    readPage(id, generation) {
      return Promise.resolve({
        ok: true as const,
        id,
        generation,
        progressPage: 1,
      });
    },
    writePage() {
      return Promise.resolve();
    },
    revoke() {
      return Promise.resolve();
    },
    openPdf() {
      return Promise.resolve({ pageCount: 3, paint });
    },
    ...over,
  };
}
