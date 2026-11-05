export type LibraryViewName = "recent" | "all";

export type SortField = "title" | "status" | "openedAt" | "addedAt";

export type SortDir = "asc" | "desc";

export type ColumnSort = {
  readonly field: SortField;
  readonly dir: SortDir;
};

export type LibraryRow = {
  readonly id: string;
  readonly title: string;
  readonly addedAt: string;
  readonly openedAt: string | null;
};

export type ListInput = {
  readonly view: LibraryViewName;
  readonly sort?: ColumnSort;
};

export type ImportResult =
  | {
      readonly ok: true;
      readonly value: {
        readonly duplicate: boolean;
        readonly entry: { readonly id: string };
      };
    }
  | { readonly ok: false; readonly error: { readonly code: string } };

export function listInput(
  view: LibraryViewName,
  sort: ColumnSort | undefined,
): ListInput {
  if (sort === undefined) {
    return { view };
  }
  return { view, sort };
}

export function nextSort(
  current: ColumnSort | undefined,
  field: SortField,
): ColumnSort {
  if (current?.field === field && current.dir === "asc") {
    return { field, dir: "desc" };
  }
  return { field, dir: "asc" };
}

export function ariaSort(
  sort: ColumnSort | undefined,
  field: SortField,
): "ascending" | "descending" | "none" {
  if (sort?.field !== field) {
    return "none";
  }
  return sort.dir === "asc" ? "ascending" : "descending";
}
