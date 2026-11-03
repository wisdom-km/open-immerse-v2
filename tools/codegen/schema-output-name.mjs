import path from "node:path";

// Drive letters compare equal in either case. A shared prefix of only the
// root joins to "" on POSIX and to "C:" on Windows; path.parse().root is the
// base path.relative accepts.
export function commonDirectory(sourcePaths, pathImpl = path) {
  const resolved = sourcePaths.map((source) => canonical(source, pathImpl));
  const directories = resolved.map((source) =>
    pathImpl.dirname(source).split(pathImpl.sep),
  );
  const shortest = directories.reduce((left, right) =>
    left.length <= right.length ? left : right,
  );
  const count = sharedPrefix(directories, shortest);
  if (count === 0 || resolved[0] === undefined) {
    throw new Error("schema output outside root");
  }
  const joined = shortest.slice(0, count).join(pathImpl.sep);
  return directoryAt(joined, resolved[0], pathImpl);
}

function canonical(filePath, pathImpl) {
  const resolved = pathImpl.resolve(filePath);
  if (pathImpl.sep !== "\\") {
    return resolved;
  }
  return resolved.replace(
    /^([A-Za-z]):/,
    (_match, letter) => `${letter.toUpperCase()}:`,
  );
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

function directoryAt(joined, sample, pathImpl) {
  const root = pathImpl.parse(sample).root;
  if (joined === "" || sameText(joined, bareRoot(root))) {
    return root;
  }
  return joined;
}

function bareRoot(root) {
  if (root.length > 1 && (root.endsWith("\\") || root.endsWith("/"))) {
    return root.slice(0, -1);
  }
  return root;
}

function sameText(left, right) {
  return left.toLowerCase() === right.toLowerCase();
}

export function relativeOutput(root, sourcePath, pathImpl = path) {
  const rel = pathImpl.relative(
    root === "" ? root : canonical(root, pathImpl),
    canonical(sourcePath, pathImpl),
  );
  const segments = rel.split(pathImpl.sep);
  if (rel === "" || pathImpl.isAbsolute(rel) || segments.includes("..")) {
    throw new Error(`schema output outside root: ${sourcePath}`);
  }
  const parsed = pathImpl.parse(rel);
  return pathImpl.join(parsed.dir, `${parsed.name}.codegen.mjs`);
}

export function claimOutput(sourcePath, outputPath, claimed) {
  const previous = claimed.get(outputPath);
  if (previous !== undefined && previous !== sourcePath) {
    throw new Error(`schema output collision: ${outputPath}`);
  }
  claimed.set(outputPath, sourcePath);
  return outputPath;
}
