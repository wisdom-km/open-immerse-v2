import path from "node:path";

export function commonDirectory(sourcePaths) {
  const directories = sourcePaths.map((source) =>
    path.dirname(path.resolve(source)).split(path.sep),
  );
  const shortest = directories.reduce((left, right) =>
    left.length <= right.length ? left : right,
  );
  const count = sharedPrefix(directories, shortest);
  if (count === 0) {
    throw new Error("schema output outside root");
  }
  return shortest.slice(0, count).join(path.sep);
}

function sharedPrefix(directories, shortest) {
  let count = 0;
  while (
    count < shortest.length &&
    directories.every((dir) => dir[count] === shortest[count])
  ) {
    count += 1;
  }
  return count;
}

export function relativeOutput(root, sourcePath) {
  const rel = path.relative(root, path.resolve(sourcePath));
  const segments = rel.split(path.sep);
  if (rel === "" || path.isAbsolute(rel) || segments.includes("..")) {
    throw new Error(`schema output outside root: ${sourcePath}`);
  }
  const parsed = path.parse(rel);
  return path.join(parsed.dir, `${parsed.name}.codegen.mjs`);
}

export function claimOutput(sourcePath, outputPath, claimed) {
  const previous = claimed.get(outputPath);
  if (previous !== undefined && previous !== sourcePath) {
    throw new Error(`schema output collision: ${outputPath}`);
  }
  claimed.set(outputPath, sourcePath);
  return outputPath;
}
