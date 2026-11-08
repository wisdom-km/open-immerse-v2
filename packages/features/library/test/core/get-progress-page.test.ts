import { expect, it } from "vitest";

import { createGetProgressPage, libraryFailure } from "../../src/index.js";
import {
  createFakeLibraryRepository,
  seedLibrary,
} from "../../src/testing/fake-library-repository.js";

const ID_A = "a".repeat(64);
const ABOVE = Number.MAX_SAFE_INTEGER + 2;

function stored(progressPage: number | null) {
  const repository = createFakeLibraryRepository();
  seedLibrary(repository, {
    id: ID_A,
    fileName: "paper.pdf",
    title: "paper",
    originalPath: "/library-source/paper.pdf",
    addedAt: "2026-01-01T00:00:00.000Z",
    openedAt: "2026-02-02T00:00:00.000Z",
    progressPage,
  });
  return repository;
}

it("returns null when the stored page is null", () => {
  const repository = stored(null);
  const read = createGetProgressPage(repository)({ id: ID_A });
  expect(read.ok && read.value).toEqual({ id: ID_A, progressPage: null });
});

it("returns a stored page of 1", () => {
  const repository = stored(1);
  const read = createGetProgressPage(repository)({ id: ID_A });
  expect(read.ok && read.value.progressPage).toBe(1);
});

it("returns the largest safe integer the existing read path accepts", () => {
  const repository = stored(Number.MAX_SAFE_INTEGER);
  const read = createGetProgressPage(repository)({ id: ID_A });
  expect(read.ok && read.value.progressPage).toBe(Number.MAX_SAFE_INTEGER);
});

it("returns the same out-of-range number the existing read path stored", () => {
  const repository = stored(ABOVE);
  const read = createGetProgressPage(repository)({ id: ID_A });
  expect(read.ok && read.value.progressPage).toBe(ABOVE);
  expect(repository.records()[0]?.progressPage).toBe(ABOVE);
});

it("returns not_found when the id cannot be parsed", () => {
  const repository = stored(1);
  const read = createGetProgressPage(repository)({ id: "not-an-id" });
  expect(read).toEqual({ ok: false, error: libraryFailure("not_found") });
});

it("returns not_found when the row is absent", () => {
  const repository = stored(1);
  const read = createGetProgressPage(repository)({ id: "b".repeat(64) });
  expect(read).toEqual({ ok: false, error: libraryFailure("not_found") });
});

it("forwards rejected when the existing read fails", () => {
  const read = createGetProgressPage({
    findById: () => ({ ok: false, error: libraryFailure("rejected") }),
  })({ id: ID_A });
  expect(read).toEqual({ ok: false, error: libraryFailure("rejected") });
});
