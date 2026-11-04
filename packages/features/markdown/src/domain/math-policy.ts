import { FORMULA_MAX_CHARS, UNTRUSTED_LATEX_COMMANDS } from "@oi/contracts";
import type { MdMathBlocked } from "@oi/contracts";

export type FormulaBudget = Readonly<{
  maxFormulas: number | null;
  maxTexChars: number | null;
}>;

export function formulaBlocked(tex: string): MdMathBlocked | null {
  const untrusted = UNTRUSTED_LATEX_COMMANDS.some((command) =>
    tex.includes(command),
  );
  if (untrusted) {
    return "untrusted_command";
  }
  if (tex.length > FORMULA_MAX_CHARS) {
    return "too_long";
  }
  return null;
}

export function overFormulaBudget(
  formulas: readonly Readonly<{ tex: string }>[],
  budget: FormulaBudget,
): boolean {
  const count = budget.maxFormulas;
  if (count !== null && formulas.length > count) {
    return true;
  }
  const limit = budget.maxTexChars;
  if (limit === null) {
    return false;
  }
  const total = formulas.reduce((sum, formula) => sum + formula.tex.length, 0);
  return total > limit;
}
