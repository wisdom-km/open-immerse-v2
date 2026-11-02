import { expectTypeOf, it } from "vitest";

import type { UsageReport } from "../src/budget.js";
import type { Result } from "../src/result.js";
import type {
  ApiFormat,
  ChatChunk,
  DefaultJevRoute,
  JevApiProvider,
  JevLocalProvider,
  JevProviderFor,
  JevRoute,
  JevScoringProvider,
  ModelbestApiCallCount,
  ModelbestJevConfig,
  ProviderAuthorizer,
  ProviderFailure,
} from "../src/provider.js";

type JevRouteGap<R extends JevRoute> = R extends "api" ? never : R extends "local" ? never : R;

const jevRouteIsExhaustive: [JevRouteGap<JevRoute>] extends [never] ? true : false = true;

type RouteOf<P> = P extends JevScoringProvider<infer R> ? R : never;

type CallsWhenLocal<P> = P extends { readonly route: "local" }
  ? P extends { readonly modelbestApiCalls: infer Calls }
    ? Calls
    : never
  : never;

it("gives both Jev routes the same scoring provider", () => {
  expectTypeOf<RouteOf<JevApiProvider>>().toEqualTypeOf<"api">();
  expectTypeOf<RouteOf<JevLocalProvider>>().toEqualTypeOf<"local">();
  expectTypeOf<JevApiProvider>().toExtend<JevScoringProvider<"api">>();
  expectTypeOf<JevLocalProvider>().toExtend<JevScoringProvider<"local">>();
  expectTypeOf<JevProviderFor<"api">>().toEqualTypeOf<JevApiProvider>();
  expectTypeOf<JevProviderFor<"local">>().toEqualTypeOf<JevLocalProvider>();
  expectTypeOf<JevApiProvider>().not.toExtend<JevLocalProvider>();
  expectTypeOf<JevLocalProvider>().not.toExtend<JevApiProvider>();
  expectTypeOf<CallsWhenLocal<JevProviderFor<JevRoute>>>().toEqualTypeOf<0>();
});

it("selects the route on jev.route and exhausts that union", () => {
  expectTypeOf<ModelbestJevConfig["jev"]["route"]>().toEqualTypeOf<JevRoute>();
  expectTypeOf<DefaultJevRoute>().toEqualTypeOf<"api">();
  expectTypeOf<Exclude<JevRoute, "api" | "local">>().toBeNever();
  expectTypeOf(jevRouteIsExhaustive).toEqualTypeOf<true>();
  type MissingRoute = Readonly<{ vendorId: "modelbest"; jev: Readonly<Record<string, never>> }>;
  expectTypeOf<MissingRoute>().not.toExtend<ModelbestJevConfig>();
});

it("counts zero Modelbest API calls on the local route and does not fall back", () => {
  const none: ModelbestApiCallCount<"local"> = 0;
  expectTypeOf(none).toEqualTypeOf<0>();
  expectTypeOf<ModelbestApiCallCount<"local">>().toEqualTypeOf<0>();
  expectTypeOf<ModelbestApiCallCount<"api">>().toEqualTypeOf<number>();
  expectTypeOf<ModelbestApiCallCount<"local">>().not.toEqualTypeOf<ModelbestApiCallCount<"api">>();
  expectTypeOf<JevLocalProvider["implementation"]>().toEqualTypeOf<"stub">();
  type ApiHasStub = "implementation" extends keyof JevApiProvider ? true : false;
  expectTypeOf<ApiHasStub>().toEqualTypeOf<false>();
});

it("rejects a non-zero Modelbest call count when the route is local", () => {
  // @ts-expect-error local route is exactly zero Modelbest API calls
  const called: ModelbestApiCallCount<"local"> = 1;
  expectTypeOf(called).toEqualTypeOf<0>();
  const hosted = { route: "local", modelbestApiCalls: 1, implementation: "stub" } as const;
  // @ts-expect-error local route cannot fall back to a Modelbest API call
  const selected: JevProviderFor<JevRoute> = hosted;
  expectTypeOf(selected).toExtend<JevProviderFor<JevRoute>>();
});

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const formatDiffersFromString: Equal<ApiFormat, string> = false;

it("brands ApiFormat and keeps provider failures and chat usage neutral", () => {
  expectTypeOf(formatDiffersFromString).toEqualTypeOf<false>();
  expectTypeOf<
    Exclude<
      ProviderFailure["kind"],
      "auth" | "quota" | "rate_limited" | "invalid_request" | "too_large" | "service_failed" | "timeout"
    >
  >().toBeNever();
  expectTypeOf<ChatChunk["usage"]>().toEqualTypeOf<UsageReport | undefined>();
  expectTypeOf<ProviderAuthorizer["authorize"]>().returns.toEqualTypeOf<
    Promise<Result<Readonly<Record<string, string>>, "host_not_allowed" | "secret_missing">>
  >();
});
