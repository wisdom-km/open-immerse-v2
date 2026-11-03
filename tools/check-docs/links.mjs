import { statSync } from "node:fs";
import path from "node:path";

import { headingSlugs, withoutCode } from "./slug.mjs";

function isExternal(dest) {
  return /^(https?:|mailto:)/i.test(dest);
}

function readDestination(text, openParen) {
  let depth = 1;
  let i = openParen + 1;
  if (text[openParen + 1] === "<") {
    const close = text.indexOf(">", openParen + 2);
    const end = close < 0 ? -1 : text.indexOf(")", close + 1);
    if (end < 0) {
      return null;
    }
    return { dest: text.slice(openParen + 2, close).trim(), next: end + 1 };
  }
  while (i < text.length && depth > 0) {
    if (text[i] === "(") {
      depth += 1;
    } else if (text[i] === ")") {
      depth -= 1;
    }
    if (depth > 0) {
      i += 1;
    }
  }
  if (depth !== 0) {
    return null;
  }
  let raw = text.slice(openParen + 1, i).trim();
  const title = raw.search(/\s+["']/);
  if (title >= 0) {
    raw = raw.slice(0, title).trim();
  }
  return { dest: raw, next: i + 1 };
}

export function linkDestinations(text) {
  const found = [];
  let i = 0;
  while (i < text.length) {
    const at = text.indexOf("](", i);
    if (at < 0) {
      break;
    }
    const read = readDestination(text, at + 1);
    if (!read) {
      break;
    }
    if (read.dest && !read.dest.includes("\n")) {
      found.push(read.dest);
    }
    i = read.next;
  }
  return found;
}

function decodePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveRel(fromFile, rawPath) {
  const decoded = decodePart(rawPath);
  if (decoded.startsWith("/") || path.posix.isAbsolute(decoded)) {
    return null;
  }
  const joined = path.posix.normalize(
    path.posix.join(path.posix.dirname(fromFile), decoded),
  );
  if (joined.startsWith("../") || joined === "..") {
    return null;
  }
  return joined;
}

function isFile(root, rel) {
  try {
    return statSync(path.join(root, rel)).isFile();
  } catch {
    return false;
  }
}

function slugsOf(file, readText, cache) {
  const hit = cache.get(file);
  if (hit) {
    return hit;
  }
  const slugs = new Set(headingSlugs(readText(file)));
  cache.set(file, slugs);
  return slugs;
}

function decodeFrag(frag) {
  return decodePart(frag).toLowerCase();
}

function missingAnchor(ctx) {
  const slugs = slugsOf(ctx.target, ctx.readText, ctx.cache);
  if (slugs.has(decodeFrag(ctx.frag))) {
    return null;
  }
  return { kind: "missing-anchor", file: ctx.source, detail: ctx.dest };
}

function inspectLink(ctx, dest) {
  if (isExternal(dest)) {
    return null;
  }
  const hash = dest.indexOf("#");
  const pathPart = hash === -1 ? dest : dest.slice(0, hash);
  const frag = hash === -1 ? "" : dest.slice(hash + 1);
  if (pathPart === "") {
    return missingAnchor({ ...ctx, target: ctx.source, frag, dest });
  }
  const rel = resolveRel(ctx.source, pathPart);
  if (rel == null || !isFile(ctx.root, rel)) {
    return { kind: "missing-file", file: ctx.source, detail: dest };
  }
  if (frag === "" || !rel.endsWith(".md")) {
    return null;
  }
  return missingAnchor({ ...ctx, target: rel, frag, dest });
}

function collectFile(file, ctx, out) {
  const text = withoutCode(ctx.readText(file));
  for (const dest of linkDestinations(text)) {
    const found = inspectLink({ ...ctx, source: file }, dest);
    if (found) {
      out.push(found);
    }
  }
}

export function linkFindings(files, root, readText) {
  const cache = new Map();
  const out = [];
  for (const file of files) {
    collectFile(file, { root, readText, cache }, out);
  }
  return out;
}
