import type { IpcJsonSchema } from "./registry.generated.js";

export function payloadMatches(
  schema: IpcJsonSchema | null,
  payload: unknown,
): boolean {
  if (schema === null) {
    return payload === undefined;
  }
  return matchesSchema(schema, payload);
}

function matchesSchema(schema: IpcJsonSchema, payload: unknown): boolean {
  if (schema.anyOf !== undefined) {
    return schema.anyOf.some((item) => matchesSchema(item, payload));
  }
  if (!constMatches(schema, payload)) {
    return false;
  }
  if (schema.type === undefined) {
    return Object.hasOwn(schema, "const");
  }
  return typeMatches(schema, payload);
}

function constMatches(schema: IpcJsonSchema, payload: unknown): boolean {
  if (!Object.hasOwn(schema, "const")) {
    return true;
  }
  return schema.const === payload;
}

function typeMatches(schema: IpcJsonSchema, payload: unknown): boolean {
  switch (schema.type) {
    case "object":
      return objectMatches(schema, payload);
    case "array":
      return arrayMatches(schema, payload);
    case "string":
      return stringMatches(schema, payload);
    case "boolean":
      return typeof payload === "boolean";
    case "number":
      return typeof payload === "number" && Number.isFinite(payload);
    case "integer":
      return typeof payload === "number" && Number.isInteger(payload);
    case "null":
      return payload === null;
    default:
      return false;
  }
}

function objectMatches(schema: IpcJsonSchema, payload: unknown): boolean {
  if (!isRecord(payload)) {
    return false;
  }
  return (
    requiredPresent(schema, payload) &&
    propertiesMatch(schema, payload) &&
    extrasAllowed(schema, payload)
  );
}

function requiredPresent(
  schema: IpcJsonSchema,
  payload: Record<string, unknown>,
): boolean {
  for (const key of schema.required ?? []) {
    if (!Object.hasOwn(payload, key)) {
      return false;
    }
  }
  return true;
}

function propertiesMatch(
  schema: IpcJsonSchema,
  payload: Record<string, unknown>,
): boolean {
  const properties = schema.properties ?? {};
  for (const key of Object.keys(properties)) {
    const child = properties[key];
    if (
      child !== undefined &&
      Object.hasOwn(payload, key) &&
      !matchesSchema(child, payload[key])
    ) {
      return false;
    }
  }
  return true;
}

function extrasAllowed(
  schema: IpcJsonSchema,
  payload: Record<string, unknown>,
): boolean {
  if (schema.additionalProperties !== false) {
    return true;
  }
  const known = new Set(Object.keys(schema.properties ?? {}));
  return Object.keys(payload).every((key) => known.has(key));
}

function stringMatches(schema: IpcJsonSchema, payload: unknown): boolean {
  if (typeof payload !== "string") {
    return false;
  }
  if (schema.minLength !== undefined && payload.length < schema.minLength) {
    return false;
  }
  if (
    schema.pattern !== undefined &&
    !new RegExp(schema.pattern).test(payload)
  ) {
    return false;
  }
  return true;
}

function arrayMatches(schema: IpcJsonSchema, payload: unknown): boolean {
  const items = schema.items;
  if (!Array.isArray(payload) || items === undefined) {
    return false;
  }
  return payload.every((item) => matchesSchema(items, item));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
