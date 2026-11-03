import { appendFileSync, mkdirSync, utimesSync } from "node:fs";
import path from "node:path";

import type { DiagEvent } from "@oi/contracts";
import {
  DEBUG_MODE_DEFAULT,
  type Clock,
  type DebugModeChange,
  type Logger,
} from "@oi/kernel";

import {
  clearDebugDirectory,
  enforceDebugRetention,
} from "./debug-retention.js";
import {
  diagnosticFileName,
  logDirectories,
  type LogDirectories,
} from "./log-paths.js";
import { guardDiagRecord } from "./value-guard.js";

export type FileLoggerOptions = {
  readonly appDataDirectory: string;
  readonly clock: Clock;
};

export function createFileLogger(
  options: FileLoggerOptions,
): Logger<DiagEvent> {
  const directories = logDirectories(options.appDataDirectory);
  const clock = options.clock;
  let debugEnabled = DEBUG_MODE_DEFAULT;
  enforceDebugRetention(directories.debug, clock.nowMs());
  return {
    log(record) {
      writeRecord(directories, clock, debugEnabled, record);
    },
    setDebugMode(change) {
      debugEnabled = change.enabled;
      applyDebugMode(directories.debug, clock, change);
    },
    clearDebugLogs() {
      clearDebugDirectory(directories.debug);
    },
  };
}

function writeRecord(
  directories: LogDirectories,
  clock: Clock,
  debugEnabled: boolean,
  record: DiagEvent,
): void {
  const guarded = guardDiagRecord(record);
  if (guarded === undefined) {
    return;
  }
  const nowMs = clock.nowMs();
  const line = `${JSON.stringify(guarded)}\n`;
  appendJsonLine(directories.diagnostics, nowMs, line);
  if (!debugEnabled) {
    return;
  }
  appendJsonLine(directories.debug, nowMs, line);
  enforceDebugRetention(directories.debug, nowMs);
}

function applyDebugMode(
  debugDirectory: string,
  clock: Clock,
  change: DebugModeChange,
): void {
  if (change.enabled) {
    enforceDebugRetention(debugDirectory, clock.nowMs());
    return;
  }
  if (change.deleteFiles) {
    clearDebugDirectory(debugDirectory);
  }
}

function appendJsonLine(directory: string, nowMs: number, line: string): void {
  mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, diagnosticFileName(nowMs));
  appendFileSync(filePath, line, "utf8");
  const seconds = nowMs / 1000;
  utimesSync(filePath, seconds, seconds);
}
