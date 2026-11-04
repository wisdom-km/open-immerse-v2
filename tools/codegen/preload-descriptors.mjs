import { importDirectory } from "./preload-module-graph.mjs";
import { assertExposedTransport } from "./preload-transport.mjs";

export async function loadExposedDescriptors(inputDir) {
  const modules = await importDirectory(inputDir);
  const byChannel = new Map();
  const seen = new Set();
  for (const namespace of modules) {
    for (const value of Object.values(namespace)) {
      visitExport(value, seen, byChannel);
    }
  }
  const exposed = [...byChannel.values()].filter((item) => item.expose);
  for (const descriptor of exposed) {
    assertExposedTransport(descriptor);
  }
  return exposed.sort(byChannelName);
}

function visitExport(value, seen, byChannel) {
  if (Array.isArray(value)) {
    for (const item of value) {
      visitExport(item, seen, byChannel);
    }
    return;
  }
  if (!isDescriptor(value) || seen.has(value)) {
    return;
  }
  seen.add(value);
  const normalized = normalizeDescriptor(value);
  if (byChannel.has(normalized.channel)) {
    throw new Error("duplicate ipc channel");
  }
  byChannel.set(normalized.channel, normalized);
}

function isDescriptor(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return (
    typeof value.channel === "string" &&
    (value.kind === "command" || value.kind === "event") &&
    typeof value.expose === "boolean"
  );
}

function normalizeDescriptor(value) {
  const shared = {
    channel: value.channel,
    kind: value.kind,
    expose: value.expose,
    errors: normalizeErrors(value.errors),
    ...transportField(value.transport),
  };
  if (value.kind === "event") {
    return { ...shared, payload: cloneSchema(value.payload) };
  }
  if (typeof value.idempotent !== "boolean") {
    throw new Error("ipc idempotent");
  }
  return {
    ...shared,
    idempotent: value.idempotent,
    request: value.request === undefined ? null : cloneSchema(value.request),
    response: cloneSchema(value.response),
  };
}

function transportField(transport) {
  if (transport === undefined) {
    return {};
  }
  return { transport };
}

function normalizeErrors(errors) {
  if (!Array.isArray(errors)) {
    throw new Error("ipc errors");
  }
  return errors.map(normalizeError);
}

function normalizeError(error) {
  if (
    error === null ||
    typeof error !== "object" ||
    typeof error.code !== "string" ||
    typeof error.retryable !== "boolean"
  ) {
    throw new Error("ipc error");
  }
  return {
    code: error.code,
    retryable: error.retryable,
    detail: error.detail === undefined ? null : cloneSchema(error.detail),
  };
}

function cloneSchema(schema) {
  if (schema === null || typeof schema !== "object") {
    throw new Error("ipc schema");
  }
  return JSON.parse(JSON.stringify(schema));
}

function byChannelName(left, right) {
  return left.channel.localeCompare(right.channel);
}
