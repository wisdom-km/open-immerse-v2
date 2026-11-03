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
  const source = ts.createSourceFile(
    "schema-emit.mjs",
    code,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.JS,
  );
  return applyEdits(code, specifierEdits(source, mapped));
}

function specifierEdits(source, mapped) {
  const edits = [];
  const visit = (node) => {
    const edit = specifierEdit(source, node, mapped);
    if (edit !== undefined) {
      edits.push(edit);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return edits;
}

function specifierEdit(source, node, mapped) {
  if (!hasStringSpecifier(node)) {
    return undefined;
  }
  const href = mapped.get(node.moduleSpecifier.text);
  if (href === undefined) {
    return undefined;
  }
  return {
    start: node.moduleSpecifier.getStart(source),
    end: node.moduleSpecifier.getEnd(),
    text: JSON.stringify(href),
  };
}

function applyEdits(code, edits) {
  const ordered = [...edits].sort((left, right) => right.start - left.start);
  return ordered.reduce(
    (next, edit) =>
      next.slice(0, edit.start) + edit.text + next.slice(edit.end),
    code,
  );
}
