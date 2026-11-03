import { expectTypeOf, it } from "vitest";

import type {
  EgressCheck,
  EgressDecision,
  EgressSendKind,
} from "../src/egress.js";

it("exhausts the egress decision", () => {
  expectTypeOf<
    Exclude<EgressDecision, "allow" | "ask" | "refused">
  >().toBeNever();
  expectTypeOf<EgressCheck["check"]>().returns.toEqualTypeOf<
    Promise<EgressDecision>
  >();
});

it("lists the four send kinds and no others", () => {
  expectTypeOf<
    Exclude<
      EgressSendKind,
      | "region_crop_and_candidates"
      | "rendered_page_image"
      | "text_to_translate"
      | "qa_context"
    >
  >().toBeNever();
});
