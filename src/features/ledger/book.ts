import { CATEGORIES, type Category } from "./categories";
import type { DraftTransaction } from "./draft-transactions";
import type { LedgerEntry } from "./sample-book";

export type ReviewedValues = { date: string; merchant: string; category: Category; amountCents: number };

export type AuditRecord = {
  entryId: string;
  draftId: string;
  sourceDigest: string;
  acceptedAt: string;
  ocrTotalCents: number | null;
  proposal: { merchant: string; category: Category } | null;
  changedByReviewer: (keyof ReviewedValues)[];
};

export type Book = { entries: LedgerEntry[]; audit: AuditRecord[]; decided: string[] };

export function createBook(entries: LedgerEntry[]): Book {
  return { entries: [...entries], audit: [], decided: [] };
}

/** The suggested starting values for a reviewer. A suggestion, not a decision. */
export function suggestedValues(
  draft: DraftTransaction,
  proposal: { merchant: string; category: Category } | null,
): ReviewedValues {
  return {
    date: draft.date?.value ?? "",
    merchant: proposal?.merchant ?? draft.merchant?.value ?? "",
    category: proposal?.category ?? "Other",
    amountCents: draft.totalCents?.value ?? 0,
  };
}

/** Only this function adds a receipt entry, and only with values a person confirmed. */
export function acceptDraft(
  book: Book,
  draft: DraftTransaction,
  reviewed: ReviewedValues,
  proposal: { merchant: string; category: Category } | null,
  now: Date,
): Book {
  if (book.decided.includes(draft.id)) throw new Error("This draft was already decided");
  if (!Number.isInteger(reviewed.amountCents) || reviewed.amountCents <= 0) {
    throw new Error("Amount must be a positive number of cents");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewed.date)) throw new Error("Date must be YYYY-MM-DD");
  if (reviewed.merchant.trim() === "") throw new Error("Merchant is required");
  if (!CATEGORIES.includes(reviewed.category)) throw new Error("Unknown category");

  const suggested = suggestedValues(draft, proposal);
  const changedByReviewer = (Object.keys(suggested) as (keyof ReviewedValues)[]).filter(
    (key) => suggested[key] !== reviewed[key],
  );
  const entryId = `r-${draft.receiptId}`;
  return {
    entries: [
      ...book.entries,
      { id: entryId, ...reviewed, merchant: reviewed.merchant.trim(), source: "receipt" },
    ],
    audit: [
      ...book.audit,
      {
        entryId,
        draftId: draft.id,
        sourceDigest: draft.sourceDigest,
        acceptedAt: now.toISOString(),
        ocrTotalCents: draft.totalCents?.value ?? null,
        proposal,
        changedByReviewer,
      },
    ],
    decided: [...book.decided, draft.id],
  };
}

export function rejectDraft(book: Book, draft: DraftTransaction): Book {
  if (book.decided.includes(draft.id)) return book;
  return { ...book, decided: [...book.decided, draft.id] };
}

/** Totals are integer sums in code. No model is involved. */
export function totals(entries: LedgerEntry[]) {
  const byCategory = new Map<Category, number>();
  let all = 0;
  for (const entry of entries) {
    byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + entry.amountCents);
    all += entry.amountCents;
  }
  return {
    allCents: all,
    byCategory: CATEGORIES.filter((c) => byCategory.has(c)).map((c) => ({ category: c, cents: byCategory.get(c)! })),
  };
}
