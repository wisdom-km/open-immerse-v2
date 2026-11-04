export function headingSlug(text: string, used: ReadonlySet<string>): string {
  const base = slugOf(text);
  if (!used.has(base)) {
    return base;
  }
  return nextFree(base, used);
}

function slugOf(text: string): string {
  const dashed = text.trim().toLowerCase().replace(/\s+/g, "-");
  const cleaned = dashed.replace(/[^\p{L}\p{N}-]+/gu, "");
  const trimmed = cleaned.replace(/^-+|-+$/g, "");
  if (trimmed.length === 0) {
    return "section";
  }
  return trimmed;
}

function nextFree(base: string, used: ReadonlySet<string>): string {
  let suffix = 2;
  let candidate = base + "-" + String(suffix);
  while (used.has(candidate)) {
    suffix += 1;
    candidate = base + "-" + String(suffix);
  }
  return candidate;
}
