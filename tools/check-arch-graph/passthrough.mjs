const featureIndex = /^packages\/features\/[^/]+\/src\/index\.ts$/;
const reexport =
  /^export\s+(?:type\s+)?(?:\*(?:\s+as\s+[A-Za-z_$][\w$]*)?|\{[^{}]*\})\s+from\s+(?:'[^'\n]*'|"[^"\n]*"|`[^`\n]*`)\s*$/;
const emptyExport = /^export\s+(?:type\s+)?\{\s*\}\s*$/;

function norm(ref) {
  return String(ref).replaceAll("\\", "/");
}

function allowedStatement(text) {
  const trimmed = text.trim();
  return trimmed === "" || reexport.test(trimmed) || emptyExport.test(trimmed);
}

function skipComment(source, start, line) {
  if (source[start + 1] === "/") {
    let i = start + 2;
    while (i < source.length && source[i] !== "\n") {
      i += 1;
    }
    return { i, line };
  }
  let i = start + 2;
  let nextLine = line;
  while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
    if (source[i] === "\n") {
      nextLine += 1;
    }
    i += 1;
  }
  return { i: Math.min(source.length, i + 2), line: nextLine };
}

function skipQuoted(source, start, line) {
  const quote = source[start];
  let i = start + 1;
  let nextLine = line;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      if (source[i + 1] === "\n") {
        nextLine += 1;
      }
      i += 2;
      continue;
    }
    i += 1;
    if (ch === "\n") {
      nextLine += 1;
    }
    if (ch === quote) {
      break;
    }
  }
  return { i, line: nextLine };
}

function isQuote(ch) {
  return ch === "'" || ch === '"' || ch === "`";
}

function isGap(ch) {
  return ch === " " || ch === "\t" || ch === "\r" || ch === "\n";
}

function isCommentStart(ch, next) {
  return ch === "/" && (next === "/" || next === "*");
}

function topLevelStatements(source) {
  const out = [];
  let i = 0;
  let line = 1;
  let start = 0;
  let startLine = 1;
  let started = false;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1] ?? "";
    if (isCommentStart(ch, next)) {
      const skipped = skipComment(source, i, line);
      i = skipped.i;
      line = skipped.line;
      if (!started) {
        start = i;
        startLine = line;
      }
      continue;
    }
    if (isQuote(ch)) {
      const skipped = skipQuoted(source, i, line);
      i = skipped.i;
      line = skipped.line;
      started = true;
      continue;
    }
    if (!started && isGap(ch)) {
      if (ch === "\n") {
        line += 1;
      }
      i += 1;
      start = i;
      startLine = line;
      continue;
    }
    if (ch === ";") {
      out.push({ line: startLine, text: source.slice(start, i) });
      i += 1;
      started = false;
      start = i;
      startLine = line;
      continue;
    }
    if (ch === "\n") {
      line += 1;
    }
    started = true;
    i += 1;
  }
  if (started) {
    out.push({ line: startLine, text: source.slice(start) });
  }
  return out;
}

export function isFeatureIndex(ref) {
  return featureIndex.test(norm(ref));
}

export function classifyFeatureIndex(text) {
  const bad = topLevelStatements(String(text)).find(
    (stmt) => !allowedStatement(stmt.text),
  );
  if (bad) {
    return { kind: "impure", line: bad.line };
  }
  return { kind: "passthrough" };
}
