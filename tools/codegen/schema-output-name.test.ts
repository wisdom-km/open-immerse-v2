import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { claimOutput } from "./schema-output-name.mjs";

it("rejects a second source when the output path is already claimed", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-schema-claim-"));
  const output = path.join(root, "same.codegen.mjs");
  const claimed = new Map<string, string>();
  try {
    claimOutput("/src/left/item.ts", output, claimed);
    expect(() => claimOutput("/src/right/item.ts", output, claimed)).toThrow(
      /^schema output collision: /,
    );
    expect(existsSync(output)).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
