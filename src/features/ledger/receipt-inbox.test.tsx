import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cornerCafeOcrFixture } from "@/fixtures/corner-cafe-ocr.fixture";

import type { ReceiptClient } from "./receipt-client";
import { ReceiptInbox } from "./receipt-inbox";

function fakeClient(
  read: ReceiptClient["readReceipt"],
  propose: ReceiptClient["propose"] = vi.fn(),
  similar: ReceiptClient["similar"] = vi.fn(),
): ReceiptClient {
  return { health: vi.fn(), readReceipt: read, propose, similar };
}

const readFixture: ReceiptClient["readReceipt"] = async (input) => ({
  receiptId: input.receiptId,
  sourceDigest: "8bc01b420180f725",
  ocrModel: "OCR_LATIN",
  ocrMs: null,
  blocks: cornerCafeOcrFixture,
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("receipt pocket", () => {
  it("shows a draft with provenance from (fixture) OCR blocks", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))));
    const client = fakeClient(async (input) => ({
      receiptId: input.receiptId,
      sourceDigest: "8bc01b420180f725",
      ocrModel: "OCR_LATIN",
      ocrMs: null,
      blocks: cornerCafeOcrFixture,
    }));
    render(<ReceiptInbox client={client} />);

    await userEvent.click(screen.getByRole("button", { name: "Read sample receipt" }));

    const draft = await screen.findByRole("article", { name: "Draft transaction" });
    expect(draft).toHaveTextContent("Draft transaction (not in the ledger)");
    expect(draft).toHaveTextContent("CORNER CAFE");
    expect(draft).toHaveTextContent("10.53");
    expect(draft).toHaveTextContent("subtotal + tax equals total");
    expect(draft).toHaveTextContent("“Croissamt 3.25” · confidence 0.62");
  });

  it("shows the service error instead of a fake draft", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]))));
    const client = fakeClient(async () => {
      throw new Error("OCR is not connected yet");
    });
    render(<ReceiptInbox client={client} />);

    await userEvent.click(screen.getByRole("button", { name: "Read sample receipt" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("OCR is not connected yet");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("shows a validated proposal without applying it (hand-written model text)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]))));
    const propose = vi.fn(async () => ({
      model: "LLAMA_3_2_1B_INST_Q4_0",
      raw: '{"merchant":"Corner Cafe","category":"Eating out"}',
      result: { ok: true as const, proposal: { merchant: "Corner Cafe", category: "Eating out" } },
    }));
    render(<ReceiptInbox client={fakeClient(readFixture, propose)} />);

    await userEvent.click(screen.getByRole("button", { name: "Read sample receipt" }));
    await userEvent.click(await screen.findByRole("button", { name: "Propose merchant and category" }));

    expect(propose).toHaveBeenCalledWith({
      merchantText: "CORNER CAFE",
      lineDescriptions: ["Flat white", "Croissamt", "Sparkling water"],
    });
    expect(await screen.findByText(/Proposal \(not applied\)/)).toHaveTextContent("Corner Cafe · Eating out");
  });

  it("shows a rejected proposal with its raw text", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]))));
    const propose = vi.fn(async () => ({
      model: "LLAMA_3_2_1B_INST_Q4_0",
      raw: '{"merchant":"Corner Cafe","category":"Coffee"}',
      result: { ok: false as const, reason: 'Category "Coffee" is not on the list' },
    }));
    render(<ReceiptInbox client={fakeClient(readFixture, propose)} />);

    await userEvent.click(screen.getByRole("button", { name: "Read sample receipt" }));
    await userEvent.click(await screen.findByRole("button", { name: "Propose merchant and category" }));

    expect(await screen.findByText(/Proposal rejected/)).toHaveTextContent("not on the list");
  });

  it("lists similar past entries from the sample book (hand-written scores)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1]))));
    const similar = vi.fn(async () => ({
      model: "GTE_LARGE_FP16",
      matches: [{ entryId: "e4", score: 0.83 }],
    }));
    render(<ReceiptInbox client={fakeClient(readFixture, vi.fn(), similar)} />);

    await userEvent.click(screen.getByRole("button", { name: "Read sample receipt" }));
    await userEvent.click(await screen.findByRole("button", { name: "Find similar past entries" }));

    expect(similar).toHaveBeenCalledWith({ text: "CORNER CAFE" });
    expect(await screen.findByText(/Bean There Coffee/)).toHaveTextContent("similarity 0.830");
  });
});
