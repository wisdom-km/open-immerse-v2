import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import {
  cruiseRoot,
  removeEmptyDir,
  removeProbe,
  writeProbe,
} from "./real-tree-cruise.js";
import { withWorktree } from "./real-tree-worktree.js";

const application = "packages/features/jobs/src/application/_gate-use-job.ts";
const ui = "packages/features/markdown/src/ui/_gate-ui-application.ts";

function cleanup(root: string): void {
  removeProbe(root, application);
  removeProbe(root, ui);
  removeEmptyDir(root, "packages/features/jobs/src/application");
  removeEmptyDir(root, "packages/features/markdown/src/ui");
}

it("rejects markdown ui when it imports the jobs application (G15)", () => {
  withWorktree((root) => {
    writeProbe(root, application, "export const id = 1;\n");
    writeProbe(
      root,
      ui,
      [
        'import { id } from "../../../jobs/src/application/_gate-use-job.ts";',
        "export const used = id;",
        "",
      ].join("\n"),
    );
    const failed = cruiseRoot(root);
    expect(failed.status).not.toBe(0);
    expect(failed.output).toContain("ui-through-seam");
    expect(failed.output).toContain(remediationBlock("G15"));
    cleanup(root);
    const passed = cruiseRoot(root);
    expect(passed.status).toBe(0);
    expect(passed.output).not.toContain("gate-remediation:");
  });
}, 120_000);
