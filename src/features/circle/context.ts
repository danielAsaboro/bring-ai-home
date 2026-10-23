import type { Person, Reminder } from "./types";

export type Passage = { id: string; text: string };
export type ContextMatch = Passage & { score: number };

// Only what the person already confirmed is searchable.
export function passagesFor(person: Person, reminders: Reminder[]): Passage[] {
  return [
    ...person.timeline.map((t) => ({ id: t.id, text: `${t.date} ${t.kind}: ${t.text}` })),
    ...reminders
      .filter((r) => r.personId === person.id && !r.done)
      .map((r) => ({ id: r.id, text: `Open reminder for ${r.due}: ${r.text}` })),
  ];
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) throw new Error("Vectors must have the same length");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

export function rankContext(
  query: number[],
  passages: Passage[],
  vectors: number[][],
  options: { limit: number; minScore: number },
): ContextMatch[] {
  if (vectors.length !== passages.length) throw new Error("One vector per passage");
  return passages
    .map((p, i) => ({ ...p, score: Math.round(cosine(query, vectors[i]) * 1000) / 1000 }))
    .filter((m) => m.score >= options.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit);
}
