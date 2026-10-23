// The closed rule vocabulary. Every rule is plain data, readable, and deterministic.
export type Rule =
  | { kind: "trim"; collapse: boolean }
  | { kind: "split"; separator: string; order: number[]; join: string }
  | { kind: "case"; to: "upper" | "lower" | "title" }
  | { kind: "replace"; find: string; with: string }
  | { kind: "format"; template: string };

export type RuleKind = Rule["kind"];

export const RULE_KINDS: RuleKind[] = ["trim", "split", "case", "replace", "format"];

export function defaultRule(kind: RuleKind): Rule {
  switch (kind) {
    case "trim":
      return { kind, collapse: true };
    case "split":
      return { kind, separator: ",", order: [1, 0], join: " " };
    case "case":
      return { kind, to: "title" };
    case "replace":
      return { kind, find: "", with: "" };
    case "format":
      return { kind, template: "{value}" };
  }
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, lead: string, ch: string) => lead + ch.toUpperCase());
}

export function applyRule(rule: Rule, value: string): string {
  switch (rule.kind) {
    case "trim": {
      const trimmed = value.trim();
      return rule.collapse ? trimmed.replace(/\s+/g, " ") : trimmed;
    }
    case "split": {
      if (rule.separator === "") return value;
      const parts = value.split(rule.separator).map((p) => p.trim());
      return rule.order
        .map((i) => parts[i])
        .filter((p): p is string => p !== undefined && p !== "")
        .join(rule.join);
    }
    case "case":
      if (rule.to === "upper") return value.toUpperCase();
      if (rule.to === "lower") return value.toLowerCase();
      return titleCase(value);
    case "replace":
      return rule.find === "" ? value : value.split(rule.find).join(rule.with);
    case "format":
      return rule.template.split("{value}").join(value);
  }
}

export type WeaveStep = { rule: Rule; before: string; after: string };

// Run an ordered weave. The input string is never modified; every step is kept.
export function runWeave(rules: readonly Rule[], input: string): { output: string; steps: WeaveStep[] } {
  const steps: WeaveStep[] = [];
  let value = input;
  for (const rule of rules) {
    const after = applyRule(rule, value);
    steps.push({ rule, before: value, after });
    value = after;
  }
  return { output: value, steps };
}

const show = (s: string) => JSON.stringify(s);

export function describeRule(rule: Rule): string {
  switch (rule.kind) {
    case "trim":
      return rule.collapse ? "Trim the ends and collapse inner spaces" : "Trim the ends";
    case "split":
      return `Split on ${show(rule.separator)}, keep parts ${rule.order.map((i) => i + 1).join(", ")}, join with ${show(rule.join)}`;
    case "case":
      return `Change to ${rule.to} case`;
    case "replace":
      return `Replace ${show(rule.find)} with ${show(rule.with)}`;
    case "format":
      return `Format as ${show(rule.template)}`;
  }
}
