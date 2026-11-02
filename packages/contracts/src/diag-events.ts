import type { Logger, Result } from "@oi/kernel";

/** ARCHITECTURE §11：只拷白名单字段，其余键丢弃。未列入的 event 拒绝。 */
export const DIAG_EVENT_IDS = [
  "egress.ask",
  "budget.refused",
  "upstream.server_error",
  "scoring.unavailable",
  "pipeline.run",
  "ipc.oversize",
] as const;

export type DiagEventId = (typeof DIAG_EVENT_IDS)[number];

export const PIPELINE_RUN_FIELDS = [
  "run_id",
  "route",
  "step",
  "status",
  "error_class",
  "duration_ms",
] as const;

export type PipelineRunFields = {
  readonly run_id: string;
  readonly route: string;
  readonly step: string;
  readonly status: string;
  readonly error_class: string;
  readonly duration_ms: number;
};

type Envelope = {
  readonly ts: string;
  readonly level: string;
  readonly feature: string;
};

export type DiagEvent = Envelope &
  (
    | (PipelineRunFields & { readonly event: "pipeline.run"; readonly requestId?: string })
    | { readonly event: "upstream.server_error"; readonly requestId: string }
    | {
        readonly event: "ipc.oversize";
        readonly channel: string;
        readonly bytes: number;
        readonly requestId?: string;
      }
    | {
        readonly event: "egress.ask" | "budget.refused" | "scoring.unavailable";
        readonly requestId?: string;
      }
  );

export type DiagEventRejected = { readonly code: "diag_event_rejected" };

export type DiagLogger = Logger<DiagEvent>;

type TakenString = { readonly present: false } | { readonly present: true; readonly value: string };

export function readDiagEvent(value: unknown): Result<DiagEvent, DiagEventRejected> {
  const record = asRecord(value);
  if (record === undefined) {
    return rejected();
  }
  const event = diagEventId(record.event);
  const envelope = readEnvelope(record);
  if (event === undefined || envelope === undefined) {
    return rejected();
  }
  const built = readEvent(event, envelope, record);
  if (built === undefined) {
    return rejected();
  }
  return { ok: true, value: built };
}

function rejected(): Result<DiagEvent, DiagEventRejected> {
  return { ok: false, error: { code: "diag_event_rejected" } };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function diagEventId(value: unknown): DiagEventId | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  for (const id of DIAG_EVENT_IDS) {
    if (id === value) {
      return id;
    }
  }
  return undefined;
}

function readEnvelope(record: Record<string, unknown>): Envelope | undefined {
  const ts = requiredNonEmpty(record, "ts");
  const level = requiredString(record, "level");
  const feature = requiredString(record, "feature");
  if (ts === undefined || level === undefined || feature === undefined) {
    return undefined;
  }
  return { ts, level, feature };
}

function readEvent(
  event: DiagEventId,
  envelope: Envelope,
  record: Record<string, unknown>,
): DiagEvent | undefined {
  switch (event) {
    case "pipeline.run":
      return readPipeline(envelope, record);
    case "upstream.server_error":
      return readUpstream(envelope, record);
    case "ipc.oversize":
      return readOversize(envelope, record);
    case "egress.ask":
    case "budget.refused":
    case "scoring.unavailable":
      return readNamed(envelope, event, record);
    default: {
      const unreachable: never = event;
      return unreachable;
    }
  }
}

function readPipeline(
  envelope: Envelope,
  record: Record<string, unknown>,
): Extract<DiagEvent, { event: "pipeline.run" }> | undefined {
  const runId = requiredString(record, "run_id");
  const route = requiredString(record, "route");
  const step = requiredString(record, "step");
  const status = requiredString(record, "status");
  const errorClass = requiredString(record, "error_class");
  const duration = requiredDuration(record, "duration_ms");
  const requestId = takeOptionalString(record, "requestId");
  if (
    runId === undefined ||
    route === undefined ||
    step === undefined ||
    status === undefined ||
    errorClass === undefined ||
    duration === undefined ||
    requestId === undefined
  ) {
    return undefined;
  }
  return {
    ...envelope,
    event: "pipeline.run",
    run_id: runId,
    route,
    step,
    status,
    error_class: errorClass,
    duration_ms: duration,
    ...requestIdField(requestId),
  };
}

function readUpstream(
  envelope: Envelope,
  record: Record<string, unknown>,
): Extract<DiagEvent, { event: "upstream.server_error" }> | undefined {
  const requestId = requiredString(record, "requestId");
  if (requestId === undefined) {
    return undefined;
  }
  return { ...envelope, event: "upstream.server_error", requestId };
}

function readOversize(
  envelope: Envelope,
  record: Record<string, unknown>,
): Extract<DiagEvent, { event: "ipc.oversize" }> | undefined {
  const channel = requiredString(record, "channel");
  const bytes = requiredBytes(record, "bytes");
  const requestId = takeOptionalString(record, "requestId");
  if (channel === undefined || bytes === undefined || requestId === undefined) {
    return undefined;
  }
  return { ...envelope, event: "ipc.oversize", channel, bytes, ...requestIdField(requestId) };
}

function readNamed(
  envelope: Envelope,
  event: "egress.ask" | "budget.refused" | "scoring.unavailable",
  record: Record<string, unknown>,
): Extract<DiagEvent, { event: typeof event }> | undefined {
  const requestId = takeOptionalString(record, "requestId");
  if (requestId === undefined) {
    return undefined;
  }
  return { ...envelope, event, ...requestIdField(requestId) };
}

function requiredString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
}

function requiredNonEmpty(record: Record<string, unknown>, key: string): string | undefined {
  const value = requiredString(record, key);
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  return value;
}

function requiredDuration(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value;
}

function requiredBytes(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return undefined;
  }
  return value;
}

function takeOptionalString(record: Record<string, unknown>, key: string): TakenString | undefined {
  if (!Object.hasOwn(record, key)) {
    return { present: false };
  }
  const value = record[key];
  if (typeof value !== "string") {
    return undefined;
  }
  return { present: true, value };
}

function requestIdField(taken: TakenString): { readonly requestId: string } | Record<string, never> {
  if (!taken.present) {
    return {};
  }
  return { requestId: taken.value };
}
