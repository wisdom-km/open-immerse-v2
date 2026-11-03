export function loadProtocolSchemas(
  schemaPath: string,
): Promise<ReadonlyArray<{ readonly name: string; readonly schema: object }>>;

export function writeExclusive(
  output: string,
  relative: string,
  text: string,
): Promise<void>;
