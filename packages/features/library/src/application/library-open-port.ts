import { parseJobId, type JobId } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../domain/document-identity.js";
import { formatUtc } from "../domain/library-record.js";
import type { LibraryRepository } from "./ports/library-repository.js";
import { createUpdateProgress } from "./use-cases/update-progress.js";

type OpenCode = "not_found" | "rejected";
type OpenError = { readonly code: OpenCode };
type Hit = { readonly progressPage: number | null };

type Write = {
  readonly id: string;
  readonly openedAt: string;
  readonly page: number | null;
};

/** 打开装配看见的文献库。没有 originalPath，失败没有 message。 */
export type LibraryOpenPort = {
  readProgressPage(id: string): Result<Hit | null, OpenError>;
  writeOpened(input: Write): Result<unknown, OpenError>;
  parseEntryId(value: string): LibraryEntryId | undefined;
  formatOpenedAt(nowMs: number): string | undefined;
  decimalJobId(value: string): JobId;
};

export function createLibraryOpenPort(
  repository: LibraryRepository,
): LibraryOpenPort {
  const write = createUpdateProgress(repository);
  return {
    readProgressPage(id) {
      return readProgressPage(repository, id);
    },
    writeOpened(input) {
      const written = write(input);
      return written.ok
        ? { ok: true, value: undefined }
        : fail(codeOf(written.error.code));
    },
    parseEntryId: parseLibraryEntryId,
    formatOpenedAt: formatUtc,
    decimalJobId,
  };
}

function readProgressPage(
  repository: LibraryRepository,
  id: string,
): Result<Hit | null, OpenError> {
  const parsed = parseLibraryEntryId(id);
  if (parsed === undefined) {
    return fail("not_found");
  }
  const found = repository.findById(parsed);
  if (!found.ok) {
    return fail(codeOf(found.error.code));
  }
  if (found.value === null) {
    return { ok: true, value: null };
  }
  return { ok: true, value: { progressPage: found.value.progressPage } };
}

/** 十进制字符串经 parseJobId。不写 jobs。 */
function decimalJobId(value: string): JobId {
  const parsed = parseJobId(value);
  if (!parsed.ok) {
    throw new Error(parsed.error.kind);
  }
  return parsed.value;
}

function codeOf(code: string): OpenCode {
  return code === "not_found" ? "not_found" : "rejected";
}

function fail(code: OpenCode): {
  readonly ok: false;
  readonly error: OpenError;
} {
  return { ok: false, error: { code } };
}
