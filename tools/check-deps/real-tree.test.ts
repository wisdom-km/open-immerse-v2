import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import { cruiseRoot } from "./real-tree-cruise.js";
import { withWorktree } from "./real-tree-worktree.js";

function installFakeReact(root: string): void {
  const reactDir = path.join(root, "node_modules", "react");
  mkdirSync(reactDir, { recursive: true });
  writeFileSync(
    path.join(reactDir, "package.json"),
    '{"name":"react","version":"0.0.0","main":"index.js","types":"index.d.ts"}\n',
  );
  writeFileSync(
    path.join(reactDir, "index.js"),
    "export function createElement() { return null; }\n",
  );
  writeFileSync(
    path.join(reactDir, "index.d.ts"),
    "export type FC = () => void;\n",
  );
}

it("rejects the jobs domain module when it imports react (G13)", () => {
  withWorktree((root) => {
    installFakeReact(root);
    const target = path.join(
      root,
      "packages/features/jobs/src/domain/job-id.ts",
    );
    const original = readFileSync(target, "utf8");
    writeFileSync(
      target,
      `${original}import type { FC } from "react";\nexport type Bad = FC;\n`,
    );
    const failed = cruiseRoot(root);
    expect(failed.status).not.toBe(0);
    expect(failed.output).toContain("core-no-ui");
    expect(failed.output).toContain(remediationBlock("G13"));
  });
}, 120_000);
