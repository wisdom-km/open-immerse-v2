export function corepackBin(
  execPath: string,
  pathApi?: {
    dirname(path: string): string;
    join(...parts: string[]): string;
    resolve(...parts: string[]): string;
  },
  exists?: (candidate: string) => boolean,
): string | undefined;
