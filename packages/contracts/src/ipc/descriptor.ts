import type { Static, TSchema } from "@sinclair/typebox";

import type { Result } from "../result.js";

export type IpcTransport = "invoke" | "dropped-file";

export type IpcErrorSpec = {
  readonly code: string;
  readonly retryable: boolean;
  readonly detail?: TSchema;
};

export type IpcCommandDescriptor = {
  readonly channel: string;
  readonly kind: "command";
  readonly request?: TSchema;
  readonly response: TSchema;
  readonly errors: readonly IpcErrorSpec[];
  readonly idempotent: boolean;
  readonly expose: boolean;
  readonly transport?: IpcTransport;
  readonly snapshotOf?: string;
};

export type IpcEventDescriptor = {
  readonly channel: string;
  readonly kind: "event";
  readonly payload: TSchema;
  readonly errors: readonly IpcErrorSpec[];
  readonly expose: boolean;
  readonly transport?: IpcTransport;
};

export type ResolvedIpcTransport<D> = D extends {
  readonly transport: infer Transport;
}
  ? Transport
  : "invoke";

type ErrorWithDetail<E> = E extends {
  readonly code: infer Code;
  readonly retryable: infer Retryable;
  readonly detail: infer Detail extends TSchema;
}
  ? Readonly<{ code: Code; retryable: Retryable }> & Static<Detail>
  : never;

type ErrorWithoutDetail<E> = E extends {
  readonly code: infer Code;
  readonly retryable: infer Retryable;
}
  ? Readonly<{ code: Code; retryable: Retryable }>
  : never;

export type IpcErrorBody<E> = E extends { readonly detail: TSchema }
  ? ErrorWithDetail<E>
  : ErrorWithoutDetail<E>;

type CommandArgs<D> = D extends {
  readonly request: infer Request extends TSchema;
}
  ? [input: Static<Request>]
  : [];

export type IpcCommandResult<D> = D extends {
  readonly response: infer Response extends TSchema;
  readonly errors: readonly (infer ErrorSpec)[];
}
  ? (
      ...args: CommandArgs<D>
    ) => Promise<Result<Static<Response>, IpcErrorBody<ErrorSpec>>>
  : never;
