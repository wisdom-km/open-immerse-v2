import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const generated = [
  "apps/desktop/src/preload/oi.generated.ts",
  "apps/desktop/src/renderer/oi-api.d.ts",
  "apps/desktop/src/main/ipc/registry.generated.ts",
];

it("does not generate a renderer call for the reading commands", () => {
  const text = generated
    .map((rel) => readFileSync(path.resolve(rel), "utf8"))
    .join("\n");
  for (const channel of [
    "library.bindReadingAsset",
    "library.revokeReadingAsset",
    "library.getProgressPage",
    "library.setProgressPage",
    "parsing.getParseCapabilities",
    "settings.saveParseService",
    "settings.getParseServiceStatus",
  ]) {
    expect(text).not.toContain(channel);
  }
});
