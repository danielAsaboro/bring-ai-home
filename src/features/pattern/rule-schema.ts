import type { Rule } from "./rules.ts";

export const LIMITS = { maxRules: 6, maxText: 40, maxParts: 6 } as const;

export type ProposalCheck =
  | { ok: true; rules: Rule[] }
  | { ok: false; reasons: string[] };

const KEYS: Record<Rule["kind"], string[]> = {
  trim: ["kind", "collapse"],
  split: ["kind", "separator", "order", "join"],
  case: ["kind", "to"],
  replace: ["kind", "find", "with"],
  format: ["kind", "template"],
};

function readableText(value: unknown, allowEmpty: boolean): value is string {
  return (
    typeof value === "string" &&
    value.length <= LIMITS.maxText &&
    (allowEmpty || value.length > 0) &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function checkRule(value: unknown): Rule | string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "is not an object";
  const v = value as Record<string, unknown>;
  const kind = v.kind as Rule["kind"];
  if (!(kind in KEYS)) return `has unknown kind ${JSON.stringify(v.kind)}`;
  const extra = Object.keys(v).filter((k) => !KEYS[kind].includes(k));
  if (extra.length > 0) return `has unexpected fields ${extra.join(", ")}`;
  switch (kind) {
    case "trim":
      return typeof v.collapse === "boolean" ? { kind, collapse: v.collapse } : "needs collapse true or false";
    case "split": {
      const order = v.order;
      if (!readableText(v.separator, false) || !readableText(v.join, true)) return "needs a short separator and join";
      if (
        !Array.isArray(order) ||
        order.length === 0 ||
        order.length > LIMITS.maxParts ||
        !order.every((n) => Number.isInteger(n) && n >= 0 && n < LIMITS.maxParts)
      ) {
        return `needs 1 to ${LIMITS.maxParts} part numbers`;
      }
      return { kind, separator: v.separator as string, order: order as number[], join: v.join as string };
    }
    case "case":
      return v.to === "upper" || v.to === "lower" || v.to === "title" ? { kind, to: v.to } : "needs to: upper, lower, or title";
    case "replace":
      return readableText(v.find, false) && readableText(v.with, true)
        ? { kind, find: v.find as string, with: v.with as string }
        : "needs short literal find and with text";
    case "format":
      return readableText(v.template, false) && (v.template as string).split("{value}").length === 2
        ? { kind, template: v.template as string }
        : "needs a short template with exactly one {value}";
  }
}

// The model proposes. This gate decides whether a proposal is even readable.
// Anything outside the closed vocabulary is rejected whole, with reasons a person can read.
export function checkProposal(candidate: unknown): ProposalCheck {
  if (!Array.isArray(candidate)) return { ok: false, reasons: ["Proposal is not a list of rules"] };
  if (candidate.length === 0) return { ok: false, reasons: ["Proposal has no rules"] };
  if (candidate.length > LIMITS.maxRules) return { ok: false, reasons: [`Proposal has more than ${LIMITS.maxRules} rules`] };
  const rules: Rule[] = [];
  const reasons: string[] = [];
  candidate.forEach((item, i) => {
    const result = checkRule(item);
    if (typeof result === "string") reasons.push(`Rule ${i + 1} ${result}`);
    else rules.push(result);
  });
  return reasons.length > 0 ? { ok: false, reasons } : { ok: true, rules };
}
