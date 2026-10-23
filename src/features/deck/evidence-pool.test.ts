import { describe, expect, it } from "vitest";

import { addCard } from "./deck";
import { evidenceCandidates, rankEvidence } from "./evidence-pool";
import { sampleLibrary } from "./sample-library";

describe("evidence pool", () => {
  it("offers evidence from other decks that the target deck does not already hold", () => {
    expect(evidenceCandidates(sampleLibrary, "deck-library").map((c) => c.card.id)).toEqual(["c-2", "c-4", "c-6"]);
    const withCopy = addCard(sampleLibrary, "deck-library", { kind: "evidence", title: "Price point", body: "", treatment: "data", seconds: 30, roundId: "r-cost" });
    expect(evidenceCandidates(withCopy, "deck-library").map((c) => c.card.id)).toEqual(["c-2", "c-4"]);
  });

  it("ranks by cosine and applies the app's floor (fixture vectors, not model output)", () => {
    const candidates = evidenceCandidates(sampleLibrary, "deck-library");
    const ranked = rankEvidence([1, 0], candidates, [[0.9, 0.1], [0.2, 1], [1, 0]]);
    expect(ranked.map((r) => [r.card.id, Number(r.score.toFixed(2))])).toEqual([["c-6", 1], ["c-2", 0.99]]);
    expect(() => rankEvidence([1, 0], candidates, [[1, 0]])).toThrow("Expected 3 vectors");
  });
});
