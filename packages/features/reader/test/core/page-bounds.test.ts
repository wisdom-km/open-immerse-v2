import { expect, it } from "vitest";

import { clampPage } from "../../src/pure.js";

it("clamps the page when the request is past the last page", () => {
  expect(clampPage(9, 3)).toBe(3);
});

it("clamps the page when the request is below 1", () => {
  expect(clampPage(0, 3)).toBe(1);
});

it("returns undefined when pageCount is not a positive integer", () => {
  expect(clampPage(1, 0)).toBeUndefined();
  expect(clampPage(1, 1.5)).toBeUndefined();
});
