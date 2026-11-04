import { fromMarkdown } from "mdast-util-from-markdown";
import type { MdBlock, MdListItem } from "@oi/contracts";

import { markdownExtensions } from "./extensions.js";
import { listOwned } from "./math-syntax.js";
import { mapFlow } from "./map-block.js";
import type { MdastNode } from "./mdast-node.js";
import type { ReadState } from "./read-state.js";

const maxDepth = 4;

export function absorbListMath(
  blocks: readonly MdBlock[],
  state: ReadState,
  depth = 0,
): MdBlock[] {
  const nested = blocks.map((block) => absorbInside(block, state, depth));
  if (depth > maxDepth) {
    return nested;
  }
  return mergeOwned(nested, state, depth);
}

function absorbInside(
  block: MdBlock,
  state: ReadState,
  depth: number,
): MdBlock {
  if (block.t === "quote") {
    return {
      ...block,
      blocks: absorbListMath(block.blocks, state, depth),
    };
  }
  if (block.t === "footnote_def") {
    return {
      ...block,
      blocks: absorbListMath(block.blocks, state, depth),
    };
  }
  if (block.t === "list") {
    return {
      ...block,
      items: block.items.map((item) => absorbItem(item, state, depth)),
    };
  }
  return block;
}

function absorbItem(
  item: MdListItem,
  state: ReadState,
  depth: number,
): MdListItem {
  return { ...item, blocks: absorbListMath(item.blocks, state, depth) };
}

function mergeOwned(
  blocks: readonly MdBlock[],
  state: ReadState,
  depth: number,
): MdBlock[] {
  const out: MdBlock[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    if (!block) {
      break;
    }
    const next = blocks[index + 1];
    const moved = moveMath(out, block, state.source);
    if (moved) {
      index = absorbTail(out, next, state, depth, index);
      continue;
    }
    if (
      block.t === "list" &&
      next &&
      isListTail(state.source, next, block.ordered)
    ) {
      const merged = mergeTail(block, next, state, depth);
      out.push(merged.list);
      out.push(...merged.rest);
      index += 2;
      continue;
    }
    out.push(block);
    index += 1;
  }
  return out;
}

function absorbTail(
  out: MdBlock[],
  next: MdBlock | undefined,
  state: ReadState,
  depth: number,
  index: number,
): number {
  const prev = out.at(-1);
  if (
    !next ||
    prev?.t !== "list" ||
    !isListTail(state.source, next, prev.ordered)
  ) {
    return index + 1;
  }
  const merged = mergeTail(prev, next, state, depth);
  out[out.length - 1] = merged.list;
  out.push(...merged.rest);
  return index + 2;
}

function moveMath(out: MdBlock[], block: MdBlock, source: string): boolean {
  const prev = out.at(-1);
  if (
    block.t !== "math" ||
    !listOwned(source, block.src.start) ||
    prev?.t !== "list"
  ) {
    return false;
  }
  out[out.length - 1] = appendMath(prev, block);
  return true;
}

function appendMath(
  list: Extract<MdBlock, { t: "list" }>,
  math: Extract<MdBlock, { t: "math" }>,
): MdBlock {
  const items = [...list.items];
  const last = items.at(-1);
  if (!last) {
    return list;
  }
  const end = Math.max(last.src.end, math.src.end);
  items[items.length - 1] = {
    ...last,
    blocks: [...last.blocks, math],
    src: { start: last.src.start, end },
  };
  return {
    ...list,
    items,
    src: { start: list.src.start, end: Math.max(list.src.end, end) },
  };
}

function isListTail(source: string, block: MdBlock, ordered: boolean): boolean {
  if (block.t !== "paragraph") {
    return false;
  }
  const text = source.slice(block.src.start, block.src.end).trim();
  if (ordered) {
    return /^\d+[.)]\s/.test(text);
  }
  return /^[-+*]\s/.test(text);
}

function mergeTail(
  list: Extract<MdBlock, { t: "list" }>,
  tail: MdBlock,
  state: ReadState,
  depth: number,
): { list: MdBlock; rest: MdBlock[] } {
  const slice = state.source.slice(tail.src.start, tail.src.end);
  const root = fromMarkdown(slice, markdownExtensions()) as MdastNode;
  const mapped = (root.children ?? []).flatMap((child) =>
    mapFlow(child, { ...state, base: tail.src.start }),
  );
  const absorbed = absorbListMath(mapped, state, depth + 1);
  const first = absorbed[0];
  if (!first || first.t !== "list" || first.ordered !== list.ordered) {
    return { list, rest: absorbed };
  }
  const items = [...list.items, ...first.items];
  const end = Math.max(list.src.end, first.src.end);
  return {
    list: { ...list, items, src: { start: list.src.start, end } },
    rest: absorbed.slice(1),
  };
}
