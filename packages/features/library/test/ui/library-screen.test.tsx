// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { LibraryApp } from "../../src/ui/library-app.js";
import { OPEN_FILE_EVENT } from "../../src/ui/open-file-event.js";

afterEach(() => {
  cleanup();
});

type Entry = {
  readonly id: string;
  readonly fileName: string;
  readonly title: string;
  readonly addedAt: string;
  readonly openedAt: string | null;
};

type Call = {
  readonly channel: string;
  readonly payload: unknown;
};

const paper: Entry = {
  id: "paper-1",
  fileName: "paper.pdf",
  title: "Paper",
  addedAt: "2026-11-05T04:00:00.000Z",
  openedAt: null,
};

function okList(value: readonly Entry[]) {
  return Promise.resolve({ ok: true as const, value });
}

function okImport(duplicate: boolean) {
  return Promise.resolve({
    ok: true as const,
    value: { duplicate, entry: paper },
  });
}

function fail(code: string) {
  return Promise.resolve({
    ok: false as const,
    error: { code, retryable: false },
  });
}

function install(options: {
  readonly list: (payload: unknown) => Promise<unknown>;
  readonly import?: () => Promise<unknown>;
  readonly importDropped?: (file: File) => Promise<unknown>;
}): Call[] {
  const calls: Call[] = [];
  Object.defineProperty(window, "oi", {
    configurable: true,
    value: {
      library: {
        import(input: unknown) {
          calls.push({ channel: "library.import", payload: input });
          return options.import?.() ?? fail("handler_threw");
        },
        importDropped(file: File) {
          calls.push({
            channel: "library.importDropped",
            payload: file.name,
          });
          return options.importDropped?.(file) ?? fail("not_pdf");
        },
        list(input: unknown) {
          calls.push({ channel: "library.list", payload: input });
          return options.list(input);
        },
        relocate(input: unknown) {
          calls.push({ channel: "library.relocate", payload: input });
          return fail("not_found");
        },
      },
    },
  });
  return calls;
}

function listCalls(calls: readonly Call[]): unknown[] {
  return calls
    .filter((call) => call.channel === "library.list")
    .map((call) => call.payload);
}

function viewOf(payload: unknown): string {
  if (typeof payload !== "object" || payload === null || !("view" in payload)) {
    return "";
  }
  return typeof payload.view === "string" ? payload.view : "";
}

it("shows the empty recent library when the first list is empty", async () => {
  const calls = install({
    list: () => okList([]),
  });
  render(<LibraryApp />);
  await screen.findByText("把论文 PDF 拖到这里");
  expect(listCalls(calls)[0]).toEqual({ view: "recent" });
  const nav = screen.getByRole("navigation", { name: "文献库" });
  expect(
    within(nav)
      .getAllByRole("button")
      .map((button) => button.textContent),
  ).toEqual(["最近", "全部论文"]);
  expect(screen.getAllByRole("button", { name: "打开文件…" })).toHaveLength(1);
  expect(screen.queryByRole("button", { name: "打开文件夹…" })).toBeNull();
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByText("⋯")).toBeNull();
  expect(document.body.textContent).not.toMatch(
    /Markdown|术语|设置|\.md|markdown|originalPath/i,
  );
  fireEvent.click(screen.getByRole("link", { name: "全部论文" }));
  await waitFor(() => {
    expect(listCalls(calls).at(-1)).toEqual({ view: "all" });
  });
  expect(calls.some((call) => call.channel === "library.relocate")).toBe(false);
});

