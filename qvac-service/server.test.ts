import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { WEEKLY_REPORT_NARRATION_FIXTURE } from "../src/features/replay/fixtures/narration.fixture";
import { createReplayServer, type ServiceModels } from "./server";

let close: (() => void) | undefined;
afterEach(() => close?.());

async function start(models: ServiceModels) {
  const server = createReplayServer(models);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

// FIXTURE transcriber: returns hand-written segments. Not a model.
const fixtureTranscriber = {
  modelState: () => ({ kind: "transcription", id: "WHISPER_TINY", state: "ready" as const }),
  transcribe: async () => WEEKLY_REPORT_NARRATION_FIXTURE,
};

const wav = { fileName: "narration.wav", audioBase64: Buffer.from("RIFF-fixture").toString("base64") };

describe("replay QVAC service boundary", () => {
  it("reports health and model state separately", async () => {
    const url = await start({ transcriber: fixtureTranscriber });
    const res = await fetch(`${url}/health`);
    expect(await res.json()).toEqual({
      service: "ready",
      models: [{ kind: "transcription", id: "WHISPER_TINY", state: "ready" }],
    });
  });

  it("transcribes through the injected door and digests the received bytes", async () => {
    const url = await start({ transcriber: fixtureTranscriber });
    const res = await fetch(`${url}/v1/transcribe`, { method: "POST", body: JSON.stringify(wav) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.sourceDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(body.narration.segments).toHaveLength(5);
  });

  it("rejects bad requests, foreign origins, and silent recordings with typed errors", async () => {
    const silent = { ...fixtureTranscriber, transcribe: async () => [{ text: "[BLANK_AUDIO]", startMs: 0, endMs: 1 }] };
    const url = await start({ transcriber: silent });
    const bad = await fetch(`${url}/v1/transcribe`, { method: "POST", body: JSON.stringify({ fileName: "a.mp3", audioBase64: "eA==" }) });
    expect(bad.status).toBe(400);
    const foreign = await fetch(`${url}/health`, { headers: { origin: "https://example.com" } });
    expect(foreign.status).toBe(403);
    const quiet = await fetch(`${url}/v1/transcribe`, { method: "POST", body: JSON.stringify(wav) });
    expect(quiet.status).toBe(422);
    expect((await quiet.json()).error.code).toBe("no_speech");
  });

  it("turns a model crash into model_failed and leaves unknown routes at 404", async () => {
    const broken = { ...fixtureTranscriber, transcribe: async () => Promise.reject(new Error("native runtime crashed")) };
    const url = await start({ transcriber: broken });
    const res = await fetch(`${url}/v1/transcribe`, { method: "POST", body: JSON.stringify(wav) });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toEqual({ code: "model_failed", message: "native runtime crashed" });
    expect((await fetch(`${url}/v1/propose-steps`, { method: "POST", body: "{}" })).status).toBe(404);
  });
});
