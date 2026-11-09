import type { ReadingAssetCommands } from "@oi/contracts";

import {
  parseLibraryEntryId,
  type LibraryEntryId,
} from "../domain/document-identity.js";
import type { ReadingGenerationTable } from "./reading-generation-table.js";

const revokeKeys = ["id", "generation"];

export type RevokeReadingAssetCommand =
  ReadingAssetCommands["revokeReadingAsset"];

type RevokeResult = Awaited<ReturnType<RevokeReadingAssetCommand>>;

type RevokeRequest = {
  readonly id: LibraryEntryId;
  readonly generation: number;
};

/** 只删除表内当前那一对。没有库端口。 */
export function createRevokeReadingAssetCommand(
  table: ReadingGenerationTable,
): RevokeReadingAssetCommand {
  return (input) => Promise.resolve(runRevoke(table, input));
}

function runRevoke(
  table: ReadingGenerationTable,
  input: unknown,
): RevokeResult {
  const request = parseRevokeRequest(input);
  if (request === undefined) {
    return invalidPayload();
  }
  if (!table.revoke(request.id, request.generation)) {
    return rejected(request);
  }
  return {
    ok: true,
    value: { id: request.id, generation: request.generation },
  };
}

function parseRevokeRequest(value: unknown): RevokeRequest | undefined {
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

function rejected(request: RevokeRequest): RevokeResult {
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

function invalidPayload(): RevokeResult {
  return { ok: false, error: { code: "invalid_payload", retryable: false } };
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
  if (own.length === revokeKeys.length) {
    return true;
  }
  return own.every((key) => revokeKeys.includes(key));
}
