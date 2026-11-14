export const openFileEvent = "oi-open-file";
export const returnLibraryEvent = "oi-return-library";
export const historyBackEvent = "oi-history-back";
export const historyForwardEvent = "oi-history-forward";
export const goToPageEvent = "oi-go-to-page";

export type MenuClick = {
  readonly label: string;
  readonly event: string;
  readonly accelerator?: string;
};

export const fileMenu: {
  readonly label: string;
  readonly items: readonly MenuClick[];
} = {
  label: "文件",
  items: [
    { label: "打开…", accelerator: "CmdOrCtrl+O", event: openFileEvent },
    { label: "返回文献库", event: returnLibraryEvent },
  ],
};

export type ShellMenuRole = "appMenu" | "editMenu" | "windowMenu";

export type ShellMenuEntry =
  | { readonly role: ShellMenuRole }
  | { readonly label: string; readonly items: readonly MenuClick[] };

export function applicationMenuTemplate(
  platform: string,
): readonly ShellMenuEntry[] {
  const file = { label: fileMenu.label, items: fileMenu.items } as const;
  const edit = { role: "editMenu" } as const;
  const view = viewMenu(platform);
  const windowMenu = { role: "windowMenu" } as const;
  if (platform === "darwin") {
    return [{ role: "appMenu" }, file, edit, view, windowMenu];
  }
  return [file, edit, view, windowMenu];
}

export function openFileScript(): string {
  return menuScript(openFileEvent);
}

export function returnLibraryScript(): string {
  return menuScript(returnLibraryEvent);
}

export function scriptForMenuEvent(eventName: string): string | undefined {
  if (!menuEvents.has(eventName)) return undefined;
  return menuScript(eventName);
}

function viewMenu(platform: string): {
  readonly label: string;
  readonly items: readonly MenuClick[];
} {
  const mac = platform === "darwin";
  return {
    label: mac ? "显示" : "视图(&V)",
    items: [
      click("后退", mac ? "Cmd+[" : "Alt+Left", historyBackEvent),
      click("前进", mac ? "Cmd+]" : "Alt+Right", historyForwardEvent),
      click("转到页码…", mac ? "Alt+Cmd+G" : "Ctrl+G", goToPageEvent),
    ],
  };
}

function click(label: string, accelerator: string, event: string): MenuClick {
  return { label, accelerator, event };
}

const menuEvents = new Set<string>([
  openFileEvent,
  returnLibraryEvent,
  historyBackEvent,
  historyForwardEvent,
  goToPageEvent,
]);

function menuScript(eventName: string): string {
  return `window.dispatchEvent(new Event(${JSON.stringify(eventName)}))`;
}
