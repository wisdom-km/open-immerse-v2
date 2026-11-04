export function assertExposedTransport(descriptor) {
  const transport = descriptor.transport ?? "invoke";
  if (transport === "invoke") {
    return;
  }
  if (descriptor.kind === "event") {
    throw new Error("event transport only allows invoke");
  }
  if (transport === "dropped-file") {
    throw new Error("dropped-file is not generated");
  }
  throw new Error("unsupported ipc transport");
}
