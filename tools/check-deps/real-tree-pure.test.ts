import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import {
  cruiseRoot,
  removeEmptyDir,
  removeProbe,
  writeProbe,
} from "./real-tree-cruise.js";
import { withWorktree } from "./real-tree-worktree.js";

const pureRelative = "packages/features/jobs/src/pure.ts";
const uiPure = "packages/features/jobs/src/ui/_gate-reads-pure.ts";
const uiDomain = "packages/features/jobs/src/ui/_gate-reads-domain.ts";
const application = "packages/features/jobs/src/application/_gate-pure-app.ts";

function expectPass(root: string): void {
  const passed = cruiseRoot(root);
  expect(passed.status).toBe(0);
  expect(passed.output).not.toContain("gate-remediation:");
}

function expectRule(root: string, rule: string): void {
  const failed = cruiseRoot(root);
  expect(failed.status).not.toBe(0);
  expect(failed.output).toContain(rule);
  expect(failed.output).toContain(remediationBlock("G15"));
}

it("accepts jobs ui when it imports this slice pure.ts", () => {
  withWorktree((root) => {
    writeProbe(
      root,
      uiPure,
      [
        'import { sameJobId } from "../pure.ts";',
        "export const used = sameJobId;",
        "",
      ].join("\n"),
    );
    expectPass(root);
    removeProbe(root, uiPure);
    removeEmptyDir(root, "packages/features/jobs/src/ui");
    expectPass(root);
  });
}, 120_000);

it("rejects jobs pure.ts when it imports application (G15)", () => {
  withWorktree((root) => {
    const purePath = path.join(root, pureRelative);
    const original = readFileSync(purePath, "utf8");
    writeProbe(root, application, "export const id = 1;\n");
    writeFileSync(
      purePath,
      `${original}import { id } from "./application/_gate-pure-app.ts";\nexport const bad = id;\n`,
    );
    expectRule(root, "pure-seam-stays-pure");
    writeFileSync(purePath, original);
    removeProbe(root, application);
    removeEmptyDir(root, "packages/features/jobs/src/application");
    expectPass(root);
  });
}, 120_000);

it("rejects jobs pure.ts when it imports node:fs (G15)", () => {
  withWorktree((root) => {
    const purePath = path.join(root, pureRelative);
    const original = readFileSync(purePath, "utf8");
    writeFileSync(purePath, `${original}import "node:fs";\n`);
    expectRule(root, "pure-seam-stays-pure");
    writeFileSync(purePath, original);
    expectPass(root);
  });
}, 120_000);

it("rejects jobs ui when it imports this slice domain (G15)", () => {
  withWorktree((root) => {
    writeProbe(
      root,
      uiDomain,
      [
        'import { sameJobId } from "../domain/job-id.ts";',
        "export const used = sameJobId;",
        "",
      ].join("\n"),
    );
    expectRule(root, "ui-through-seam");
    removeProbe(root, uiDomain);
    removeEmptyDir(root, "packages/features/jobs/src/ui");
    expectPass(root);
  });
}, 120_000);
