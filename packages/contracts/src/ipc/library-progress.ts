import { Type } from "@sinclair/typebox";

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
 * 本文件不读库，也不证明代际仍活着。
 */
const safePage = Type.Integer({
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
});

const notFound = { code: NOT_FOUND, retryable: false as const };

const pairRejected = {
  code: REJECTED,
  retryable: false as const,
  detail: Type.Object({ id: documentIdSchema, generation: safePage }, closed),
};

const readRequest = Type.Object(
  { id: documentIdSchema, generation: safePage },
  closed,
);

const readResponse = Type.Object(
  {
    id: documentIdSchema,
    generation: safePage,
    progressPage: Type.Union([safePage, Type.Null()]),
  },
  closed,
);

const writeRequest = Type.Object(
  {
    id: documentIdSchema,
    generation: safePage,
    progressPage: safePage,
  },
  closed,
);

const writeResponse = Type.Object(
  {
    id: documentIdSchema,
    generation: safePage,
    progressPage: safePage,
  },
  closed,
);

/**
 * 读页的内部契约。expose 为 false。
 * 成功页可以是 null。被拒绝时 detail 原样是请求里的一对。
 */
export const getProgressPage = {
  channel: "library.getProgressPage" as const,
  kind: "command" as const,
  request: readRequest,
  response: readResponse,
  errors: [notFound, pairRejected, ...ipcTransportErrors] as const,
  idempotent: true as const,
  expose: false as const,
  transport: "invoke" as const,
};

/**
 * 写页的内部契约。expose 为 false。
 * 请求不接受 null。被拒绝时 detail 不含页码。
 */
export const setProgressPage = {
  channel: "library.setProgressPage" as const,
  kind: "command" as const,
  request: writeRequest,
  response: writeResponse,
  errors: [notFound, pairRejected, ...ipcTransportErrors] as const,
  idempotent: true as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const libraryProgressIpc = [getProgressPage, setProgressPage] as const;

type LibraryProgressCommand = Extract<
  (typeof libraryProgressIpc)[number],
  { readonly kind: "command" }
>;

type LibraryProgressOperation<Channel extends string> =
  Channel extends `library.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type LibraryProgressCommands = {
  [Command in LibraryProgressCommand as LibraryProgressOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type LibraryProgressChannel =
  (typeof libraryProgressIpc)[number]["channel"];
