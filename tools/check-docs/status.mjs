const statusLine = /^(?:>\s*)?状态：|^日期：.+。状态：/;
const tokens = new Set(["现行", "报告", "历史草案", "生成"]);

export function inStatusScope(file) {
  return (
    file.startsWith("docs/") &&
    file.endsWith(".md") &&
    !file.startsWith("docs/evidence/") &&
    !file.startsWith("docs/exec-plans/")
  );
}

function cells(line) {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) {
    return null;
  }
  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparator(line) {
  const row = cells(line);
  if (!row || row.length < 2) {
    return false;
  }
  return row.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function cleanPath(cell) {
  const linked = /\]\(([^)]+)\)/.exec(cell);
  const raw = (linked?.[1] ?? cell).replace(/`/g, "").trim();
  try {
    return decodeURIComponent(raw).replace(/^\.\//, "");
  } catch {
    return raw.replace(/^\.\//, "");
  }
}

function readRows(lines, start, pathAt, statusAt) {
  const rows = [];
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!line.trim().startsWith("|")) {
      break;
    }
    const row = cells(line);
    if (!row) {
      break;
    }
    rows.push({
      path: cleanPath(row[pathAt] ?? ""),
      status: (row[statusAt] ?? "").replace(/`/g, "").trim(),
    });
  }
  return rows;
}

function indexRows(text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i += 1) {
    const headerLine = lines[i] ?? "";
    const header = cells(headerLine);
    if (!headerLine.trim().startsWith("|") || !header) {
      continue;
    }
    if (!isSeparator(lines[i + 1] ?? "")) {
      continue;
    }
    const pathAt = header.findIndex((cell) => cell.includes("路径"));
    const statusAt = header.findIndex((cell) => cell.includes("状态"));
    if (pathAt < 0 || statusAt < 0) {
      continue;
    }
    return readRows(lines, i + 2, pathAt, statusAt);
  }
  return null;
}

function ownStatus(text) {
  const lines = text.split(/\r?\n/).slice(0, 40);
  return lines.find((line) => statusLine.test(line)) ?? "";
}

function pushIndexed(out, file, line, row) {
  if (!row) {
    out.push({ kind: "not-in-index", file, detail: "索引没有这一行" });
    return;
  }
  if (!line) {
    return;
  }
  if (!tokens.has(row.status) || !line.includes(row.status)) {
    out.push({ kind: "status-mismatch", file, detail: row.status || "空" });
  }
}

function pushFile(out, file, line, table) {
  if (!line) {
    out.push({
      kind: "status-line-missing",
      file,
      detail: "前 40 行没有状态行",
    });
  }
  if (!table || file === "docs/README.md") {
    return;
  }
  pushIndexed(
    out,
    file,
    line,
    table.find((item) => item.path === file),
  );
}

export function statusFindings(files, readText) {
  const scoped = files.filter(inStatusScope).sort();
  if (scoped.length === 0) {
    return [];
  }
  const table = scoped.includes("docs/README.md")
    ? indexRows(readText("docs/README.md"))
    : null;
  const out = [];
  if (!table) {
    out.push({
      kind: "index-table-missing",
      file: "docs/README.md",
      detail: "索引表缺少路径与状态列",
    });
  }
  for (const file of scoped) {
    pushFile(out, file, ownStatus(readText(file)), table);
  }
  return out;
}
