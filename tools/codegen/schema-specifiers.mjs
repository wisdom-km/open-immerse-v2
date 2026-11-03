import ts from "typescript";

export function readSpecifiers(sourceText, sourcePath) {
  const source = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );
  rejectDynamicImport(source, sourcePath);
  return unique(moduleSpecifiers(source));
}

function rejectDynamicImport(source, sourcePath) {
  const visit = (node) => {
    if (isDynamicImport(node)) {
      throw new Error(`dynamic import: ${sourcePath}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function isDynamicImport(node) {
  return (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword
  );
}

function moduleSpecifiers(source) {
  const found = [];
  const visit = (node) => {
    const spec = specifierOf(node);
    if (spec !== undefined) {
      found.push(spec);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function specifierOf(node) {
  if (!hasStringSpecifier(node)) {
    return undefined;
  }
  return node.moduleSpecifier.text;
}

function hasStringSpecifier(node) {
  return (
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
    node.moduleSpecifier !== undefined &&
    ts.isStringLiteral(node.moduleSpecifier)
  );
}

function unique(specs) {
  const found = [];
  for (const spec of specs) {
    if (!found.includes(spec)) {
      found.push(spec);
    }
  }
  return found;
}

export function applySpecifiers(code, mapped) {
  const specs = [...mapped.keys()].sort(
    (left, right) => right.length - left.length,
  );
  return specs.reduce(
    (next, spec) => replaceSpecifier(next, spec, mapped),
    code,
  );
}

function replaceSpecifier(code, spec, mapped) {
  const href = mapped.get(spec);
  if (href === undefined) {
    return code;
  }
  const quoted = JSON.stringify(href);
  return code.split(`"${spec}"`).join(quoted).split(`'${spec}'`).join(quoted);
}
