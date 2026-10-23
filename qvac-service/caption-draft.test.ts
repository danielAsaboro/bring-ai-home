import { describe, expect, it } from "vitest";

import { sampleArchive } from "../src/features/chronicle/archive";
import { buildCaptionHistory, parseCaptionDraft } from "./caption-draft";

describe("caption prompt", () => {
  it("labels earlier model output as unconfirmed", () => {
    const history = buildCaptionHistory({
      memory: sampleArchive[0],
      photoDescription: "A red blanket on sand.",
    });
    expect(history[1].content).toContain("Unconfirmed photo description: A red blanket on sand.");
    expect(history[1].content).toContain("written by the family");
  });
});

// Fixture strings written by hand for this test. They are not model output.
describe("caption parsing", () => {
  it("strips a label, quotes, and extra whitespace", () => {
    expect(parseCaptionDraft('Caption: "Oranges on a red\n blanket at Gull Point."')).toBe(
      "Oranges on a red blanket at Gull Point.",
    );
  });

  it("rejects empty and overlong drafts", () => {
    expect(() => parseCaptionDraft("  ")).toThrow("empty caption");
    expect(() => parseCaptionDraft("a".repeat(161))).toThrow("limited to 160");
  });
});
