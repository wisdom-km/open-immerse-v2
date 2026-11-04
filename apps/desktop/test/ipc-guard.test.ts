import { expect, it } from "vitest";

import {
  IPC_OVERSIZE_BYTES,
  exceedsIpcBudget,
  utf8Bytes,
} from "../src/main/ipc/oversize.js";
import { payloadMatches } from "../src/main/ipc/payload-schema.js";
import type { IpcJsonSchema } from "../src/main/ipc/registry.generated.js";
import { redactAbsolutePaths } from "../src/main/ipc/redact-path.js";
import {
  isAppSender,
  type IpcSenderFrame,
} from "../src/main/ipc/sender-frame.js";

const closedObject = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: { id: { type: "string" } },
} satisfies IpcJsonSchema;

it("accepts a matching oi-app main frame when the sender is checked", () => {
  const frame = { url: "oi-app://app/index.html" };
  expect(
    isAppSender(event(frame, 4), [{ senderId: 4, mainFrame: frame }]),
  ).toBe(true);
});

it("rejects the sender when the frame is missing or not this window", () => {
  const frame = { url: "oi-app://app/index.html" };
  const other = { url: "oi-app://app/index.html" };
  expect(isAppSender(event(null, 4), [{ senderId: 4, mainFrame: frame }])).toBe(
    false,
  );
  expect(
    isAppSender(event(frame, 4), [{ senderId: 9, mainFrame: frame }]),
  ).toBe(false);
  expect(
    isAppSender(event(frame, 4), [{ senderId: 4, mainFrame: other }]),
  ).toBe(false);
  expect(
    isAppSender(event({ url: "https://example.test" }, 4), [
      { senderId: 4, mainFrame: { url: "https://example.test" } },
    ]),
  ).toBe(false);
  expect(
    isAppSender(event({ url: "file:///tmp/index.html" }, 4), [
      { senderId: 4, mainFrame: { url: "file:///tmp/index.html" } },
    ]),
  ).toBe(false);
});

it("accepts a closed object when the payload matches the schema", () => {
  expect(payloadMatches(closedObject, { id: "a" })).toBe(true);
  expect(payloadMatches(closedObject, { id: "a", extra: 1 })).toBe(false);
  expect(payloadMatches(closedObject, {})).toBe(false);
  expect(payloadMatches(closedObject, { id: 1 })).toBe(false);
  expect(payloadMatches(null, undefined)).toBe(true);
  expect(payloadMatches(null, {})).toBe(false);
});

it("accepts a literal union when anyOf matches", () => {
  const schema = {
    anyOf: [
      { type: "string", const: "bytes" },
      { type: "string", const: "pages" },
    ],
  } satisfies IpcJsonSchema;
  expect(payloadMatches(schema, "bytes")).toBe(true);
  expect(payloadMatches(schema, "pages")).toBe(true);
  expect(payloadMatches(schema, "lines")).toBe(false);
  expect(payloadMatches({ type: "integer" }, 2)).toBe(true);
  expect(payloadMatches({ type: "integer" }, 2.5)).toBe(false);
  expect(
    payloadMatches({ type: "array", items: { type: "string" } }, ["a"]),
  ).toBe(true);
  expect(payloadMatches({ type: "null" }, null)).toBe(true);
});

it("replaces absolute paths when a handler message is redacted", () => {
  const text = redactAbsolutePaths(
    "boom /tmp/secret.txt and C:\\Users\\a\\b.ts file:///var/log.txt",
  );
  expect(text.includes("/tmp/secret.txt")).toBe(false);
  expect(text.includes("C:\\Users\\a\\b.ts")).toBe(false);
  expect(text.includes("file:///var/log.txt")).toBe(false);
  expect(text.includes("[path]")).toBe(true);
  expect(redactAbsolutePaths("handler threw")).toBe("handler threw");
});

it("counts utf-8 bytes when an ipc payload is measured", () => {
  expect(utf8Bytes("a")).toBe(3);
  expect(utf8Bytes(undefined)).toBeUndefined();
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  expect(utf8Bytes(cycle)).toBeUndefined();
  expect(exceedsIpcBudget(IPC_OVERSIZE_BYTES)).toBe(false);
  expect(exceedsIpcBudget(IPC_OVERSIZE_BYTES + 1)).toBe(true);
});

function event(frame: IpcSenderFrame | null, senderId: number) {
  return { senderFrame: frame, sender: { id: senderId } };
}
