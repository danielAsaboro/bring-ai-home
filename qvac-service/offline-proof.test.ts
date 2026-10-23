import { describe, expect, it } from "vitest";

import { assertWarmedCache, classifyProbe } from "./offline-proof";

// Fixture file listings written by hand. No model files are involved.
describe("offline proof", () => {
  it("accepts a cache that holds both models", () => {
    expect(() =>
      assertWarmedCache([
        { name: "abc_gte-large_fp16.gguf", bytes: 10 },
        { name: "def_Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 10 },
      ]),
    ).not.toThrow();
  });

  it("treats an empty, half-downloaded file as missing", () => {
    expect(() =>
      assertWarmedCache([
        { name: "abc_gte-large_fp16.gguf", bytes: 0 },
        { name: "def_Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 10 },
      ]),
    ).toThrow("incomplete (embeddings)");
  });

  it("does not count a DNS failure as proof of network denial", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "ENOTFOUND" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });
});
