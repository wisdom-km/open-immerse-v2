import { expect, expectTypeOf, it } from "vitest";

import {
  FORMULA_MAX_CHARS,
  KATEX_SAFE_OPTIONS,
  UNTRUSTED_LATEX_COMMANDS,
} from "../src/latex-policy.js";

it("locks the single KaTeX option set", () => {
  expect(KATEX_SAFE_OPTIONS).toEqual({
    throwOnError: true,
    trust: false,
    strict: "ignore",
    output: "html",
    maxSize: 20,
    maxExpand: 1000,
  });
  expectTypeOf(KATEX_SAFE_OPTIONS.throwOnError).toEqualTypeOf<true>();
  expectTypeOf(KATEX_SAFE_OPTIONS.trust).toEqualTypeOf<false>();
  expectTypeOf(KATEX_SAFE_OPTIONS.strict).toEqualTypeOf<"ignore">();
  expectTypeOf(KATEX_SAFE_OPTIONS.output).toEqualTypeOf<"html">();
  expectTypeOf(KATEX_SAFE_OPTIONS.maxSize).toEqualTypeOf<20>();
  expectTypeOf(KATEX_SAFE_OPTIONS.maxExpand).toEqualTypeOf<1000>();
});

it("locks the formula character cap and the untrusted command list", () => {
  expect(FORMULA_MAX_CHARS).toBe(8000);
  expectTypeOf<typeof FORMULA_MAX_CHARS>().toEqualTypeOf<8000>();
  expect(UNTRUSTED_LATEX_COMMANDS).toEqual([
    "\\href",
    "\\url",
    "\\includegraphics",
    "\\htmlClass",
    "\\htmlId",
    "\\htmlStyle",
    "\\htmlData",
  ]);
  expectTypeOf(UNTRUSTED_LATEX_COMMANDS).toEqualTypeOf<
    readonly [
      "\\href",
      "\\url",
      "\\includegraphics",
      "\\htmlClass",
      "\\htmlId",
      "\\htmlStyle",
      "\\htmlData",
    ]
  >();
});
