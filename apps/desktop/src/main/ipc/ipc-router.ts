import { randomUUID } from "node:crypto";

import { acceptHandlerResult } from "./accept-result.js";
import { exceedsIpcBudget, utf8Bytes } from "./oversize.js";
import { isPassThrough, type IpcPassThrough } from "./pass-through.js";
import { payloadMatches } from "./payload-schema.js";
import { redactAbsolutePaths } from "./redact-path.js";
import type {
  IpcRegistryCommand,
  IpcRegistryEntry,
} from "./registry.generated.js";
import type { IpcInvokeEvent } from "./sender-frame.js";

export type IpcCommandContext = {
  readonly requestId: string;
  readonly droppedFilePath?: string;
};

export type IpcCommandHandler = (
  payload: unknown,
  context: IpcCommandContext,
) => Promise<unknown>;

export type IpcListener = (
  event: IpcInvokeEvent,
  payload: unknown,
  droppedFilePath?: unknown,
) => Promise<IpcPassThrough>;

export type IpcOversizeLog = {
  readonly ts: string;
  readonly level: "warn";
  readonly feature: "ipc";
  readonly event: "ipc.oversize";
  readonly channel: string;
  readonly bytes: number;
  readonly requestId: string;
};

export type HandlerThrewLog = {
  readonly ts: string;
  readonly level: "error";
  readonly feature: "ipc";
  readonly event: "handler_threw";
  readonly channel: string;
  readonly requestId: string;
  readonly message: string;
};

export type IpcRouterOptions = {
  readonly registry: readonly IpcRegistryEntry[];
  readonly handlers: ReadonlyMap<string, IpcCommandHandler>;
  readonly bind: (channel: string, listener: IpcListener) => void;
  readonly acceptsSender: (event: IpcInvokeEvent) => boolean;
  readonly logOversize: (record: IpcOversizeLog) => void;
  readonly logHandlerThrew: (record: HandlerThrewLog) => void;
  readonly nowIso: () => string;
};

type CommandAttempt = {
  readonly entry: IpcRegistryCommand;
  readonly event: IpcInvokeEvent;
  readonly payload: unknown;
  readonly droppedFilePath: unknown;
  readonly options: IpcRouterOptions;
  readonly requestId: string;
};

type DroppedPath =
  | { readonly kind: "none" }
  | { readonly kind: "path"; readonly path: string }
  | { readonly kind: "reject" };

export function registerIpcRouter(options: IpcRouterOptions): number {
  assertHandlers(options.registry, options.handlers);
  let bound = 0;
  for (const entry of options.registry) {
    if (entry.kind !== "command") {
      continue;
    }
    options.bind(entry.channel, (event, payload, droppedFilePath) =>
      invokeCommand(entry, event, payload, droppedFilePath, options),
    );
    bound += 1;
  }
  return bound;
}

function assertHandlers(
  registry: readonly IpcRegistryEntry[],
  handlers: ReadonlyMap<string, IpcCommandHandler>,
): void {
  for (const entry of registry) {
    if (entry.kind === "command" && !handlers.has(entry.channel)) {
      throw new Error("missing ipc handler");
    }
  }
}

async function invokeCommand(
  entry: IpcRegistryCommand,
  event: IpcInvokeEvent,
  payload: unknown,
  droppedFilePath: unknown,
  options: IpcRouterOptions,
): Promise<IpcPassThrough> {
  const requestId = randomUUID();
  try {
    return await runCommand({
      entry,
      event,
      payload,
      droppedFilePath,
      options,
      requestId,
    });
  } catch (error) {
    return failThrew(entry.channel, requestId, error, options);
  }
}

async function runCommand(attempt: CommandAttempt): Promise<IpcPassThrough> {
  if (!attempt.options.acceptsSender(attempt.event)) {
    return senderRejected();
  }
  const dropped = acceptDroppedPath(attempt.entry, attempt.droppedFilePath);
  if (dropped.kind === "reject") {
    return invalidPayload();
  }
  noteSize(attempt, attempt.payload);
  if (!payloadMatches(attempt.entry.request, attempt.payload)) {
    return invalidPayload();
  }
  const produced = await callHandler(attempt, dropped);
  noteSize(attempt, produced);
  return produced;
}

function acceptDroppedPath(
  entry: IpcRegistryCommand,
  extra: unknown,
): DroppedPath {
  if (entry.transport !== "dropped-file") {
    return { kind: "none" };
  }
  if (typeof extra !== "string" || extra.length === 0 || extra.includes("\0")) {
    return { kind: "reject" };
  }
  return { kind: "path", path: extra };
}

async function callHandler(
  attempt: CommandAttempt,
  dropped: DroppedPath,
): Promise<IpcPassThrough> {
  const handler = attempt.options.handlers.get(attempt.entry.channel);
  if (handler === undefined) {
    return failThrew(
      attempt.entry.channel,
      attempt.requestId,
      new Error("handler missing"),
      attempt.options,
    );
  }
  // idempotent is a registry flag only. This path does not retry.
  const produced = await handler(
    attempt.payload,
    commandContext(attempt.requestId, dropped),
  );
  if (!isPassThrough(produced)) {
    return failThrew(
      attempt.entry.channel,
      attempt.requestId,
      new Error("handler result"),
      attempt.options,
    );
  }
  return acceptHandlerResult(attempt.entry.response, produced);
}

function commandContext(
  requestId: string,
  dropped: DroppedPath,
): IpcCommandContext {
  if (dropped.kind !== "path") {
    return { requestId };
  }
  return { requestId, droppedFilePath: dropped.path };
}

function noteSize(attempt: CommandAttempt, value: unknown): void {
  const bytes = utf8Bytes(value);
  if (bytes === undefined || !exceedsIpcBudget(bytes)) {
    return;
  }
  try {
    attempt.options.logOversize({
      ts: attempt.options.nowIso(),
      level: "warn",
      feature: "ipc",
      event: "ipc.oversize",
      channel: attempt.entry.channel,
      bytes,
      requestId: attempt.requestId,
    });
  } catch {
    return;
  }
}

function failThrew(
  channel: string,
  requestId: string,
  error: unknown,
  options: IpcRouterOptions,
): IpcPassThrough {
  const raw = error instanceof Error ? error.message : "handler threw";
  try {
    options.logHandlerThrew({
      ts: options.nowIso(),
      level: "error",
      feature: "ipc",
      event: "handler_threw",
      channel,
      requestId,
      message: redactAbsolutePaths(raw),
    });
  } catch {
    return handlerThrew();
  }
  return handlerThrew();
}

function handlerThrew(): IpcPassThrough {
  return { ok: false, error: { code: "handler_threw", retryable: true } };
}

function senderRejected(): IpcPassThrough {
  return { ok: false, error: { code: "sender_rejected", retryable: false } };
}

function invalidPayload(): IpcPassThrough {
  return { ok: false, error: { code: "invalid_payload", retryable: false } };
}
