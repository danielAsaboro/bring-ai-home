import { describe, expect, it, vi } from "vitest";

import { createReceiptClient } from "./receipt-client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("receipt client", () => {
  it("surfaces the service's typed error message", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ error: { code: "ocr_unavailable", message: "OCR is not connected yet" } }, 503),
    );
    const client = createReceiptClient({ baseUrl: "http://127.0.0.1:1", fetchImpl });

    await expect(
      client.readReceipt({ receiptId: "r1", fileName: "a.png", pngBytes: new ArrayBuffer(4) }),
    ).rejects.toThrow("OCR is not connected yet");
  });

  it("rejects a malformed success response", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ receiptId: "r1", blocks: "nope" }));
    const client = createReceiptClient({ baseUrl: "http://127.0.0.1:1", fetchImpl });

    await expect(
      client.readReceipt({ receiptId: "r1", fileName: "a.png", pngBytes: new ArrayBuffer(4) }),
    ).rejects.toThrow("Response is missing receipt identity");
  });

  it("sends the image as base64 to the loopback endpoint", async () => {
    const fetchImpl = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({
        receiptId: "r1",
        sourceDigest: "d",
        ocrModel: "OCR_LATIN",
        ocrMs: 5,
        blocks: [{ text: "TOTAL", bbox: [0, 0, 1, 1], confidence: 0.9 }],
      }),
    );
    const client = createReceiptClient({ baseUrl: "http://127.0.0.1:4318", fetchImpl });
    const result = await client.readReceipt({
      receiptId: "r1",
      fileName: "a.png",
      pngBytes: new TextEncoder().encode("hi").buffer as ArrayBuffer,
    });

    expect(fetchImpl.mock.calls[0][0]).toBe("http://127.0.0.1:4318/v1/read-receipt");
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body)).pngBase64).toBe("aGk=");
    expect(result.blocks).toHaveLength(1);
  });
});
