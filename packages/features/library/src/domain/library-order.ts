import type {
  LibraryEntry,
  LibrarySort,
  LibrarySortDir,
  LibraryView,
} from "@oi/contracts";

export type LibraryListInput = {
  readonly view: LibraryView;
  readonly sort?: LibrarySort;
};

/** recent 先丢掉没打开过的。all 的默认序把 openedAt 为空的排后，再按 addedAt 降序。 */
export function orderLibraryEntries(
  entries: readonly LibraryEntry[],
  input: LibraryListInput,
): LibraryEntry[] {
  const visible =
    input.view === "recent"
      ? entries.filter((entry) => entry.openedAt !== null)
      : entries;
  return [...visible].sort(compareFor(input));
}

function compareFor(
  input: LibraryListInput,
): (left: LibraryEntry, right: LibraryEntry) => number {
  const sort = input.sort;
  if (sort === undefined) {
    return input.view === "recent" ? compareRecent : compareDefaultAll;
  }
  return (left, right) => compareExplicit(left, right, sort);
}

function compareRecent(left: LibraryEntry, right: LibraryEntry): number {
  return compareOpenedAt(left, right, "desc");
}

function compareDefaultAll(left: LibraryEntry, right: LibraryEntry): number {
  const group = groupOf(left) - groupOf(right);
  if (group !== 0) {
    return group;
  }
  return compareAddedAt(left, right, "desc");
}

function groupOf(entry: LibraryEntry): number {
  return entry.openedAt === null ? 1 : 0;
}

function compareExplicit(
  left: LibraryEntry,
  right: LibraryEntry,
  sort: LibrarySort,
): number {
  switch (sort.field) {
    case "title":
      return compareTitle(left, right, sort.dir);
    case "addedAt":
      return compareAddedAt(left, right, sort.dir);
    case "openedAt":
      return compareOpenedAt(left, right, sort.dir);
    case "status":
      return compareAddedAt(left, right, sort.dir);
    default:
      return assertNever(sort.field);
  }
}

function compareTitle(
  left: LibraryEntry,
  right: LibraryEntry,
  dir: LibrarySortDir,
): number {
  const byTitle = directed(left.title.localeCompare(right.title, "en"), dir);
  if (byTitle !== 0) {
    return byTitle;
  }
  return compareId(left, right);
}

function compareAddedAt(
  left: LibraryEntry,
  right: LibraryEntry,
  dir: LibrarySortDir,
): number {
  const byTime = directed(compareIso(left.addedAt, right.addedAt), dir);
  if (byTime !== 0) {
    return byTime;
  }
  return compareId(left, right);
}

function compareOpenedAt(
  left: LibraryEntry,
  right: LibraryEntry,
  dir: LibrarySortDir,
): number {
  if (left.openedAt === null && right.openedAt === null) {
    return compareId(left, right);
  }
  if (left.openedAt === null) {
    return 1;
  }
  if (right.openedAt === null) {
    return -1;
  }
  const byTime = directed(compareIso(left.openedAt, right.openedAt), dir);
  if (byTime !== 0) {
    return byTime;
  }
  return compareId(left, right);
}

function compareIso(left: string, right: string): number {
  const delta = Date.parse(left) - Date.parse(right);
  if (!Number.isFinite(delta) || delta === 0) {
    return 0;
  }
  return delta < 0 ? -1 : 1;
}

function compareId(left: LibraryEntry, right: LibraryEntry): number {
  if (left.id < right.id) {
    return -1;
  }
  if (left.id > right.id) {
    return 1;
  }
  return 0;
}

function directed(value: number, dir: LibrarySortDir): number {
  return dir === "asc" ? value : -value;
}

function assertNever(value: never): number {
  throw new Error(typeof value);
}
