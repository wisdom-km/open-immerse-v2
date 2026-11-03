export function commonDirectory(sourcePaths: readonly string[]): string;

export function relativeOutput(root: string, sourcePath: string): string;

export function claimOutput(
  sourcePath: string,
  outputPath: string,
  claimed: Map<string, string>,
): string;
