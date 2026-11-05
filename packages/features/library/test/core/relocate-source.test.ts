import { expect, it } from "vitest";

import {
  createRelocateSource,
  libraryFailure,
  type LibraryFailure,
} from "../../src/index.js";
import {
  createFakeLibraryRepository,
  seedLibrary,
} from "../../src/testing/fake-library-repository.js";
import {
  createFakePdfFileStore,
  inspectedPdf,
} from "../../src/testing/fake-pdf-file-store.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID_A = "a".repeat(64);
const ID_B = "b".repeat(64);

function relocate(
  inspected:
    | ReturnType<typeof inspectedPdf>
    | { ok: false; error: LibraryFailure },
) {
  const repository = createFakeLibraryRepository();
  seedLibrary(repository, {
    id: ID_A,
    fileName: "paper.pdf",
    title: "paper",
    originalPath: "/old/paper.pdf",
    addedAt: "2026-01-01T00:00:00.000Z",
    openedAt: null,
    progressPage: null,
  });
  const files = createFakePdfFileStore({ inspected });
  const run = createRelocateSource({ repository, files });
  return { repository, files, run };
}

it("updates the stored original path when the chosen file has the same sha", () => {
  const ctx = relocate(inspectedPdf(ID_A, "moved.pdf"));
  const result = ctx.run({ id: ID_A, filePath: "/new/moved.pdf" });
  expect(result.ok && result.value.entry.fileName).toBe("moved.pdf");
  expect(result.ok && result.value.entry.id).toBe(ID_A);
  expect(Object.keys(result.ok ? result.value.entry : {})).not.toContain(
    "originalPath",
  );
  expect(ctx.repository.records()[0]?.originalPath).toBe("/new/moved.pdf");
  expect(ctx.files.counts().placed).toBe(0);
  expect(pathLeaks(result, ["/new", "/old"])).toEqual([]);
});

it("returns hash_mismatch when the chosen file has a different sha", () => {
  const ctx = relocate(inspectedPdf(ID_B, "other.pdf"));
  const result = ctx.run({ id: ID_A, filePath: "/new/other.pdf" });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe("hash_mismatch");
  }
  expect(ctx.repository.records()[0]?.originalPath).toBe("/old/paper.pdf");
  expect(ctx.files.counts().placed).toBe(0);
});

it("returns not_found when the id is absent", () => {
  const ctx = relocate(inspectedPdf(ID_A, "moved.pdf"));
  const result = ctx.run({ id: ID_B, filePath: "/new/moved.pdf" });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toEqual(libraryFailure("not_found"));
  }
});

it("returns not_pdf when the chosen file is not a pdf", () => {
  const ctx = relocate({ ok: false, error: libraryFailure("not_pdf") });
  const result = ctx.run({ id: ID_A, filePath: "/new/notes.txt" });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.code).toBe("not_pdf");
  }
  expect(pathLeaks(result, ["/new"])).toEqual([]);
});
