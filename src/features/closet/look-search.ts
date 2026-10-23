import type { Garment, Look } from "./model";

// The text a look is embedded as. Built from fields a person wrote.
export function lookText(look: Look, garments: readonly Garment[]): string {
  const names = look.garmentIds
    .map((id) => garments.find((g) => g.id === id))
    .filter((g): g is Garment => !!g)
    .map((g) => `${g.colour} ${g.name}`.trim());
  return `${look.title}. Occasion: ${look.occasion}. Wearing: ${names.join(", ")}.`;
}

export function cosine(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) throw new Error("Vectors must have the same non-zero length");
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

export type LookMatch = { lookId: string; score: number };

// Embeddings rank; the threshold and the limit are the app's decision.
export function rankLooks(
  lookIds: readonly string[],
  lookVectors: readonly number[][],
  queryVector: readonly number[],
  options: { limit?: number; minScore?: number } = {},
): LookMatch[] {
  const { limit = 3, minScore = 0.35 } = options;
  if (lookIds.length !== lookVectors.length) throw new Error("One vector per look is required");
  return lookIds
    .map((lookId, i) => ({ lookId, score: cosine(lookVectors[i], queryVector) }))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// The manual path: plain word overlap, used when no local model is running.
export function keywordLooks(query: string, looks: readonly Look[], garments: readonly Garment[], limit = 3): LookMatch[] {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (words.length === 0) return [];
  return looks
    .map((look) => {
      const text = lookText(look, garments).toLowerCase();
      return { lookId: look.id, score: words.filter((w) => text.includes(w)).length / words.length };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
