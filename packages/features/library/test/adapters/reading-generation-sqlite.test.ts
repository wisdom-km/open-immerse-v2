import { expect, it } from "vitest";

import { createSqliteLibraryRepository } from "../../src/adapters/sqlite-library-repository.js";
import {
  createBindReadingAssetCommand,
  createGetProgressPage,
  createReadingGenerationTable,
  createRevokeReadingAssetCommand,
  parseLibraryEntryId,
} from "../../src/index.js";
import { withLibrary } from "../support/library-fixture.js";

const id = mustId("c".repeat(64));
const OPENED = "2026-02-02T00:00:00.000Z";

it("bind and revoke do not change openedAt or progressPage on sqlite", async () => {
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
    const before = repository.findById(id);
    expect(before.ok && before.value?.openedAt).toBe(OPENED);
    expect(before.ok && before.value?.progressPage).toBe(null);
    const table = createReadingGenerationTable();
    const bind = createBindReadingAssetCommand(
      createGetProgressPage(repository),
      table,
    );
    const revoke = createRevokeReadingAssetCommand(table);
    const bound = bind({ id });
    const afterBind = repository.findById(id);
    const revoked = revoke({ id, generation: 1 });
    const afterRevoke = repository.findById(id);
    pending = Promise.all([bound, revoked]).then(
      ([boundResult, revokedResult]) => {
        expect(boundResult).toEqual({
          ok: true,
          value: { id, assetId: "1", generation: 1 },
        });
        expect(JSON.stringify(boundResult).includes("/library-source")).toBe(
          false,
        );
        expect(afterBind.ok && afterBind.value?.openedAt).toBe(OPENED);
        expect(afterBind.ok && afterBind.value?.progressPage).toBe(null);
        expect(revokedResult).toEqual({
          ok: true,
          value: { id, generation: 1 },
        });
        expect(afterRevoke.ok && afterRevoke.value?.openedAt).toBe(OPENED);
        expect(afterRevoke.ok && afterRevoke.value?.progressPage).toBe(null);
      },
    );
  });
  await pending;
});

function mustId(value: string) {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}
