export interface CommandResult {
  readonly status: number | null;
  readonly stdout?: string;
  readonly stderr?: string;
  readonly error?: { readonly code?: string; readonly message?: string };
}

export interface SpawnOptions {
  readonly encoding?: "utf8";
  readonly cwd?: string;
  readonly stdio?: "inherit" | "pipe";
  readonly shell?: boolean;
}

export type SpawnFn = (
  command: string,
  args: readonly string[],
  options?: SpawnOptions,
) => CommandResult;

export function spawnCommand(input: {
  readonly command: string;
  readonly args: readonly string[];
  readonly platform?: string;
  readonly spawn?: SpawnFn;
  readonly options?: SpawnOptions;
}): CommandResult;
