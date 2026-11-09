import type { LibraryProgressCommands } from "@oi/contracts";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../domain/document-identity.js";
import type { LibraryCode } from "../domain/library-failure.js";
import type {
  GetProgressPage,
  GetProgressPageValue,
} from "./use-cases/get-progress-page.js";

const readKeys = ["id", "generation"];

export type GetProgressPageCommand = LibraryProgressCommands["getProgressPage"];

type ReadResult = Awaited<ReturnType<GetProgressPageCommand>>;

type ReadRequest = {
  readonly id: LibraryEntryId;
  readonly generation: number;
};

/** generation 原样来自请求，不证明代际仍活着。 */
export function createGetProgressPageCommand(
  getProgressPage: GetProgressPage,
): GetProgressPageCommand {
  return (input) => Promise.resolve(runGet(getProgressPage, input));
}

function runGet(getProgressPage: GetProgressPage, input: unknown): ReadResult {
  const request = parseReadRequest(input);
  if (request === undefined) {
    return invalidPayload();
  }
  const found = getProgressPage({ id: request.id });
  if (!found.ok) {
    return mapReadFailure(found.error.code, request);
  }
  return readSuccess(found.value, request.generation);
}

function parseReadRequest(value: unknown): ReadRequest | undefined {
  if (!isDataObject(value)) {
    return undefined;
  }
  const id = readId(value.id);
  const generation = readSafePositive(value.generation);
  if (id === undefined || generation === undefined || !allowsOwnKeys(value)) {
    return undefined;
  }
  return { id, generation };
}

function readSuccess(
  found: GetProgressPageValue,
  generation: number,
): ReadResult {
  const progressPage = readablePage(found.progressPage);
  if (progressPage === undefined) {
    return invalidPayload();
  }
  return {
    ok: true,
    value: { id: found.id, generation, progressPage },
  };
}

function readablePage(page: number | null): number | null | undefined {
  if (page === null) {
    return null;
  }
  return readSafePositive(page);
}

function mapReadFailure(code: LibraryCode, request: ReadRequest): ReadResult {
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

function rejected(request: ReadRequest): ReadResult {
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

function notFound(): ReadResult {
  return { ok: false, error: { code: "not_found", retryable: false } };
}

function invalidPayload(): ReadResult {
  return { ok: false, error: { code: "invalid_payload", retryable: false } };
}

function handlerThrew(): ReadResult {
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
  if (own.length === readKeys.length) {
    return true;
  }
  return own.every((key) => readKeys.includes(key));
}

function assertNever(value: never): never {
  throw new Error(typeof value);
}
