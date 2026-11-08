import type { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { IpcCommandDescriptor } from "../src/ipc/descriptor.js";
import {
  getProgressPage,
  libraryProgressIpc,
  setProgressPage,
} from "../src/ipc/library-progress.js";
import {
  getProgressPage as exportedGet,
  setProgressPage as exportedSet,
} from "../src/index.js";

const id = "ab".repeat(32);
const generation = 3;
const above = Number.MAX_SAFE_INTEGER + 1;

it("keeps the progress commands unexposed", () => {
  expect(getProgressPage.expose).toBe(false);
  expect(setProgressPage.expose).toBe(false);
  expect(getProgressPage.idempotent).toBe(true);
  expect(setProgressPage.idempotent).toBe(true);
  expect(getProgressPage).toBe(exportedGet);
  expect(setProgressPage).toBe(exportedSet);
  expectTypeOf(getProgressPage).toExtend<IpcCommandDescriptor>();
  expectTypeOf(setProgressPage).toExtend<IpcCommandDescriptor>();
  expect(libraryProgressIpc.map((descriptor) => descriptor.channel)).toEqual([
    "library.getProgressPage",
    "library.setProgressPage",
  ]);
});

it("accepts a stored null and a safe page on read", () => {
  expect(Value.Check(getProgressPage.request, { id, generation })).toBe(true);
  expect(Value.Check(getProgressPage.request, { id })).toBe(false);
  expect(Value.Check(getProgressPage.request, { id, generation: above })).toBe(
    false,
  );
  expect(Value.Check(getProgressPage.request, { id, generation: 1.5 })).toBe(
    false,
  );
  expect(
    Value.Check(getProgressPage.response, {
      id,
      generation,
      progressPage: null,
    }),
  ).toBe(true);
  expect(
    Value.Check(getProgressPage.response, {
      id,
      generation,
      progressPage: Number.MAX_SAFE_INTEGER,
    }),
  ).toBe(true);
  expect(
    Value.Check(getProgressPage.response, {
      id,
      generation,
      progressPage: 0,
    }),
  ).toBe(false);
});

it("rejects null and an unsafe page on write", () => {
  const page = { id, generation, progressPage: 1 };
  expect(Value.Check(setProgressPage.request, page)).toBe(true);
  expect(
    Value.Check(setProgressPage.request, {
      ...page,
      progressPage: Number.MAX_SAFE_INTEGER,
    }),
  ).toBe(true);
  expect(
    Value.Check(setProgressPage.request, { ...page, progressPage: null }),
  ).toBe(false);
  expect(
    Value.Check(setProgressPage.request, { ...page, progressPage: 0 }),
  ).toBe(false);
  expect(
    Value.Check(setProgressPage.request, { ...page, progressPage: 1.5 }),
  ).toBe(false);
  expect(
    Value.Check(setProgressPage.request, { ...page, progressPage: above }),
  ).toBe(false);
  expect(Value.Check(setProgressPage.request, { ...page, path: "/tmp" })).toBe(
    false,
  );
  expect(Value.Check(setProgressPage.response, page)).toBe(true);
  expect(
    Value.Check(setProgressPage.response, { ...page, progressPage: null }),
  ).toBe(false);
});

it("echoes the request pair and not the page when progress is rejected", () => {
  for (const command of [getProgressPage, setProgressPage]) {
    const detail = requiredDetail(command.errors);
    expect(propertyNames(detail)).toEqual(["id", "generation"]);
    expect(Value.Check(detail, { id, generation })).toBe(true);
    expect(Value.Check(detail, { id, generation, progressPage: 1 })).toBe(
      false,
    );
    expect(detailOf(command.errors, "not_found")).toBeUndefined();
  }
});

function detailOf(
  errors: readonly { readonly code: string; readonly detail?: unknown }[],
  code: string,
): unknown {
  return errors.find((error) => error.code === code)?.detail;
}

function requiredDetail(
  errors: readonly { readonly code: string; readonly detail?: unknown }[],
): TSchema {
  const detail = detailOf(errors, "rejected");
  if (!isSchema(detail)) {
    throw new Error("rejected detail");
  }
  return detail;
}

function isSchema(value: unknown): value is TSchema {
  return typeof value === "object" && value !== null && "type" in value;
}

function propertyNames(schema: unknown): string[] {
  if (typeof schema !== "object" || schema === null) {
    return [];
  }
  const properties = (schema as { properties?: unknown }).properties;
  if (typeof properties !== "object" || properties === null) {
    return [];
  }
  return Object.keys(properties);
}
