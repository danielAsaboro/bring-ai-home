import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cornerCafeOcrFixture } from "@/fixtures/corner-cafe-ocr.fixture";

import type { ReceiptClient } from "./receipt-client";
import { ReceiptInbox } from "./receipt-inbox";

function fakeClient(read: ReceiptClient["readReceipt"]): ReceiptClient {
  return { health: vi.fn(), readReceipt: read };
}

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
});
