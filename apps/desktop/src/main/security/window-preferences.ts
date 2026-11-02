export const windowTitle = "Open Immerse";

export const appStartUrl = "oi-app://app/index.html";

export const windowPreferences = {
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
} as const;

export type WindowPreferences = typeof windowPreferences;

export function browserWindowOptions(preloadPath: string): {
  title: string;
  webPreferences: WindowPreferences & { preload: string };
} {
  return {
    title: windowTitle,
    webPreferences: { ...windowPreferences, preload: preloadPath },
  };
}
