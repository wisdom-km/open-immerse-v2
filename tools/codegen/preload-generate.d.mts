export function generatePreloadSet(
  root: string,
  generator: {
    readonly input: string;
    readonly outputs: readonly string[];
  },
): Promise<void>;
