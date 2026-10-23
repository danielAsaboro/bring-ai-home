import { describe, expect, it } from "vitest";

import { samplePatterns } from "./patterns";
import { cosine, patternText, rankSimilar } from "./similar";

// FIXTURE vectors, hand-written to make the ranking checkable. Not real embeddings.
const vectors = [
  [1, 0, 0],
  [0.2, 1, 0],
  [0.9, 0.1, 0.1],
];

describe("similar saved patterns", () => {
  it("builds text from human-written fields", () => {
    expect(patternText(samplePatterns[0])).toContain("hollis, maren -> Maren Hollis");
  });

  it("ranks by cosine, drops the pattern itself and weak matches", () => {
    expect(cosine([1, 0], [1, 0])).toBe(1);
    const matches = rankSimilar(samplePatterns, vectors, "p-contacts", { limit: 3, minScore: 0.5 });
    expect(matches.map((m) => m.id)).toEqual(["p-vendors"]);
    expect(() => rankSimilar(samplePatterns, vectors.slice(1), "p-contacts", { limit: 3, minScore: 0 })).toThrow();
  });
});
