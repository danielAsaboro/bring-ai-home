import { cosine } from "./notes-index";
import type { Card, Library } from "./deck";

// Evidence cards already written in any deck are a reusable pool. Embeddings
// rank them against a claim; the app applies the floor; a person reuses one.

export type EvidenceCandidate = { card: Card; deckId: string; deckTitle: string };
export type RankedEvidence = EvidenceCandidate & { score: number };

export const EVIDENCE_MIN_SCORE = 0.55;

export function cardText(card: Pick<Card, "title" | "body">): string {
  return `${card.title}: ${card.body}`.slice(0, 1000);
}

// Every evidence card in the library, except ones already in the target deck
// (matched by title, since a reused card is a copy with a new id).
export function evidenceCandidates(library: Library, deckId: string): EvidenceCandidate[] {
  const target = library.decks.find((d) => d.id === deckId);
  const present = new Set(target?.cards.map((c) => c.title.toLowerCase()) ?? []);
  return library.decks.flatMap((deck) =>
    deck.cards
      .filter((c) => c.kind === "evidence" && (deck.id !== deckId ? !present.has(c.title.toLowerCase()) : false))
      .map((card) => ({ card, deckId: deck.id, deckTitle: deck.title })),
  );
}

export function rankEvidence(
  claimVector: number[],
  candidates: EvidenceCandidate[],
  vectors: number[][],
  { minScore = EVIDENCE_MIN_SCORE, limit = 3 } = {},
): RankedEvidence[] {
  if (vectors.length !== candidates.length) throw new Error(`Expected ${candidates.length} vectors, received ${vectors.length}`);
  return candidates
    .map((c, i) => ({ ...c, score: cosine(claimVector, vectors[i]) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
