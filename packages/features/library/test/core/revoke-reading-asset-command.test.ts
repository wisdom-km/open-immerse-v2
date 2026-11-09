import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { revokeReadingAsset } from "@oi/contracts";
import { expect, it } from "vitest";

import {
  createReadingGenerationTable,
  createRevokeReadingAssetCommand,
  parseLibraryEntryId,
  type RevokeReadingAssetCommand,
} from "../../src/index.js";

const id = mustId("a".repeat(64));
const invalidPayload = {
  ok: false as const,
  error: { code: "invalid_payload" as const, retryable: false as const },
};
const check = loadCheck();

it("matches the merged revoke descriptor and does not take a library port", async () => {
  const schema = revokeReadingAsset.request;
  expect(check(schema, { id, generation: 1 })).toBe(true);
  expect(check(schema, { id, generation: 0 })).toBe(false);
  expect(check(schema, { id, generation: Number.MAX_SAFE_INTEGER + 1 })).toBe(
    false,
  );
  const table = createReadingGenerationTable();
  const command = createRevokeReadingAssetCommand(table);
  expect(typeof command).toBe("function");
  for (const sample of revokeSamples()) {
    await expectRevokeSample(schema, sample);
  }
});

it("rejects a missing pair without not_found and rejects the same pair again", async () => {
  const table = createReadingGenerationTable();
  const command = createRevokeReadingAssetCommand(table);
  const missing = await command({ id, generation: 1 });
  expect(missing).toEqual(rejected(1));
  expect(JSON.stringify(missing).includes("not_found")).toBe(false);
  expect(table.bind(id)).toEqual({ ok: true, assetId: "1", generation: 1 });
  expect(await command({ id, generation: 1 })).toEqual({
    ok: true,
    value: { id, generation: 1 },
  });
  const again = await command({ id, generation: 1 });
  expect(again).toEqual(rejected(1));
  expect(JSON.stringify(again).includes("not_found")).toBe(false);
  expect(table.matches(id, 1)).toBe(false);
});

async function expectRevokeSample(
  schema: unknown,
  sample: unknown,
): Promise<void> {
  const table = createReadingGenerationTable();
  table.bind(id);
  const command = createRevokeReadingAssetCommand(table);
  const settled = await command(asRevoke(sample));
  const accepted = check(schema, sample);
  if (!accepted) {
    expect(settled).toEqual(invalidPayload);
    expect(table.matches(id, 1)).toBe(true);
    return;
  }
  expect(settled).toEqual({ ok: true, value: { id, generation: 1 } });
  expect(table.matches(id, 1)).toBe(false);
}

function revokeSamples(): readonly unknown[] {
  const pair = { id, generation: 1 };
  const hidden: typeof pair = { ...pair };
  Object.defineProperty(hidden, "extra", { value: true, enumerable: false });
  const marked = { ...pair };
  Object.defineProperty(marked, Symbol("s"), { value: true });
  return [
    { id, generation: 0 },
    { id, generation: Number.MAX_SAFE_INTEGER + 1 },
    { id, generation: 1.5 },
    { id },
    { id, generation: 1, extra: true },
    null,
    [],
    inheritedRevoke(),
    hidden,
    marked,
    pair,
  ];
}

function inheritedRevoke(): unknown {
  const value: Record<string, unknown> = {};
  Object.setPrototypeOf(value, { id, generation: 1 });
  return value;
}

function rejected(generation: number) {
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

function mustId(value: string) {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}

function asRevoke(sample: unknown): Parameters<RevokeReadingAssetCommand>[0] {
  return sample as Parameters<RevokeReadingAssetCommand>[0];
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
