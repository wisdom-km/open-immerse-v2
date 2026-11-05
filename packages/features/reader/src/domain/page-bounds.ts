/** 整数页码夹到 [1, pageCount]。pageCount 不是正整数时没有合法页。 */
export function clampPage(page: number, pageCount: number): number | undefined {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return undefined;
  }
  if (!Number.isInteger(page)) {
    return undefined;
  }
  if (page < 1) {
    return 1;
  }
  if (page > pageCount) {
    return pageCount;
  }
  return page;
}
