import { expect, it } from "vitest";

import {
  createSetProgressPage,
  libraryFailure,
  type LibraryProgressPageUpdate,
} from "../../src/index.js";
import {
  createFakeLibraryRepository,
  seedLibrary,
  type FakeLibraryRepository,
} from "../../src/testing/fake-library-repository.js";

const ID_A = "a".repeat(64);
const OPENED = "2026-02-02T00:00:00.000Z";

function stored(): FakeLibraryRepository {
  const repository = createFakeLibraryRepository();
  seedLibrary(repository, {
    id: ID_A,
    fileName: "paper.pdf",
    title: "paper",
    originalPath: "/library-source/paper.pdf",
    addedAt: "2026-01-01T00:00:00.000Z",
    openedAt: OPENED,
    progressPage: 2,
  });
  return repository;
}

function write(repository: LibraryProgressPageUpdate, page: unknown) {
  return createSetProgressPage(repository)({
    id: ID_A,
    progressPage: page as number,
  });
}

it("writes page 1 and leaves openedAt unchanged", () => {
  const repository = stored();
  const written = write(repository, 1);
  expect(written.ok && written.value.progressPage).toBe(1);
  expect(repository.records()[0]?.openedAt).toBe(OPENED);
});

it("writes a safe page and leaves openedAt unchanged", () => {
  const repository = stored();
  const written = write(repository, Number.MAX_SAFE_INTEGER);
  expect(written.ok && written.value).toEqual({
    id: ID_A,
    progressPage: Number.MAX_SAFE_INTEGER,
  });
  expect(repository.records()[0]?.openedAt).toBe(OPENED);
  expect(repository.records()[0]?.progressPage).toBe(Number.MAX_SAFE_INTEGER);
});

it("rejects pages that are not safe positive integers and does not call the port", () => {
  const samples = [
    null,
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 2,
  ];
  for (const page of samples) {
    const repository = stored();
    let calls = 0;
    const guarded: LibraryProgressPageUpdate = {
      updateProgressPage: (id, next) => {
        calls += 1;
        return repository.updateProgressPage(id, next);
      },
    };
    const written = write(guarded, page);
    expect(written).toEqual({ ok: false, error: libraryFailure("rejected") });
    expect(calls).toBe(0);
    expect(repository.records()[0]?.openedAt).toBe(OPENED);
    expect(repository.records()[0]?.progressPage).toBe(2);
  }
});

it("returns not_found for an id that cannot be parsed", () => {
  const repository = stored();
  const written = createSetProgressPage(repository)({
    id: "not-an-id",
    progressPage: 1,
  });
  expect(written).toEqual({ ok: false, error: libraryFailure("not_found") });
  expect(repository.records()[0]?.progressPage).toBe(2);
});

it("returns not_found when the row is absent", () => {
  const repository = stored();
  const written = createSetProgressPage(repository)({
    id: "b".repeat(64),
    progressPage: 1,
  });
  expect(written).toEqual({ ok: false, error: libraryFailure("not_found") });
  expect(repository.records()[0]?.openedAt).toBe(OPENED);
});

it("forwards rejected from the page port", () => {
  const written = write(
    {
      updateProgressPage: () => ({
        ok: false,
        error: libraryFailure("rejected"),
      }),
    },
    1,
  );
  expect(written).toEqual({ ok: false, error: libraryFailure("rejected") });
});
