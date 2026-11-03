import { readDiagEvent, type DiagEvent } from "@oi/contracts";

/** 落盘占位。测试引用这一处，不另写字面量。 */
export const REDACTED = "[redacted]";

const tokenPattern = /^[a-z0-9_.:-]*$/u;
const idPattern = /^[A-Za-z0-9_.:-]+$/u;
const timestampPattern = /^[0-9TZ:.+-]+$/u;
const uuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/u;
/** ARCHITECTURE §9。整串合上后不再查熵；密钥识别仍在这之前。 */
const channelPattern =
  /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(on[A-Z][A-Za-z0-9]*|[a-z][A-Za-z0-9]*)$/u;
const githubPrefixes = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_", "github_pat_"] as const;
const awsAccessKeyPattern = /(?:AKIA|ASIA)[A-Za-z0-9]{16}/u;
const longHexPattern = /[0-9a-fA-F]{40,}/u;
/** 短于这个长度不查熵。`api-key-missing` 长 15。 */
const entropyMinLength = 20;
/** 每字符香农熵。均匀 UUID 约 4.06，靠形式豁免，不靠把阈值抬过它。 */
const entropyMinBits = 4;

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
    channel: scrubChannel(event.channel),
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

function scrubChannel(value: string): string {
  if (hasHardSecret(value) || value.length > 64 || !channelPattern.test(value)) {
    return REDACTED;
  }
  return value;
}

function containsSecret(value: string): boolean {
  return hasHardSecret(value) || isHighEntropy(value);
}

function hasHardSecret(value: string): boolean {
  return (
    containsMarker(value) ||
    containsProviderToken(value) ||
    isAbsolutePath(value) ||
    containsQuerySecret(value)
  );
}

function containsMarker(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("authorization") ||
    lower.includes("bearer") ||
    lower.includes("sk-") ||
    lower.includes("oitest_")
  );
}

function containsProviderToken(value: string): boolean {
  const lower = value.toLowerCase();
  for (const prefix of githubPrefixes) {
    if (lower.includes(prefix)) {
      return true;
    }
  }
  return awsAccessKeyPattern.test(value) || longHexPattern.test(value);
}

function isHighEntropy(value: string): boolean {
  if (value.length < entropyMinLength) {
    return false;
  }
  if (uuidPattern.test(value) || timestampPattern.test(value)) {
    return false;
  }
  return shannonBits(value) >= entropyMinBits;
}

function shannonBits(value: string): number {
  const counts = new Map<string, number>();
  for (const char of value) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let bits = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    bits -= probability * Math.log2(probability);
  }
  return bits;
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
