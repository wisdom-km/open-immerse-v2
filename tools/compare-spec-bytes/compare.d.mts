import { Buffer } from "node:buffer";

export function stripSplitHeader(
  bytes: Buffer,
  startMark: string,
  endMark: string,
): Buffer;

export function joinParts(
  parts: readonly Buffer[],
  startMark: string,
  endMark: string,
): Buffer;

export function firstMismatch(actual: Buffer, expected: Buffer): number;
