export type IndexedEntry = { entryId: string; vector: number[] };
export type Match = { entryId: string; score: number };

export function cosine(a: number[], b: number[]): number {
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

/** Deterministic ranking: score descending, then entry ID, with a floor. */
export function rankSimilar(
  index: IndexedEntry[],
  query: number[],
  options: { limit: number; minScore: number },
): Match[] {
  return index
    .map((item) => ({ entryId: item.entryId, score: Math.round(cosine(item.vector, query) * 1000) / 1000 }))
    .filter((match) => match.score >= options.minScore)
    .sort((a, b) => b.score - a.score || a.entryId.localeCompare(b.entryId))
    .slice(0, options.limit);
}
