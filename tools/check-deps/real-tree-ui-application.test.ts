import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import {
  cruiseRepo,
  removeEmptyDir,
  removeProbe,
  writeProbe,
} from "./real-tree-cruise.js";
import { withRealTreeLock } from "./real-tree-lock.js";

const application = "packages/features/jobs/src/application/_gate-use-job.ts";
const ui = "packages/features/markdown/src/ui/_gate-ui-application.ts";

function cleanup(): void {
  removeProbe(application);
  removeProbe(ui);
  removeEmptyDir("packages/features/jobs/src/application");
  removeEmptyDir("packages/features/markdown/src/ui");
}

it("rejects markdown ui when it imports the jobs application (G15)", () => {
  withRealTreeLock(() => {
    try {
      writeProbe(application, "export const id = 1;\n");
      writeProbe(
        ui,
        [
          'import { id } from "../../../jobs/src/application/_gate-use-job.ts";',
          "export const used = id;",
          "",
        ].join("\n"),
      );
      const failed = cruiseRepo();
      expect(failed.status).not.toBe(0);
      expect(failed.output).toContain("ui-through-seam");
      expect(failed.output).toContain(remediationBlock("G15"));
    } finally {
      cleanup();
    }
    const passed = cruiseRepo();
    expect(passed.status).toBe(0);
    expect(passed.output).not.toContain("gate-remediation:");
  });
}, 120_000);
