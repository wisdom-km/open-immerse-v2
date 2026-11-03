import type { PlatformPath } from "node:path";

export function commonDirectory(
  sourcePaths: readonly string[],
  pathImpl?: PlatformPath,
): string;

export function relativeOutput(
  root: string,
  sourcePath: string,
  pathImpl?: PlatformPath,
): string;

export function claimOutput(
  sourcePath: string,
  outputPath: string,
  claimed: Map<string, string>,
): string;
