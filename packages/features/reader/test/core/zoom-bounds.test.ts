import { expect, it } from "vitest";

import {
  clampZoomPercent,
  nextZoomPercent,
  parseZoomLevel,
  parseZoomPercent,
  previousZoomPercent,
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

const zoomSteps = [
  25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400,
];

it("steps from 25 up to 400 and stays there", () => {
  const seen = [ZOOM_PERCENT_MIN];
  let current = ZOOM_PERCENT_MIN;
  for (let guard = 0; guard < zoomSteps.length; guard += 1) {
    const next = nextZoomPercent(current);
    if (next === current) {
      break;
    }
    seen.push(next);
    current = next;
  }
  expect(seen).toEqual(zoomSteps);
  expect(nextZoomPercent(ZOOM_PERCENT_MAX)).toBe(400);
  expect(current).toBe(400);
});

it("steps from 400 down to 25 and stays there", () => {
  const seen = [ZOOM_PERCENT_MAX];
  let current = ZOOM_PERCENT_MAX;
  for (let guard = 0; guard < zoomSteps.length; guard += 1) {
    const previous = previousZoomPercent(current);
    if (previous === current) {
      break;
    }
    seen.push(previous);
    current = previous;
  }
  expect(seen).toEqual([...zoomSteps].reverse());
  expect(previousZoomPercent(ZOOM_PERCENT_MIN)).toBe(25);
  expect(current).toBe(25);
});

it("moves an off-step percent to the adjacent step in the requested direction", () => {
  expect(nextZoomPercent(112)).toBe(125);
  expect(previousZoomPercent(112)).toBe(110);
  expect(nextZoomPercent(33.4)).toBe(50);
  expect(previousZoomPercent(33.4)).toBe(33);
  expect(nextZoomPercent(100.2)).toBe(110);
  expect(previousZoomPercent(100.2)).toBe(100);
});

it("clamps the step when the percent is outside 25 to 400", () => {
  expect(previousZoomPercent(24)).toBe(25);
  expect(nextZoomPercent(24)).toBe(25);
  expect(previousZoomPercent(401)).toBe(400);
  expect(nextZoomPercent(401)).toBe(400);
  expect(previousZoomPercent(500)).toBe(400);
  expect(nextZoomPercent(500)).toBe(400);
});
