import { Type, type Static } from "@sinclair/typebox";

import type { JobId } from "../ids.js";
import type { LibraryEntryId } from "../library.js";
import { libraryEntryIdSchema } from "../library.js";
import type { IpcCommandResult } from "./descriptor.js";
import { NOT_FOUND, ipcTransportErrors } from "./error-codes.js";

const closed = { additionalProperties: false } as const;

const notFound = { code: NOT_FOUND, retryable: false as const };

/** 断言不改运行时校验。static 让推导类型带上 LibraryEntryId。 */
const documentIdSchema = libraryEntryIdSchema as typeof libraryEntryIdSchema & {
  readonly static: LibraryEntryId;
};

/** JobId 不限制长度或字符集（ids.ts）。static 只贴上品牌。 */
const jobIdSchema = Type.String() as ReturnType<typeof Type.String> & {
  readonly static: JobId;
};

/**
 * 打开 PDF 的唯一用户入口（ARCH §9、§2.5）。长任务立即返回 jobId。
 * 请求只有 id。这个值与文献库条目是同一个 SHA-256，不接收路径。
 * ③ 只定形状：无解析服务时浏览原文仍须成功（AC-11）。这里不实现解析流水线。
 * 幂等：同一 id 再次打开返回进行中或最近一次的 jobId，不另开解析作业。
 * 不另加 not_pdf：文献库条目已经是 PDF。进度走 jobs 事件，本文件不定义 jobs 通道。
 */
const openDocumentRequest = Type.Object(
  {
    id: documentIdSchema,
  },
  closed,
);

const openDocumentResponse = Type.Object(
  {
    jobId: jobIdSchema,
  },
  closed,
);

export const openDocument = {
  channel: "ingest.openDocument" as const,
  kind: "command" as const,
  request: openDocumentRequest,
  response: openDocumentResponse,
  errors: [notFound, ...ipcTransportErrors] as const,
  idempotent: true as const,
  expose: true as const,
  transport: "invoke" as const,
};

export const ingestIpc = [openDocument] as const;

type IngestCommand = Extract<
  (typeof ingestIpc)[number],
  { readonly kind: "command" }
>;

type IngestOperation<Channel extends string> =
  Channel extends `ingest.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type IngestCommands = {
  [Command in IngestCommand as IngestOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type IngestChannel = (typeof ingestIpc)[number]["channel"];

export type IngestOpenDocumentRequest = Static<typeof openDocumentRequest>;
export type IngestOpenDocumentResponse = Static<typeof openDocumentResponse>;
