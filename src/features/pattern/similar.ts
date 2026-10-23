import type { Pattern } from "./patterns.ts";

// The text that represents a saved pattern. Built from what a person wrote.
export function patternText(p: Pick<Pattern, "name" | "description" | "examples">): string {
  return [p.name, p.description, ...p.examples.map((e) => `${e.before} -> ${e.after}`)].join("\n");
}

export function cosine(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) throw new Error("Vectors must have the same non-zero length");
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

export type Match = { id: string; name: string; score: number };

// Similarity only suggests where to look. It never copies rules between patterns.
export function rankSimilar(
  patterns: readonly Pick<Pattern, "id" | "name">[],
  vectors: readonly number[][],
  targetId: string,
  options: { limit: number; minScore: number },
): Match[] {
  if (patterns.length !== vectors.length) throw new Error("Each pattern needs exactly one vector");
  const target = patterns.findIndex((p) => p.id === targetId);
  if (target === -1) throw new Error(`No pattern ${targetId}`);
  return patterns
    .map((p, i) => ({ id: p.id, name: p.name, score: cosine(vectors[target], vectors[i]) }))
    .filter((m) => m.id !== targetId && m.score >= options.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit);
}
