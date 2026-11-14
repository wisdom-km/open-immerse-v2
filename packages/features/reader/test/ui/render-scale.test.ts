import { expect, it } from "vitest";

import {
  PROVISIONAL_PAGE_PIXEL_CAP,
  clampedScale,
  renderSize,
} from "../../src/ui/render-scale.js";

const page = { pageWidth: 100, pageHeight: 200, zoom: 1 };

it("keeps CSS size and multiplies the backing store by dpr", () => {
  for (const dpr of [1, 1.5, 2]) {
    const size = renderSize({
      ...page,
      dpr,
      pixelCap: PROVISIONAL_PAGE_PIXEL_CAP,
    });
    expect(size.cssWidth).toBe(100);
    expect(size.cssHeight).toBe(200);
    expect(size.backingWidth).toBe(Math.ceil(100 * dpr));
    expect(size.backingHeight).toBe(Math.ceil(200 * dpr));
  }
});

it("does not lower the scale while the cap is still provisional", () => {
  expect(clampedScale(2, 100 * 200, PROVISIONAL_PAGE_PIXEL_CAP)).toBe(2);
});

it("clamps the backing store when a finite cap is smaller than the request", () => {
  const size = renderSize({ ...page, dpr: 2, pixelCap: 10_000 });
  expect(size.cssWidth).toBe(100);
  expect(size.cssHeight).toBe(200);
  expect(size.backingWidth * size.backingHeight).toBeLessThanOrEqual(10_000);
  expect(size.scale).toBeLessThan(2);
});
