import type {
  MdBlock,
  MdContext,
  MdDocument,
  MdInline,
  MdMathBlocked,
  SourceSpan,
} from "@oi/contracts";

import { readMarkdown } from "./parse/read-tree.js";

export type ExtractedMath = Readonly<{
  tex: string;
  display: boolean;
  src: SourceSpan;
  blocked?: MdMathBlocked;
}>;

export function renderMarkdown(text: string, context: MdContext): MdDocument {
  const parsed = readMarkdown(text, context);
  const title = parsed.headings.find((heading) => heading.level === 1);
  return {
    fileId: null,
    title: title?.text ?? "",
    revision: contentRevision(text),
    blocks: parsed.blocks,
    headings: parsed.headings,
    links: [],
    truncated: false,
  };
}

export function extractMath(text: string): readonly ExtractedMath[] {
  const found: ExtractedMath[] = [];
  collectMath(text, renderMarkdown(text, "note").blocks, found);
  return found;
}

function collectMath(
  source: string,
  blocks: readonly MdBlock[],
  found: ExtractedMath[],
): void {
  for (const block of blocks) {
    collectBlock(source, block, found);
  }
}

function collectBlock(
  source: string,
  block: MdBlock,
  found: ExtractedMath[],
): void {
  if (block.t === "math") {
    found.push(extracted(source, block.tex, block.src, block.blocked));
    return;
  }
  if (block.t === "paragraph" || block.t === "heading") {
    collectInline(source, block.inline, found);
    return;
  }
  if (block.t === "quote" || block.t === "footnote_def") {
    collectMath(source, block.blocks, found);
    return;
  }
  if (block.t === "list") {
    for (const item of block.items) {
      collectMath(source, item.blocks, found);
    }
  }
}

function collectInline(
  source: string,
  inline: readonly MdInline[],
  found: ExtractedMath[],
): void {
  for (const item of inline) {
    if (item.t === "math") {
      found.push(extracted(source, item.tex, item.src, item.blocked));
    }
    if (
      item.t === "em" ||
      item.t === "strong" ||
      item.t === "del" ||
      item.t === "link"
    ) {
      collectInline(source, item.c, found);
    }
  }
}

function extracted(
  source: string,
  tex: string,
  src: SourceSpan,
  blocked: MdMathBlocked | undefined,
): ExtractedMath {
  const display = source.startsWith("$$", src.start);
  if (blocked === undefined) {
    return { tex, display, src };
  }
  return { tex, display, src, blocked };
}

function contentRevision(source: string): string {
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash, 33) ^ source.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}
