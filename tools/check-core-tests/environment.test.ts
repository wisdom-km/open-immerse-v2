import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

it("rejects a vitest environment directive in a core test (G16)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-core-"));
  const file = path.join(root, "packages/features/document/test/core/renders.ts");
  try {
    mkdirSync(path.dirname(file), { recursive: true });
    const marker = ["@", "vitest-environment"].join("");
    writeFileSync(file, `// ${marker} jsdom\nexport const n = 1;\n`);
    expect(() =>
      execFileSync("node", [path.resolve("tools/check-core-tests/check.mjs"), "--root", root], {
        encoding: "utf8",
      }),
    ).toThrow();
    writeFileSync(file, "export const n = 1;\n");
    execFileSync("node", [path.resolve("tools/check-core-tests/check.mjs"), "--root", root], {
      encoding: "utf8",
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
