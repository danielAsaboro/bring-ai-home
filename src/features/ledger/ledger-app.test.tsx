import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cornerCafeOcrFixture } from "@/fixtures/corner-cafe-ocr.fixture";

import { LedgerApp } from "./ledger-app";
import type { ReceiptClient } from "./receipt-client";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Fixture OCR and hand-written model text. No live inference.
const client: ReceiptClient = {
  health: vi.fn(),
  readReceipt: async (input) => ({
    receiptId: "r1",
    sourceDigest: "8bc01b420180f725",
    ocrModel: "OCR_LATIN",
    ocrMs: null,
    blocks: input ? cornerCafeOcrFixture : [],
  }),
  propose: async () => ({
    model: "LLAMA_3_2_1B_INST_Q4_0",
    raw: '{"merchant":"Corner Cafe","category":"Eating out"}',
    result: { ok: true, proposal: { merchant: "Corner Cafe", category: "Eating out" } },
  }),
  similar: vi.fn(),
};

describe("Ledger review", () => {
  it("adds only the reviewed entry and recomputes totals in code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]))));
    render(<LedgerApp client={client} now={() => new Date("2026-03-14T12:00:00Z")} />);
    expect(screen.getByLabelText("Book total")).toHaveTextContent("160.04");

    await userEvent.click(screen.getByRole("button", { name: "Read sample receipt" }));
    await userEvent.click(await screen.findByRole("button", { name: "Propose merchant and category" }));
    await screen.findByText(/Proposal \(not applied\)/);
    expect(screen.getByLabelText("Book total")).toHaveTextContent("160.04");

    const amount = screen.getByLabelText("Amount");
    await userEvent.clear(amount);
    await userEvent.type(amount, "10.50");
    await userEvent.click(screen.getByRole("button", { name: "Accept into ledger" }));

    expect(screen.getByLabelText("Book total")).toHaveTextContent("170.54");
    expect(screen.getByText(/changed by reviewer: amountCents/)).toHaveTextContent("OCR total 10.53");
    expect(screen.getByRole("status")).toHaveTextContent("This draft has been decided.");
  });

  it("rejecting a draft leaves the totals alone", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]))));
    render(<LedgerApp client={client} />);

    await userEvent.click(screen.getByRole("button", { name: "Read sample receipt" }));
    await userEvent.click(await screen.findByRole("button", { name: "Reject draft" }));

    expect(screen.getByLabelText("Book total")).toHaveTextContent("160.04");
    expect(screen.getByText("No receipts accepted yet.")).toBeInTheDocument();
  });
});
