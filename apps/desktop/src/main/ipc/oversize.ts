import { Buffer } from "node:buffer";

export const IPC_OVERSIZE_BYTES = 1024 * 1024;

export function utf8Bytes(value: unknown): number | undefined {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return undefined;
  }
}

export function exceedsIpcBudget(bytes: number): boolean {
  return bytes > IPC_OVERSIZE_BYTES;
}