it("shows three placeholders when the first list is still running", async () => {
  let release: (value: unknown) => void = () => undefined;
  install({
    list: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  render(<LibraryApp />);
  expect(document.querySelectorAll(".skeleton")).toHaveLength(3);
  expect(document.querySelector("[aria-busy='true']")).not.toBeNull();
  release({ ok: true, value: [] });
  await screen.findByText("把论文 PDF 拖到这里");
  expect(document.querySelector("[aria-busy='true']")).toBeNull();
});

it("selects the existing row when import reports a duplicate", async () => {
  const calls = install({
    list: (payload) =>
      viewOf(payload) === "all" ? okList([paper]) : okList([]),
    import: () => okImport(true),
  });
  render(<LibraryApp />);
  await screen.findByText("把论文 PDF 拖到这里");
  fireEvent.click(screen.getByRole("button", { name: "打开文件…" }));
  await screen.findByText("已在文献库中");
  expect(
    screen.getByRole("row", { name: /Paper/ }).getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getAllByRole("row", { name: /Paper/ })).toHaveLength(1);
  expect(document.querySelector("dialog")).toBeNull();
  expect(calls.some((call) => call.channel === "library.relocate")).toBe(false);
  expect(document.body.textContent).not.toMatch(
    /\/tmp\/|\/Users\/|[A-Za-z]:\\/,
  );
});

it("reports the new paper when import succeeds", async () => {
  const calls = install({
    list: (payload) =>
      viewOf(payload) === "all" ? okList([paper]) : okList([]),
    import: () => okImport(false),
  });
  render(<LibraryApp />);
  await screen.findByText("把论文 PDF 拖到这里");
  window.dispatchEvent(new Event(OPEN_FILE_EVENT));
  await screen.findByText("已加入文献库");
  expect(calls.some((call) => call.channel === "library.import")).toBe(true);
  expect(
    screen.getByRole("row", { name: /Paper/ }).getAttribute("aria-selected"),
  ).toBe("true");
});

it("shows only pdf when a dropped file is not a pdf", async () => {
  install({
    list: () => okList([]),
    importDropped: () => fail("not_pdf"),
  });
  render(<LibraryApp />);
  await screen.findByText("把论文 PDF 拖到这里");
  const file = new File(["hello"], "notes.md", { type: "text/markdown" });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  fireEvent.drop(window, { dataTransfer: transfer });
  await screen.findByText("只支持 PDF");
  expect(document.body.textContent).not.toMatch(/\.md|markdown/i);
});

it("reports a checksum failure when the file does not match", async () => {
  install({
    list: () => okList([]),
    import: () => fail("hash_mismatch"),
  });
  render(<LibraryApp />);
  await screen.findByText("把论文 PDF 拖到这里");
  fireEvent.click(screen.getByRole("button", { name: "打开文件…" }));
  await screen.findByText("这份文件没有通过校验");
});

it("clears the status when import is cancelled", async () => {
  const calls = install({
    list: () => okList([]),
    import: () => fail("cancelled"),
  });
  render(<LibraryApp />);
  await screen.findByText("把论文 PDF 拖到这里");
  fireEvent.click(screen.getByRole("button", { name: "打开文件…" }));
  await waitFor(() => {
    expect(calls.some((call) => call.channel === "library.import")).toBe(true);
  });
  expect(screen.getByRole("status").textContent).toBe("");
});

it("sorts through list when a column header is clicked", async () => {
  const opened = { ...paper, openedAt: "2026-11-05T05:00:00.000Z" };
  const calls = install({
    list: () => okList([opened]),
  });
  const view = render(<LibraryApp />);
  await screen.findByRole("columnheader", { name: "标题" });
  fireEvent.click(screen.getByRole("button", { name: "标题" }));
  await waitFor(() => {
    expect(listCalls(calls).at(-1)).toEqual({
      view: "recent",
      sort: { field: "title", dir: "asc" },
    });
  });
  expect(
    screen
      .getByRole("columnheader", { name: "标题" })
      .getAttribute("aria-sort"),
  ).toBe("ascending");
  expect(
    screen
      .getByRole("columnheader", { name: "状态" })
      .getAttribute("aria-sort"),
  ).toBe("none");
  expect(screen.getAllByRole("cell", { name: "—" }).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "标题" }));
  await waitFor(() => {
    expect(listCalls(calls).at(-1)).toEqual({
      view: "recent",
      sort: { field: "title", dir: "desc" },
    });
  });
  expect(
    screen
      .getByRole("columnheader", { name: "标题" })
      .getAttribute("aria-sort"),
  ).toBe("descending");
  view.unmount();
  const again = install({
    list: () => okList([opened]),
  });
  render(<LibraryApp />);
  await screen.findByRole("columnheader", { name: "标题" });
  expect(listCalls(again)[0]).toEqual({ view: "recent" });
});

