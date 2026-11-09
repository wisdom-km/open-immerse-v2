import { expect, expectTypeOf, it } from "vitest";

import { ipcRegistry } from "../src/main/ipc/registry.generated.js";
import type {
  IpcJsonSchema,
  IpcRegistryEntry,
} from "../src/main/ipc/registry.generated.js";
import { createOi } from "../src/preload/oi.generated.js";

// `parsing` and `settings` stay forbidden. A later approval that exposes
// either namespace must update this test in that same change. Do not delete
// these names to make the failure go away.
const forbidden = [
  "parsing.getParseCapabilities",
  "settings.saveParseService",
  "settings.getParseServiceStatus",
  "getParseCapabilities",
  "saveParseService",
  "getParseServiceStatus",
  "parsing",
  "settings",
  "secret",
  "secretRef",
] as const;

it("keeps parse contracts and secret names off the registry and preload", () => {
  const names = surfaceNames();
  for (const name of forbidden) {
    expect(names, name).not.toContain(name);
  }
});

it("types the window and preload without parse namespaces or secret fields", () => {
  expectTypeOf<
    Extract<Names<Window["oi"]>, ForbiddenName>
  >().toEqualTypeOf<never>();
  expectTypeOf<
    Extract<Names<ReturnType<typeof createOi>>, ForbiddenName>
  >().toEqualTypeOf<never>();
});

type ForbiddenName = (typeof forbidden)[number];

type Depth = [0, 0, 0, 0, 0, 0, 0, 0];

type Names<T> = Walk<T, Depth>;

type Walk<T, Left extends readonly unknown[]> = Left["length"] extends 0
  ? never
  : T extends File | Blob | EventTarget
    ? never
    : T extends readonly (infer Item)[]
      ? Walk<Item, Drop<Left>>
      : T extends object
        ? {
            [Key in keyof T]-?: Key extends string
              ? Key | CallOrValue<T[Key], Drop<Left>>
              : never;
          }[keyof T]
        : never;

type CallOrValue<T, Left extends readonly unknown[]> = T extends (
  ...args: infer Args
) => infer Result
  ? Walk<Args[number], Left> | Walk<Awaited<Result>, Left>
  : Walk<T, Left>;

type Drop<Left extends readonly unknown[]> = Left extends readonly [
  unknown,
  ...infer Rest,
]
  ? Rest
  : [];

function surfaceNames(): readonly string[] {
  const paths = keyPaths(preload());
  const names: string[] = [...registryNames(ipcRegistry), ...paths];
  for (const path of paths) {
    names.push(...path.split("."));
  }
  return names;
}

function registryNames(
  entries: readonly IpcRegistryEntry[],
): readonly string[] {
  const names: string[] = [];
  for (const entry of entries) {
    names.push(entry.channel);
    if (entry.kind === "command") {
      names.push(...schemaNames(entry.request), ...schemaNames(entry.response));
    } else {
      names.push(...schemaNames(entry.payload));
    }
  }
  return names;
}

function schemaNames(schema: IpcJsonSchema | null): readonly string[] {
  if (schema === null) {
    return [];
  }
  const names: string[] = [];
  const properties = schema.properties;
  if (properties !== undefined) {
    for (const key of Object.keys(properties)) {
      names.push(key);
      const child = properties[key];
      if (child !== undefined) {
        names.push(...schemaNames(child));
      }
    }
  }
  const required = schema.required;
  if (required !== undefined) {
    names.push(...required);
  }
  if (typeof schema.const === "string") {
    names.push(schema.const);
  }
  if (schema.items !== undefined) {
    names.push(...schemaNames(schema.items));
  }
  const variants = schema.anyOf;
  if (variants !== undefined) {
    for (const variant of variants) {
      names.push(...schemaNames(variant));
    }
  }
  return names;
}

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
