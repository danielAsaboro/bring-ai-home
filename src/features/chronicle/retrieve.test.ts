import { describe, expect, it } from "vitest";

import type { MemoryIndex } from "./memory-index";
import { cosineSimilarity, retrieveMoments } from "./retrieve";

// Fixture index with hand-made vectors. Not model output.
const fixtureIndex: MemoryIndex = {
  model: "fixture",
  dimensions: 3,
  entries: [
    { memoryId: "m-beach-1998", text: "", vector: [1, 0, 0] },
    { memoryId: "m-train-2001", text: "", vector: [0, 1, 0] },
    { memoryId: "m-snow-2010", text: "", vector: [0.7, 0.7, 0] },
  ],
};

describe("retrieval", () => {
  it("scores identical directions as 1 and opposite as -1", () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it("returns the closest moments first and drops weak matches", () => {
    const moments = retrieveMoments(fixtureIndex, [0.9, 0.1, 0], {
      limit: 2,
      minScore: 0.3,
    });
    expect(moments.map((m) => m.memoryId)).toEqual(["m-beach-1998", "m-snow-2010"]);
  });

  it("returns nothing rather than a forced guess when nothing is close", () => {
    expect(
      retrieveMoments(fixtureIndex, [0, 0, 1], { limit: 3, minScore: 0.3 }),
    ).toEqual([]);
  });

  it("rejects a query from a different embedding model", () => {
    expect(() =>
      retrieveMoments(fixtureIndex, [1, 0], { limit: 3, minScore: 0 }),
    ).toThrow("Query has 2 dimensions; the index uses 3");
  });
});
