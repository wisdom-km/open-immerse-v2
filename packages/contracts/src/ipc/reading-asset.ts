import { Type, type Static } from "@sinclair/typebox";

import type { LibraryEntryId } from "../library.js";
import { libraryEntryIdSchema } from "../library.js";
import type { IpcCommandResult } from "./descriptor.js";
import { NOT_FOUND, REJECTED, ipcTransportErrors } from "./error-codes.js";

const closed = { additionalProperties: false } as const;

/** 断言不改运行时校验。static 让推导类型带上 LibraryEntryId。 */
const documentIdSchema = libraryEntryIdSchema as typeof libraryEntryIdSchema & {
  readonly static: LibraryEntryId;
};

/**
 * 安全整数。不是篇内页数，也不改 SQLite CHECK。
 * 本文件不分配代际，也不证明它仍活着。
 */
const generationSchema = Type.Integer({
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
});

/** 非空，且不含斜杠。不是路径，也不规定哈希。 */
const assetIdSchema = Type.String({
  minLength: 1,
  pattern: "^[^/\\\\]+$",
});

const notFound = { code: NOT_FOUND, retryable: false as const };

const bindRejected = {
  code: REJECTED,
  retryable: false as const,
  detail: Type.Object({ id: documentIdSchema }, closed),
};

const pairRejected = {
  code: REJECTED,
  retryable: false as const,
  detail: Type.Object(
    { id: documentIdSchema, generation: generationSchema },
    closed,
  ),
};

const bindRequest = Type.Object({ id: documentIdSchema }, closed);

const bindResponse = Type.Object(
  {
    id: documentIdSchema,
    assetId: assetIdSchema,
    generation: generationSchema,
  },
  closed,
);

const pair = Type.Object(
  { id: documentIdSchema, generation: generationSchema },
  closed,
);

/**
 * 登记的内部契约。expose 为 false。
 * 被拒绝时 detail 只有请求里的 id，不带 generation。
 * 本对象不查活代际，不写库。
 */
export const bindReadingAsset = {
  channel: "library.bindReadingAsset" as const,
  kind: "command" as const,
  request: bindRequest,
  response: bindResponse,
  errors: [notFound, bindRejected, ...ipcTransportErrors] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "invoke" as const,
};

/**
 * 撤销的内部契约。expose 为 false。
 * 被拒绝时 detail 原样是请求里的 id 与 generation。
 * 本对象不删表。
 */
export const revokeReadingAsset = {
  channel: "library.revokeReadingAsset" as const,
  kind: "command" as const,
  request: pair,
  response: pair,
  errors: [pairRejected, ...ipcTransportErrors] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const readingAssetIpc = [bindReadingAsset, revokeReadingAsset] as const;

type ReadingAssetCommand = Extract<
  (typeof readingAssetIpc)[number],
  { readonly kind: "command" }
>;

type ReadingAssetOperation<Channel extends string> =
  Channel extends `library.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type ReadingAssetCommands = {
  [Command in ReadingAssetCommand as ReadingAssetOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type ReadingAssetChannel = (typeof readingAssetIpc)[number]["channel"];

export type BindReadingAssetRequest = Static<typeof bindRequest>;
export type BindReadingAssetResponse = Static<typeof bindResponse>;
