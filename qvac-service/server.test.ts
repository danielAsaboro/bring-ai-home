import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { createHomebookServer, isAllowedOrigin, type Capabilities } from "./server";

// Fixture OCR reader. It returns hand-written blocks, not model output.
const fixtureLabel: Capabilities["label"] = async () => ({
  model: "fixture-ocr",
  blocks: [
    { text: "MODEL NO.", bbox: [50, 166, 240, 194], confidence: 0.98 },
    { text: "AT-50G", bbox: [330, 167, 436, 193], confidence: 0.93 },
  ],
});

// Fixture describer. Its reply is hand-written, not model output.
const fixtureIdentify: Capabilities["identify"] = async () => ({
  model: "fixture-vlm",
  text: "category: water heater; name: gas water heater",
});

let close: (() => void) | null = null;
async function start(capabilities: Capabilities) {
  const server = createHomebookServer(capabilities);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
afterEach(() => close?.());

const png = { fileName: "label.png", mimeType: "image/png", imageBase64: Buffer.from("png").toString("base64") };
const post = (url: string, body: unknown, origin = "http://localhost:3000") =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });

describe("Homebook local service", () => {
  it("accepts only loopback browser origins", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isAllowedOrigin("https://example.com")).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(true);
  });

  it("turns OCR blocks into proposed label facts", async () => {
    const base = await start({ label: fixtureLabel, identify: fixtureIdentify, ask: null, summary: null });
    const res = await post(`${base}/label`, png);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("proposed-label-facts");
    expect(body.facts).toEqual([{ field: "model", value: "AT-50G", sourceText: "MODEL NO. AT-50G", confidence: 0.93 }]);
  });

  it("validates a photo identification against Homebook's categories", async () => {
    const base = await start({ label: fixtureLabel, identify: fixtureIdentify, ask: null, summary: null });
    const body = await (await post(`${base}/identify`, png)).json();
    expect(body.identity).toMatchObject({ kind: "proposed-identity", category: "water-heater", name: "Gas water heater" });
  });

  it("passes a question to the answerer and returns its citations", async () => {
    // Fixture answerer: a hand-written reply, not model output.
    const ask: Capabilities["ask"] = async () => ({
      status: "answered",
      answer: "Wait five minutes before relighting [1].",
      citations: [{ n: 1, docId: "doc-wh-manual", title: "Aquaterra AT-50G owner's manual", file: "aquaterra-at50g-manual.txt", page: 4 }],
      model: "fixture-llm",
    });
    const base = await start({ label: null, identify: null, ask, summary: null });
    const body = await (await post(`${base}/ask`, { question: "How do I relight the pilot?" })).json();
    expect(body.citations[0].page).toBe(4);
    expect((await post(`${base}/ask`, { question: " " })).status).toBe(400);
  });

  it("returns a summary draft with unsupported dates flagged", async () => {
    // Fixture drafter: hand-written text, not model output.
    const summary: Capabilities["summary"] = async () => ({ model: "fixture-llm", text: "Flushed 2025-03-10 and 2019-01-01." });
    const base = await start({ label: null, identify: null, ask: null, summary });
    const res = await post(`${base}/summary`, {
      asset: { id: "water-heater", name: "Water heater", installedOn: "2021-03-14" },
      history: [{ date: "2025-03-10", summary: "Flushed tank." }],
      tasks: [],
    });
    expect(await res.json()).toMatchObject({ kind: "proposed-summary", unsupportedDates: ["2019-01-01"] });
  });

  it("answers 503 when the model is not loaded, and 400 for a bad image", async () => {
    const base = await start({ label: null, identify: null, ask: null, summary: null });
    expect((await post(`${base}/label`, png)).status).toBe(503);
    expect((await post(`${base}/label`, { ...png, mimeType: "image/gif" })).status).toBe(400);
  });

  it("refuses a foreign origin before reading the request", async () => {
    const base = await start({ label: fixtureLabel, identify: fixtureIdentify, ask: null, summary: null });
    expect((await post(`${base}/label`, png, "https://example.com")).status).toBe(403);
  });
});
