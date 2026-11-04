import { renderResponse } from "./preload-schema-type.mjs";

export function renderErrorUnion(errors) {
  if (errors.length === 0) {
    return "never";
  }
  if (errors.length === 1) {
    return renderOne(errors[0]);
  }
  return `(\n    | ${errors.map(renderOne).join("\n    | ")}\n  )`;
}

export function renderOiError(commands) {
  if (commands.length === 0) {
    return "export type OiError<Channel extends string> = Channel extends never\n  ? Channel\n  : never;\n";
  }
  const lines = ["export type OiError<Channel extends string> ="];
  for (const command of commands) {
    lines.push(`  ${condition(command)} :`);
  }
  lines.push("  never;");
  return `${lines.join("\n")}\n`;
}

function condition(command) {
  const codes = command.errors.map((error) => JSON.stringify(error.code));
  const union = codes.length === 0 ? "never" : codes.join(" | ");
  return `Channel extends ${JSON.stringify(command.channel)} ? ${union}`;
}

function renderOne(error) {
  const head = `{ readonly code: ${JSON.stringify(error.code)}; readonly retryable: ${String(error.retryable)} }`;
  if (error.detail === null) {
    return head;
  }
  return `(${head} & ${renderResponse(error.detail)})`;
}
