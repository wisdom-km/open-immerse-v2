import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

it("rejects the jobs domain module when it imports react (G13)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-jobs-"));
  try {
    const source = path.join("packages/features/jobs");
    cpSync(source, path.join(root, source), { recursive: true });
    const target = path.join(root, source, "src/domain/job-id.ts");
    const original = readFileSync(target, "utf8");
    const next = `${original}import type { FC } from "react";\nexport type Bad = FC;\n`;
    writeFileSync(target, next);
    const result = spawnSync(
      "node",
      [
        path.resolve("tools/check-deps/check.mjs"),
        "--config",
        path.resolve("dependency-cruiser.config.mjs"),
      ],
      { cwd: root, encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
