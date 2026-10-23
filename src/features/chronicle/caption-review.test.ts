import { describe, expect, it } from "vitest";

import { sampleArchive } from "./archive";
import { acceptCaption, proposeCaption, rejectCaption } from "./caption-review";

const memory = sampleArchive[0];
// Fixture draft written by hand. Not model output.
const proposal = proposeCaption(memory.id, "Oranges on a red blanket.");

describe("caption review", () => {
  it("saves the person's edited text, not the raw draft", () => {
    const result = acceptCaption(memory, proposal, " Oranges, and a kite that never flew. ", "2026-01-01T00:00:00Z");
    expect(result.memory.caption).toBe("Oranges, and a kite that never flew.");
    expect(result.revision.previous).toBe(memory.caption);
    expect(result.proposal.status).toBe("accepted");
  });

  it("leaves the caption alone when a draft is rejected", () => {
    expect(rejectCaption(proposal).status).toBe("rejected");
    expect(memory.caption).toBe("Red blanket, oranges, and a kite that never flew.");
  });

  it("refuses to resolve a draft twice or apply it to another memory", () => {
    const accepted = acceptCaption(memory, proposal, "x", "t").proposal;
    expect(() => rejectCaption(accepted)).toThrow("already been resolved");
    expect(() => acceptCaption(sampleArchive[1], proposal, "x", "t")).toThrow("different memory");
  });
});
