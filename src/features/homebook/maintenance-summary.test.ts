import { describe, expect, it } from "vitest";

import { historyFor, sampleBinder } from "./binder";
import { buildSummaryHistory, parseSummaryDraft, parseSummaryRequest } from "./maintenance-summary";

const request = {
  asset: sampleBinder.assets[0],
  history: historyFor(sampleBinder, "water-heater"),
  tasks: sampleBinder.tasks.filter((t) => t.assetId === "water-heater"),
};

// The drafts below are hand-written fixtures, not model output.
describe("maintenance summary", () => {
  it("gives the model only this asset's records", () => {
    const [, user] = buildSummaryHistory(request);
    expect(user.content).toContain("- 2025-03-10: Flushed tank.");
    expect(user.content).not.toContain("Filter cleaned");
  });

  it("flags a date the records do not contain", () => {
    const draft = parseSummaryDraft("Flushed on 2025-03-10. Anode replaced 2024-01-05.", request);
    expect(draft.unsupportedDates).toEqual(["2024-01-05"]);
  });

  it("rejects an empty draft and a malformed request", () => {
    expect(() => parseSummaryDraft(" ", request)).toThrow("empty summary");
    expect(() => parseSummaryRequest({ asset: null })).toThrow("Request must contain");
  });
});
