import { expect, it } from "vitest";

import {
  reduceCruise,
  type CruiseModule,
  type CruiseResult,
} from "./reduce.mjs";

const files: Record<string, string> = {
  "packages/contracts/src/diag-events.ts":
    'import type { Logger, Result } from "@oi/kernel";\n',
  "packages/features/jobs/src/index.ts":
    'export { parseJobId } from "./domain/job-id.js";\nexport type { JobId } from "./domain/job-id.js";\n',
  "packages/features/ingest/src/ui/panel.ts":
    'import { open } from "../pure.js";\nimport { JobId } from "../domain/job-id.js";\n',
  "packages/platform-node/src/logging/a.ts":
    'import type { DiagEvent } from "@oi/contracts";\nimport { healthResponseSchema } from "@oi/contracts";\n',
  "packages/kernel/src/clock.ts": "export const now = 0;\n",
  "apps/desktop/src/main/window.ts":
    'import { createFileLogger } from "@oi/platform-node";\nimport { createFileLogger as again } from "@oi/platform-node";\n',
};

function readText(rel: string): string {
  return files[rel] ?? "";
}

function cruise(modules: readonly CruiseModule[]): CruiseResult {
  return { modules };
}

it("drops tests, e2e, npm, node builtins, and same-layer edges", () => {
  const reduced = reduceCruise(
    cruise([
      {
        source: "apps/desktop/e2e/csp.spec.ts",
        dependencies: [
          {
            module: "../src/main/security/csp.js",
            resolved: "apps/desktop/src/main/security/csp.ts",
            dependencyTypes: ["local", "import"],
          },
        ],
      },
      {
        source: "packages/features/jobs/test/core/job-id.test.ts",
        dependencies: [
          {
            module: "../../src/domain/job-id.js",
            resolved: "packages/features/jobs/src/domain/job-id.ts",
            dependencyTypes: ["local", "import"],
          },
        ],
      },
      {
        source: "apps/desktop/src/main/window.ts",
        dependencies: [
          {
            module: "electron",
            dependencyTypes: ["npm", "import"],
            coreModule: false,
          },
          {
            module: "node:fs",
            dependencyTypes: ["core"],
            coreModule: true,
          },
          {
            module: "./scheme-response.js",
            resolved: "apps/desktop/src/main/scheme-response.ts",
            dependencyTypes: ["local", "import"],
          },
        ],
      },
    ]),
    readText,
  );
  expect(reduced.edges).toEqual([]);
  expect(reduced.unmapped).toEqual([]);
});

it("keeps a type-only contracts to kernel edge and a seam re-export", () => {
  const reduced = reduceCruise(
    cruise([
      {
        source: "packages/contracts/src/diag-events.ts",
        dependencies: [
          {
            module: "@oi/kernel",
            resolved: "packages/kernel/src/index.ts",
            dependencyTypes: ["aliased-tsconfig-paths", "type-only", "import"],
          },
        ],
      },
      {
        source: "packages/features/jobs/src/index.ts",
        dependencies: [
          {
            module: "./domain/job-id.js",
            resolved: "packages/features/jobs/src/domain/job-id.ts",
            dependencyTypes: ["local", "export"],
          },
          {
            module: "./domain/job-id.js",
            resolved: "packages/features/jobs/src/domain/job-id.ts",
            dependencyTypes: ["local", "type-only", "export"],
          },
        ],
      },
    ]),
    readText,
  );
  expect(reduced.edges).toEqual([
    {
      from: "C",
      to: "K",
      typeOnly: true,
      viaPure: false,
      example: "packages/contracts/src/diag-events.ts:1",
    },
  ]);
  expect(reduced.unmapped).toEqual([
    {
      from: "SEAM",
      to: "DOM",
      example: "packages/features/jobs/src/index.ts:1",
    },
  ]);
});

it("marks pure.ts as the UI to domain gate and prefers a value-import line", () => {
  const reduced = reduceCruise(
    cruise([
      {
        source: "packages/features/ingest/src/ui/panel.ts",
        dependencies: [
          {
            module: "../pure.js",
            resolved: "packages/features/ingest/src/pure.ts",
            dependencyTypes: ["local", "import"],
          },
          {
            module: "../domain/job-id.js",
            resolved: "packages/features/jobs/src/domain/job-id.ts",
            dependencyTypes: ["local", "import"],
          },
        ],
      },
      {
        source: "packages/platform-node/src/logging/a.ts",
        dependencies: [
          {
            module: "@oi/contracts",
            resolved: "packages/contracts/src/diag-events.ts",
            dependencyTypes: ["aliased", "type-only", "import"],
          },
          {
            module: "@oi/contracts",
            resolved: "packages/contracts/src/worker/health.ts",
            dependencyTypes: ["aliased", "import"],
          },
        ],
      },
    ]),
    readText,
  );
  expect(reduced.edges).toEqual([
    {
      from: "PN",
      to: "C",
      typeOnly: false,
      viaPure: false,
      example: "packages/platform-node/src/logging/a.ts:2",
    },
    {
      from: "UI",
      to: "DOM",
      typeOnly: false,
      viaPure: false,
      example: "packages/features/ingest/src/ui/panel.ts:2",
    },
  ]);
});
