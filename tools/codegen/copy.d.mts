export function copyGenerators(
  root: string,
  generators: ReadonlyArray<{
    readonly input: string;
    readonly output: string;
  }>,
): Promise<void>;
