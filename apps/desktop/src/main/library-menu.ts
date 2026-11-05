export const fileMenu = {
  label: "文件",
  items: [{ label: "打开…", accelerator: "CmdOrCtrl+O" }],
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

export const openFileEvent = "oi-open-file";

export function openFileScript(): string {
  return `window.dispatchEvent(new Event(${JSON.stringify(openFileEvent)}))`;
}
