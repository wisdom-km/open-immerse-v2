import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { getProgressPage } from "@oi/contracts";
import { expect, it } from "vitest";

import {
  createGetProgressPageCommand,
  libraryFailure,
  parseLibraryEntryId,
  type GetProgressPage,
  type GetProgressPageCommand,
} from "../../src/index.js";

const id = mustId("a".repeat(64));
const above = Number.MAX_SAFE_INTEGER + 1;
const invalidPayload = {
  ok: false as const,
  error: { code: "invalid_payload" as const, retryable: false as const },
};
const check = loadCheck();

it("matches the merged read descriptor without calling the use case", async () => {
  const schema = getProgressPage.request;
  expect(check(schema, { id, generation: 0 })).toBe(false);
  expect(check(schema, { id, generation: Number.MAX_SAFE_INTEGER })).toBe(true);
  expect(check(schema, { id, generation: above })).toBe(false);
  expect(check(schema, { id, generation: 1.5 })).toBe(false);
  expect(check(schema, { id, generation: -1 })).toBe(false);
  expect(check(schema, { id, generation: null })).toBe(false);
  expect(check(schema, { id })).toBe(false);
  expect(check(schema, { id, generation: 1, extra: true })).toBe(false);
  expect(check(schema, { id: "A".repeat(64), generation: 1 })).toBe(false);
  for (const sample of readSamples()) {
    await expectReadSample(schema, sample);
  }
});

it("echoes the request generation when the page is null", async () => {
  const settled = await readReturning(null, 6);
  expect(settled.result).toEqual({
    ok: true,
    value: { id, generation: 6, progressPage: null },
  });
  expect(settled.calls).toEqual([{ id }]);
});

it("echoes the request generation when the page is the largest safe integer", async () => {
  const settled = await readReturning(Number.MAX_SAFE_INTEGER, 6);
  expect(settled.result).toEqual({
    ok: true,
    value: { id, generation: 6, progressPage: Number.MAX_SAFE_INTEGER },
  });
  expect(settled.calls).toEqual([{ id }]);
});

it("drops a page that is not null and not a safe positive integer", async () => {
  const pages = [0, -2, 1.5, above];
  for (const progressPage of pages) {
    const settled = await readReturning(progressPage, 6);
    expect(settled.calls).toEqual([{ id }]);
    expect(settled.result).toEqual(invalidPayload);
    expect(JSON.stringify(settled.result).includes(String(progressPage))).toBe(
      false,
    );
  }
});

it("returns not_found without detail", async () => {
  const settled = await failRead("not_found");
  expect(settled.ok).toBe(false);
  if (settled.ok) {
    return;
  }
  expect(settled.error).toEqual({ code: "not_found", retryable: false });
  expect(Object.keys(settled.error)).toEqual(["code", "retryable"]);
});

it("returns rejected with only the request id and generation", async () => {
  const settled = await failRead("rejected");
  expect(settled.ok).toBe(false);
  if (settled.ok) {
    return;
  }
  expect(settled.error).toEqual({
    code: "rejected",
    retryable: false,
    id,
    generation: 8,
  });
  expect(Object.keys(settled.error).sort()).toEqual([
    "code",
    "generation",
    "id",
    "retryable",
  ]);
  expect(JSON.stringify(settled).includes("progressPage")).toBe(false);
});

it("maps an unexpected library code to handler_threw", async () => {
  const settled = await failRead("not_pdf");
  expect(settled).toEqual({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
});

async function expectReadSample(
  schema: unknown,
  sample: unknown,
): Promise<void> {
  const calls: unknown[] = [];
  const command = createGetProgressPageCommand((request) => {
    calls.push(request);
    return stored(request.id, null);
  });
  const settled = await command(asRead(sample));
  const accepted = check(schema, sample);
  expect(calls).toHaveLength(accepted ? 1 : 0);
  if (!accepted) {
    expect(settled).toEqual(invalidPayload);
    return;
  }
  expect(calls).toEqual([{ id }]);
  expect(settled).toEqual({
    ok: true,
    value: { id, generation: generationOf(sample), progressPage: null },
  });
}

function readSamples(): readonly unknown[] {
  const hidden: { id: string; generation: number } = { id, generation: 1 };
  Object.defineProperty(hidden, "extra", { value: true, enumerable: false });
  const marked = { id, generation: 1 };
  Object.defineProperty(marked, Symbol("s"), { value: true });
  return [
    { id, generation: 0 },
    { id, generation: Number.MAX_SAFE_INTEGER },
    { id, generation: above },
    { id, generation: 1.5 },
    { id, generation: -1 },
    { id, generation: null },
    { id },
    { generation: 1 },
    {},
    { id, generation: 1, path: "/tmp" },
    { id, generation: 1, extra: undefined },
    { id: "A".repeat(64), generation: 1 },
    { id: "ab", generation: 1 },
    { id: `${"a".repeat(32)}-${"b".repeat(31)}`, generation: 1 },
    { id, generation: "1" },
    null,
    [id, 1],
    inheritedRead(),
    swappedRead(),
    hidden,
    marked,
    { id, generation: 1 },
  ];
}

function inheritedRead(): unknown {
  const value: Record<string, unknown> = {};
  Object.setPrototypeOf(value, { id, generation: 4 });
  return value;
}

function swappedRead(): unknown {
  const value: Record<string, unknown> = { extra: true, other: true };
  Object.setPrototypeOf(value, { id, generation: 4 });
  return value;
}

async function readReturning(
  progressPage: number | null,
  generation: number,
): Promise<{ readonly calls: readonly unknown[]; readonly result: unknown }> {
  const calls: unknown[] = [];
  const command = createGetProgressPageCommand((request) => {
    calls.push(request);
    return stored(request.id, progressPage);
  });
  return { calls, result: await command({ id, generation }) };
}

async function failRead(code: "not_found" | "rejected" | "not_pdf") {
  const command = createGetProgressPageCommand(() => ({
    ok: false,
    error: libraryFailure(code),
  }));
  return command({ id, generation: 8 });
}

function stored(
  value: string,
  progressPage: number | null,
): ReturnType<GetProgressPage> {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return { ok: true, value: { id: parsed, progressPage } };
}

function generationOf(sample: unknown): number {
  if (!isRecord(sample) || typeof sample.generation !== "number") {
    throw new Error("generation");
  }
  return sample.generation;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function mustId(value: string) {
  const parsed = parseLibraryEntryId(value);
  if (parsed === undefined) {
    throw new Error("id");
  }
  return parsed;
}

function asRead(sample: unknown): Parameters<GetProgressPageCommand>[0] {
  return sample as Parameters<GetProgressPageCommand>[0];
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
