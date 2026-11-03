import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const fixturePrefix = "tools/check-docs/fixtures/";

function gitMarkdown(root) {
  try {
    const out = execFileSync(
      "git",
      ["-C", root, "ls-files", "-z", "--", "*.md"],
      { encoding: "utf8" },
    );
    return out.split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

function walkDir(root, dir, out) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") {
      continue;
    }
    const abs = path.join(dir, name);
    let info;
    try {
      info = statSync(abs);
    } catch {
      continue;
    }
    if (info.isDirectory()) {
      walkDir(root, abs, out);
      continue;
    }
    if (name.endsWith(".md")) {
      out.push(path.relative(root, abs).split(path.sep).join("/"));
    }
  }
}

export function listMarkdown(root, walk) {
  const files = walk ? [] : gitMarkdown(root);
  if (walk) {
    walkDir(root, root, files);
  }
  if (!files) {
    return null;
  }
  return files
    .filter((file) => file.endsWith(".md") && !file.startsWith(fixturePrefix))
    .sort();
}
