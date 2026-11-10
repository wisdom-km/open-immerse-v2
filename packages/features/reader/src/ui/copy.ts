export const MISSING_DOCUMENT = "文献库里没有这篇文献。";
export const UNREADABLE_PDF = "现在读不到这份 PDF。";
export const LOST_PLACE = "没能读到上次的位置，已从第 1 页开始";
export const ERROR_TITLE = "无法打开此文件";
export const BACK_LABEL = "返回文献库";
export const BACK_TOOLTIP = "返回文献库（Alt+←）";

export function pageLabel(page: number, pageCount: number): string {
  return `第 ${String(page)} / ${String(pageCount)} 页`;
}
