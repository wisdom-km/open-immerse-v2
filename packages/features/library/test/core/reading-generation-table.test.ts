import { expect, it } from "vitest";

import {
  createBindReadingAssetCommand,
  createGetProgressPageCommand,
  createReadingGenerationTable,
  createRevokeReadingAssetCommand,
  createSetProgressPageCommand,
  parseLibraryEntryId,
  type GetProgressPage,
} from "../../src/index.js";

const id = mustId("a".repeat(64));
const other = mustId("b".repeat(64));
const above = Number.MAX_SAFE_INTEGER + 2;

it("starts empty and stays empty in a second factory", () => {
  const first = createReadingGenerationTable();
  const bound = first.bind(id);
  expect(bound).toEqual({ ok: true, assetId: "1", generation: 1 });
  const second = createReadingGenerationTable();
  expect(second.matches(id, 1)).toBe(false);
  expect(second.revoke(id, 1)).toBe(false);
});

it("replaces the one current generation and drops the old asset id", () => {
  const table = createReadingGenerationTable();
  expect(table.bind(id)).toEqual({ ok: true, assetId: "1", generation: 1 });
  expect(table.bind(id)).toEqual({ ok: true, assetId: "2", generation: 2 });
  expect(table.matches(id, 1)).toBe(false);
  expect(table.matches(id, 2)).toBe(true);
  expect(table.bind(other)).toEqual({ ok: true, assetId: "3", generation: 1 });
  expect(table.revoke(id, 2)).toBe(true);
  expect(table.matches(other, 1)).toBe(true);
  expect(table.revoke(id, 2)).toBe(false);
});

it("issues a decimal asset id that is not the document id", () => {
  const table = createReadingGenerationTable();
  const bound = table.bind(id);
  expect(bound.ok).toBe(true);
  if (!bound.ok) {
    return;
  }
  expect(bound.assetId).toMatch(/^[0-9]+$/);
  expect(bound.assetId).toMatch(/^[^/\\]+$/);
  expect(bound.assetId).not.toBe(id);
});

it("keeps raising the generation after revoke", () => {
  const table = createReadingGenerationTable();
  expect(table.bind(id)).toEqual({ ok: true, assetId: "1", generation: 1 });
  expect(table.revoke(id, 1)).toBe(true);
  expect(table.matches(id, 1)).toBe(false);
  expect(table.bind(id)).toEqual({ ok: true, assetId: "2", generation: 2 });
  expect(table.matches(id, 1)).toBe(false);
  expect(table.matches(id, 2)).toBe(true);
  expect(table.revoke(id, 1)).toBe(false);
  expect(table.bind(other)).toEqual({ ok: true, assetId: "3", generation: 1 });
});

it("does not wrap or replace the current generation at the ceiling", () => {
  const table = createReadingGenerationTable(id);
  expect(table.matches(id, Number.MAX_SAFE_INTEGER)).toBe(true);
  expect(table.bind(id)).toEqual({ ok: false, reason: "exhausted" });
  expect(table.matches(id, Number.MAX_SAFE_INTEGER)).toBe(true);
  expect(table.matches(id, 1)).toBe(false);
  expect(table.bind(other)).toEqual({ ok: true, assetId: "2", generation: 1 });
});

it("stays exhausted after the ceiling generation is revoked", () => {
  const table = createReadingGenerationTable(id);
  expect(table.revoke(id, Number.MAX_SAFE_INTEGER)).toBe(true);
  expect(table.matches(id, Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(table.bind(id)).toEqual({ ok: false, reason: "exhausted" });
  expect(table.matches(id, 1)).toBe(false);
  expect(table.bind(other)).toEqual({ ok: true, assetId: "2", generation: 1 });
});

it("rejects the old generation on get, set, and revoke without calling a use case", async () => {
  const table = createReadingGenerationTable();
  const reads: unknown[] = [];
  const writes: unknown[] = [];
  const bind = createBindReadingAssetCommand(found(above), table);
  const revoke = createRevokeReadingAssetCommand(table);
  const read = createGetProgressPageCommand((request) => {
    reads.push(request);
    return page(request.id, null);
  }, table);
  const write = createSetProgressPageCommand((request) => {
    writes.push(request);
    return written(request.id, request.progressPage);
  }, table);
  const first = await bind({ id });
  const second = await bind({ id });
  expect(first).toEqual({
    ok: true,
    value: { id, assetId: "1", generation: 1 },
  });
  expect(JSON.stringify(first).includes(String(above))).toBe(false);
  expect(JSON.stringify(first).includes("progressPage")).toBe(false);
  expect(second).toEqual({
    ok: true,
    value: { id, assetId: "2", generation: 2 },
  });
  expect(await read({ id, generation: 1 })).toEqual(rejectedPair(1));
  expect(await write({ id, generation: 1, progressPage: 4 })).toEqual(
    rejectedPair(1),
  );
  expect(await revoke({ id, generation: 1 })).toEqual(rejectedPair(1));
  expect(reads).toEqual([]);
  expect(writes).toEqual([]);
  expect(await read({ id, generation: 2 })).toEqual({
    ok: true,
    value: { id, generation: 2, progressPage: null },
  });
  expect(reads).toEqual([{ id }]);
});

function rejectedPair(generation: number) {
  return {
    ok: false as const,
    error: {
      code: "rejected" as const,
      retryable: false as const,
      id,
      generation,
    },
  };
}

function found(progressPage: number): GetProgressPage {
  return (request) => page(request.id, progressPage);
}

function page(
  value: string,
  progressPage: number | null,
): ReturnType<GetProgressPage> {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return { ok: true, value: { id: parsed, progressPage } };
}

function written(value: string, progressPage: number) {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return { ok: true as const, value: { id: parsed, progressPage } };
}

function mustId(value: string) {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}
