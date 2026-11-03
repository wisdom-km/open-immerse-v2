export function readSpecifiers(
  sourceText: string,
  sourcePath: string,
): readonly string[];

export function applySpecifiers(
  code: string,
  mapped: ReadonlyMap<string, string>,
): string;
