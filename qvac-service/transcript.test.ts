import { describe, expect, it } from "vitest";

import { buildMemoryDraft, joinSegments } from "./transcript";

// Fixture segments written by hand for this test. They are not model output.
const fixtureSegments = [
  { text: " We took the night train north", startMs: 0, endMs: 2100 },
  { text: "", startMs: 2100, endMs: 2300 },
  { text: " and played cards until the conductor came. ", startMs: 2300, endMs: 5200 },
];

describe("transcript segments", () => {
  it("joins segment text into one clean sentence", () => {
    expect(joinSegments(fixtureSegments)).toBe(
      "We took the night train north and played cards until the conductor came.",
    );
  });

  it("creates a proposed memory draft, never a saved memory", () => {
    const draft = buildMemoryDraft({
      segments: fixtureSegments,
      sourceName: "my-memory.wav",
      sourceDigest: "abc",
      model: "WHISPER_TINY",
    });
    expect(draft.status).toBe("proposed");
    expect(draft.durationMs).toBe(5200);
  });

  it("refuses silence instead of inventing a memory", () => {
    expect(() =>
      buildMemoryDraft({
        segments: [{ text: "  ", startMs: 0, endMs: 900 }],
        sourceName: "silence.wav",
        sourceDigest: "abc",
        model: "WHISPER_TINY",
      }),
    ).toThrow("No speech");
  });
});
