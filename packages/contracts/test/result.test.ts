import { expectTypeOf, it } from "vitest";

import type { Result } from "@oi/contracts";
import type { Result as KernelResult } from "@oi/kernel";

type SameResult = [Result<string, "no">] extends [KernelResult<string, "no">]
  ? [KernelResult<string, "no">] extends [Result<string, "no">]
    ? true
    : false
  : false;

const resultMatchesKernel: SameResult = true;

it("re-exports the kernel Result", () => {
  expectTypeOf(resultMatchesKernel).toEqualTypeOf<true>();
});

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
