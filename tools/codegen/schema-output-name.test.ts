import { expect, it } from "vitest";

import { claimOutput, relativeOutput } from "./schema-output-name.mjs";

it("rejects a second source when the output path is already claimed", () => {
  const claimed = new Map<string, string>();
  claimOutput("/src/left/item.ts", "same.codegen.mjs", claimed);
  expect(() =>
    claimOutput("/src/right/item.ts", "same.codegen.mjs", claimed),
  ).toThrow(/^schema output collision: /);
});

it("rejects a source path that climbs out of the root", () => {
  expect(() =>
    relativeOutput("/tmp/oi-root", "/tmp/oi-root/../outside.ts"),
  ).toThrow(/^schema output outside root: /);
});

it("rejects a source path outside the root", () => {
  expect(() => relativeOutput("/tmp/oi-root", "/tmp/oi-other/file.ts")).toThrow(
    /^schema output outside root: /,
  );
});
