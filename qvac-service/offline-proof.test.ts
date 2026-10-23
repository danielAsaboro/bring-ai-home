import { describe, expect, it } from "vitest";

import { assertWarmedCache, classifyProbe } from "./offline-proof";

// File names below are fixtures shaped like cache entries, not a real cache listing.
describe("offline proof", () => {
  it("refuses to start when a model is missing or empty", () => {
    expect(() =>
      assertWarmedCache([
        { name: "SmolVLM2-500M-Video-Instruct-Q8_0.gguf", bytes: 10 },
        { name: "mmproj-SmolVLM2-500M-Video-Instruct-Q8_0.gguf", bytes: 10 },
        { name: "Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 0 },
      ]),
    ).toThrow("incomplete (details, embeddings)");
  });

  it("accepts a fully warmed cache", () => {
    expect(() =>
      assertWarmedCache([
        { name: "SmolVLM2-500M-Video-Instruct-Q8_0.gguf", bytes: 10 },
        { name: "mmproj-SmolVLM2-500M-Video-Instruct-Q8_0.gguf", bytes: 10 },
        { name: "Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 10 },
        { name: "gte-large_fp16.gguf", bytes: 10 },
      ]),
    ).not.toThrow();
  });

  it("only counts a refused connection as network denial", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "ENOTFOUND" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });
});
