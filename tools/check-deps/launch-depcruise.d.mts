export interface DepcruiseSpawnResult {
  readonly status: number | null;
  readonly stdout?: string;
  readonly stderr?: string;
  readonly error?: Error;
}

export interface DepcruiseSpawnOptions {
  readonly encoding: "utf8";
}

export type DepcruiseSpawn = (
  command: string,
  args: readonly string[],
  options: DepcruiseSpawnOptions,
) => DepcruiseSpawnResult;

export function launchDepcruise(
  spawn: DepcruiseSpawn,
  args: readonly string[],
): DepcruiseSpawnResult;
