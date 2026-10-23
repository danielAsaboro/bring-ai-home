import { describe, expect, it } from "vitest";

import { setTripLimit } from "./model";
import { buildOutfitConstraints, outfitSchema, validateOutfitProposal } from "./outfit-proposal";
import { sampleCloset } from "./sample-closet";

describe("outfit constraints", () => {
  const closet = setTripLimit(sampleCloset(), 4); // two already packed → two slots left
  const constraints = buildOutfitConstraints(closet, "dinner by the river");

  it("offers only clean, unpacked garments and the remaining slots", () => {
    expect(constraints.maxItems).toBe(2);
    const ids = constraints.candidates.map((c) => c.id);
    expect(ids).not.toContain("grey-tee"); // worn
    expect(ids).not.toContain("black-dress"); // in repair
    expect(ids).not.toContain("dark-jeans"); // already packed
    expect(outfitSchema(constraints).properties.garmentIds.maxItems).toBe(2);
  });

  // Hand-written fixture outputs. None of these strings came from a model.
  it("keeps valid picks and explains every rejection", () => {
    const raw = JSON.stringify({
      garmentIds: ["navy-blazer", "grey-tee", "navy-blazer", "olive-chinos", "brown-boots"],
      reason: "Smart but relaxed.",
    });
    expect(validateOutfitProposal(raw, constraints)).toEqual({
      garmentIds: ["navy-blazer", "olive-chinos"],
      reason: "Smart but relaxed.",
      rejected: [
        { id: "grey-tee", why: "not a clean, unpacked garment you own" },
        { id: "navy-blazer", why: "proposed twice" },
        { id: "brown-boots", why: "over the packing limit" },
      ],
      issues: [],
    });
  });

  it("turns malformed output into an issue", () => {
    expect(validateOutfitProposal("[", constraints).issues).toEqual(["The model did not return JSON."]);
    expect(validateOutfitProposal('{"reason":"x"}', constraints).issues).toEqual(["The model proposed no garment list."]);
  });
});
