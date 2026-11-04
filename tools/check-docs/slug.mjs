function fenceMark(line) {
  const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) {
    return null;
  }
  return { char: match[2][0], size: match[2].length, info: match[3] };
}

export function stripFences(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let open = null;
  for (const line of lines) {
    const mark = fenceMark(line);
    if (open) {
      const closes =
        mark &&
        mark.char === open.char &&
        mark.size >= open.size &&
        mark.info.trim() === "";
      if (closes) {
        open = null;
      }
      out.push("");
      continue;
    }
    if (mark) {
      open = mark;
      out.push("");
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

export function withoutCode(text) {
  return stripFences(text).replace(/`+[^`\n]*`+/g, "");
}

function plainHeading(text) {
  const linked = text.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1");
  return linked.replace(/`+/g, "").replace(/[*~]+/g, "");
}

export function slugify(text) {
  const cleaned = plainHeading(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "");
  return cleaned.replace(/ /g, "-");
}

function headingText(line) {
  const match = /^ {0,3}#{1,6}[ \t]+(.*)$/.exec(line);
  if (!match || match[1] === undefined) {
    return null;
  }
  return match[1].replace(/[ \t]+#+\s*$/, "").trim();
}

export function headingSlugs(text) {
  const counts = new Map();
  const slugs = [];
  for (const line of stripFences(text).split(/\r?\n/)) {
    const body = headingText(line);
    if (body === null) {
      continue;
    }
    const base = slugify(body);
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    slugs.push(seen === 0 ? base : `${base}-${seen}`);
  }
  return slugs;
}
