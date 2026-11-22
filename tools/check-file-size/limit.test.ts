import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput } from "../gate-remediation/block.js";

function run(root: string, allowlist?: string) {
  const args = [
    path.resolve("tools/check-file-size/check.mjs"),
    "--root",
    root,
  ];
  if (allowlist !== undefined) {
    args.push("--allowlist", allowlist);
  }
  return spawnSync("node", args, { encoding: "utf8" });
}

function writeLines(file: string, count: number) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "export const n = 1;\n".repeat(count));
}

it("prints each former line hint and does not fail on the count", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-size-"));
  try {
    writeLines(path.join(root, "big.ts"), 601);
    writeLines(path.join(root, "apps/desktop/src/main/index.ts"), 151);
    writeLines(path.join(root, "Widget.tsx"), 401);
    writeLines(path.join(root, "sample.test.ts"), 801);
    writeLines(path.join(root, "ok.ts"), 10);
    writeLines(path.join(root, "edge.ts"), 600);
    const reported = run(root);
    expect(reported.status).toBe(0);
    const output = commandOutput(reported);
    expect(output).toContain("big.ts: 601 lines > 600");
    expect(output).toContain("apps/desktop/src/main/index.ts: 151 lines > 150");
    expect(output).toContain("Widget.tsx: 401 lines > 400");
    expect(output).toContain("sample.test.ts: 801 lines > 800");
    expect(output).not.toContain("ok.ts:");
    expect(output).not.toContain("edge.ts:");
    expect(output).not.toContain("gate-remediation:");
    expect(output).toContain("source files scanned");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("still skips generated paths and still reports an exempt path", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-size-"));
  try {
    writeLines(
      path.join(root, "apps/desktop/src/preload/oi.generated.ts"),
      900,
    );
    writeLines(path.join(root, "listed.ts"), 601);
    const allowlist = path.join(root, "allow.json");
    writeFileSync(
      allowlist,
      JSON.stringify({
        ignore: [
          {
            pattern: "apps/desktop/src/preload/oi.generated.ts",
            reason: "generated",
          },
        ],
        exemptions: [
          {
            path: "listed.ts",
            reason: "old exemption",
            adr: "0001",
            expiresMilestone: "M1",
          },
        ],
      }),
    );
    const reported = run(root, allowlist);
    expect(reported.status).toBe(0);
    const output = commandOutput(reported);
    expect(output).not.toContain("oi.generated.ts");
    expect(output).toContain(
      "listed.ts: 601 lines > 600 listed in exemptions, still reported",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("still fails when the allowlist cannot be read", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-size-"));
  try {
    writeLines(path.join(root, "ok.ts"), 1);
    const broken = path.join(root, "broken.json");
    writeFileSync(broken, "{");
    const invalid = run(root, broken);
    expect(invalid.status).not.toBe(0);

    const missing = path.join(root, "missing.json");
    writeFileSync(missing, JSON.stringify({ ignore: [{ pattern: "ok.ts" }] }));
    const incomplete = run(root, missing);
    expect(incomplete.status).not.toBe(0);
    expect(commandOutput(incomplete)).toContain(
      "ignore entry needs pattern and reason",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
