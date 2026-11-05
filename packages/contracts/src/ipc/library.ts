import { Type, type Static } from "@sinclair/typebox";

import {
  libraryEntryIdSchema,
  libraryEntrySchema,
  librarySortSchema,
  libraryViewSchema,
} from "../library.js";
import type { IpcCommandResult } from "./descriptor.js";
import { CANCELLED, NOT_FOUND, ipcTransportErrors } from "./error-codes.js";

const closed = { additionalProperties: false } as const;

const NOT_PDF = "not_pdf" as const;
const HASH_MISMATCH = "hash_mismatch" as const;

const notPdf = { code: NOT_PDF, retryable: false as const };
const hashMismatch = { code: HASH_MISMATCH, retryable: false as const };
const cancelled = { code: CANCELLED, retryable: false as const };
const notFound = { code: NOT_FOUND, retryable: false as const };

const emptyRequest = Type.Object({}, closed);

const importResponse = Type.Object(
  {
    entry: libraryEntrySchema,
    duplicate: Type.Boolean(),
  },
  closed,
);

const listRequest = Type.Object(
  {
    view: libraryViewSchema,
    sort: Type.Optional(librarySortSchema),
  },
  closed,
);

const relocateRequest = Type.Object(
  {
    id: libraryEntryIdSchema,
  },
  closed,
);

const relocateResponse = Type.Object(
  {
    entry: libraryEntrySchema,
  },
  closed,
);

/**
 * 对话框由 main 打开。请求体为空，不接收路径。
 * 重复导入返回已有条目，duplicate 为 true（UIX-12、AC-01）。不返回 jobId：ingest 属③。
 */
export const importLibrary = {
  channel: "library.import" as const,
  kind: "command" as const,
  request: emptyRequest,
  response: importResponse,
  errors: [cancelled, notPdf, hashMismatch, ...ipcTransportErrors] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "invoke" as const,
};

/**
 * 拖入。transport 为 dropped-file：路径只在 preload 里取，不进 request / response。
 * 请求体为空，避免 schema 出现路径字段。expose 保持 false，到 PR-C 再打开。
 */
export const importDroppedLibrary = {
  channel: "library.importDropped" as const,
  kind: "command" as const,
  request: emptyRequest,
  response: importResponse,
  errors: [notPdf, hashMismatch, ...ipcTransportErrors] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "dropped-file" as const,
};

/** 读列表。sort 可缺；缺省时的顺序见 LibraryView 的注释，由 core 做。 */
export const listLibrary = {
  channel: "library.list" as const,
  kind: "command" as const,
  request: listRequest,
  response: Type.Array(libraryEntrySchema),
  errors: ipcTransportErrors,
  idempotent: true as const,
  expose: false as const,
  transport: "invoke" as const,
};

/**
 * B16 用，②不接。
 * main 打开文件选择器。请求只有 id，不带 path。expose 保持 false。
 */
export const relocateLibrary = {
  channel: "library.relocate" as const,
  kind: "command" as const,
  request: relocateRequest,
  response: relocateResponse,
  errors: [
    notFound,
    cancelled,
    notPdf,
    hashMismatch,
    ...ipcTransportErrors,
  ] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const libraryIpc = [
  importLibrary,
  importDroppedLibrary,
  listLibrary,
  relocateLibrary,
] as const;

type LibraryCommand = Extract<
  (typeof libraryIpc)[number],
  { readonly kind: "command" }
>;

type LibraryOperation<Channel extends string> =
  Channel extends `library.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type LibraryCommands = {
  [Command in LibraryCommand as LibraryOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type LibraryChannel = (typeof libraryIpc)[number]["channel"];

export type LibraryImportResult = Static<typeof importResponse>;
export type LibraryRelocateRequest = Static<typeof relocateRequest>;
