import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

it("rejects the jobs domain module when it imports react (G13)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-jobs-"));
  try {
    const source = path.join("packages/features/jobs");
    cpSync(source, path.join(root, source), { recursive: true });
    const reactDir = path.join(root, "node_modules/react");
    mkdirSync(reactDir, { recursive: true });
    writeFileSync(
      path.join(reactDir, "package.json"),
      '{"name":"react","version":"0.0.0","main":"index.js","types":"index.d.ts"}\n',
    );
    writeFileSync(path.join(reactDir, "index.js"), "export function createElement() { return null; }\n");
    writeFileSync(path.join(reactDir, "index.d.ts"), "export type FC = () => void;\n");
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
    const output = commandOutput(result);
    expect(output).toContain("core-no-ui");
    expect(output).toContain(remediationBlock("G13"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
