export type ReaderCode = "not_found" | "not_pdf" | "rejected" | "invalid_level";

export type ReaderFailure = {
  readonly code: ReaderCode;
  readonly message: string;
};

const MESSAGES: Record<ReaderCode, string> = {
  not_found: "没有这篇文献",
  not_pdf: "不是 PDF",
  rejected: "阅读请求失败",
  invalid_level: "缩放超出范围",
};

export function readerFailure(code: ReaderCode): ReaderFailure {
  return { code, message: MESSAGES[code] };
}
