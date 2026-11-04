import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

import { compareGraph, renderReport } from "./compare.mjs";
import { parseMermaid } from "./parse-mermaid.mjs";
import type { ReducedEdge, UnmappedEdge } from "./reduce.mjs";

const anchor = "docs/arch/05-01.md#51-层间依赖图";

function edge(
  from: string,
  to: string,
  example: string,
  flags: { readonly typeOnly?: boolean; readonly viaPure?: boolean } = {},
): ReducedEdge {
  return {
    from,
    to,
    example,
    typeOnly: flags.typeOnly ?? false,
    viaPure: flags.viaPure ?? false,
  };
}

it("lists a synthetic undocumented edge and keeps missing packages planned", () => {
  const drawn = parseMermaid(
    '```mermaid\nUI --> C\nADP --> WC\nWC --> C\nC -- "仅 type-only" --> K\nUI -- "只经 src/pure.ts" --> DOM\n```\n',
  );
  const report = compareGraph(drawn, {
    edges: [
      edge("UI", "APP", "packages/features/ingest/src/ui/panel.ts:4"),
      edge("C", "K", "packages/contracts/src/diag-events.ts:1", {
        typeOnly: true,
      }),
      edge("UI", "DOM", "packages/features/ingest/src/ui/panel.ts:2", {
        viaPure: true,
      }),
    ],
    unmapped: [
      {
        from: "SEAM",
        to: "DOM",
        example: "packages/features/jobs/src/index.ts:1",
      },
    ] satisfies readonly UnmappedEdge[],
  });
  expect(report.undocumented).toEqual([
    {
      from: "UI",
      to: "APP",
      example: "packages/features/ingest/src/ui/panel.ts:4",
      reason: "missing",
    },
  ]);
  expect(report.planned.map((item) => `${item.from}\t${item.to}`)).toEqual([
    "ADP\tWC",
    "UI\tC",
    "WC\tC",
  ]);
  const text = renderReport(report);
  expect(text).toContain(
    "arch-edge-undocumented\tUI\tAPP\tpackages/features/ingest/src/ui/panel.ts:4",
  );
  expect(text).toContain(`修复：docs/arch/05-01.md §5.1 没有画出 UI → APP。`);
  expect(text).toContain(`锚点：${anchor}`);
  expect(text).toContain("arch-edge-planned\tADP\tWC");
  expect(text).toContain("arch-edge-planned\tWC\tC");
  expect(text).toContain(
    "arch-edge-unmapped\tSEAM\tDOM\tpackages/features/jobs/src/index.ts:1",
  );
  expect(text).not.toContain("arch-edge-undocumented\tC\tK");
  expect(text).not.toContain("arch-edge-planned\tC\tK");
});

it("treats a value import and a domain bypass as not the labeled edge", () => {
  const drawn = parseMermaid(
    '```mermaid\nC -- "仅 type-only" --> K\nUI -- "只经 src/pure.ts" --> DOM\n```\n',
  );
  const report = compareGraph(drawn, {
    edges: [
      edge("C", "K", "packages/contracts/src/ids.ts:2"),
      edge("UI", "DOM", "packages/features/ingest/src/ui/panel.ts:2"),
    ],
    unmapped: [],
  });
  expect(report.undocumented.map((item) => item.reason)).toEqual([
    "value-import",
    "bypasses-pure",
  ]);
  expect(report.planned.map((item) => `${item.from}\t${item.to}`)).toEqual([
    "C\tK",
    "UI\tDOM",
  ]);
  const text = renderReport(report);
  expect(text).toContain("只允许 type-only");
  expect(text).toContain("只经 src/pure.ts");
});

it("matches the five edges present on main@6988420 and plans the other 22", () => {
  const drawn = parseMermaid(readFileSync("docs/arch/05-01.md", "utf8"));
  const report = compareGraph(drawn, {
    edges: [
      edge("C", "K", "packages/contracts/src/diag-events.ts:1", {
        typeOnly: true,
      }),
      edge("DOM", "C", "packages/features/jobs/src/domain/job-id.ts:1"),
      edge("MAIN", "PN", "apps/desktop/src/main/composition-root.ts:3"),
      edge("PN", "C", "packages/platform-node/src/logging/file-logger.ts:8"),
      edge(
        "PN",
        "K",
        "packages/platform-node/src/logging/debug-retention.ts:4",
      ),
    ],
    unmapped: [],
  });
  expect(report.undocumented).toEqual([]);
  expect(report.planned).toHaveLength(22);
  expect(report.planned).toContainEqual({ from: "UI", to: "UK" });
  expect(report.planned).toContainEqual({ from: "ADP", to: "WC" });
  expect(report.planned).toContainEqual({ from: "WC", to: "C" });
  expect(report.planned).toContainEqual({ from: "ADP", to: "PY" });
  expect(report.planned).toContainEqual({ from: "PY", to: "C" });
});
