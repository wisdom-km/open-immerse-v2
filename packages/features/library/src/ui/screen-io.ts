import { OPEN_FILE_EVENT } from "./open-file-event.js";
import { addedMessage, importMessage } from "./messages.js";
import {
  listInput,
  type ColumnSort,
  type ImportResult,
  type LibraryRow,
  type LibraryViewName,
  type ListInput,
} from "./screen-model.js";

export { OPEN_FILE_EVENT };

type Listed = {
  readonly ok: true;
  readonly value: readonly {
    readonly id: string;
    readonly title: string;
    readonly addedAt: string;
    readonly openedAt: string | null;
  }[];
};

type LibraryClient = {
  import(input: Record<string, never>): Promise<ImportResult>;
  importDropped(file: File): Promise<ImportResult>;
  list(
    input: ListInput,
  ): Promise<Listed | { readonly ok: false; readonly error: { code: string } }>;
};

function libraryClient(): LibraryClient {
  const host = window as unknown as {
    readonly oi: { readonly library: LibraryClient };
  };
  return host.oi.library;
}

export async function fetchRows(
  input: ListInput,
): Promise<readonly LibraryRow[] | undefined> {
  const result = await libraryClient().list(input);
  if (!result.ok) {
    return undefined;
  }
  return result.value.map((entry) => ({
    id: entry.id,
    title: entry.title,
    addedAt: entry.addedAt,
    openedAt: entry.openedAt,
  }));
}

export function requestImport(): Promise<ImportResult> {
  return libraryClient().import({});
}

export function requestDropped(file: File): Promise<ImportResult> {
  return libraryClient().importDropped(file);
}

export type SettleContext = {
  readonly view: LibraryViewName;
  readonly sort: ColumnSort | undefined;
  readonly refresh: (
    input: ListInput,
  ) => Promise<readonly LibraryRow[] | undefined>;
  readonly setView: (view: LibraryViewName) => void;
  readonly setSelectedId: (id: string) => void;
  readonly setStatus: (status: string) => void;
};

export async function settleImport(
  result: ImportResult,
  ctx: SettleContext,
): Promise<void> {
  if (!result.ok) {
    ctx.setStatus(importMessage(result.error.code));
    return;
  }
  const loaded = await showImported(result.value.entry.id, ctx);
  if (loaded === undefined) {
    return;
  }
  ctx.setSelectedId(result.value.entry.id);
  ctx.setStatus(addedMessage(result.value.duplicate));
}

async function showImported(
  id: string,
  ctx: SettleContext,
): Promise<readonly LibraryRow[] | undefined> {
  const loaded = await ctx.refresh(listInput(ctx.view, ctx.sort));
  if (loaded === undefined) {
    return undefined;
  }
  if (loaded.some((row) => row.id === id)) {
    return loaded;
  }
  ctx.setView("all");
  return ctx.refresh(listInput("all", ctx.sort));
}
