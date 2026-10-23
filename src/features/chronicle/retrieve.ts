import type { MemoryIndex } from "./memory-index";

export type RetrievedMoment = {
  memoryId: string;
  score: number;
};

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error("Vectors must have the same, non-zero length");
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// The model only supplies vectors. The app ranks, filters, and decides.
export function retrieveMoments(
  index: MemoryIndex,
  queryVector: number[],
  options: { limit: number; minScore: number },
): RetrievedMoment[] {
  if (queryVector.length !== index.dimensions) {
    throw new Error(
      `Query has ${queryVector.length} dimensions; the index uses ${index.dimensions}`,
    );
  }
  return index.entries
    .map((entry) => ({
      memoryId: entry.memoryId,
      score: cosineSimilarity(entry.vector, queryVector),
    }))
    .filter((moment) => moment.score >= options.minScore)
    .sort((a, b) => b.score - a.score || a.memoryId.localeCompare(b.memoryId))
    .slice(0, options.limit);
}
