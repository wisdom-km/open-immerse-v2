import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, it } from "vitest";

const vitestBin = path.resolve("node_modules/vitest/vitest.mjs");

it("collects no test path under node_modules when vitest lists the suite", () => {
  const listed = spawnSync(process.execPath, [vitestBin, "list"], {
    encoding: "utf8",
    cwd: path.resolve("."),
    env: { ...process.env, CI: "1" },
  });
  expect(listed.status, listed.stderr).toBe(0);
  const lines = listed.stdout.split("\n").filter((line) => line.length > 0);
  expect(lines.length).toBeGreaterThan(0);
  const nested = lines
    .map((line) => line.split(" > ")[0] ?? line)
    .filter((file) => file.split(/[/\\]/).includes("node_modules"));
  expect(nested).toEqual([]);
});