it("selects the row when it is clicked", async () => {
  const calls = install({
    list: () => okList([{ ...paper, openedAt: "2026-11-05T05:00:00.000Z" }]),
  });
  render(<LibraryApp />);
  const row = await screen.findByRole("row", { name: /Paper/ });
  const before = calls.length;
  fireEvent.click(row);
  expect(row.getAttribute("aria-selected")).toBe("true");
  fireEvent.doubleClick(row);
  fireEvent.keyDown(row, { key: "Enter" });
  expect(calls.length).toBe(before);
  expect(calls.some((call) => call.channel === "library.import")).toBe(false);
  expect(calls.some((call) => call.channel === "library.relocate")).toBe(false);
});

const other: Entry = {
  id: "paper-2",
  fileName: "other.pdf",
  title: "Other",
  addedAt: "2026-11-05T03:00:00.000Z",
  openedAt: null,
};

it("selects on click and opens that row on double click", async () => {
  const opened: string[] = [];
  const calls = install({
    list: () => okList([paper, other]),
  });
  render(
    <LibraryApp
      onOpen={(id) => {
        opened.push(id);
      }}
    />,
  );
  const row = await screen.findByRole("row", { name: /Paper/ });
  fireEvent.click(row);
  expect(row.getAttribute("aria-selected")).toBe("true");
  expect(opened).toEqual([]);
  fireEvent.contextMenu(row);
  expect(opened).toEqual([]);
  fireEvent.doubleClick(row);
  expect(opened).toEqual(["paper-1"]);
  expect(calls.some((call) => call.channel === "library.import")).toBe(false);
});

it("opens the selected row on enter and leaves the other row", async () => {
  const opened: string[] = [];
  const calls = install({
    list: () => okList([paper, other]),
  });
  render(
    <LibraryApp
      onOpen={(id) => {
        opened.push(id);
      }}
    />,
  );
  const paperRow = await screen.findByRole("row", { name: /Paper/ });
  const otherRow = screen.getByRole("row", { name: /Other/ });
  fireEvent.keyDown(otherRow, { key: "Enter" });
  fireEvent.click(paperRow);
  fireEvent.keyDown(otherRow, { key: "Enter" });
  expect(opened).toEqual([]);
  fireEvent.keyDown(paperRow, { key: "Enter" });
  expect(opened).toEqual(["paper-1"]);
  expect(calls.some((call) => call.channel === "library.import")).toBe(false);
});

it("imports from open file and does not open the selected row", async () => {
  const opened: string[] = [];
  const calls = install({
    list: () => okList([paper]),
    import: () => okImport(false),
  });
  render(
    <LibraryApp
      onOpen={(id) => {
        opened.push(id);
      }}
    />,
  );
  const row = await screen.findByRole("row", { name: /Paper/ });
  fireEvent.click(row);
  const button = screen.getByRole("button", { name: "打开文件…" });
  button.focus();
  fireEvent.keyDown(button, { key: "Enter" });
  fireEvent.click(button);
  expect(opened).toEqual([]);
  await waitFor(() => {
    expect(
      calls.filter((call) => call.channel === "library.import"),
    ).toHaveLength(1);
  });
});

it("keeps the nav working when list fails", async () => {
  const calls = install({
    list: () => fail("handler_threw"),
  });
  render(<LibraryApp />);
  await screen.findByText("操作没有完成");
  expect(screen.queryByText("把论文 PDF 拖到这里")).toBeNull();
  fireEvent.click(
    within(screen.getByRole("navigation")).getByRole("button", {
      name: "全部论文",
    }),
  );
  await waitFor(() => {
    expect(listCalls(calls).at(-1)).toEqual({ view: "all" });
  });
});
