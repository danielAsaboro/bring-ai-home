// OCR finds text on a rating plate. This module decides which pieces of that
// text could fill an asset field. It only proposes; a person accepts.

export type OcrBlock = {
  text: string;
  bbox?: [number, number, number, number];
  confidence?: number;
};

export type LabelField = "brand" | "model" | "serial" | "installedOn";

export type LabelFact = {
  field: LabelField;
  value: string;
  sourceText: string;
  confidence: number | null;
};

const ROW_TOLERANCE = 18;

// Put blocks in reading order: top to bottom by row, then left to right.
export function readingOrder(blocks: readonly OcrBlock[]): string[] {
  const placed = blocks.filter((b) => b.text.trim().length > 0);
  if (!placed.every((b) => b.bbox)) return placed.map((b) => b.text.trim());
  const sorted = [...placed].sort((a, b) => a.bbox![1] - b.bbox![1]);
  const rows: OcrBlock[][] = [];
  for (const block of sorted) {
    const row = rows.at(-1);
    if (row && Math.abs(row[0].bbox![1] - block.bbox![1]) <= ROW_TOLERANCE) row.push(block);
    else rows.push([block]);
  }
  return rows.map((row) =>
    row
      .sort((a, b) => a.bbox![0] - b.bbox![0])
      .map((b) => b.text.trim())
      .join(" "),
  );
}

const PATTERNS: { field: Exclude<LabelField, "brand">; pattern: RegExp; normalise?: (v: string) => string | null }[] = [
  { field: "model", pattern: /\bMODEL(?:\s*(?:NO|NUMBER|#)\.?)?\s*[:.]?\s*([A-Z0-9][A-Z0-9./-]{2,})/i },
  { field: "serial", pattern: /\bSERIAL(?:\s*(?:NO|NUMBER|#)\.?)?\s*[:.]?\s*([A-Z0-9][A-Z0-9-]{4,})/i },
  {
    field: "installedOn",
    pattern: /\b(?:MFG|MANUFACTURED|MFD)\.?\s*(?:DATE)?\s*[:.]?\s*(\d{4}-\d{2}(?:-\d{2})?)/i,
    // A manufacture month becomes a starting guess for the install date.
    normalise: (v) => (/^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v),
  },
];

function confidenceFor(blocks: readonly OcrBlock[], value: string): number | null {
  const hit = blocks.find((b) => b.text.includes(value));
  return typeof hit?.confidence === "number" ? hit.confidence : null;
}

export function proposeLabelFacts(blocks: readonly OcrBlock[]): LabelFact[] {
  const lines = readingOrder(blocks);
  const facts: LabelFact[] = [];
  for (const { field, pattern, normalise } of PATTERNS) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (!match) continue;
      const raw = match[1].replace(/[.,;]+$/, "");
      const value = normalise ? normalise(raw) : raw;
      if (value) facts.push({ field, value, sourceText: line, confidence: confidenceFor(blocks, raw) });
      break;
    }
  }
  // The first line that is a single all-caps word is a brand candidate.
  const brandLine = lines.find((l) => /^[A-Z][A-Z&-]{2,}$/.test(l.trim()));
  if (brandLine) {
    const brand = brandLine.trim();
    facts.unshift({
      field: "brand",
      value: brand.charAt(0) + brand.slice(1).toLowerCase(),
      sourceText: brandLine,
      confidence: confidenceFor(blocks, brand),
    });
  }
  return facts;
}
