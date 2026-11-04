import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { Result } from "../src/result.js";
import type {
  IpcCommandDescriptor,
  IpcErrorBody,
  IpcEventDescriptor,
  ResolvedIpcTransport,
} from "../src/ipc/descriptor.js";
import { ipcTransportErrors } from "../src/ipc/error-codes.js";
import {
  answerEgressConsent,
  listEgressDestinations,
  onEgressConsentRequired,
  settingsIpc,
  type SettingsEgressChannel,
  type SettingsEgressCommands,
} from "../src/ipc/settings.js";

const idempotentByChannel = {
  "settings.answerEgressConsent": false,
  "settings.withdrawEgressConsent": false,
  "settings.setEgressPromptEnabled": true,
  "settings.listEgressDestinations": true,
} as const;

type CommandError<Channel extends SettingsEgressChannel> =
  Extract<(typeof settingsIpc)[number], { readonly channel: Channel }> extends {
    readonly errors: readonly (infer ErrorSpec)[];
  }
    ? ErrorSpec
    : never;

it("matches the command and event descriptor shapes", () => {
  for (const descriptor of settingsIpc) {
    if (descriptor.kind === "command") {
      expectTypeOf(descriptor).toExtend<IpcCommandDescriptor>();
      continue;
    }
    expectTypeOf(descriptor).toExtend<IpcEventDescriptor>();
  }
});

it("uses the settings egress channel literals", () => {
  expectTypeOf<SettingsEgressChannel>().toEqualTypeOf<
    | "settings.answerEgressConsent"
    | "settings.withdrawEgressConsent"
    | "settings.setEgressPromptEnabled"
    | "settings.listEgressDestinations"
    | "settings.onEgressConsentRequired"
  >();
  expect(settingsIpc.map((descriptor) => descriptor.channel)).toEqual([
    "settings.answerEgressConsent",
    "settings.withdrawEgressConsent",
    "settings.setEgressPromptEnabled",
    "settings.listEgressDestinations",
    "settings.onEgressConsentRequired",
  ]);
});

it("keeps every settings descriptor unexposed", () => {
  for (const descriptor of settingsIpc) {
    expect(descriptor.expose).toBe(false);
  }
});

it("matches the §7.0 idempotent flags and omits them on the event", () => {
  for (const descriptor of settingsIpc) {
    if (descriptor.kind !== "command") {
      expect("idempotent" in descriptor).toBe(false);
      continue;
    }
    expect(descriptor.idempotent).toBe(idempotentByChannel[descriptor.channel]);
  }
});

it("uses snake_case codes with static retryable and no message", () => {
  for (const descriptor of settingsIpc) {
    for (const error of descriptor.errors) {
      expect(error.code).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      expect(error).not.toHaveProperty("message");
    }
  }
  expect(ipcTransportErrors.map((error) => error.code)).toEqual([
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ]);
  expect(ipcTransportErrors.map((error) => error.retryable)).toEqual([
    false,
    false,
    true,
  ]);
  for (const error of ipcTransportErrors) {
    expect(error).not.toHaveProperty("detail");
    expect(error).not.toHaveProperty("message");
  }
});

it("puts transport codes on every command and keeps business codes", () => {
  expectTypeOf<
    CommandError<"settings.answerEgressConsent">["code"]
  >().toEqualTypeOf<
    "unknown_request" | "sender_rejected" | "invalid_payload" | "handler_threw"
  >();
  expectTypeOf<
    CommandError<"settings.withdrawEgressConsent">["code"]
  >().toEqualTypeOf<
    | "consent_not_granted"
    | "sender_rejected"
    | "invalid_payload"
    | "handler_threw"
  >();
  expectTypeOf<
    CommandError<"settings.setEgressPromptEnabled">["code"]
  >().toEqualTypeOf<"sender_rejected" | "invalid_payload" | "handler_threw">();
  expectTypeOf<
    CommandError<"settings.listEgressDestinations">["code"]
  >().toEqualTypeOf<"sender_rejected" | "invalid_payload" | "handler_threw">();
  type Threw = Extract<
    CommandError<"settings.answerEgressConsent">,
    { readonly code: "handler_threw" }
  >;
  expectTypeOf<Threw["retryable"]>().toEqualTypeOf<true>();
  type Rejected = Extract<
    CommandError<"settings.answerEgressConsent">,
    { readonly code: "sender_rejected" }
  >;
  expectTypeOf<Rejected["retryable"]>().toEqualTypeOf<false>();
  expectTypeOf<
    "message" extends keyof Threw ? true : false
  >().toEqualTypeOf<false>();
  expectTypeOf<
    "detail" extends keyof Rejected ? true : false
  >().toEqualTypeOf<false>();
});

