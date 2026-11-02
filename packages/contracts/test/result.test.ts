import { expectTypeOf, it } from "vitest";

import type { Result } from "../src/result.js";

it("splits success and failure by the ok tag", () => {
  expectTypeOf<Extract<Result<string, "no">, { ok: true }>>().toEqualTypeOf<{
    readonly ok: true;
    readonly value: string;
  }>();
  expectTypeOf<Extract<Result<string, "no">, { ok: false }>>().toEqualTypeOf<{
    readonly ok: false;
    readonly error: "no";
  }>();
  expectTypeOf<Exclude<Result<string, "no">["ok"], true | false>>().toBeNever();
});
