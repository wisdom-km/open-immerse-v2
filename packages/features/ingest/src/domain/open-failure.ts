export type OpenCode = "not_found" | "rejected";

/** 不带 message。IPC 只映射 code，不能把库失败或异常文本带出去。 */
export type OpenFailure = {
  readonly code: OpenCode;
};

export function openFailure(code: OpenCode): OpenFailure {
  return { code };
}
