import { expectTypeOf, it } from "vitest";

import type { Clock } from "@oi/kernel";

it("returns a millisecond count when nowMs is called", () => {
  const clock: Clock = { nowMs: () => 1_700_000_000_000 };
  expectTypeOf(clock.nowMs()).toEqualTypeOf<number>();
});
