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
}): ReactElement {
  return (
    <tr
      aria-selected={props.selected}
      tabIndex={0}
      onClick={() => {
        props.onSelect(props.row.id);
      }}
      onDoubleClick={stopPointer}
      onContextMenu={stopPointer}
      onKeyDown={stopEnter}
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

function stopEnter(event: KeyboardEvent<HTMLTableRowElement>): void {
  if (event.key === "Enter") {
    event.preventDefault();
  }
}
