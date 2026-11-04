import type {
  MdBlock,
  MdDocument,
  MdInline,
  MdListItem,
  SourceSpan,
} from "@oi/contracts";

type Piece = Readonly<{
  span: SourceSpan;
  text: string;
}>;

export function sliceSource(source: string, span: SourceSpan): string {
  return source.slice(span.start, span.end);
}

export function serialize(doc: MdDocument, source: string): string {
  const whole: SourceSpan = { start: 0, end: source.length };
  const parts = doc.blocks.map((block) => blockPiece(source, block));
  return join(source, whole, parts);
}

function join(
  source: string,
  span: SourceSpan,
  parts: readonly Piece[],
): string {
  const chunks: string[] = [];
  let cursor = span.start;
  for (const part of parts) {
    chunks.push(source.slice(cursor, part.span.start));
    chunks.push(part.text);
    cursor = part.span.end;
  }
  chunks.push(source.slice(cursor, span.end));
  return chunks.join("");
}

function leaf(source: string, span: SourceSpan): Piece {
  return { span, text: sliceSource(source, span) };
}

function blockPiece(source: string, block: MdBlock): Piece {
  const nested = childPieces(source, block);
  if (nested === null) {
    return leaf(source, block.src);
  }
  return { span: block.src, text: join(source, block.src, nested) };
}

function childPieces(source: string, block: MdBlock): readonly Piece[] | null {
  switch (block.t) {
    case "paragraph":
    case "heading":
      return block.inline.map((inline) => inlinePiece(source, inline));
    case "quote":
    case "footnote_def":
      return block.blocks.map((child) => blockPiece(source, child));
    case "list":
      return block.items.map((item) => itemPiece(source, item));
    case "table":
      return tablePieces(source, block);
    case "code":
    case "math":
    case "image":
    case "hr":
    case "html_blocked":
    case "formula_crop":
      return null;
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

function itemPiece(source: string, item: MdListItem): Piece {
  const parts = item.blocks.map((block) => blockPiece(source, block));
  return { span: item.src, text: join(source, item.src, parts) };
}

function tablePieces(
  source: string,
  table: Extract<MdBlock, { t: "table" }>,
): readonly Piece[] {
  const cells = [...table.head, ...table.rows.flat()];
  return cells.flatMap((cell) =>
    cell.map((inline) => inlinePiece(source, inline)),
  );
}

function inlinePiece(source: string, inline: MdInline): Piece {
  const nested = inlineChildren(source, inline);
  if (nested === null) {
    return leaf(source, inline.src);
  }
  return { span: inline.src, text: join(source, inline.src, nested) };
}

function inlineChildren(
  source: string,
  inline: MdInline,
): readonly Piece[] | null {
  switch (inline.t) {
    case "em":
    case "strong":
    case "del":
    case "link":
      return inline.c.map((child) => inlinePiece(source, child));
    case "text":
    case "code":
    case "math":
    case "image":
    case "br":
    case "wikilink":
    case "footnote_ref":
    case "html_blocked":
      return null;
    default: {
      const unreachable: never = inline;
      return unreachable;
    }
  }
}
