import { expectTypeOf, it } from "vitest";

import type {
  BudgetEnvelope,
  BudgetGate,
  BudgetRefusal,
  Reservation,
  UsageReport,
} from "../src/budget.js";
import type { Result } from "../src/result.js";

it("types reserve, settle, and release on BudgetGate", () => {
  expectTypeOf<BudgetGate["reserve"]>().returns.toEqualTypeOf<
    Promise<Result<Reservation, BudgetRefusal>>
  >();
  expectTypeOf<BudgetGate["settle"]>().returns.toEqualTypeOf<Promise<void>>();
  expectTypeOf<BudgetGate["release"]>().returns.toEqualTypeOf<Promise<void>>();
});

it("keeps unknown usage distinct from zero and requires every unit", () => {
  expectTypeOf<UsageReport["tokens"]>().toEqualTypeOf<number | "unknown">();
  expectTypeOf<UsageReport["pages"]>().toEqualTypeOf<number | "unknown">();
  expectTypeOf<UsageReport["requests"]>().toEqualTypeOf<number | "unknown">();
  expectTypeOf<"unknown">().not.toEqualTypeOf<0>();
  expectTypeOf<Omit<UsageReport, "tokens">>().not.toExtend<UsageReport>();
});

it("covers both budget refusal codes and leaves caps unset in the envelope", () => {
  expectTypeOf<Exclude<BudgetRefusal["code"], "budget_exhausted" | "budget_cap_unset">>().toBeNever();
  expectTypeOf<BudgetEnvelope["maxRequests"]>().toEqualTypeOf<number>();
  expectTypeOf<BudgetEnvelope["maxTokens"]>().toEqualTypeOf<number | undefined>();
});
