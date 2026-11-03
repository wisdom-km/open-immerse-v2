import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, it } from "vitest";

import { healthResponseSchema } from "../src/worker/health.js";
import {
  matchesWorkerVersion,
  workerVersionLimits,
  workerVersionText,
} from "../src/worker/worker-version.js";

const samples = [
  "0.0.0",
  "",
  "0.0.0 ",
  "a".repeat(64),
  "a".repeat(65),
  "has space",
];

it("copies pattern and maxLength from the schema", () => {
  const capped = Type.String({
    minLength: 1,
    maxLength: 8,
    pattern: "^[a-z]+$",
  });
  expect(workerVersionLimits(capped)).toEqual({
    minLength: 1,
    maxLength: 8,
    pattern: capped.pattern,
  });
  const live = workerVersionLimits(workerVersionText);
  expect(live.minLength).toBe(workerVersionText.minLength);
  expect(live.maxLength).toBe(workerVersionText.maxLength);
  expect(live.pattern).toBe(workerVersionText.pattern);
});

it("matches a workerVersion when the schema pattern and maxLength do", () => {
  const embedded = healthResponseSchema.properties.workerVersion;
  expect(embedded.pattern).toBe(workerVersionText.pattern);
  expect(embedded.maxLength).toBe(workerVersionText.maxLength);
  expect(embedded.minLength).toBe(workerVersionText.minLength);
  expect(workerVersionText.maxLength).toBeUndefined();
  for (const sample of samples) {
    expect(matchesWorkerVersion(sample)).toBe(
      Value.Check(workerVersionText, sample),
    );
  }
  expect(matchesWorkerVersion("a".repeat(64))).toBe(true);
  expect(matchesWorkerVersion("a".repeat(65))).toBe(true);
  expect(matchesWorkerVersion("")).toBe(false);
  expect(matchesWorkerVersion("0.0.0 ")).toBe(false);
});
