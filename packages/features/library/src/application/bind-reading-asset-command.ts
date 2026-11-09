import type { ReadingAssetCommands } from "@oi/contracts";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../domain/document-identity.js";
import type { LibraryCode } from "../domain/library-failure.js";
import type { GetProgressPage } from "./use-cases/get-progress-page.js";
import type { ReadingGenerationTable } from "./reading-generation-table.js";

const bindKeys = ["id"];

export type BindReadingAssetCommand = ReadingAssetCommands["bindReadingAsset"];

type BindResult = Awaited<ReturnType<BindReadingAssetCommand>>;

type BindRequest = {
  readonly id: LibraryEntryId;
};

/** 写表之前用已合入的读页用例确认文献存在。响应不含页。 */
export function createBindReadingAssetCommand(
  getProgressPage: GetProgressPage,
  table: ReadingGenerationTable,
): BindReadingAssetCommand {
  return (input) => Promise.resolve(runBind(getProgressPage, table, input));
}

function runBind(
  getProgressPage: GetProgressPage,
  table: ReadingGenerationTable,
  input: unknown,
): BindResult {
  const request = parseBindRequest(input);
  if (request === undefined) {
    return invalidPayload();
  }
  const found = getProgressPage({ id: request.id });
  if (!found.ok) {
    return mapBindFailure(found.error.code, request.id);
  }
  const adopted = table.bind(request.id);
  if (!adopted.ok) {
    return rejectedId(request.id);
  }
  return {
    ok: true,
    value: {
      id: request.id,
      assetId: adopted.assetId,
      generation: adopted.generation,
    },
  };
}

function parseBindRequest(value: unknown): BindRequest | undefined {
  if (!isDataObject(value)) {
    return undefined;
  }
  const id = readId(value.id);
  if (id === undefined || !allowsOwnKeys(value)) {
    return undefined;
  }
  return { id };
}

function mapBindFailure(code: LibraryCode, id: LibraryEntryId): BindResult {
  switch (code) {
    case "not_found":
      return notFound();
    case "rejected":
      return rejectedId(id);
    case "cancelled":
    case "hash_mismatch":
    case "not_pdf":
      return handlerThrew();
    default:
      return assertNever(code);
  }
}

function rejectedId(id: LibraryEntryId): BindResult {
  return { ok: false, error: { code: "rejected", retryable: false, id } };
}

function notFound(): BindResult {
  return { ok: false, error: { code: "not_found", retryable: false } };
}

function invalidPayload(): BindResult {
  return { ok: false, error: { code: "invalid_payload", retryable: false } };
}

function handlerThrew(): BindResult {
  return { ok: false, error: { code: "handler_threw", retryable: true } };
}

function readId(value: unknown): LibraryEntryId | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return parseLibraryEntryId(value);
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
  if (own.length === bindKeys.length) {
    return true;
  }
  return own.every((key) => bindKeys.includes(key));
}

function assertNever(value: never): never {
  throw new Error(typeof value);
}
