// Deck's product model. Every operation is pure: it takes a library and
// returns a new one, so the UI never edits state in place.

export type CardKind = "claim" | "evidence";
export type Treatment = "headline" | "quiet" | "data";

export type Card = {
  id: string;
  kind: CardKind;
  title: string;
  body: string;
  treatment: Treatment;
  seconds: number;
  roundId: string;
  source?: string;
};

export type Round = { id: string; title: string };

export type Deck = {
  id: string;
  title: string;
  audience: string;
  rounds: Round[];
  cards: Card[];
};

export type Library = { decks: Deck[]; activeDeckId: string };

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function activeDeck(library: Library): Deck {
  return library.decks.find((d) => d.id === library.activeDeckId) ?? library.decks[0];
}

function updateDeck(library: Library, deckId: string, change: (deck: Deck) => Deck): Library {
  return { ...library, decks: library.decks.map((d) => (d.id === deckId ? change(d) : d)) };
}

export function createDeck(library: Library, title: string, audience: string): Library {
  const roundId = newId("round");
  const deck: Deck = {
    id: newId("deck"),
    title: title.trim() || "Untitled deck",
    audience: audience.trim(),
    rounds: [{ id: roundId, title: "Opening" }],
    cards: [],
  };
  return { decks: [...library.decks, deck], activeDeckId: deck.id };
}

export function addCard(
  library: Library,
  deckId: string,
  card: Omit<Card, "id"> & { id?: string },
): Library {
  return updateDeck(library, deckId, (deck) => ({
    ...deck,
    cards: [...deck.cards, { ...card, id: card.id ?? newId("card"), seconds: clampSeconds(card.seconds) }],
  }));
}

export function updateCard(library: Library, deckId: string, cardId: string, patch: Partial<Omit<Card, "id">>): Library {
  return updateDeck(library, deckId, (deck) => ({
    ...deck,
    cards: deck.cards.map((c) =>
      c.id === cardId ? { ...c, ...patch, seconds: clampSeconds(patch.seconds ?? c.seconds) } : c,
    ),
  }));
}

export function removeCard(library: Library, deckId: string, cardId: string): Library {
  return updateDeck(library, deckId, (deck) => ({ ...deck, cards: deck.cards.filter((c) => c.id !== cardId) }));
}

// Swap a card with its neighbour inside the same round.
export function moveCard(library: Library, deckId: string, cardId: string, direction: -1 | 1): Library {
  return updateDeck(library, deckId, (deck) => {
    const card = deck.cards.find((c) => c.id === cardId);
    if (!card) return deck;
    const sameRound = deck.cards.filter((c) => c.roundId === card.roundId);
    const neighbour = sameRound[sameRound.indexOf(card) + direction];
    if (!neighbour) return deck;
    const cards = [...deck.cards];
    const a = cards.indexOf(card);
    const b = cards.indexOf(neighbour);
    [cards[a], cards[b]] = [cards[b], cards[a]];
    return { ...deck, cards };
  });
}

export function addRound(library: Library, deckId: string, title: string): Library {
  return updateDeck(library, deckId, (deck) => ({
    ...deck,
    rounds: [...deck.rounds, { id: newId("round"), title: title.trim() || `Round ${deck.rounds.length + 1}` }],
  }));
}

export function moveRound(library: Library, deckId: string, roundId: string, direction: -1 | 1): Library {
  return updateDeck(library, deckId, (deck) => {
    const i = deck.rounds.findIndex((r) => r.id === roundId);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= deck.rounds.length) return deck;
    const rounds = [...deck.rounds];
    [rounds[i], rounds[j]] = [rounds[j], rounds[i]];
    return { ...deck, rounds };
  });
}

export function clampSeconds(value: number): number {
  if (!Number.isFinite(value)) return 30;
  return Math.min(600, Math.max(5, Math.round(value)));
}

// The match: cards in round order, then card order inside each round.
export function playOrder(deck: Deck): Card[] {
  return deck.rounds.flatMap((round) => deck.cards.filter((c) => c.roundId === round.id));
}

export type RoundPacing = { roundId: string; title: string; cards: number; seconds: number; share: number };

export function pacing(deck: Deck): { total: number; rounds: RoundPacing[] } {
  const total = deck.cards.reduce((sum, c) => sum + c.seconds, 0);
  return {
    total,
    rounds: deck.rounds.map((round) => {
      const cards = deck.cards.filter((c) => c.roundId === round.id);
      const seconds = cards.reduce((sum, c) => sum + c.seconds, 0);
      return { roundId: round.id, title: round.title, cards: cards.length, seconds, share: total ? seconds / total : 0 };
    }),
  };
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
