// @vitest-environment node
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createReceiptServer,
  unavailableReader,
  type ReceiptReader,
  type ServiceModels,
} from "./server.ts";

const servers: ReturnType<typeof createReceiptServer>[] = [];

async function start(reader: ReceiptReader, models: ServiceModels = {}) {
  const server = createReceiptServer(reader, models);
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

  it("validates model text before returning a proposal (hand-written model text)", async () => {
    const complete = vi.fn(async () => '{"merchant":"Corner Cafe","category":"Coffee"}');
    const url = await start(unavailableReader, {
      proposer: { modelState: () => ({ kind: "llm", id: "LLAMA_3_2_1B_INST_Q4_0", state: "ready" }), complete },
    });
    const response = await fetch(`${url}/v1/propose`, {
      method: "POST",
      body: JSON.stringify({ merchantText: "CORNER CAFE", lineDescriptions: ["Flat white"] }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.result).toEqual({ ok: false, reason: 'Category "Coffee" is not on the list' });
    expect(JSON.stringify(complete.mock.calls[0])).not.toMatch(/\d+\.\d{2}/);
  });

  it("embeds the book once and ranks matches in code (hand-made vectors)", async () => {
    const embed = vi.fn(async (texts: string[]) =>
      texts.map((t) => (t.includes("Coffee") || t.includes("Bakery") || t.includes("Cafe") ? [1, 0] : [0, 1])),
    );
    const url = await start(unavailableReader, {
      embedder: { modelState: () => ({ kind: "embeddings", id: "GTE_LARGE_FP16", state: "ready" }), embed },
    });
    const ask = () =>
      fetch(`${url}/v1/similar`, { method: "POST", body: JSON.stringify({ text: "Corner Cafe (Eating out)" }) });

    const body = await (await ask()).json();
    await ask();

    expect(body.matches).toEqual([
      { entryId: "e1", score: 1 },
      { entryId: "e4", score: 1 },
    ]);
    expect(embed).toHaveBeenCalledTimes(3); // book once, then one query per request
  });
});
