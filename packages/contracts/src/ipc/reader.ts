import { Type } from "@sinclair/typebox";

import type { LibraryEntryId } from "../library.js";
import { libraryEntryIdSchema } from "../library.js";
import { readerZoomPercentSchema } from "../reader.js";
import type { IpcCommandResult } from "./descriptor.js";
import { NOT_FOUND, ipcTransportErrors } from "./error-codes.js";

const closed = { additionalProperties: false } as const;

const notFound = { code: NOT_FOUND, retryable: false as const };

/** 断言不改运行时校验。static 让推导类型带上 LibraryEntryId。 */
const documentIdSchema = libraryEntryIdSchema as typeof libraryEntryIdSchema & {
  readonly static: LibraryEntryId;
};

/**
 * ARCH §9.1 的 `reader.setZoom(docId, level | 'fit-width' | 'fit-page')`。
 * 请求字段用 id，不用 docId：与文献库是同一个 SHA-256。不接收路径。
 * 百分比是 25–400 的整数。只缩放 PDF 原文栏。
 * 不发明 reader.setPage / reader.setViewMode。页码与栏位留在 renderer。
 * 幂等：同一 id 与 level 再写一次，记住的缩放不变。
 */
export const readerZoomLevelSchema = Type.Union([
  readerZoomPercentSchema,
  Type.Literal("fit-width"),
  Type.Literal("fit-page"),
]);

const setZoomRequest = Type.Object(
  {
    id: documentIdSchema,
    level: readerZoomLevelSchema,
  },
  closed,
);

const setZoomResponse = Type.Object(
  {
    level: readerZoomLevelSchema,
  },
  closed,
);

export const setZoom = {
  channel: "reader.setZoom" as const,
  kind: "command" as const,
  request: setZoomRequest,
  response: setZoomResponse,
  errors: [notFound, ...ipcTransportErrors] as const,
  idempotent: true as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const readerIpc = [setZoom] as const;

type ReaderCommand = Extract<
  (typeof readerIpc)[number],
  { readonly kind: "command" }
>;

type ReaderOperation<Channel extends string> =
  Channel extends `reader.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type ReaderCommands = {
  [Command in ReaderCommand as ReaderOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type ReaderChannel = (typeof readerIpc)[number]["channel"];
