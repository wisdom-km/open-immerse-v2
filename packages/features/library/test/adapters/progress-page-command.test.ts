import { expect, it } from "vitest";

import { createSqliteLibraryRepository } from "../../src/adapters/sqlite-library-repository.js";
import {
  createGetProgressPage,
  createGetProgressPageCommand,
  createSetProgressPage,
  createSetProgressPageCommand,
  parseLibraryEntryId,
} from "../../src/index.js";
import {
  createFakeLibraryRepository,
  seedLibrary,
} from "../../src/testing/fake-library-repository.js";
import { withLibrary } from "../support/library-fixture.js";

const id = mustId("a".repeat(64));
const OPENED = "2026-02-02T00:00:00.000Z";
const ABOVE = Number.MAX_SAFE_INTEGER + 1;

it("writes through the real use case and leaves openedAt on sqlite", async () => {
  const pending = runSqlite();
  await pending;
});

it("rejects an out-of-range page from the real read use case", async () => {
  const repository = createFakeLibraryRepository();
  seedLibrary(repository, {
    id,
    fileName: "paper.pdf",
    title: "paper",
    originalPath: "/library-source/paper.pdf",
    addedAt: "2026-01-01T00:00:00.000Z",
    openedAt: OPENED,
    progressPage: ABOVE,
  });
  const command = createGetProgressPageCommand(
    createGetProgressPage(repository),
    openGeneration(3),
  );
  const settled = await command({ id, generation: 3 });
  expect(settled).toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
  expect(JSON.stringify(settled).includes(String(ABOVE))).toBe(false);
  expect(repository.records()[0]?.progressPage).toBe(ABOVE);
  expect(repository.records()[0]?.openedAt).toBe(OPENED);
});

function runSqlite(): Promise<void> {
  let pending = Promise.resolve();
  withLibrary((fixture) => {
    const repository = createSqliteLibraryRepository(fixture.storage);
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
    const generations = openGenerations([2, 5]);
    const read = createGetProgressPageCommand(
      createGetProgressPage(repository),
      generations,
    );
    const write = createSetProgressPageCommand(
      createSetProgressPage(repository),
      generations,
    );
    const before = read({ id, generation: 2 });
    const written = write({ id, generation: 5, progressPage: 4 });
    const found = repository.findById(id);
    expect(found.ok && found.value?.openedAt).toBe(OPENED);
    expect(found.ok && found.value?.progressPage).toBe(4);
    pending = Promise.all([before, written]).then(
      ([readResult, writeResult]) => {
        expect(readResult).toEqual({
          ok: true,
          value: { id, generation: 2, progressPage: null },
        });
        expect(writeResult).toEqual({
          ok: true,
          value: { id, generation: 5, progressPage: 4 },
        });
      },
    );
  });
  return pending;
}

function openGeneration(generation: number) {
  return {
    matches(_id: unknown, value: number) {
      return value === generation;
    },
  };
}

function openGenerations(generations: readonly number[]) {
  return {
    matches(_id: unknown, generation: number) {
      return generations.includes(generation);
    },
  };
}

function mustId(value: string) {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}
