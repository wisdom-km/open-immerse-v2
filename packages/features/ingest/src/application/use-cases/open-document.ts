import type { JobId, LibraryEntryId } from "@oi/contracts";
import {
  formatUtc,
  parseLibraryEntryId,
  type UpdateProgress,
} from "@oi/feature-library";
import type { Clock, Result } from "@oi/kernel";

import {
  openFailure,
  type OpenCode,
  type OpenFailure,
} from "../../domain/open-failure.js";
import type { JobIdSource } from "../ports/job-ids.js";
import type {
  LibraryLookup,
  LibraryLookupHit,
} from "../ports/library-lookup.js";
import type { Openings } from "../ports/openings.js";

export type OpenDocumentDeps = {
  readonly lookup: LibraryLookup;
  readonly updateProgress: UpdateProgress;
  readonly clock: Clock;
  readonly jobIds: JobIdSource;
  readonly openings: Openings;
};

export type OpenDocumentInput = {
  readonly id: string;
};

export type OpenDocumentValue = {
  readonly jobId: JobId;
};

export type OpenDocument = (
  input: OpenDocumentInput,
) => Result<OpenDocumentValue, OpenFailure>;

export function createOpenDocument(deps: OpenDocumentDeps): OpenDocument {
  return (input) => openDocument(deps, input);
}

function openDocument(
  deps: OpenDocumentDeps,
  input: OpenDocumentInput,
): Result<OpenDocumentValue, OpenFailure> {
  const id = parseLibraryEntryId(input.id);
  if (id === undefined) {
    return fail("not_found");
  }
  const hit = readHit(deps.lookup, id);
  if (!hit.ok) {
    return hit;
  }
  const openedAt = readOpenedAt(deps.clock);
  if (openedAt === undefined) {
    return fail("rejected");
  }
  const jobId = existingOrNew(deps, id);
  return finish(deps.updateProgress, {
    id,
    openedAt,
    page: hit.value.progressPage,
    jobId,
  });
}

function readHit(
  lookup: LibraryLookup,
  id: LibraryEntryId,
): Result<LibraryLookupHit, OpenFailure> {
  const found = lookup.findById(id);
  if (!found.ok) {
    return found;
  }
  if (found.value === null) {
    return fail("not_found");
  }
  return { ok: true, value: found.value };
}

/**
 * formatUtc 对 NaN / Infinity 返回 undefined。
 * 有限但超出 Date 范围的毫秒（例如 9e15）会抛 RangeError。两种都是 rejected，且不写进度。
 */
function readOpenedAt(clock: Clock): string | undefined {
  try {
    return formatUtc(clock.nowMs());
  } catch (error) {
    if (error instanceof RangeError) {
      return undefined;
    }
    throw error;
  }
}

function existingOrNew(deps: OpenDocumentDeps, id: LibraryEntryId): JobId {
  const existing = deps.openings.find(id);
  if (existing !== undefined) {
    return existing;
  }
  const jobId = deps.jobIds.next();
  deps.openings.remember(id, jobId);
  return jobId;
}

type FinishInput = {
  readonly id: LibraryEntryId;
  readonly openedAt: string;
  readonly page: number | null;
  readonly jobId: JobId;
};

/** page 是本次查到的 progressPage。null 写回 null，不能另传 null 表示跳过。 */
function finish(
  updateProgress: UpdateProgress,
  input: FinishInput,
): Result<OpenDocumentValue, OpenFailure> {
  const written = updateProgress({
    id: input.id,
    openedAt: input.openedAt,
    page: input.page,
  });
  if (!written.ok) {
    return fail(written.error.code === "not_found" ? "not_found" : "rejected");
  }
  return { ok: true, value: { jobId: input.jobId } };
}

function fail(code: OpenCode): {
  readonly ok: false;
  readonly error: OpenFailure;
} {
  return { ok: false, error: openFailure(code) };
}
