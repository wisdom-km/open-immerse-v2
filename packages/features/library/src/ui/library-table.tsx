import type { KeyboardEvent, MouseEvent, ReactElement } from "react";

import { showTime } from "./messages.js";
import {
  ariaSort,
  type ColumnSort,
  type LibraryRow,
  type SortField,
} from "./screen-model.js";

const columns = [
  ["title", "标题"],
  ["status", "状态"],
  ["openedAt", "打开时间"],
  ["addedAt", "加入时间"],
] as const;

export function LibraryTable(props: {
  readonly rows: readonly LibraryRow[];
  readonly sort: ColumnSort | undefined;
  readonly selectedId: string;
  readonly onSort: (field: SortField) => void;
  readonly onSelect: (id: string) => void;
  readonly onOpen?: ((id: string) => void) | undefined;
}): ReactElement {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(([field, label]) => (
            <th key={field} scope="col" aria-sort={ariaSort(props.sort, field)}>
              <button
                type="button"
                onClick={() => {
                  props.onSort(field);
                }}
              >
                {label}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row) => (
          <LibraryTableRow
            key={row.id}
            row={row}
            selected={row.id === props.selectedId}
            onSelect={props.onSelect}
            onOpen={props.onOpen}
          />
        ))}
      </tbody>
    </table>
  );
}

function LibraryTableRow(props: {
  readonly row: LibraryRow;
  readonly selected: boolean;
  readonly onSelect: (id: string) => void;
  readonly onOpen?: ((id: string) => void) | undefined;
}): ReactElement {
  return (
    <tr
      aria-selected={props.selected}
      tabIndex={0}
      onClick={() => {
        props.onSelect(props.row.id);
      }}
      onDoubleClick={() => {
        props.onOpen?.(props.row.id);
      }}
      onContextMenu={stopPointer}
      onKeyDown={(event) => {
        openSelected(event, props);
      }}
    >
      <td>{props.row.title}</td>
      <td>—</td>
      <td>{showTime(props.row.openedAt)}</td>
      <td>{showTime(props.row.addedAt)}</td>
    </tr>
  );
}

function stopPointer(event: MouseEvent<HTMLTableRowElement>): void {
  event.preventDefault();
}

function openSelected(
  event: KeyboardEvent<HTMLTableRowElement>,
  target: {
    readonly selected: boolean;
    readonly row: LibraryRow;
    readonly onOpen?: ((id: string) => void) | undefined;
  },
): void {
  if (event.key !== "Enter" || !target.selected) {
    return;
  }
  target.onOpen?.(target.row.id);
}
