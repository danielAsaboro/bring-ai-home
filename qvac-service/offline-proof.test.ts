import { describe, expect, it } from "vitest";

import { assertWarmedCache, classifyProbe } from "./offline-proof";

// Hand-written file listings. No model files are involved.
describe("offline proof", () => {
  const warm = [
    { name: "a_latin_g2.gguf", bytes: 10 },
    { name: "b_Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 10 },
    { name: "c_gte-large_fp16.gguf", bytes: 10 },
  ];

  it("accepts a cache that holds all three models", () => {
    expect(() => assertWarmedCache(warm)).not.toThrow();
  });

  it("treats an empty, half-downloaded file as missing", () => {
    const partial = warm.map((f) => (f.name.includes("gte") ? { ...f, bytes: 0 } : f));
    expect(() => assertWarmedCache(partial)).toThrow("incomplete (embeddings)");
  });

  it("does not count a DNS failure as proof of network denial", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "ENOTFOUND" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });
});
