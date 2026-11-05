import { expect, it } from "vitest";

import { createListLibrary } from "../../src/index.js";
import {
  createFakeLibraryRepository,
  seedLibrary,
} from "../../src/testing/fake-library-repository.js";
import { pathLeaks } from "../support/path-leaks.js";

const ID_A = "a".repeat(64);
const ID_B = "b".repeat(64);
const ID_C = "c".repeat(64);
const ID_D = "d".repeat(64);
const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-01-02T00:00:00.000Z";
const T3 = "2026-01-03T00:00:00.000Z";
const T4 = "2026-01-04T00:00:00.000Z";
const T5 = "2026-01-05T00:00:00.000Z";

function listed(
  sort?: {
    readonly field: "title" | "status" | "openedAt" | "addedAt";
    readonly dir: "asc" | "desc";
  },
  view: "recent" | "all" = "all",
): string[] {
  const repository = createFakeLibraryRepository();
  seedLibrary(repository, row(ID_A, "alpha", T1, null));
  seedLibrary(repository, row(ID_B, "mu", T2, T3));
  seedLibrary(repository, row(ID_C, "zeta", T4, null));
  seedLibrary(repository, row(ID_D, "alpha", T2, T5));
  const result = createListLibrary(repository)(
    sort === undefined ? { view } : { view, sort },
  );
  expect(pathLeaks(result, ["/secret"])).toEqual([]);
  if (!result.ok) {
    return [];
  }
  return result.value.map((entry) => entry.id);
}

function row(
  id: string,
  title: string,
  addedAt: string,
  openedAt: string | null,
) {
  return {
    id,
    fileName: `${title}.pdf`,
    title,
    originalPath: `/secret/${title}.pdf`,
    addedAt,
    openedAt,
    progressPage: null,
  };
}

it("returns opened entries newest first when the view is recent and sort is omitted", () => {
  expect(listed(undefined, "recent")).toEqual([ID_D, ID_B]);
});

it("puts empty openedAt last and then sorts addedAt descending when the view is all and sort is omitted", () => {
  expect(listed()).toEqual([ID_B, ID_D, ID_C, ID_A]);
});

it("falls back to addedAt and id when status is the sort field", () => {
  expect(listed({ field: "status", dir: "desc" })).toEqual([
    ID_C,
    ID_B,
    ID_D,
    ID_A,
  ]);
  expect(listed({ field: "status", dir: "asc" })).toEqual([
    ID_A,
    ID_B,
    ID_D,
    ID_C,
  ]);
});

it("sorts the four explicit fields when a sort is provided", () => {
  expect(listed({ field: "title", dir: "asc" })).toEqual([
    ID_A,
    ID_D,
    ID_B,
    ID_C,
  ]);
  expect(listed({ field: "addedAt", dir: "asc" })).toEqual([
    ID_A,
    ID_B,
    ID_D,
    ID_C,
  ]);
  expect(listed({ field: "openedAt", dir: "asc" })).toEqual([
    ID_B,
    ID_D,
    ID_A,
    ID_C,
  ]);
  expect(listed({ field: "title", dir: "asc" }, "recent")).toEqual([
    ID_D,
    ID_B,
  ]);
});
