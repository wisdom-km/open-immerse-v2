import { expectTypeOf, it } from "vitest";

import type {
  DefaultJevRoute,
  JevRoute,
  JevRouteSetting,
} from "../src/ipc/settings.js";

type JevRouteGap<R extends JevRoute> = R extends "api"
  ? never
  : R extends "local"
    ? never
    : R;

const jevRouteIsExhaustive: [JevRouteGap<JevRoute>] extends [never]
  ? true
  : false = true;

it("exhausts the Jev route", () => {
  expectTypeOf<Exclude<JevRoute, "api" | "local">>().toBeNever();
  expectTypeOf(jevRouteIsExhaustive).toEqualTypeOf<true>();
});

it("defaults the Jev route to api", () => {
  expectTypeOf<DefaultJevRoute>().toEqualTypeOf<"api">();
  expectTypeOf<DefaultJevRoute>().toExtend<JevRoute>();
});

it("rejects a Jev setting that omits the route", () => {
  type MissingRoute = Readonly<Record<string, never>>;
  expectTypeOf<MissingRoute>().not.toExtend<JevRouteSetting>();
});
