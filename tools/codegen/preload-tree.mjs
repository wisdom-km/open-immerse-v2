const identifier = /^[A-Za-z][A-Za-z0-9]*$/u;

export function assertChannel(channel) {
  const parts = channel.split(".");
  if (parts.length < 2 || parts.some((part) => !identifier.test(part))) {
    throw new Error("ipc channel");
  }
  return parts;
}

export function buildTree(descriptors) {
  const root = emptyNode();
  for (const descriptor of descriptors) {
    insert(root, assertChannel(descriptor.channel), descriptor);
  }
  return root;
}

function insert(root, parts, descriptor) {
  let node = root;
  for (const key of parts.slice(0, -1)) {
    node = child(node, key);
  }
  const name = parts[parts.length - 1];
  if (name === undefined || node.children.has(name) || node.methods.has(name)) {
    throw new Error("ipc channel");
  }
  node.methods.set(name, descriptor);
}

function child(node, key) {
  if (node.methods.has(key)) {
    throw new Error("ipc channel");
  }
  const existing = node.children.get(key);
  if (existing !== undefined) {
    return existing;
  }
  const created = emptyNode();
  node.children.set(key, created);
  return created;
}

function emptyNode() {
  return { children: new Map(), methods: new Map() };
}

export function sortedKeys(node) {
  return [...node.children.keys(), ...node.methods.keys()].sort();
}
