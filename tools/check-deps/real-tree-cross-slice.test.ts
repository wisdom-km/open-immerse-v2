import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import {
  cruiseRoot,
  removeEmptyDir,
  removeProbe,
  writeProbe,
} from "./real-tree-cruise.js";
import { withWorktree } from "./real-tree-worktree.js";

const probe = "packages/features/markdown/src/domain/_gate-reads-job-id.ts";

function cleanup(root: string): void {
  removeProbe(root, probe);
  removeEmptyDir(root, "packages/features/markdown/src/domain");
}

it("rejects markdown when it imports a jobs internal module (G5)", () => {
  withWorktree((root) => {
    writeProbe(
      root,
      probe,
      [
        'import { sameJobId } from "../../../jobs/src/domain/job-id.ts";',
        "export const used = sameJobId;",
        "",
      ].join("\n"),
    );
    const failed = cruiseRoot(root);
    expect(failed.status).not.toBe(0);
    expect(failed.output).toContain("no-cross-feature-internals");
    expect(failed.output).toContain(remediationBlock("G5"));
    cleanup(root);
    const passed = cruiseRoot(root);
    expect(passed.status).toBe(0);
    expect(passed.output).not.toContain("gate-remediation:");
  });
}, 120_000);
