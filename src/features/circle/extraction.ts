// Structured output is a proposal. The app checks every field before a
// person ever sees it, and the person decides what is saved (chapter 05).
export type ProposalType = "memory" | "promise" | "date";

export type Proposal = {
  id: string;
  type: ProposalType;
  personId: string;
  personName: string;
  text: string;
  evidence: string;
  date?: string;
};

export type Rejection = { item: unknown; reason: string };

export type ExtractionResult = {
  status: "proposed";
  model: string;
  proposals: Proposal[];
  rejected: Rejection[];
};

export type KnownPerson = { id: string; name: string };

export const PROPOSAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "person", "text", "evidence"],
        properties: {
          type: { type: "string", enum: ["memory", "promise", "date"] },
          person: { type: "string" },
          text: { type: "string" },
          evidence: { type: "string" },
          date: { type: "string" },
        },
      },
    },
  },
} as const;

export function buildExtractionPrompt(
  transcript: string,
  people: KnownPerson[],
  today: string,
): string {
  return [
    `Today is ${today}. Read this voice recap about people I know.`,
    `Known people: ${people.map((p) => p.name).join(", ")}.`,
    "List only what the recap states:",
    '- "memory": something the person shared about their life.',
    '- "promise": something I said I would do for them. Add "date" (YYYY-MM-DD) only if a day is stated.',
    '- "date": an important date for them, with "date" as YYYY-MM-DD.',
    'For every item, copy "evidence" word for word from the recap.',
    "Use the person's full name from the known list. If unsure, leave it out.",
    "",
    `Recap: """${transcript}"""`,
  ].join("\n");
}

function normal(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function realDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

function matchPerson(name: string, people: KnownPerson[]): KnownPerson | undefined {
  const wanted = normal(name);
  if (!wanted) return undefined;
  const exact = people.find((p) => normal(p.name) === wanted);
  if (exact) return exact;
  const byFirst = people.filter((p) => normal(p.name).split(" ")[0] === wanted);
  return byFirst.length === 1 ? byFirst[0] : undefined;
}

export function parseExtraction(
  raw: string,
  context: { transcript: string; people: KnownPerson[]; today: string; model: string },
): ExtractionResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The model did not return JSON");
  }
  const items = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(items)) throw new Error("The model response has no items list");

  const transcript = normal(context.transcript);
  const proposals: Proposal[] = [];
  const rejected: Rejection[] = [];
  items.forEach((item: unknown, index) => {
    const reject = (reason: string) => rejected.push({ item, reason });
    const i = item as Record<string, unknown>;
    if (!i || typeof i !== "object") return reject("not an object");
    const type = i.type;
    if (type !== "memory" && type !== "promise" && type !== "date") return reject("unknown type");
    if (typeof i.text !== "string" || !i.text.trim()) return reject("empty text");
    if (typeof i.evidence !== "string" || !normal(i.evidence)) return reject("no evidence");
    if (!transcript.includes(normal(i.evidence))) return reject("evidence is not in the recap");
    const person = typeof i.person === "string" ? matchPerson(i.person, context.people) : undefined;
    if (!person) return reject("unknown person");
    let date: string | undefined;
    if (typeof i.date === "string" && i.date.trim()) {
      if (!realDate(i.date)) return reject("not a real date");
      date = i.date;
    }
    if (type === "date" && !date) return reject("date item without a date");
    if (type === "memory") date = undefined;
    if (type === "promise" && date && date < context.today) return reject("promise date is in the past");
    proposals.push({
      id: `p${index}`,
      type,
      personId: person.id,
      personName: person.name,
      text: i.text.trim(),
      evidence: i.evidence.trim(),
      ...(date ? { date } : {}),
    });
  });
  return { status: "proposed", model: context.model, proposals, rejected };
}
