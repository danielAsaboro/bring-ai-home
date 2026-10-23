import { describe, expect, it } from "vitest";

import { buildRecapDraft } from "./recap";

// FIXTURE: hand-written segments shaped like `transcribe({ metadata: true })`.
// They are not model output and prove nothing about live inference.
const fixtureSegments = [
  { text: " Just got off the phone with Dev.", startMs: 0, endMs: 2100 },
  { text: "   ", startMs: 2100, endMs: 2600 },
  { text: "I promised to send him the slide template by Friday.", startMs: 2600, endMs: 5900 },
];

describe("buildRecapDraft", () => {
  it("joins spoken segments into a proposed recap", () => {
    const draft = buildRecapDraft(fixtureSegments, "WHISPER_TINY");
    expect(draft.status).toBe("proposed");
    expect(draft.transcript).toBe(
      "Just got off the phone with Dev. I promised to send him the slide template by Friday.",
    );
    expect(draft.segments).toHaveLength(2);
    expect(draft.durationMs).toBe(5900);
  });

  it("refuses to invent text for silence", () => {
    expect(() =>
      buildRecapDraft([{ text: " ", startMs: 0, endMs: 900 }], "WHISPER_TINY"),
    ).toThrow("No speech");
  });
});
