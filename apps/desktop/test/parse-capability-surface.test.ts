import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const generated = [
  "apps/desktop/src/preload/oi.generated.ts",
  "apps/desktop/src/renderer/oi-api.d.ts",
  "apps/desktop/src/main/ipc/registry.generated.ts",
];

it("does not generate a renderer call for the parse commands", () => {
  const text = generated
    .map((rel) => readFileSync(path.resolve(rel), "utf8"))
    .join("\n");
  expect(text).not.toContain("parsing.getParseCapabilities");
  expect(text).not.toContain("settings.saveParseService");
  expect(text).not.toContain("settings.getParseServiceStatus");
  expect(text).not.toContain("saveParseService");
  expect(text).not.toContain("getParseServiceStatus");
  expect(text).not.toContain("secretRef");
  expect(text).not.toContain('"secret"');
});
