export function renderSchemaType(schema) {
  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.map(renderSchemaType).join(" | ");
  }
  if (Object.hasOwn(schema, "const")) {
    return JSON.stringify(schema.const);
  }
  if (schema.type === "object") {
    return `Readonly<${renderObject(schema)}>`;
  }
  if (schema.type === "array") {
    return `readonly (${renderSchemaType(schema.items)})[]`;
  }
  return primitive(schema.type);
}

export function renderResponse(schema) {
  const rendered = renderSchemaType(schema);
  if (schema.type === "object") {
    return rendered;
  }
  return `Readonly<${rendered}>`;
}

function renderObject(schema) {
  const required = new Set(schema.required ?? []);
  const properties = schema.properties ?? {};
  const fields = Object.keys(properties)
    .sort()
    .map((key) => renderField(key, properties[key], required.has(key)));
  return `{ ${fields.join("; ")} }`;
}

function renderField(key, schema, isRequired) {
  const optional = isRequired ? "" : "?";
  return `${key}${optional}: ${renderSchemaType(schema)}`;
}

function primitive(type) {
  if (type === "string") {
    return "string";
  }
  if (type === "boolean") {
    return "boolean";
  }
  if (type === "number" || type === "integer") {
    return "number";
  }
  if (type === "null") {
    return "null";
  }
  throw new Error("ipc schema type");
}
