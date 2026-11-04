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

export interface PathApi {
  dirname(path: string): string;
  join(...parts: string[]): string;
  resolve(...parts: string[]): string;
}

export type SpawnFn = (
  command: string,
  args: readonly string[],
  options?: SpawnOptions,
) => CommandResult;

export function spawnCommand(input: {
  readonly command: string;
  readonly args: readonly string[];
  readonly execPath?: string;
  readonly pathApi?: PathApi;
  readonly exists?: (candidate: string) => boolean;
  readonly spawn?: SpawnFn;
  readonly options?: SpawnOptions;
}): CommandResult;
