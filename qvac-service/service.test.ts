import { describe, expect, it } from "vitest";

import { buildRecapDraft } from "./recap";
import { createService } from "./service";

const audioBase64 = Buffer.from("fixture-audio").toString("base64");

describe("local service boundary", () => {
  it("reports which capabilities are configured", async () => {
    const handle = createService({});
    const res = await handle("GET", "/health", undefined);
    expect(res).toEqual({
      status: 200,
      body: { ok: true, service: "circle-qvac", capabilities: { transcribe: false, extract: false } },
    });
  });

  it("answers 503 instead of inventing a transcript", async () => {
    const res = await createService({})("POST", "/recap/transcribe", { audioBase64, fileName: "a.wav" });
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ error: "not-configured" });
  });

  it("validates the request before calling the model", async () => {
    let called = false;
    const handle = createService({
      transcribe: async () => {
        called = true;
        throw new Error("unreachable");
      },
    });
    const res = await handle("POST", "/recap/transcribe", { fileName: "a.wav" });
    expect(res.status).toBe(400);
    expect(called).toBe(false);
  });

  it("passes decoded bytes to the injected transcriber", async () => {
    // FIXTURE transcriber: returns hand-written segments, not model output.
    const handle = createService({
      transcribe: async (audio, fileName) => {
        expect(Buffer.from(audio).toString()).toBe("fixture-audio");
        expect(fileName).toBe("a.wav");
        return buildRecapDraft([{ text: "fixture words", startMs: 0, endMs: 10 }], "FIXTURE");
      },
    });
    const res = await handle("POST", "/recap/transcribe", { audioBase64, fileName: "a.wav" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "proposed", transcript: "fixture words" });
  });

  it("turns model failures into 502", async () => {
    const res = await createService({
      transcribe: async () => {
        throw new Error("No speech was recognised in this recap");
      },
    })("POST", "/recap/transcribe", { audioBase64, fileName: "a.wav" });
    expect(res).toEqual({
      status: 502,
      body: { error: "model-failed", message: "No speech was recognised in this recap" },
    });
  });

  it("validates extract requests and forwards them", async () => {
    const handle = createService({
      // FIXTURE extractor: echoes its input, no model involved.
      extract: async ({ people, today }) => ({ status: "proposed", model: `FIXTURE ${today}`, proposals: [], rejected: people.map((item) => ({ item, reason: "fixture" })) }),
    });
    const bad = await handle("POST", "/recap/extract", { transcript: "hi", people: [], today: "2026-10-23" });
    expect(bad.status).toBe(400);
    const ok = await handle("POST", "/recap/extract", {
      transcript: "hi",
      people: [{ id: "dev-raman", name: "Dev Raman" }],
      today: "2026-10-23",
    });
    expect(ok).toMatchObject({ status: 200, body: { model: "FIXTURE 2026-10-23" } });
  });
});
