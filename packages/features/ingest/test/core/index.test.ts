import { expect, it } from "vitest";

import * as seam from "../../src/index.js";
import * as view from "../../src/pure.js";

it("exports the open factories when pure stays empty", () => {
  expect(Object.keys(view)).toEqual([]);
  expect(Object.keys(seam).sort()).toEqual([
    "createIngestIpcHandlers",
    "createOpenDocument",
    "openFailure",
  ]);
});
