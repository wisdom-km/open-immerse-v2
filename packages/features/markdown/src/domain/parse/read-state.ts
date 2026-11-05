import type { MdContext, MdHeading } from "@oi/contracts";

import type { SyntaxCut } from "./cut-text.js";

export type ReadState = {
  source: string;
  context: MdContext;
  base: number;
  cuts: readonly SyntaxCut[];
  used: Set<string>;
  headings: MdHeading[];
};
