import { pacing, playOrder, type Card, type Deck } from "./deck";
import { cosine } from "./notes-index";

// Pacing rules are plain arithmetic. Duplicate beats use embedding similarity,
// but the app sets the threshold and a person decides what to cut.

export type HealthFlag = { id: string; kind: "heavy-round" | "empty-round" | "long-card" | "duplicate-beat"; message: string; cardIds: string[] };

export const HEAVY_ROUND_SHARE = 0.5;
export const LONG_CARD_SECONDS = 90;
export const DUPLICATE_MIN_SCORE = 0.9;

export function pacingFlags(deck: Deck): HealthFlag[] {
  const flags: HealthFlag[] = [];
  const { rounds } = pacing(deck);
  for (const r of rounds) {
    if (r.cards === 0) flags.push({ id: `empty-${r.roundId}`, kind: "empty-round", message: `Round “${r.title}” has no cards.`, cardIds: [] });
    else if (rounds.length > 1 && r.share > HEAVY_ROUND_SHARE)
      flags.push({ id: `heavy-${r.roundId}`, kind: "heavy-round", message: `Round “${r.title}” takes ${Math.round(r.share * 100)}% of the match.`, cardIds: [] });
  }
  for (const c of deck.cards) {
    if (c.seconds > LONG_CARD_SECONDS) flags.push({ id: `long-${c.id}`, kind: "long-card", message: `“${c.title}” runs ${c.seconds}s; one card should carry one beat.`, cardIds: [c.id] });
  }
  return flags;
}

export function duplicateBeats(cards: Card[], vectors: number[][], minScore = DUPLICATE_MIN_SCORE): HealthFlag[] {
  if (vectors.length !== cards.length) throw new Error(`Expected ${cards.length} vectors, received ${vectors.length}`);
  const flags: HealthFlag[] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const score = cosine(vectors[i], vectors[j]);
      if (score >= minScore) {
        flags.push({
          id: `dup-${cards[i].id}-${cards[j].id}`,
          kind: "duplicate-beat",
          message: `“${cards[i].title}” and “${cards[j].title}” make the same point (similarity ${score.toFixed(2)}).`,
          cardIds: [cards[i].id, cards[j].id],
        });
      }
    }
  }
  return flags;
}

export function cardsInPlayOrder(deck: Deck): Card[] {
  return playOrder(deck);
}
