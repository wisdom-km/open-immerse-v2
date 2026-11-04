import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import { cruiseRepo, removeProbe, writeProbe } from "./real-tree-cruise.js";
import { withRealTreeLock } from "./real-tree-lock.js";

const probe = "packages/features/jobs/src/domain/_gate-calls-ingest.ts";

it("rejects jobs when it imports ingest (G5)", () => {
  withRealTreeLock(() => {
    try {
      writeProbe(
        probe,
        [
          'import "../../../ingest/src/index.ts";',
          "export const used = true;",
          "",
        ].join("\n"),
      );
      const failed = cruiseRepo();
      expect(failed.status).not.toBe(0);
      expect(failed.output).toContain("feature-dependency-matrix");
      expect(failed.output).toContain(remediationBlock("G5"));
    } finally {
      removeProbe(probe);
    }
    const passed = cruiseRepo();
    expect(passed.status).toBe(0);
    expect(passed.output).not.toContain("gate-remediation:");
  });
}, 120_000);
