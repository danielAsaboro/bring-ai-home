import { describe, expect, it } from "vitest";

import { buildConditionPrompt, parseVerdict } from "./verdict";

// Hand-written model replies (fixtures). They are not live model output.
describe("parseVerdict", () => {
  it("reads a leading yes or no", () => {
    expect(parseVerdict("YES. A brown box sits by the gate.")).toEqual({
      answer: "yes",
      reason: "A brown box sits by the gate.",
    });
    expect(parseVerdict(" no - the path is empty")).toEqual({ answer: "no", reason: "the path is empty" });
  });

  it("treats hedges and buried answers as unclear", () => {
    expect(parseVerdict("It might be a parcel, yes").answer).toBe("unclear");
    expect(parseVerdict("Yesterday a box was here").answer).toBe("unclear");
    expect(parseVerdict("").answer).toBe("unclear");
  });
});

describe("buildConditionPrompt", () => {
  it("rejects empty and overlong conditions", () => {
    expect(() => buildConditionPrompt("   ")).toThrow("Write a condition first");
    expect(() => buildConditionPrompt("x".repeat(121))).toThrow("under 120");
    expect(buildConditionPrompt("a parcel is left by the gate")).toContain("Condition: a parcel is left by the gate");
  });
});
