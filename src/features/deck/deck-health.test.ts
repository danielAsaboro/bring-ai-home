import { describe, expect, it } from "vitest";

import { addRound, updateCard } from "./deck";
import { duplicateBeats, pacingFlags } from "./deck-health";
import { sampleLibrary } from "./sample-library";

describe("deck health", () => {
  it("passes the balanced sample deck and flags heavy, empty, and long", () => {
    expect(pacingFlags(sampleLibrary.decks[0])).toEqual([]);
    let lib = updateCard(sampleLibrary, "deck-kettle", "c-4", { seconds: 240 });
    lib = addRound(lib, "deck-kettle", "Q&A");
    expect(pacingFlags(lib.decks[0]).map((f) => f.kind)).toEqual(["heavy-round", "empty-round", "long-card"]);
  });

  it("pairs cards above the duplicate threshold (fixture vectors, not model output)", () => {
    const cards = sampleLibrary.decks[0].cards.slice(0, 3);
    const flags = duplicateBeats(cards, [[1, 0], [0, 1], [0.99, 0.05]]);
    expect(flags.map((f) => f.cardIds)).toEqual([["c-1", "c-3"]]);
    expect(() => duplicateBeats(cards, [[1, 0]])).toThrow("Expected 3 vectors");
  });
});
