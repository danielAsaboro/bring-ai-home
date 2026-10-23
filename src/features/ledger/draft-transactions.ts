import type { OcrBlock } from "./receipt-contract";

// OCR text is evidence. This module turns it into a *draft* with provenance.
// It never posts anything to the ledger, and all money is integer cents.

export type Evidence<T> = {
  value: T;
  blockIndexes: number[];
  text: string;
  confidence: number | null;
};

export type DraftLine = { description: string; amountCents: number; evidence: Evidence<number> };

export type DraftTransaction = {
  id: string;
  receiptId: string;
  sourceDigest: string;
  status: "draft";
  merchant: Evidence<string> | null;
  date: Evidence<string> | null;
  totalCents: Evidence<number> | null;
  subtotalCents: Evidence<number> | null;
  taxCents: Evidence<number> | null;
  lines: DraftLine[];
  checks: { totalMatchesSubtotalPlusTax: boolean | null };
};

type Row = { text: string; blockIndexes: number[]; confidence: number | null };

/** Group OCR blocks that sit on the same printed line, left to right. */
export function groupRows(blocks: OcrBlock[]): Row[] {
  const items = blocks.map((block, index) => ({ block, index }));
  const placed = items.filter((i) => i.block.bbox !== null);
  const loose = items.filter((i) => i.block.bbox === null);
  placed.sort((a, b) => center(a.block) - center(b.block));

  const rows: { members: typeof items; center: number; height: number }[] = [];
  for (const item of placed) {
    const [, y1, , y2] = item.block.bbox!;
    const row = rows.at(-1);
    if (row && Math.abs(center(item.block) - row.center) <= row.height / 2) {
      row.members.push(item);
    } else {
      rows.push({ members: [item], center: center(item.block), height: Math.max(1, y2 - y1) });
    }
  }
  const grouped = rows.map((row) => row.members.sort((a, b) => a.block.bbox![0] - b.block.bbox![0]));
  return [...grouped, ...loose.map((i) => [i])].map((members) => ({
    text: members.map((m) => m.block.text.trim()).join(" ").replace(/\s+/g, " "),
    blockIndexes: members.map((m) => m.index),
    confidence: minConfidence(members.map((m) => m.block.confidence)),
  }));
}

function center(block: OcrBlock) {
  const [, y1, , y2] = block.bbox!;
  return (y1 + y2) / 2;
}

function minConfidence(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null);
  return known.length === values.length && known.length > 0 ? Math.min(...known) : null;
}

const AMOUNT_AT_END = /(-?\d{1,6})[.,](\d{2})\s*$/;

/** "10.53" -> 1053. Returns null instead of guessing. */
export function parseAmountCents(text: string): number | null {
  const match = AMOUNT_AT_END.exec(text.trim());
  if (!match) return null;
  const whole = Number.parseInt(match[1], 10);
  const cents = Number.parseInt(match[2], 10);
  return whole < 0 || match[1].startsWith("-") ? -(Math.abs(whole) * 100 + cents) : whole * 100 + cents;
}

const DATE = /(\d{4})-(\d{2})-(\d{2})/;
const SKIP_DESCRIPTION = /^(paid|card|change|cash)\b/i;

function evidence<T>(value: T, row: Row): Evidence<T> {
  return { value, blockIndexes: row.blockIndexes, text: row.text, confidence: row.confidence };
}

export function draftFromOcr(input: {
  receiptId: string;
  sourceDigest: string;
  blocks: OcrBlock[];
}): DraftTransaction {
  const rows = groupRows(input.blocks).filter((row) => row.text.length > 0);
  let merchant: Evidence<string> | null = null;
  let date: Evidence<string> | null = null;
  let totalCents: Evidence<number> | null = null;
  let subtotalCents: Evidence<number> | null = null;
  let taxCents: Evidence<number> | null = null;
  const lines: DraftLine[] = [];

  for (const row of rows) {
    const amount = parseAmountCents(row.text);
    const label = row.text.replace(AMOUNT_AT_END, "").trim();
    const dateMatch = DATE.exec(row.text);

    if (!date && dateMatch) {
      date = evidence(dateMatch[0], row);
    } else if (amount !== null && /^total\b/i.test(label)) {
      totalCents = evidence(amount, row);
    } else if (amount !== null && /^sub\s?total\b/i.test(label)) {
      subtotalCents = evidence(amount, row);
    } else if (amount !== null && /^(tax|vat)\b/i.test(label)) {
      taxCents = evidence(amount, row);
    } else if (amount !== null && label && !SKIP_DESCRIPTION.test(label)) {
      lines.push({ description: label, amountCents: amount, evidence: evidence(amount, row) });
    } else if (!merchant && amount === null && /[a-z]/i.test(row.text)) {
      merchant = evidence(row.text, row);
    }
  }

  const totalMatchesSubtotalPlusTax =
    totalCents && subtotalCents && taxCents
      ? subtotalCents.value + taxCents.value === totalCents.value
      : null;

  return {
    id: `draft-${input.receiptId}`,
    receiptId: input.receiptId,
    sourceDigest: input.sourceDigest,
    status: "draft",
    merchant,
    date,
    totalCents,
    subtotalCents,
    taxCents,
    lines,
    checks: { totalMatchesSubtotalPlusTax },
  };
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
