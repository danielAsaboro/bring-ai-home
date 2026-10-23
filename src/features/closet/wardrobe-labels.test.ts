import { describe, expect, it } from "vitest";

import { describeVerdict, judgeClassification } from "./wardrobe-labels";

// Hand-written fixture results. None of these were produced by a model.
describe("wardrobe classifier gate", () => {
  it("accepts a confident Closet category", () => {
    expect(judgeClassification([{ label: "Outerwear", confidence: 0.82 }, { label: "top", confidence: 0.1 }])).toEqual({
      kind: "accepted",
      label: "outerwear",
      confidence: 0.82,
    });
  });

  it("refuses a confident label that is not a wardrobe category", () => {
    const verdict = judgeClassification([{ label: "other", confidence: 0.97 }, { label: "food", confidence: 0.02 }]);
    expect(verdict.kind).toBe("not-a-wardrobe-label");
    expect(describeVerdict(verdict)).toBe('no wardrobe label (the model said "other")');
  });

  it("refuses a wardrobe label below the threshold", () => {
    expect(judgeClassification([{ label: "shoes", confidence: 0.41 }]).kind).toBe("below-threshold");
  });

  it("ignores impossible confidences", () => {
    expect(judgeClassification([{ label: "top", confidence: 7 }])).toEqual({ kind: "no-result" });
  });
});
