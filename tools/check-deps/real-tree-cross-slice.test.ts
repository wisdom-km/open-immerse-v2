import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import {
  cruiseRepo,
  removeEmptyDir,
  removeProbe,
  writeProbe,
} from "./real-tree-cruise.js";
import { withRealTreeLock } from "./real-tree-lock.js";

const probe = "packages/features/markdown/src/domain/_gate-reads-job-id.ts";

function cleanup(): void {
  removeProbe(probe);
  removeEmptyDir("packages/features/markdown/src/domain");
}

it("rejects markdown when it imports a jobs internal module (G5)", () => {
  withRealTreeLock(() => {
    try {
      writeProbe(
        probe,
        [
          'import { sameJobId } from "../../../jobs/src/domain/job-id.ts";',
          "export const used = sameJobId;",
          "",
        ].join("\n"),
      );
      const failed = cruiseRepo();
      expect(failed.status).not.toBe(0);
      expect(failed.output).toContain("no-cross-feature-internals");
      expect(failed.output).toContain(remediationBlock("G5"));
    } finally {
      cleanup();
    }
    const passed = cruiseRepo();
    expect(passed.status).toBe(0);
    expect(passed.output).not.toContain("gate-remediation:");
  });
}, 120_000);
