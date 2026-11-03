import path from "node:path";

import { DEBUG_LOG_DIRECTORY, PRODUCT_LOG_DIRECTORY } from "@oi/kernel";

export type LogDirectories = {
  readonly diagnostics: string;
  readonly debug: string;
};

export function logDirectories(appDataDirectory: string): LogDirectories {
  return {
    diagnostics: path.join(appDataDirectory, PRODUCT_LOG_DIRECTORY),
    debug: path.join(appDataDirectory, DEBUG_LOG_DIRECTORY),
  };
}

export function diagnosticFileName(nowMs: number): string {
  return `${new Date(nowMs).toISOString().slice(0, 10)}.jsonl`;
}
