import { describe, expect, it } from "vitest";

import { assertWarmedCache, classifyProbe } from "./offline-proof";

describe("offline proof", () => {
  it("rejects a cache with 0-byte files left by a stalled download", () => {
    // These names match the 0-byte files a blocked download left in our build container.
    expect(() =>
      assertWarmedCache([
        { name: "1bd09b23f28caa7e_latin_g2.gguf", bytes: 0 },
        { name: "bb5d57baeb6ae9e7_craft_mlt_25k.gguf", bytes: 0 },
      ]),
    ).toThrow("label OCR recogniser, label OCR detector, embeddings");
  });

  it("accepts a warmed cache", () => {
    expect(() =>
      assertWarmedCache([
        { name: "a_latin_g2.gguf", bytes: 10 },
        { name: "b_craft_mlt_25k.gguf", bytes: 10 },
        { name: "gte-large_fp16.gguf", bytes: 10 },
      ]),
    ).not.toThrow();
  });

  it("only counts a refused connection as denied", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "EAI_AGAIN" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "ENETUNREACH" })).toBe("network-denied");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });
});
