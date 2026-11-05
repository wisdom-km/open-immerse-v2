import { expect, it } from "vitest";

import {
  createListLibrary,
  createUpdateProgress,
  libraryFailure,
} from "../../src/index.js";
import {
  createFakeLibraryRepository,
  seedLibrary,
} from "../../src/testing/fake-library-repository.js";

const ID_A = "a".repeat(64);
const OPENED = "2026-02-02T00:00:00.000Z";

function repository() {
  const stored = createFakeLibraryRepository();
  seedLibrary(stored, {
    id: ID_A,
    fileName: "paper.pdf",
    title: "paper",
    originalPath: "/library-source/paper.pdf",
    addedAt: "2026-01-01T00:00:00.000Z",
    openedAt: null,
    progressPage: null,
  });
  return stored;
}

it("makes the entry visible in recent when openedAt is recorded", () => {
  const stored = repository();
  const updated = createUpdateProgress(stored)({
    id: ID_A,
    openedAt: OPENED,
    page: 3,
  });
  const recent = createListLibrary(stored)({ view: "recent" });
  expect(updated.ok && updated.value.openedAt).toBe(OPENED);
  expect(updated.ok && Object.keys(updated.value)).not.toContain(
    "originalPath",
  );
  expect(recent.ok && recent.value.map((entry) => entry.id)).toEqual([ID_A]);
  expect(stored.records()[0]?.progressPage).toBe(3);
});

it("leaves the row unchanged when the page is not a positive integer", () => {
  const stored = repository();
  const updated = createUpdateProgress(stored)({
    id: ID_A,
    openedAt: OPENED,
    page: 0,
  });
  expect(updated.ok).toBe(false);
  if (!updated.ok) {
    expect(updated.error.code).toBe("rejected");
  }
  expect(stored.records()[0]?.openedAt).toBeNull();
  const recent = createListLibrary(stored)({ view: "recent" });
  expect(recent.ok && recent.value).toEqual([]);
});

it("returns not_found when the id is absent", () => {
  const stored = repository();
  const updated = createUpdateProgress(stored)({
    id: "b".repeat(64),
    openedAt: OPENED,
    page: null,
  });
  expect(updated.ok).toBe(false);
  if (!updated.ok) {
    expect(updated.error).toEqual(libraryFailure("not_found"));
  }
});
