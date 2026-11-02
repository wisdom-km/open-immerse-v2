import { Type } from "@sinclair/typebox";

export const VERSION_PATTERN = "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$";

export const versionText = Type.String({ pattern: VERSION_PATTERN });
