import type { Category } from "./categories";

export type LedgerEntry = {
  id: string;
  date: string;
  merchant: string;
  category: Category;
  amountCents: number;
  source: "manual" | "receipt";
};

// SYNTHETIC sample book. Fictional merchants and amounts for the course.
export const SAMPLE_BOOK: LedgerEntry[] = [
  { id: "e1", date: "2026-03-02", merchant: "Harbour Bakery", category: "Eating out", amountCents: 640, source: "manual" },
  { id: "e2", date: "2026-03-03", merchant: "Greenleaf Market", category: "Groceries", amountCents: 4215, source: "manual" },
  { id: "e3", date: "2026-03-05", merchant: "City Metro Card", category: "Transport", amountCents: 2000, source: "manual" },
  { id: "e4", date: "2026-03-07", merchant: "Bean There Coffee", category: "Eating out", amountCents: 520, source: "manual" },
  { id: "e5", date: "2026-03-09", merchant: "Northside Power", category: "Utilities", amountCents: 6730, source: "manual" },
  { id: "e6", date: "2026-03-11", merchant: "Page Turner Books", category: "Shopping", amountCents: 1899, source: "manual" },
];

/** The text we embed for an entry. Amounts are left out on purpose. */
export function entryText(entry: Pick<LedgerEntry, "merchant" | "category">): string {
  return `${entry.merchant} (${entry.category})`;
}
