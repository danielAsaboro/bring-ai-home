import { describe, expect, it } from "vitest";

import { cornerCafeOcrFixture } from "@/fixtures/corner-cafe-ocr.fixture";

import { acceptDraft, createBook, rejectDraft, suggestedValues, totals } from "./book";
import { draftFromOcr } from "./draft-transactions";
import { SAMPLE_BOOK } from "./sample-book";

const draft = draftFromOcr({ receiptId: "r1", sourceDigest: "8bc01b42", blocks: cornerCafeOcrFixture });
const proposal = { merchant: "Corner Cafe", category: "Eating out" as const };
const now = new Date("2026-03-14T12:00:00Z");

describe("review and deterministic totals", () => {
  it("sums the sample book in integer cents", () => {
    expect(totals(SAMPLE_BOOK).allCents).toBe(16004);
  });

  it("adds exactly the reviewed amount and recomputes totals in code", () => {
    const book = acceptDraft(createBook(SAMPLE_BOOK), draft, suggestedValues(draft, proposal), proposal, now);

    expect(book.entries.at(-1)).toMatchObject({ merchant: "Corner Cafe", category: "Eating out", amountCents: 1053 });
    expect(totals(book.entries).allCents).toBe(16004 + 1053);
    expect(totals(book.entries).byCategory.find((c) => c.category === "Eating out")?.cents).toBe(640 + 520 + 1053);
  });

  it("records what the reviewer changed in the audit", () => {
    const reviewed = { ...suggestedValues(draft, proposal), category: "Groceries" as const };
    const book = acceptDraft(createBook(SAMPLE_BOOK), draft, reviewed, proposal, now);

    expect(book.audit).toEqual([
      {
        entryId: "r-r1",
        draftId: "draft-r1",
        sourceDigest: "8bc01b42",
        acceptedAt: "2026-03-14T12:00:00.000Z",
        ocrTotalCents: 1053,
        proposal,
        changedByReviewer: ["category"],
      },
    ]);
  });

  it("refuses to accept the same draft twice", () => {
    const once = acceptDraft(createBook([]), draft, suggestedValues(draft, null), null, now);
    expect(() => acceptDraft(once, draft, suggestedValues(draft, null), null, now)).toThrow("already decided");
  });

  it("rejecting leaves the book and totals unchanged", () => {
    const book = rejectDraft(createBook(SAMPLE_BOOK), draft);
    expect(book.entries).toHaveLength(SAMPLE_BOOK.length);
    expect(totals(book.entries).allCents).toBe(16004);
  });

  it("refuses invalid reviewed values", () => {
    expect(() =>
      acceptDraft(createBook([]), draft, { ...suggestedValues(draft, null), amountCents: 0 }, null, now),
    ).toThrow("positive");
  });
});
