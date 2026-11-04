import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import { cruiseRoot, removeProbe, writeProbe } from "./real-tree-cruise.js";
import { withWorktree } from "./real-tree-worktree.js";

const probe = "packages/features/jobs/src/domain/_gate-calls-ingest.ts";

it("rejects jobs when it imports ingest (G5)", () => {
  withWorktree((root) => {
    writeProbe(
      root,
      probe,
      [
        'import "../../../ingest/src/index.ts";',
        "export const used = true;",
        "",
      ].join("\n"),
    );
    const failed = cruiseRoot(root);
    expect(failed.status).not.toBe(0);
    expect(failed.output).toContain("feature-dependency-matrix");
    expect(failed.output).toContain(remediationBlock("G5"));
    removeProbe(root, probe);
    const passed = cruiseRoot(root);
    expect(passed.status).toBe(0);
    expect(passed.output).not.toContain("gate-remediation:");
  });
}, 120_000);
