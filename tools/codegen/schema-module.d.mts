export function loadProtocolSchemas(
  schemaPath: string,
): Promise<ReadonlyArray<{ readonly name: string; readonly schema: object }>>;
