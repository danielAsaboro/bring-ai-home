import type { Embedder } from "./manual-index.ts";

// A deterministic bag-of-words embedder for tests only. It is not a model and
// its scores say nothing about how GTE_LARGE_FP16 would rank these pages.
export const FIXTURE_DIMENSIONS = 64;

function hash(word: string): number {
  let h = 0;
  for (const ch of word) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % FIXTURE_DIMENSIONS;
}

export function fixtureVector(text: string): number[] {
  const v = new Array(FIXTURE_DIMENSIONS).fill(0);
  for (const word of text.toLowerCase().match(/[a-z]{4,}/g) ?? []) v[hash(word)] += 1;
  return v;
}

export const fixtureEmbedder: Embedder = async (texts) => texts.map(fixtureVector);
