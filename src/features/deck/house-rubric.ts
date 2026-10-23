import { playOrder, type Deck } from "./deck";

// The house rubric is fixed. A critique may only cite these ids and cards that
// exist in the deck. The LoRA adapter changes the model's voice, not this rule.

export const HOUSE_RUBRIC = [
  { id: "one-beat", label: "One beat per card" },
  { id: "evidence-follows-claim", label: "Every claim is followed by evidence" },
  { id: "specific-ask", label: "The ask names who does what by when" },
  { id: "audience-first", label: "The opening speaks to the named audience" },
] as const;

export type RubricId = (typeof HOUSE_RUBRIC)[number]["id"];
export type CritiqueFinding = { rubricId: RubricId; cardId: string | null; note: string };

export const RUBRIC_SYSTEM_PROMPT = `You critique presentation decks against the house rubric: ${HOUSE_RUBRIC.map((r) => `${r.id} (${r.label})`).join("; ")}. Return JSON findings. Cite a card id or null. Keep each note under 160 characters.`;

export const CRITIQUE_JSON_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          rubricId: { type: "string", enum: HOUSE_RUBRIC.map((r) => r.id) },
          cardId: { type: ["string", "null"] },
          note: { type: "string" },
        },
        required: ["rubricId", "cardId", "note"],
      },
    },
  },
  required: ["findings"],
} as const;

// The same outline format is used in the training dataset and at run time.
export function deckOutline(deck: Pick<Deck, "title" | "audience" | "rounds" | "cards">): string {
  const lines = [`Deck: ${deck.title}`, `Audience: ${deck.audience || "not set"}`];
  for (const round of deck.rounds) {
    lines.push(`Round: ${round.title}`);
    for (const c of playOrder(deck as Deck).filter((x) => x.roundId === round.id)) {
      lines.push(`- [${c.id}] ${c.kind}: ${c.title} — ${c.body}`);
    }
  }
  return lines.join("\n");
}

export function buildCritiqueHistory(deck: Deck) {
  return [
    { role: "system", content: RUBRIC_SYSTEM_PROMPT },
    { role: "user", content: deckOutline(deck) },
  ];
}

export function parseCritique(text: string, deck: Pick<Deck, "cards">): { findings: CritiqueFinding[]; dropped: number } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The model did not return JSON");
  }
  const raw = (data as { findings?: unknown })?.findings;
  if (!Array.isArray(raw)) throw new Error("The model response has no findings array");
  const rubricIds = new Set<string>(HOUSE_RUBRIC.map((r) => r.id));
  const cardIds = new Set(deck.cards.map((c) => c.id));
  const findings: CritiqueFinding[] = [];
  for (const item of raw) {
    const f = item as { rubricId?: unknown; cardId?: unknown; note?: unknown };
    const note = typeof f.note === "string" ? f.note.trim() : "";
    const cardOk = f.cardId === null || (typeof f.cardId === "string" && cardIds.has(f.cardId));
    if (typeof f.rubricId === "string" && rubricIds.has(f.rubricId) && cardOk && note && note.length <= 200) {
      findings.push({ rubricId: f.rubricId as RubricId, cardId: (f.cardId as string | null) ?? null, note });
    }
  }
  return { findings, dropped: raw.length - findings.length };
}

export function rubricLabel(id: RubricId): string {
  return HOUSE_RUBRIC.find((r) => r.id === id)?.label ?? id;
}
