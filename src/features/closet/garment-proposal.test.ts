import { describe, expect, it } from "vitest";

import { GARMENT_PROPOSAL_SCHEMA, parseGarmentProposal } from "./garment-proposal";

// Every raw string below is a hand-written fixture, not recorded model output.
const description = "A yellow raincoat with a front seam and long sleeves.";

describe("garment proposal gate", () => {
  it("keeps grounded fields", () => {
    const raw = JSON.stringify({ name: "Yellow raincoat", category: "outerwear", colour: "yellow", material: "unknown" });
    expect(parseGarmentProposal(raw, description)).toEqual({
      fields: { name: "Yellow raincoat", category: "outerwear", colour: "yellow" },
      issues: ["No material was stated."],
    });
  });

  it("drops a category outside the fixed list instead of coercing it", () => {
    const raw = JSON.stringify({ name: "Raincoat", category: "jacket", colour: "yellow", material: "" });
    const result = parseGarmentProposal(raw, description);
    expect(result.fields.category).toBeUndefined();
    expect(result.issues[0]).toContain('"jacket"');
  });

  it("drops a colour the description never mentioned", () => {
    const raw = JSON.stringify({ name: "Raincoat", category: "outerwear", colour: "green", material: "wool" });
    const result = parseGarmentProposal(raw, description);
    expect(result.fields.colour).toBeUndefined();
    expect(result.fields.material).toBeUndefined();
    expect(result.issues).toHaveLength(2);
  });

  it("turns malformed output into an issue, not a crash", () => {
    expect(parseGarmentProposal("{name: raincoat", description)).toEqual({
      fields: {},
      issues: ["The model did not return JSON, so nothing was proposed."],
    });
  });

  it("asks the model for exactly Closet's categories", () => {
    expect(GARMENT_PROPOSAL_SCHEMA.properties.category.enum).toContain("outerwear");
    expect(GARMENT_PROPOSAL_SCHEMA.additionalProperties).toBe(false);
  });
});
