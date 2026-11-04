import { Buffer } from "node:buffer";

import type { DiagEvent } from "@oi/contracts";

import { guardDiagRecord } from "./value-guard.js";

/** ARCHITECTURE §11。按去掉一个行尾之后的 UTF-8 字节计。 */
export const WORKER_STDERR_MAX_BYTES = 8192;

export type WorkerStderrEvent = DiagEvent & { readonly source: "worker" };

/** 读入一行 worker stderr。失败、超长或非白名单时返回 undefined，不保留原文。 */
export function readWorkerStderrLine(
  line: string,
): WorkerStderrEvent | undefined {
  const payload = stripOneLineEnding(line);
  if (Buffer.byteLength(payload, "utf8") > WORKER_STDERR_MAX_BYTES) {
    return undefined;
  }
  const record = parseRecord(payload);
  if (record === undefined) {
    return undefined;
  }
  const guarded = guardDiagRecord(record);
  if (guarded === undefined) {
    return undefined;
  }
  return { ...guarded, source: "worker" };
}

function stripOneLineEnding(line: string): string {
  if (line.endsWith("\r\n")) {
    return line.slice(0, -2);
  }
  if (line.endsWith("\n")) {
    return line.slice(0, -1);
  }
  return line;
}

function parseRecord(payload: string): Record<string, unknown> | undefined {
  const value = parseJson(payload);
  if (!isRecord(value)) {
    return undefined;
  }
  return value;
}

function parseJson(payload: string): unknown {
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
