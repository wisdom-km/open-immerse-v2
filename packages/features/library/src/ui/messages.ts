export function importMessage(code: string): string {
  switch (code) {
    case "cancelled":
      return "";
    case "not_pdf":
      return "只支持 PDF";
    case "hash_mismatch":
      return "这份文件没有通过校验";
    default:
      return "操作没有完成";
  }
}

export function addedMessage(duplicate: boolean): string {
  return duplicate ? "已在文献库中" : "已加入文献库";
}

export function showTime(value: string | null): string {
  if (value === null || value.length === 0) {
    return "—";
  }
  return value;
}
