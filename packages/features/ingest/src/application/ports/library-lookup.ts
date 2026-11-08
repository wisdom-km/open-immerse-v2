import type { Result } from "@oi/kernel";

import type { OpenFailure } from "../../domain/open-failure.js";

/** 命中值只有页码。originalPath 不得进入这个端口。 */
export type LibraryLookupHit = {
  readonly progressPage: number | null;
};

export type LibraryLookup = {
  findById(id: string): Result<LibraryLookupHit | null, OpenFailure>;
};
