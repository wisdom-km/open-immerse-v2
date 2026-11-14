import { expect, it } from "vitest";

import { canvasWindow, spanFromOverlaps } from "../../src/ui/canvas-window.js";

it("keeps two pages around the first page", () => {
  expect(canvasWindow(1, 1, 20)).toEqual({ first: 1, last: 3 });
});

it("keeps two pages around the last page", () => {
  expect(canvasWindow(20, 20, 20)).toEqual({ first: 18, last: 20 });
});

it("covers the whole document when it has fewer than five pages", () => {
  expect(canvasWindow(2, 2, 3)).toEqual({ first: 1, last: 3 });
  expect(canvasWindow(1, 1, 4)).toEqual({ first: 1, last: 3 });
});

it("uses the first and last page that actually overlap the viewport", () => {
  expect(canvasWindow(4, 5, 20)).toEqual({ first: 2, last: 7 });
  expect(
    spanFromOverlaps([
      { page: 3, overlap: 0 },
      { page: 4, overlap: 10 },
      { page: 5, overlap: 10 },
      { page: 6, overlap: 0 },
    ]),
  ).toEqual({ first: 4, last: 5 });
});
