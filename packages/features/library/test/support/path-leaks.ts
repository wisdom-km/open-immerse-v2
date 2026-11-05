const PATH_KEY = /path|directory|folder/i;
const ABSOLUTE = /^(?:[A-Za-z]:[\\/]|\/)|file:\/\//;

export function pathLeaks(value: unknown, banned: readonly string[]): string[] {
  const leaks: string[] = [];
  walk(value, banned, leaks, new Set());
  return leaks;
}

function walk(
  value: unknown,
  banned: readonly string[],
  leaks: string[],
  seen: Set<object>,
): void {
  if (typeof value === "string") {
    collectString(value, banned, leaks);
    return;
  }
  if (typeof value !== "object" || value === null || seen.has(value)) {
    return;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, banned, leaks, seen);
    }
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (PATH_KEY.test(key)) {
      leaks.push(key);
    }
    walk(item, banned, leaks, seen);
  }
}

function collectString(
  value: string,
  banned: readonly string[],
  leaks: string[],
): void {
  if (ABSOLUTE.test(value)) {
    leaks.push(value);
  }
  for (const item of banned) {
    if (item.length > 0 && value.includes(item)) {
      leaks.push(value);
    }
  }
}
