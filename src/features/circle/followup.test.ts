import { describe, expect, it } from "vitest";

import { buildFollowUpPrompt, cleanDraft, MAX_DRAFT_CHARS } from "./followup";

const context = [{ id: "t5", text: "2026-10-10 interaction: Practised the first five minutes of his talk." }];

describe("follow-up drafts", () => {
  it("grounds the prompt in saved notes only", () => {
    const prompt = buildFollowUpPrompt("Dev Raman", "good luck with the talk", context);
    expect(prompt).toContain("- 2026-10-10 interaction: Practised");
    expect(prompt).toContain("Do not add facts");
  });

  it("cleans a fixture reply into a draft, never a sent message", () => {
    // FIXTURE: hand-written model-style reply, not live output.
    const draft = cleanDraft('Subject: Hi\n"Good luck on Tuesday, Dev!"', "FIXTURE", context);
    expect(draft).toEqual({ status: "draft", model: "FIXTURE", text: "Good luck on Tuesday, Dev!", basedOn: ["t5"] });
  });

  it("caps length and refuses empty drafts", () => {
    expect(cleanDraft("x".repeat(900), "FIXTURE", []).text.length).toBe(MAX_DRAFT_CHARS + 1);
    expect(() => cleanDraft('  ""  ', "FIXTURE", [])).toThrow("empty draft");
  });
});
