// @vitest-environment node
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createReceiptServer, unavailableReader, type ReceiptReader } from "./server.ts";

const servers: ReturnType<typeof createReceiptServer>[] = [];

async function start(reader: ReceiptReader) {
  const server = createReceiptServer(reader);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

const validBody = JSON.stringify({
  receiptId: "r1",
  fileName: "receipt.png",
  pngBase64: Buffer.from("png bytes").toString("base64"),
});

describe("local receipt service", () => {
  it("reports process health separately from model readiness", async () => {
    const url = await start(unavailableReader);
    const response = await fetch(`${url}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      service: "ready",
      models: [{ kind: "ocr", id: "not-configured", state: "not_loaded" }],
    });
  });

  it("returns typed unavailability instead of inventing OCR", async () => {
    const url = await start(unavailableReader);
    const response = await fetch(`${url}/v1/read-receipt`, { method: "POST", body: validBody });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: { code: "ocr_unavailable", message: "OCR is not connected yet" },
    });
  });

  it("rejects invalid requests before calling the reader", async () => {
    const read = vi.fn();
    const url = await start({ ...unavailableReader, read });
    const response = await fetch(`${url}/v1/read-receipt`, {
      method: "POST",
      body: JSON.stringify({ receiptId: "r1" }),
    });

    expect(response.status).toBe(400);
    expect(read).not.toHaveBeenCalled();
  });

  it("rejects non-loopback browser origins", async () => {
    const url = await start(unavailableReader);
    const response = await fetch(`${url}/health`, {
      headers: { origin: "https://example.com" },
    });

    expect(response.status).toBe(403);
  });
});
