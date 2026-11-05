import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchRows,
  OPEN_FILE_EVENT,
  requestDropped,
  requestImport,
  settleImport,
  type SettleContext,
} from "./screen-io.js";
import {
  listInput,
  nextSort,
  type ColumnSort,
  type LibraryRow,
  type LibraryViewName,
  type ListInput,
  type SortField,
} from "./screen-model.js";

export type LibraryScreen = {
  readonly view: LibraryViewName;
  readonly sort: ColumnSort | undefined;
  readonly rows: readonly LibraryRow[];
  readonly selectedId: string;
  readonly status: string;
  readonly busy: boolean;
  readonly failed: boolean;
  readonly chooseView: (view: LibraryViewName) => void;
  readonly chooseSort: (field: SortField) => void;
  readonly selectRow: (id: string) => void;
  readonly openFile: () => void;
  readonly dropFile: (file: File) => void;
};

type Flags = {
  readonly setBusy: (busy: boolean) => void;
  readonly setFailed: (failed: boolean) => void;
  readonly setRows: (rows: readonly LibraryRow[]) => void;
  readonly setStatus: (status: string) => void;
};

export function useLibraryScreen(): LibraryScreen {
  const [view, setView] = useState<LibraryViewName>("recent");
  const [sort, setSort] = useState<ColumnSort | undefined>(undefined);
  const [rows, setRows] = useState<readonly LibraryRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const viewRef = useRef(view);
  const sortRef = useRef(sort);
  viewRef.current = view;
  sortRef.current = sort;
  const refresh = useCallback((input: ListInput) => {
    return reload(input, { setBusy, setFailed, setRows, setStatus });
  }, []);
  const actions = useScreenActions({
    refresh,
    viewRef,
    sortRef,
    setView,
    setSort,
    setSelectedId,
    setStatus,
  });
  return {
    view,
    sort,
    rows,
    selectedId,
    status,
    busy,
    failed,
    selectRow: setSelectedId,
    ...actions,
  };
}

type ActionInput = {
  readonly refresh: (
    input: ListInput,
  ) => Promise<readonly LibraryRow[] | undefined>;
  readonly viewRef: { readonly current: LibraryViewName };
  readonly sortRef: { readonly current: ColumnSort | undefined };
  readonly setView: (view: LibraryViewName) => void;
  readonly setSort: (sort: ColumnSort) => void;
  readonly setSelectedId: (id: string) => void;
  readonly setStatus: (status: string) => void;
};

function useScreenActions(input: ActionInput): {
  readonly chooseView: (view: LibraryViewName) => void;
  readonly chooseSort: (field: SortField) => void;
  readonly openFile: () => void;
  readonly dropFile: (file: File) => void;
} {
  const {
    refresh,
    viewRef,
    sortRef,
    setView,
    setSort,
    setSelectedId,
    setStatus,
  } = input;
  const context = useCallback((): SettleContext => {
    return {
      view: viewRef.current,
      sort: sortRef.current,
      refresh,
      setView,
      setSelectedId,
      setStatus,
    };
  }, [refresh, viewRef, sortRef, setView, setSelectedId, setStatus]);
  const openFile = useCallback(() => {
    void requestImport().then((result) => settleImport(result, context()));
  }, [context]);
  const dropFile = useCallback(
    (file: File) => {
      void requestDropped(file).then((result) => {
        return settleImport(result, context());
      });
    },
    [context],
  );
  const chooseView = useCallback(
    (next: LibraryViewName) => {
      setView(next);
      setStatus("");
      void refresh(listInput(next, sortRef.current));
    },
    [refresh, setStatus, setView, sortRef],
  );
  const chooseSort = useCallback(
    (field: SortField) => {
      const next = nextSort(sortRef.current, field);
      setSort(next);
      void refresh(listInput(viewRef.current, next));
    },
    [refresh, setSort, sortRef, viewRef],
  );
  useEffect(() => {
    void refresh({ view: "recent" });
  }, [refresh]);
  useEffect(() => {
    const onOpen = (): void => {
      openFile();
    };
    window.addEventListener(OPEN_FILE_EVENT, onOpen);
    return () => {
      window.removeEventListener(OPEN_FILE_EVENT, onOpen);
    };
  }, [openFile]);
  return { chooseView, chooseSort, openFile, dropFile };
}

async function reload(
  input: ListInput,
  flags: Flags,
): Promise<readonly LibraryRow[] | undefined> {
  flags.setBusy(true);
  const loaded = await fetchRows(input);
  flags.setBusy(false);
  if (loaded === undefined) {
    flags.setFailed(true);
    flags.setStatus("操作没有完成");
    return undefined;
  }
  flags.setFailed(false);
  flags.setRows(loaded);
  return loaded;
}
