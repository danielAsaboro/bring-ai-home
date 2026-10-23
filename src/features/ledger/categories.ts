import type { DraftTransaction } from "./draft-transactions";

// The model may only choose from this list. Code owns the list.
export const CATEGORIES = [
  "Groceries",
  "Eating out",
  "Transport",
  "Housing",
  "Utilities",
  "Health",
  "Shopping",
  "Entertainment",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type ProposalInput = { merchantText: string; lineDescriptions: string[] };

export type Proposal = { merchant: string; category: Category };

export type ProposalResult =
  | { ok: true; proposal: Proposal }
  | { ok: false; reason: string };

/** Only words go to the model. Amounts, dates and totals stay out of the prompt. */
export function proposalInputFromDraft(draft: DraftTransaction): ProposalInput {
  return {
    merchantText: draft.merchant?.value ?? "",
    lineDescriptions: draft.lines.map((line) => line.description),
  };
}

export const PROPOSAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    merchant: { type: "string", maxLength: 60 },
    category: { type: "string", enum: [...CATEGORIES] },
  },
  required: ["merchant", "category"],
  additionalProperties: false,
} as const;

export function buildProposalHistory(input: ProposalInput) {
  return [
    {
      role: "system",
      content:
        "You tidy receipt text for a personal ledger. Reply with JSON only: " +
        '{"merchant": short clean merchant name, "category": one of ' +
        CATEGORIES.join(", ") +
        "}. Do not do arithmetic. Do not invent amounts.",
    },
    {
      role: "user",
      content: `Merchant text: ${input.merchantText}\nItems: ${input.lineDescriptions.join("; ")}`,
    },
  ];
}

/** Validate model text. Anything off-list or malformed is rejected, never repaired. */
export function parseProposal(raw: string): ProposalResult {
  let value: unknown;
  try {
    value = JSON.parse(raw.trim());
  } catch {
    return { ok: false, reason: "Model output was not JSON" };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, reason: "Model output was not a JSON object" };
  }
  const { merchant, category } = value as Record<string, unknown>;
  if (typeof merchant !== "string" || merchant.trim().length === 0 || merchant.length > 60) {
    return { ok: false, reason: "Merchant must be a short non-empty string" };
  }
  if (!CATEGORIES.includes(category as Category)) {
    return { ok: false, reason: `Category "${String(category)}" is not on the list` };
  }
  return { ok: true, proposal: { merchant: merchant.trim(), category: category as Category } };
}
