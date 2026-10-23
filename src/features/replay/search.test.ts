import { describe, expect, it } from "vitest";

import { SAMPLE_LIBRARY } from "./sample-library";
import { cosine, filterByWords, rankTapes } from "./search";

// FIXTURE vectors: tiny hand-made 3D vectors, not embeddings from a model.
const index = [
  { tapeId: "tape-weekly-report", vector: [0.9, 0.1, 0] },
  { tapeId: "tape-contractor-onboarding", vector: [0, 1, 0] },
  { tapeId: "tape-checkout-bug", vector: [0.1, 0, 0.9] },
];

describe("tape search ranking", () => {
  it("ranks by cosine similarity and drops weak matches", () => {
    expect(rankTapes(index, [1, 0, 0])).toEqual([{ tapeId: "tape-weekly-report", score: 0.994 }]);
    expect(rankTapes(index, [1, 0, 1], { minScore: 0.1 }).map((m) => m.tapeId)).toEqual([
      "tape-checkout-bug",
      "tape-weekly-report",
    ]);
  });

  it("refuses mismatched vectors instead of returning a number", () => {
    expect(() => cosine([1, 2], [1, 2, 3])).toThrow("same");
  });

  it("keeps a word filter that needs no model", () => {
    expect(filterByWords(SAMPLE_LIBRARY, "weekly report").map((t) => t.id)).toEqual(["tape-weekly-report"]);
    expect(filterByWords(SAMPLE_LIBRARY, "numbers for the ops team")).toEqual([]);
  });
});
