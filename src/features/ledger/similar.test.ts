import { describe, expect, it } from "vitest";

import { entryText, SAMPLE_BOOK } from "./sample-book";
import { cosine, rankSimilar } from "./similar";

// Hand-made 3-number vectors. Real GTE vectors are much longer.
const index = [
  { entryId: "e1", vector: [1, 0, 0] },
  { entryId: "e4", vector: [0.9, 0.1, 0] },
  { entryId: "e5", vector: [0, 0, 1] },
];

describe("similar past entries", () => {
  it("scores identical direction as 1 and unrelated as 0", () => {
    expect(cosine([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });

  it("ranks by score with a floor and a limit", () => {
    expect(rankSimilar(index, [1, 0.05, 0], { limit: 2, minScore: 0.5 })).toEqual([
      { entryId: "e1", score: 0.999 },
      { entryId: "e4", score: 0.998 },
    ]);
  });

  it("returns nothing rather than a weak match", () => {
    expect(rankSimilar(index, [0, 1, 0], { limit: 3, minScore: 0.5 })).toEqual([]);
  });

  it("embeds words, not amounts", () => {
    expect(entryText(SAMPLE_BOOK[0])).toBe("Harbour Bakery (Eating out)");
  });
});
