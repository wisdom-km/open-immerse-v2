export const openFileEvent = "oi-open-file";
export const returnLibraryEvent = "oi-return-library";

export type MenuItemSpec = {
  readonly label: string;
  readonly event: string;
  readonly accelerator?: string;
};

export const fileMenu: {
  readonly label: string;
  readonly items: readonly MenuItemSpec[];
} = {
  label: "文件",
  items: [
    { label: "打开…", accelerator: "CmdOrCtrl+O", event: openFileEvent },
    { label: "返回文献库", event: returnLibraryEvent },
  ],
};

const viewActions = [
  ["后退", "oi-history-back", "Cmd+[", "Alt+Left"],
  ["前进", "oi-history-forward", "Cmd+]", "Alt+Right"],
  ["转到页码…", "oi-go-to-page", "Alt+Cmd+G", "Ctrl+G"],
  ["原文", "oi-view-original", "Cmd+1", "Ctrl+1"],
  ["对照", "oi-view-bilingual", "Cmd+2", "Ctrl+2"],
  ["译文", "oi-view-translation", "Cmd+3", "Ctrl+3"],
  ["放大", "oi-zoom-in", "Cmd+=", "Ctrl+="],
  ["缩小", "oi-zoom-out", "Cmd+-", "Ctrl+-"],
  ["实际大小", "oi-zoom-actual", "Cmd+0", "Ctrl+0"],
  ["适合宽度", "oi-zoom-fit-width", "Alt+Cmd+0", "Ctrl+Alt+0"],
] as const;

export type ShellMenuRole = "appMenu" | "editMenu" | "windowMenu";

export type ShellMenuEntry =
  | { readonly role: ShellMenuRole }
  | {
      readonly label: string;
      readonly items: readonly MenuItemSpec[];
    };

export function applicationMenuTemplate(
  platform: string,
): readonly ShellMenuEntry[] {
  const edit = { role: "editMenu" } as const;
  const windowMenu = { role: "windowMenu" } as const;
  const view = viewMenu(platform);
  if (platform === "darwin") {
    return [{ role: "appMenu" }, fileMenu, view, edit, windowMenu];
  }
  return [fileMenu, view, edit, windowMenu];
}

export function openFileScript(): string {
  return menuScript(openFileEvent);
}

export function returnLibraryScript(): string {
  return menuScript(returnLibraryEvent);
}

export function scriptForMenuEvent(eventName: string): string | undefined {
  if (!knownEvent(eventName)) {
    return undefined;
  }
  return menuScript(eventName);
}

function viewMenu(platform: string): {
  readonly label: string;
  readonly items: readonly MenuItemSpec[];
} {
  const mac = platform === "darwin";
  return {
    label: mac ? "显示" : "视图(&V)",
    items: viewActions.map(([label, event, macKey, winKey]) => ({
      label,
      event,
      accelerator: mac ? macKey : winKey,
    })),
  };
}

function knownEvent(eventName: string): boolean {
  if (fileMenu.items.some((item) => item.event === eventName)) {
    return true;
  }
  return viewActions.some((item) => item[1] === eventName);
}

function menuScript(eventName: string): string {
  return `window.dispatchEvent(new Event(${JSON.stringify(eventName)}))`;
}
