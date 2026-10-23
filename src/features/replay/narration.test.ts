import { describe, expect, it } from "vitest";

import { WEEKLY_REPORT_NARRATION_FIXTURE } from "./fixtures/narration.fixture";
import { formatTimestamp, toNarration } from "./narration";

describe("narration from transcription segments (fixture, not live output)", () => {
  it("drops silence tags, trims text, and keeps timestamps", () => {
    const narration = toNarration(WEEKLY_REPORT_NARRATION_FIXTURE);
    expect(narration.segments).toHaveLength(5);
    expect(narration.transcript.startsWith("First I open the Harbor dashboard")).toBe(true);
    expect(narration.transcript).not.toContain("BLANK_AUDIO");
    expect(narration.durationMs).toBe(22000);
    expect(formatTimestamp(narration.segments[2].startMs)).toBe("0:10");
  });

  it("refuses a recording with no speech", () => {
    expect(() => toNarration([{ text: "[BLANK_AUDIO]", startMs: 0, endMs: 900 }])).toThrow("No speech");
  });
});
