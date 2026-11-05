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
