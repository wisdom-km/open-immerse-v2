export const ZOOM_PERCENT_MIN = 25;
export const ZOOM_PERCENT_MAX = 400;
export const DEFAULT_ZOOM_PERCENT = 100;

export type FitLiteral = "fit-width" | "fit-page";

export type ZoomLevel = number | FitLiteral;

export type RememberedZoom =
  | { readonly kind: "percent"; readonly zoomPercent: number }
  | { readonly kind: "fit-width" }
  | { readonly kind: "fit-page" };

export function parseZoomPercent(value: number): number | undefined {
  if (!Number.isInteger(value)) {
    return undefined;
  }
  if (value < ZOOM_PERCENT_MIN || value > ZOOM_PERCENT_MAX) {
    return undefined;
  }
  return value;
}

export function parseZoomLevel(value: unknown): ZoomLevel | undefined {
  if (value === "fit-width" || value === "fit-page") {
    return value;
  }
  if (typeof value !== "number") {
    return undefined;
  }
  return parseZoomPercent(value);
}

/** fit 算出来的百分数可以越界，再夹回 25–400。请求里的 24 / 401 不走这里。 */
export function clampZoomPercent(value: number): number {
  const rounded = Math.round(value);
  if (rounded < ZOOM_PERCENT_MIN) {
    return ZOOM_PERCENT_MIN;
  }
  if (rounded > ZOOM_PERCENT_MAX) {
    return ZOOM_PERCENT_MAX;
  }
  return rounded;
}

/**
 * 浏览器预设档，已按 6-2 A 截到 25–400。实测里的 500 不在此列。
 * 不记住缩放，打开时仍用 DEFAULT_ZOOM_PERCENT。
 */
const ZOOM_PERCENT_STEPS: readonly number[] = [
  25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400,
];

/**
 * 下一档：严格大于当前值的最小档。没有更大的档就保持当前值。
 * 不在档上的值不就近取整。结果再经 clampZoomPercent。
 */
export function nextZoomPercent(current: number): number {
  const higher = ZOOM_PERCENT_STEPS.find((step) => step > current);
  return clampZoomPercent(higher ?? current);
}

/**
 * 上一档：严格小于当前值的最大档。没有更小的档就保持当前值。
 * 不在档上的值不就近取整。结果再经 clampZoomPercent。
 */
export function previousZoomPercent(current: number): number {
  const lower = ZOOM_PERCENT_STEPS.findLast((step) => step < current);
  return clampZoomPercent(lower ?? current);
}

export function rememberedFromLevel(
  level: ZoomLevel,
): RememberedZoom | undefined {
  if (level === "fit-width" || level === "fit-page") {
    return { kind: level };
  }
  const zoomPercent = parseZoomPercent(level);
  if (zoomPercent === undefined) {
    return undefined;
  }
  return { kind: "percent", zoomPercent };
}

export function levelFromRemembered(zoom: RememberedZoom): ZoomLevel {
  if (zoom.kind === "percent") {
    return zoom.zoomPercent;
  }
  return zoom.kind;
}
