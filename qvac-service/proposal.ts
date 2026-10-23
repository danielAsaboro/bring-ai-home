import type { Example } from "../src/features/pattern/patterns.ts";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const PROPOSAL_SYSTEM_PROMPT = [
  "You turn before/after text examples into an ordered list of transformation rules.",
  "Reply with only a JSON array. Each item is one of:",
  '{"kind":"trim","collapse":true}',
  '{"kind":"split","separator":",","order":[1,0],"join":" "}  (order lists zero-based parts to keep)',
  '{"kind":"case","to":"upper"|"lower"|"title"}',
  '{"kind":"replace","find":"text","with":"text"}  (literal text, not a regular expression)',
  '{"kind":"format","template":"prefix {value} suffix"}',
  "Use as few rules as possible. Do not explain.",
].join("\n");

export function formatExamples(examples: readonly Pick<Example, "before" | "after">[]): string {
  return examples
    .map((e, i) => `Example ${i + 1}\nbefore: ${JSON.stringify(e.before)}\nafter: ${JSON.stringify(e.after)}`)
    .join("\n\n");
}

export function buildProposalHistory(examples: readonly Pick<Example, "before" | "after">[]): ChatMessage[] {
  if (examples.length === 0) throw new Error("A proposal needs at least one example");
  return [
    { role: "system", content: PROPOSAL_SYSTEM_PROMPT },
    { role: "user", content: formatExamples(examples) },
  ];
}

// Lesson 02 keeps this loose on purpose: find the JSON array and return it untrusted.
export function extractProposal(raw: string): unknown[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("The model reply contains no JSON array");
  const parsed: unknown = JSON.parse(raw.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("The model reply is not a JSON array");
  return parsed;
}
