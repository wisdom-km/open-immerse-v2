import { readDiagEvent, type DiagEvent } from "@oi/contracts";

/** 落盘占位。测试引用这一处，不另写字面量。 */
export const REDACTED = "[redacted]";

const tokenPattern = /^[a-z0-9_.:-]*$/u;
const idPattern = /^[A-Za-z0-9_.:-]+$/u;
const timestampPattern = /^[0-9TZ:.+-]+$/u;

export function guardDiagRecord(value: unknown): DiagEvent | undefined {
  const read = readDiagEvent(value);
  if (!read.ok) {
    return undefined;
  }
  return scrubEvent(read.value);
}

function scrubEvent(event: DiagEvent): DiagEvent {
  switch (event.event) {
    case "pipeline.run":
      return scrubPipeline(event);
    case "upstream.server_error":
      return scrubUpstream(event);
    case "ipc.oversize":
      return scrubOversize(event);
    case "egress.ask":
    case "budget.refused":
    case "scoring.unavailable":
      return scrubNamed(event);
    default: {
      const unreachable: never = event;
      return unreachable;
    }
  }
}

function scrubPipeline(event: Extract<DiagEvent, { event: "pipeline.run" }>): DiagEvent {
  const scrubbed = {
    ...envelope(event),
    event: "pipeline.run" as const,
    run_id: scrubId(event.run_id),
    route: scrubToken(event.route),
    step: scrubToken(event.step),
    status: scrubToken(event.status),
    error_class: scrubToken(event.error_class),
    duration_ms: event.duration_ms,
  };
  if (event.requestId === undefined) {
    return scrubbed;
  }
  return { ...scrubbed, requestId: scrubId(event.requestId) };
}

function scrubUpstream(event: Extract<DiagEvent, { event: "upstream.server_error" }>): DiagEvent {
  return {
    ...envelope(event),
    event: "upstream.server_error",
    requestId: scrubId(event.requestId),
  };
}

function scrubOversize(event: Extract<DiagEvent, { event: "ipc.oversize" }>): DiagEvent {
  const scrubbed = {
    ...envelope(event),
    event: "ipc.oversize" as const,
    channel: scrubToken(event.channel),
    bytes: event.bytes,
  };
  if (event.requestId === undefined) {
    return scrubbed;
  }
  return { ...scrubbed, requestId: scrubId(event.requestId) };
}

function scrubNamed(
  event: Extract<DiagEvent, { event: "egress.ask" | "budget.refused" | "scoring.unavailable" }>,
): DiagEvent {
  const scrubbed = { ...envelope(event), event: event.event };
  if (event.requestId === undefined) {
    return scrubbed;
  }
  return { ...scrubbed, requestId: scrubId(event.requestId) };
}

function envelope(event: DiagEvent): { ts: string; level: string; feature: string } {
  return {
    ts: scrubTimestamp(event.ts),
    level: scrubToken(event.level),
    feature: scrubToken(event.feature),
  };
}

function scrubToken(value: string): string {
  if (containsSecret(value) || value.length > 64 || !tokenPattern.test(value)) {
    return REDACTED;
  }
  return value;
}

function scrubId(value: string): string {
  if (containsSecret(value) || value.length > 128 || !idPattern.test(value)) {
    return REDACTED;
  }
  return value;
}

function scrubTimestamp(value: string): string {
  if (containsSecret(value) || value.length > 64 || !timestampPattern.test(value)) {
    return REDACTED;
  }
  return value;
}

function containsSecret(value: string): boolean {
  const lower = value.toLowerCase();
  if (
    lower.includes("authorization") ||
    lower.includes("bearer") ||
    lower.includes("sk-") ||
    lower.includes("oitest_")
  ) {
    return true;
  }
  return isAbsolutePath(value) || containsQuerySecret(value);
}

function containsQuerySecret(value: string): boolean {
  return (
    value.includes("access_token=") ||
    value.includes("client_id=") ||
    value.includes("client_secret=") ||
    value.includes("key=")
  );
}

function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || value.includes("\\") || /^[A-Za-z]:[\\/]/u.test(value);
}
