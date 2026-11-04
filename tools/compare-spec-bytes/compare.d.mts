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

export function linkDestSpans(text: string): Array<{
  destStart: number;
  destEnd: number;
  dest: string;
  next: number;
}>;

export function prefixChange(
  oldDest: string,
  newDest: string,
): { kind: "same" | "blocked" | "rewrite"; old?: string; new?: string };

export function restoredRewrites(
  actual: string,
  expected: string,
): {
  ok: boolean;
  at?: number;
  rewrites: Array<{ index: number; old: string; new: string }>;
};
