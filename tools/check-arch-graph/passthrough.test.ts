import { expect, it } from "vitest";

import { compareGraph } from "./compare.mjs";
import { classifyFeatureIndex, isFeatureIndex } from "./passthrough.mjs";
import { parseMermaid } from "./parse-mermaid.mjs";
import {
  reduceCruise,
  type CruiseModule,
  type CruiseResult,
} from "./reduce.mjs";

const files: Record<string, string> = {};

function readText(rel: string): string {
  return files[rel] ?? "";
}

function cruise(modules: readonly CruiseModule[]): CruiseResult {
  return { modules };
}

function put(rel: string, text: string): void {
  files[rel] = text;
}

it("recognizes only a feature package root index", () => {
  expect(isFeatureIndex("packages/features/jobs/src/index.ts")).toBe(true);
  expect(isFeatureIndex("packages\\features\\jobs\\src\\index.ts")).toBe(true);
  expect(isFeatureIndex("packages/features/jobs/src/domain/index.ts")).toBe(
    false,
  );
  expect(isFeatureIndex("packages/kernel/src/index.ts")).toBe(false);
});

it("accepts re-exports, export star, and an empty export", () => {
  expect(
    classifyFeatureIndex(
      'export { parseJobId, sameJobId } from "./domain/job-id.js";\nexport type { JobId } from "./domain/job-id.js";\n',
    ),
  ).toEqual({ kind: "passthrough" });
  expect(
    classifyFeatureIndex(
      'export * from "./domain/job-id.js";\nexport type * from "./domain/job-id.js";\nexport * as job from "./domain/job-id.js";\n',
    ),
  ).toEqual({ kind: "passthrough" });
  expect(classifyFeatureIndex("/* seam */\nexport {};\n")).toEqual({
    kind: "passthrough",
  });
  expect(
    classifyFeatureIndex(
      'export {\n  parseJobId,\n} from "./domain/job-id.js";\n',
    ),
  ).toEqual({ kind: "passthrough" });
});

it("reports the first statement that is not a re-export", () => {
  expect(
    classifyFeatureIndex(
      'import { parseJobId } from "./domain/job-id.js";\nexport { parseJobId };\n',
    ),
  ).toEqual({ kind: "impure", line: 1 });
  expect(
    classifyFeatureIndex(
      'export { parseJobId } from "./domain/job-id.js";\nexport const extra = 1;\n',
    ),
  ).toEqual({ kind: "impure", line: 2 });
});

it("follows a pure index to the importer and target layers", () => {
  put(
    "packages/features/ingest/src/application/open.ts",
    'import { parseJobId } from "@oi/feature-jobs";\n',
  );
  put(
    "packages/features/jobs/src/index.ts",
    'export { parseJobId } from "./domain/job-id.js";\n',
  );
  const reduced = reduceCruise(
    cruise([
      {
        source: "packages/features/ingest/src/application/open.ts",
        dependencies: [
          {
            module: "@oi/feature-jobs",
            resolved: "packages/features/jobs/src/index.ts",
            dependencyTypes: ["aliased", "import"],
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
        ],
      },
    ]),
    readText,
  );
  expect(reduced.edges).toEqual([
    {
      from: "APP",
      to: "DOM",
      typeOnly: false,
      viaPure: false,
      example: "packages/features/ingest/src/application/open.ts:1",
    },
  ]);
  expect(reduced.unmapped).toEqual([]);
  expect(reduced.indexes).toEqual([]);
});

it("keeps a UI import through an index to domain as bypasses-pure", () => {
  put(
    "packages/features/ingest/src/ui/panel.ts",
    'import { parseJobId } from "@oi/feature-jobs";\n',
  );
  put(
    "packages/features/jobs/src/index.ts",
    'export { parseJobId } from "./domain/job-id.js";\n',
  );
  const reduced = reduceCruise(
    cruise([
      {
        source: "packages/features/ingest/src/ui/panel.ts",
        dependencies: [
          {
            module: "@oi/feature-jobs",
            resolved: "packages/features/jobs/src/index.ts",
            dependencyTypes: ["aliased", "import"],
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
        ],
      },
    ]),
    readText,
  );
  const report = compareGraph(
    parseMermaid('```mermaid\nUI -- "只经 src/pure.ts" --> DOM\n```\n'),
    reduced,
  );
  expect(report.undocumented).toEqual([
    {
      from: "UI",
      to: "DOM",
      example: "packages/features/ingest/src/ui/panel.ts:1",
      reason: "bypasses-pure",
    },
  ]);
  expect(report.unmapped).toEqual([]);
  expect(reduced.indexes).toEqual([]);
});

it("treats a UI import through an index to pure.ts as the labeled edge", () => {
  put(
    "packages/features/ingest/src/ui/panel.ts",
    'import { open } from "../index.js";\n',
  );
  put(
    "packages/features/ingest/src/index.ts",
    'export { open } from "./pure.js";\n',
  );
  const reduced = reduceCruise(
    cruise([
      {
        source: "packages/features/ingest/src/ui/panel.ts",
        dependencies: [
          {
            module: "../index.js",
            resolved: "packages/features/ingest/src/index.ts",
            dependencyTypes: ["local", "import"],
          },
        ],
      },
      {
        source: "packages/features/ingest/src/index.ts",
        dependencies: [
          {
            module: "./pure.js",
            resolved: "packages/features/ingest/src/pure.ts",
            dependencyTypes: ["local", "export"],
          },
        ],
      },
    ]),
    readText,
  );
  const report = compareGraph(
    parseMermaid('```mermaid\nUI -- "只经 src/pure.ts" --> DOM\n```\n'),
    reduced,
  );
  expect(reduced.edges).toEqual([
    {
      from: "UI",
      to: "DOM",
      typeOnly: false,
      viaPure: true,
      example: "packages/features/ingest/src/ui/panel.ts:1",
    },
  ]);
  expect(report.undocumented).toEqual([]);
  expect(report.unmapped).toEqual([]);
});

it("records an index that imports and then re-exports", () => {
  put(
    "packages/features/jobs/src/index.ts",
    'import { parseJobId } from "./domain/job-id.js";\nexport { parseJobId };\n',
  );
  const reduced = reduceCruise(
    cruise([
      {
        source: "packages/features/jobs/src/index.ts",
        dependencies: [
          {
            module: "./domain/job-id.js",
            resolved: "packages/features/jobs/src/domain/job-id.ts",
            dependencyTypes: ["local", "import"],
          },
        ],
      },
    ]),
    readText,
  );
  expect(reduced.indexes).toEqual([
    { example: "packages/features/jobs/src/index.ts:1" },
  ]);
  expect(reduced.unmapped).toEqual([
    {
      from: "SEAM",
      to: "DOM",
      example: "packages/features/jobs/src/index.ts:1",
    },
  ]);
});
