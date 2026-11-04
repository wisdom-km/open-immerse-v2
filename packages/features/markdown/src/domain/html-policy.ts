import type { SourceSpan } from "@oi/contracts";

export function toHtmlBlocked(raw: string, src: SourceSpan) {
  return { t: "html_blocked" as const, raw, src };
}
