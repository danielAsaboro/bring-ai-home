import { describe, expect, it } from "vitest";

import { WEEKLY_REPORT_NARRATION_FIXTURE } from "./fixtures/narration.fixture";
import { STEPS_OUTPUT_FIXTURE } from "./fixtures/model-output.fixture";
import { toNarration } from "./narration";
import { buildStepsHistory, parseStepProposals } from "./proposals";

const transcript = toNarration(WEEKLY_REPORT_NARRATION_FIXTURE).transcript;

describe("step proposals gate (fixture output, not live)", () => {
  it("keeps grounded steps and rejects invented and duplicate ones with reasons", () => {
    const result = parseStepProposals(STEPS_OUTPUT_FIXTURE, transcript);
    expect(result.proposals.map((p) => p.title)).toEqual([
      "Open the Harbor dashboard",
      "Set the date range to last week",
      "Export the summary as CSV",
      "Publish to the team page",
    ]);
    expect(result.rejected).toEqual([
      { title: "Email the CFO", reason: "Quote does not appear in the narration" },
      { title: "Open the Harbor dashboard", reason: "Duplicate of an earlier step" },
    ]);
  });

  it("refuses non-JSON and shapeless JSON instead of guessing", () => {
    expect(() => parseStepProposals("Sure! Here are the steps:", transcript)).toThrow("did not return JSON");
    expect(() => parseStepProposals('{"items":[]}', transcript)).toThrow("no steps list");
  });

  it("sends the narration and screen notes, never the tape library", () => {
    const history = buildStepsHistory({ transcript, screenNotes: ["Export menu is open"] });
    expect(history[1].content).toContain("Harbor dashboard");
    expect(history[1].content).toContain("- Export menu is open");
  });
});
