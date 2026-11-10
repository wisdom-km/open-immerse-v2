export const openFileEvent = "oi-open-file";
export const returnLibraryEvent = "oi-return-library";

export const fileMenu = {
  label: "文件",
  items: [
    { label: "打开…", accelerator: "CmdOrCtrl+O", event: openFileEvent },
    { label: "返回文献库", event: returnLibraryEvent },
  ],
} as const;

export type ShellMenuRole = "appMenu" | "editMenu" | "windowMenu";

export type ShellMenuEntry =
  | { readonly role: ShellMenuRole }
  | {
      readonly label: typeof fileMenu.label;
      readonly items: typeof fileMenu.items;
    };

export function applicationMenuTemplate(
  platform: string,
): readonly ShellMenuEntry[] {
  const file = { label: fileMenu.label, items: fileMenu.items } as const;
  const edit = { role: "editMenu" } as const;
  const windowMenu = { role: "windowMenu" } as const;
  if (platform === "darwin") {
    return [{ role: "appMenu" }, file, edit, windowMenu];
  }
  return [file, edit, windowMenu];
}

export function openFileScript(): string {
  return menuScript(openFileEvent);
}

export function returnLibraryScript(): string {
  return menuScript(returnLibraryEvent);
}

export function scriptForMenuEvent(eventName: string): string | undefined {
  if (eventName === openFileEvent) {
    return openFileScript();
  }
  if (eventName === returnLibraryEvent) {
    return returnLibraryScript();
  }
  return undefined;
}

function menuScript(eventName: string): string {
  return `window.dispatchEvent(new Event(${JSON.stringify(eventName)}))`;
}
