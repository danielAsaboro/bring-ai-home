import { describe, expect, it } from "vitest";

import { WEEKLY_REPORT_NARRATION_FIXTURE } from "./fixtures/narration.fixture";
import { toNarration } from "./narration";
import { transcribeRecording } from "./service-client";

const file = new File([new Uint8Array([82, 73, 70, 70])], "narration.wav", { type: "audio/wav" });

describe("service client", () => {
  it("says the service is unreachable instead of inventing a transcript", async () => {
    const result = await transcribeRecording(file, async () => {
      throw new TypeError("fetch failed");
    });
    expect(result).toMatchObject({ ok: false, code: "service_unreachable" });
  });

  it("passes typed service errors through and validates successful bodies", async () => {
    const err = await transcribeRecording(file, async () =>
      Response.json({ error: { code: "no_speech", message: "No speech" } }, { status: 422 }),
    );
    expect(err).toEqual({ ok: false, code: "no_speech", message: "No speech" });

    const malformed = await transcribeRecording(file, async () => Response.json({ narration: { transcript: 4 } }));
    expect(malformed).toMatchObject({ ok: false, code: "invalid_response" });

    const good = await transcribeRecording(file, async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({ fileName: "narration.wav", audioBase64: "UklGRg==" });
      return Response.json({
        sourceDigest: "f".repeat(64),
        model: "WHISPER_TINY",
        transcribeMs: 1,
        narration: toNarration(WEEKLY_REPORT_NARRATION_FIXTURE),
      });
    });
    expect(good.ok).toBe(true);
  });
});
