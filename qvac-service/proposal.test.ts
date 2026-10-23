import { describe, expect, it } from "vitest";

import { samplePatterns } from "../src/features/pattern/patterns";
import { buildProposalHistory, extractProposal } from "./proposal";

// FIXTURE: a hand-written reply shaped like a chat model's answer. Not live output.
const FIXTURE_REPLY = 'Here are the rules:\n[{"kind":"trim","collapse":true},{"kind":"split","separator":",","order":[1,0],"join":" "},{"kind":"case","to":"title"}]';

describe("proposal prompt and extraction", () => {
  it("sends the examples, and only the examples, to the model", () => {
    const history = buildProposalHistory(samplePatterns[0].examples);
    expect(history[0].role).toBe("system");
    expect(history[1].content).toContain('before: "hollis, maren"');
    expect(history[1].content).toContain('after: "Maren Hollis"');
    expect(() => buildProposalHistory([])).toThrow(/at least one example/);
  });

  it("extracts an untrusted JSON array from surrounding prose (fixture)", () => {
    expect(extractProposal(FIXTURE_REPLY)).toHaveLength(3);
    expect(() => extractProposal("I think you should trim it.")).toThrow(/no JSON array/);
  });
});
