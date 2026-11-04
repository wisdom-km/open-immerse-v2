import { assert, constantFrom, property, string } from "fast-check";
import { expect, it } from "vitest";

import type { MdContext } from "@oi/contracts";

import { renderMarkdown, serialize } from "../../src/index.js";

const contexts: readonly MdContext[] = ["note", "translation", "answer"];

it("round-trips arbitrary markdown in every context", () => {
  assert(
    property(
      string({ maxLength: 40, unit: "binary" }),
      constantFrom(...contexts),
      (source, context) => {
        expect(serialize(renderMarkdown(source, context), source)).toBe(source);
      },
    ),
    { numRuns: 40 },
  );
});
