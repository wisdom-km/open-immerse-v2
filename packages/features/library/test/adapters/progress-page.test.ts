import { expect, it } from "vitest";

import { createSqliteLibraryRepository } from "../../src/adapters/sqlite-library-repository.js";
import {
  createGetProgressPage,
  createSetProgressPage,
  libraryFailure,
  parseLibraryEntryId,
} from "../../src/index.js";
import { withLibrary } from "../support/library-fixture.js";

const ID_A = "a".repeat(64);
const OPENED = "2026-02-02T00:00:00.000Z";

it("writes only progress_page and keeps opened_at on sqlite", () => {
  withLibrary((fixture) => {
    const repository = createSqliteLibraryRepository(fixture.storage);
    const id = parseLibraryEntryId(ID_A);
    if (id === undefined) {
      throw new Error("id");
    }
    const inserted = repository.insert({
      id,
      fileName: "paper.pdf",
      title: "paper",
      originalPath: "/library-source/paper.pdf",
      addedAt: "2026-01-01T00:00:00.000Z",
      openedAt: OPENED,
      progressPage: null,
    });
    expect(inserted.ok).toBe(true);
    const before = createGetProgressPage(repository)({ id: ID_A });
    expect(before.ok && before.value.progressPage).toBeNull();
    const written = createSetProgressPage(repository)({
      id: ID_A,
      progressPage: 4,
    });
    expect(written.ok && written.value).toEqual({ id, progressPage: 4 });
    const found = repository.findById(id);
    expect(found.ok && found.value?.openedAt).toBe(OPENED);
    expect(found.ok && found.value?.progressPage).toBe(4);
  });
});

it("returns not_found from sqlite when the row is absent", () => {
  withLibrary((fixture) => {
    const repository = createSqliteLibraryRepository(fixture.storage);
    const id = parseLibraryEntryId(ID_A);
    if (id === undefined) {
      throw new Error("id");
    }
    const inserted = repository.insert({
      id,
      fileName: "paper.pdf",
      title: "paper",
      originalPath: "/library-source/paper.pdf",
      addedAt: "2026-01-01T00:00:00.000Z",
      openedAt: OPENED,
      progressPage: 2,
    });
    expect(inserted.ok).toBe(true);
    const written = createSetProgressPage(repository)({
      id: "b".repeat(64),
      progressPage: 9,
    });
    expect(written).toEqual({ ok: false, error: libraryFailure("not_found") });
    const found = repository.findById(id);
    expect(found.ok && found.value?.openedAt).toBe(OPENED);
    expect(found.ok && found.value?.progressPage).toBe(2);
  });
});

it("returns rejected from sqlite when progress_page 0 violates the check", () => {
  withLibrary((fixture) => {
    const repository = createSqliteLibraryRepository(fixture.storage);
    const id = parseLibraryEntryId(ID_A);
    if (id === undefined) {
      throw new Error("id");
    }
    const inserted = repository.insert({
      id,
      fileName: "paper.pdf",
      title: "paper",
      originalPath: "/library-source/paper.pdf",
      addedAt: "2026-01-01T00:00:00.000Z",
      openedAt: OPENED,
      progressPage: 2,
    });
    expect(inserted.ok).toBe(true);
    const written = repository.updateProgressPage(id, 0);
    expect(written).toEqual({ ok: false, error: libraryFailure("rejected") });
    const row = fixture.storage.query(
      "SELECT opened_at, progress_page FROM lib_entries WHERE id = ?",
      [id],
    );
    expect(row).toEqual({ opened_at: OPENED, progress_page: 2 });
  });
});
