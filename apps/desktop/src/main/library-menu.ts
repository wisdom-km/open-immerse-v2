export const fileMenu = {
  label: "文件",
  items: [{ label: "打开…", accelerator: "CmdOrCtrl+O" }],
} as const;

export const openFileEvent = "oi-open-file";

export function openFileScript(): string {
  return `window.dispatchEvent(new Event(${JSON.stringify(openFileEvent)}))`;
}
