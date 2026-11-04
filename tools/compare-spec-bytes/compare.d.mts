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

export function sliceOnce(
  bytes: Buffer,
  startText: string,
  endText: string,
): Buffer;

export function markedBody(
  bytes: Buffer,
  startMark: string,
  endMark: string,
  bodyEnd: string,
): Buffer;
