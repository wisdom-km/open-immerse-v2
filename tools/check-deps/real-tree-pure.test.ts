import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

import { remediationBlock } from "../gate-remediation/block.js";
import {
  cruiseRepo,
  removeEmptyDir,
  removeProbe,
  writeProbe,
} from "./real-tree-cruise.js";
import { withRealTreeLock } from "./real-tree-lock.js";

const purePath = path.resolve("packages/features/jobs/src/pure.ts");
const uiPure = "packages/features/jobs/src/ui/_gate-reads-pure.ts";
const uiDomain = "packages/features/jobs/src/ui/_gate-reads-domain.ts";
const application = "packages/features/jobs/src/application/_gate-pure-app.ts";

function restorePure(original: string): void {
  writeFileSync(purePath, original);
}

function expectPass(): void {
  const passed = cruiseRepo();
  expect(passed.status).toBe(0);
  expect(passed.output).not.toContain("gate-remediation:");
}

function expectRule(rule: string): void {
  const failed = cruiseRepo();
  expect(failed.status).not.toBe(0);
  expect(failed.output).toContain(rule);
  expect(failed.output).toContain(remediationBlock("G15"));
}

it("accepts jobs ui when it imports this slice pure.ts", () => {
  withRealTreeLock(() => {
    try {
      writeProbe(
        uiPure,
        [
          'import { sameJobId } from "../pure.ts";',
          "export const used = sameJobId;",
          "",
        ].join("\n"),
      );
      expectPass();
    } finally {
      removeProbe(uiPure);
      removeEmptyDir("packages/features/jobs/src/ui");
    }
    expectPass();
  });
}, 120_000);

it("rejects jobs pure.ts when it imports application (G15)", () => {
  withRealTreeLock(() => {
    const original = readFileSync(purePath, "utf8");
    try {
      writeProbe(application, "export const id = 1;\n");
      writeFileSync(
        purePath,
        `${original}import { id } from "./application/_gate-pure-app.ts";\nexport const bad = id;\n`,
      );
      expectRule("pure-seam-stays-pure");
    } finally {
      restorePure(original);
      removeProbe(application);
      removeEmptyDir("packages/features/jobs/src/application");
    }
    expectPass();
  });
}, 120_000);

it("rejects jobs pure.ts when it imports node:fs (G15)", () => {
  withRealTreeLock(() => {
    const original = readFileSync(purePath, "utf8");
    try {
      writeFileSync(purePath, `${original}import "node:fs";\n`);
      expectRule("pure-seam-stays-pure");
    } finally {
      restorePure(original);
    }
    expectPass();
  });
}, 120_000);

it("rejects jobs ui when it imports this slice domain (G15)", () => {
  withRealTreeLock(() => {
    try {
      writeProbe(
        uiDomain,
        [
          'import { sameJobId } from "../domain/job-id.ts";',
          "export const used = sameJobId;",
          "",
        ].join("\n"),
      );
      expectRule("ui-through-seam");
    } finally {
      removeProbe(uiDomain);
      removeEmptyDir("packages/features/jobs/src/ui");
    }
    expectPass();
  });
}, 120_000);
