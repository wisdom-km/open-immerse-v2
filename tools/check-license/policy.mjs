import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));

function readIds(name) {
  const parsed = JSON.parse(readFileSync(path.join(directory, name), "utf8"));
  return new Set(parsed.ids);
}

const whitelist = readIds("whitelist.json");
const unlistedPermissive = readIds("unlisted-permissive.json");
const devOnly = JSON.parse(readFileSync(path.join(directory, "dev-only.json"), "utf8"));
const devOnlyIds = new Set(devOnly.ids);
const devOnlyPackages = new Set(devOnly.packages);
const aliases = JSON.parse(
  readFileSync(path.join(directory, "package-aliases.json"), "utf8"),
).aliases;

const deniedFamily = /^(LGPL|AGPL|GPL)([-.]|$)/i;

function preprocess(raw) {
  return raw
    .replace(/\bMIT License\b/g, "MIT")
    .replace(/\bApache License 2\.0\b/g, "Apache-2.0")
    .replace(/\bApache Software License\b/g, "Apache-2.0")
    .trim();
}

function tokenize(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    if (character === " " || character === "\t") {
      index += 1;
      continue;
    }
    if (character === "(" || character === ")") {
      tokens.push(character);
      index += 1;
      continue;
    }
    const word = /^[A-Za-z0-9.+-]+/.exec(source.slice(index));
    if (!word) {
      throw new Error(`bad license token at ${source.slice(index, index + 12)}`);
    }
    tokens.push(word[0]);
    index += word[0].length;
  }
  return tokens;
}

function idAllowed(id, packageName) {
  if (deniedFamily.test(id)) {
    return false;
  }
  if (whitelist.has(id) || unlistedPermissive.has(id)) {
    return true;
  }
  return devOnlyIds.has(id) && devOnlyPackages.has(packageName);
}

function parsePrimary(tokens, position) {
  const token = tokens[position];
  if (token === "(") {
    const [node, next] = parseOr(tokens, position + 1);
    if (tokens[next] !== ")") {
      throw new Error("unclosed license expression");
    }
    return [node, next + 1];
  }
  if (!token || token === ")" || /^(OR|AND|WITH)$/i.test(token)) {
    throw new Error("license id missing");
  }
  if (tokens[position + 1] && tokens[position + 1].toUpperCase() === "WITH") {
    return [{ op: "WITH" }, position + 3];
  }
  return [{ op: "ID", id: token }, position + 1];
}

function parseAnd(tokens, position) {
  let [left, next] = parsePrimary(tokens, position);
  while (tokens[next] && tokens[next].toUpperCase() === "AND") {
    const [right, after] = parsePrimary(tokens, next + 1);
    left = { op: "AND", left, right };
    next = after;
  }
  return [left, next];
}

function parseOr(tokens, position) {
  let [left, next] = parseAnd(tokens, position);
  while (tokens[next] && tokens[next].toUpperCase() === "OR") {
    const [right, after] = parseAnd(tokens, next + 1);
    left = { op: "OR", left, right };
    next = after;
  }
  return [left, next];
}

function evaluateNode(node, packageName) {
  if (node.op === "OR") {
    return evaluateNode(node.left, packageName) || evaluateNode(node.right, packageName);
  }
  if (node.op === "AND") {
    return evaluateNode(node.left, packageName) && evaluateNode(node.right, packageName);
  }
  if (node.op === "WITH") {
    return false;
  }
  return idAllowed(node.id, packageName);
}

export function expressionAllowed(raw, packageName) {
  const source = preprocess(raw);
  if (source.length === 0) {
    return false;
  }
  const tokens = tokenize(source);
  const [node, next] = parseOr(tokens, 0);
  if (next !== tokens.length) {
    return false;
  }
  return evaluateNode(node, packageName);
}

export function reportedLicense(packageName, reported) {
  const alias = aliases.find(
    (item) => item.name === packageName && item.reported === reported,
  );
  return alias ? alias.spdx : reported;
}

export function licenseAllowed(packageName, reported) {
  try {
    return expressionAllowed(reportedLicense(packageName, reported), packageName);
  } catch {
    return false;
  }
}
