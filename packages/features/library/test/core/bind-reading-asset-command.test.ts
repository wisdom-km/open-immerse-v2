import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { bindReadingAsset } from "@oi/contracts";
import { expect, it } from "vitest";

import {
  createBindReadingAssetCommand,
  createReadingGenerationTable,
  libraryFailure,
  parseLibraryEntryId,
  type BindReadingAssetCommand,
  type GetProgressPage,
} from "../../src/index.js";

const id = mustId("a".repeat(64));
const above = Number.MAX_SAFE_INTEGER + 2;
const invalidPayload = {
  ok: false as const,
  error: { code: "invalid_payload" as const, retryable: false as const },
};
const check = loadCheck();

it("matches the merged bind descriptor without calling the use case", async () => {
  const schema = bindReadingAsset.request;
  expect(check(schema, { id })).toBe(true);
  expect(check(schema, { id, generation: 1 })).toBe(false);
  expect(check(schema, { id: "A".repeat(64) })).toBe(false);
  for (const sample of bindSamples()) {
    await expectBindSample(schema, sample);
  }
});

it("returns not_found and does not consume an asset id", async () => {
  const table = createReadingGenerationTable();
  const calls: unknown[] = [];
  const command = createBindReadingAssetCommand((request) => {
    calls.push(request);
    return { ok: false, error: libraryFailure("not_found") };
  }, table);
  const settled = await command({ id });
  expect(calls).toEqual([{ id }]);
  expect(settled).toEqual({
    ok: false,
    error: { code: "not_found", retryable: false },
  });
  expect(Object.keys(settled.ok ? {} : settled.error)).toEqual([
    "code",
    "retryable",
  ]);
  expect(table.bind(id)).toEqual({ ok: true, assetId: "1", generation: 1 });
});

it("returns rejected with only the id when the library rejects", async () => {
  const table = createReadingGenerationTable();
  const command = createBindReadingAssetCommand(
    () => ({ ok: false, error: libraryFailure("rejected") }),
    table,
  );
  const settled = await command({ id });
  expect(settled).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false, id },
  });
  expect(JSON.stringify(settled).includes("generation")).toBe(false);
  expect(JSON.stringify(settled).includes("assetId")).toBe(false);
  expect(table.matches(id, 1)).toBe(false);
  expect(table.bind(id)).toEqual({ ok: true, assetId: "1", generation: 1 });
});

it("keeps an out-of-range page out of the bind response", async () => {
  const table = createReadingGenerationTable();
  const command = createBindReadingAssetCommand(found(above), table);
  const settled = await command({ id });
  expect(settled).toEqual({
    ok: true,
    value: { id, assetId: "1", generation: 1 },
  });
  expect(JSON.stringify(settled).includes(String(above))).toBe(false);
  expect(JSON.stringify(settled).includes("progressPage")).toBe(false);
});

it("rejects the ceiling without replacing the current generation", async () => {
  const table = createReadingGenerationTable(id);
  let calls = 0;
  const command = createBindReadingAssetCommand((request) => {
    calls += 1;
    return found(1)(request);
  }, table);
  const settled = await command({ id });
  expect(calls).toBe(1);
  expect(settled).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false, id },
  });
  expect(Object.keys(settled.ok ? {} : settled.error).sort()).toEqual([
    "code",
    "id",
    "retryable",
  ]);
  expect(table.matches(id, Number.MAX_SAFE_INTEGER)).toBe(true);
});

async function expectBindSample(
  schema: unknown,
  sample: unknown,
): Promise<void> {
  const calls: unknown[] = [];
  const table = createReadingGenerationTable();
  const command = createBindReadingAssetCommand((request) => {
    calls.push(request);
    return found(1)(request);
  }, table);
  const settled = await command(asBind(sample));
  const accepted = check(schema, sample);
  expect(calls).toHaveLength(accepted ? 1 : 0);
  if (!accepted) {
    expect(settled).toEqual(invalidPayload);
    expect(table.matches(id, 1)).toBe(false);
    return;
  }
  expect(settled).toEqual({
    ok: true,
    value: { id, assetId: "1", generation: 1 },
  });
}

function bindSamples(): readonly unknown[] {
  const hidden: { id: string } = { id };
  Object.defineProperty(hidden, "extra", { value: true, enumerable: false });
  const marked = { id };
  Object.defineProperty(marked, Symbol("s"), { value: true });
  return [
    { id, generation: 1 },
    { id, extra: true },
    { id: "ab" },
    { id: "A".repeat(64) },
    null,
    [],
    inheritedBind(),
    hidden,
    marked,
    { id },
  ];
}

function inheritedBind(): unknown {
  const value: Record<string, unknown> = {};
  Object.setPrototypeOf(value, { id });
  return value;
}

function found(progressPage: number): GetProgressPage {
  return (request) => {
    const parsed = parseLibraryEntryId(request.id);
    if (parsed === undefined) {
      throw new Error("id");
    }
    return { ok: true, value: { id: parsed, progressPage } };
  };
}

function mustId(value: string) {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}

function asBind(sample: unknown): Parameters<BindReadingAssetCommand>[0] {
  return sample as Parameters<BindReadingAssetCommand>[0];
}

function loadCheck(): (schema: unknown, value: unknown) => boolean {
  const require = createRequire(
    fileURLToPath(
      new URL("../../../../contracts/package.json", import.meta.url),
    ),
  );
  const loaded: unknown = require("@sinclair/typebox/value") as unknown;
  if (!isValueModule(loaded)) {
    throw new Error("typebox");
  }
  return (schema, value) => loaded.Value.Check(schema, value);
}

function isValueModule(value: unknown): value is {
  readonly Value: {
    readonly Check: (schema: unknown, value: unknown) => boolean;
  };
} {
  if (typeof value !== "object" || value === null || !("Value" in value)) {
    return false;
  }
  const box: unknown = value.Value;
  if (typeof box !== "object" || box === null || !("Check" in box)) {
    return false;
  }
  return typeof box.Check === "function";
}
