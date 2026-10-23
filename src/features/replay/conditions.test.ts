import { describe, expect, it } from "vitest";

import { mergeConditions, parseConditions, toParameterName } from "./conditions";
import { CONDITIONS_OUTPUT_FIXTURE } from "./fixtures/model-output.fixture";
import { WEEKLY_REPORT_NARRATION_FIXTURE } from "./fixtures/narration.fixture";
import { toNarration } from "./narration";
import { SAMPLE_LIBRARY } from "./sample-library";

const transcript = toNarration(WEEKLY_REPORT_NARRATION_FIXTURE).transcript;

describe("conditions gate (fixture output, not live)", () => {
  it("keeps grounded parameters and stop conditions and explains every rejection", () => {
    const result = parseConditions(CONDITIONS_OUTPUT_FIXTURE, transcript);
    expect(result.parameters).toEqual([
      { name: "week_start", example: "September 28th", quote: "the week starting September 28th" },
    ]);
    expect(result.preconditions.map((c) => c.text)).toEqual(["You can open the Harbor dashboard"]);
    expect(result.stopConditions.map((c) => c.text)).toEqual(["The export comes back empty"]);
    expect(result.rejected).toEqual([
      { item: "workspace", reason: "Example value is not in the quoted words" },
      { item: "The dashboard shows an error", reason: "Quote does not appear in the narration" },
    ]);
  });

  it("normalizes parameter names", () => {
    expect(toParameterName("Week Start")).toBe("week_start");
    expect(toParameterName("reportURL")).toBe("report_url");
  });

  it("merges accepted items without overwriting what a person already wrote", () => {
    const tape = SAMPLE_LIBRARY[0];
    const merged = mergeConditions(tape, {
      parameters: [{ name: "week_start", example: "September 28th" }],
      preconditions: [],
      stopConditions: ["The export comes back empty"],
    });
    expect(merged.parameters).toEqual(tape.parameters);
    expect(merged.stopConditions).toEqual([...tape.stopConditions, "The export comes back empty"]);
  });
});
