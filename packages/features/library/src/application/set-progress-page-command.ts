import type { LibraryProgressCommands } from "@oi/contracts";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../domain/document-identity.js";
import type { LibraryCode } from "../domain/library-failure.js";
import type {
  SetProgressPage,
  SetProgressPageValue,
} from "./use-cases/set-progress-page.js";

const writeKeys = ["id", "generation", "progressPage"];

export type SetProgressPageCommand = LibraryProgressCommands["setProgressPage"];

type WriteResult = Awaited<ReturnType<SetProgressPageCommand>>;

type WriteRequest = {
  readonly id: LibraryEntryId;
  readonly generation: number;
  readonly progressPage: number;
};

/** generation 原样来自请求，不证明代际仍活着。不调用 updateProgress。 */
export function createSetProgressPageCommand(
  setProgressPage: SetProgressPage,
): SetProgressPageCommand {
  return (input) => Promise.resolve(runSet(setProgressPage, input));
}

function runSet(setProgressPage: SetProgressPage, input: unknown): WriteResult {
  const request = parseWriteRequest(input);
  if (request === undefined) {
    return invalidPayload();
  }
  const written = setProgressPage({
    id: request.id,
    progressPage: request.progressPage,
  });
  if (!written.ok) {
    return mapWriteFailure(written.error.code, request);
  }
  return writeSuccess(written.value, request.generation);
}

function parseWriteRequest(value: unknown): WriteRequest | undefined {
  if (!isDataObject(value)) {
    return undefined;
  }
  const id = readId(value.id);
  const generation = readSafePositive(value.generation);
  const progressPage = readSafePositive(value.progressPage);
  if (
    id === undefined ||
    generation === undefined ||
    progressPage === undefined ||
    !allowsOwnKeys(value)
  ) {
    return undefined;
  }
  return { id, generation, progressPage };
}

function writeSuccess(
  written: SetProgressPageValue,
  generation: number,
): WriteResult {
  return {
    ok: true,
    value: {
      id: written.id,
      generation,
      progressPage: written.progressPage,
    },
  };
}

function mapWriteFailure(
  code: LibraryCode,
  request: WriteRequest,
): WriteResult {
  switch (code) {
    case "not_found":
      return notFound();
    case "rejected":
      return rejected(request);
    case "cancelled":
    case "hash_mismatch":
    case "not_pdf":
      return handlerThrew();
    default:
      return assertNever(code);
  }
}

function rejected(request: WriteRequest): WriteResult {
  return {
    ok: false,
    error: {
      code: "rejected",
      retryable: false,
      id: request.id,
      generation: request.generation,
    },
  };
}

function notFound(): WriteResult {
  return { ok: false, error: { code: "not_found", retryable: false } };
}

function invalidPayload(): WriteResult {
  return { ok: false, error: { code: "invalid_payload", retryable: false } };
}

function handlerThrew(): WriteResult {
  return { ok: false, error: { code: "handler_threw", retryable: true } };
}

function readId(value: unknown): LibraryEntryId | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return parseLibraryEntryId(value);
}

function readSafePositive(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    return undefined;
  }
  return value;
}

function isDataObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * 必填值已经通过。键数量相同是已合入 Value.Check 的短路，不再核对键名。
 * 数量不同时，自有名字之外的键被拒绝。符号键不算自有名字。
 */
function allowsOwnKeys(value: object): boolean {
  const own = Object.getOwnPropertyNames(value);
  if (own.length === writeKeys.length) {
    return true;
  }
  return own.every((key) => writeKeys.includes(key));
}

function assertNever(value: never): never {
  throw new Error(typeof value);
}
