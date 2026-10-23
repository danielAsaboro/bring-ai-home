import { describe, expect, it } from "vitest";

import { assertWarmedCache, classifyProbe } from "./offline-proof";

describe("offline proof guards", () => {
  it("refuses an empty or zero-byte cache", () => {
    // A blocked download can leave a zero-byte model file behind. That is not a warm cache.
    expect(() => assertWarmedCache([{ name: "x_Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 0 }])).toThrow(/proposals, embeddings/);
    expect(() =>
      assertWarmedCache([
        { name: "x_Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 10 },
        { name: "y_gte-large_fp16.gguf", bytes: 10 },
      ]),
    ).not.toThrow();
  });

  it("does not mistake a DNS failure for process network denial", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "ENOTFOUND" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });
});
