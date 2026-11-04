const fileUrl = /file:\/\/\S+/gu;
const windowsPath = /[A-Za-z]:\\[^\s"'`<>|]+/gu;
const posixPath = /(^|[\s"'`(])(\/[^\s"'`)]+)/gu;

export function redactAbsolutePaths(text: string): string {
  return text
    .replace(fileUrl, "[path]")
    .replace(windowsPath, "[path]")
    .replace(posixPath, "$1[path]");
}
