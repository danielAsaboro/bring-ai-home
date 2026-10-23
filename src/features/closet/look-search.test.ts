import { describe, expect, it } from "vitest";

import { cosine, keywordLooks, lookText, rankLooks } from "./look-search";
import { sampleCloset } from "./sample-closet";

describe("look retrieval", () => {
  const closet = sampleCloset();

  it("embeds a look from what the person wrote and wore", () => {
    expect(lookText(closet.looks[1], closet.garments)).toBe(
      "Rainy commute. Occasion: work day in the rain. Wearing: yellow Yellow raincoat, white and navy Striped breton, olive Olive chinos, brown Brown boots.",
    );
  });

  it("ranks by cosine and applies the app's threshold and limit", () => {
    // Fixture vectors chosen by hand so the expected order is obvious. Not model output.
    const ids = ["a", "b", "c"];
    const vectors = [
      [1, 0, 0],
      [0.8, 0.6, 0],
      [0, 0, 1],
    ];
    expect(rankLooks(ids, vectors, [1, 0, 0], { limit: 2, minScore: 0.5 })).toEqual([
      { lookId: "a", score: 1 },
      { lookId: "b", score: 0.8 },
    ]);
    expect(rankLooks(ids, vectors, [0, 1, 0], { minScore: 0.9 })).toEqual([]);
  });

  it("refuses mismatched vectors instead of returning a wrong score", () => {
    expect(() => cosine([1, 2], [1])).toThrow("same non-zero length");
    expect(() => rankLooks(["a"], [], [1])).toThrow("One vector per look");
  });

  it("keeps a keyword fallback for when no model is running", () => {
    expect(keywordLooks("rain", closet.looks, closet.garments)[0].lookId).toBe("look-rainy-commute");
  });
});
