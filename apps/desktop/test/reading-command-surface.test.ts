import { expect, expectTypeOf, it } from "vitest";

import { ipcRegistry } from "../src/main/ipc/registry.generated.js";
import { createOi } from "../src/preload/oi.generated.js";

const hidden = [
  "settings.saveParseService",
  "settings.getParseServiceStatus",
] as const;

const exposed = [
  "ingest.openDocument",
  "library.bindReadingAsset",
  "library.getProgressPage",
  "library.import",
  "library.importDropped",
  "library.list",
  "library.relocate",
  "library.revokeReadingAsset",
  "library.setProgressPage",
  "parsing.getParseCapabilities",
] as const;

it("keeps internal commands off the registry and the preload object", () => {
  const channels = ipcRegistry.map((entry) => entry.channel);
  const keys = keyPaths(preload());
  expect(keys).toEqual([...exposed]);
  for (const channel of hidden) {
    expect(channels).not.toContain(channel);
    expect(keys).not.toContain(channel);
  }
});

it("types the window and the preload return as the same exposed commands", () => {
  expectTypeOf<keyof Window["oi"]>().toEqualTypeOf<
    "ingest" | "library" | "parsing"
  >();
  expectTypeOf<keyof Window["oi"]["library"]>().toEqualTypeOf<ExposedName>();
  expectTypeOf<keyof Window["oi"]["ingest"]>().toEqualTypeOf<"openDocument">();
  expectTypeOf<
    keyof Window["oi"]["parsing"]
  >().toEqualTypeOf<"getParseCapabilities">();
  expectTypeOf<PreloadName>().toEqualTypeOf<ExposedName>();
  expectTypeOf<PreloadIngest>().toEqualTypeOf<"openDocument">();
});

type ExposedName =
  | "bindReadingAsset"
  | "getProgressPage"
  | "import"
  | "importDropped"
  | "list"
  | "relocate"
  | "revokeReadingAsset"
  | "setProgressPage";

type PreloadName = keyof ReturnType<typeof createOi>["library"];

type PreloadIngest = keyof ReturnType<typeof createOi>["ingest"];

function preload(): unknown {
  return createOi({
    invoke: () => Promise.resolve(undefined),
    invokeDropped: () => Promise.resolve(undefined),
    subscribe: () => () => undefined,
  });
}

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
