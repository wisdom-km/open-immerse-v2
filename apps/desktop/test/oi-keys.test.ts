import { expect, it } from "vitest";

import { createOi } from "../src/preload/oi.generated.js";

it("lists the exposed library commands", () => {
  const oi = createOi({
    invoke: () => Promise.resolve(undefined),
    invokeDropped: () => Promise.resolve(undefined),
    subscribe: () => () => undefined,
  });
  expect(keyPaths(oi)).toEqual([
    "library.import",
    "library.importDropped",
    "library.list",
    "library.relocate",
    "parsing.getParseCapabilities",
  ]);
  expect("invoke" in oi).toBe(false);
  expect("invokeDropped" in oi).toBe(false);
});

function keyPaths(value: unknown, prefix = ""): readonly string[] {
  if (typeof value === "function") {
    return prefix === "" ? [] : [prefix];
  }
  if (typeof value !== "object" || value === null) {
    return [];
  }
  const paths: string[] = [];
  for (const key of Object.keys(value).sort()) {
    const next = prefix === "" ? key : `${prefix}.${key}`;
    paths.push(...keyPaths(record(value)[key], next));
  }
  return paths;
}

function record(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}
