import { describe, expect, it } from "vitest";

import { cornerCafeOcrFixture } from "@/fixtures/corner-cafe-ocr.fixture";

import { buildProposalHistory, parseProposal, proposalInputFromDraft } from "./categories";
import { draftFromOcr } from "./draft-transactions";

// All model text below is HAND-WRITTEN, not recorded output.
describe("merchant and category proposals", () => {
  const draft = draftFromOcr({ receiptId: "r1", sourceDigest: "d", blocks: cornerCafeOcrFixture });

  it("sends words only, never amounts, to the model", () => {
    const input = proposalInputFromDraft(draft);
    const prompt = JSON.stringify(buildProposalHistory(input));

    expect(input).toEqual({
      merchantText: "CORNER CAFE",
      lineDescriptions: ["Flat white", "Croissamt", "Sparkling water"],
    });
    expect(prompt).not.toMatch(/10\.53|9\.75|0\.78|4\.50/);
  });

  it("accepts a well-formed proposal on the fixed list", () => {
    expect(parseProposal('{"merchant":"Corner Cafe","category":"Eating out"}')).toEqual({
      ok: true,
      proposal: { merchant: "Corner Cafe", category: "Eating out" },
    });
  });

  it("rejects an off-list category instead of mapping it", () => {
    expect(parseProposal('{"merchant":"Corner Cafe","category":"Coffee"}')).toEqual({
      ok: false,
      reason: 'Category "Coffee" is not on the list',
    });
  });

  it("rejects prose and empty merchants", () => {
    expect(parseProposal("Sure! It is a cafe.").ok).toBe(false);
    expect(parseProposal('{"merchant":"  ","category":"Other"}').ok).toBe(false);
  });

  it("ignores any amount the model adds", () => {
    const result = parseProposal('{"merchant":"Corner Cafe","category":"Eating out","total":99}');
    expect(result).toEqual({ ok: true, proposal: { merchant: "Corner Cafe", category: "Eating out" } });
  });
});
