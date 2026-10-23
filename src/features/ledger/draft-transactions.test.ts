import { describe, expect, it } from "vitest";

import { cornerCafeOcrFixture } from "@/fixtures/corner-cafe-ocr.fixture";

import { draftFromOcr, formatCents, groupRows, parseAmountCents } from "./draft-transactions";

const draft = () =>
  draftFromOcr({ receiptId: "r1", sourceDigest: "digest", blocks: cornerCafeOcrFixture });

describe("draft transactions from OCR evidence (hand-written fixture)", () => {
  it("joins label and amount blocks that share a printed line", () => {
    const rows = groupRows(cornerCafeOcrFixture);
    expect(rows.map((r) => r.text)).toContain("TOTAL 10.53");
    expect(rows.find((r) => r.text === "TOTAL 10.53")?.blockIndexes).toEqual([13, 14]);
  });

  it("parses money as integer cents and refuses to guess", () => {
    expect(parseAmountCents("TOTAL 10.53")).toBe(1053);
    expect(parseAmountCents("Tax 0,78")).toBe(78);
    expect(parseAmountCents("TOTAL ten")).toBeNull();
    expect(formatCents(1053)).toBe("10.53");
  });

  it("produces a draft with provenance for every field", () => {
    const result = draft();

    expect(result.status).toBe("draft");
    expect(result.merchant?.value).toBe("CORNER CAFE");
    expect(result.date?.value).toBe("2026-03-14");
    expect(result.totalCents?.value).toBe(1053);
    expect(result.totalCents?.blockIndexes).toEqual([13, 14]);
    expect(result.lines.map((l) => [l.description, l.amountCents])).toEqual([
      ["Flat white", 450],
      ["Croissamt", 325],
      ["Sparkling water", 200],
    ]);
  });

  it("keeps the low-confidence OCR text as evidence instead of correcting it", () => {
    const croissant = draft().lines[1];
    expect(croissant.description).toBe("Croissamt");
    expect(croissant.evidence.confidence).toBe(0.62);
  });

  it("checks the receipt's own arithmetic in code", () => {
    expect(draft().checks.totalMatchesSubtotalPlusTax).toBe(true);

    const misread = cornerCafeOcrFixture.map((b) => (b.text === "10.53" ? { ...b, text: "10.58" } : b));
    const bad = draftFromOcr({ receiptId: "r2", sourceDigest: "d", blocks: misread });
    expect(bad.checks.totalMatchesSubtotalPlusTax).toBe(false);
  });

  it("returns empty fields, not invented ones, when OCR finds nothing", () => {
    const empty = draftFromOcr({ receiptId: "r3", sourceDigest: "d", blocks: [] });
    expect(empty.merchant).toBeNull();
    expect(empty.totalCents).toBeNull();
    expect(empty.checks.totalMatchesSubtotalPlusTax).toBeNull();
  });
});
