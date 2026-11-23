import { Type } from "@sinclair/typebox";

import type { IpcCommandResult } from "./descriptor.js";
import { REJECTED, ipcTransportErrors } from "./error-codes.js";

const closed = { additionalProperties: false } as const;

const rejected = { code: REJECTED, retryable: false as const };

const epochSchema = Type.Integer({
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
});

const viewMenuModeSchema = Type.Union([
  Type.Literal("none"),
  Type.Literal("original"),
  Type.Literal("contrast"),
  Type.Literal("translation"),
]);

const readRequest = Type.Object(
  {
    op: Type.Literal("read"),
  },
  closed,
);

const submitRequest = Type.Object(
  {
    op: Type.Literal("submit"),
    mode: viewMenuModeSchema,
    epoch: epochSchema,
    generation: epochSchema,
  },
  closed,
);

const reportViewMenuRequest = Type.Union([readRequest, submitRequest]);

const reportViewMenuResponse = Type.Object(
  {
    epoch: epochSchema,
  },
  closed,
);

/**
 * 已暴露。read 只有 op。submit 带四值 mode 与两个代际整数。
 * 成功体只有 epoch。不新增字段。
 */
export const reportViewMenu = {
  channel: "shell.reportViewMenu" as const,
  kind: "command" as const,
  request: reportViewMenuRequest,
  response: reportViewMenuResponse,
  errors: [rejected, ...ipcTransportErrors] as const,
  idempotent: false as const,
  expose: true as const,
  transport: "invoke" as const,
};

export const shellIpc = [reportViewMenu] as const;

type ShellCommand = Extract<
  (typeof shellIpc)[number],
  { readonly kind: "command" }
>;

type ShellOperation<Channel extends string> =
  Channel extends `shell.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type ShellCommands = {
  [Command in ShellCommand as ShellOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type ShellChannel = (typeof shellIpc)[number]["channel"];
