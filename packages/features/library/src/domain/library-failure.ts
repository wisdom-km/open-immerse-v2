export type LibraryCode =
  | "not_pdf"
  | "hash_mismatch"
  | "cancelled"
  | "not_found"
  | "rejected";

export type LibraryFailure = {
  readonly code: LibraryCode;
  readonly message: string;
};

const MESSAGES: Record<LibraryCode, string> = {
  not_pdf: "不是 PDF",
  hash_mismatch: "摘要不一致",
  cancelled: "已取消",
  not_found: "没有这篇文献",
  rejected: "文献库请求失败",
};

export function libraryFailure(code: LibraryCode): LibraryFailure {
  return { code, message: MESSAGES[code] };
}
