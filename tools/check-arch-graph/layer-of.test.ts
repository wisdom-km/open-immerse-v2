import { expect, it } from "vitest";

import { layerOf, type LayerHit } from "./layer-of.mjs";

const cases: ReadonlyArray<readonly [string, LayerHit]> = [
  ["packages/features/ingest/src/ui/panel.ts", { kind: "layer", id: "UI" }],
  ["apps/desktop/src/renderer/index.html", { kind: "layer", id: "UI" }],
  ["apps/desktop/src/preload/index.ts", { kind: "layer", id: "PRE" }],
  ["apps/desktop/src/main/composition-root.ts", { kind: "layer", id: "MAIN" }],
  [
    "packages/features/ingest/src/adapters/disk.ts",
    { kind: "layer", id: "ADP" },
  ],
  [
    "packages/features/ingest/src/application/open.ts",
    { kind: "layer", id: "APP" },
  ],
  ["packages/features/jobs/src/domain/job-id.ts", { kind: "layer", id: "DOM" }],
  ["packages/features/jobs/src/pure.ts", { kind: "layer", id: "DOM" }],
  ["packages/features/jobs/src/index.ts", { kind: "seam" }],
  ["@oi/feature-jobs", { kind: "seam" }],
  ["packages/platform-node/src/index.ts", { kind: "layer", id: "PN" }],
  ["@oi/platform-node", { kind: "layer", id: "PN" }],
  ["packages/worker-client/src/client.ts", { kind: "layer", id: "WC" }],
  ["@oi/worker-client", { kind: "layer", id: "WC" }],
  ["packages/providers/src/index.ts", { kind: "layer", id: "PV" }],
  ["@oi/providers", { kind: "layer", id: "PV" }],
  ["packages/ui-kit/src/markdown/math.tsx", { kind: "layer", id: "UK" }],
  ["@oi/ui-kit", { kind: "layer", id: "UK" }],
  ["packages/contracts/src/index.ts", { kind: "layer", id: "C" }],
  ["@oi/contracts", { kind: "layer", id: "C" }],
  ["packages/kernel/src/index.ts", { kind: "layer", id: "K" }],
  ["@oi/kernel", { kind: "layer", id: "K" }],
  ["workers/parser/oi_worker/api/app.py", { kind: "layer", id: "PY" }],
  ["packages/features/jobs/test/core/job-id.test.ts", { kind: "excluded" }],
  ["apps/desktop/e2e/csp.spec.ts", { kind: "excluded" }],
  ["apps/desktop/playwright.config.ts", { kind: "excluded" }],
  ["node:fs", { kind: "external" }],
  [
    "packages\\features\\ingest\\src\\ui\\panel.ts",
    { kind: "layer", id: "UI" },
  ],
];

it.each(cases)("maps %s", (ref, expected) => {
  expect(layerOf(ref)).toEqual(expected);
});
