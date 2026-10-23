import { describe, expect, it } from "vitest";

import { assertWarmedCache, classifyProbe } from "./offline-proof";

const warmed = [
  { name: "a1_ggml-tiny.bin", bytes: 77_000_000 },
  { name: "b2_SmolVLM2-500M-Video-Instruct-Q8_0.gguf", bytes: 400_000_000 },
  { name: "c3_mmproj-SmolVLM2-500M-Video-Instruct-Q8_0.gguf", bytes: 100_000_000 },
  { name: "d4_Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 700_000_000 },
  { name: "e5_gte-large_fp16.gguf", bytes: 600_000_000 },
];

describe("offline proof checks (file listings are fixtures)", () => {
  it("accepts a cache that holds every pinned model", () => {
    expect(() => assertWarmedCache(warmed)).not.toThrow();
  });

  it("does not let the projection file stand in for the vision model", () => {
    const noVision = warmed.filter((f) => !f.name.startsWith("b2_"));
    expect(() => assertWarmedCache(noVision)).toThrow("(vision)");
  });

  it("names every missing or empty model", () => {
    const partial = [{ ...warmed[0], bytes: 0 }, warmed[3]];
    expect(() => assertWarmedCache(partial)).toThrow("transcription, vision, projection, embeddings");
  });

  it("only counts a refused or unreachable connection as denial", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "EAI_AGAIN" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "ETIMEDOUT" })).toBe("inconclusive");
    expect(classifyProbe({ ok: false, code: "ENETUNREACH" })).toBe("network-denied");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });
});
