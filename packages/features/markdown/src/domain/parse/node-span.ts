import type { SourceSpan } from "@oi/contracts";

import type { MdastNode } from "./mdast-node.js";

export function nodeSpan(node: MdastNode, base: number): SourceSpan {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (typeof start !== "number" || typeof end !== "number") {
    return { start: base, end: base };
  }
  return { start: start + base, end: end + base };
}
