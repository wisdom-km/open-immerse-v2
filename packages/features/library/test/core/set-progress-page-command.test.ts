import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { setProgressPage } from "@oi/contracts";
import { expect, it } from "vitest";

import {
  createSetProgressPageCommand,
  libraryFailure,
  parseLibraryEntryId,
  type SetProgressPage,
  type SetProgressPageCommand,
} from "../../src/index.js";

const id = mustId("a".repeat(64));
const above = Number.MAX_SAFE_INTEGER + 1;
const invalidPayload = {
  ok: false as const,
  error: { code: "invalid_payload" as const, retryable: false as const },
};
const check = loadCheck();

it("matches the merged write descriptor without calling the use case", async () => {
  const schema = setProgressPage.request;
  const page = { id, generation: 1, progressPage: 1 };
  expect(check(schema, { ...page, progressPage: 0 })).toBe(false);
  expect(
    check(schema, { ...page, progressPage: Number.MAX_SAFE_INTEGER }),
  ).toBe(true);
  expect(check(schema, { ...page, progressPage: above })).toBe(false);
  expect(check(schema, { ...page, progressPage: 1.5 })).toBe(false);
  expect(check(schema, { ...page, progressPage: -3 })).toBe(false);
  expect(check(schema, { ...page, progressPage: null })).toBe(false);
  expect(check(schema, { ...page, generation: null })).toBe(false);
  expect(check(schema, { id, generation: 1 })).toBe(false);
  expect(check(schema, { ...page, path: "/tmp" })).toBe(false);
  expect(check(schema, { ...page, id: "A".repeat(64) })).toBe(false);
  for (const sample of writeSamples()) {
    await expectWriteSample(schema, sample);
  }
});

it("returns the use case page and the request generation", async () => {
  const calls: unknown[] = [];
  const command = createSetProgressPageCommand((request) => {
    calls.push(request);
    return stored(request.id, 9);
  });
  const settled = await command({ id, generation: 5, progressPage: 4 });
  expect(calls).toEqual([{ id, progressPage: 4 }]);
  expect(settled).toEqual({
    ok: true,
    value: { id, generation: 5, progressPage: 9 },
  });
});

it("returns not_found without detail", async () => {
  const settled = await failWrite("not_found");
  expect(settled.ok).toBe(false);
  if (settled.ok) {
    return;
  }
  expect(settled.error).toEqual({ code: "not_found", retryable: false });
  expect(Object.keys(settled.error)).toEqual(["code", "retryable"]);
});

it("returns rejected with only the request id and generation", async () => {
  const settled = await failWrite("rejected");
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
  expect(JSON.stringify(settled).includes("4")).toBe(false);
});

it("maps an unexpected library code to handler_threw", async () => {
  const settled = await failWrite("cancelled");
  expect(settled).toEqual({
    ok: false,
    error: { code: "handler_threw", retryable: true },
  });
});

async function expectWriteSample(
  schema: unknown,
  sample: unknown,
): Promise<void> {
  const calls: unknown[] = [];
  const command = createSetProgressPageCommand((request) => {
    calls.push(request);
    return stored(request.id, request.progressPage);
  });
  const settled = await command(asWrite(sample));
  const accepted = check(schema, sample);
  expect(calls).toHaveLength(accepted ? 1 : 0);
  if (!accepted) {
    expect(settled).toEqual(invalidPayload);
    return;
  }
  const progressPage = progressOf(sample);
  expect(calls).toEqual([{ id, progressPage }]);
  expect(settled).toEqual({
    ok: true,
    value: { id, generation: generationOf(sample), progressPage },
  });
}

function writeSamples(): readonly unknown[] {
  const page = { id, generation: 2, progressPage: 4 };
  const hidden: typeof page = { ...page };
  Object.defineProperty(hidden, "extra", { value: true, enumerable: false });
  const marked = { ...page };
  Object.defineProperty(marked, Symbol("s"), { value: true });
  return [
    { ...page, progressPage: 0 },
    { ...page, progressPage: Number.MAX_SAFE_INTEGER },
    { ...page, progressPage: above },
    { ...page, progressPage: 1.5 },
    { ...page, progressPage: -3 },
    { ...page, progressPage: null },
    { ...page, generation: 0 },
    { ...page, generation: null },
    { id, generation: 2 },
    { ...page, path: "/tmp" },
    { ...page, id: "A".repeat(64) },
    { ...page, id: "ab" },
    null,
    [],
    inheritedWrite(),
    swappedWrite(),
    hidden,
    marked,
    page,
  ];
}

function inheritedWrite(): unknown {
  const value: Record<string, unknown> = {};
  Object.setPrototypeOf(value, { id, generation: 2, progressPage: 4 });
  return value;
}

function swappedWrite(): unknown {
  const value: Record<string, unknown> = { one: true, two: true, three: true };
  Object.setPrototypeOf(value, { id, generation: 2, progressPage: 4 });
  return value;
}

async function failWrite(code: "not_found" | "rejected" | "cancelled") {
  const calls: unknown[] = [];
  const command = createSetProgressPageCommand((request) => {
    calls.push(request);
    return { ok: false, error: libraryFailure(code) };
  });
  const settled = await command({ id, generation: 8, progressPage: 4 });
  expect(calls).toEqual([{ id, progressPage: 4 }]);
  return settled;
}

function stored(
  value: string,
  progressPage: number,
): ReturnType<SetProgressPage> {
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

function progressOf(sample: unknown): number {
  if (!isRecord(sample) || typeof sample.progressPage !== "number") {
    throw new Error("page");
  }
  return sample.progressPage;
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

function asWrite(sample: unknown): Parameters<SetProgressPageCommand>[0] {
  return sample as Parameters<SetProgressPageCommand>[0];
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
