import { expect, it } from "vitest";

import { resolveZoomPercent, viewportForZoom } from "../../src/pure.js";

const page = { width: 200, height: 400 };

it("maps 100 percent onto the page box when the scale is 1", () => {
  expect(viewportForZoom(page, 100)).toEqual({
    zoomPercent: 100,
    width: 200,
    height: 400,
  });
});

it("maps 50 percent onto half the page when the zoom is numeric", () => {
  expect(viewportForZoom(page, 50)).toEqual({
    zoomPercent: 50,
    width: 100,
    height: 200,
  });
});

it("fits the width when the container is narrower than the page", () => {
  expect(
    resolveZoomPercent("fit-width", page, { width: 100, height: 1000 }),
  ).toBe(50);
});

it("fits the page when the shorter ratio is the height", () => {
  expect(
    resolveZoomPercent("fit-page", page, { width: 100, height: 100 }),
  ).toBe(25);
});

it("clamps fit-width when the container is much wider than the page", () => {
  expect(
    resolveZoomPercent("fit-width", page, { width: 2000, height: 400 }),
  ).toBe(400);
});

it("returns undefined when fit is asked for a zero-size page", () => {
  expect(
    resolveZoomPercent("fit-page", { width: 0, height: 400 }, page),
  ).toBeUndefined();
});
