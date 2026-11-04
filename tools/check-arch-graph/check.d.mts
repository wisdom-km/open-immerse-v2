import type { DepcruiseSpawn } from "../check-deps/launch-depcruise.mjs";

export interface CheckIo {
  readonly spawn: DepcruiseSpawn;
  readonly stdout: { write(text: string): void };
  readonly stderr: { write(text: string): void };
  readonly cwd: string;
  readonly readFile: (file: string) => string;
  readonly exists: (file: string) => boolean;
}

export function run(argv: readonly string[], io: CheckIo): number;
