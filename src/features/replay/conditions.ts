// Parameters, preconditions, and stop conditions proposed from narration.
// Same rule as frames: the model proposes, this gate decides what can be shown, a person accepts.
import { normalizeForMatch, type ChatMessage } from "./proposals.ts";
import type { Parameter, Tape } from "./tape.ts";

const quoted = { type: "string" } as const;

export const CONDITIONS_JSON_SCHEMA = {
  type: "object",
  properties: {
    parameters: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        properties: { name: { type: "string" }, example: { type: "string" }, quote: quoted },
        required: ["name", "example", "quote"],
      },
    },
    preconditions: {
      type: "array",
      maxItems: 6,
      items: { type: "object", properties: { text: { type: "string" }, quote: quoted }, required: ["text", "quote"] },
    },
    stopConditions: {
      type: "array",
      maxItems: 6,
      items: { type: "object", properties: { text: { type: "string" }, quote: quoted }, required: ["text", "quote"] },
    },
  },
  required: ["parameters", "preconditions", "stopConditions"],
} as const;

export function buildConditionsHistory(transcript: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You read a spoken demonstration of a repeatable task. List: parameters (values that change on each run, with a snake_case name and the example value that was said), " +
        "preconditions (what must be true before starting), and stop conditions (when the person said to stop or ask for help). " +
        "For every item, copy the exact supporting words from the narration into quote. Leave a list empty if nothing was said. Answer only with JSON.",
    },
    { role: "user", content: `Narration:\n${transcript}` },
  ];
}

export type ProposedParameter = Parameter & { quote: string };
export type ProposedCondition = { text: string; quote: string };
export type ConditionsResult = {
  parameters: ProposedParameter[];
  preconditions: ProposedCondition[];
  stopConditions: ProposedCondition[];
  rejected: { item: string; reason: string }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

export function toParameterName(raw: string) {
  return raw
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function parseConditions(raw: string, transcript: string): ConditionsResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("The model did not return JSON");
  }
  if (!isRecord(json)) throw new Error("The model's JSON is not an object");
  const haystack = normalizeForMatch(transcript);
  const grounded = (quote: string) => normalizeForMatch(quote).length >= 8 && haystack.includes(normalizeForMatch(quote));
  const result: ConditionsResult = { parameters: [], preconditions: [], stopConditions: [], rejected: [] };

  const names = new Set<string>();
  for (const item of Array.isArray(json.parameters) ? json.parameters.slice(0, 6) : []) {
    const r = isRecord(item) ? item : {};
    const name = toParameterName(str(r.name));
    const example = str(r.example);
    const quote = str(r.quote);
    const label = name || "(unnamed parameter)";
    if (!/^[a-z][a-z0-9_]*$/.test(name)) result.rejected.push({ item: label, reason: "Name is not usable as a parameter" });
    else if (names.has(name)) result.rejected.push({ item: label, reason: "Duplicate parameter" });
    else if (!grounded(quote)) result.rejected.push({ item: label, reason: "Quote does not appear in the narration" });
    else if (!example || !normalizeForMatch(quote).includes(normalizeForMatch(example))) {
      result.rejected.push({ item: label, reason: "Example value is not in the quoted words" });
    } else {
      names.add(name);
      result.parameters.push({ name, example, quote });
    }
  }

  for (const key of ["preconditions", "stopConditions"] as const) {
    const list = json[key];
    for (const item of Array.isArray(list) ? list.slice(0, 6) : []) {
      const r = isRecord(item) ? item : {};
      const text = str(r.text);
      const quote = str(r.quote);
      if (!text || text.length > 160) result.rejected.push({ item: text || "(empty)", reason: "Text is empty or too long" });
      else if (!grounded(quote)) result.rejected.push({ item: text, reason: "Quote does not appear in the narration" });
      else result[key].push({ text, quote });
    }
  }
  return result;
}

// Deterministic merge of what a person accepted. Existing entries win; nothing is overwritten.
export function mergeConditions(
  tape: Tape,
  accepted: { parameters: Parameter[]; preconditions: string[]; stopConditions: string[] },
) {
  const known = new Set(tape.parameters.map((p) => p.name));
  const uniq = (current: string[], extra: string[]) => {
    const seen = new Set(current.map(normalizeForMatch));
    return [...current, ...extra.filter((t) => !seen.has(normalizeForMatch(t)))];
  };
  return {
    parameters: [...tape.parameters, ...accepted.parameters.filter((p) => !known.has(p.name)).map(({ name, example }) => ({ name, example }))],
    preconditions: uniq(tape.preconditions, accepted.preconditions),
    stopConditions: uniq(tape.stopConditions, accepted.stopConditions),
  };
}