it("checks one legal and one illegal answer payload", () => {
  expect(
    Value.Check(answerEgressConsent.request, {
      requestId: "req-1",
      granted: null,
    }),
  ).toBe(true);
  expect(
    Value.Check(answerEgressConsent.request, {
      requestId: "req-1",
      granted: null,
      path: "/tmp/paper.pdf",
    }),
  ).toBe(false);
});

it("derives listEgressDestinations with no request argument", () => {
  expectTypeOf<
    "request" extends keyof typeof listEgressDestinations ? true : false
  >().toEqualTypeOf<false>();
  expectTypeOf<
    SettingsEgressCommands["listEgressDestinations"]
  >().parameters.toEqualTypeOf<[]>();
  type Listed = Awaited<
    ReturnType<SettingsEgressCommands["listEgressDestinations"]>
  >;
  expectTypeOf<Listed>().toExtend<Result<readonly unknown[], unknown>>();
});

it("lets a business code carry a path-free detail schema", () => {
  const space = {
    code: "insufficient_space" as const,
    retryable: false as const,
    detail: Type.Object(
      {
        requiredBytes: Type.Number(),
        availableBytes: Type.Number(),
      },
      { additionalProperties: false },
    ),
  };
  expectTypeOf<IpcErrorBody<typeof space>>().toEqualTypeOf<
    Readonly<{ code: "insufficient_space"; retryable: false }> & {
      requiredBytes: number;
      availableBytes: number;
    }
  >();
  expectTypeOf<
    "path" extends keyof IpcErrorBody<typeof space> ? true : false
  >().toEqualTypeOf<false>();
  expect(
    Value.Check(space.detail, { requiredBytes: 12, availableBytes: 3 }),
  ).toBe(true);
  expect(
    Value.Check(space.detail, {
      requiredBytes: 12,
      availableBytes: 3,
      path: "/tmp/paper.pdf",
    }),
  ).toBe(false);
});

it("accepts snapshotOf, a progress payload, and dropped-file transport", () => {
  const progress = {
    channel: "settings.dataDir.onRelocateProgress",
    kind: "event",
    payload: Type.Object(
      {
        jobId: Type.String(),
        done: Type.Number(),
        total: Type.Number(),
        unit: Type.Union([Type.Literal("bytes"), Type.Literal("pages")]),
      },
      { additionalProperties: false },
    ),
    errors: [],
    expose: false,
    transport: "invoke",
  } satisfies IpcEventDescriptor;
  const snapshot = {
    channel: "settings.getPendingEgressConsent",
    kind: "command",
    response: Type.Array(onEgressConsentRequired.payload),
    errors: ipcTransportErrors,
    idempotent: true,
    expose: false,
    transport: "invoke",
    snapshotOf: onEgressConsentRequired.channel,
  } satisfies IpcCommandDescriptor;
  const dropped = {
    channel: "example.drop",
    kind: "command",
    response: Type.Object({ assetId: Type.String() }),
    errors: ipcTransportErrors,
    idempotent: false,
    expose: false,
    transport: "dropped-file",
  } satisfies IpcCommandDescriptor;
  const omitted = {
    channel: "example.read",
    kind: "command",
    response: Type.Object({}),
    errors: [],
    idempotent: true,
    expose: false,
  } satisfies IpcCommandDescriptor;
  expect(snapshot.snapshotOf).toBe("settings.onEgressConsentRequired");
  expect(dropped.transport).toBe("dropped-file");
  expect("transport" in omitted).toBe(false);
  expect(
    Value.Check(progress.payload, {
      jobId: "job-1",
      done: 1,
      total: 4,
      unit: "bytes",
    }),
  ).toBe(true);
  expectTypeOf<
    ResolvedIpcTransport<typeof omitted>
  >().toEqualTypeOf<"invoke">();
  expect(
    settingsIpc.some((descriptor) => descriptor.channel === snapshot.channel),
  ).toBe(false);
});
