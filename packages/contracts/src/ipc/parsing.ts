import { Type } from "@sinclair/typebox";

import { parseServiceStatusSchema } from "../parse-service-status.js";
import type { IpcCommandResult } from "./descriptor.js";
import { parseServiceReadErrors } from "./error-codes.js";

const closed = { additionalProperties: false } as const;

/**
 * 能力查询。成功体与内部读状态相同。没有 save_failed。
 * 2026-11-09 01:56：expose 为 true 只在真实配置来源与 handler 同一次合入时打开。
 * 2026-11-14 第 2 笔打开这一条。settings.* 仍是 false。
 * 构建不支持不是 unconfigured。
 */
export const getParseCapabilities = {
  channel: "parsing.getParseCapabilities" as const,
  kind: "command" as const,
  request: Type.Object({}, closed),
  response: parseServiceStatusSchema,
  errors: parseServiceReadErrors,
  idempotent: true as const,
  expose: true as const,
  transport: "invoke" as const,
};

export const parsingIpc = [getParseCapabilities] as const;

type ParsingCommand = Extract<
  (typeof parsingIpc)[number],
  { readonly kind: "command" }
>;

type ParsingOperation<Channel extends string> =
  Channel extends `parsing.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type ParsingCapabilityCommands = {
  [Command in ParsingCommand as ParsingOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type ParsingCapabilityChannel = (typeof parsingIpc)[number]["channel"];
