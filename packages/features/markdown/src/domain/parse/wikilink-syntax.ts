import type { SourceSpan } from "@oi/contracts";

import { rangeCovers } from "./skip-ranges.js";

export type WikiCut = Readonly<{
  kind: "wiki";
  src: SourceSpan;
  target: string;
  embed: boolean;
  alias?: string;
  heading?: string;
}>;

function readWiki(
  source: string,
  index: number,
  embed: boolean,
): WikiCut | null {
  const open = embed ? index + 3 : index + 2;
  const close = source.indexOf("]]", open);
  if (close === -1) {
    return null;
  }
  const inner = source.slice(open, close);
  if (inner.includes("\n") || inner.trim().length === 0) {
    return null;
  }
  return finishWiki(inner, { start: index, end: close + 2 }, embed);
}

function finishWiki(inner: string, src: SourceSpan, embed: boolean): WikiCut {
  const aliasAt = inner.indexOf("|");
  const body = aliasAt === -1 ? inner : inner.slice(0, aliasAt);
  const alias = aliasAt === -1 ? undefined : inner.slice(aliasAt + 1);
  const hash = body.indexOf("#");
  const target = hash === -1 ? body : body.slice(0, hash);
  const heading = hash === -1 ? undefined : body.slice(hash + 1);
  return {
    kind: "wiki",
    src,
    target,
    embed,
    ...(alias === undefined ? {} : { alias }),
    ...(heading === undefined ? {} : { heading }),
  };
}

export function wikiCuts(
  source: string,
  skipped: readonly SourceSpan[],
): readonly WikiCut[] {
  const cuts: WikiCut[] = [];
  let index = 0;
  while (index < source.length - 1) {
    const embed = source.startsWith("![[", index);
    const opened = embed || source.startsWith("[[", index);
    if (!opened || rangeCovers(index, skipped)) {
      index += 1;
      continue;
    }
    const read = readWiki(source, index, embed);
    if (read === null) {
      index += 1;
      continue;
    }
    cuts.push(read);
    index = read.src.end;
  }
  return cuts;
}
