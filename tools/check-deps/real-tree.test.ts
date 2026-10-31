import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { expect, it } from "vitest";

const target = "packages/features/jobs/src/domain/job-id.ts";

it("rejects a jobs domain module that imports react (G13)", () => {
  const original = readFileSync(target, "utf8");
  const next = `${original}import type { FC } from "react";\nexport type Bad = FC;\n`;
  writeFileSync(target, next);
  try {
    const result = spawnSync("node", ["tools/check-deps/check.mjs"], { encoding: "utf8" });
    expect(result.status).not.toBe(0);
  } finally {
    writeFileSync(target, original);
  }
});
