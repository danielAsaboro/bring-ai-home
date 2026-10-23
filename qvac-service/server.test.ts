import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { WEEKLY_REPORT_NARRATION_FIXTURE } from "../src/features/replay/fixtures/narration.fixture";
import { CONDITIONS_OUTPUT_FIXTURE, STEPS_OUTPUT_FIXTURE } from "../src/features/replay/fixtures/model-output.fixture";
import { createReplayServer, type ServiceModels } from "./server";

const closers: (() => void)[] = [];
afterEach(() => closers.splice(0).forEach((c) => c()));

async function start(models: ServiceModels) {
  const server = createReplayServer(models);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  closers.push(() => server.close());
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

// FIXTURE transcriber: returns hand-written segments. Not a model.
const fixtureTranscriber = {
  modelState: () => ({ kind: "transcription", id: "WHISPER_TINY", state: "ready" as const }),
  transcribe: async () => WEEKLY_REPORT_NARRATION_FIXTURE,
};

const wav = { fileName: "narration.wav", audioBase64: Buffer.from("RIFF-fixture").toString("base64") };

// FIXTURE viewer: echoes a fixed sentence and checks it received a real file path. Not a model.
const fixtureViewer = {
  modelState: () => ({ kind: "multimodal", id: "SMOLVLM2_500M_MULTIMODAL_Q8_0", state: "ready" as const }),
  describe: async (imagePath: string) => {
    expect(imagePath).toMatch(/screen\.png$/);
    return "Assistant: The Harbor Operations page with the Export menu open.";
  },
};

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

  it("reads a screenshot through the vision door and validates the note", async () => {
    const url = await start({ viewer: fixtureViewer });
    const ok = await fetch(`${url}/v1/read-screenshot`, {
      method: "POST",
      body: JSON.stringify({ fileName: "harbor.png", imageBase64: Buffer.from("png").toString("base64") }),
    });
    expect((await ok.json()).note).toEqual({ text: "The Harbor Operations page with the Export menu open.", truncated: false });
    const pdf = await fetch(`${url}/v1/read-screenshot`, {
      method: "POST",
      body: JSON.stringify({ fileName: "harbor.pdf", imageBase64: "eA==" }),
    });
    expect(pdf.status).toBe(400);
  });

  it("reports an empty vision answer as empty_note, not as a screen note", async () => {
    const url = await start({ viewer: { ...fixtureViewer, describe: async () => "   " } });
    const res = await fetch(`${url}/v1/read-screenshot`, {
      method: "POST",
      body: JSON.stringify({ fileName: "harbor.png", imageBase64: "eA==" }),
    });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("empty_note");
  });

  it("proposes steps through the drafter door and gates them against the transcript", async () => {
    const seen: string[] = [];
    const drafter = {
      modelState: () => ({ kind: "llm", id: "LLAMA_3_2_1B_INST_Q4_0", state: "ready" as const }),
      complete: async (_history: unknown, schema: { name: string }) => {
        seen.push(schema.name);
        return STEPS_OUTPUT_FIXTURE; // FIXTURE string, not a model answer
      },
    };
    const url = await start({ drafter });
    const transcript = WEEKLY_REPORT_NARRATION_FIXTURE.map((s) => s.text).join(" ");
    const res = await fetch(`${url}/v1/propose-steps`, { method: "POST", body: JSON.stringify({ transcript, screenNotes: [] }) });
    const body = await res.json();
    expect(seen).toEqual(["steps"]);
    expect(body.result.proposals).toHaveLength(4);
    expect(body.result.rejected).toHaveLength(2);

    const prose = await start({ drafter: { ...drafter, complete: async () => "Here you go!" } });
    const bad = await fetch(`${prose}/v1/propose-steps`, { method: "POST", body: JSON.stringify({ transcript }) });
    expect(bad.status).toBe(422);
    expect((await bad.json()).error.code).toBe("unusable_output");
  });

  it("proposes conditions with their own schema and gate", async () => {
    const drafter = {
      modelState: () => ({ kind: "llm", id: "LLAMA_3_2_1B_INST_Q4_0", state: "ready" as const }),
      complete: async (_h: unknown, schema: { name: string }) => {
        expect(schema.name).toBe("conditions");
        return CONDITIONS_OUTPUT_FIXTURE; // FIXTURE string, not a model answer
      },
    };
    const url = await start({ drafter });
    const transcript = WEEKLY_REPORT_NARRATION_FIXTURE.map((s) => s.text).join(" ");
    const res = await fetch(`${url}/v1/propose-conditions`, { method: "POST", body: JSON.stringify({ transcript }) });
    const body = await res.json();
    expect(body.result.parameters.map((p: { name: string }) => p.name)).toEqual(["week_start"]);
    expect(body.result.rejected).toHaveLength(2);
  });
});
