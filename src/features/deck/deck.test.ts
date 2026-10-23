import { describe, expect, it } from "vitest";

import { addCard, clampSeconds, moveCard, moveRound, pacing, playOrder, updateCard } from "./deck";
import { sampleLibrary } from "./sample-library";

const deckId = "deck-kettle";
const kettle = () => sampleLibrary.decks[0];

describe("deck operations", () => {
  it("plays cards in round order, then card order", () => {
    const moved = moveRound(sampleLibrary, deckId, "r-ask", -1);
    const order = playOrder(moved.decks[0]).map((c) => c.id);
    expect(order).toEqual(["c-1", "c-2", "c-7", "c-8", "c-3", "c-4", "c-5", "c-6"]);
    expect(playOrder(kettle()).map((c) => c.id)).toEqual(["c-1", "c-2", "c-3", "c-4", "c-5", "c-6", "c-7", "c-8"]);
  });

  it("reorders a card only inside its round", () => {
    const up = moveCard(sampleLibrary, deckId, "c-4", -1);
    expect(playOrder(up.decks[0]).map((c) => c.id).slice(2, 4)).toEqual(["c-4", "c-3"]);
    const edge = moveCard(sampleLibrary, deckId, "c-3", -1);
    expect(edge.decks[0].cards).toEqual(kettle().cards);
  });

  it("measures pacing per round", () => {
    const { total, rounds } = pacing(kettle());
    expect(total).toBe(335);
    expect(rounds.map((r) => r.seconds)).toEqual([90, 160, 85]);
  });

  it("clamps card timing and leaves the input library unchanged", () => {
    const next = addCard(sampleLibrary, deckId, { kind: "claim", title: "x", body: "", treatment: "quiet", seconds: 9999, roundId: "r-ask" });
    expect(next.decks[0].cards.at(-1)?.seconds).toBe(600);
    expect(kettle().cards).toHaveLength(8);
    expect(clampSeconds(Number.NaN)).toBe(30);
    expect(updateCard(sampleLibrary, deckId, "c-1", { seconds: 1 }).decks[0].cards[0].seconds).toBe(5);
  });
});
