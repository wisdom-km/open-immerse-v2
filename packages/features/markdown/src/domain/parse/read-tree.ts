import { fromMarkdown } from "mdast-util-from-markdown";
import type { MdBlock, MdContext, MdHeading } from "@oi/contracts";

import { absorbListMath } from "./absorb-list-math.js";
import type { SyntaxCut } from "./cut-text.js";
import { markdownExtensions } from "./extensions.js";
import { mapFlow } from "./map-block.js";
import { mathCuts } from "./math-syntax.js";
import type { MdastNode } from "./mdast-node.js";
import { skipRanges } from "./skip-ranges.js";
import { wikiCuts } from "./wikilink-syntax.js";

export type ParsedMarkdown = Readonly<{
  blocks: readonly MdBlock[];
  headings: readonly MdHeading[];
}>;

function cutsFor(source: string, context: MdContext): readonly SyntaxCut[] {
  const skipped = skipRanges(source);
  const math = mathCuts(source, skipped);
  if (context === "translation") {
    return math;
  }
  const blocked = [...skipped, ...math.map((cut) => cut.src)];
  return [...math, ...wikiCuts(source, blocked)];
}

export function readMarkdown(
  source: string,
  context: MdContext,
): ParsedMarkdown {
  const root = fromMarkdown(source, markdownExtensions()) as MdastNode;
  const headings: MdHeading[] = [];
  const state = {
    source,
    context,
    base: 0,
    cuts: cutsFor(source, context),
    used: new Set<string>(),
    headings,
  };
  const mapped = (root.children ?? []).flatMap((child) =>
    mapFlow(child, state),
  );
  return { blocks: absorbListMath(mapped, state), headings };
}
