import { existsSync } from "node:fs";
import path from "node:path";

const treeDoc = "docs/arch/03.md";
const branch = /[├└]─ /u;

export function treePathFindings(text, rootDir) {
  const body = firstTree(text);
  if (body == null) {
    return [finding("没有目录树代码块")];
  }
  return missingIn(body, rootDir);
}

function finding(detail) {
  return { kind: "tree-path-missing", file: treeDoc, detail };
}

function firstTree(text) {
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let match = re.exec(text);
  while (match) {
    if (match[1].includes("├") || match[1].includes("└")) {
      return match[1];
    }
    match = re.exec(text);
  }
  return null;
}

function missingIn(body, rootDir) {
  const stack = [""];
  const out = [];
  for (const line of body.split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (!parsed) {
      continue;
    }
    const parent = stack[parsed.depth - 1] ?? "";
    if (!parsed.planned) {
      pushMissing(out, parent, parsed.names, rootDir);
    }
    remember(stack, parsed.depth, parent, parsed.names);
  }
  return out;
}

function remember(stack, depth, parent, names) {
  const lastDir = [...names].reverse().find((name) => name.endsWith("/"));
  stack[depth] = parent + (lastDir ?? "");
  stack.length = depth + 1;
}

function pushMissing(out, parent, names, rootDir) {
  for (const name of names) {
    const rel = `${parent}${name}`;
    if (!existsSync(path.join(rootDir, rel))) {
      out.push(finding(rel));
    }
  }
}

function parseLine(line) {
  const at = line.search(branch);
  if (at < 0 || at % 3 !== 0) {
    return null;
  }
  const rest = line.slice(at + 3);
  const hash = rest.indexOf("#");
  const payload = (hash < 0 ? rest : rest.slice(0, hash)).trim();
  const comment = hash < 0 ? "" : rest.slice(hash + 1);
  const names = payload
    .split(/ {2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (names.length === 0) {
    return null;
  }
  return {
    depth: at / 3 + 1,
    names,
    planned: comment.includes("计划中"),
  };
}
