import { expectTypeOf, it } from "vitest";

import type { Result } from "../src/result.js";

it("defines Result as a success or failure tag", () => {
  expectTypeOf<Extract<Result<string, "no">, { ok: true }>>().toEqualTypeOf<{
    readonly ok: true;
    readonly value: string;
  }>();
  expectTypeOf<Extract<Result<string, "no">, { ok: false }>>().toEqualTypeOf<{
    readonly ok: false;
    readonly error: "no";
  }>();
});
