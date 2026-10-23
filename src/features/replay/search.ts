// Ranking is plain code. The model only turns text into vectors.

export type IndexedTape = { tapeId: string; vector: number[] };
export type TapeMatch = { tapeId: string; score: number };

export function cosine(a: readonly number[], b: readonly number[]) {
  if (a.length !== b.length || a.length === 0) throw new Error("Vectors must have the same, non-zero length");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

export function rankTapes(
  index: readonly IndexedTape[],
  query: readonly number[],
  { limit = 3, minScore = 0.5 }: { limit?: number; minScore?: number } = {},
): TapeMatch[] {
  return index
    .map((entry) => ({ tapeId: entry.tapeId, score: Math.round(cosine(entry.vector, query) * 1000) / 1000 }))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score || a.tapeId.localeCompare(b.tapeId))
    .slice(0, limit);
}

// The manual fallback: plain word matching, always available.
export function filterByWords<T extends { title: string; summary: string }>(tapes: readonly T[], query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...tapes];
  return tapes.filter((t) => words.every((w) => `${t.title} ${t.summary}`.toLowerCase().includes(w)));
}
