export type IpcPassThrough =
  | { readonly ok: true; readonly value: unknown }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: string;
        readonly retryable: boolean;
      };
    };

export function isPassThrough(value: unknown): value is IpcPassThrough {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }
  if (value.ok) {
    return Object.hasOwn(value, "value");
  }
  return isErrorBody(value.error);
}

function isErrorBody(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.code === "string" && typeof value.retryable === "boolean";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
