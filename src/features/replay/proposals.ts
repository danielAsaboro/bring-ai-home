// Turning narration into proposed frames.
// The model proposes. This file decides what is even allowed to be shown. A person accepts.

export type ChatMessage = { role: "system" | "user"; content: string };

export const MAX_PROPOSED_STEPS = 12;

export const STEPS_JSON_SCHEMA = {
  type: "object",
  properties: {
    steps: {
      type: "array",
      maxItems: MAX_PROPOSED_STEPS,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          quote: { type: "string" },
        },
        required: ["title", "detail", "quote"],
      },
    },
  },
  required: ["steps"],
} as const;

export function buildStepsHistory(input: { transcript: string; screenNotes: string[] }): ChatMessage[] {
  const notes = input.screenNotes.length
    ? `\n\nScreen notes from screenshots (may be incomplete):\n${input.screenNotes.map((n) => `- ${n}`).join("\n")}`
    : "";
  return [
    {
      role: "system",
      content:
        "You turn a spoken demonstration into a short checklist. Each step is one action a person does by hand. " +
        "Use a short imperative title. For every step, copy the exact words from the narration that support it into quote. " +
        "Do not add steps that were not said. Answer only with JSON.",
    },
    { role: "user", content: `Narration:\n${input.transcript}${notes}` },
  ];
}

export type StepProposal = { id: string; title: string; detail: string; quote: string };
export type Rejection = { title: string; reason: string };
export type ProposalResult = { proposals: StepProposal[]; rejected: Rejection[] };

export function normalizeForMatch(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The deterministic gate. JSON Schema shapes the output; it cannot make it true.
export function parseStepProposals(raw: string, transcript: string): ProposalResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("The model did not return JSON");
  }
  if (!isRecord(json) || !Array.isArray(json.steps)) throw new Error("The model's JSON has no steps list");
  const haystack = normalizeForMatch(transcript);
  const proposals: StepProposal[] = [];
  const rejected: Rejection[] = [];
  const seen = new Set<string>();
  for (const item of json.steps.slice(0, MAX_PROPOSED_STEPS)) {
    if (!isRecord(item) || typeof item.title !== "string") {
      rejected.push({ title: "(unreadable)", reason: "Step is not an object with a title" });
      continue;
    }
    const title = item.title.replace(/\s+/g, " ").trim();
    const detail = typeof item.detail === "string" ? item.detail.replace(/\s+/g, " ").trim() : "";
    const quote = typeof item.quote === "string" ? item.quote.trim() : "";
    const key = normalizeForMatch(title);
    if (!title || title.length > 80) {
      rejected.push({ title: title || "(empty)", reason: "Title is empty or longer than 80 characters" });
    } else if (seen.has(key)) {
      rejected.push({ title, reason: "Duplicate of an earlier step" });
    } else if (normalizeForMatch(quote).length < 8 || !haystack.includes(normalizeForMatch(quote))) {
      rejected.push({ title, reason: "Quote does not appear in the narration" });
    } else {
      seen.add(key);
      proposals.push({ id: `p${proposals.length + 1}`, title, detail, quote });
    }
  }
  return { proposals, rejected };
}
