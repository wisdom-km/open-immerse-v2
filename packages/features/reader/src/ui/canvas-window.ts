export const CANVAS_WINDOW_RADIUS = 2;

export type PageSpan = {
  readonly first: number;
  readonly last: number;
};

export function canvasWindow(
  firstVisible: number,
  lastVisible: number,
  pageCount: number,
): PageSpan {
  const first = clamp(firstVisible - CANVAS_WINDOW_RADIUS, 1, pageCount);
  const last = clamp(lastVisible + CANVAS_WINDOW_RADIUS, 1, pageCount);
  return { first, last: Math.max(first, last) };
}

export function spanFromOverlaps(
  pages: readonly { readonly page: number; readonly overlap: number }[],
): PageSpan | undefined {
  let first = Number.POSITIVE_INFINITY;
  let last = 0;
  for (const item of pages) {
    if (item.overlap <= 0) {
      continue;
    }
    first = Math.min(first, item.page);
    last = Math.max(last, item.page);
  }
  if (!Number.isFinite(first)) {
    return undefined;
  }
  return { first, last };
}

function clamp(page: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, page));
}
