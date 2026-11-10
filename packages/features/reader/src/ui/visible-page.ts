export type PageOverlap = {
  readonly page: number;
  readonly overlap: number;
};

/** 相交高度最大的一页；相同则取较小页码。这是显示几何，不是夹页。 */
export function visiblePage(pages: readonly PageOverlap[]): number | undefined {
  let chosen: PageOverlap | undefined;
  for (const page of pages) {
    if (page.overlap <= 0) {
      continue;
    }
    if (chosen === undefined || prefers(page, chosen)) {
      chosen = page;
    }
  }
  return chosen?.page;
}

export function overlapHeight(
  top: number,
  bottom: number,
  viewTop: number,
  viewBottom: number,
): number {
  const start = Math.max(top, viewTop);
  const end = Math.min(bottom, viewBottom);
  return Math.max(0, end - start);
}

function prefers(next: PageOverlap, current: PageOverlap): boolean {
  if (next.overlap !== current.overlap) {
    return next.overlap > current.overlap;
  }
  return next.page < current.page;
}
