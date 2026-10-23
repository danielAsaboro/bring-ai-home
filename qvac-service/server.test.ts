import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createDeckServer, isAllowedOrigin, type Capabilities } from "./server";

let close: (() => void) | null = null;
afterEach(() => close?.());

async function start(capabilities: Capabilities) {
  const server = createDeckServer(capabilities);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("deck service", () => {
  it("reports capabilities and answers 503 while a model is missing", async () => {
    const base = await start({ retrieve: null });
    expect(await (await fetch(`${base}/health`)).json()).toEqual({ ok: true, capabilities: { retrieve: false } });
    const res = await post(`${base}/retrieve`, { query: "unattended kettles" });
    expect(res.status).toBe(503);
  });

  it("rejects bad requests and foreign origins", async () => {
    const base = await start({ retrieve: null });
    expect((await post(`${base}/retrieve`, { query: "" })).status).toBe(400);
    expect((await fetch(`${base}/health`, { headers: { origin: "https://example.com" } })).status).toBe(403);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("returns cited passages from the retriever (fixture retriever, not a model)", async () => {
    const passage = { id: "diary-study-notes#unattended-boiling", noteId: "diary-study-notes", noteTitle: "Kitchen diary study notes", section: "Unattended boiling", text: "In 9 of 12 homes…", score: 0.8 };
    const base = await start({ retrieve: async () => ({ passages: [passage], model: "fixture" }) });
    const body = await (await post(`${base}/retrieve`, { query: "unattended" })).json();
    expect(body).toMatchObject({ query: "unattended", model: "fixture", passages: [{ id: passage.id }] });
  });
});
