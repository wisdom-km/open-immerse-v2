import { expect, it } from "vitest";

import {
  clampZoomPercent,
  parseZoomLevel,
  parseZoomPercent,
  ZOOM_PERCENT_MAX,
  ZOOM_PERCENT_MIN,
} from "../../src/pure.js";

it("accepts the zoom when the percent is 25 or 400", () => {
  expect(parseZoomPercent(ZOOM_PERCENT_MIN)).toBe(25);
  expect(parseZoomPercent(ZOOM_PERCENT_MAX)).toBe(400);
});

it("rejects the zoom when the percent is 24 or 401", () => {
  expect(parseZoomPercent(24)).toBeUndefined();
  expect(parseZoomPercent(401)).toBeUndefined();
});

it("rejects the zoom when the percent is not an integer", () => {
  expect(parseZoomPercent(100.5)).toBeUndefined();
});

it("accepts fit literals when the level is fit-width or fit-page", () => {
  expect(parseZoomLevel("fit-width")).toBe("fit-width");
  expect(parseZoomLevel("fit-page")).toBe("fit-page");
});

it("rejects the level when the token is not a fit literal", () => {
  expect(parseZoomLevel("fit")).toBeUndefined();
  expect(parseZoomLevel("24")).toBeUndefined();
});

it("clamps a computed percent when it falls outside 25 to 400", () => {
  expect(clampZoomPercent(10)).toBe(25);
  expect(clampZoomPercent(900)).toBe(400);
  expect(clampZoomPercent(33.4)).toBe(33);
});
