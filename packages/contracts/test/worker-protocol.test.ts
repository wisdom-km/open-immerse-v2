import { Value } from "@sinclair/typebox/value";
import { expect, it } from "vitest";

import { protocolHeaderSchema } from "../src/worker/protocol-header.js";

it("accepts unknown fields when a protocol header document has extra keys", () => {
  expect(
    Value.Check(protocolHeaderSchema, { header: "1.0", unspecified: true }),
  ).toBe(true);
});
