import { Type } from "@sinclair/typebox";

import {
  parseServiceConfiguredSchema,
  parseServiceStatusSchema,
} from "../parse-service-status.js";
import type { IpcCommandResult } from "./descriptor.js";
import { SAVE_FAILED, parseServiceReadErrors } from "./error-codes.js";

const closed = { additionalProperties: false } as const;

const nonEmpty = Type.String({ minLength: 1 });

/**
 * 内部写入。expose 为 false，renderer 不生成调用。
 * 只定形状，不调用 provider-config-validate，不写存储。
 * secret 只在这条请求里。响应和错误都不带它，也不带 secretRef 或路径。
 */
const saveParseServiceRequest = Type.Object(
  {
    vendorId: nonEmpty,
    format: nonEmpty,
    baseUrl: nonEmpty,
    modelId: nonEmpty,
    allowedHosts: Type.Array(nonEmpty, { minItems: 1 }),
    secret: nonEmpty,
  },
  closed,
);

const emptyRequest = Type.Object({}, closed);

const saveFailed = { code: SAVE_FAILED, retryable: false as const };

export const saveParseService = {
  channel: "settings.saveParseService" as const,
  kind: "command" as const,
  request: saveParseServiceRequest,
  response: parseServiceConfiguredSchema,
  errors: [...parseServiceReadErrors, saveFailed] as const,
  idempotent: false as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const getParseServiceStatus = {
  channel: "settings.getParseServiceStatus" as const,
  kind: "command" as const,
  request: emptyRequest,
  response: parseServiceStatusSchema,
  errors: parseServiceReadErrors,
  idempotent: true as const,
  expose: false as const,
  transport: "invoke" as const,
};

export const settingsParseIpc = [
  saveParseService,
  getParseServiceStatus,
] as const;

type SettingsParseCommand = Extract<
  (typeof settingsParseIpc)[number],
  { readonly kind: "command" }
>;

type SettingsParseOperation<Channel extends string> =
  Channel extends `settings.${infer Name}`
    ? Name extends `${string}.${string}`
      ? never
      : Name
    : never;

export type SettingsParseCommands = {
  [Command in SettingsParseCommand as SettingsParseOperation<
    Command["channel"]
  >]: IpcCommandResult<Command>;
};

export type SettingsParseChannel = (typeof settingsParseIpc)[number]["channel"];
