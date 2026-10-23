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
    const base = await start({ retrieve: null, propose: null, embed: null });
    expect(await (await fetch(`${base}/health`)).json()).toEqual({ ok: true, capabilities: { retrieve: false, propose: false, embed: false } });
    const res = await post(`${base}/retrieve`, { query: "unattended kettles" });
    expect(res.status).toBe(503);
  });

  it("rejects bad requests and foreign origins", async () => {
    const base = await start({ retrieve: null, propose: null, embed: null });
    expect((await post(`${base}/retrieve`, { query: "" })).status).toBe(400);
    expect((await fetch(`${base}/health`, { headers: { origin: "https://example.com" } })).status).toBe(403);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("returns cited passages from the retriever (fixture retriever, not a model)", async () => {
    const passage = { id: "diary-study-notes#unattended-boiling", noteId: "diary-study-notes", noteTitle: "Kitchen diary study notes", section: "Unattended boiling", text: "In 9 of 12 homes…", score: 0.8 };
    const base = await start({ retrieve: async () => ({ passages: [passage], model: "fixture" }), propose: null, embed: null });
    const body = await (await post(`${base}/retrieve`, { query: "unattended" })).json();
    expect(body).toMatchObject({ query: "unattended", model: "fixture", passages: [{ id: passage.id }] });
  });

  it("validates proposals before they leave the service (fixture proposer text, not a model)", async () => {
    const passage = { id: "diary-study-notes#unattended-boiling", noteId: "diary-study-notes", noteTitle: "Kitchen diary study notes", section: "Unattended boiling", text: "In 9 of 12 homes…", score: 0.8 };
    const text = JSON.stringify({ cards: [
      { title: "Kettles boil alone", body: "Nobody watched the kettle in 9 of 12 homes.", citations: [passage.id] },
      { title: "Invented stat", body: "90% of people agree.", citations: ["nowhere#1"] },
    ] });
    const base = await start({ retrieve: null, propose: async () => ({ text, passages: [passage], model: "fixture" }), embed: null });
    const body = await (await post(`${base}/propose`, { topic: "why now", audience: "buyers" })).json();
    expect(body.proposals.map((p: { title: string }) => p.title)).toEqual(["Kettles boil alone"]);
    expect(body.dropped).toEqual([{ title: "Invented stat", reason: "cites no retrieved note section" }]);
    expect((await post(`${base}/propose`, { topic: "" })).status).toBe(400);
  });

  it("embeds a bounded batch (fixture embedder, not a model)", async () => {
    const base = await start({ retrieve: null, propose: null, embed: async (texts) => ({ vectors: texts.map((t) => [t.length, 1]), model: "fixture" }) });
    expect(await (await post(`${base}/embed`, { texts: ["ab", "abc"] })).json()).toEqual({ model: "fixture", vectors: [[2, 1], [3, 1]] });
    expect((await post(`${base}/embed`, { texts: [] })).status).toBe(400);
  });
});
