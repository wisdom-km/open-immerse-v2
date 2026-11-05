import type { LibraryEntry } from "@oi/contracts";

import { expect, it } from "vitest";

import { createLibraryIpcHandlers } from "../../src/adapters/ipc-handlers.js";
import {
  libraryFailure,
  parseLibraryEntryId,
  type ImportPdfResult,
} from "../../src/index.js";
import { createFakePdfPicker } from "../../src/testing/fake-pdf-picker.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID_A = "a".repeat(64);

function entry(): LibraryEntry {
  const id = parseLibraryEntryId(ID_A);
  if (id === undefined) {
    throw new Error("id");
  }
  return {
    id,
    fileName: "paper.pdf",
    title: "paper",
    addedAt: "2026-01-01T00:00:00.000Z",
    openedAt: null,
  };
}

it("returns cancelled and does not import when the dialog is dismissed", async () => {
  let calls = 0;
  const handlers = createLibraryIpcHandlers({
    importPdf() {
      calls += 1;
      return { ok: false, error: libraryFailure("rejected") };
    },
    listLibrary() {
      return { ok: true, value: [] };
    },
    relocateSource() {
      return { ok: false, error: libraryFailure("not_found") };
    },
    pickPdf: createFakePdfPicker([{ kind: "cancelled" }]),
  });
  const result = await handlers.import({});
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toEqual({ code: "cancelled", retryable: false });
  }
  expect(calls).toBe(0);
});

it("imports the dropped path and omits that path from the result", async () => {
  const seen: string[] = [];
  const picker = createFakePdfPicker([]);
  const handlers = createLibraryIpcHandlers({
    importPdf(sourcePath) {
      seen.push(sourcePath);
      return { ok: false, error: libraryFailure("not_pdf") };
    },
    listLibrary() {
      return { ok: true, value: [] };
    },
    relocateSource() {
      return { ok: false, error: libraryFailure("not_found") };
    },
    pickPdf: picker,
  });
  const result = await handlers.importDropped("/tmp/drop.pdf");
  expect(seen).toEqual(["/tmp/drop.pdf"]);
  expect(picker.calls()).toBe(0);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toEqual({ code: "not_pdf", retryable: false });
  }
  expect(pathLeaks(result, ["/tmp"])).toEqual([]);
});

it("maps a cancelled drop to handler_threw when importDropped has no cancel code", async () => {
  const handlers = createLibraryIpcHandlers({
    importPdf() {
      return { ok: false, error: libraryFailure("cancelled") };
    },
    listLibrary() {
      return { ok: true, value: [] };
    },
    relocateSource() {
      return { ok: false, error: libraryFailure("not_found") };
    },
    pickPdf: createFakePdfPicker([]),
  });
  const result = await handlers.importDropped("/tmp/drop.pdf");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toEqual({ code: "handler_threw", retryable: true });
  }
});

it("passes view and sort to the list use case", async () => {
  const seen: unknown[] = [];
  const handlers = createLibraryIpcHandlers({
    importPdf() {
      return { ok: false, error: libraryFailure("rejected") };
    },
    listLibrary(input) {
      seen.push(input);
      return { ok: true, value: [entry()] };
    },
    relocateSource() {
      return { ok: false, error: libraryFailure("not_found") };
    },
    pickPdf: createFakePdfPicker([]),
  });
  const result = await handlers.list({
    view: "all",
    sort: { field: "title", dir: "asc" },
  });
  expect(seen).toEqual([{ view: "all", sort: { field: "title", dir: "asc" } }]);
  expect(result.ok && result.value[0]?.fileName).toBe("paper.pdf");
  expect(pathLeaks(result, [])).toEqual([]);
});

it("returns cancelled and does not relocate when the dialog is dismissed", async () => {
  let calls = 0;
  const handlers = createLibraryIpcHandlers({
    importPdf() {
      return { ok: false, error: libraryFailure("rejected") };
    },
    listLibrary() {
      return { ok: true, value: [] };
    },
    relocateSource() {
      calls += 1;
      return { ok: false, error: libraryFailure("not_found") };
    },
    pickPdf: createFakePdfPicker([{ kind: "cancelled" }]),
  });
  const result = await handlers.relocate({ id: ID_A });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toEqual({ code: "cancelled", retryable: false });
  }
  expect(calls).toBe(0);
});

it("relocate returns the entry without a path when the chosen file matches", async () => {
  const handlers = createLibraryIpcHandlers({
    importPdf() {
      return { ok: false, error: libraryFailure("rejected") };
    },
    listLibrary() {
      return { ok: true, value: [] };
    },
    relocateSource(input) {
      expect(input).toEqual({ id: ID_A, filePath: "/chosen/paper.pdf" });
      const value: ImportPdfResult = { entry: entry(), duplicate: false };
      return { ok: true, value: { entry: value.entry } };
    },
    pickPdf: createFakePdfPicker([
      { kind: "chosen", filePath: "/chosen/paper.pdf" },
    ]),
  });
  const result = await handlers.relocate({ id: ID_A });
  expect(result.ok && result.value.entry.fileName).toBe("paper.pdf");
  expect(pathLeaks(result, ["/chosen"])).toEqual([]);
});
